# Level 2: Normal Mono-Repo - Exact Metrics

| Metric | Exact Number |
| :--- | :--- |
| **Unused Files** | **88** |
| **Unused Exports** | **180** |
| **Unused Dependencies** | **0** |

## Details
- **Total Files**: 90.
- **Unused Files Breakdown**: 29 in `lib-a`, 29 in `lib-b`, 30 in `app` (excluding index files).
- **Unused Exports Breakdown**: 180 total across all workspaces and re-exports.
- **Key Challenge**: Circular dependency between `lib-a` and `lib-b`.
