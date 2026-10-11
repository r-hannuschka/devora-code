/**
 * Detailansicht eines Jira-Issues.
 *
 * Enthält nur die Felder die wir tatsächlich im Frontend benötigen —
 * abgeleitet aus dem vollständigen JiraIssueDTO.
 *
 * Quelle: fields aus GET /rest/api/2/issue/{issueIdOrKey}
 */
export interface IssueDetail {
  /** Issue-Schlüssel (z. B. "ED-1") — aus top-level key */
  key: string;

  /** Zusammenfassung — fields.summary */
  summary: string;

  /** Beschreibung — fields.description */
  description: string | null;

  /** Issue-Typname (z. B. "Story", "Task") — fields.issuetype.name */
  issueType: string;

  /** Statusname (z. B. "In Progress") — fields.status.name */
  status: string;

  /** Übergeordnete Status-Kategorie (z. B. "In Progress") — fields.status.statusCategory.name */
  statusCategory: string;

  /** Prioritätsname (z. B. "High") — fields.priority.name */
  priority: string | null;

  /** Zugeteilter Benutzer — fields.assignee.displayName */
  assignee: string | null;

  /** Fälligkeitsdatum — fields.duedate */
  dueDate: string | null;

  /** Verstrichene Zeit in Sekunden — fields.timetracking.timeSpentSeconds */
  timeSpentSeconds: number;

  /** Verbleibende Zeit in Sekunden — fields.timetracking.remainingEstimateSeconds */
  remainingTimeSeconds: number;

  /** Jira-Browse-URL (wird aus baseUrl + key berechnet, nicht direkt aus API) */
  url: string;
}
