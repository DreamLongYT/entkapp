import path from 'path';
import fs from 'fs/promises';
import { BasePlugin } from '../BasePlugin.mjs';

/**
 * TypeScript Plugin for entkapp v5.0.0.
 * Handles tsconfig.json detection, TypeScript-specific entry points,
 * and missing dependency detection.
 */
export class TypeScriptPlugin extends BasePlugin {
    get name() {
        return 'typescript';
    }
    getConfigFiles() {
        return ['tsconfig.json', 'tsconfig.base.json', 'tsconfig.eslint.json', 'tsconfig.node.json', 'tsconfig.app.json'];
    }
    getRequiredPackages() {
        return [
            { name: 'typescript', dev: true },
            { name: '@types/node', dev: true, optional: true },
        ];
    }
    getRoutePatterns() {
        return [
            /src\/index\.ts$/,
            /src\/main\.ts$/,
            /src\/lib\.ts$/,
            /.*\.d\.ts$/
        ];
    }
    getRequiredSystemContracts() {
        return ['default'];
    }
    /**
     * Custom Getter for v3.2.0: Get the compiler version from the project.
     */
    async getCompilerVersion() {
        try {
            const packageJsonPath = path.join(this.context.cwd, 'package.json');
            const content = await fs.readFile(packageJsonPath, 'utf8');
            const pkg = JSON.parse(content);
            return pkg.devDependencies?.typescript || pkg.dependencies?.typescript || 'unknown';
        } catch {
            return 'not installed';
        }
    }
    async isActive(baseDir) {
        for (const file of this.getConfigFiles()) {
            try {
                await fs.access(path.join(baseDir, file));
                return true;
            } catch {}
        }
        return false;
    }
}
