let oxcParser;
try {
  oxcParser = await import('oxc-parser');
} catch (e) {
  // OXC is optional; will fall back to TypeScript in ASTAnalyzer
}

import fs from 'fs/promises';

/**
 * High-Performance AST Analyzer using OXC (Rust-based)
 * Designed to outpace Knip v6 by utilizing the fastest parser in the JS ecosystem.
 * Includes automatic fallback if OXC is not available in the environment.
 */
export class OxcAnalyzer {
  constructor(context) {
    this.context = context;
    this.isAvailable = !!oxcParser;
  }

  async processFile(filePath, fileNode) {
    if (!this.isAvailable) {
      if (this.context.verbose) {
        console.warn(`[OXC] Library not available, skipping fast-scan for: ${filePath}`);
      }
      return false;
    }

    try {
      const sourceText = await fs.readFile(filePath, 'utf8');
      
      const { program } = oxcParser.parseSync(sourceText, {
        sourceFilename: filePath,
        sourceType: filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'typescript' : 'script'
      });

      this.walkOxcNode(program, fileNode);
      return true;
    } catch (err) {
      if (this.context.verbose) {
        console.error(`[OXC Error] Failed parsing: ${filePath}. Reason: ${err.message}`);
      }
      return false;
    }
  }

  walkOxcNode(node, fileNode) {
    if (!node) return;

    if (node.type === 'ImportDeclaration') {
      const specifier = node.source.value;
      fileNode.explicitImports.add(specifier);
      node.specifiers.forEach(s => {
        if (s.type === 'ImportSpecifier') {
          fileNode.importedSymbols.add(`${specifier}:${s.imported.name}`);
        } else if (s.type === 'ImportDefaultSpecifier') {
          fileNode.importedSymbols.add(`${specifier}:default`);
        } else if (s.type === 'ImportNamespaceSpecifier') {
          fileNode.importedSymbols.add(`${specifier}:*`);
        }
      });
    }

    if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        this.handleOxcDeclaration(node.declaration, fileNode);
      }
      if (node.specifiers) {
        node.specifiers.forEach(s => {
          fileNode.internalExports.set(s.exported.name, { type: 'export-specifier' });
        });
      }
    }

    if (node.type === 'ExportDefaultDeclaration') {
      fileNode.internalExports.set('default', { type: 'default-export' });
    }

    if (node.type === 'TSModuleDeclaration' && node.id.type === 'Identifier') {
      const namespaceName = node.id.name;
      if (node.body && node.body.type === 'TSModuleBlock') {
        node.body.body.forEach(innerNode => {
          if (innerNode.type === 'ExportNamedDeclaration' && innerNode.declaration) {
             const decl = innerNode.declaration;
             let memberName;
             if (decl.type === 'VariableDeclaration') {
               memberName = decl.declarations[0].id.name;
             } else if (decl.id) {
               memberName = decl.id.name;
             }
             if (memberName) {
               fileNode.namespaceMembers = fileNode.namespaceMembers || new Set();
               fileNode.namespaceMembers.add(`${namespaceName}.${memberName}`);
             }
          }
        });
      }
    }

    for (const key in node) {
      const child = node[key];
      if (child && typeof child === 'object') {
        if (Array.isArray(child)) {
          child.forEach(c => this.walkOxcNode(c, fileNode));
        } else {
          this.walkOxcNode(child, fileNode);
        }
      }
    }
  }

  handleOxcDeclaration(decl, fileNode) {
    let name;
    if (decl.type === 'FunctionDeclaration' || decl.type === 'ClassDeclaration' || decl.type === 'TSEnumDeclaration' || decl.type === 'TSInterfaceDeclaration' || decl.type === 'TSTypeAliasDeclaration') {
      name = decl.id?.name;
    } else if (decl.type === 'VariableDeclaration') {
      name = decl.declarations[0].id.name;
    }
    
    if (name) {
      fileNode.internalExports.set(name, { type: decl.type.toLowerCase() });
    }
  }
}
