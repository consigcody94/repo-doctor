import * as fs from 'fs';
import * as path from 'path';
import { SecurityFinding, SecurityMetrics } from '../types';

const SECRET_PATTERNS = [
  // Cloud Provider Keys
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical' as const,
  },
  {
    name: 'AWS Secret Key',
    pattern: /aws[_-]?secret[_-]?access[_-]?key[_-]?[:=]\s*['"]?([a-zA-Z0-9/+=]{40})/gi,
    severity: 'critical' as const,
  },
  {
    name: 'Google Cloud API Key',
    pattern: /AIza[0-9A-Za-z\\-_]{35}/g,
    severity: 'critical' as const,
  },
  {
    name: 'Azure Client Secret',
    pattern: /client[_-]?secret[_-]?[:=]\s*['"]?([a-zA-Z0-9~._-]{34,})/gi,
    severity: 'critical' as const,
  },
  {
    name: 'Cloudflare API Token',
    pattern: /cloudflare[_-]?api[_-]?token[_-]?[:=]\s*['"]?([a-zA-Z0-9_-]{40})/gi,
    severity: 'critical' as const,
  },

  // Version Control
  {
    name: 'GitHub Token (ghp)',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'critical' as const,
  },
  {
    name: 'GitHub OAuth Token',
    pattern: /gho_[a-zA-Z0-9]{36}/g,
    severity: 'critical' as const,
  },
  {
    name: 'GitHub App Token',
    pattern: /ghs_[a-zA-Z0-9]{36}/g,
    severity: 'critical' as const,
  },
  {
    name: 'GitHub Refresh Token',
    pattern: /ghr_[a-zA-Z0-9]{36}/g,
    severity: 'critical' as const,
  },
  {
    name: 'GitLab Token',
    pattern: /glpat-[a-zA-Z0-9_-]{20}/g,
    severity: 'critical' as const,
  },

  // Communication Platforms
  {
    name: 'Slack Token',
    pattern: /xox[baprs]-[0-9a-zA-Z-]{10,}/g,
    severity: 'critical' as const,
  },
  {
    name: 'Slack Webhook',
    pattern: /https:\/\/hooks\.slack\.com\/services\/T[a-zA-Z0-9_]{8}\/B[a-zA-Z0-9_]{8}\/[a-zA-Z0-9_]{24}/g,
    severity: 'critical' as const,
  },
  {
    name: 'Discord Webhook',
    pattern: /https:\/\/discord(?:app)?\.com\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+/g,
    severity: 'warning' as const,
  },
  {
    name: 'Telegram Bot Token',
    pattern: /[0-9]{8,10}:[a-zA-Z0-9_-]{35}/g,
    severity: 'critical' as const,
  },

  // Payment & Financial
  {
    name: 'Stripe API Key',
    pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
    severity: 'critical' as const,
  },
  {
    name: 'Stripe Restricted Key',
    pattern: /rk_live_[0-9a-zA-Z]{24,}/g,
    severity: 'critical' as const,
  },
  {
    name: 'PayPal Access Token',
    pattern: /access_token\$production\$[0-9a-z]{16}\$[0-9a-f]{32}/gi,
    severity: 'critical' as const,
  },
  {
    name: 'Square Access Token',
    pattern: /sq0atp-[0-9A-Za-z\-_]{22}/g,
    severity: 'critical' as const,
  },

  // Database
  {
    name: 'MongoDB Connection String',
    pattern: /mongodb(\+srv)?:\/\/[^\s'"]+/gi,
    severity: 'warning' as const,
  },
  {
    name: 'PostgreSQL Connection String',
    pattern: /postgres(ql)?:\/\/[^\s'"]+/gi,
    severity: 'warning' as const,
  },
  {
    name: 'MySQL Connection String',
    pattern: /mysql:\/\/[^\s'"]+/gi,
    severity: 'warning' as const,
  },
  {
    name: 'Redis Connection String',
    pattern: /redis:\/\/[^\s'"]+/gi,
    severity: 'warning' as const,
  },

  // General Secrets
  {
    name: 'Generic API Key',
    pattern: /api[_-]?key[_-]?[:=]\s*['"]?([a-zA-Z0-9_-]{32,})/gi,
    severity: 'warning' as const,
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN\s+(RSA\s+|EC\s+|OPENSSH\s+)?PRIVATE KEY-----/g,
    severity: 'critical' as const,
  },
  {
    name: 'Password in Code',
    pattern: /password\s*[:=]\s*['"]([^'"]{8,})['"]/gi,
    severity: 'warning' as const,
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
    severity: 'warning' as const,
  },
  {
    name: 'Bearer Token',
    pattern: /Bearer\s+[a-zA-Z0-9_\-\.=]+/gi,
    severity: 'warning' as const,
  },
  {
    name: 'Basic Auth',
    pattern: /Authorization:\s*Basic\s+[a-zA-Z0-9+/=]+/gi,
    severity: 'warning' as const,
  },

  // Service-Specific
  {
    name: 'Twilio API Key',
    pattern: /SK[0-9a-fA-F]{32}/g,
    severity: 'critical' as const,
  },
  {
    name: 'SendGrid API Key',
    pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/g,
    severity: 'critical' as const,
  },
  {
    name: 'Mailgun API Key',
    pattern: /key-[0-9a-zA-Z]{32}/g,
    severity: 'critical' as const,
  },
  {
    name: 'NPM Token',
    pattern: /npm_[a-zA-Z0-9]{36}/g,
    severity: 'critical' as const,
  },
  {
    name: 'PyPI Token',
    pattern: /pypi-[a-zA-Z0-9_-]{100,}/g,
    severity: 'critical' as const,
  },
  {
    name: 'Docker Hub Token',
    pattern: /dckr_pat_[a-zA-Z0-9_-]{36}/g,
    severity: 'critical' as const,
  },
  {
    name: 'Heroku API Key',
    pattern: /heroku[_-]?api[_-]?key[_-]?[:=]\s*['"]?([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/gi,
    severity: 'critical' as const,
  },
  {
    name: 'Firebase API Key',
    pattern: /AIza[0-9A-Za-z_-]{35}/g,
    severity: 'warning' as const,
  },
];

const SENSITIVE_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  'credentials.json',
  'secrets.yml',
  'secrets.yaml',
  'id_rsa',
  'id_dsa',
  '.npmrc',
  '.pypirc',
  'config/database.yml',
  'config/secrets.yml',
];

const BINARY_EXTENSIONS = [
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.bin',
  '.dat',
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.7z',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
];

export class SecurityScanner {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async scan(): Promise<SecurityMetrics> {
    const potentialSecrets: SecurityFinding[] = [];
    const sensitiveFiles: string[] = [];
    const exposedKeys: SecurityFinding[] = [];

    await this.scanDirectory(this.repoPath, potentialSecrets, sensitiveFiles, exposedKeys);

    return {
      potentialSecrets,
      sensitiveFiles,
      exposedKeys,
    };
  }

  private async scanDirectory(
    dir: string,
    secrets: SecurityFinding[],
    sensitiveFiles: string[],
    keys: SecurityFinding[],
    relativePath: string = ''
  ): Promise<void> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);

      // Skip node_modules, .git, dist, etc.
      if (this.shouldSkipPath(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, secrets, sensitiveFiles, keys, relPath);
      } else {
        // Check for sensitive files
        if (this.isSensitiveFile(entry.name)) {
          sensitiveFiles.push(relPath);
        }

        // Skip binary files
        if (this.isBinaryFile(entry.name)) {
          continue;
        }

        // Scan file content for secrets
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          this.scanFileContent(content, relPath, secrets, keys);
        } catch (error) {
          // Skip files that can't be read as text
          continue;
        }
      }
    }
  }

  private scanFileContent(
    content: string,
    filePath: string,
    secrets: SecurityFinding[],
    keys: SecurityFinding[]
  ): void {
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      for (const pattern of SECRET_PATTERNS) {
        const matches = line.matchAll(pattern.pattern);

        for (const match of matches) {
          const finding: SecurityFinding = {
            file: filePath,
            line: lineNumber,
            type: pattern.name,
            match: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
            severity: pattern.severity,
          };

          if (pattern.name.includes('Private Key')) {
            keys.push(finding);
          } else {
            secrets.push(finding);
          }
        }
      }
    }
  }

  private shouldSkipPath(name: string): boolean {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'out'];
    return skipDirs.includes(name);
  }

  private isSensitiveFile(filename: string): boolean {
    return SENSITIVE_FILES.some((sensitive) => filename.endsWith(sensitive));
  }

  private isBinaryFile(filename: string): boolean {
    return BINARY_EXTENSIONS.some((ext) => filename.endsWith(ext));
  }
}
