import * as fs from 'fs';

export const readCsvFile = (filePath: string): string[] => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return raw
    .split('\n')
    .filter(line => line.trim());
};

export const readCsvRows = (filePath: string): string[][] =>
  readCsvFile(filePath)
    .slice(1)
    .map(line => line.split(','));
