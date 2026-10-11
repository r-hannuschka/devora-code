import type { Command } from "@devora-code/api";
import { singleton } from "tsyringe";
import { LoggerService } from "@/core/logger";

/**
 * Der Vertrag für alle DevoraCode-Satelliten.
 * Jede Satelliten-Extension MUSS eine Klasse bereitstellen, die dieses Interface implementiert.
 */
export interface ISatelliteController {
  /**
   * Die eindeutige ID des Satelliten (z. B. 'JiraModule' oder 'GitHubModule').
   * Damit kann der Kern im Log oder UI anzeigen, welcher Satellit aktiv ist.
   */
  readonly id: string;

  /**
   * Die Command-Types die dieser Satellit bedient.
   * Der Core nutzt diese Liste um das Routing zu bauen.
   */
  readonly commands: readonly string[];

  /**
   * Der zentrale Eingangskanal für alle Befehle, die von der Host-Extension gesendet werden.
   *
   * @param command Der auszuführende Befehl.
   * @returns Ein Promise mit beliebigem Ergebnis.
   */
  handleHostCommand(command: Command): Promise<any>;
}

@singleton()
export class SatelliteService {
  private readonly satellites = new Map<string, ISatelliteController>();
  private readonly dispatchTable = new Map<string, ISatelliteController>();

  constructor(private readonly logger: LoggerService) {}

  /**
   * Registriert einen Satelliten.
   * Alle Commands des Satelliten werden automatisch der Dispatch-Tabelle hinzugefügt.
   */
  registerSatellite(satellite: ISatelliteController) {
    this.satellites.set(satellite.id, satellite);

    for (const cmd of satellite.commands) {
      if (this.dispatchTable.has(cmd)) {
        this.logger.warn(`[DevoraCode]: Command "${cmd}" wird bereits von einem anderen Satelliten bedient`);
      }
      this.dispatchTable.set(cmd, satellite);
    }

    this.logger.debug(`[DevoraCode]: Satellite "${satellite.id}" registriert mit ${satellite.commands.length} Commands`);
  }

  /**
   * Prüft ob ein Command von einem Satelliten bedient wird.
   */
  hasSatelliteForCommand(commandType: string): boolean {
    return this.dispatchTable.has(commandType);
  }

  /**
   * Liefert den Satelliten der für einen Command zuständig ist – oder null.
   */
  getSatelliteForCommand(commandType: string): ISatelliteController | null {
    return this.dispatchTable.get(commandType) ?? null;
  }
}
