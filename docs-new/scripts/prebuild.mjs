import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const commit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
writeFileSync('components/commit.tsx', `const commit = "${commit}";\nexport default commit;\n`);
console.log(`Generated commit.tsx: ${commit}`);
