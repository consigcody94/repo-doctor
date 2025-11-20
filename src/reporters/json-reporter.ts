import { RepositoryHealth } from '../types';
import * as fs from 'fs';

export class JsonReporter {
  report(health: RepositoryHealth, outputPath?: string): void {
    const json = JSON.stringify(health, null, 2);

    if (outputPath) {
      fs.writeFileSync(outputPath, json);
      console.log(`Report saved to: ${outputPath}`);
    } else {
      console.log(json);
    }
  }
}
