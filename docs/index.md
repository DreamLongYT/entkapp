---
layout: home

hero:
  name: entkapp v5.7.0
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

# entkapp v5.7.0 – Ultimate Codebase Maintenance

`entkapp` is a high-performance, framework-agnostic tool for analyzing and optimizing JavaScript and TypeScript codebases. It is designed to identify and resolve unused code, circular dependencies, and hard-coded secrets, thereby significantly improving code quality, maintainability, and security.

## 🚀 Key Features

- **Comprehensive Dead Code Detection:** Identifies unused files, exports, and dependencies.
- **Circular Dependency Analysis:** Detects and visualizes circular dependencies that can lead to runtime issues.
- **Secret Scanning:** Scans the codebase for hard-coded secrets and sensitive information.
- **Framework-Agnostic:** Works seamlessly with various JavaScript frameworks and libraries without requiring special configurations.
- **Monorepo Support:** Optimized for analyzing complex monorepo structures.
- **Windows Compatibility:** Full support and stability on Windows, macOS, and Linux systems.
- **ESM/CJS Hybrid Support:** Compatible with modern ESM modules and legacy CommonJS environments.
- **High Performance:** Leverages native Rust-based parsers (OXC) and worker threads for lightning-fast analysis.

## ✨ Why entkapp?

In modern JavaScript projects—especially large monorepos—unused code can accumulate, leading to larger bundle sizes, longer build times, and increased complexity. `entkapp` offers a superior solution compared to other tools like Knip by performing a deeper, heuristic analysis that does not rely on static configurations. It detects dynamic imports, side effects, and bootstrap patterns to ensure more precise and reliable code optimization.

## 🛠️ Installation

To use `entkapp` in your project, navigate to your project root directory and run the following command:

```bash
npm install entkapp
# or
yarn add entkapp
# or
pnpm add entkapp
```

## 💡 Getting Started

After installation, you can run `entkapp` directly from the command line. Navigate to your project directory and start the analysis:

```bash
npx entkapp -r
```

This performs a dry-run analysis and displays a report on potential optimizations. To apply automatic fixes, use the `--fix` option:

```bash
npx entkapp -r --fix
```

For more information on commands and options, please refer to the [usage guide](./usage.md).

---

## Community & Support

- **GitHub**: [DreamLongYT/entkapp](https://github.com/DreamLongYT/entkapp)
- **NPM**: [entkapp](https://www.npmjs.com/package/entkapp)
- **License**: Apache-2.0 (The original code was from the lovely DreamLong)