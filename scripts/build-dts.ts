import { readCachedProjectGraph, readProjectsConfigurationFromProjectGraph } from '@nx/devkit';
import path from 'node:path';
import { rollup } from 'rollup';
import dts from 'rollup-plugin-dts';

// ---- ARG PARSING ----

import minimist from 'minimist';

type Args = { project: string; tsconfig?: string; nxTarget: string };

function parseArgs(): Args {
  const args = minimist(process.argv.slice(2));
  if (!args.project) {
    throw new Error('Missing required argument: --project');
  }

  return {
    project: args.project,
    tsconfig: args.tsconfig,
    nxTarget: args.nxTarget ?? 'build',
  };
}

const { project: projectName, tsconfig: tsconfigArg, nxTarget: nxTargetArg } = parseArgs();

// ---- NX LOOKUP ----

const projectGraph = readCachedProjectGraph();
const projectsConfig = readProjectsConfigurationFromProjectGraph(projectGraph);
const project = projectsConfig.projects[projectName];

if (!project) {
  throw new Error(`Project "${projectName}" not found in workspace`);
}

const buildOptions = project.targets?.[nxTargetArg]?.options;
if (!buildOptions?.outputPath) {
  throw new Error(`"outputPath" not defined in ${projectName}:${nxTargetArg} target`);
}

// ---- PATH RESOLUTION ----

const outputPath = path.resolve(buildOptions.outputPath);
const input = path.resolve(project.root, 'src/index.ts');
const tsconfig = path.resolve(tsconfigArg ?? path.join(project.root, 'tsconfig.dts.json'));
const indexDts = path.join(outputPath, 'index.d.ts');

// ---- BUILD -----
const bundle = await rollup({
  input,
  plugins: [dts({ tsconfig })],
});

await bundle.write({
  file: indexDts,
  format: 'es',
});
