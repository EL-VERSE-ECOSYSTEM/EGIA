export type WebhookRecord = Record<string, unknown>;

export type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: "payments" | "results" | "attendance_records" | string;
  schema?: string;
  record?: WebhookRecord;
  old_record?: WebhookRecord;
  timestamp?: string;
};
