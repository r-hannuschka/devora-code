"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternalStatus = exports.InternalIssueType = void 0;
var InternalIssueType;
(function (InternalIssueType) {
    InternalIssueType["Bug"] = "BUG";
    InternalIssueType["Task"] = "TASK";
    InternalIssueType["Subtask"] = "SUBTASK";
    InternalIssueType["Story"] = "STORY";
    InternalIssueType["Epic"] = "EPIC";
    InternalIssueType["Unknown"] = "UNKNOWN_TASK";
})(InternalIssueType || (exports.InternalIssueType = InternalIssueType = {}));
var InternalStatus;
(function (InternalStatus) {
    InternalStatus["ToDo"] = "TO_DO";
    InternalStatus["InProgress"] = "IN_PROGRESS";
    InternalStatus["Done"] = "DONE";
    InternalStatus["Unknown"] = "UNKNOWN_STATUS";
})(InternalStatus || (exports.InternalStatus = InternalStatus = {}));
//# sourceMappingURL=enums.js.map