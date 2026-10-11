import axios, { type AxiosInstance } from "axios";
import { singleton } from "tsyringe";
import { SettingsService } from "../settings";

@singleton()
export class JiraApiClient {
  private readonly client: AxiosInstance;

  constructor(private readonly settings: SettingsService) {
    this.client = this.createClient();
    this.registerResponseInterceptors();
  }

  private createClient() {
    const baseUrl = this.settings.get("JIRA_API_URL");
    const userName = this.settings.get("JIRA_USER_NAME");
    const token = this.settings.get("JIRA_API_TOKEN");

    if (!userName || !token) {
      throw new Error("Fehlt was");
    }

    return axios.create({
      baseURL: `${baseUrl}/rest/api/2`,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
  }

  private registerResponseInterceptors() {
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;

        const errorDetails = [
          `[${this.getUserMessage(status)}]`,
          `URL: ${error.config?.url}`,
          `Method: ${error.config?.method}`,
          `Status: ${status}`,
          `Data: ${error.response?.data}`,
        ].join("\n");

        return Promise.reject(new Error(errorDetails));
      },
    );
  }

  private getUserMessage(status: number): string {
    switch (status) {
      case 401:
        return "Jira-Token ungültig oder abgelaufen";
      case 403:
        return "Keine Berechtigung für diese Jira-Operation";
      case 404:
        return "Ressource in Jira nicht gefunden";
      default:
        return "Jira-Anfrage fehlgeschlagen";
    }
  }

  async post<TResponse = unknown>(path: string, body: Record<string, unknown>): Promise<TResponse> {
    const response = await this.client.post(path, body);
    return response.data;
  }

  async get<TResponse = unknown>(path: string): Promise<TResponse> {
    const response = await this.client.get(path);
    return response.data;
  }
}
