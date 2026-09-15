export enum StageCategory { APPLIED='applied', SCREENING='screening', INTERVIEW='interview', OFFER='offer', HIRED='hired', REJECTED='rejected', WITHDRAWN='withdrawn' }
export const TERMINAL_STAGE_CATEGORIES = [StageCategory.HIRED, StageCategory.REJECTED, StageCategory.WITHDRAWN];
