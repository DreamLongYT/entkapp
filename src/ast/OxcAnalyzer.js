import { parseSync } from 'oxc-parser';
import fs from 'fs/promises';

/**
 * High-Performance AST Analyzer using OXC (Rust-based)
 * Designed to outpace Knip v6 by utilizing the fastest parser in the JS ecosystem.
 */
export class OxcAnalyzer {
  constructor(context) {
    this.context = context;
  }

  async processFile(filePath, fileNode) {
    try {
      const sourceText = await fs.readFile(filePath, 'utf8');
      
      // OXC is significantly faster than TypeScript for single-pass analysis
      const { program } = parseSync(sourceText, {
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

    // OXC AST structure is slightly different from TS
    // We focus on imports, exports, and namespace members
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

    // Phase 3: Namespace Member Tracking
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

    // Recursively walk
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
