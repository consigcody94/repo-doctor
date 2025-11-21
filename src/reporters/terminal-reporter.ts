import chalk from 'chalk';
import Table from 'cli-table3';
import { RepositoryHealth } from '../types';
import { pluralize } from '../utils/format';

export class TerminalReporter {
  report(health: RepositoryHealth): void {
    this.printHeader(health);
    this.printBasicMetrics(health);
    this.printCommitMetrics(health);
    this.printFileMetrics(health);
    this.printSecurityMetrics(health);
    this.printBranchMetrics(health);

    if (health.issues.length > 0) {
      this.printIssues(health);
    }

    if (health.recommendations.length > 0) {
      this.printRecommendations(health);
    }

    this.printFooter();
  }

  private printHeader(health: RepositoryHealth): void {
    console.log('\n' + chalk.bold.cyan('🏥 Repository Health Report'));
    console.log(chalk.gray('═'.repeat(60)) + '\n');

    const gradeColor = this.getGradeColor(health.grade);
    const scoreBar = this.getScoreBar(health.score);

    console.log(chalk.bold('Overall Health Score: ') + gradeColor(` ${health.grade} `));
    console.log(scoreBar + chalk.gray(` ${health.score}/100\n`));
  }

  private printBasicMetrics(health: RepositoryHealth): void {
    const { basic } = health.metrics;

    console.log(chalk.bold.yellow('📊 Basic Metrics'));
    console.log(chalk.gray('─'.repeat(60)));

    const table = new Table({
      chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
      style: { 'padding-left': 2, 'padding-right': 2 },
    });

    table.push(
      ['Total Commits', chalk.cyan(basic.totalCommits.toString())],
      ['Total Branches', chalk.cyan(basic.totalBranches.toString())],
      ['Total Files', chalk.cyan(basic.totalFiles.toString())],
      ['Contributors', chalk.cyan(basic.contributors.toString())],
      ['Repository Age', chalk.cyan(basic.repositoryAge)],
      ['Last Commit', chalk.cyan(basic.lastCommitDate)]
    );

    console.log(table.toString() + '\n');
  }

  private printCommitMetrics(health: RepositoryHealth): void {
    const { commits } = health.metrics;

    console.log(chalk.bold.yellow('📝 Commit Activity'));
    console.log(chalk.gray('─'.repeat(60)));

    const table = new Table({
      chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
      style: { 'padding-left': 2, 'padding-right': 2 },
    });

    table.push(
      ['Average Commits/Day', chalk.cyan(commits.averageCommitsPerDay.toString())],
      ['Commit Frequency', chalk.cyan(commits.commitFrequency)],
      ['Commit Pattern', chalk.cyan(commits.commitPattern)]
    );

    if (commits.largestCommit.hash) {
      table.push([
        'Largest Commit',
        chalk.cyan(
          `${commits.largestCommit.hash} (${commits.largestCommit.files} files, ${commits.largestCommit.date})`
        ),
      ]);
    }

    console.log(table.toString() + '\n');
  }

  private printFileMetrics(health: RepositoryHealth): void {
    const { files } = health.metrics;

    console.log(chalk.bold.yellow('📁 File Analysis'));
    console.log(chalk.gray('─'.repeat(60)));

    const table = new Table({
      chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
      style: { 'padding-left': 2, 'padding-right': 2 },
    });

    table.push(
      ['Total Size', chalk.cyan(files.totalSize)],
      ['Binary Files', chalk.cyan(files.binaryFiles.toString())]
    );

    console.log(table.toString());

    if (files.largeFiles.length > 0) {
      console.log(chalk.yellow('\n  Large Files:'));
      files.largeFiles.slice(0, 5).forEach((file) => {
        console.log(chalk.gray('  • ') + chalk.white(file.path) + chalk.gray(` (${file.size})`));
      });
    }

    const topTypes = Object.entries(files.fileTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (topTypes.length > 0) {
      console.log(chalk.yellow('\n  Top File Types:'));
      topTypes.forEach(([ext, count]) => {
        console.log(chalk.gray('  • ') + chalk.white(ext) + chalk.gray(` (${count} files)`));
      });
    }

    console.log();
  }

  private printSecurityMetrics(health: RepositoryHealth): void {
    const { security } = health.metrics;
    const totalIssues =
      security.potentialSecrets.length +
      security.sensitiveFiles.length +
      security.exposedKeys.length;

    console.log(chalk.bold.yellow('🔒 Security Scan'));
    console.log(chalk.gray('─'.repeat(60)));

    if (totalIssues === 0) {
      console.log(chalk.green('  ✓ No security issues detected\n'));
      return;
    }

    if (security.potentialSecrets.length > 0) {
      console.log(
        chalk.red(`  ⚠  ${pluralize(security.potentialSecrets.length, 'potential secret')}`)
      );
      security.potentialSecrets.slice(0, 3).forEach((finding) => {
        console.log(
          chalk.gray('     • ') +
            chalk.white(finding.type) +
            chalk.gray(` in ${finding.file}:${finding.line}`)
        );
      });
      if (security.potentialSecrets.length > 3) {
        console.log(chalk.gray(`     ... and ${security.potentialSecrets.length - 3} more`));
      }
    }

    if (security.sensitiveFiles.length > 0) {
      console.log(
        chalk.yellow(`\n  ⚠  ${pluralize(security.sensitiveFiles.length, 'sensitive file')}`)
      );
      security.sensitiveFiles.slice(0, 3).forEach((file) => {
        console.log(chalk.gray('     • ') + chalk.white(file));
      });
      if (security.sensitiveFiles.length > 3) {
        console.log(chalk.gray(`     ... and ${security.sensitiveFiles.length - 3} more`));
      }
    }

    console.log();
  }

  private printBranchMetrics(health: RepositoryHealth): void {
    const { branches } = health.metrics;

    console.log(chalk.bold.yellow('🌿 Branch Analysis'));
    console.log(chalk.gray('─'.repeat(60)));

    const table = new Table({
      chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' },
      style: { 'padding-left': 2, 'padding-right': 2 },
    });

    table.push(
      ['Total Branches', chalk.cyan(branches.totalBranches.toString())],
      ['Active Branches', chalk.green(branches.activeBranches.toString())],
      ['Stale Branches', chalk.yellow(branches.staleBranches.length.toString())],
      ['Default Branch', chalk.cyan(branches.defaultBranch)]
    );

    console.log(table.toString());

    if (branches.staleBranches.length > 0) {
      console.log(chalk.yellow('\n  Stale Branches:'));
      branches.staleBranches.slice(0, 5).forEach((branch) => {
        console.log(
          chalk.gray('  • ') +
            chalk.white(branch.name) +
            chalk.gray(` (${branch.daysOld} days old)`)
        );
      });
      if (branches.staleBranches.length > 5) {
        console.log(chalk.gray(`  ... and ${branches.staleBranches.length - 5} more`));
      }
    }

    console.log();
  }

  private printIssues(health: RepositoryHealth): void {
    console.log(chalk.bold.red('⚠️  Issues Found'));
    console.log(chalk.gray('─'.repeat(60)));

    const critical = health.issues.filter((i) => i.severity === 'critical');
    const warnings = health.issues.filter((i) => i.severity === 'warning');
    const info = health.issues.filter((i) => i.severity === 'info');

    if (critical.length > 0) {
      console.log(chalk.red.bold(`\n  Critical (${critical.length}):`));
      critical.forEach((issue) => {
        console.log(chalk.red('  ✗ ') + chalk.white(issue.message));
        if (issue.details) {
          console.log(chalk.gray(`    ${issue.details}`));
        }
      });
    }

    if (warnings.length > 0) {
      console.log(chalk.yellow.bold(`\n  Warnings (${warnings.length}):`));
      warnings.forEach((issue) => {
        console.log(chalk.yellow('  ! ') + chalk.white(issue.message));
        if (issue.details) {
          console.log(chalk.gray(`    ${issue.details}`));
        }
      });
    }

    if (info.length > 0) {
      console.log(chalk.blue.bold(`\n  Info (${info.length}):`));
      info.forEach((issue) => {
        console.log(chalk.blue('  ℹ ') + chalk.white(issue.message));
        if (issue.details) {
          console.log(chalk.gray(`    ${issue.details}`));
        }
      });
    }

    console.log();
  }

  private printRecommendations(health: RepositoryHealth): void {
    console.log(chalk.bold.green('💡 Recommendations'));
    console.log(chalk.gray('─'.repeat(60)));

    health.recommendations.forEach((rec, index) => {
      const priority =
        rec.priority === 'high'
          ? chalk.red('HIGH')
          : rec.priority === 'medium'
            ? chalk.yellow('MED')
            : chalk.blue('LOW');

      console.log(`\n  ${index + 1}. ${chalk.bold(rec.title)} [${priority}]`);
      console.log(chalk.gray(`     ${rec.description}`));
      console.log(chalk.cyan(`     → ${rec.action}`));
    });

    console.log();
  }

  private printFooter(): void {
    console.log(chalk.gray('═'.repeat(60)));
    console.log(
      chalk.gray('Generated by ') +
        chalk.cyan.bold('repo-doctor') +
        chalk.gray(' - https://github.com/consigcody94/repo-doctor\n')
    );
  }

  private getGradeColor(grade: string) {
    switch (grade) {
      case 'A':
        return chalk.green.bold;
      case 'B':
        return chalk.blue.bold;
      case 'C':
        return chalk.yellow.bold;
      case 'D':
        return chalk.yellow.bold;
      case 'F':
        return chalk.red.bold;
      default:
        return chalk.white.bold;
    }
  }

  private getScoreBar(score: number): string {
    const filled = Math.floor(score / 5);
    const empty = 20 - filled;
    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    return `[${bar}]`;
  }
}
