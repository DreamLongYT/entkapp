/**
 * CodeSmellAnalyzer: Performs deep static analysis to find runtime risks and logic smells.
 */
export class CodeSmellAnalyzer {
  constructor(context) {
    this.context = context;
    this.issues = [];
    this.rules = {
      'potential-null-pointer': {
        message: 'Potential Null Pointer Risk: Accessing property on an object that might be undefined.',
        link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cant_access_property'
      },
      'infinite-loop-risk': {
        message: 'Potential Infinite Loop: Loop condition does not seem to change within the body.',
        link: 'https://en.wikipedia.org/wiki/Infinite_loop'
      },
      'implicit-type-coercion': {
        message: 'Implicit Type Coercion: Using loose equality (==) can lead to unexpected runtime behavior.',
        link: 'https://dorey.github.io/JavaScript-Equality-Table/'
      }
    };
  }

  analyze(fileNode) {
    if (!fileNode.ast) return;
    this.walk(fileNode.ast, fileNode);
  }

  walk(node, fileNode) {
    if (!node) return;

    // 1. Check for Loose Equality (==)
    if (node.type === 'BinaryExpression' && (node.operator === '==' || node.operator === '!=')) {
      this.addIssue('implicit-type-coercion', node, fileNode);
    }

    // 2. Check for Potential Infinite Loops (While loops with static conditions)
    if (node.type === 'WhileStatement' && node.test.type === 'Literal' && node.test.value === true) {
      // Check if there is a break or return inside
      if (!this.hasExitStatement(node.body)) {
        this.addIssue('infinite-loop-risk', node, fileNode);
      }
    }

    // 3. Check for Null Pointer Risks (Accessing properties on potentially uninitialized vars)
    if (node.type === 'MemberExpression' && node.object.type === 'Identifier') {
      const varName = node.object.name;
      if (this.isPotentiallyNull(varName, fileNode)) {
        this.addIssue('potential-null-pointer', node, fileNode);
      }
    }

    // Recursively walk the AST
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          node[key].forEach(child => this.walk(child, fileNode));
        } else {
          this.walk(node[key], fileNode);
        }
      }
    }
  }

  addIssue(ruleId, node, fileNode) {
    const rule = this.rules[ruleId];
    fileNode.diagnostics = fileNode.diagnostics || [];
    fileNode.diagnostics.push({
      ruleId,
      message: rule.message,
      link: rule.link,
      line: node.start ? this.getLineNumber(node.start, fileNode.content) : 0,
      severity: 'warning'
    });
  }

  hasExitStatement(node) {
    let found = false;
    const check = (n) => {
      if (!n || found) return;
      if (n.type === 'BreakStatement' || n.type === 'ReturnStatement' || n.type === 'ThrowStatement') {
        found = true;
        return;
      }
      for (const key in n) {
        if (n[key] && typeof n[key] === 'object') {
          if (Array.isArray(n[key])) n[key].forEach(check);
          else check(n[key]);
        }
      }
    };
    check(node);
    return found;
  }

  isPotentiallyNull(name, fileNode) {
    // Simple heuristic: if it's a variable declared without init or in a try-catch
    const symbol = fileNode.symbolTable?.get(name);
    return symbol && symbol.type === 'variable' && !symbol.initialized;
  }

  getLineNumber(pos, content) {
    if (!content) return 0;
    return content.substring(0, pos).split('\n').length;
  }
}
