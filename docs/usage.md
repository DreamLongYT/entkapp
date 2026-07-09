# Usage Guide

`entkapp` provides a powerful command-line interface (CLI) for analyzing and optimizing your codebase. Here is a detailed overview of the available commands and options.

## 🚀 Basic Commands

### `npx entkapp -r` (Dry Run)

Analyzes your codebase and generates a report on potential optimizations without making any changes to your files. This is the recommended first step to understand the impact of `entkapp`.

```bash
npx entkapp -r
```

### `npx entkapp -r --fix` (Automatic Fixes)

Analyzes the codebase and automatically applies all identified optimizations. This includes removing unused files, exports, and dependencies. It is strongly recommended to back up your project or use Git before running this option.

```bash
npx entkapp -r --fix
```

## ⚙️ Options

The following options can be combined with the basic commands:

| Option | Description | Default Value |
| :----- | :----------- | :----------- |
| `-c, --cwd <path>` | Specifies the root directory of the project to be processed. | Current working directory |
| `-d, --debug` | Enables detailed debug output for development and troubleshooting. | `false` |
| `--fix` | Enables automatic code updates and structural changes. | `false` |
| `--tsconfig <filename>` | Specifies the path to a custom `tsconfig.json`. | `tsconfig.json` |
| `--test-command <command>` | Defines the command used to run tests for validation after changes. | `npm test` |
| `--workspace` | Enables analysis for monorepo workspaces. | `false` |
| `--verbose` | Enables extended telemetry output for detailed diagnostics. | `false` |
| `--visualize` | Generates an interactive visualization of the execution graph. | `false` |
| `-y, --yes` | Skips confirmation prompts and automatically executes planned changes. | `false` |
| `--timeout <ms>` | Sets an execution timeout in milliseconds. | `30000` (30 seconds) |

## 💡 Examples

### Analyze a monorepo

```bash
npx entkapp -r --workspace --cwd ./my-monorepo
```

### Detailed debug output with fix mode

```bash
npx entkapp -r --fix --debug --verbose
```

### Custom test commands

```bash
npx entkapp -r --fix --test-command "yarn test --ci"
```

## ⚠️ Important Notes

- **Backups:** Always back up your codebase before running `entkapp` with the `--fix` option.
- **Git Integration:** `entkapp` is designed to work well with Git. Changes can easily be reverted.
- **Performance:** For very large projects, the initial analysis may take some time. Subsequent analyses benefit from caching mechanisms.