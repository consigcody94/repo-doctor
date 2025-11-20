export interface RepositoryHealth {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: Issue[];
  metrics: RepositoryMetrics;
  recommendations: Recommendation[];
}

export interface Issue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  file?: string;
  line?: number;
  details?: string;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
}

export interface RepositoryMetrics {
  basic: BasicMetrics;
  commits: CommitMetrics;
  files: FileMetrics;
  security: SecurityMetrics;
  branches: BranchMetrics;
}

export interface BasicMetrics {
  totalCommits: number;
  totalBranches: number;
  totalFiles: number;
  repositoryAge: string;
  lastCommitDate: string;
  contributors: number;
}

export interface CommitMetrics {
  averageCommitsPerDay: number;
  commitFrequency: string;
  largestCommit: {
    hash: string;
    files: number;
    date: string;
  };
  commitPattern: string; // e.g., "Most active on weekdays"
}

export interface FileMetrics {
  totalSize: string;
  largeFiles: LargeFile[];
  fileTypes: Record<string, number>;
  binaryFiles: number;
}

export interface LargeFile {
  path: string;
  size: string;
  sizeBytes: number;
}

export interface SecurityMetrics {
  potentialSecrets: SecurityFinding[];
  sensitiveFiles: string[];
  exposedKeys: SecurityFinding[];
}

export interface SecurityFinding {
  file: string;
  line: number;
  type: string;
  match: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface BranchMetrics {
  totalBranches: number;
  staleBranches: StaleBranch[];
  activeBranches: number;
  defaultBranch: string;
}

export interface StaleBranch {
  name: string;
  lastCommit: string;
  daysOld: number;
}

export interface AnalyzeOptions {
  path?: string;
  deep?: boolean;
  skipSecurity?: boolean;
  skipFiles?: boolean;
  maxFileSize?: number; // in MB
  staleBranchDays?: number; // days to consider a branch stale
}

export interface ReportOptions {
  format: 'terminal' | 'json' | 'markdown' | 'html';
  output?: string;
  verbose?: boolean;
}
