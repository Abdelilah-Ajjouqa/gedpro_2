export type DeliveryStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'dead_letter' | 'bounced';
export type CommunicationType = 'application_acknowledgement' | 'interview_invitation' | 'interview_reminder' | 'rejection' | 'offer' | 'password_reset' | 'email_verification' | 'custom';
export type CommunicationListItem = { id: string; type: CommunicationType; status: DeliveryStatus; recipient: string; subject: string; attempts: number; candidate?: { id: number; firstName: string; lastName: string }; application?: { id: number }; createdAt: string; sentAt?: string; deliveredAt?: string };
export type CommunicationFilters = { candidateId?: number; applicationId?: number; status?: DeliveryStatus };
export type EmailTemplateVersion = { id: string; key: string; name: string; subject: string; version: number; active: boolean; createdAt: string };
export type CommunicationPreference = { candidateId: number; applicationUpdates: boolean; interviewUpdates: boolean; outcomeUpdates: boolean };
export const statusLabels: Record<DeliveryStatus, string> = { queued: 'Queued', sending: 'Sending', sent: 'Sent', delivered: 'Delivered', failed: 'Failed', dead_letter: 'Dead letter', bounced: 'Bounced' };
export const typeLabels: Record<CommunicationType, string> = { application_acknowledgement: 'Application acknowledgement', interview_invitation: 'Interview invitation', interview_reminder: 'Interview reminder', rejection: 'Rejection', offer: 'Offer', password_reset: 'Password reset', email_verification: 'Email verification', custom: 'Custom' };
