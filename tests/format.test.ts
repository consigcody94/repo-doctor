import { formatBytes, formatDaysAgo, calculateGrade, pluralize } from '../src/utils/format';

describe('formatBytes', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('should handle decimal places', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1572864)).toBe('1.5 MB');
  });
});

describe('formatDaysAgo', () => {
  it('should format recent days', () => {
    expect(formatDaysAgo(0)).toBe('today');
    expect(formatDaysAgo(1)).toBe('yesterday');
    expect(formatDaysAgo(3)).toBe('3 days ago');
  });

  it('should format weeks', () => {
    expect(formatDaysAgo(7)).toBe('1 weeks ago');
    expect(formatDaysAgo(14)).toBe('2 weeks ago');
  });

  it('should format months', () => {
    expect(formatDaysAgo(30)).toBe('1 months ago');
    expect(formatDaysAgo(60)).toBe('2 months ago');
  });

  it('should format years', () => {
    expect(formatDaysAgo(365)).toBe('1 years ago');
    expect(formatDaysAgo(730)).toBe('2 years ago');
  });
});

describe('calculateGrade', () => {
  it('should assign correct grades', () => {
    expect(calculateGrade(95)).toBe('A');
    expect(calculateGrade(85)).toBe('B');
    expect(calculateGrade(75)).toBe('C');
    expect(calculateGrade(65)).toBe('D');
    expect(calculateGrade(50)).toBe('F');
  });

  it('should handle boundary values', () => {
    expect(calculateGrade(90)).toBe('A');
    expect(calculateGrade(89)).toBe('B');
    expect(calculateGrade(80)).toBe('B');
    expect(calculateGrade(79)).toBe('C');
  });
});

describe('pluralize', () => {
  it('should handle singular', () => {
    expect(pluralize(1, 'file')).toBe('1 file');
    expect(pluralize(1, 'branch', 'branches')).toBe('1 branch');
  });

  it('should handle plural', () => {
    expect(pluralize(2, 'file')).toBe('2 files');
    expect(pluralize(5, 'branch', 'branches')).toBe('5 branches');
    expect(pluralize(0, 'file')).toBe('0 files');
  });
});
