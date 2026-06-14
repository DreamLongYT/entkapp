import ts from 'typescript';
import fs from 'fs/promises';
import path from 'path';

/**
 * Enterprise AST Syntax Walker & Feature Extractor
 * Upgraded to use full TypeScript Compiler API (ts.createProgram + TypeChecker)
 * for type-aware cross-file analysis.
 */
import { OxcAnalyzer } from './OxcAnalyzer.js';

export class ASTAnalyzer {
  constructor(context) {
    this.context = context;
    this.program = null;
    this.checker = null;
    this.oxc = new OxcAnalyzer(context);
  }

  /**
   * Initializes the TypeScript program for the entire project.
   * This is crucial for cross-file type resolution.
   */
  initProgram(filePaths, options = {}) {
    const defaultOptions = {
      target: ts.ScriptTarget.Latest,
      module: ts.ModuleKind.CommonJS,
      allowJs: true,
      checkJs: true,
      esModuleInterop: true,
      skipLibCheck: true
    };
    
    this.program = ts.createProgram(filePaths, { ...defaultOptions, ...options });
    this.checker = this.program.getTypeChecker();
  }

  /**
   * Processes a file using the initialized program and type checker.
   */
  async processFile(filePath, fileNode) {
    // Fast Path: Use OXC for rapid scanning if type checking is not strictly required for this file
    if (this.context.fastMode && this.oxc.isAvailable) {
      const success = await this.oxc.processFile(filePath, fileNode);
      if (success) return true;
    }

    if (!this.program) {
      throw new Error('ASTAnalyzer must be initialized with initProgram() before processing files.');
    }

    const sourceFile = this.program.getSourceFile(filePath);
    if (!sourceFile) {
      if (this.context.verbose) {
        console.error(`[AST Error] Source file not found in program: ${filePath}`);
      }
      return false;
    }

    this.extractTopLevelJSDocSuppreessions(sourceFile, fileNode);
    this.walkNode(sourceFile, sourceFile, fileNode);
    
    return true;
  }

  walkNode(sourceFile, node, fileNode) {
    if (!node) return;

    // Use type checker to resolve symbols if needed
    if (ts.isIdentifier(node) && !this.isNodeDeclarationName(node)) {
      const symbol = this.checker.getSymbolAtLocation(node);
      if (symbol) {
        const declarations = symbol.getDeclarations();
        if (declarations && declarations.length > 0) {
          const declFile = declarations[0].getSourceFile().fileName;
          const symbolName = symbol.getName();
          
          // Track sub-symbol usage (Property Access)
          if (ts.isPropertyAccessExpression(node.parent) && node.parent.name === node) {
             const parentType = this.checker.getTypeAtLocation(node.parent.expression);
             const parentSymbol = parentType.getSymbol() || parentType.aliasSymbol;
             if (parentSymbol) {
               const parentDecl = parentSymbol.getDeclarations()?.[0];
               if (parentDecl) {
                 const parentFile = parentDecl.getSourceFile().fileName;
                 fileNode.memberUsage = fileNode.memberUsage || new Set();
                 fileNode.memberUsage.add(`${parentFile}:${parentSymbol.getName()}.${symbolName}`);
               }
             }
          }

          if (declFile !== sourceFile.fileName) {
            fileNode.resolvedReferences = fileNode.resolvedReferences || new Set();
            fileNode.resolvedReferences.add(`${declFile}:${symbolName}`);
          }
        }
      }
    }

    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration: {
        this.handleImportDeclaration(node, fileNode);
        break;
      }
      case ts.SyntaxKind.ExportDeclaration: {
        this.handleExportDeclaration(node, fileNode, sourceFile);
        break;
      }
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.TypeAliasDeclaration:
      case ts.SyntaxKind.EnumDeclaration:
      case ts.SyntaxKind.ModuleDeclaration: {
        this.handleNamedDeclaration(node, fileNode, sourceFile);
        break;
      }
      case ts.SyntaxKind.VariableStatement: {
        this.handleVariableStatement(node, fileNode, sourceFile);
        break;
      }
      case ts.SyntaxKind.CallExpression: {
        this.handleCallExpression(node, fileNode, sourceFile);
        break;
      }
    }

    ts.forEachChild(node, child => this.walkNode(sourceFile, child, fileNode));
  }

  handleImportDeclaration(node, fileNode) {
    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      fileNode.explicitImports.add(specifier);
      
      if (node.importClause) {
        if (node.importClause.namedBindings) {
          if (ts.isNamedImports(node.importClause.namedBindings)) {
            node.importClause.namedBindings.elements.forEach(element => {
              const importedName = element.name.text;
              const propertyName = element.propertyName ? element.propertyName.text : importedName;
              fileNode.importedSymbols.add(`${specifier}:${propertyName}`);
            });
          } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
            fileNode.importedSymbols.add(`${specifier}:*`);
          }
        }
        if (node.importClause.name) {
          fileNode.importedSymbols.add(`${specifier}:default`);
        }
      }
    }
  }

  handleExportDeclaration(node, fileNode, sourceFile) {
    // Handle re-exports: export { x } from './y'
    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        node.exportClause.elements.forEach(element => {
          const name = element.name.text;
          fileNode.internalExports.set(name, { 
            type: 're-export', 
            source: specifier,
            start: node.getStart(sourceFile), 
            end: node.getEnd() 
          });
        });
      } else {
        // export * from './y'
        fileNode.internalExports.set('*', { type: 're-export-all', source: specifier });
      }
    }
  }

  handleNamedDeclaration(node, fileNode, sourceFile) {
    if (this.hasExportModifier(node)) {
      const isDefault = node.modifiers?.some(m => m.kind === ts.SyntaxKind.DefaultKeyword);
      const name = isDefault ? 'default' : (node.name?.text || 'anonymous');
      
      const exportInfo = {
        type: ts.SyntaxKind[node.kind].toLowerCase().replace('declaration', ''),
        start: node.getStart(sourceFile),
        end: node.getEnd()
      };

      fileNode.internalExports.set(name, exportInfo);
      
      // Phase 4: Drill down into members
      if (ts.isEnumDeclaration(node)) {
        exportInfo.members = node.members.map(m => m.name.getText(sourceFile));
      } else if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
        exportInfo.members = node.members
          .filter(m => m.name)
          .map(m => m.name.getText(sourceFile));
      } else if (ts.isModuleDeclaration(node)) {
        // Handle Namespaces
        const members = [];
        if (node.body && ts.isModuleBlock(node.body)) {
          node.body.statements.forEach(stmt => {
            if (this.hasExportModifier(stmt) && (ts.isVariableStatement(stmt) || ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt))) {
              if (ts.isVariableStatement(stmt)) {
                stmt.declarationList.declarations.forEach(d => members.push(d.name.getText(sourceFile)));
              } else if (stmt.name) {
                members.push(stmt.name.getText(sourceFile));
              }
            }
          });
        }
        exportInfo.members = members;
      }

      const loc = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      fileNode.symbolSourceLocations.set(name, { line: loc.line + 1, column: loc.character + 1 });
    }
  }

  handleVariableStatement(node, fileNode, sourceFile) {
    if (this.hasExportModifier(node)) {
      node.declarationList.declarations.forEach(decl => {
        if (decl.name && ts.isIdentifier(decl.name)) {
          const name = decl.name.text;
          fileNode.internalExports.set(name, { 
            type: 'variable', 
            start: decl.getStart(sourceFile), 
            end: decl.getEnd() 
          });
        }
      });
    }
  }

  handleCallExpression(node, fileNode, sourceFile) {
    // Trace dynamic imports
    if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        fileNode.explicitImports.add(arg.text);
        fileNode.dynamicImports.add(arg.text);
      }
    }
  }

  hasExportModifier(node) {
    return node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
  }

  isNodeDeclarationName(node) {
    const parent = node.parent;
    if (!parent) return false;
    return (ts.isVariableDeclaration(parent) || ts.isFunctionDeclaration(parent) || 
            ts.isClassDeclaration(parent) || ts.isInterfaceDeclaration(parent) || 
            ts.isEnumDeclaration(parent) || ts.isModuleDeclaration(parent)) && parent.name === node;
  }

  extractTopLevelJSDocSuppreessions(sourceFile, fileNode) {
    const fullText = sourceFile.text;
    const commentRegex = /\/\*\*?[\s\S]*?\*\/|\/\/.*/g;
    let match;
    while ((match = commentRegex.exec(fullText)) !== null) {
      const suppressMatches = match[0].match(/@scaffold-suppress\s+([a-zA-Z0-9_\-*:]+)/g);
      if (suppressMatches) {
        suppressMatches.forEach(m => fileNode.localSuppressedRules.add(m.replace('@scaffold-suppress', '').trim()));
      }
    }
  }
}
