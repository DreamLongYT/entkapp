export class OxcAnalyzer {
  constructor(context) {
    this.context = context;
    try {
      this.oxc = require("oxc-parser");
      this.isAvailable = true;
    } catch (e) {
      this.isAvailable = false;
      if (this.context.verbose) {
        console.warn("[OxcAnalyzer] oxc-parser not found, falling back to TypeScript compiler API.");
      }
    }
  }

  parseFile(filePath, content, fileNode) {
    if (!this.isAvailable) return false;

    try {
      if (this.context.verbose) {
        console.log(`[OXC] Fast-parsing: ${filePath}`);
      }

      const ast = this.oxc.parseSync(content, {
        sourceType: "module",
        sourceFilename: filePath,
        ecmaVersion: "latest",
      });

      // Initialize new properties for JSX and Decorator analysis
      fileNode.jsxComponents = new Set();
      fileNode.jsxProps = new Set();
      fileNode.decorators = new Set();

      this.walkOxcAst(ast.program, fileNode, content);
      return true;
    } catch (e) {
      if (this.context.verbose) {
        console.warn(`[OXC] Failed to parse ${filePath}: ${e.message}`);
      }
      return false;
    }
  }

  walkOxcAst(node, fileNode, content) {
    if (!node) return;

    switch (node.type) {
      case "ImportDeclaration":
        this.handleImportDeclaration(node, fileNode);
        break;
      case "ExportNamedDeclaration":
      case "ExportDefaultDeclaration":
      case "ExportAllDeclaration":
        this.handleExportDeclaration(node, fileNode, content);
        break;
      case "CallExpression":
        this.handleCallExpression(node, fileNode);
        break;
      case "JSXElement":
      case "JSXFragment": // Consider fragments as well
        this.handleJsxElement(node, fileNode);
        break;
      case "Decorator":
        this.handleDecorator(node, fileNode);
        break;
    }

    // Traverse children
    for (const key in node) {
      if (node[key] && typeof node[key] === "object") {
        if (Array.isArray(node[key])) {
          node[key].forEach((child) => this.walkOxcAst(child, fileNode, content));
        } else {
          this.walkOxcAst(node[key], fileNode, content);
        }
      }
    }
  }

  handleImportDeclaration(node, fileNode) {
    const specifier = node.source.value;
    fileNode.explicitImports.add(specifier);

    if (node.specifiers) {
      node.specifiers.forEach((spec) => {
        if (spec.type === "ImportSpecifier") {
          const importedName = spec.imported.name;
          const localName = spec.local.name;
          fileNode.importedSymbols.add(`${specifier}:${importedName}`);
        } else if (spec.type === "ImportDefaultSpecifier") {
          fileNode.importedSymbols.add(`${specifier}:default`);
        } else if (spec.type === "ImportNamespaceSpecifier") {
          fileNode.importedSymbols.add(`${specifier}:*`);
        }
      });
    }
  }

  handleExportDeclaration(node, fileNode, content) {
    if (node.type === "ExportDefaultDeclaration") {
      fileNode.internalExports.set("default", { type: "default", start: node.start, end: node.end });
      return;
    }

    if (node.type === "ExportAllDeclaration") {
      if (node.exported && node.exported.type === "ExportNamespaceSpecifier") {
        // export * as name from 'module'
        const name = node.exported.name;
        fileNode.internalExports.set(name, { type: "re-export-namespace", source: node.source.value, originalName: "*", start: node.start, end: node.end });
      } else {
        // export * from 'module'
        fileNode.internalExports.set("*", { type: "re-export-all", source: node.source.value });
      }
      return;
    }

    if (node.source) {
      // Re-export
      const specifier = node.source.value;
      if (node.specifiers) {
        node.specifiers.forEach((spec) => {
          const exportedName = spec.exported.name;
          const localName = spec.local.name;
          fileNode.internalExports.set(exportedName, {
            type: "re-export",
            source: specifier,
            originalName: localName,
            start: node.start,
            end: node.end,
          });
        });
      }
    } else if (node.declaration) {
      // Direct export
      const decl = node.declaration;
      if (decl.type === "VariableDeclaration") {
        decl.declarations.forEach((d) => {
          if (d.id.type === "Identifier") {
            fileNode.internalExports.set(d.id.name, { type: "variable", start: d.start, end: d.end });
          } else if (d.id.type === "ObjectPattern") {
            d.id.properties.forEach((p) => {
              if (p.type === "Property" && p.value.type === "Identifier") {
                fileNode.internalExports.set(p.value.name, { type: "variable", start: p.start, end: p.end });
              }
            });
          } else if (d.id.type === "ArrayPattern") {
            d.id.elements.forEach((e) => {
              if (e && e.type === "Identifier") {
                fileNode.internalExports.set(e.name, { type: "variable", start: e.start, end: e.end });
              }
            });
          }
        });
      } else if (decl.id && decl.id.name) {
        let type = "unknown";
        if (decl.type === "FunctionDeclaration") type = "function";
        else if (decl.type === "ClassDeclaration") type = "class";
        else if (decl.type === "TSEnumDeclaration") type = "enum";
        else if (decl.type === "TSInterfaceDeclaration") type = "interface";
        else if (decl.type === "TSTypeAliasDeclaration") type = "type";
        else if (decl.type === "TSModuleDeclaration") type = "namespace";

        const exportInfo = { type, start: decl.start, end: decl.end };
        fileNode.internalExports.set(decl.id.name, exportInfo);

        if (decl.type === "TSEnumDeclaration") {
          exportInfo.members = decl.members.map((m) => m.id.name || (m.id.type === "Identifier" ? m.id.name : ""));
        } else if (decl.type === "TSInterfaceDeclaration" || decl.type === "ClassDeclaration") {
          exportInfo.members = decl.body.body.filter((m) => m.key && m.key.name).map((m) => m.key.name);
        }
      }
    } else if (node.specifiers) {
      node.specifiers.forEach((spec) => {
        const exportedName = spec.exported.name;
        const localName = spec.local.name;
        fileNode.internalExports.set(exportedName, {
          type: "export",
          originalName: localName,
          start: node.start,
          end: node.end,
        });
      });
    }
  }

  handleCallExpression(node, fileNode) {
    if (node.callee.type === "Import" && node.arguments.length > 0 && node.arguments[0].type === "StringLiteral") {
      const specifier = node.arguments[0].value;
      fileNode.explicitImports.add(specifier);
      fileNode.dynamicImports.add(specifier);
    } else if (node.callee.type === "Identifier" && node.callee.name === "require" && node.arguments.length > 0 && node.arguments[0].type === "StringLiteral") {
      fileNode.explicitImports.add(node.arguments[0].value);
    }
  }

  handleJsxElement(node, fileNode) {
    const getElementName = (nameNode) => {
      if (nameNode.type === "JSXIdentifier") return nameNode.name;
      if (nameNode.type === "JSXMemberExpression") return `${getElementName(nameNode.object)}.${nameNode.property.name}`;
      return "unknown";
    };

    if (node.openingElement) {
      const tagName = getElementName(node.openingElement.name);
      fileNode.jsxComponents.add(tagName);

      if (node.openingElement.attributes) {
        node.openingElement.attributes.forEach(attr => {
          if (attr.type === "JSXAttribute" && attr.name.type === "JSXIdentifier") {
            fileNode.jsxProps.add(`${tagName}:${attr.name.name}`);
          }
        });
      }
    }
  }

  handleDecorator(node, fileNode) {
    const getDecoratorName = (expr) => {
      if (expr.type === "Identifier") return expr.name;
      if (expr.type === "CallExpression" && expr.callee.type === "Identifier") return expr.callee.name;
      if (expr.type === "CallExpression" && expr.callee.type === "MemberExpression" && expr.callee.property.type === "Identifier") return expr.callee.property.name;
      return "unknown";
    };

    const decoratorName = getDecoratorName(node.expression);
    fileNode.decorators.add(decoratorName);

    // Optionally, extract decorator arguments
    if (node.expression.type === "CallExpression") {
      node.expression.arguments.forEach(arg => {
        // Further analysis of arguments can be done here if needed
        // e.g., if (arg.type === "StringLiteral") fileNode.decoratorArgs.add(`${decoratorName}:${arg.value}`);
      });
    }
  }
}
