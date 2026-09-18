import { Interview } from '../entities/interview.entity';
export interface CalendarProvider {
  readonly name: string;
  createEvent(interview: Interview): Promise<string>;
  updateEvent(interview: Interview): Promise<void>;
  cancelEvent(interview: Interview): Promise<void>;
}
export const CALENDAR_PROVIDERS = Symbol('CALENDAR_PROVIDERS');
export class InternalCalendarProvider implements CalendarProvider {
  readonly name = 'internal';
  createEvent(interview: Interview) {
    return Promise.resolve(`internal:${interview.id}`);
  }
  updateEvent() {
    return Promise.resolve();
  }
  cancelEvent() {
    return Promise.resolve();
  }
}
