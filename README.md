# 🏥 repo-doctor

> Intelligent repository health checker and optimizer - analyze git repos, detect issues, get actionable insights

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green)](https://nodejs.org/)

**repo-doctor** is a production-ready CLI tool that analyzes your Git repositories and provides comprehensive health reports with security scanning, commit analysis, file metrics, and actionable recommendations.

## ✨ Features

- 🔒 **Security Scanning**: Detect secrets, API keys, and sensitive files
- 📊 **Repository Analytics**: Commit patterns, contributor insights, and activity metrics
- 📁 **File Analysis**: Large file detection, file type distribution, and repository size
- 🌿 **Branch Health**: Identify stale branches and track active development
- 💯 **Health Score**: Get an overall grade (A-F) with detailed breakdown
- 📝 **Multiple Output Formats**: Terminal (beautiful), JSON, and Markdown
- ⚡ **Fast & Efficient**: Optimized for large repositories
- 🎨 **Beautiful Terminal UI**: Colorful, organized, easy-to-read reports

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

### Analyze Repository

```bash
# Analyze current directory
repo-doctor analyze

# Analyze specific repository
repo-doctor analyze --path /path/to/repo

# Generate JSON report
repo-doctor analyze --format json --output report.json

# Generate Markdown report
repo-doctor analyze --format markdown --output report.md

# Skip security scan (faster)
repo-doctor analyze --skip-security

# Custom thresholds
repo-doctor analyze --max-file-size 50 --stale-branch-days 180
```

### Quick Security Scan

```bash
# Scan for secrets and sensitive files only
repo-doctor scan

# Scan specific repository
repo-doctor scan --path /path/to/repo
```

### Generate Report

```bash
# Convert JSON to terminal format
repo-doctor report --input report.json

# Convert JSON to Markdown
repo-doctor report --input report.json --format markdown --output output.md
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
