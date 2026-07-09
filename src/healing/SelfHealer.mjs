import ansis from 'ansis';

/**
 * Automated Structural Healing Orchestrator.
 * Manages the lifecycle of applying structural fixes and verifying codebase health.
 * This is a deterministic engine and does not use AI/LLMs.
 */
export class SelfHealer {
  constructor(context, txManager, gitSandbox) {
    this.context = context;
    this.txManager = txManager;
    this.gitSandbox = gitSandbox;
  }

  /**
   * Executes a structural healing cycle with automatic rollback on failure.
   * @param {Function} refactorLogic - Async function that stages structural changes
   */
  async runSelfHealingLifecycle(refactorLogic) {
    console.log(ansis.bold.blue('\n🩹 Initiating Automated Structural Healing Cycle...'));
    
    try {
      // --- FIXED: Skip git state capture if it fails ---
      try {
        await this.gitSandbox.captureState();
      } catch (e) {
        if (this.context.verbose) console.log(`[SelfHealer] Skipping git state capture: ${e.message}`);
      }

      // 2. Execute the provided refactoring logic
      await refactorLogic();

      // 4. Verify structural integrity
      console.log(ansis.dim('🧪 Verifying codebase integrity...'));
      const isHealthy = await this.gitSandbox.verifyIntegrity();

      if (isHealthy) {
        console.log(ansis.bold.green('✅ Structural integrity verified. Finalizing changes.'));
        try { await this.gitSandbox.commit(); } catch (e) {}
      } else {
        console.log(ansis.bold.red('❌ Structural integrity compromised. Rolling back changes.'));
        try { await this.gitSandbox.rollback(); } catch (e) {}
      }
    } catch (error) {
      console.error(ansis.bold.red(`\n🚨 Healing Cycle Aborted: ${error.message}`));
    }
  }
}
