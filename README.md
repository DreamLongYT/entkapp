# 📦 pkg-scaffold v3.0.0

**Enterprise-Grade AST Syntax Refactoring & Self-Healing Engine**

[![npm version](https://img.shields.io/npm/v/pkg-scaffold.svg?style=flat&color=CB3837)](https://www.npmjs.com/package/pkg-scaffold)
[![npm downloads](https://img.shields.io/npm/dm/pkg-scaffold.svg?style=flat&color=34ADFF)](https://www.npmjs.com/package/pkg-scaffold)
[![License](https://img.shields.io/badge/license-MIT-orange.svg?style=flat)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/DreamLongYT/pkg-scaffold.svg?style=flat&color=gold)](https://github.com/DreamLongYT/pkg-scaffold)

`pkg-scaffold` is an advanced, AST-driven tool designed to prune dead code, orphaned files, and unused exports from your JavaScript and TypeScript codebases with unprecedented safety. Unlike traditional linters, `pkg-scaffold` doesn't just report issues—it fixes them within a secure, transactional sandbox.

---

## 🚀 Key Features

- **AST-Based Deep Tracing**: Leverages the official TypeScript compiler to trace dependencies through complex barrel files, re-exports, and default export chains.
- **Automated Self-Healing**: Automatically runs your project's test suite after refactoring. If a regression is detected (non-zero exit code), it triggers an immediate rollback.
- **Transactional Safety**: All modifications occur in a Git-isolated sandbox with a backup journaling system. Your original state is always recoverable.
- **Interactive Optimization Plan**: Generates a detailed "dry-run" plan for user confirmation before any file is touched.
- **Suppression Engine**: Fine-grained control using `@scaffold-suppress` directives to protect specific files or exports from being pruned.

---

## ⚔️ Competitive Analysis: Why pkg-scaffold?

While tools like [Knip](https://knip.dev/) or [Depcheck](https://github.com/depcheck/depcheck) are excellent for reporting, `pkg-scaffold` is built for **automated architectural cleanup**.

| Feature | **pkg-scaffold** | Knip.dev | Depcheck | ts-prune |
| :--- | :---: | :---: | :---: | :---: |
| **Dead Code Detection** | ✅ AST-Deep | ✅ Comprehensive | ⚠️ Regex/Loose | ✅ Basic |
| **Automated Pruning** | ✅ Native | ⚠️ Experimental | ❌ No | ❌ No |
| **Self-Healing (Auto-Rollback)** | ✅ **Yes** | ❌ No | ❌ No | ❌ No |
| **Transaction Sandbox** | ✅ **Git + Journal** | ❌ No | ❌ No | ❌ No |
| **Interactive Approval** | ✅ **Yes** | ❌ No | ❌ No | ❌ No |
| **Barrel File Tracing** | ✅ High-Fidelity | ✅ Good | ❌ No | ⚠️ Limited |
| **Status** | 🚀 Active | 🚀 Active | 🛠️ Maintenance | 🛠️ Maintenance |

> **The Verdict:** `pkg-scaffold` wins when you need a **safe, automated workflow** that guarantees your project stays functional after cleaning up technical debt.

---

## 🛠️ Installation & Usage

### Installation
```bash
npm install -g pkg-scaffold
```

### Basic Usage (Dry-Run)
Analyze your project without making any changes:
```bash
pkg-scaffold --cwd ./my-project --no-fix
```

### Active Refactoring (Self-Healing)
Analyze, prune, and validate with automatic rollback on test failure:
```bash
pkg-scaffold --cwd ./my-project --fix --test-command "npm test"
```

### Options
| Flag | Description | Default |
| :--- | :--- | :--- |
| `--cwd <path>` | Execution context root directory | `process.cwd()` |
| `--fix` | Enable atomic code updates and pruning | `true` |
| `--test-command` | Script to run for self-healing validation | `npm test` |
| `--yes` | Skip confirmation prompts | `false` |
| `--verbose` | Toggle expanded debug telemetry | `false` |

---

## 🛡️ Suppression

Protect a file or a specific export from being removed:

```javascript
/**
 * @scaffold-suppress legacyFunction
 */
export const legacyFunction = () => {
  // This export is safe even if unused
};

/**
 * @scaffold-suppress
 */
// This entire file is protected from being flagged as orphaned
```

---

## 📜 License

MIT © DreamLongYT
