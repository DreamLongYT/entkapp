---
layout: home

hero:
  name: "pkg-scaffold"
  text: "AST-driven Refactoring & Self-Healing Engine"
  tagline: "Optimize your codebase with precise AST analysis and automated cleanup."
  actions:
    - theme: brand
      text: Get Started
      link: /guide
    - theme: alt
      text: View on GitHub
      link: https://github.com/DreamLongYT/pkg-scaffold

features:
  - title: AST-Driven Analysis
    details: pkg-scaffold leverages Abstract Syntax Trees (ASTs) for deep and precise analysis of your codebase, identifying unused structures and optimization potentials.
  - title: Intelligent Refactoring
    details: Automatic detection and pruning of orphaned files and dead code to improve the maintainability and performance of your project.
  - title: Dry-Run Mode
    details: Preview all proposed structural changes before they are actually applied, ensuring maximum control and safety.
  - title: Monorepo Support
    details: Optimized for complex project structures and monorepos, ensuring consistent code quality across multiple packages.
  - title: Integrated Test Validation
    details: Executes integrated tests after each modification to verify workspace integrity and prevent regressions.
  - title: Seamless Integration
    details: As a CLI tool, pkg-scaffold integrates effortlessly into existing CI/CD workflows and development environments.
---


# Welcome to pkg-scaffold

pkg-scaffold is a powerful command-line tool designed to enhance the health and efficiency of your JavaScript and TypeScript projects. By utilizing an advanced AST engine, it identifies and fixes structural issues, optimizes dependencies, and ensures a clean and maintainable codebase.

Whether you are working on a small project or a large monorepo, pkg-scaffold helps streamline your development experience and secure the quality of your code.

## pkg-scaffold vs. Knip.dev vs. ts-prune

While tools like Knip.dev and ts-prune are excellent for specific tasks, pkg-scaffold offers a unique approach with its AST-driven refactoring and self-healing capabilities. Here's how it compares:

| Feature / Tool       | pkg-scaffold                                   | Knip.dev                                     | ts-prune                                   |
| :------------------- | :--------------------------------------------- | :------------------------------------------- | :----------------------------------------- |
| **Primary Focus**    | Structural Refactoring, Self-Healing, Orphaned Files | Unused Dependencies, Exports, Files          | Unused Exports                             |
| **Analysis Method**  | AST-driven, Deep Structural Analysis           | Deep Analysis with fine-grained entry points | TypeScript Compiler API                    |
| **Unused Dependencies** | Limited (focus on structural usage)            | Yes (very detailed)                          | No                                         |
| **Unused Exports**   | No (currently)                                 | Yes                                          | Yes                                        |
| **Orphaned Files**   | Yes (core feature)                             | Yes                                          | No                                         |
| **Automated Fixes**  | Yes (`--fix` option)                           | Yes                                          | No (reporting only)                        |
| **Monorepo Support** | Yes                                            | Yes                                          | Limited                                    |
| **Integrated Test Validation** | Yes (post-fix)                                 | No                                           | No                                         |
| **Key Advantage**    | **Proactive structural integrity, self-healing, prevents file bloat.** | **Comprehensive dependency/export cleanup, excellent for bundle size.** | **Simple, fast unused export detection for TS.** |

### Where pkg-scaffold excels:

pkg-scaffold shines in maintaining the **structural integrity** of your project. Unlike Knip.dev, which focuses heavily on unused dependencies and exports (often for bundle size optimization), pkg-scaffold's core strength lies in:

*   **Orphaned File Detection & Pruning:** It actively identifies and removes files that are no longer referenced anywhere in your codebase, preventing file system bloat and confusion.
*   **AST-driven Self-Healing:** Its deep AST analysis allows for more intelligent structural refactoring, ensuring that your project's architecture remains sound over time.
*   **Integrated Safety:** By running tests post-fix, it provides an additional layer of confidence that automated changes haven't introduced regressions.

While Knip.dev is superior for finding unused `package.json` dependencies and exports, pkg-scaffold complements it by focusing on the physical file structure and overall project health. ts-prune is a simpler tool specifically for TypeScript unused exports.

Start optimizing your projects today! Head over to the [Getting Started Guide](/guide) to learn more.
