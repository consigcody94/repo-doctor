import simpleGit, { SimpleGit, LogResult } from 'simple-git';
import * as fs from 'fs';
import * as path from 'path';
import {
  RepositoryHealth,
  RepositoryMetrics,
  Issue,
  Recommendation,
  AnalyzeOptions,
  BasicMetrics,
  CommitMetrics,
  FileMetrics,
  BranchMetrics,
  LargeFile,
  StaleBranch,
} from '../types';
import { SecurityScanner } from '../scanners/security-scanner';
import { formatBytes, formatDate, calculateGrade } from '../utils/format';

export class RepositoryAnalyzer {
  private git: SimpleGit;
  private repoPath: string;
  private options: Required<AnalyzeOptions>;

  constructor(repoPath: string, options: AnalyzeOptions = {}) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
    this.options = {
      path: repoPath,
      deep: options.deep ?? true,
      skipSecurity: options.skipSecurity ?? false,
      skipFiles: options.skipFiles ?? false,
      maxFileSize: options.maxFileSize ?? 10, // 10MB
      staleBranchDays: options.staleBranchDays ?? 90,
    };
  }

  async analyze(): Promise<RepositoryHealth> {
    const metrics = await this.collectMetrics();
    const issues = this.identifyIssues(metrics);
    const recommendations = this.generateRecommendations(metrics);
    const score = this.calculateHealthScore(metrics, issues);
    const grade = calculateGrade(score);

    return {
      score,
      grade,
      issues,
      metrics,
      recommendations,
    };
  }

  private async collectMetrics(): Promise<RepositoryMetrics> {
    const [basic, commits, files, branches] = await Promise.all([
      this.analyzeBasicMetrics(),
      this.analyzeCommitMetrics(),
      this.options.skipFiles ? this.getEmptyFileMetrics() : this.analyzeFileMetrics(),
      this.analyzeBranchMetrics(),
    ]);

    const security = this.options.skipSecurity
      ? { potentialSecrets: [], sensitiveFiles: [], exposedKeys: [] }
      : await new SecurityScanner(this.repoPath).scan();

    return {
      basic,
      commits,
      files,
      security,
      branches,
    };
  }

  private async analyzeBasicMetrics(): Promise<BasicMetrics> {
    const log: LogResult = await this.git.log();
    const branches = await this.git.branch();
    const contributors = new Set(log.all.map((commit) => commit.author_email)).size;

    const oldestCommit = log.all[log.all.length - 1];
    const newestCommit = log.all[0];
    const repoAge = this.calculateRepoAge(new Date(oldestCommit?.date || Date.now()));

    const fileCount = await this.countFiles(this.repoPath);

    return {
      totalCommits: log.total,
      totalBranches: Object.keys(branches.all).length,
      totalFiles: fileCount,
      repositoryAge: repoAge,
      lastCommitDate: formatDate(new Date(newestCommit?.date || Date.now())),
      contributors,
    };
  }

  private async analyzeCommitMetrics(): Promise<CommitMetrics> {
    const log: LogResult = await this.git.log();

    if (log.total === 0) {
      return {
        averageCommitsPerDay: 0,
        commitFrequency: 'No commits',
        largestCommit: { hash: '', files: 0, date: '' },
        commitPattern: 'No activity',
      };
    }

    const oldestCommit = new Date(log.all[log.all.length - 1]?.date || Date.now());
    const newestCommit = new Date(log.all[0]?.date || Date.now());
    const daysDiff = Math.max(1, (newestCommit.getTime() - oldestCommit.getTime()) / (1000 * 60 * 60 * 24));
    const averageCommitsPerDay = log.total / daysDiff;

    // Find largest commit
    let largestCommit = { hash: '', files: 0, date: '' };
    for (const commit of log.all.slice(0, 100)) {
      // Check last 100 commits
      try {
        const diff = await this.git.show([commit.hash, '--name-only', '--format=']);
        const fileCount = diff.split('\n').filter((line) => line.trim()).length;
        if (fileCount > largestCommit.files) {
          largestCommit = {
            hash: commit.hash.substring(0, 7),
            files: fileCount,
            date: formatDate(new Date(commit.date)),
          };
        }
      } catch {
        // Skip commits that can't be analyzed
      }
    }

    const frequency = this.getCommitFrequency(averageCommitsPerDay);
    const pattern = this.analyzeCommitPattern(log);

    return {
      averageCommitsPerDay: parseFloat(averageCommitsPerDay.toFixed(2)),
      commitFrequency: frequency,
      largestCommit,
      commitPattern: pattern,
    };
  }

  private async analyzeFileMetrics(): Promise<FileMetrics> {
    const largeFiles: LargeFile[] = [];
    const fileTypes: Record<string, number> = {};
    let totalSize = 0;
    let binaryCount = 0;

    await this.analyzeFilesRecursive(this.repoPath, largeFiles, fileTypes, (size, isBinary) => {
      totalSize += size;
      if (isBinary) binaryCount++;
    });

    // Sort by size
    largeFiles.sort((a, b) => b.sizeBytes - a.sizeBytes);

    return {
      totalSize: formatBytes(totalSize),
      largeFiles: largeFiles.slice(0, 10),
      fileTypes,
      binaryFiles: binaryCount,
    };
  }

  private async analyzeBranchMetrics(): Promise<BranchMetrics> {
    const branches = await this.git.branch(['-a']);
    const currentBranch = branches.current;
    const staleBranches: StaleBranch[] = [];
    let activeBranches = 0;

    for (const branchName of branches.all) {
      if (branchName.includes('HEAD') || branchName.includes('->')) continue;

      try {
        const cleanName = branchName.replace('remotes/origin/', '');
        const log = await this.git.log(['-1', branchName]);
        if (log.latest) {
          const lastCommitDate = new Date(log.latest.date);
          const daysOld = (Date.now() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24);

          if (daysOld > this.options.staleBranchDays) {
            staleBranches.push({
              name: cleanName,
              lastCommit: formatDate(lastCommitDate),
              daysOld: Math.floor(daysOld),
            });
          } else {
            activeBranches++;
          }
        }
      } catch {
        // Skip branches that can't be analyzed
      }
    }

    return {
      totalBranches: branches.all.filter(b => !b.includes('HEAD') && !b.includes('->')).length,
      staleBranches: staleBranches.sort((a, b) => b.daysOld - a.daysOld).slice(0, 10),
      activeBranches,
      defaultBranch: currentBranch,
    };
  }

  private async analyzeFilesRecursive(
    dir: string,
    largeFiles: LargeFile[],
    fileTypes: Record<string, number>,
    sizeCallback: (size: number, isBinary: boolean) => void,
    relativePath: string = ''
  ): Promise<void> {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (this.shouldSkipPath(entry.name)) continue;

      if (entry.isDirectory()) {
        await this.analyzeFilesRecursive(fullPath, largeFiles, fileTypes, sizeCallback, relPath);
      } else {
        const stats = fs.statSync(fullPath);
        const ext = path.extname(entry.name) || 'no extension';
        const isBinary = this.isBinaryFile(entry.name);

        fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        sizeCallback(stats.size, isBinary);

        const maxSize = this.options.maxFileSize * 1024 * 1024;
        if (stats.size > maxSize) {
          largeFiles.push({
            path: relPath,
            size: formatBytes(stats.size),
            sizeBytes: stats.size,
          });
        }
      }
    }
  }

  private identifyIssues(metrics: RepositoryMetrics): Issue[] {
    const issues: Issue[] = [];

    // Security issues
    if (metrics.security.potentialSecrets.length > 0) {
      issues.push({
        severity: 'critical',
        category: 'Security',
        message: `Found ${metrics.security.potentialSecrets.length} potential secrets in code`,
        details: 'Secrets should never be committed to version control',
      });
    }

    if (metrics.security.sensitiveFiles.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'Security',
        message: `Found ${metrics.security.sensitiveFiles.length} sensitive files`,
        details: 'Files like .env should be in .gitignore',
      });
    }

    // File size issues
    if (metrics.files.largeFiles.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'Performance',
        message: `Found ${metrics.files.largeFiles.length} large files (>${this.options.maxFileSize}MB)`,
        details: 'Large files slow down cloning and operations',
      });
    }

    // Branch issues
    if (metrics.branches.staleBranches.length > 5) {
      issues.push({
        severity: 'info',
        category: 'Maintenance',
        message: `Found ${metrics.branches.staleBranches.length} stale branches`,
        details: `Branches inactive for >${this.options.staleBranchDays} days`,
      });
    }

    // Commit frequency
    if (metrics.commits.averageCommitsPerDay < 0.1) {
      issues.push({
        severity: 'info',
        category: 'Activity',
        message: 'Low commit frequency',
        details: 'Repository appears to be inactive',
      });
    }

    return issues;
  }

  private generateRecommendations(metrics: RepositoryMetrics): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Security recommendations
    if (metrics.security.potentialSecrets.length > 0) {
      recommendations.push({
        priority: 'high',
        title: 'Remove secrets from code',
        description: 'Secrets were detected in your repository',
        action: 'Use environment variables and add sensitive files to .gitignore',
      });
    }

    // Large files
    if (metrics.files.largeFiles.length > 0) {
      recommendations.push({
        priority: 'medium',
        title: 'Reduce repository size',
        description: `${metrics.files.largeFiles.length} large files detected`,
        action: 'Consider using Git LFS for large binary files',
      });
    }

    // Stale branches
    if (metrics.branches.staleBranches.length > 5) {
      recommendations.push({
        priority: 'low',
        title: 'Clean up stale branches',
        description: `${metrics.branches.staleBranches.length} branches haven't been updated recently`,
        action: 'Delete merged or abandoned branches',
      });
    }

    // General recommendations
    if (metrics.basic.contributors < 2) {
      recommendations.push({
        priority: 'low',
        title: 'Encourage collaboration',
        description: 'Repository has limited contributors',
        action: 'Add CONTRIBUTING.md and welcome new contributors',
      });
    }

    return recommendations;
  }

  private calculateHealthScore(metrics: RepositoryMetrics, issues: Issue[]): number {
    let score = 100;

    // Deduct for critical issues
    score -= issues.filter((i) => i.severity === 'critical').length * 15;

    // Deduct for warnings
    score -= issues.filter((i) => i.severity === 'warning').length * 5;

    // Deduct for info
    score -= issues.filter((i) => i.severity === 'info').length * 2;

    // Bonus for good practices
    if (metrics.commits.averageCommitsPerDay > 1) score += 5;
    if (metrics.basic.contributors > 3) score += 5;
    if (metrics.branches.staleBranches.length === 0) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  private calculateRepoAge(startDate: Date): string {
    const days = (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (days < 30) return `${Math.floor(days)} days`;
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${(days / 365).toFixed(1)} years`;
  }

  private getCommitFrequency(avgPerDay: number): string {
    if (avgPerDay >= 5) return 'Very active';
    if (avgPerDay >= 1) return 'Active';
    if (avgPerDay >= 0.5) return 'Moderate';
    if (avgPerDay >= 0.1) return 'Low';
    return 'Very low';
  }

  private analyzeCommitPattern(log: LogResult): string {
    if (log.total < 10) return 'Too few commits to analyze';

    const recentCommits = log.all.slice(0, 30);
    const weekdayCommits = recentCommits.filter((c) => {
      const day = new Date(c.date).getDay();
      return day >= 1 && day <= 5;
    }).length;

    const ratio = weekdayCommits / recentCommits.length;
    if (ratio > 0.7) return 'Most active on weekdays';
    if (ratio < 0.3) return 'Most active on weekends';
    return 'Consistent activity throughout week';
  }

  private async countFiles(dir: string): Promise<number> {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (this.shouldSkipPath(entry.name)) continue;

      if (entry.isDirectory()) {
        count += await this.countFiles(path.join(dir, entry.name));
      } else {
        count++;
      }
    }

    return count;
  }

  private shouldSkipPath(name: string): boolean {
    return ['.git', 'node_modules', 'dist', 'build', 'coverage'].includes(name);
  }

  private isBinaryFile(filename: string): boolean {
    const binaryExts = ['.exe', '.dll', '.so', '.dylib', '.bin', '.pdf', '.zip', '.tar', '.gz'];
    return binaryExts.some((ext) => filename.endsWith(ext));
  }

  private getEmptyFileMetrics(): FileMetrics {
    return {
      totalSize: '0 B',
      largeFiles: [],
      fileTypes: {},
      binaryFiles: 0,
    };
  }
}
