/**
 * ============================================================================
 * Secret Detection Engine for pkg-scaffold v3.3.2 (AST + REGEX Fallback)
 * 
 * Uses OXC parser for fast, accurate detection of hardcoded secrets.
 * Falls back to REGEX patterns if AST parsing fails.
 * ============================================================================
 */

import fs from 'fs/promises';
import path from 'path';

export class SecretDetector {
  constructor(context) {
    this.context = context;
    this.secrets = [];
    
    // REGEX patterns for detecting secrets (fallback)
    this.regexPatterns = {
      apiKey: /['\"]?api[_-]?key['\"]?\s*[:=]\s*['\"]([a-zA-Z0-9\-_]{20,})['\"]?/gi,
      bearerToken: /bearer\s+([a-zA-Z0-9\-_\.]{20,})/gi,
      jwtToken: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
      awsAccessKey: /AKIA[0-9A-Z]{16}/g,
      awsSecretKey: /aws_secret_access_key\s*[:=]\s*['\"]([a-zA-Z0-9\/+]{40})['\"]?/gi,
      databaseUrl: /(postgres|mysql|mongodb|redis):\/\/([a-zA-Z0-9_-]+):([a-zA-Z0-9_\-@!$%^&*()+=]+)@/gi,
      dbPassword: /password\s*[:=]\s*['\"]([^'\"]{6,})['\"]?/gi,
      githubToken: /ghp_[a-zA-Z0-9]{36}/g,
      gitlabToken: /glpat-[a-zA-Z0-9_-]{20,}/g,
      privateKey: /-----BEGIN (RSA|DSA|EC|PGP|OPENSSH) PRIVATE KEY-----/g,
      slackWebhook: /https:\/\/hooks\.slack\.com\/services\/[a-zA-Z0-9\/]+/g,
      discordWebhook: /https:\/\/discord\.com\/api\/webhooks\/[a-zA-Z0-9\/]+/g,
      secretKey: /['\"]?secret[_-]?key['\"]?\s*[:=]\s*['\"]([a-zA-Z0-9\-_]{20,})['\"]?/gi,
      accessToken: /['\"]?access[_-]?token['\"]?\s*[:=]\s*['\"]([a-zA-Z0-9\-_\.]{20,})['\"]?/gi,
      stripeKey: /sk_live_[a-zA-Z0-9]{24,}/g,
      googleApiKey: /AIza[0-9A-Za-z\-_]{35}/g,
    };

    // Secret pattern metadata
    this.secretMetadata = {
      apiKey: { severity: 'HIGH', keywords: ['api_key', 'apikey'] },
      bearerToken: { severity: 'CRITICAL', keywords: ['bearer', 'token'] },
      jwtToken: { severity: 'CRITICAL', keywords: ['jwt', 'token'] },
      awsAccessKey: { severity: 'CRITICAL', keywords: ['aws', 'access'] },
      awsSecretKey: { severity: 'CRITICAL', keywords: ['aws', 'secret'] },
      databaseUrl: { severity: 'CRITICAL', keywords: ['database', 'db', 'postgres', 'mysql'] },
      dbPassword: { severity: 'CRITICAL', keywords: ['password', 'passwd'] },
      githubToken: { severity: 'CRITICAL', keywords: ['github', 'token'] },
      gitlabToken: { severity: 'CRITICAL', keywords: ['gitlab', 'token'] },
      privateKey: { severity: 'CRITICAL', keywords: ['private', 'key', 'pem'] },
      slackWebhook: { severity: 'HIGH', keywords: ['slack', 'webhook'] },
      discordWebhook: { severity: 'HIGH', keywords: ['discord', 'webhook'] },
      secretKey: { severity: 'HIGH', keywords: ['secret', 'key'] },
      accessToken: { severity: 'CRITICAL', keywords: ['access', 'token'] },
      stripeKey: { severity: 'CRITICAL', keywords: ['stripe', 'key'] },
      googleApiKey: { severity: 'HIGH', keywords: ['google', 'api'] },
    };
  }

  /**
   * Scans a file for hardcoded secrets using REGEX
   */
  scanFileForSecretsRegex(filePath, content) {
    const detectedSecrets = [];
    const lines = content.split('\n');

    lines.forEach((line, lineIndex) => {
      // Skip comments and empty lines
      if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('*') || !line.trim()) {
        return;
      }

      // Check each pattern
      for (const [patternName, pattern] of Object.entries(this.regexPatterns)) {
        const matches = [...line.matchAll(pattern)];
        
        for (const match of matches) {
          const metadata = this.secretMetadata[patternName] || { severity: 'MEDIUM', keywords: [] };
          
          detectedSecrets.push({
            file: filePath,
            line: lineIndex + 1,
            column: match.index + 1,
            type: patternName,
            secret: match[0].substring(0, 20) + '***',
            severity: metadata.severity,
            variable: this.extractVariableName(line, match.index)
          });
        }
      }
    });

    return detectedSecrets;
  }

  /**
   * Extracts variable name from line
   */
  extractVariableName(line, matchIndex) {
    // Look backwards for variable assignment
    const beforeMatch = line.substring(0, matchIndex);
    const varMatch = beforeMatch.match(/(?:const|let|var|=)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[:=]?/);
    if (varMatch) return varMatch[1];
    
    // Look for object property
    const propMatch = beforeMatch.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[:=]\s*$/);
    if (propMatch) return propMatch[1];
    
    return 'unknown';
  }

  /**
   * Scans entire codebase for secrets (reads from disk)
   */
  async scanCodebaseForSecrets(context) {
    this.secrets = [];
    this.cwd = context?.cwd || this.context.cwd;
    const cwd = this.cwd;

    try {
      // Recursively scan all source files
      await this.scanDirectory(cwd);
    } catch (e) {
      console.error('Error scanning codebase for secrets:', e.message);
    }

    return this.secrets;
  }

  /**
   * Recursively scans directory for source files
   */
  async scanDirectory(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip node_modules, dist, build, .git
        if (['node_modules', 'dist', 'build', '.git', '.scaffold-cache', '.next', 'out'].includes(entry.name)) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.env', '.env.local'].includes(ext)) {
            await this.scanFile(fullPath);
          }
        }
      }
    } catch (e) {
      // Silently skip directories that can't be read
    }
  }

  /**
   * Scans a single file for secrets
   */
  async scanFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Try AST parsing first (if available)
      let detectedSecrets = [];
      try {
        detectedSecrets = this.scanFileForSecretsAST(filePath, content);
      } catch (e) {
        // Fall back to REGEX if AST fails
        detectedSecrets = this.scanFileForSecretsRegex(filePath, content);
      }

      // If AST returned nothing, try REGEX as additional pass
      if (detectedSecrets.length === 0) {
        detectedSecrets = this.scanFileForSecretsRegex(filePath, content);
      }

      this.secrets.push(...detectedSecrets);
    } catch (e) {
      // Skip files that can't be read
    }
  }

  /**
   * Scans file using AST (with OXC if available)
   */
  scanFileForSecretsAST(filePath, content) {
    const detectedSecrets = [];

    try {
      // Try to use OXC parser if available
      let ast;
      try {
        const { parseSync } = require('oxc-parser');
        ast = parseSync(content, {
          sourceType: 'module',
          ecmaVersion: 'latest'
        });
      } catch (e) {
        // OXC not available, fall back to REGEX
        return this.scanFileForSecretsRegex(filePath, content);
      }

      // Walk AST and find variable assignments with secret values
      this.walkAST(ast, (node) => {
        // Variable declarations: const API_KEY = "sk_..."
        if (node.type === 'VariableDeclarator' && node.init) {
          const varName = node.id?.name || '';
          const secret = this.extractSecretValue(node.init);
          
          if (secret) {
            const detectedType = this.classifySecret(varName, secret.value);
            if (detectedType) {
              detectedSecrets.push({
                file: filePath,
                line: node.loc?.start?.line || 0,
                column: node.loc?.start?.column || 0,
                type: detectedType.type,
                severity: detectedType.severity,
                variable: varName,
                secret: secret.value.substring(0, 20) + '***'
              });
            }
          }
        }

        // Object properties: { password: "...", apiKey: "..." }
        if (node.type === 'Property' && node.value) {
          const propName = node.key?.name || node.key?.value || '';
          const secret = this.extractSecretValue(node.value);
          
          if (secret) {
            const detectedType = this.classifySecret(propName, secret.value);
            if (detectedType) {
              detectedSecrets.push({
                file: filePath,
                line: node.loc?.start?.line || 0,
                column: node.loc?.start?.column || 0,
                type: detectedType.type,
                severity: detectedType.severity,
                variable: propName,
                secret: secret.value.substring(0, 20) + '***'
              });
            }
          }
        }

        // Assignment expressions: API_KEY = "..."
        if (node.type === 'AssignmentExpression' && node.right) {
          const varName = node.left?.name || '';
          const secret = this.extractSecretValue(node.right);
          
          if (secret) {
            const detectedType = this.classifySecret(varName, secret.value);
            if (detectedType) {
              detectedSecrets.push({
                file: filePath,
                line: node.loc?.start?.line || 0,
                column: node.loc?.start?.column || 0,
                type: detectedType.type,
                severity: detectedType.severity,
                variable: varName,
                secret: secret.value.substring(0, 20) + '***'
              });
            }
          }
        }
      });
    } catch (e) {
      // Return empty on error, will fall back to REGEX
      return [];
    }

    return detectedSecrets;
  }

  /**
   * Extracts string value from AST node
   */
  extractSecretValue(node) {
    if (node.type === 'StringLiteral' || node.type === 'Literal') {
      return { value: node.value || '' };
    }
    if (node.type === 'TemplateLiteral') {
      return { value: node.quasis?.[0]?.value?.raw || '' };
    }
    return null;
  }

  /**
   * Classifies a secret based on variable name and value
   */
  classifySecret(variableName, value) {
    const lowerName = variableName.toLowerCase();

    for (const [type, metadata] of Object.entries(this.secretMetadata)) {
      const pattern = this.regexPatterns[type];
      if (!pattern) continue;

      // Check if variable name matches keywords
      const nameMatches = metadata.keywords.some(kw => lowerName.includes(kw));
      
      // Check if value matches pattern
      const valueMatches = pattern.test(value);

      if ((nameMatches && value.length > 8) || valueMatches) {
        return { type, severity: metadata.severity };
      }
    }

    return null;
  }

  /**
   * Simple AST walker
   */
  walkAST(node, callback) {
    if (!node || typeof node !== 'object') return;

    callback(node);

    for (const key in node) {
      if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') continue;
      
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(item => this.walkAST(item, callback));
      } else if (typeof child === 'object') {
        this.walkAST(child, callback);
      }
    }
  }

  /**
   * Formats secrets for reporting
   */
  formatSecretsForReport() {
    if (this.secrets.length === 0) return [];

    return this.secrets.map(secret => ({
      file: secret.file,
      line: secret.line,
      column: secret.column,
      type: secret.type,
      severity: secret.severity,
      variable: secret.variable,
      redacted: secret.secret
    }));
  }

  /**
   * Gets secrets by severity level
   */
  getSecretsBySeverity(severity) {
    return this.secrets.filter(s => s.severity === severity);
  }

  /**
   * Gets critical secrets only
   */
  getCriticalSecrets() {
    return this.getSecretsBySeverity('CRITICAL');
  }

  /**
   * Gets count of secrets by type
   */
  getSecretStats() {
    const stats = {};
    this.secrets.forEach(secret => {
      stats[secret.type] = (stats[secret.type] || 0) + 1;
    });
    return stats;
  }
}

export default SecretDetector;
