export interface TimeTrackerConfig {
  apiUrl: string;
  userName: string;

  // Der Key ist z.B. "In Bearbeitung" (String), der Value ist "IN_PROGRESS"
  statusMapping: Record<string, string>;
  issueTypeMapping: Record<string, string>;
}