#!/usr/bin/env node

import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { RepositoryAnalyzer } from './analyzers/repository-analyzer';
import { TerminalReporter } from './reporters/terminal-reporter';
import { JsonReporter } from './reporters/json-reporter';
import { MarkdownReporter } from './reporters/markdown-reporter';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

program
  .name('repo-doctor')
  .description('🏥 Intelligent repository health checker and optimizer')
  .version('1.0.0');

program
  .command('analyze')
  .description('Analyze repository health and generate report')
  .option('-p, --path <path>', 'Path to repository', process.cwd())
  .option('-f, --format <format>', 'Output format (terminal|json|markdown)', 'terminal')
  .option('-o, --output <file>', 'Output file path (for json/markdown formats)')
  .option('--skip-security', 'Skip security scanning')
  .option('--skip-files', 'Skip file analysis')
  .option('--deep', 'Enable deep analysis (may take longer)', true)
  .option('--max-file-size <size>', 'Max file size in MB to flag as large', '10')
  .option('--stale-branch-days <days>', 'Days to consider a branch stale', '90')
  .action(async (options) => {
    const spinner = ora('Analyzing repository...').start();

    try {
      // Validate repository path
      const repoPath = path.resolve(options.path);
      if (!fs.existsSync(repoPath)) {
        spinner.fail(chalk.red(`Repository not found: ${repoPath}`));
        process.exit(1);
      }

      if (!fs.existsSync(path.join(repoPath, '.git'))) {
        spinner.fail(chalk.red('Not a git repository'));
        process.exit(1);
      }

      spinner.text = 'Collecting metrics...';

      const analyzer = new RepositoryAnalyzer(repoPath, {
        deep: options.deep,
        skipSecurity: options.skipSecurity,
        skipFiles: options.skipFiles,
        maxFileSize: parseInt(options.maxFileSize, 10),
        staleBranchDays: parseInt(options.staleBranchDays, 10),
      });

      const health = await analyzer.analyze();
      spinner.succeed(chalk.green('Analysis complete!'));

      // Generate report based on format
      switch (options.format) {
        case 'json':
          new JsonReporter().report(health, options.output);
          break;
        case 'markdown':
          new MarkdownReporter().report(health, options.output);
          break;
        case 'terminal':
        default:
          new TerminalReporter().report(health);
          break;
      }

      // Exit with appropriate code
      const criticalIssues = health.issues.filter((i) => i.severity === 'critical').length;
      process.exit(criticalIssues > 0 ? 1 : 0);
    } catch (error) {
      spinner.fail(chalk.red('Analysis failed'));
      console.error(chalk.red((error as Error).message));
      if (process.env.DEBUG) {
        console.error(error);
      }
      process.exit(1);
    }
  });

program
  .command('scan')
  .description('Quick security scan for secrets and sensitive files')
  .option('-p, --path <path>', 'Path to repository', process.cwd())
  .action(async (options) => {
    const spinner = ora('Scanning for security issues...').start();

    try {
      const repoPath = path.resolve(options.path);
      const analyzer = new RepositoryAnalyzer(repoPath, {
        skipFiles: true,
        skipSecurity: false,
      });

      const health = await analyzer.analyze();
      const { security } = health.metrics;

      const totalIssues =
        security.potentialSecrets.length +
        security.sensitiveFiles.length +
        security.exposedKeys.length;

      if (totalIssues === 0) {
        spinner.succeed(chalk.green('✓ No security issues detected'));
        process.exit(0);
      }

      spinner.stop();
      console.log(chalk.yellow.bold(`\n⚠️  Found ${totalIssues} security issue(s):\n`));

      if (security.potentialSecrets.length > 0) {
        console.log(chalk.red.bold(`Potential Secrets (${security.potentialSecrets.length}):`));
        security.potentialSecrets.forEach((finding) => {
          console.log(
            chalk.gray('  • ') +
              chalk.white(finding.type) +
              chalk.gray(` in ${finding.file}:${finding.line}`)
          );
        });
        console.log();
      }

      if (security.sensitiveFiles.length > 0) {
        console.log(chalk.yellow.bold(`Sensitive Files (${security.sensitiveFiles.length}):`));
        security.sensitiveFiles.forEach((file) => {
          console.log(chalk.gray('  • ') + chalk.white(file));
        });
        console.log();
      }

      if (security.exposedKeys.length > 0) {
        console.log(chalk.red.bold(`Exposed Keys (${security.exposedKeys.length}):`));
        security.exposedKeys.forEach((finding) => {
          console.log(
            chalk.gray('  • ') +
              chalk.white(finding.type) +
              chalk.gray(` in ${finding.file}:${finding.line}`)
          );
        });
        console.log();
      }

      process.exit(1);
    } catch (error) {
      spinner.fail(chalk.red('Scan failed'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate a report from a previous analysis')
  .requiredOption('-i, --input <file>', 'Input JSON file from previous analysis')
  .option('-f, --format <format>', 'Output format (terminal|markdown)', 'terminal')
  .option('-o, --output <file>', 'Output file path (for markdown format)')
  .action((options) => {
    try {
      const data = fs.readFileSync(options.input, 'utf-8');
      const health = JSON.parse(data);

      switch (options.format) {
        case 'markdown':
          new MarkdownReporter().report(health, options.output);
          break;
        case 'terminal':
        default:
          new TerminalReporter().report(health);
          break;
      }
    } catch (error) {
      console.error(chalk.red('Failed to generate report'));
      console.error(chalk.red((error as Error).message));
      process.exit(1);
    }
  });

program.parse();
