export const MATCHING_QUEUE = 'matching';
export const NOTIFICATIONS_QUEUE = 'notifications';

export const MATCHING_JOBS = {
  RECALC_DEMAND: 'RECALC_DEMAND',
  RECALC_PROPERTY: 'RECALC_PROPERTY',
} as const;

export const NOTIFICATION_JOBS = {
  SEND_PUSH: 'SEND_PUSH',
} as const;
