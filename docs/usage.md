# Nutzungsanleitung

`entkapp` bietet eine leistungsstarke Kommandozeilen-Schnittstelle (CLI) zur Analyse und Optimierung Ihrer Codebasis. Hier finden Sie eine detaillierte Übersicht über die verfügbaren Befehle und Optionen.

## 🚀 Grundlegende Befehle

### `npx entkapp -r` (Dry-Run)

Führt eine Analyse Ihrer Codebasis durch und generiert einen Bericht über potenzielle Optimierungen, ohne Änderungen an Ihren Dateien vorzunehmen. Dies ist der empfohlene erste Schritt, um die Auswirkungen von `entkapp` zu verstehen.

```bash
npx entkapp -r
```

### `npx entkapp -r --fix` (Automatisches Fixen)

Führt eine Analyse durch und wendet alle identifizierten Optimierungen automatisch an. Dies umfasst das Entfernen von ungenutzten Dateien, Exporten und Abhängigkeiten. Es wird dringend empfohlen, vor der Ausführung dieser Option ein Backup Ihres Projekts zu erstellen oder Git zu verwenden.

```bash
npx entkapp -r --fix
```

## ⚙️ Optionen

Die folgenden Optionen können mit den grundlegenden Befehlen kombiniert werden:

| Option | Beschreibung | Standardwert |
| :----- | :----------- | :----------- |
| `-c, --cwd <path>` | Gibt das Stammverzeichnis des auszuführenden Projekts an. | Aktuelles Arbeitsverzeichnis |
| `-d, --debug` | Aktiviert detaillierte Debug-Ausgaben für die Entwicklung und Fehlerbehebung. | `false` |
| `--fix` | Aktiviert den Modus für automatische Code-Updates und strukturelle Änderungen. | `false` |
| `--tsconfig <filename>` | Gibt den Pfad zu einer benutzerdefinierten `tsconfig.json` an. | `tsconfig.json` |
| `--test-command <command>` | Definiert den Befehl zum Ausführen von Tests zur Validierung nach Änderungen. | `npm test` |
| `--workspace` | Aktiviert die Analyse für Monorepo-Workspaces. | `false` |
| `--verbose` | Aktiviert erweiterte Telemetrie-Ausgaben für detaillierte Diagnosen. | `false` |
| `--visualize` | Generiert eine interaktive Visualisierung des Ausführungsdiagramms. | `false` |
| `-y, --yes` | Überspringt Bestätigungsaufforderungen und führt geplante Änderungen automatisch aus. | `false` |
| `--timeout <ms>` | Setzt ein Timeout für die Ausführung in Millisekunden. | `30000` (30 Sekunden) |

## 💡 Beispiele

### Monorepo analysieren

```bash
npx entkapp -r --workspace --cwd ./mein-monorepo
```

### Detaillierte Debug-Ausgabe mit Fix-Modus

```bash
npx entkapp -r --fix --debug --verbose
```

### Benutzerdefinierte Testbefehle

```bash
npx entkapp -r --fix --test-command "yarn test --ci"
```

## ⚠️ Wichtige Hinweise

- **Backups:** Führen Sie immer ein Backup Ihrer Codebasis durch, bevor Sie `entkapp` mit der `--fix`-Option ausführen.
- **Git-Integration:** `entkapp` ist so konzipiert, dass es gut mit Git zusammenarbeitet. Änderungen können leicht rückgängig gemacht werden.
- **Performance:** Bei sehr großen Projekten kann die erste Analyse einige Zeit in Anspruch nehmen. Nachfolgende Analysen profitieren von Caching-Mechanismen.
