# Contributing to repo-doctor

Thank you for your interest in contributing to repo-doctor! This document provides guidelines and instructions for contributing.

## Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/repo-doctor
cd repo-doctor
```

2. Install dependencies:
```bash
npm install
```

3. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

## Development Workflow

### Running Locally

```bash
# Run in development mode
npm run dev -- analyze --path .

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Code Quality Standards

- **TypeScript**: All code must be written in TypeScript with strict mode enabled
- **Tests**: Add tests for new features (aim for >80% coverage)
- **Linting**: Code must pass ESLint checks
- **Formatting**: Use Prettier for consistent formatting
- **Commits**: Use conventional commit messages

### Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add new security pattern detection
fix: resolve issue with large file scanning
docs: update README with new examples
test: add tests for branch analyzer
refactor: simplify reporter logic
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- format.test.ts
```

## Submitting Changes

1. Ensure all tests pass and code is linted
2. Update documentation if needed
3. Push your changes to your fork
4. Open a Pull Request with a clear description

## Pull Request Guidelines

- Keep changes focused and atomic
- Include tests for new features
- Update documentation as needed
- Ensure CI passes
- Provide a clear description of the changes

## Code Style

- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Follow existing code patterns
- Use TypeScript types effectively

## Questions?

Open an issue or reach out to the maintainers!

Thank you for contributing! 🎉
