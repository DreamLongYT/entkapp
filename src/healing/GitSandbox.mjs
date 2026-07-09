import { execa } from 'execa';
import path from 'path';

/**
 * Deterministic Version Control Guard for Structural Healing Operations.
 * Manages atomic state rollbacks when automated refactoring breaks the build.
 */
export class GitSandbox {
  constructor(context) {
    this.context = context;
    this.initialBranch = '';
    this.healingBranch = `scaffold-healing-${Date.now()}`;
    // NEW in v5.7.0: Robust Git detection
    this.isGitRepo = false;
  }

  /**
   * Captures the current repository state before applying structural modifications.
   */
  async captureState() {
    try {
      const { stdout } = await execa('git', ['rev-parse', '--is-inside-work-tree'], { cwd: this.context.cwd });
      this.isGitRepo = stdout.trim() === 'true';

      if (this.isGitRepo) {
        const { stdout: branch } = await execa('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: this.context.cwd });
        this.initialBranch = branch.trim();
        
        // Create a temporary recovery branch
        await execa('git', ['checkout', '-b', this.healingBranch], { cwd: this.context.cwd });
        if (this.context.verbose) {
          console.log(`[Git] State captured in temporary branch: ${this.healingBranch}`);
        }
      }
    } catch (e) {
      this.isGitRepo = false;
      if (this.context.verbose) {
        console.log(`[Git] Not a git repository or git not found: ${e.message}`);
      }
    }
  }

  /**
   * Reverts all changes applied during the healing cycle if verification fails.
   */
  async rollback() {
    if (!this.isGitRepo) {
      console.log(ansis.yellow('[Git] Rollback skipped: Not a git repository.'));
      return;
    }
    try {
      console.log(`[Git] Rolling back structural modifications...`);
      await execa('git', ['reset', '--hard', 'HEAD'], { cwd: this.context.cwd });
      await execa('git', ['checkout', this.initialBranch], { cwd: this.context.cwd });
      await execa('git', ['branch', '-D', this.healingBranch], { cwd: this.context.cwd });
    } catch (e) {
      console.error(`[Git] Critical rollback failure: ${e.message}`);
    }
  }

  /**
   * Finalizes the healing cycle by merging changes back to the original branch.
   */
  async commit() {
    if (!this.isGitRepo) return;
    try {
      await execa('git', ['add', '.'], { cwd: this.context.cwd });
      await execa('git', ['commit', '-m', 'chore: automated structural healing (entkapp)'], { cwd: this.context.cwd });
      
      await execa('git', ['checkout', this.initialBranch], { cwd: this.context.cwd });
      await execa('git', ['merge', this.healingBranch], { cwd: this.context.cwd });
      await execa('git', ['branch', '-D', this.healingBranch], { cwd: this.context.cwd });
      
      if (this.context.verbose) {
        console.log(`[Git] Structural modifications successfully merged into ${this.initialBranch}`);
      }
    } catch (e) {
      console.error(`[Git] Commit failed: ${e.message}`);
    }
  }

  /**
   * Runs a verification command (e.g., npm test) to ensure structural integrity.
   */
  async verifyIntegrity() {
    try {
      const [cmd, ...args] = this.context.testCommand.split(' ');
      await execa(cmd, args, { cwd: this.context.cwd });
      return true;
    } catch (e) {
      if (this.context.verbose) {
        console.warn(`[Git] Integrity verification failed: ${e.message}`);
      }
      return false;
    }
  }
}
