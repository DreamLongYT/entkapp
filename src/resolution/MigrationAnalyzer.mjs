/**
 * ============================================================================
 * Migration Path Analyzer v5.1.0
 * ============================================================================
 * Suggests modern alternatives for legacy tools and frameworks.
 */
export class MigrationAnalyzer {
  constructor(context) {
    this.context = context;
    this.migrations = [
      { 
        legacy: 'webpack', 
        modern: 'vite', 
        reason: 'Vite offers significantly faster HMR and build times using ES modules during development.' 
      },
      { 
        legacy: 'jest', 
        modern: 'vitest', 
        reason: 'Vitest is faster, has native ESM support, and shares configuration with Vite.' 
      },
      { 
        legacy: 'moment', 
        modern: 'dayjs', 
        reason: 'Day.js is a 2KB alternative to Moment.js with the same modern API.' 
      },
      { 
        legacy: 'axios', 
        modern: 'fetch', 
        reason: 'Native fetch is now widely supported and requires no external dependency for simple use cases.' 
      },
      { 
        legacy: 'ts-node', 
        modern: 'tsx', 
        reason: 'tsx is faster and has better ESM support for running TypeScript files.' 
      },
      {
        legacy: 'eslint-plugin-prettier',
        modern: 'eslint-config-prettier',
        reason: 'Running Prettier as an ESLint rule is slow. It is recommended to run them separately or use a config that turns off conflicting rules.'
      }
    ];
  }

  async analyze(activePlugins) {
    const suggestions = [];
    const activeNames = activePlugins.map(p => p.name);

    for (const m of this.migrations) {
      if (activeNames.includes(m.legacy)) {
        suggestions.push({
          from: m.legacy,
          to: m.modern,
          message: `Migration Suggestion: Consider moving from "${m.legacy}" to "${m.modern}". ${m.reason}`
        });
      }
    }
    
    return suggestions;
  }
}
