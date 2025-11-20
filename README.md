# 🏥 repo-doctor

> Intelligent repository health checker and optimizer - analyze git repos, detect issues, get actionable insights

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)

**repo-doctor** is a comprehensive CLI tool that performs deep health checks on your Git repositories. It scans for security vulnerabilities, analyzes commit patterns, identifies large files, detects stale branches, and provides actionable recommendations to improve your repository's health and maintainability.

## 🎯 Why repo-doctor?

Managing Git repositories can be complex, especially as they grow. Common issues include:

- 🔓 **Security risks**: Accidentally committed API keys, passwords, or tokens
- 📦 **Repository bloat**: Large files committed to version control
- 🌿 **Branch clutter**: Dozens of stale branches from old features
- 📊 **Low visibility**: No clear picture of repository health or activity
- 🚨 **Hidden issues**: Problems that slow down clones and deployments

**repo-doctor solves these problems** by providing:
- Automated security scanning with pattern detection
- Comprehensive metrics and insights
- Clear, actionable recommendations
- Multiple output formats for different workflows
- Fast analysis even on large repositories (1000s of files)

## ✨ Features

### 🔒 Security Scanning
Detects **8 types of secrets** and sensitive data:
- **AWS Access Keys** (AKIA...) - Critical cloud credentials
- **GitHub Personal Access Tokens** (ghp_...) - Repository access
- **Generic API Keys** - Third-party service credentials
- **Private SSH/RSA Keys** - Infrastructure access
- **Passwords in Code** - Hardcoded authentication
- **JWT Tokens** - Session and authentication tokens
- **Slack Tokens** (xox...) - Messaging platform access
- **Database Connection Strings** - MongoDB, MySQL, PostgreSQL URLs

**Sensitive file detection:**
- `.env` and `.env.*` files
- `credentials.json`, `secrets.yml`
- Private keys (`id_rsa`, `id_dsa`)
- API configuration files (`.npmrc`, `.pypirc`)

### 📊 Repository Analytics
**Commit Analysis:**
- Total commits and commit frequency (Very Active → Very Low)
- Average commits per day (tracks development velocity)
- Commit patterns (weekday vs weekend activity)
- Largest commits (identifies bulk changes)
- Contributor count and diversity

**What this tells you:**
- Is the repository actively maintained?
- Are there consistent development patterns?
- How many people are contributing?
- When was the last activity?

### 📁 File Analysis
**Comprehensive file metrics:**
- **Total repository size** - Helps identify bloated repos
- **Large file detection** - Configurable threshold (default: 10MB)
- **File type distribution** - See what makes up your codebase
- **Binary file count** - Identifies non-text files

**Common issues detected:**
- Large binary files in Git (should use Git LFS)
- Committed dependencies (`node_modules/`, `.venv/`)
- Build artifacts (`dist/`, `build/`, `*.exe`)

### 🌿 Branch Health
**Branch analytics:**
- Total branch count
- Active branches (recently updated)
- Stale branches (configurable threshold, default: 90 days)
- Default branch identification

**Why this matters:**
- Too many branches slow down Git operations
- Stale branches indicate abandoned work
- Helps maintain a clean repository structure

### 💯 Health Score & Grading
**Intelligent scoring algorithm:**
- **Grade A (90-100)**: Excellent health, minimal issues
- **Grade B (80-89)**: Good health, minor improvements needed
- **Grade C (70-79)**: Fair health, several issues to address
- **Grade D (60-69)**: Poor health, significant problems
- **Grade F (<60)**: Critical issues require immediate attention

**Scoring factors:**
- Critical issues: -15 points each (security vulnerabilities)
- Warnings: -5 points each (large files, minor issues)
- Info: -2 points each (suggestions, optimizations)
- Bonuses: +5 points for good practices (active commits, multiple contributors)

### 📝 Multiple Output Formats
**Terminal (Default):**
- Beautiful colored output with Unicode characters
- Progress indicators and spinners
- Organized sections with tables
- Grade badges and score bars

**JSON:**
- Machine-readable format
- Perfect for CI/CD pipelines
- Easy integration with other tools
- Complete data export

**Markdown:**
- Documentation-friendly format
- Can be committed to repository
- Readable in GitHub/GitLab
- Great for team reports

### ⚡ Performance
- Analyzes **5,000+ files** in seconds
- Efficient recursive directory scanning
- Smart skip lists (`node_modules/`, `.git/`)
- Parallel analysis where possible
- Minimal memory footprint

## 🚀 Installation

### NPM

```bash
npm install -g repo-doctor
```

### From Source

```bash
git clone https://github.com/consigcody94/repo-doctor
cd repo-doctor
npm install
npm run build
npm link
```

## 📖 Usage

### Basic Usage

```bash
# Analyze current directory
repo-doctor analyze

# Analyze specific repository
repo-doctor analyze --path /path/to/repo

# Quick security scan only (faster)
repo-doctor scan
```

### Advanced Usage

```bash
# Generate JSON report for CI/CD
repo-doctor analyze --format json --output report.json

# Generate Markdown report for documentation
repo-doctor analyze --format markdown --output HEALTH_REPORT.md

# Skip security scan (faster for large repos)
repo-doctor analyze --skip-security

# Skip file analysis (focus on commits and branches)
repo-doctor analyze --skip-files

# Custom thresholds for large files and stale branches
repo-doctor analyze --max-file-size 50 --stale-branch-days 180

# Deep analysis (default, can be disabled for speed)
repo-doctor analyze --deep false
```

### Real-World Examples

**1. Pre-commit Security Check:**
```bash
# Quick scan before committing
repo-doctor scan
# Exit code 1 if critical issues found, 0 if clean
```

**2. Weekly Team Report:**
```bash
# Generate Markdown report for team review
repo-doctor analyze \
  --format markdown \
  --output weekly-health-$(date +%Y-%m-%d).md
```

**3. Large Repository Cleanup:**
```bash
# Find all files over 50MB for Git LFS migration
repo-doctor analyze \
  --max-file-size 50 \
  --format json \
  --output large-files.json
```

**4. Branch Cleanup Campaign:**
```bash
# Identify branches older than 6 months
repo-doctor analyze \
  --stale-branch-days 180 \
  --format markdown \
  --output stale-branches-report.md
```

**5. Security Audit:**
```bash
# Comprehensive security scan with JSON output
repo-doctor scan --format json --output security-audit.json
```

### Output Format Conversion

```bash
# Save full analysis as JSON
repo-doctor analyze --format json --output full-report.json

# Later, convert to terminal view
repo-doctor report --input full-report.json

# Or convert to Markdown
repo-doctor report --input full-report.json --format markdown --output report.md
```

### CI/CD Integration

**GitHub Actions:**
```yaml
name: Repository Health Check
on: [push, pull_request]

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Install repo-doctor
        run: npm install -g repo-doctor
      - name: Run health check
        run: repo-doctor analyze --format json --output health-report.json
      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: health-report
          path: health-report.json
```

**GitLab CI:**
```yaml
health-check:
  image: node:20
  script:
    - npm install -g repo-doctor
    - repo-doctor analyze --format json --output health-report.json
  artifacts:
    reports:
      junit: health-report.json
```

**Pre-commit Hook:**
```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running security scan..."
repo-doctor scan

if [ $? -ne 0 ]; then
  echo "❌ Security issues detected! Commit aborted."
  echo "Run 'repo-doctor scan' to see details."
  exit 1
fi

echo "✅ Security scan passed"
```

## 📊 Example Output

```
🏥 Repository Health Report
═══════════════════════════════════════════════════════════

Overall Health Score:  B
[████████████████░░░░] 82/100

📊 Basic Metrics
────────────────────────────────────────────────────────────
  Total Commits      1,234
  Total Branches     15
  Total Files        456
  Contributors       8
  Repository Age     2.3 years
  Last Commit        2025-11-20

📝 Commit Activity
────────────────────────────────────────────────────────────
  Average Commits/Day  1.85
  Commit Frequency     Active
  Commit Pattern       Most active on weekdays

🔒 Security Scan
────────────────────────────────────────────────────────────
  ⚠  2 potential secrets
     • GitHub Token in config/auth.ts:12
     • API Key in src/utils/api.ts:45

💡 Recommendations
────────────────────────────────────────────────────────────
  1. Remove secrets from code [HIGH]
     Secrets were detected in your repository
     → Use environment variables and add sensitive files to .gitignore
```

## 🔧 CLI Options

### analyze

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Path to repository | Current directory |
| `-f, --format <format>` | Output format (terminal\|json\|markdown) | terminal |
| `-o, --output <file>` | Output file path | - |
| `--skip-security` | Skip security scanning | false |
| `--skip-files` | Skip file analysis | false |
| `--deep` | Enable deep analysis | true |
| `--max-file-size <size>` | Max file size in MB to flag | 10 |
| `--stale-branch-days <days>` | Days to consider branch stale | 90 |

### scan

| Option | Description | Default |
|--------|-------------|---------|
| `-p, --path <path>` | Path to repository | Current directory |

### report

| Option | Description | Default |
|--------|-------------|---------|
| `-i, --input <file>` | Input JSON file (required) | - |
| `-f, --format <format>` | Output format (terminal\|markdown) | terminal |
| `-o, --output <file>` | Output file path | - |

## 🏗️ Architecture

```
repo-doctor/
├── src/
│   ├── analyzers/
│   │   └── repository-analyzer.ts   # Core analysis engine
│   ├── scanners/
│   │   └── security-scanner.ts      # Security pattern detection
│   ├── reporters/
│   │   ├── terminal-reporter.ts     # Beautiful terminal output
│   │   ├── json-reporter.ts         # JSON export
│   │   └── markdown-reporter.ts     # Markdown export
│   ├── utils/
│   │   └── format.ts                # Formatting utilities
│   ├── types.ts                     # TypeScript interfaces
│   ├── cli.ts                       # CLI interface
│   └── index.ts                     # Public API
├── tests/                           # Comprehensive test suite
└── dist/                            # Compiled output
```

## 🧪 Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev -- analyze

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © [consigcody94](https://github.com/consigcody94)

## 🙏 Acknowledgments

- Built with [simple-git](https://github.com/steveukx/git-js)
- Powered by [Commander.js](https://github.com/tj/commander.js)
- Beautiful terminal output with [chalk](https://github.com/chalk/chalk) and [ora](https://github.com/sindresorhus/ora)

## 🔗 Links

- [GitHub Repository](https://github.com/consigcody94/repo-doctor)
- [Issue Tracker](https://github.com/consigcody94/repo-doctor/issues)
- [npm Package](https://www.npmjs.com/package/repo-doctor) (coming soon)

---

Made with ❤️ by [consigcody94](https://github.com/consigcody94)
