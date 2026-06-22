#!/usr/bin/env node

/**
 * ============================================================================
 * 🚀 entkapp: The High-Performance Codebase Orchestrator
 * ============================================================================
 * Command-line interface for executing architectural audits, structural 
 * refactoring cycles, and autonomous codebase healing.
 */

import { Command } from 'commander';
import ansis from 'ansis';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { ConfigLoader } from '../src/resolution/ConfigLoader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(await fs.readFile(path.join(__dirname, '../package.json'), 'utf8'));

const program = new Command();

async function main() {
  try {
    program
      .name('entkapp')
      .description('Autonomous architectural refactoring and codebase optimization engine')
      .version(pkg.version)
      .argument('[path]', 'Target directory for codebase analysis and refactoring', '.')
      .option('-f, --fix', 'Automatically apply identified structural optimizations and healing', false)
      .option('--tsconfig <filename>', 'Specify path to custom layout configurations', 'tsconfig.json')
      .option('--test-command <command>', 'Integrated continuous safety test validation script execution path', 'npm test')
      .option('--workspace', 'Enable high-density workspace workspace/monorepo cluster mesh evaluation parsing', false)
      .option('--verbose', 'Toggle expanded trace telemetry for debug operational diagnostics', false)
      .option('--visualize', 'Generate an interactive execution graph visualization', false)
      .option('-ef, --entry-file <path>', 'Manually specify a primary entry file for analysis')
      .option('-r, --run', 'Execute the primary operational pipeline loop', false)
      .option('-y, --yes', 'Skip confirmation prompts and execute planned structural modifications automatically', false)
      .option('--timeout <ms>', 'Set execution timeout in milliseconds', '30000');

    program.parse(process.argv);

    const options = program.opts();
    const targetCwd = path.resolve(process.cwd(), program.args[0] || '.');

    // Load configuration
    const configLoader = new ConfigLoader(targetCwd);
    const localConfig = await configLoader.loadConfig(options);

    if (options.verbose) {
      const summary = {
        packages: localConfig.workspacePackages?.length || 0,
        tsconfigs: localConfig.workspaceTsConfigs?.length || 0,
        configs: localConfig.workspaceConfigFiles?.length || 0
      };
      console.log(ansis.dim(`[ConfigLoader] Monorepo detected – ${summary.packages} package(s), ${summary.tsconfigs} tsconfig(s), ${summary.configs} *.config file(s) loaded`));
    }

    const timeoutTimer = setTimeout(() => {
      console.error(ansis.red(`\n❌ Execution Timeout: Operation exceeded ${options.timeout}ms limit.`));
      process.exit(1);
    }, parseInt(options.timeout));

    console.log('\n' + ansis.bold.cyan(`📦 entkapp v${pkg.version} Engine Activation`));
    console.log(ansis.dim('------------------------------------------------------------'));
    console.log(`${ansis.bold('Target Workspace Root')} : ${targetCwd}`);
    console.log(`${ansis.bold('Refactoring Mode')}     : ${options.fix ? ansis.yellow('Automated Healing Active') : 'Dry-Run Reporting Only'}`);
    console.log(`${ansis.bold('Validation Sandbox')}   : ${options.testCommand}`);
    console.log(ansis.dim('------------------------------------------------------------\n'));

    const { RefactoringEngine } = await import('../src/index.js');

    // Prepare entry points - EXTREMELY ROBUST ARRAY HANDLING
    let entryPoints = [];
    if (localConfig.entryPoints && typeof localConfig.entryPoints[Symbol.iterator] === 'function') {
      entryPoints = [...localConfig.entryPoints];
    } else if (localConfig.entryPoints) {
      entryPoints = [localConfig.entryPoints];
    }
    
    if (options.entryFile) {
      const absEntry = path.resolve(targetCwd, options.entryFile).replace(/\\/g, '/');
      if (!entryPoints.includes(absEntry)) {
        entryPoints.push(absEntry);
      }
    }

    const engine = new RefactoringEngine({
      cwd: targetCwd,
      autoFix: options.fix,
      tsconfig: options.tsconfig,
      testCommand: options.testCommand,
      workspace: options.workspace || localConfig.workspace || false,
      verbose: options.verbose,
      skipConfirm: options.yes,
      entryPoints: entryPoints,
      exclude: localConfig.exclude || [],
      rules: localConfig.rules || {},
      debug: options.debug,
      visualize: options.visualize,
      workspacePackages:    localConfig.workspacePackages || [],
      workspaceTsConfigs:   localConfig.workspaceTsConfigs || [],
      workspaceConfigFiles: localConfig.workspaceConfigFiles || [],
    });

    await engine.run();
    
    clearTimeout(timeoutTimer);
  } catch (err) {
    console.error(ansis.red(`\n❌ Engine Failure: ${err.message}`));
    if (program.opts().verbose) console.error(err);
    process.exit(1);
  }
}

main();
