# Getting Started with pkg-scaffold v3.2.0

This guide will walk you through the installation and basic usage of `pkg-scaffold`. Learn how to quickly clean and optimize your project with the latest customization features.

## Installation

`pkg-scaffold` is an npm package and can be easily installed in your project. It is recommended to install it as a `devDependency`.

```bash
npm install --save-dev pkg-scaffold
```

After installation, you can run `pkg-scaffold` via `npx` or by adding a script to your `package.json`.

## Basic Usage

### Dry-Run Mode (Recommended)

Before making any changes to your project, it is always advisable to use the dry-run mode. This mode analyzes your project and shows you which changes *would be made* without actually applying them.

```bash
npx pkg-scaffold --no-fix
```

### Applying Changes

If you are satisfied with the proposed changes, you can run `pkg-scaffold` with the `--fix` option to apply the changes to your project.

```bash
npx pkg-scaffold --fix --yes
```

## Customization Update 3.2.0: Custom Getters

Version 3.2.0 introduces a powerful new way to customize plugins using **Dynamic Custom Getters**.

### New `get(key)` Method

Plugins can now implement custom getter methods that are accessible via a unified `get()` interface. This allows users to define and retrieve custom metadata or functionality within their plugins.

#### Example: Custom Plugin with Getters

```javascript
export default class MyCustomPlugin extends BasePlugin {
  get name() {
    return 'my-custom-tool';
  }

  // New in 3.2.0: Custom Getter for version
  getVersion() {
    return '1.0.0';
  }

  // Custom data point
  getAuthor() {
    return 'Jane Doe';
  }

  // Usage: plugin.get('version') -> calls getVersion()
  // Usage: plugin.get('author')  -> calls getAuthor()
}
```

### Advanced Plugin Structure

The `BasePlugin` now includes a `get(key)` helper that automatically maps `get('something')` to a method named `getSomething()`.

```javascript
export default class MyAdvancedPlugin extends BasePlugin {
  // ... standard methods ...

  // Custom logic that can be queried by the engine or other plugins
  getCustomStatus() {
    return this.context.metrics.totalFilesScanned > 100 ? 'large' : 'small';
  }
}
```

## Plugin Development

Building a plugin for pkg-scaffold is straightforward. You need to export a class that extends the `BasePlugin`.

### Basic Plugin Template

```javascript
export default class MyCustomPlugin {
  constructor(context) {
    this.context = context;
  }

  get name() {
    return 'my-plugin';
  }

  getConfigFiles() {
    return ['my-config.json'];
  }

  getRoutePatterns() {
    return [ /\/src\/routes\/.*\.js$/ ];
  }

  getRequiredSystemContracts() {
    return ['default', 'handler'];
  }

  async isActive(baseDir) {
    return true; 
  }
}
```

## Default Plugins

*   **NextJsPlugin**: Optimizes Next.js projects, detecting unused pages and API routes.
*   **TypeScriptPlugin**: Advanced support for TypeScript projects, detecting `tsconfig.json` and managing `.ts` and `.d.ts` entry points.
*   **GenericPlugins**: Basic optimizations for standard JavaScript/TypeScript projects (Nuxt, Remix, SvelteKit, Astro).
