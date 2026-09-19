import { Check, Circle, Clock3, Eye, Send, X } from 'lucide-react';

import type { CandidateStatus, StatusDefinition } from '@/types';

const candidateStatusConfig = {
  new: { label: 'New', tone: 'neutral', icon: Circle },
  reviewing: { label: 'Reviewing', tone: 'warning', icon: Eye },
  interview: { label: 'Interview', tone: 'warning', icon: Clock3 },
  offer: { label: 'Offer', tone: 'success', icon: Send },
  hired: { label: 'Hired', tone: 'success', icon: Check },
  rejected: { label: 'Rejected', tone: 'danger', icon: X },
} satisfies Record<CandidateStatus, StatusDefinition>;

export { candidateStatusConfig };
