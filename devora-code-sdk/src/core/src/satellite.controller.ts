import type { Command } from "@devora-code/api";

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
