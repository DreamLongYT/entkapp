# Level: Normal
Standard project structure. Most engines should handle this.

## Challenges:
1. Detect `unusedService` in `src/services/main.ts`.
2. Detect `UNUSED_CONSTANT` in `src/constants.ts`.
3. Detect the re-exported `unusedValue` in `src/utils/helper.ts`.
4. Detect `anotherUnusedValue` in `src/utils/data.ts`.
5. Identify `axios` and `lodash` as unused dependencies.

## 🚀 Launching Engines

You can run the engines directly in the terminal (e.g., on StackBlitz). Here are the commands for the Zero-Config stress test:

### entkapp (Aggressive Refactoring Approach)
Use the `@latest` tag to test the newest version. The `-r` (run) parameter starts the analysis, and `--no-fix` prevents direct file modifications (dry-run).

```bash
npx entkapp@latest -r --no-fix
```

### knip (Precision Analysis Approach)
Knip searches for unused files, exports, and dependencies.

```bash
# Basic analysis
npx knip

# Detailed analysis including unused exports
npx knip --exports
```
