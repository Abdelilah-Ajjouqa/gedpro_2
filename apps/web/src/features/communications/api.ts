import { apiRequest } from '@/lib/api-client';
import type { CommunicationFilters, CommunicationListItem, CommunicationPreference, CommunicationType, DeliveryStatus, EmailTemplateVersion } from './types';

export const communicationKeys = { all: (scope: string) => ['communications', scope] as const, list: (scope: string, filters: CommunicationFilters) => ['communications', scope, 'list', filters] as const, templates: (scope: string) => ['communications', scope, 'templates'] as const, preferences: (scope: string, candidateId: number) => ['communications', scope, 'preferences', candidateId] as const };
function query(filters: CommunicationFilters) { const value = new URLSearchParams(); Object.entries(filters).forEach(([key, item]) => { if (item !== undefined) value.set(key, String(item)); }); return value.toString(); }
export function listCommunications(filters: CommunicationFilters, signal?: AbortSignal) { return apiRequest<CommunicationListItem[]>(`/communications${query(filters) ? `?${query(filters)}` : ''}`, { signal }); }
export function listTemplates(signal?: AbortSignal) { return apiRequest<EmailTemplateVersion[]>('/communications/templates', { signal }); }
export function createTemplate(input: { key: string; name: string; subject: string; htmlBody: string }) { return apiRequest<EmailTemplateVersion>('/communications/templates', { method: 'POST', body: JSON.stringify(input) }); }
export function retryCommunication(id: string) { return apiRequest<CommunicationListItem>(`/communications/${id}/retry`, { method: 'POST' }); }
export function getPreferences(candidateId: number, signal?: AbortSignal) { return apiRequest<CommunicationPreference>(`/communications/preferences/${candidateId}`, { signal }); }
export function updatePreferences(candidateId: number, input: Omit<CommunicationPreference, 'candidateId'>) { return apiRequest<CommunicationPreference>(`/communications/preferences/${candidateId}`, { method: 'PATCH', body: JSON.stringify(input) }); }
export function queueCommunication(input: { type: CommunicationType; candidateId?: number; applicationId?: number; templateKey?: string; variables?: Record<string, unknown>; idempotencyKey: string }) { return apiRequest<CommunicationListItem>('/communications', { method: 'POST', body: JSON.stringify(input) }); }
export function canRetry(status: DeliveryStatus) { return ['failed', 'dead_letter', 'bounced'].includes(status); }
