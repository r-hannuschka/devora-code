export type IssueType = "BUG" | "FEATURE";

export type IssueTypeMapping = Record<string, IssueType>;

export type IssueStatus = "TO_DO" | "IN_PROGRESS" | "TEST" | "DONE";

export type StatusMapping = Record<string, IssueStatus>;
