import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import ansis from 'ansis';
import { Initializer } from './src/Initializer.js';
import { EngineContext } from './src/EngineContext.js';
import { EntkappEngine } from './src/index.js';

/**
 * entkapp Ultimate v5.2.0
 * The main interactive entry point that orchestrates the entire workflow.
 */
async function main() {
  const args = process.argv.slice(2);
  const isVerbose = args.includes('--verbose');
  const cwdIdx = args.indexOf('--cwd');
  const targetCwd = (cwdIdx !== -1 && args[cwdIdx + 1]) ? path.resolve(args[cwdIdx + 1]) : process.cwd();

  try {
    const context = new EngineContext(targetCwd);
    context.verbose = isVerbose;
    context.options = {
      autoFix: args.includes('--fix'),
      skipConfirm: args.includes('-y') || args.includes('--yes'),
      debug: args.includes('--debug')
    };

    // 1. Initialize Project (Scaffold / package.json)
    const initializer = new Initializer(context);
    await initializer.run();

    // 2. Run Engine
    const engine = new EntkappEngine(context);
    await engine.run();

  } catch (err) {
    console.error(ansis.bold.red(`\n🚨 Critical Lifecycle Failure: ${err.message}`));
    if (isVerbose) console.error(err.stack);
    process.exit(1);
  }
}

// Only run if executed directly
const currentFilePath = path.resolve(process.argv[1]);
const indexFilePath = path.resolve(import.meta.url.replace('file://', ''));

if (currentFilePath === indexFilePath) {
  main();
}

export { EntkappEngine, EngineContext, Initializer };
