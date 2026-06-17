# Static Analysis Nightmare: Zero-Config Stress Test

This document analyzes the behavior of **entkapp** (v4.3.0) and **knip** (v5.88.1) in an extremely complex TypeScript project **without providing any configuration files** (`knip.config.ts` or `entkapp.config.ts`). The goal was to test the engines' heuristics when left to their own devices.

## Background

The project (`nightmare-project`) includes 79 TypeScript files with deep circular dependencies, dynamic exports, massive barrel files, and ghost code. Configuration files were removed, forcing both tools to identify the entry point (`src/index.ts`) and analyze the project structure independently.

## Zero-Config Analysis Results

### 1. Circular Dependencies

- **entkapp 4.3.0**: Successfully detected **9** circular dependency chains. Its heuristics proved extremely robust, finding the exact same 9 cycles as it did with configuration. It built the full graph and identified cycles accurately.
- **knip v5**: By default, Knip focuses on unused code and exports and does not provide deep circular dependency detection.

### 2. Unused Files (Dead Files)

- **entkapp 4.3.0**: Identified **26 orphaned files**, identical to the run with configuration. It automatically identified the entry point (`src/index.ts`) correctly.
- **knip v5**: Identified **33 unused files**. Without configuration, Knip found 4 additional unused files compared to the configured run (29 files). These were from the `src/legacy/` directory, which was previously ignored via configuration.

### 3. Unused Exports

- **entkapp 4.3.0**: Reported **152 unused named exports**, identical to the configured run.
- **knip v5**: Reported **25 unused exports** and **13 unused types**. This is a significant drop from the configured run (125 exports and 7 types). Without explicit entry points, Knip applies a more conservative heuristic to avoid false positives.

## Conclusion

The Zero-Config stress test reveals distinct differences in heuristics:

**entkapp 4.3.0** performs almost identically with or without configuration. It has very strong heuristics for finding the project entry point and traversing the dependency graph.

**knip v5** changes its behavior without configuration. While it became more accurate regarding unused files (due to the absence of ignore rules), its export analysis became much more conservative. It explicitly suggests creating a configuration file for full precision.

In summary, **entkapp** is more aggressive and comprehensive "out of the box," while **knip** prefers explicit configuration to unlock its full potential for export analysis.
