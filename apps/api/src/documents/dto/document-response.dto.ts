import { DocumentCategory, DocumentStatus } from '../entities/document.entity';

export type DocumentAction = 'download' | 'preview' | 'replace' | 'archive';

export class DocumentContextRefDto {
  id: number;
  label?: string;
}

export class DocumentSummaryDto {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
  category: DocumentCategory;
  status: DocumentStatus;
  version: number;
  etag: string;
  createdAt: Date;
  archivedAt?: Date | null;
  retentionUntil?: Date | null;
  candidate?: DocumentContextRefDto;
  application?: DocumentContextRefDto;
  replacesId?: number;
  allowedActions: DocumentAction[];
}

export class DocumentListResponseDto {
  data: DocumentSummaryDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
