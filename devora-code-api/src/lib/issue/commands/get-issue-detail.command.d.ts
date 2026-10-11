import type { Command } from "../../core";
/** Issue-Details – Ticket-Key */
export interface IssuesDetailPayload {
    key: string;
}
export type GetIssueDetailCommand = Command<"issues:get-detail", IssuesDetailPayload>;
//# sourceMappingURL=get-issue-detail.command.d.ts.map