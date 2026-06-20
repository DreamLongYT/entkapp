import fs from 'fs/promises';
import path from 'path';

/**
 * Base class for all entkapp plugins.
 * Defines the contract for ecosystem detection, entry point mapping,
 * and missing dependency / devDependency detection.
 * Version 5.0.0: Added getMissingDependencies(), getOrphanedConfigs(), runDependencyDiagnostics().
 */
export class BasePlugin {
    constructor(context) {
        this.context = context;
        this.customGetters = new Map();
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
     * Returns the npm package names required for this plugin to work.
     * Each entry is either a string or an object:
     *   { name: string, dev?: boolean, optional?: boolean }
     *   - dev: true  => expected in devDependencies
     *   - dev: false => expected in dependencies
     *   - optional   => only warn, not error
     *
     * Override in subclasses to enable automatic dependency checking.
     * @returns {Array<string | {name: string, dev?: boolean, optional?: boolean}>}
     */
    getRequiredPackages() {
        return [];
    }

    /**
     * Version 5.0.0: Checks whether all required packages are present in package.json.
     * Returns an array of diagnostic objects describing missing or misplaced dependencies.
     *
     * @param {string} baseDir - The project root directory
     * @returns {Promise<Array>}
     */
    async getMissingDependencies(baseDir) {
        const diagnostics = [];
        const requiredPackages = this.getRequiredPackages();
        if (requiredPackages.length === 0) return diagnostics;

        let pkg = null;
        try {
            const raw = await fs.readFile(path.join(baseDir, 'package.json'), 'utf8');
            pkg = JSON.parse(raw);
        } catch {
            return diagnostics;
        }

        const deps = pkg.dependencies || {};
        const devDeps = pkg.devDependencies || {};

        for (const entry of requiredPackages) {
            const pkgName = typeof entry === 'string' ? entry : entry.name;
            const isDev = typeof entry === 'object' ? entry.dev : undefined;
            const isOptional = typeof entry === 'object' ? (entry.optional ?? false) : false;

            const inDeps = pkgName in deps;
            const inDevDeps = pkgName in devDeps;
            const found = inDeps ? 'dependencies' : inDevDeps ? 'devDependencies' : null;

            if (!found) {
                let triggerFile = null;
                for (const cfgFile of this.getConfigFiles()) {
                    try {
                        await fs.access(path.join(baseDir, cfgFile));
                        triggerFile = cfgFile;
                        break;
                    } catch { /* not found */ }
                }

                const expectedIn = isDev === true ? 'devDependencies' : isDev === false ? 'dependencies' : 'either';
                const severity = isOptional ? 'warning' : 'error';

                let message = `Plugin "${this.name}": package "${pkgName}" is not installed`;
                if (triggerFile) {
                    message += ` (config file "${triggerFile}" was found)`;
                }
                if (isDev === true) {
                    message += ` — expected in devDependencies`;
                } else if (isDev === false) {
                    message += ` — expected in dependencies`;
                }

                diagnostics.push({
                    plugin: this.name,
                    package: pkgName,
                    expectedIn,
                    foundIn: null,
                    configFile: triggerFile,
                    severity,
                    message,
                });
            } else if (isDev === true && found === 'dependencies') {
                diagnostics.push({
                    plugin: this.name,
                    package: pkgName,
                    expectedIn: 'devDependencies',
                    foundIn: 'dependencies',
                    configFile: null,
                    severity: 'warning',
                    message: `Plugin "${this.name}": package "${pkgName}" is in "dependencies" but should be in "devDependencies"`,
                });
            } else if (isDev === false && found === 'devDependencies') {
                diagnostics.push({
                    plugin: this.name,
                    package: pkgName,
                    expectedIn: 'dependencies',
                    foundIn: 'devDependencies',
                    configFile: null,
                    severity: 'warning',
                    message: `Plugin "${this.name}": package "${pkgName}" is in "devDependencies" but should be in "dependencies"`,
                });
            }
        }

        return diagnostics;
    }

    /**
     * Version 5.0.0: Checks for config files that exist without the corresponding package.
     * Detects "orphaned" configs – e.g. .prettierrc exists but prettier is not installed.
     *
     * @param {string} baseDir
     * @returns {Promise<Array>}
     */
    async getOrphanedConfigs(baseDir) {
        const diagnostics = [];
        const requiredPackages = this.getRequiredPackages();
        if (requiredPackages.length === 0) return diagnostics;

        let pkg = null;
        try {
            const raw = await fs.readFile(path.join(baseDir, 'package.json'), 'utf8');
            pkg = JSON.parse(raw);
        } catch {
            return diagnostics;
        }

        const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

        const anyPackagePresent = requiredPackages.some(entry => {
            const pkgName = typeof entry === 'string' ? entry : entry.name;
            return pkgName in allDeps;
        });

        if (!anyPackagePresent) {
            for (const cfgFile of this.getConfigFiles()) {
                try {
                    await fs.access(path.join(baseDir, cfgFile));
                    const missingPkgs = requiredPackages
                        .map(e => typeof e === 'string' ? e : e.name)
                        .filter(n => !(n in allDeps));

                    diagnostics.push({
                        plugin: this.name,
                        configFile: cfgFile,
                        severity: 'error',
                        message: `Plugin "${this.name}": config file "${cfgFile}" exists but required package(s) [${missingPkgs.join(', ')}] are not installed`,
                    });
                } catch { /* file not found */ }
            }
        }

        return diagnostics;
    }

    /**
     * Version 5.0.0: Run all dependency diagnostics (missing + orphaned).
     * Convenience method combining getMissingDependencies and getOrphanedConfigs.
     *
     * @param {string} baseDir
     * @returns {Promise<Array>}
     */
    async runDependencyDiagnostics(baseDir) {
        const [missing, orphaned] = await Promise.all([
            this.getMissingDependencies(baseDir),
            this.getOrphanedConfigs(baseDir),
        ]);
        return [...missing, ...orphaned];
    }

    /**
     * Version 3.2.0: Dynamic getter for custom plugin properties.
     * @param {string} key - The property key to retrieve
     * @returns {any} The value of the custom property
     */
    get(key) {
        const methodName = `get${key.charAt(0).toUpperCase() + key.slice(1)}`;
        if (typeof this[methodName] === 'function') {
            return this[methodName]();
        }
        return this.customGetters.get(key);
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
