export type DocumentStatus = 'active' | 'archived';
export type DocumentCategory =
  | 'resume'
  | 'cover_letter'
  | 'portfolio'
  | 'offer'
  | 'other';
export type DocumentAction = 'download' | 'preview' | 'replace' | 'archive';

export type DocumentListItem = {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
  category: DocumentCategory;
  status: DocumentStatus;
  version: number;
  etag: string;
  createdAt: string;
  archivedAt?: string | null;
  retentionUntil?: string | null;
  candidate?: { id: number };
  application?: { id: number };
  replacesId?: number;
  allowedActions: DocumentAction[];
};
export type DocumentListParams = {
  q: string;
  category?: DocumentCategory;
  status: DocumentStatus;
  sort: 'createdAt' | 'name' | 'category' | 'status';
  direction: 'asc' | 'desc';
  page: number;
  limit: number;
};
export type DocumentListResponse = {
  data: DocumentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
