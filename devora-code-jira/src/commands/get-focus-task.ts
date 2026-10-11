import { RegisterCommand, CommandHandler } from "@devora-code/sdk/command";
import type { FocusedIssue } from "@devora-code/api";

@RegisterCommand("focus:get-task")
export class FetchFocusTaskHandler implements CommandHandler<FocusedIssue | null> {

  async execute(): Promise<FocusedIssue | null> {
    // TODO: Implement
    return null;
  }
}