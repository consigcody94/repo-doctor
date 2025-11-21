import { SecurityScanner } from '../src/scanners/security-scanner';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('SecurityScanner', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-doctor-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should detect AWS keys', async () => {
    const testFile = path.join(tempDir, 'config.js');
    fs.writeFileSync(testFile, 'const key = "AKIAIOSFODNN7EXAMPLE";');

    const scanner = new SecurityScanner(tempDir);
    const results = await scanner.scan();

    expect(results.potentialSecrets.length).toBeGreaterThan(0);
    expect(results.potentialSecrets[0].type).toBe('AWS Access Key');
  });

  it('should detect GitHub tokens', async () => {
    const testFile = path.join(tempDir, 'auth.ts');
    fs.writeFileSync(testFile, 'const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";');

    const scanner = new SecurityScanner(tempDir);
    const results = await scanner.scan();

    expect(results.potentialSecrets.length).toBeGreaterThan(0);
    expect(results.potentialSecrets[0].type).toBe('GitHub Token (ghp)');
  });

  it('should detect sensitive files', async () => {
    fs.writeFileSync(path.join(tempDir, '.env'), 'SECRET_KEY=abc123');
    fs.writeFileSync(path.join(tempDir, 'credentials.json'), '{}');

    const scanner = new SecurityScanner(tempDir);
    const results = await scanner.scan();

    expect(results.sensitiveFiles.length).toBe(2);
    expect(results.sensitiveFiles).toContain('.env');
    expect(results.sensitiveFiles).toContain('credentials.json');
  });

  it('should skip node_modules', async () => {
    const nodeModules = path.join(tempDir, 'node_modules');
    fs.mkdirSync(nodeModules);
    fs.writeFileSync(path.join(nodeModules, 'secret.js'), 'AKIAIOSFODNN7EXAMPLE');

    const scanner = new SecurityScanner(tempDir);
    const results = await scanner.scan();

    expect(results.potentialSecrets.length).toBe(0);
  });

  it('should return empty results for clean repository', async () => {
    fs.writeFileSync(path.join(tempDir, 'clean.js'), 'const x = 1;');

    const scanner = new SecurityScanner(tempDir);
    const results = await scanner.scan();

    expect(results.potentialSecrets.length).toBe(0);
    expect(results.sensitiveFiles.length).toBe(0);
    expect(results.exposedKeys.length).toBe(0);
  });
});
