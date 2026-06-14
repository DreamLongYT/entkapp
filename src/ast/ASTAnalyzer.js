import ts from 'typescript';

export class ASTAnalyzer {
  constructor(context) {
    this.context = context;
    this.scopeStack = [];
  }

  parseFile(filePath, content, fileNode) {
    if (this.context.verbose) {
      console.log(`[AST] Parsing: ${filePath}`);
    }

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith('.tsx') || filePath.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    this.currentScope = { symbols: new Map(), parent: null };
    this.scopeStack.push(this.currentScope);

    this.extractTopLevelJSDocSuppreessions(sourceFile, fileNode);
    this.walkAST(sourceFile, fileNode, sourceFile);

    this.scopeStack.pop(); // Pop the global scope
    this.currentScope = null;
  }

  pushScope() {
    const newScope = { symbols: new Map(), parent: this.currentScope };
    this.scopeStack.push(newScope);
    this.currentScope = newScope;
  }

  popScope() {
    if (this.scopeStack.length > 1) {
      this.scopeStack.pop();
      this.currentScope = this.scopeStack[this.scopeStack.length - 1];
    }
  }

  addDeclaredSymbol(name, node, sourceFile) {
    if (this.currentScope) {
      const loc = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      this.currentScope.symbols.set(name, { node, line: loc.line + 1, column: loc.character + 1 });
    }
  }

  resolveSymbol(name) {
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scope = this.scopeStack[i];
      if (scope.symbols.has(name)) {
        return scope.symbols.get(name);
      }
    }
    return null;
  }

  walkAST(node, fileNode, sourceFile) {
    // Handle scope entry for blocks, functions, classes, etc.
    const isScopeNode = ts.isBlock(node) || ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isModuleDeclaration(node);
    if (isScopeNode) {
      this.pushScope();
    }

    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration:
        this.handleImportDeclaration(node, fileNode, sourceFile);
        break;
      case ts.SyntaxKind.ExportDeclaration:
        this.handleExportDeclaration(node, fileNode, sourceFile);
        break;
      case ts.SyntaxKind.ExportAssignment:
        fileNode.internalExports.set('default', { type: 'default', start: node.getStart(sourceFile), end: node.getEnd() });
        break;
      case ts.SyntaxKind.VariableStatement:
        this.handleVariableStatement(node, fileNode, sourceFile);
        break;
      case ts.SyntaxKind.FunctionDeclaration:
      case ts.SyntaxKind.ClassDeclaration:
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.TypeAliasDeclaration:
      case ts.SyntaxKind.EnumDeclaration:
      case ts.SyntaxKind.ModuleDeclaration:
        this.handleNamedDeclaration(node, fileNode, sourceFile);
        break;
      case ts.SyntaxKind.CallExpression:
        this.handleCallExpression(node, fileNode, sourceFile);
        break;
      case ts.SyntaxKind.JsxElement:
      case ts.SyntaxKind.JsxSelfClosingElement:
        this.handleJsxElement(node, fileNode, sourceFile);
        break;
      case ts.SyntaxKind.Decorator:
        this.handleDecorator(node, fileNode, sourceFile);
        break;
      case ts.SyntaxKind.Identifier:
        // Track usage of identifiers
        const symbol = this.resolveSymbol(node.text);
        if (symbol) {
          // fileNode.usedSymbols.add(`${symbol.node.parent.kind}:${node.text}`); // More granular tracking needed
        }
        break;
    }

    ts.forEachChild(node, child => this.walkAST(child, fileNode, sourceFile));

    if (isScopeNode) {
      this.popScope();
    }
  }

  handleImportDeclaration(node, fileNode, sourceFile) {
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
              this.addDeclaredSymbol(element.name.text, element, sourceFile); // Add local import name to scope
            });
          } else if (ts.isNamespaceImport(node.importClause.namedBindings)) {
            fileNode.importedSymbols.add(`${specifier}:*`);
            this.addDeclaredSymbol(node.importClause.namedBindings.name.text, node.importClause.namedBindings, sourceFile); // Add namespace import to scope
          }
        }
        if (node.importClause.name) {
          fileNode.importedSymbols.add(`${specifier}:default`);
          this.addDeclaredSymbol(node.importClause.name.text, node.importClause.name, sourceFile); // Add default import to scope
        }
      }
    }
  }

  handleExportDeclaration(node, fileNode, sourceFile) {
    if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const specifier = node.moduleSpecifier.text;
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        node.exportClause.elements.forEach(element => {
          const name = element.name.text;
          const propertyName = element.propertyName ? element.propertyName.text : name;
          fileNode.internalExports.set(name, { 
            type: 're-export', 
            source: specifier,
            originalName: propertyName,
            start: node.getStart(sourceFile), 
            end: node.getEnd() 
          });
        });
      } else if (node.exportClause && ts.isNamespaceExport(node.exportClause)) {
        // export * as name from 'module'
        const name = node.exportClause.name.text;
        fileNode.internalExports.set(name, { type: 're-export-namespace', source: specifier, originalName: '*', start: node.getStart(sourceFile), end: node.getEnd() });
      } else {
        // export * from 'module'
        fileNode.internalExports.set('*', { type: 're-export-all', source: specifier });
      }
    } else if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        node.exportClause.elements.forEach(element => {
          const name = element.name.text;
          const propertyName = element.propertyName ? element.propertyName.text : name;
          fileNode.internalExports.set(name, { 
            type: 'export', 
            originalName: propertyName,
            start: node.getStart(sourceFile), 
            end: node.getEnd() 
          });
        });
    } else if (node.declaration) {
      // Direct export of a declaration (e.g., export const x = 1;)
      if (ts.isVariableStatement(node.declaration)) {
        node.declaration.declarationList.declarations.forEach(decl => {
          if (decl.name && ts.isIdentifier(decl.name)) {
            const name = decl.name.text;
            fileNode.internalExports.set(name, { 
              type: 'variable', 
              start: decl.getStart(sourceFile), 
              end: decl.getEnd() 
            });
            this.addDeclaredSymbol(name, decl, sourceFile);
          }
        });
      } else if (ts.isFunctionDeclaration(node.declaration) || ts.isClassDeclaration(node.declaration)) {
        const name = node.declaration.name?.text;
        if (name) {
          fileNode.internalExports.set(name, { 
            type: ts.SyntaxKind[node.declaration.kind].toLowerCase().replace('declaration', ''), 
            start: node.declaration.getStart(sourceFile), 
            end: node.declaration.getEnd() 
          });
          this.addDeclaredSymbol(name, node.declaration, sourceFile);
        }
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

      if (ts.isEnumDeclaration(node)) {
        exportInfo.members = node.members.map(m => ({
          name: m.name.getText(sourceFile),
          type: 'enumMember',
          start: m.getStart(sourceFile),
          end: m.getEnd()
        }));
      } else if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
        exportInfo.members = node.members
          .filter(m => m.name)
          .map(m => ({
            name: m.name.getText(sourceFile),
            type: ts.SyntaxKind[m.kind].toLowerCase(),
            start: m.getStart(sourceFile),
            end: m.getEnd()
          }));
      } else if (ts.isModuleDeclaration(node)) {
        const members = [];
        if (node.body && ts.isModuleBlock(node.body)) {
          node.body.statements.forEach(stmt => {
            if (this.hasExportModifier(stmt) && (ts.isVariableStatement(stmt) || ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt))) {
              if (ts.isVariableStatement(stmt)) {
                stmt.declarationList.declarations.forEach(d => members.push({
                  name: d.name.getText(sourceFile),
                  type: 'variable',
                  start: d.getStart(sourceFile),
                  end: d.getEnd()
                }));
              } else if (stmt.name) {
                members.push({
                  name: stmt.name.getText(sourceFile),
                  type: ts.SyntaxKind[stmt.kind].toLowerCase().replace('declaration', ''),
                  start: stmt.getStart(sourceFile),
                  end: stmt.getEnd()
                });
              }
            }
          });
        }
        exportInfo.members = members;
      }
      
      const loc = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      fileNode.symbolSourceLocations.set(name, { line: loc.line + 1, column: loc.character + 1 });
      this.addDeclaredSymbol(name, node, sourceFile);
    } else if (node.name && ts.isIdentifier(node.name)) {
      this.addDeclaredSymbol(node.name.text, node, sourceFile);
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
          this.addDeclaredSymbol(name, decl, sourceFile);
        } else if (decl.name && ts.isObjectBindingPattern(decl.name)) {
           decl.name.elements.forEach(element => {
               if(element.name && ts.isIdentifier(element.name)) {
                   const name = element.name.text;
                   fileNode.internalExports.set(name, {
                       type: 'variable',
                       start: element.getStart(sourceFile),
                       end: element.getEnd()
                   });
                   this.addDeclaredSymbol(name, element, sourceFile);
               }
           });
        } else if (decl.name && ts.isArrayBindingPattern(decl.name)) {
            decl.name.elements.forEach(element => {
               if(ts.isBindingElement(element) && element.name && ts.isIdentifier(element.name)) {
                   const name = element.name.text;
                   fileNode.internalExports.set(name, {
                       type: 'variable',
                       start: element.getStart(sourceFile),
                       end: element.getEnd()
                   });
                   this.addDeclaredSymbol(name, element, sourceFile);
               }
           });
        }
      });
    } else {
      // Non-exported variable declarations also need to be added to scope
      node.declarationList.declarations.forEach(decl => {
        if (decl.name && ts.isIdentifier(decl.name)) {
          this.addDeclaredSymbol(decl.name.text, decl, sourceFile);
        } else if (decl.name && ts.isObjectBindingPattern(decl.name)) {
          decl.name.elements.forEach(element => {
            if (element.name && ts.isIdentifier(element.name)) {
              this.addDeclaredSymbol(element.name.text, element, sourceFile);
            }
          });
        } else if (decl.name && ts.isArrayBindingPattern(decl.name)) {
          decl.name.elements.forEach(element => {
            if (ts.isBindingElement(element) && element.name && ts.isIdentifier(element.name)) {
              this.addDeclaredSymbol(element.name.text, element, sourceFile);
            }
          });
        }
      });
    }
  }

  handleCallExpression(node, fileNode, sourceFile) {
    if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        fileNode.explicitImports.add(arg.text);
        fileNode.dynamicImports.add(arg.text);
      }
    } else if (ts.isIdentifier(node.expression) && node.expression.text === 'require') {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        fileNode.explicitImports.add(arg.text);
      }
    }
  }

  handleJsxElement(node, fileNode, sourceFile) {
    const getElementName = (name) => {
      if (ts.isIdentifier(name)) return name.text;
      if (ts.isPropertyAccessExpression(name)) return name.name.text;
      return 'unknown';
    };

    const tagName = getElementName(node.openingElement.tagName);
    fileNode.jsxComponents.add(tagName);

    node.openingElement.attributes.properties.forEach(attr => {
      if (ts.isJsxAttribute(attr) && ts.isIdentifier(attr.name)) {
        fileNode.jsxProps.add(`${tagName}:${attr.name.text}`);
      }
    });
  }

  handleDecorator(node, fileNode, sourceFile) {
    const getDecoratorName = (expr) => {
      if (ts.isIdentifier(expr)) return expr.text;
      if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression)) return expr.expression.text;
      if (ts.isCallExpression(expr) && ts.isPropertyAccessExpression(expr.expression)) return expr.expression.name.text;
      return 'unknown';
    };

    const decoratorName = getDecoratorName(node.expression);
    fileNode.decorators.add(decoratorName);

    // Optionally, extract decorator arguments
    if (ts.isCallExpression(node.expression)) {
      node.expression.arguments.forEach(arg => {
        // Further analysis of arguments can be done here if needed
        // e.g., if (ts.isStringLiteral(arg)) fileNode.decoratorArgs.add(`${decoratorName}:${arg.text}`);
      });
    }
  }

  hasExportModifier(node) {
    return node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword) ?? false;
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
