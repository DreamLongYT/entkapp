import path from 'path';

/**
 * Production-Grade Native Rust AST Parser Bridge (OXC)
 * Optimized for Monorepos and Windows environments.
 * Implements the same semantic logic as ASTAnalyzer but using the high-performance OXC parser.
 */
export class OxcAnalyzer {
  constructor(context) {
    this.context = context;
    this.oxc = null;
    this.isAvailable = false;
    this.scopeStack = [];
    this.currentScope = null;
    this.scopeCounter = 0;
    this.pass = 1;
  }

  async init() {
    if (this.context.usedExternalPackages) this.context.usedExternalPackages.add("oxc-parser");
    if (this.isAvailable) return true;
    try {
      const oxc = await import("oxc-parser");
      this.oxc = oxc;
      this.isAvailable = true;
      return true;
    } catch (e) {
      try {
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        this.oxc = require("oxc-parser");
        this.isAvailable = true;
        return true;
      } catch (err) {
        this.isAvailable = false;
        return false;
      }
    }
  }

  /**
   * WINDOWS FIX: Robust path normalization for OXC.
   */
  normalizePath(filePath) {
    if (!filePath) return filePath;
    let normalized = filePath.replace(/\\/g, '/');
    if (/^[a-z]:\//i.test(normalized)) {
      normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    }
    return normalized.replace(/\/+/g, '/');
  }

  async parseFile(filePath, content, fileNode) {
    if (!this.isAvailable) {
      const initialized = await this.init();
      if (!initialized) return false;
    }

    try {
      const cleanContent = content.startsWith('\uFEFF') ? content.slice(1) : content;
      const normalizedPath = this.normalizePath(filePath);
      
      let result;
      try {
        result = this.oxc.parseSync(normalizedPath, cleanContent, {
          sourceType: "module",
          sourceFilename: normalizedPath,
          lang: "typescript"
        });
      } catch (e) {
        try {
          result = this.oxc.parseSync(normalizedPath, cleanContent);
        } catch (innerErr) {
          if (this.context.verbose) console.error(`[OXC-ERROR] Native parse failed for: ${normalizedPath}`);
          return false;
        }
      }

      let parsedResult;
      try {
        parsedResult = typeof result === 'string' ? JSON.parse(result) : JSON.parse(JSON.stringify(result));
      } catch (err) {
        if (result && typeof result === 'object') parsedResult = result;
        else return false;
      }

      let programRoot = null;
      if (parsedResult && typeof parsedResult === 'object') {
        if (parsedResult.program) programRoot = parsedResult.program;
        else if (parsedResult.ast) programRoot = parsedResult.ast;
        else if (parsedResult.type === 'Program' || parsedResult.body) programRoot = parsedResult;
      }

      if (cleanContent.trim().length > 0 && (!programRoot || !programRoot.body || programRoot.body.length === 0)) {
        if (this.context.verbose) console.warn(`[OXC-WARNING] Silent failure detected for ${normalizedPath}. Triggering Fallback...`);
        return false;
      }

      if (!programRoot || !programRoot.body) return false;

      fileNode.ast = programRoot;
      fileNode.symbolTable = new Map();

      // --- TWO-PASS ANALYSIS ---
      
      // Pass 1: Declarations
      this.currentScope = { symbols: new Map(), parent: null, children: [] };
      this.scopeStack = [this.currentScope];
      this.scopeCounter = 0;
      this.pass = 1;
      this.walkOxcAst(programRoot, fileNode, cleanContent);

      // Pass 2: References
      if (this.scopeStack.length > 0) {
        this.currentScope = this.scopeStack[0];
        this.scopeCounter = 0;
        this.pass = 2;
        this.walkOxcAst(programRoot, fileNode, cleanContent);
      }

      this.scopeStack = [];
      this.currentScope = null;
      
      return true;
    } catch (e) {
      return false;
    }
  }

  pushScope() {
    if (this.pass === 1) {
      const newScope = { symbols: new Map(), parent: this.currentScope, children: [] };
      if (this.currentScope) this.currentScope.children.push(newScope);
      this.scopeStack.push(newScope);
      this.currentScope = newScope;
    } else {
      if (this.currentScope && this.currentScope.children) {
        const nextScope = this.currentScope.children[this.scopeCounter++];
        if (nextScope) {
          this.scopeStack.push(nextScope);
          this.currentScope = nextScope;
        }
      }
    }
  }

  popScope() {
    this.scopeStack.pop();
    this.currentScope = this.scopeStack[this.scopeStack.length - 1];
  }

  walkOxcAst(node, fileNode, content) {
    if (!node) return;

    const isScopeNode = node.type === 'BlockStatement' || node.type === 'FunctionDeclaration' || 
                        node.type === 'ClassDeclaration' || node.type === 'ArrowFunctionExpression';

    let previousCounter = 0;
    if (isScopeNode) {
      if (this.pass === 2) previousCounter = this.scopeCounter;
      this.scopeCounter = 0;
      this.pushScope();
    }

    if (this.pass === 1) {
      this.handleNodePass1(node, fileNode, content);
    } else {
      this.handleNodePass2(node, fileNode, content);
    }

    // Traverse children
    for (const key in node) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => this.walkOxcAst(c, fileNode, content));
      } else if (child && typeof child === 'object' && child.type) {
        this.walkOxcAst(child, fileNode, content);
      }
    }

    if (isScopeNode) {
      this.popScope();
      if (this.pass === 2) this.scopeCounter = previousCounter + 1;
    }
  }

  handleNodePass1(node, fileNode, content) {
    switch (node.type) {
      case 'ImportDeclaration':
        this.handleImport(node, fileNode);
        break;
      case 'ExportNamedDeclaration':
        this.handleExportNamed(node, fileNode);
        break;
      case 'ExportDefaultDeclaration':
        fileNode.internalExports.set('default', { type: 'default', start: node.start, end: node.end });
        break;
      case 'ExportAllDeclaration':
        if (node.source) {
          const specifier = node.source.value;
          fileNode.explicitImports.add(specifier);
          fileNode.internalExports.set('*', { type: 're-export-all', source: specifier });
        }
        break;
    }
  }

  handleNodePass2(node, fileNode, content) {
    switch (node.type) {
      case 'Identifier':
        if (!this.isLocalShadowing(node.name)) {
          fileNode.instantiatedIdentifiers.add(node.name);
        }
        break;
      case 'CallExpression':
        this.handleCall(node, fileNode);
        break;
      case 'MemberExpression':
        if (node.property && node.property.name) {
          fileNode.instantiatedIdentifiers.add(node.property.name);
        }
        break;
    }
  }

  handleImport(node, fileNode) {
    if (!node.source) return;
    const specifier = node.source.value;
    fileNode.explicitImports.add(specifier);
    
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) {
      const pkgName = this._extractPackageName(specifier);
      let isInternal = false;
      if (this.context.pathMapper?.isTsconfigAlias?.(specifier)) isInternal = true;
      if (!isInternal && this.context.workspaceGraph?.isLocalWorkspaceSpecifier?.(specifier)) isInternal = true;
      if (!isInternal) fileNode.externalPackageUsage.add(pkgName);
    }
  }

  handleExportNamed(node, fileNode) {
    if (node.declaration) {
      const decl = node.declaration;
      const name = decl.id?.name || (decl.declarations?.[0]?.id?.name);
      if (name) {
        fileNode.internalExports.set(name, { type: 'export', start: node.start, end: node.end });
      }
    } else if (node.specifiers) {
      node.specifiers.forEach(spec => {
        const name = spec.exported.name || spec.exported.value;
        fileNode.internalExports.set(name, { type: 'export', start: spec.start, end: spec.end });
      });
    }
  }

  handleCall(node, fileNode) {
    const callee = node.callee;
    if (callee.type === 'Identifier' && callee.name === 'require') {
      const arg = node.arguments[0];
      if (arg && (arg.type === 'StringLiteral' || arg.type === 'Literal')) {
        const specifier = arg.value;
        fileNode.explicitImports.add(specifier);
      }
    } else if (callee.type === 'Import') {
      const arg = node.arguments[0];
      if (arg && (arg.type === 'StringLiteral' || arg.type === 'Literal')) {
        const specifier = arg.value;
        fileNode.explicitImports.add(specifier);
        fileNode.dynamicImports.add(specifier);
      }
    }
  }

  isLocalShadowing(name) {
    let scope = this.currentScope;
    while (scope) {
      if (scope.symbols.has(name)) return scope.parent !== null;
      scope = scope.parent;
    }
    return false;
  }

  _extractPackageName(specifier) {
    if (specifier.startsWith('@')) {
      const parts = specifier.split('/');
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
    }
    return specifier.split('/')[0];
  }
}
