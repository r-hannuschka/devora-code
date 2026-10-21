/**
 * Liste-Item mit zusätzlichen renderedFields — für den fokussierten Detailansatz
 *
 * Im Gegensatz zu IssueListItemDTO enthält dieses Interface
 * gerenderte (HTML-formatierte) Felder, insbesondere die vollständige
 * Beschreibung und detailliertes TimeTracking.
 */

import type { IssueListItemDTO } from "./jira-issue-list.dto";

export interface FocusedIssueDTO extends IssueListItemDTO {
  renderedFields: {
    description: string | null;
    timetracking: {
      originalEstimate: string | null;
      originalEstimateSeconds: number | null;
      remainingEstimate: string | null;
      remainingEstimateSeconds: number | null;
      timeSpent: string | null;
      timeSpentSeconds: number | null;
    };
  };
}
