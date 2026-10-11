/**
 * Single Issue Response — GET /rest/api/2/issue/{issueIdOrKey}
 *
 * Exaktes TypeScript-Mapping des echten Jira REST API v2 JSON-Responses.
 * Basis: live Response für Issue ED-1 (id 10002).
 */

export interface JiraIssueDTO {
  expand?: string;
  id: string;
  self: string;
  key: string;
  fields: JiraIssueFields;
}

/* ──────────────────────────────────────────────────────────────
 * Top-Level Issue Fields
 * ────────────────────────────────────────────────────────────── */

export interface JiraIssueFields {
  issuetype:        JiraIssueType;
  summary:          string;
  description:      string | null;
  status?:          JiraStatus | null;
  priority?:        JiraPriority | null;
  assignee?:        JiraAccount | null;
  reporter:         JiraAccount;
  created:          string;
  updated:          string;
  duedate?:         string | null;
  resolution?:      JiraResolution | null;
  resolutiondate?:  string | null;
  labels?:          string[];
  components?:      JiraComponent[];

  timetracking:     JiraTimeTracking;
  project:          JiraProject;
  watcher:          JiraWatcher;
  "sub-tasks"?:     JiraSubTask[];
  attachment?:      JiraAttachment[];
  comment?:         JiraCommentWrapper;
  issuelinks?:      JiraIssueLink[];
  worklog?:         JiraWorklogWrapper;

  /** Catch-all für beliebige weitere Felder (Custom Fields etc.) */
  [key: string]: unknown;
}

/* ──────────────────────────────────────────────────────────────
 * Value Types
 * ────────────────────────────────────────────────────────────── */

export interface JiraIssueType {
  self:    string;
  id:      string;
  name:    string;
  subtask: boolean;
  iconUrl: string;
}

export interface JiraStatus {
  self:        string;
  id:          string;
  name:        string;
  color?:      string;
  iconUrl?:   string;
  statusCategory: {
    id:    number;
    key:   string;
    name:  string;
    colorName: string;
  };
}

export interface JiraPriority {
  self:    string;
  id:      string;
  name:    string;
  iconUrl: string;
}

export interface JiraResolution {
  self:    string;
  id:      string;
  name:    string;
  description?: string;
}

export interface JiraComponent {
  self:   string;
  id:     string;
  name:   string;
  description?: string;
}

/** Standard Jira Benutzer-Objekt (Account-based API v2) */
export interface JiraAccount {
  self:            string;
  accountId:       string;
  accountType:     "atlassian" | "app" | string;
  active:          boolean;
  displayName:     string;
  avatarUrls: {
    "16x16":  string;
    "24x24":  string;
    "32x32":  string;
    "48x48":  string;
  };
  // Felder können in manchen Kontexten fehlen (z. B. user-legacy IDs)
  key?:   string;
  name?:  string;
}

/* ──────────────────────────────────────────────────────────────
 * Time Tracking
 * ────────────────────────────────────────────────────────────── */

export interface JiraTimeTracking {
  originalEstimate?:        string;
  originalEstimateSeconds?: number;
  remainingEstimate?:       string;
  remainingEstimateSeconds?: number;
  timeSpent?:               string;
  timeSpentSeconds?:        number;
}

/* ──────────────────────────────────────────────────────────────
 * Project
 * ────────────────────────────────────────────────────────────── */

export interface JiraProject {
  self:        string;
  id:          string;
  key:         string;
  name:        string;
  avatarUrls:  {
    "16x16":  string;
    "24x24":  string;
    "32x32":  string;
    "48x48":  string;
  };
  simplified:      boolean;
  style:           string;
  projectCategory?: JiraProjectCategory;
  insight?:       JiraProjectInsight;
}

export interface JiraProjectCategory {
  self:        string;
  id:          string;
  name:        string;
  description: string;
}

export interface JiraProjectInsight {
  lastIssueUpdateTime: string;
  totalIssueCount:     number;
}

/* ──────────────────────────────────────────────────────────────
 * Watcher (nie Array, immer Objekt)
 * ────────────────────────────────────────────────────────────── */

export interface JiraWatcher {
  self:       string;
  watchCount: number;
  isWatching: boolean;
}

/* ──────────────────────────────────────────────────────────────
 * Sub-Tasks
 * ──────────────────────────────────────────────────────────────
 * Pfad: fields["sub-tasks"]
 * Jedes Element enthält den Typ der Link-Beziehung UND die
 * Referenz zum Sub-Issue über outwardIssue.
 * ────────────────────────────────────────────────────────────── */

export interface JiraSubTask {
  id:           string;
  type:         JiraIssueLinkType;
  outwardIssue?: JiraLinkIssueRef;
  inwardIssue?:  JiraLinkIssueRef;
}

/* ──────────────────────────────────────────────────────────────
 * Attachments
 * ────────────────────────────────────────────────────────────── */

export interface JiraAttachment {
  self:       string;
  id:         number;
  filename:   string;
  author:     JiraAccount;
  created:    string;
  size:       number;
  mimeType:   string;
  content:    string;  // URL zum Download
  thumbnail?: string;  // existiert bei bildern
}

/* ──────────────────────────────────────────────────────────────
 * Comments — wrapper + items
 * ──────────────────────────────────────────────────────────────
 * Pfad: fields.comment
 * Das API liefert ein Objekt { self, total, comments[] }, NICHT
 * direkt ein Array.
 * ────────────────────────────────────────────────────────────── */

export interface JiraCommentWrapper {
  self:     string;
  maxResults: number;
  total:    number;
  comments: JiraComment[];
}

export interface JiraComment {
  self:         string;
  id:           string;
  body:         string;
  author:       JiraAccount;
  created:      string;
  updated:      string;
  updateAuthor?: JiraAccount;
  visibility?:   JiraVisibility;
}

/* ──────────────────────────────────────────────────────────────
 * Issue Links
 * ──────────────────────────────────────────────────────────────
 * Pfad: fields.issuelinks
 * Jeder Link hat einen type (inward/outward name) und genau
 * eine der beiden Richtungen: inwardIssue ODER outwardIssue.
 * ────────────────────────────────────────────────────────────── */

export interface JiraIssueLink {
  id:           string;
  type:         JiraIssueLinkType;
  inwardIssue?:  JiraLinkIssueRef | null;
  outwardIssue?: JiraLinkIssueRef | null;
}

export interface JiraIssueLinkType {
  id:       string;
  name:     string;
  inward:   string;   // z. B. "is depended by"
  outward:  string;   // z. B. "depends on"
}

/** Referenz auf ein Issue ohne vollständige Felder */
export interface JiraLinkIssueRef {
  id:     string;
  key:    string;
  self:   string;
  // optional: die Status-Info die Jira oft mitliefert
  fields?: {
    status?: {
      name:     string;
      iconUrl?: string;
    };
    issuetype?: {
      name: string;
      iconUrl?: string;
    };
  };
}

/* ──────────────────────────────────────────────────────────────
 * Worklogs — wrapper + items
 * ──────────────────────────────────────────────────────────────
 * Pfad: fields.worklog
 * Wie comments: { self, total, worklogs[] }, kein plain Array.
 * ────────────────────────────────────────────────────────────── */

export interface JiraWorklogWrapper {
  self:       string;
  maxResults: number;
  total:      number;
  worklogs:   JiraWorklog[];
}

export interface JiraWorklog {
  self:           string;
  id:             string;
  issueId:        string;
  author:         JiraAccount;
  comment:        string;
  started:        string;
  updated:        string;
  timeSpent:      string;       // z. B. "3h 20m"
  timeSpentSeconds: number;
  updateAuthor?:   JiraAccount;
  visibility?:     JiraVisibility;
}

/* ──────────────────────────────────────────────────────────────
 * Visibility Filter
 * ────────────────────────────────────────────────────────────── */

export interface JiraVisibility {
  type:       "role" | "group" | string;
  identifier: string;   // role name oder group name
  value:      string;   // Identifikator
}
