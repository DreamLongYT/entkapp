#!/usr/bin/env node

/**
 * ============================================================================
 * 🏁 pkg-scaffold CLI Entry Point
 * ============================================================================
 * Handles option compilation, environment orchestration, option validation,
 * and initiates the primary operational pipeline loop.
 */

import { Command } from 'commander';
import ansis from 'ansis';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

async function bootstrap() {
  try {
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJsonContent = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

    program
      .name('pkg-scaffold')
      .description(ansis.cyan('Enterprise-Grade AST Syntax Refactoring & Self-Healing Engine'))
      .version(packageJsonContent.version || '3.0.0');

    program
      .option('-c, --cwd <path>', 'Specify the execution context root directory', process.cwd())
      .option('--fix', 'Enable atomic code updates, structural file pruning, and active type sanitization', true)
      .option('--no-fix', 'Disable direct file manipulation modifications (dry-run reporting mode)')
      .option('--tsconfig <filename>', 'Specify path to custom layout configurations', 'tsconfig.json')
      .option('--test-command <command>', 'Integrated continuous safety test validation script execution path', 'npm test')
      .option('--workspace', 'Enable high-density workspace workspace/monorepo cluster mesh evaluation parsing', false)
      .option('--verbose', 'Toggle expanded trace telemetry for debug operational diagnostics', false)
      .option('-y, --yes', 'Skip confirmation prompts and execute planned structural modifications automatically', false);

    program.parse(process.argv);
    const options = program.opts();

    console.log(ansis.bold.green(`\n📦 pkg-scaffold v${packageJsonContent.version || '3.0.0'} Engine Activation`));
    console.log(ansis.dim('------------------------------------------------------------'));
    console.log(`${ansis.bold('Target Workspace Root :')} ${ansis.blue(path.resolve(options.cwd))}`);
    console.log(`${ansis.bold('Refactoring Mode     :')} ${options.fix ? ansis.yellow('Active Fixing & Self-Healing Enabled') : ansis.gray('Dry-Run Reporting Only')}`);
    console.log(`${ansis.bold('Validation Sandbox   :')} ${ansis.magenta(options.testCommand)}`);
    console.log(ansis.dim('------------------------------------------------------------\n'));

    const engineModulePath = path.resolve(__dirname, '../src/EngineContext.js');
    
    try {
      await fs.access(engineModulePath);
    } catch {
      console.error(ansis.red(`🚨 Execution Fault: Core engine architecture files missing. Ensure src/ directory layout is fully generated.`));
      process.exit(1);
    }

    // Lazy load execution context wrapper to align with domain initialization
    const { RefactoringEngine } = await import('../src/index.js');

    if (!RefactoringEngine) {
      console.error(ansis.red('🚨 Architecture Boundary Error: RefactoringEngine could not be resolved from code topology channels.'));
      process.exit(1);
    }

    // Ensure cwd is always an absolute path regardless of how it was passed (e.g., '--cwd .')
    const engine = new RefactoringEngine({
      cwd: path.resolve(options.cwd),
      autoFix: options.fix,
      tsconfig: options.tsconfig,
      testCommand: options.testCommand,
      workspace: options.workspace,
      verbose: options.verbose,
      skipConfirm: options.yes
    });

    await engine.run();

    console.log(ansis.bold.green('\n✨ Core cycle execution completed successfully. Structural layout is clean.'));
    process.exit(0);

  } catch (criticalBootError) {
    console.error(ansis.bold.red(`\n🚨 Critical Lifecycle Boot Instability: ${criticalBootError.message}`));
    if (criticalBootError.stack) {
      console.error(ansis.dim(criticalBootError.stack));
    }
    process.exit(1);
  }
}

bootstrap();
