import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// Entities
import { User } from '../users/entities/user.entity';
import { Role } from '../users/enums/role.enum';
import { Pipeline } from '../pipelines/entities/pipeline.entity';
import { PipelineStage } from '../pipelines/entities/pipeline-stage.entity';
import { PipelineTransition } from '../pipelines/entities/pipeline-transition.entity';
import { StageCategory } from '../pipelines/enums/stage-category.enum';
import { Job } from '../jobs/entities/job.entity';
import { JobStatus } from '../jobs/enums/job-status.enum';
import { EmploymentType } from '../jobs/enums/employment-type.enum';
import { Candidate } from '../candidates/entities/candidate.entity';
import { CandidateState } from '../candidates/enums/candidate-state.enum';
import { CandidateHistory } from '../candidates/entities/candidate-history.entity';
import { Application } from '../applications/entities/application.entity';
import { ApplicationHistory } from '../applications/entities/application-history.entity';
import { Interview } from '../interviews/entities/interview.entity';
import { InterviewStatus } from '../interviews/enums/interview-status.enum';
import { InterviewType } from '../interviews/enums/interview-type.enum';
import { ScorecardTemplate } from '../interviews/entities/scorecard-template.entity';
import { Scorecard } from '../interviews/entities/scorecard.entity';
import { ScorecardRecommendation } from '../interviews/enums/scorecard-recommendation.enum';
import { EmailTemplate } from '../communications/entities/email-template.entity';
import {
  Communication,
  CommunicationType,
  DeliveryStatus,
} from '../communications/entities/communication.entity';
import { NotificationPreference } from '../communications/entities/notification-preference.entity';
import {
  TimelineEvent,
  TimelineEventVisibility,
  TimelineTargetType,
} from '../timeline/entities/timeline-event.entity';
import {
  Document,
  DocumentCategory,
  DocumentStatus,
} from '../documents/entities/document.entity';
import { Form, FormDocument } from '../forms/schemas/form.schema';
import {
  FormResponse,
  FormResponseDocument,
} from '../forms/schemas/form-response.schema';
import { DOCUMENT_STORAGE } from '../documents/storage/document-storage';
import type { DocumentStorage } from '../documents/storage/document-storage';

async function seed() {
  console.log('🌱 Starting comprehensive test data generation for GEDPro 2...');
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const storage = app.get<DocumentStorage>(DOCUMENT_STORAGE);
  const formModel = app.get<Model<FormDocument>>(getModelToken(Form.name));
  const formResponseModel = app.get<Model<FormResponseDocument>>(
    getModelToken(FormResponse.name),
  );

  const userRepo = dataSource.getRepository(User);
  const pipelineRepo = dataSource.getRepository(Pipeline);
  const stageRepo = dataSource.getRepository(PipelineStage);
  const transitionRepo = dataSource.getRepository(PipelineTransition);
  const jobRepo = dataSource.getRepository(Job);
  const candidateRepo = dataSource.getRepository(Candidate);
  const candidateHistoryRepo = dataSource.getRepository(CandidateHistory);
  const appRepo = dataSource.getRepository(Application);
  const appHistoryRepo = dataSource.getRepository(ApplicationHistory);
  const interviewRepo = dataSource.getRepository(Interview);
  const scorecardTemplateRepo = dataSource.getRepository(ScorecardTemplate);
  const scorecardRepo = dataSource.getRepository(Scorecard);
  const emailTemplateRepo = dataSource.getRepository(EmailTemplate);
  const communicationRepo = dataSource.getRepository(Communication);
  const notifPrefRepo = dataSource.getRepository(NotificationPreference);
  const timelineRepo = dataSource.getRepository(TimelineEvent);
  const documentRepo = dataSource.getRepository(Document);

  // ---------------------------------------------------------
  // 1. Seed Users (Profiles & Personas)
  // ---------------------------------------------------------
  console.log('👤 Seeding Users & Roles...');
  const usersToSeed = [
    {
      email: 'admin@gedpro.com',
      password: 'Admin12345678!',
      firstName: 'GEDPro',
      lastName: 'Admin',
      role: Role.ADMIN,
    },
    {
      email: 'recruiter.sarah@gedpro.com',
      password: 'Recruiter1234!',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      role: Role.RH,
    },
    {
      email: 'recruiter.youssef@gedpro.com',
      password: 'Recruiter1234!',
      firstName: 'Youssef',
      lastName: 'Berrada',
      role: Role.RH,
    },
    {
      email: 'tech.lead@gedpro.com',
      password: 'Manager123456!',
      firstName: 'Karim',
      lastName: 'Tazi',
      role: Role.MANAGER,
    },
    {
      email: 'hr.lead@gedpro.com',
      password: 'Manager123456!',
      firstName: 'Nadia',
      lastName: 'Benkirane',
      role: Role.MANAGER,
    },
    {
      email: 'candidate@gedpro.com',
      password: 'Candidate1234!',
      firstName: 'Abdelilah',
      lastName: 'Ajjouqa',
      role: Role.CANDIDATE,
    },
    {
      email: 'candidate.salma@gedpro.com',
      password: 'Candidate1234!',
      firstName: 'Salma',
      lastName: 'Mansouri',
      role: Role.CANDIDATE,
    },
  ];

  const userMap = new Map<string, User>();
  for (const u of usersToSeed) {
    let existing = await userRepo.findOne({ where: { email: u.email } });
    const passwordHash = await bcrypt.hash(u.password, 10);
    if (!existing) {
      existing = userRepo.create({
        email: u.email,
        password: passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        isActive: true,
        emailVerified: true,
      });
      await userRepo.save(existing);
      console.log(`   + Created user: ${u.email} (${u.role})`);
    } else {
      existing.password = passwordHash;
      existing.role = u.role;
      existing.isActive = true;
      existing.emailVerified = true;
      await userRepo.save(existing);
      console.log(`   * Updated user: ${u.email}`);
    }
    userMap.set(u.email, existing);
  }

  // ---------------------------------------------------------
  // 2. Seed Pipelines, Stages & Transitions
  // ---------------------------------------------------------
  console.log('🔄 Seeding Recruitment Pipelines...');
  async function ensurePipeline(
    name: string,
    description: string,
    stageDefs: { name: string; category: StageCategory; position: number }[],
  ) {
    let pipeline = await pipelineRepo.findOne({
      where: { name },
      relations: ['stages'],
    });

    if (!pipeline) {
      pipeline = pipelineRepo.create({
        name,
        description,
        isTemplate: true,
        archived: false,
      });
      pipeline = await pipelineRepo.save(pipeline);
      console.log(`   + Created pipeline: ${name}`);
    }

    const stageMap = new Map<number, PipelineStage>();
    for (const def of stageDefs) {
      let stage = await stageRepo.findOne({
        where: { pipeline: { id: pipeline.id }, position: def.position },
      });
      if (!stage) {
        stage = stageRepo.create({
          pipeline,
          name: def.name,
          category: def.category,
          position: def.position,
        });
        stage = await stageRepo.save(stage);
      }
      stageMap.set(def.position, stage);
    }

    // Connect sequential transitions + transitions to terminal stages
    const allStages = Array.from(stageMap.values());
    const rejectedStage = allStages.find((s) => s.category === StageCategory.REJECTED);
    const withdrawnStage = allStages.find((s) => s.category === StageCategory.WITHDRAWN);

    for (let i = 0; i < stageDefs.length - 1; i++) {
      const fromStage = stageMap.get(i);
      const toStage = stageMap.get(i + 1);
      if (fromStage && toStage) {
        const exists = await transitionRepo.findOne({
          where: { fromStage: { id: fromStage.id }, toStage: { id: toStage.id } },
        });
        if (!exists) {
          await transitionRepo.save(
            transitionRepo.create({ fromStage, toStage }),
          );
        }
      }
      if (fromStage && rejectedStage && fromStage.id !== rejectedStage.id) {
        const exists = await transitionRepo.findOne({
          where: { fromStage: { id: fromStage.id }, toStage: { id: rejectedStage.id } },
        });
        if (!exists) {
          await transitionRepo.save(
            transitionRepo.create({ fromStage, toStage: rejectedStage }),
          );
        }
      }
      if (fromStage && withdrawnStage && fromStage.id !== withdrawnStage.id) {
        const exists = await transitionRepo.findOne({
          where: { fromStage: { id: fromStage.id }, toStage: { id: withdrawnStage.id } },
        });
        if (!exists) {
          await transitionRepo.save(
            transitionRepo.create({ fromStage, toStage: withdrawnStage }),
          );
        }
      }
    }

    pipeline.stages = allStages;
    return { pipeline, stages: stageMap };
  }

  const engineeringPipelineData = await ensurePipeline(
    'Standard Engineering Pipeline',
    'Robust engineering pipeline with technical assessment and architecture interview.',
    [
      { name: 'Applied', category: StageCategory.APPLIED, position: 0 },
      { name: 'HR Screening', category: StageCategory.SCREENING, position: 1 },
      { name: 'Technical Assessment', category: StageCategory.INTERVIEW, position: 2 },
      { name: 'Technical Interview', category: StageCategory.INTERVIEW, position: 3 },
      { name: 'Culture & Leadership', category: StageCategory.INTERVIEW, position: 4 },
      { name: 'Offer Extended', category: StageCategory.OFFER, position: 5 },
      { name: 'Hired', category: StageCategory.HIRED, position: 6 },
      { name: 'Rejected', category: StageCategory.REJECTED, position: 7 },
      { name: 'Withdrawn', category: StageCategory.WITHDRAWN, position: 8 },
    ],
  );

  const commercialPipelineData = await ensurePipeline(
    'Commercial & Operations Pipeline',
    'Standard pipeline for business, marketing, HR and operations candidates.',
    [
      { name: 'Applied', category: StageCategory.APPLIED, position: 0 },
      { name: 'HR Phone Screen', category: StageCategory.SCREENING, position: 1 },
      { name: 'Hiring Manager Review', category: StageCategory.INTERVIEW, position: 2 },
      { name: 'Executive Offer', category: StageCategory.OFFER, position: 3 },
      { name: 'Hired', category: StageCategory.HIRED, position: 4 },
      { name: 'Rejected', category: StageCategory.REJECTED, position: 5 },
      { name: 'Withdrawn', category: StageCategory.WITHDRAWN, position: 6 },
    ],
  );

  // ---------------------------------------------------------
  // 3. Seed Scorecard Templates
  // ---------------------------------------------------------
  console.log('📋 Seeding Scorecard Templates...');
  const techScorecardTemplate = await scorecardTemplateRepo.findOne({
    where: { name: 'Engineering Technical Scorecard' },
  });
  let engineeringTemplate = techScorecardTemplate;
  if (!techScorecardTemplate) {
    engineeringTemplate = await scorecardTemplateRepo.save(
      scorecardTemplateRepo.create({
        name: 'Engineering Technical Scorecard',
        description: 'Structured scorecard covering architecture, coding, and system design.',
        criteria: [
          {
            key: 'architecture',
            label: 'System Architecture & Concurrency',
            minRating: 1,
            maxRating: 5,
            required: true,
          },
          {
            key: 'problem_solving',
            label: 'Algorithms & Problem Solving',
            minRating: 1,
            maxRating: 5,
            required: true,
          },
          {
            key: 'code_quality',
            label: 'Clean Code, TypeScript & Testing',
            minRating: 1,
            maxRating: 5,
            required: true,
          },
          {
            key: 'communication',
            label: 'Technical Articulation & Collaboration',
            minRating: 1,
            maxRating: 5,
            required: true,
          },
        ],
      }),
    );
  }

  const cultureScorecardTemplate = await scorecardTemplateRepo.findOne({
    where: { name: 'Culture & Soft Skills Scorecard' },
  });
  let softSkillsTemplate = cultureScorecardTemplate;
  if (!cultureScorecardTemplate) {
    softSkillsTemplate = await scorecardTemplateRepo.save(
      scorecardTemplateRepo.create({
        name: 'Culture & Soft Skills Scorecard',
        description: 'Evaluates cultural alignment, leadership ownership, and communication.',
        criteria: [
          {
            key: 'values_alignment',
            label: 'Values & Company Mission Fit',
            minRating: 1,
            maxRating: 5,
            required: true,
          },
          {
            key: 'collaboration',
            label: 'Cross-functional Collaboration',
            minRating: 1,
            maxRating: 5,
            required: true,
          },
          {
            key: 'ownership',
            label: 'Proactive Ownership & Autonomy',
            minRating: 1,
            maxRating: 5,
            required: true,
          },
          {
            key: 'growth_mindset',
            label: 'Receptiveness to Feedback',
            minRating: 1,
            maxRating: 5,
            required: true,
          },
        ],
      }),
    );
  }

  // ---------------------------------------------------------
  // 4. Seed Jobs
  // ---------------------------------------------------------
  console.log('💼 Seeding Job Openings...');
  const jobsToSeed = [
    {
      title: 'Senior Full-Stack Engineer (NestJS / React)',
      description:
        'We are seeking an experienced Full-Stack Engineer proficient in TypeScript, React, Next.js, and NestJS to spearhead high-throughput ATS platform features.',
      department: 'Engineering',
      location: 'Casablanca / Hybrid',
      employmentType: EmploymentType.FULL_TIME,
      status: JobStatus.PUBLISHED,
      pipeline: engineeringPipelineData.pipeline,
      owner: userMap.get('recruiter.sarah@gedpro.com')!,
    },
    {
      title: 'Product Marketing Lead',
      description:
        'Lead our go-to-market strategies, B2B product marketing funnels, and enterprise SaaS brand storytelling.',
      department: 'Marketing & Growth',
      location: 'Remote',
      employmentType: EmploymentType.FULL_TIME,
      status: JobStatus.PUBLISHED,
      pipeline: commercialPipelineData.pipeline,
      owner: userMap.get('recruiter.youssef@gedpro.com')!,
    },
    {
      title: 'DevOps & Cloud Architect (AWS / K8s)',
      description:
        'Architect scalable, highly available cloud infrastructure using Kubernetes, AWS, Terraform, and automated GitOps pipelines.',
      department: 'Infrastructure',
      location: 'Casablanca',
      employmentType: EmploymentType.FULL_TIME,
      status: JobStatus.PUBLISHED,
      pipeline: engineeringPipelineData.pipeline,
      owner: userMap.get('recruiter.sarah@gedpro.com')!,
    },
    {
      title: 'HR & People Operations Specialist',
      description:
        'Manage talent operations, recruitment compliance, employee onboarding workflows, and Moroccan labor law policies.',
      department: 'Human Resources',
      location: 'Rabat / On-site',
      employmentType: EmploymentType.FULL_TIME,
      status: JobStatus.PUBLISHED,
      pipeline: commercialPipelineData.pipeline,
      owner: userMap.get('recruiter.youssef@gedpro.com')!,
    },
    {
      title: 'Junior Frontend Developer (React)',
      description:
        'Exciting entry-level opportunity for a passionate Frontend Developer to contribute to accessible, responsive web interfaces.',
      department: 'Engineering',
      location: 'Casablanca',
      employmentType: EmploymentType.FULL_TIME,
      status: JobStatus.DRAFT,
      pipeline: engineeringPipelineData.pipeline,
      owner: userMap.get('recruiter.sarah@gedpro.com')!,
    },
    {
      title: 'Data Platform Engineer',
      description:
        'Design ETL pipelines and analytical warehouses leveraging Python, PostgreSQL, and Apache Spark.',
      department: 'Engineering',
      location: 'Remote',
      employmentType: EmploymentType.CONTRACT,
      status: JobStatus.CLOSED,
      pipeline: engineeringPipelineData.pipeline,
      owner: userMap.get('recruiter.sarah@gedpro.com')!,
    },
  ];

  const jobMap = new Map<string, Job>();
  for (const j of jobsToSeed) {
    let job = await jobRepo.findOne({ where: { title: j.title } });
    if (!job) {
      job = jobRepo.create({
        ...j,
        publishedAt: j.status === JobStatus.PUBLISHED ? new Date() : undefined,
      });
      job = await jobRepo.save(job);
      console.log(`   + Created job: ${j.title} (${j.status})`);
    }
    jobMap.set(j.title, job);
  }

  // ---------------------------------------------------------
  // 5. Seed Candidates
  // ---------------------------------------------------------
  console.log('👥 Seeding Candidates...');
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  const candidatesToSeed = [
    {
      firstName: 'Abdelilah',
      lastName: 'Ajjouqa',
      email: 'candidate@gedpro.com',
      phone: '+212600112233',
      skills: ['React', 'Next.js', 'NestJS', 'TypeScript', 'PostgreSQL', 'Docker', 'Tailwind CSS'],
      tags: ['Senior', 'Full-Stack', 'Top Candidate', 'Recommended'],
      source: 'LinkedIn',
      currentState: CandidateState.IN_INTERVIEW,
      cvFile: 'Abdelilah_Ajjouqa_CV_Fr.pdf',
    },
    {
      firstName: 'Salma',
      lastName: 'Mansouri',
      email: 'salma.marketing@example.com',
      phone: '+212611223344',
      skills: ['Growth Marketing', 'SEO', 'Product Strategy', 'B2B Lead Gen', 'HubSpot'],
      tags: ['Marketing', 'B2B', 'Immediate Available'],
      source: 'Referral',
      currentState: CandidateState.PRESELECTED,
      cvFile: 'CV A4 Professionnel Marketing Noir et Blanc.pdf',
    },
    {
      firstName: 'Mehdi',
      lastName: 'El Amrani',
      email: 'mehdi.devops@example.com',
      phone: '+212622334455',
      skills: ['Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Docker', 'Linux', 'Helm'],
      tags: ['DevOps', 'Cloud Architect', 'Certified AWS'],
      source: 'Career Portal',
      currentState: CandidateState.PRESELECTED,
      cvFile: 'CV Français Professionnel Simple Noir et Blanc (1).pdf',
    },
    {
      firstName: 'Zineb',
      lastName: 'Chraibi',
      email: 'zineb.frontend@example.com',
      phone: '+212633445566',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux', 'Jest', 'UI/UX'],
      tags: ['Frontend', 'Design System', 'Accessibility'],
      source: 'LinkedIn',
      currentState: CandidateState.INTERVIEW_SCHEDULED,
      cvFile: 'CV Français Professionnel Simple Noir et Blanc.pdf',
    },
    {
      firstName: 'Omar',
      lastName: 'Bennani',
      email: 'omar.hr@example.com',
      phone: '+212644556677',
      skills: ['Talent Acquisition', 'HR Strategy', 'Labor Law', 'Payroll', 'Employee Relations'],
      tags: ['HR Lead', 'Executive', 'Experienced'],
      source: 'Direct Application',
      currentState: CandidateState.ACCEPTED,
      cvFile: 'CV Professionnel Ressources Humaines Marron et Blanc.pdf',
    },
    {
      firstName: 'Tariq',
      lastName: 'Kabbaj',
      email: 'tariq.kabbaj@example.com',
      phone: '+212655667788',
      skills: ['Python', 'Apache Spark', 'SQL', 'Airflow', 'Snowflake', 'BigData'],
      tags: ['Data Platform', 'Senior'],
      source: 'LinkedIn',
      currentState: CandidateState.IN_INTERVIEW,
    },
    {
      firstName: 'Leila',
      lastName: 'Haddad',
      email: 'leila.haddad@example.com',
      phone: '+212666778899',
      skills: ['JavaScript', 'React', 'HTML/CSS', 'Git', 'REST'],
      tags: ['Junior', 'High Potential'],
      source: 'Campus Recruiting',
      currentState: CandidateState.NEW,
    },
    {
      firstName: 'Hamza',
      lastName: 'Idrissi',
      email: 'hamza.idrissi@example.com',
      phone: '+212677889900',
      skills: ['Docker', 'Bash', 'Jenkins', 'Linux', 'Monitoring'],
      tags: ['SysAdmin', 'Junior DevOps'],
      source: 'Job Board',
      currentState: CandidateState.REJECTED,
    },
  ];

  const candidateMap = new Map<string, Candidate>();
  for (const c of candidatesToSeed) {
    let candidate = await candidateRepo.findOne({ where: { email: c.email } });
    if (!candidate) {
      candidate = candidateRepo.create({
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        normalizedEmail: c.email.trim().toLowerCase(),
        phone: c.phone,
        normalizedPhone: c.phone.replace(/\D/g, ''),
        skills: c.skills,
        tags: c.tags,
        source: c.source,
        currentState: c.currentState,
        privacyConsent: true,
        consentAt: new Date(),
        retentionUntil: oneYearFromNow,
        owner: userMap.get('recruiter.sarah@gedpro.com'),
      });
      candidate = await candidateRepo.save(candidate);

      await candidateHistoryRepo.save(
        candidateHistoryRepo.create({
          candidate,
          previousState: CandidateState.NEW,
          newState: c.currentState,
          comment: `Initial ingestion via ${c.source}`,
          changedBy: userMap.get('recruiter.sarah@gedpro.com'),
        }),
      );

      // Notification preference
      await notifPrefRepo.save(
        notifPrefRepo.create({
          candidate,
          applicationUpdates: true,
          interviewUpdates: true,
          outcomeUpdates: true,
        }),
      );

      console.log(`   + Created candidate: ${c.firstName} ${c.lastName}`);
    }
    candidateMap.set(c.email, candidate);
  }

  // ---------------------------------------------------------
  // 6. Seed Applications & Stage Transitions
  // ---------------------------------------------------------
  console.log('📝 Seeding Job Applications & Stages...');
  const appSpecs = [
    {
      candidateEmail: 'candidate@gedpro.com',
      jobTitle: 'Senior Full-Stack Engineer (NestJS / React)',
      stagePosition: 5, // Offer Extended
      pipeline: engineeringPipelineData,
      ownerEmail: 'recruiter.sarah@gedpro.com',
    },
    {
      candidateEmail: 'zineb.frontend@example.com',
      jobTitle: 'Senior Full-Stack Engineer (NestJS / React)',
      stagePosition: 2, // Technical Assessment
      pipeline: engineeringPipelineData,
      ownerEmail: 'recruiter.sarah@gedpro.com',
    },
    {
      candidateEmail: 'tariq.kabbaj@example.com',
      jobTitle: 'Senior Full-Stack Engineer (NestJS / React)',
      stagePosition: 3, // Technical Interview
      pipeline: engineeringPipelineData,
      ownerEmail: 'recruiter.sarah@gedpro.com',
    },
    {
      candidateEmail: 'leila.haddad@example.com',
      jobTitle: 'Senior Full-Stack Engineer (NestJS / React)',
      stagePosition: 0, // Applied
      pipeline: engineeringPipelineData,
      ownerEmail: 'recruiter.sarah@gedpro.com',
    },
    {
      candidateEmail: 'salma.marketing@example.com',
      jobTitle: 'Product Marketing Lead',
      stagePosition: 1, // Phone Screen
      pipeline: commercialPipelineData,
      ownerEmail: 'recruiter.youssef@gedpro.com',
    },
    {
      candidateEmail: 'mehdi.devops@example.com',
      jobTitle: 'DevOps & Cloud Architect (AWS / K8s)',
      stagePosition: 1, // HR Screening
      pipeline: engineeringPipelineData,
      ownerEmail: 'recruiter.sarah@gedpro.com',
    },
    {
      candidateEmail: 'hamza.idrissi@example.com',
      jobTitle: 'DevOps & Cloud Architect (AWS / K8s)',
      stagePosition: 7, // Rejected
      pipeline: engineeringPipelineData,
      ownerEmail: 'recruiter.sarah@gedpro.com',
      rejectionReason: 'Lacks required Kubernetes production & architectural experience',
    },
    {
      candidateEmail: 'omar.hr@example.com',
      jobTitle: 'HR & People Operations Specialist',
      stagePosition: 3, // Executive Offer
      pipeline: commercialPipelineData,
      ownerEmail: 'recruiter.youssef@gedpro.com',
    },
  ];

  const appMap = new Map<string, Application>();
  for (const spec of appSpecs) {
    const candidate = candidateMap.get(spec.candidateEmail);
    const job = jobMap.get(spec.jobTitle);
    const stage = spec.pipeline.stages.get(spec.stagePosition);
    const owner = userMap.get(spec.ownerEmail);

    if (!candidate || !job || !stage) continue;

    let app = await appRepo.findOne({
      where: { candidate: { id: candidate.id }, job: { id: job.id } },
    });

    if (!app) {
      app = appRepo.create({
        candidate,
        job,
        owner,
        currentStage: stage,
        source: candidate.source,
        rejectionReason: spec.rejectionReason,
      });
      app = await appRepo.save(app);

      // Create history trail
      const appliedStage = spec.pipeline.stages.get(0)!;
      await appHistoryRepo.save(
        appHistoryRepo.create({
          application: app,
          previousStage: undefined,
          newStage: appliedStage,
          kind: 'created',
          comment: 'Application submitted through career portal.',
          changedBy: owner ?? userMap.get('admin@gedpro.com')!,
        }),
      );

      if (spec.stagePosition > 0) {
        await appHistoryRepo.save(
          appHistoryRepo.create({
            application: app,
            previousStage: appliedStage,
            newStage: stage,
            kind: 'transitioned',
            comment: `Progressed to ${stage.name}.`,
            rejectionReason: spec.rejectionReason,
            changedBy: owner ?? userMap.get('admin@gedpro.com')!,
          }),
        );
      }

      // Add Timeline Events
      await timelineRepo.save(
        timelineRepo.create({
          type: 'application.created',
          actorId: owner?.id ?? null,
          actorName: owner ? `${owner.firstName} ${owner.lastName}` : 'System',
          visibility: TimelineEventVisibility.INTERNAL,
          targetType: TimelineTargetType.APPLICATION,
          targetId: app.id,
          candidateId: candidate.id,
          applicationId: app.id,
          metadata: { jobTitle: job.title, stage: stage.name },
        }),
      );

      console.log(`   + Application: ${candidate.firstName} -> ${job.title} (${stage.name})`);
    }
    appMap.set(`${spec.candidateEmail}_${spec.jobTitle}`, app);
  }

  // ---------------------------------------------------------
  // 7. Seed Interviews & Completed Scorecards
  // ---------------------------------------------------------
  console.log('📅 Seeding Interviews & Scorecards...');
  const abdelilahApp = appMap.get(
    'candidate@gedpro.com_Senior Full-Stack Engineer (NestJS / React)',
  );
  const zinebApp = appMap.get(
    'zineb.frontend@example.com_Senior Full-Stack Engineer (NestJS / React)',
  );
  const mehdiApp = appMap.get(
    'mehdi.devops@example.com_DevOps & Cloud Architect (AWS / K8s)',
  );
  const karimManager = userMap.get('tech.lead@gedpro.com')!;
  const nadiaManager = userMap.get('hr.lead@gedpro.com')!;
  const sarahRecruiter = userMap.get('recruiter.sarah@gedpro.com')!;

  if (abdelilahApp) {
    // Past completed technical interview
    let techInterview = await interviewRepo.findOne({
      where: {
        candidate: { id: abdelilahApp.candidate.id },
        type: InterviewType.TECHNICAL,
        round: 1,
      },
    });
    if (!techInterview) {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);

      techInterview = await interviewRepo.save(
        interviewRepo.create({
          candidate: abdelilahApp.candidate,
          application: abdelilahApp,
          interviewer: karimManager,
          attendees: [karimManager, sarahRecruiter],
          date: pastDate,
          duration: 60,
          status: InterviewStatus.COMPLETED,
          type: InterviewType.TECHNICAL,
          round: 1,
          title: 'Deep NestJS & Microservices Architecture Review',
          location: 'Google Meet https://meet.google.com/ged-tech-session',
          notes: 'Candidate demonstrated outstanding mastery of CQRS, TypeORM, and optimistic locking patterns.',
        }),
      );

      // Scorecard for Karim
      if (engineeringTemplate) {
        await scorecardRepo.save(
          scorecardRepo.create({
            interview: techInterview,
            reviewer: karimManager,
            template: engineeringTemplate,
            ratings: {
              architecture: 5,
              problem_solving: 5,
              code_quality: 4,
              communication: 5,
            },
            recommendation: ScorecardRecommendation.STRONG_YES,
            privateNotes:
              'Exceptional candidate. Top 5% of candidates interviewed on system design and clean code standards. Clear hire.',
            submittedAt: pastDate,
          }),
        );
      }
      console.log('   + Completed Technical Interview & Scorecard for Abdelilah Ajjouqa');
    }

    // Past completed culture interview
    let cultureInterview = await interviewRepo.findOne({
      where: {
        candidate: { id: abdelilahApp.candidate.id },
        type: InterviewType.FINAL,
        round: 2,
      },
    });
    if (!cultureInterview) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      cultureInterview = await interviewRepo.save(
        interviewRepo.create({
          candidate: abdelilahApp.candidate,
          application: abdelilahApp,
          interviewer: nadiaManager,
          attendees: [nadiaManager],
          date: yesterday,
          duration: 45,
          status: InterviewStatus.COMPLETED,
          type: InterviewType.FINAL,
          round: 2,
          title: 'Executive Culture Fit & Alignment Review',
          location: 'Headquarters - Executive Meeting Room 4A',
          notes: 'Strong alignment with collaborative culture and mentorship values.',
        }),
      );

      if (softSkillsTemplate) {
        await scorecardRepo.save(
          scorecardRepo.create({
            interview: cultureInterview,
            reviewer: nadiaManager,
            template: softSkillsTemplate,
            ratings: {
              values_alignment: 5,
              collaboration: 5,
              ownership: 5,
              growth_mindset: 4,
            },
            recommendation: ScorecardRecommendation.STRONG_YES,
            privateNotes:
              'Articulate, high EQ, proactive mentality. Unanimous approval for job offer extension.',
            submittedAt: yesterday,
          }),
        );
      }
      console.log('   + Completed Culture Interview & Scorecard for Abdelilah Ajjouqa');
    }
  }

  if (zinebApp) {
    // Scheduled upcoming interview
    const existing = await interviewRepo.findOne({
      where: { candidate: { id: zinebApp.candidate.id }, round: 1 },
    });
    if (!existing) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(14, 0, 0, 0);

      await interviewRepo.save(
        interviewRepo.create({
          candidate: zinebApp.candidate,
          application: zinebApp,
          interviewer: karimManager,
          attendees: [karimManager],
          date: tomorrow,
          duration: 60,
          status: InterviewStatus.SCHEDULED,
          type: InterviewType.TECHNICAL,
          round: 1,
          title: 'React Core & Component Design System Session',
          location: 'Google Meet https://meet.google.com/ged-react-screen',
          notes: 'Focus on performance profiling, custom hooks, and Tailwind composition.',
        }),
      );
      console.log('   + Scheduled upcoming interview for Zineb Chraibi');
    }
  }

  if (mehdiApp) {
    const existing = await interviewRepo.findOne({
      where: { candidate: { id: mehdiApp.candidate.id }, round: 1 },
    });
    if (!existing) {
      const inTwoDays = new Date();
      inTwoDays.setDate(inTwoDays.getDate() + 2);
      inTwoDays.setHours(10, 0, 0, 0);

      await interviewRepo.save(
        interviewRepo.create({
          candidate: mehdiApp.candidate,
          application: mehdiApp,
          interviewer: karimManager,
          attendees: [karimManager],
          date: inTwoDays,
          duration: 60,
          status: InterviewStatus.SCHEDULED,
          type: InterviewType.TECHNICAL,
          round: 1,
          title: 'Kubernetes Cluster Architecture & Multi-AZ Resiliency',
          location: 'Google Meet https://meet.google.com/ged-devops-screen',
          notes: 'Prepare scenario on zero-downtime rolling upgrades and Helm secrets management.',
        }),
      );
      console.log('   + Scheduled upcoming interview for Mehdi El Amrani');
    }
  }

  // ---------------------------------------------------------
  // 8. Seed Real PDF CV Documents (from seed-assets)
  // ---------------------------------------------------------
  console.log('📄 Ingesting Candidate CV Documents into Storage...');
  const assetsDir = path.resolve('apps/api/seed-assets/CVs');

  const cvMappings = [
    {
      candidateEmail: 'candidate@gedpro.com',
      file: 'Abdelilah_Ajjouqa_CV_Fr.pdf',
      appKey: 'candidate@gedpro.com_Senior Full-Stack Engineer (NestJS / React)',
    },
    {
      candidateEmail: 'salma.marketing@example.com',
      file: 'CV A4 Professionnel Marketing Noir et Blanc.pdf',
      appKey: 'salma.marketing@example.com_Product Marketing Lead',
    },
    {
      candidateEmail: 'mehdi.devops@example.com',
      file: 'CV Français Professionnel Simple Noir et Blanc (1).pdf',
      appKey: 'mehdi.devops@example.com_DevOps & Cloud Architect (AWS / K8s)',
    },
    {
      candidateEmail: 'zineb.frontend@example.com',
      file: 'CV Français Professionnel Simple Noir et Blanc.pdf',
      appKey: 'zineb.frontend@example.com_Senior Full-Stack Engineer (NestJS / React)',
    },
    {
      candidateEmail: 'omar.hr@example.com',
      file: 'CV Professionnel Ressources Humaines Marron et Blanc.pdf',
      appKey: 'omar.hr@example.com_HR & People Operations Specialist',
    },
  ];

  for (const cv of cvMappings) {
    const candidate = candidateMap.get(cv.candidateEmail);
    const app = appMap.get(cv.appKey);
    const filePath = path.join(assetsDir, cv.file);

    if (!candidate || !fs.existsSync(filePath)) continue;

    const fileBuffer = fs.readFileSync(filePath);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    const existingDoc = await documentRepo.findOne({
      where: { candidate: { id: candidate.id }, checksum },
    });

    if (!existingDoc) {
      const storageKey = `documents/${candidate.id}/${cv.file}`;
      try {
        await storage.put(storageKey, fileBuffer, 'application/pdf');
      } catch (err) {
        // If storage fails, continue so script does not break
        console.warn(`   ! Warning storing file ${cv.file}: ${err}`);
      }

      await documentRepo.save(
        documentRepo.create({
          originalName: cv.file,
          filename: cv.file,
          mimeType: 'application/pdf',
          size: fileBuffer.length,
          path: storageKey,
          storageProvider: storage.name,
          checksum,
          category: DocumentCategory.RESUME,
          status: DocumentStatus.ACTIVE,
          version: 1,
          user: userMap.get('recruiter.sarah@gedpro.com')!,
          candidate,
          application: app,
        }),
      );
      console.log(`   + Ingested CV for: ${candidate.firstName} ${candidate.lastName} (${cv.file})`);
    }
  }

  // ---------------------------------------------------------
  // 9. Seed Email Templates & Communications
  // ---------------------------------------------------------
  console.log('✉️ Seeding Email Templates & Communications...');
  const templatesToSeed = [
    {
      key: 'interview_invitation',
      name: 'Interview Invitation',
      subject: 'Interview Invitation: {{job_title}} at GEDPro',
      htmlBody: `
        <p>Dear {{candidate_name}},</p>
        <p>We were thoroughly impressed by your profile and would like to invite you for a <strong>{{interview_type}}</strong> interview for the position of <strong>{{job_title}}</strong>.</p>
        <p>Your interview has been scheduled with <strong>{{interviewer_name}}</strong> for <strong>{{interview_date}}</strong>.</p>
        <p>Meeting link: <a href="{{meeting_link}}">{{meeting_link}}</a></p>
        <p>Best regards,<br/>GEDPro Talent Acquisition Team</p>
      `,
    },
    {
      key: 'offer_letter',
      name: 'Official Job Offer',
      subject: 'Congratulations! Job Offer: {{job_title}} at GEDPro',
      htmlBody: `
        <p>Dear {{candidate_name}},</p>
        <p>On behalf of the entire team, we are ecstatic to offer you the position of <strong>{{job_title}}</strong>!</p>
        <p>Please review the attached formal offer letter for details on compensation, benefits, and your start date.</p>
        <p>Best regards,<br/>GEDPro People Operations</p>
      `,
    },
    {
      key: 'application_acknowledgement',
      name: 'Application Received',
      subject: 'Application Received: {{job_title}}',
      htmlBody: `
        <p>Hi {{candidate_name}},</p>
        <p>Thank you for submitting your application for the <strong>{{job_title}}</strong> position at GEDPro. Our recruitment team is currently reviewing your resume and will reach out with next steps.</p>
        <p>Best regards,<br/>The GEDPro Team</p>
      `,
    },
  ];

  for (const t of templatesToSeed) {
    let tpl = await emailTemplateRepo.findOne({ where: { key: t.key } });
    if (!tpl) {
      tpl = emailTemplateRepo.create({ ...t, version: 1, active: true });
      await emailTemplateRepo.save(tpl);
      console.log(`   + Created email template: ${t.name}`);
    }
  }

  // ---------------------------------------------------------
  // 10. Seed MongoDB Dynamic Evaluation Forms
  // ---------------------------------------------------------
  console.log('📑 Seeding Dynamic Forms (MongoDB)...');
  try {
    const existingForm = await formModel.findOne({
      title: 'Full-Stack Technical Evaluation Form',
    });

    let formDoc = existingForm;
    if (!existingForm) {
      formDoc = await formModel.create({
        title: 'Full-Stack Technical Evaluation Form',
        description:
          'Structured evaluation form for Senior and Lead engineering interviews.',
        status: 'published',
        currentVersion: 1,
        createdBy: userMap.get('admin@gedpro.com')!.id,
        versions: [
          {
            version: 1,
            title: 'Full-Stack Technical Evaluation Form v1',
            description: 'Comprehensive review form',
            status: 'published',
            createdAt: new Date(),
            publishedAt: new Date(),
            fields: [
              {
                id: 'code_quality_score',
                label: 'Code Quality & Maintainability (1-10)',
                type: 'number',
                required: true,
              },
              {
                id: 'typescript_mastery',
                label: 'TypeScript & Node.js Mastery Level',
                type: 'select',
                required: true,
                options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
              },
              {
                id: 'system_design_notes',
                label: 'System Design & Concurrency Notes',
                type: 'text',
                required: true,
              },
              {
                id: 'hire_recommendation',
                label: 'Overall Recommendation',
                type: 'select',
                required: true,
                options: ['Strong Hire', 'Hire', 'Borderline / Hold', 'No Hire'],
              },
            ],
          },
        ],
      });
      console.log('   + Created MongoDB dynamic evaluation form');
    }

    if (formDoc && abdelilahApp) {
      const existingResponse = await formResponseModel.findOne({
        formId: String(formDoc._id),
        candidateId: abdelilahApp.candidate.id,
      });

      if (!existingResponse) {
        await formResponseModel.create({
          formId: String(formDoc._id),
          formVersion: 1,
          formTitle: formDoc.title,
          candidateId: abdelilahApp.candidate.id,
          applicationId: abdelilahApp.id,
          jobId: abdelilahApp.job.id,
          submittedBy: karimManager.id,
          reviewStatus: 'approved',
          reviewedBy: nadiaManager.id,
          reviewedAt: new Date(),
          reviewNotes: 'Form verified and signed off for final committee evaluation.',
          fieldsSnapshot: formDoc.versions[0].fields,
          answers: {
            code_quality_score: 9.5,
            typescript_mastery: 'Expert',
            system_design_notes:
              'Candidate proposed an elegant dual-write strategy with Redis idempotency and database version columns.',
            hire_recommendation: 'Strong Hire',
          },
        });
        console.log('   + Created MongoDB form response for Abdelilah Ajjouqa');
      }
    }
  } catch (mongoErr) {
    console.warn('   ! Notice on MongoDB seeding:', mongoErr);
  }

  console.log('\n🎉 Comprehensive test data generation complete!');
  console.log('========================================================');
  console.log('Demo Credentials Ready to Use:');
  console.log('  👑 Administrator : admin@gedpro.com | Admin12345678!');
  console.log('  👩‍💼 Lead Recruiter: recruiter.sarah@gedpro.com | Recruiter1234!');
  console.log('  👨‍💼 Tech Recruiter: recruiter.youssef@gedpro.com | Recruiter1234!');
  console.log('  👨‍💻 Engineering HM: tech.lead@gedpro.com | Manager123456!');
  console.log('  👩‍💼 People Lead HM: hr.lead@gedpro.com | Manager123456!');
  console.log('  🎓 Candidate     : candidate@gedpro.com | Candidate1234!');
  console.log('========================================================');

  await app.close();
}

void seed();
