import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  IsNull,
  LessThan,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { Document } from '../documents/entities/document.entity';
import { Job } from '../jobs/entities/job.entity';
import { TimelineEvent } from '../timeline/entities/timeline-event.entity';
import { User } from '../users/entities/user.entity';
import { LocalAdvisoryAiProvider } from './ai-provider';
import {
  AiSearchDto,
  CorrectExtractionDto,
  ExtractCvDto,
  FeedbackDto,
  MatchJobDto,
  MonitoringQueryDto,
  SuggestQuestionsDto,
} from './dto/ai.dto';
import { AiFeedback } from './entities/ai-feedback.entity';
import {
  AiGeneration,
  AiGenerationType,
} from './entities/ai-generation.entity';
import { CvExtraction } from './entities/cv-extraction.entity';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(AiGeneration)
    private generations: Repository<AiGeneration>,
    @InjectRepository(AiFeedback) private feedback: Repository<AiFeedback>,
    @InjectRepository(CvExtraction)
    private extractions: Repository<CvExtraction>,
    @InjectRepository(Candidate) private candidates: Repository<Candidate>,
    @InjectRepository(Job) private jobs: Repository<Job>,
    @InjectRepository(Application)
    private applications: Repository<Application>,
    @InjectRepository(Document) private documents: Repository<Document>,
    @InjectRepository(TimelineEvent)
    private timeline: Repository<TimelineEvent>,
    private provider: LocalAdvisoryAiProvider,
  ) {}

  private async record(
    type: AiGenerationType,
    promptVersion: string,
    input: Record<string, unknown>,
    output: Record<string, unknown>,
    actor: User,
    started: number,
    protectedInputsExcluded = false,
  ) {
    const row = await this.generations.save(
      this.generations.create({
        type,
        promptVersion,
        input,
        output,
        requestedBy: actor,
        model: this.provider.model,
        latencyMs: Date.now() - started,
        inputTokens: this.provider.tokens(input),
        outputTokens: this.provider.tokens(output),
        costUsd: '0.000000',
        advisory: true,
        protectedInputsExcluded,
      }),
    );
    return { generationId: row.id, advisory: true, ...output };
  }

  async extractCv(dto: ExtractCvDto, actor: User) {
    const started = Date.now();
    const candidate = await this.candidates.findOneBy({ id: dto.candidateId });
    if (!candidate)
      throw new NotFoundException(
        `Candidate with ID ${dto.candidateId} not found`,
      );
    let document: Document | null = null;
    if (dto.documentId) {
      document = await this.documents.findOne({
        where: { id: dto.documentId },
        relations: { candidate: true, application: { candidate: true } },
      });
      if (!document)
        throw new NotFoundException(
          `Document with ID ${dto.documentId} not found`,
        );
      const linkedId =
        document.candidate?.id ?? document.application?.candidate?.id;
      if (linkedId !== candidate.id)
        throw new BadRequestException(
          'Document does not belong to the candidate',
        );
    }
    const extracted = this.provider.extractCv(dto.text);
    const generation = await this.generations.save(
      this.generations.create({
        type: AiGenerationType.CV_EXTRACTION,
        promptVersion: 'cv-extract-v1',
        input: {
          candidateId: candidate.id,
          documentId: document?.id ?? null,
          textLength: dto.text.length,
        },
        output: extracted,
        requestedBy: actor,
        model: this.provider.model,
        latencyMs: Date.now() - started,
        inputTokens: this.provider.tokens(dto.text),
        outputTokens: this.provider.tokens(extracted),
        costUsd: '0.000000',
        advisory: true,
        protectedInputsExcluded: false,
      }),
    );
    const extraction = await this.extractions.save(
      this.extractions.create({ candidate, document, generation, extracted }),
    );
    return { ...extraction, effective: extracted, advisory: true };
  }

  async correctExtraction(id: string, dto: CorrectExtractionDto, actor: User) {
    const row = await this.extractions.findOne({
      where: { id },
      relations: { generation: true },
    });
    if (!row) throw new NotFoundException(`CV extraction ${id} not found`);
    row.corrected = dto.corrected;
    row.correctedBy = actor;
    row.correctedAt = new Date();
    const saved = await this.extractions.save(row);
    return { ...saved, effective: dto.corrected, advisory: true };
  }

  private candidateText(candidate: Candidate) {
    return [
      candidate.firstName,
      candidate.lastName,
      candidate.skills?.join(' '),
      candidate.tags?.join(' '),
      candidate.source,
    ]
      .filter(Boolean)
      .join(' ');
  }

  async search(dto: AiSearchDto, actor: User) {
    const started = Date.now();
    const candidates = await this.candidates.find({
      where: { archivedAt: IsNull() },
      take: 1000,
    });
    const results = candidates
      .map((candidate) => {
        const similarity = this.provider.similarity(
          dto.query,
          this.candidateText(candidate),
        );
        return {
          candidateId: candidate.id,
          name: `${candidate.firstName} ${candidate.lastName}`,
          score: similarity.score,
          evidence: {
            matchedTerms: similarity.terms,
            skills: candidate.skills ?? [],
            tags: candidate.tags ?? [],
          },
        };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.candidateId - b.candidateId)
      .slice(0, dto.limit);
    return this.record(
      AiGenerationType.SEARCH,
      'hybrid-search-v1',
      { query: dto.query, limit: dto.limit },
      { results },
      actor,
      started,
      true,
    );
  }

  async match(dto: MatchJobDto, actor: User) {
    const started = Date.now();
    const job = await this.jobs.findOneBy({ id: dto.jobId });
    if (!job) throw new NotFoundException(`Job with ID ${dto.jobId} not found`);
    const candidates = dto.candidateId
      ? await this.candidates.find({ where: { id: dto.candidateId } })
      : await this.candidates.find({
          where: { archivedAt: IsNull() },
          take: 1000,
        });
    if (dto.candidateId && !candidates.length)
      throw new NotFoundException(
        `Candidate with ID ${dto.candidateId} not found`,
      );
    const requirements = `${job.title} ${job.description} ${job.department ?? ''}`;
    const suggestions = candidates
      .map((candidate) => {
        // Deliberate allow-list: no name, email, phone, age, gender, or other protected/proxy identity fields enter ranking.
        const rankingInput = (candidate.skills ?? []).join(' ');
        const similarity = this.provider.similarity(requirements, rankingInput);
        return {
          candidateId: candidate.id,
          score: similarity.score,
          evidence: {
            matchedSkills: similarity.terms,
            candidateSkills: candidate.skills ?? [],
            jobTerms:
              requirements
                .toLowerCase()
                .match(/[a-z0-9+#.]{2,}/g)
                ?.slice(0, 30) ?? [],
          },
          caveat:
            'Advisory suggestion for human review; it is not a hiring decision.',
        };
      })
      .sort((a, b) => b.score - a.score || a.candidateId - b.candidateId)
      .slice(0, dto.limit);
    return this.record(
      AiGenerationType.JOB_MATCH,
      'job-match-v1',
      {
        jobId: job.id,
        candidateIds: candidates.map((c) => c.id),
        rankingFields: [
          'candidate.skills',
          'job.title',
          'job.description',
          'job.department',
        ],
      },
      { suggestions },
      actor,
      started,
      true,
    );
  }

  async questions(dto: SuggestQuestionsDto, actor: User) {
    const started = Date.now();
    const job = await this.jobs.findOneBy({ id: dto.jobId });
    if (!job) throw new NotFoundException(`Job with ID ${dto.jobId} not found`);
    let skills: string[] = [];
    if (dto.candidateId) {
      const candidate = await this.candidates.findOneBy({
        id: dto.candidateId,
      });
      if (!candidate)
        throw new NotFoundException(
          `Candidate with ID ${dto.candidateId} not found`,
        );
      skills = candidate.skills ?? [];
    }
    const questions = this.provider.questions(
      job.title,
      skills,
      dto.focusAreas ?? [],
      dto.count,
    );
    return this.record(
      AiGenerationType.INTERVIEW_QUESTIONS,
      'interview-questions-v1',
      {
        jobId: job.id,
        candidateId: dto.candidateId ?? null,
        skills,
        focusAreas: dto.focusAreas ?? [],
      },
      { questions },
      actor,
      started,
      true,
    );
  }

  async summarize(applicationId: number, actor: User) {
    const started = Date.now();
    const application = await this.applications.findOne({
      where: { id: applicationId },
      relations: { candidate: true, job: true, currentStage: true },
    });
    if (!application)
      throw new NotFoundException(
        `Application with ID ${applicationId} not found`,
      );
    const events = await this.timeline.find({
      where: { applicationId },
      order: { createdAt: 'ASC' },
      take: 100,
    });
    const output = {
      summary: `${application.candidate.firstName} ${application.candidate.lastName} applied for ${application.job.title} and is currently in ${application.currentStage.name}. ${events.length} timeline event(s) were reviewed.`,
      currentStage: application.currentStage.name,
      eventCount: events.length,
      highlights: events.slice(-5).map((event) => ({
        type: event.type,
        at: event.createdAt,
        metadata: event.metadata,
      })),
    };
    return this.record(
      AiGenerationType.APPLICATION_SUMMARY,
      'application-summary-v1',
      { applicationId, eventIds: events.map((e) => e.id) },
      output,
      actor,
      started,
      false,
    );
  }

  async addFeedback(generationId: string, dto: FeedbackDto, actor: User) {
    const generation = await this.generations.findOneBy({ id: generationId });
    if (!generation)
      throw new NotFoundException(`AI generation ${generationId} not found`);
    const existing = await this.feedback.findOne({
      where: { generation: { id: generationId }, reviewer: { id: actor.id } },
    });
    return this.feedback.save(
      this.feedback.create({
        ...existing,
        generation,
        reviewer: actor,
        rating: dto.rating,
        comment: dto.comment,
        override: dto.override,
      }),
    );
  }

  async monitoring(query: MonitoringQueryDto) {
    const where =
      query.from && query.to
        ? { createdAt: Between(query.from, query.to) }
        : query.from
          ? { createdAt: MoreThanOrEqual(query.from) }
          : query.to
            ? { createdAt: LessThan(query.to) }
            : {};
    const generations = await this.generations.find({ where });
    const feedback = await this.feedback.find({
      relations: { generation: true },
    });
    const ids = new Set(generations.map((g) => g.id));
    const relevant = feedback.filter((f) => ids.has(f.generation.id));
    const byType = Object.values(AiGenerationType).map((type) => {
      const rows = generations.filter((g) => g.type === type);
      const reviews = relevant.filter((f) => f.generation.type === type);
      return {
        type,
        generations: rows.length,
        averageLatencyMs: rows.length
          ? Math.round(rows.reduce((s, r) => s + r.latencyMs, 0) / rows.length)
          : 0,
        averageRating: reviews.length
          ? Math.round(
              (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) *
                100,
            ) / 100
          : null,
        overrides: reviews.filter((r) => r.override).length,
      };
    });
    const matchRows = generations.filter(
      (g) => g.type === AiGenerationType.JOB_MATCH,
    );
    return {
      totals: {
        generations: generations.length,
        feedback: relevant.length,
        estimatedCostUsd: generations
          .reduce((s, g) => s + Number(g.costUsd), 0)
          .toFixed(6),
      },
      byType,
      biasGuardrails: {
        matchingRuns: matchRows.length,
        protectedInputsExcluded: matchRows.filter(
          (g) => g.protectedInputsExcluded,
        ).length,
        violations: matchRows.filter((g) => !g.protectedInputsExcluded).length,
        note: 'Input-exclusion monitoring is necessary but does not replace periodic outcome disparity analysis.',
      },
    };
  }
}
