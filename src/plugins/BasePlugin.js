/**
 * Base class for all pkg-scaffold plugins.
 * Defines the contract for ecosystem detection and entry point mapping.
 */
export class BasePlugin {
  constructor(context) {
    this.context = context;
  }

  /**
   * Unique identifier for the plugin (e.g., 'nextjs').
   */
  get name() {
    throw new Error('Plugin must implement name getter');
  }

  /**
   * Returns a list of configuration files that indicate this ecosystem is active.
   */
  getConfigFiles() {
    return [];
  }

  /**
   * Returns regex patterns for files that should be treated as entry points.
   */
  getRoutePatterns() {
    return [];
  }

  /**
   * Returns symbols that are implicitly required/exported by the framework.
   */
  getRequiredSystemContracts() {
    return ['default'];
  }

  /**
   * Optional: Logic to detect if the plugin should be active in the given directory.
   */
  async isActive(baseDir) {
    const configFiles = this.getConfigFiles();
    for (const file of configFiles) {
      try {
        await fs.access(path.join(baseDir, file));
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }
}
