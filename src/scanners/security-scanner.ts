import * as fs from 'fs';
import * as path from 'path';
import { SecurityFinding, SecurityMetrics } from '../types';

const SECRET_PATTERNS = [
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical' as const,
  },
  {
    name: 'GitHub Token',
    pattern: /ghp_[a-zA-Z0-9]{36}/g,
    severity: 'critical' as const,
  },
  {
    name: 'Generic API Key',
    pattern: /api[_-]?key[_-]?[:=]\s*['"]?([a-zA-Z0-9_-]{32,})/gi,
    severity: 'warning' as const,
  },
  {
    name: 'Private Key',
    pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE KEY-----/g,
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
    name: 'Slack Token',
    pattern: /xox[baprs]-[0-9a-zA-Z-]{10,}/g,
    severity: 'critical' as const,
  },
  {
    name: 'Database Connection String',
    pattern: /(mongodb|mysql|postgres):\/\/[^\s'"]+/gi,
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
