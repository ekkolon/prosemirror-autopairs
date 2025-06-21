import { defineConfig } from 'rollup';
import dts from 'rollup-plugin-dts';

import path from 'node:path';

const cwd = process.cwd();

const projectName = "prosemirror-autopairs";
const projectRoot = path.join('packages', projectName);
const input = path.join(cwd, projectRoot, '/src/index.ts');
const tsconfig = path.join(cwd, projectRoot, 'tsconfig.types.json');

const buildDir = path.join(cwd, 'dist', projectName);
const indexDts = path.join(buildDir, 'index.d.ts');

export default defineConfig({
  input: input,
  output: {
    file: indexDts,
    format: 'es',
  },
  plugins: [dts({ tsconfig })],
});
