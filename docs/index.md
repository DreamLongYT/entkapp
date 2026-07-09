---
layout: home

hero:
  name: entkapp v5.6.0
  text: The Ultimate Hybrid Engine
  tagline: Solving what Knip cannot.
  image:
    src: /logo.png
    alt: entkapp
  actions:
    - theme: brand
      text: Get Started
      link: /guide
    - theme: alt
      text: View on GitHub
      link: https://github.com/DreamLongYT/entkapp

features:
  - title: Comprehensive Analysis
    details: Detect unused files, exports, and dependencies with precision. Supports monorepos and workspace protocols.
  - title: Self-Healing
    details: Automatically fix issues with intelligent refactoring, including backups and rollbacks via Git.
  - title: Type-Aware
    details: Full TypeScript support with type-safe refactoring. Understands complex type patterns.
  - title: Plugin Ecosystem
    details: Extensible architecture supporting custom plugins and full compatibility with Knip plugins.
  - title: Headless API
    details: Programmatic interface for seamless integration into CI/CD pipelines and custom workflows.
  - title: Security Scanning
    details: Detect hardcoded secrets, API keys, and sensitive data automatically during analysis.
---

# entkapp v5.6.0 - Die ultimative Codebase-Wartung

`entkapp` ist ein hochleistungsfähiges, framework-agnostisches Tool zur Analyse und Optimierung von JavaScript- und TypeScript-Codebasen. Es wurde entwickelt, um ungenutzten Code, zirkuläre Abhängigkeiten und hartkodierte Geheimnisse zu identifizieren und zu beheben, wodurch die Codequalität, Wartbarkeit und Sicherheit erheblich verbessert werden.

## 🚀 Kernfunktionen

- **Umfassende Dead-Code-Erkennung:** Identifiziert ungenutzte Dateien, Exporte und Abhängigkeiten.
- **Zirkuläre Abhängigkeitsanalyse:** Erkennt und visualisiert zirkuläre Abhängigkeiten, die zu Laufzeitproblemen führen können.
- **Geheimnis-Scanning:** Scannt die Codebasis nach hartkodierten Geheimnissen und sensiblen Informationen.
- **Framework-Agnostisch:** Funktioniert nahtlos mit verschiedenen JavaScript-Frameworks und -Bibliotheken, ohne spezielle Konfigurationen.
- **Monorepo-Unterstützung:** Optimiert für die Analyse komplexer Monorepo-Strukturen.
- **Windows-Kompatibilität:** Volle Unterstützung und Stabilität auf Windows-, macOS- und Linux-Systemen.
- **ESM/CJS Hybrid-Support:** Kompatibel mit modernen ESM-Modulen und älteren CommonJS-Umgebungen.
- **Hohe Performance:** Nutzt native Rust-basierte Parser (OXC) und Worker-Threads für blitzschnelle Analysen.

## ✨ Warum entkapp?

In modernen JavaScript-Projekten, insbesondere in großen Monorepos, kann sich ungenutzter Code ansammeln, was zu größeren Bundle-Größen, längeren Build-Zeiten und einer erhöhten Komplexität führt. `entkapp` bietet eine überlegene Lösung im Vergleich zu anderen Tools wie Knip, indem es eine tiefere, heuristische Analyse durchführt, die nicht auf statische Konfigurationen angewiesen ist. Es erkennt dynamische Imports, Side-Effects und Bootstrap-Muster, um eine präzisere und zuverlässigere Code-Optimierung zu gewährleisten.

## 🛠️ Installation

Um `entkapp` in Ihrem Projekt zu verwenden, navigieren Sie zu Ihrem Projektstammverzeichnis und führen Sie den folgenden Befehl aus:

```bash
npm install entkapp
# oder
yarn add entkapp
# oder
pnpm add entkapp
```

## 💡 Erste Schritte

Nach der Installation können Sie `entkapp` direkt über die Kommandozeile ausführen. Navigieren Sie in Ihr Projektverzeichnis und starten Sie die Analyse:

```bash
npx entkapp -r
```

Dies führt eine Dry-Run-Analyse durch und zeigt einen Bericht über potenzielle Optimierungen an. Für automatische Korrekturen verwenden Sie die `--fix`-Option:

```bash
npx entkapp -r --fix
```

Weitere Informationen zu den Befehlen und Optionen finden Sie in der [Nutzungsanleitung](./usage.md).

---

## Community & Support

- **GitHub**: [DreamLongYT/entkapp](https://github.com/DreamLongYT/entkapp)
- **NPM**: [entkapp](https://www.npmjs.com/package/entkapp)
- **License**: Apache-2.0 (The original code was from the lovely DreamLong)
