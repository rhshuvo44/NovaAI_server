export interface EmailJobPayload {
  to: string;
  subject: string;
  template: 'verification' | 'password-reset' | 'welcome' | 'notification';
  variables: Record<string, string>;
}

export interface NotificationJobPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface AIProcessingJobPayload {
  userId: string;
  feature: string;
  payload: Record<string, unknown>;
}

export interface ScheduledJobPayload {
  jobType: string;
  payload: Record<string, unknown>;
}

export interface DeadLetterJobPayload {
  originalQueue: string;
  originalJobId: string;
  failedReason: string;
  payload: unknown;
}
