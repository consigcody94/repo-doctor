import { RepositoryHealth } from '../types';
import * as fs from 'fs';

export class MarkdownReporter {
  report(health: RepositoryHealth, outputPath?: string): void {
    const markdown = this.generateMarkdown(health);

    if (outputPath) {
      fs.writeFileSync(outputPath, markdown);
      console.log(`Report saved to: ${outputPath}`);
    } else {
      console.log(markdown);
    }
  }

  private generateMarkdown(health: RepositoryHealth): string {
    const sections: string[] = [];

    // Header
    sections.push('# Repository Health Report\n');
    sections.push(`**Generated:** ${new Date().toISOString()}\n`);
    sections.push(`## Overall Health: ${health.grade} (${health.score}/100)\n`);

    // Basic Metrics
    sections.push('## 📊 Basic Metrics\n');
    const { basic } = health.metrics;
    sections.push(`- **Total Commits:** ${basic.totalCommits}`);
    sections.push(`- **Total Branches:** ${basic.totalBranches}`);
    sections.push(`- **Total Files:** ${basic.totalFiles}`);
    sections.push(`- **Contributors:** ${basic.contributors}`);
    sections.push(`- **Repository Age:** ${basic.repositoryAge}`);
    sections.push(`- **Last Commit:** ${basic.lastCommitDate}\n`);

    // Commit Metrics
    sections.push('## 📝 Commit Activity\n');
    const { commits } = health.metrics;
    sections.push(`- **Average Commits/Day:** ${commits.averageCommitsPerDay}`);
    sections.push(`- **Commit Frequency:** ${commits.commitFrequency}`);
    sections.push(`- **Commit Pattern:** ${commits.commitPattern}`);
    if (commits.largestCommit.hash) {
      sections.push(
        `- **Largest Commit:** ${commits.largestCommit.hash} (${commits.largestCommit.files} files, ${commits.largestCommit.date})\n`
      );
    } else {
      sections.push('');
    }

    // File Metrics
    sections.push('## 📁 File Analysis\n');
    const { files } = health.metrics;
    sections.push(`- **Total Size:** ${files.totalSize}`);
    sections.push(`- **Binary Files:** ${files.binaryFiles}\n`);

    if (files.largeFiles.length > 0) {
      sections.push('### Large Files\n');
      files.largeFiles.slice(0, 10).forEach((file) => {
        sections.push(`- \`${file.path}\` (${file.size})`);
      });
      sections.push('');
    }

    const topTypes = Object.entries(files.fileTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (topTypes.length > 0) {
      sections.push('### File Types\n');
      topTypes.forEach(([ext, count]) => {
        sections.push(`- **${ext}:** ${count} files`);
      });
      sections.push('');
    }

    // Security
    sections.push('## 🔒 Security Scan\n');
    const { security } = health.metrics;
    const totalIssues =
      security.potentialSecrets.length +
      security.sensitiveFiles.length +
      security.exposedKeys.length;

    if (totalIssues === 0) {
      sections.push('✅ No security issues detected\n');
    } else {
      if (security.potentialSecrets.length > 0) {
        sections.push(`### ⚠️ Potential Secrets (${security.potentialSecrets.length})\n`);
        security.potentialSecrets.forEach((finding) => {
          sections.push(`- **${finding.type}** in \`${finding.file}:${finding.line}\``);
        });
        sections.push('');
      }

      if (security.sensitiveFiles.length > 0) {
        sections.push(`### ⚠️ Sensitive Files (${security.sensitiveFiles.length})\n`);
        security.sensitiveFiles.forEach((file) => {
          sections.push(`- \`${file}\``);
        });
        sections.push('');
      }
    }

    // Branches
    sections.push('## 🌿 Branch Analysis\n');
    const { branches } = health.metrics;
    sections.push(`- **Total Branches:** ${branches.totalBranches}`);
    sections.push(`- **Active Branches:** ${branches.activeBranches}`);
    sections.push(`- **Stale Branches:** ${branches.staleBranches.length}`);
    sections.push(`- **Default Branch:** ${branches.defaultBranch}\n`);

    if (branches.staleBranches.length > 0) {
      sections.push('### Stale Branches\n');
      branches.staleBranches.slice(0, 10).forEach((branch) => {
        sections.push(`- **${branch.name}** (${branch.daysOld} days old)`);
      });
      sections.push('');
    }

    // Issues
    if (health.issues.length > 0) {
      sections.push('## ⚠️ Issues Found\n');

      const critical = health.issues.filter((i) => i.severity === 'critical');
      const warnings = health.issues.filter((i) => i.severity === 'warning');
      const info = health.issues.filter((i) => i.severity === 'info');

      if (critical.length > 0) {
        sections.push(`### Critical (${critical.length})\n`);
        critical.forEach((issue) => {
          sections.push(`- ❌ **${issue.message}**`);
          if (issue.details) {
            sections.push(`  - ${issue.details}`);
          }
        });
        sections.push('');
      }

      if (warnings.length > 0) {
        sections.push(`### Warnings (${warnings.length})\n`);
        warnings.forEach((issue) => {
          sections.push(`- ⚠️ **${issue.message}**`);
          if (issue.details) {
            sections.push(`  - ${issue.details}`);
          }
        });
        sections.push('');
      }

      if (info.length > 0) {
        sections.push(`### Info (${info.length})\n`);
        info.forEach((issue) => {
          sections.push(`- ℹ️ **${issue.message}**`);
          if (issue.details) {
            sections.push(`  - ${issue.details}`);
          }
        });
        sections.push('');
      }
    }

    // Recommendations
    if (health.recommendations.length > 0) {
      sections.push('## 💡 Recommendations\n');
      health.recommendations.forEach((rec, index) => {
        const priorityEmoji = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🔵';
        sections.push(`### ${index + 1}. ${rec.title} ${priorityEmoji}\n`);
        sections.push(`${rec.description}\n`);
        sections.push(`**Action:** ${rec.action}\n`);
      });
    }

    // Footer
    sections.push('---\n');
    sections.push('*Generated by [repo-doctor](https://github.com/consigcody94/repo-doctor)*\n');

    return sections.join('\n');
  }
}
