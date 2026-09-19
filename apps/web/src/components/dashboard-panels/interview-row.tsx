import { Building2, MoreHorizontal, Phone, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Interview } from '@/types';

const meetingConfig = {
  video: { label: 'Join meeting', icon: Video },
  phone: { label: 'Call candidate', icon: Phone },
  onsite: { label: 'View details', icon: Building2 },
} satisfies Record<Interview['meetingType'], { label: string; icon: typeof Video }>;

function InterviewRow({ interview }: { interview: Interview }) {
  const fullName = `${interview.candidate.firstName} ${interview.candidate.lastName}`;
  const meeting = meetingConfig[interview.meetingType];
  const MeetingIcon = meeting.icon;

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/45 sm:flex-nowrap sm:px-5">
      <Avatar src={interview.candidate.avatarUrl} firstName={interview.candidate.firstName} lastName={interview.candidate.lastName} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" title={fullName}>{fullName}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground" title={interview.candidate.role}>{interview.candidate.role}</p>
      </div>
      <div className="ml-12 min-w-20 sm:ml-0">
        <p className="text-xs font-medium">{interview.scheduledFor}</p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{interview.timeLabel}</p>
      </div>
      <Button variant="outline" size="sm" aria-label={`${meeting.label} with ${fullName}`}>
        <MeetingIcon className="size-3.5" aria-hidden="true" />
        <span className="hidden lg:inline">{meeting.label}</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label={`More interview actions for ${fullName}`}>
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Reschedule interview</DropdownMenuItem>
          <DropdownMenuItem>View candidate</DropdownMenuItem>
          <DropdownMenuItem>Cancel interview</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}

export { InterviewRow };
