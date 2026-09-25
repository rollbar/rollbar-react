// Type-checks the project, index.d.ts included, and fails on any error outside
// node_modules.
//
// `tsc --noEmit` alone fails on errors inside dependencies' typings (rollbar
// 3's index.d.ts and the rrweb-pulled @types/css-font-loading-module), while
// `--skipLibCheck` would also skip our own index.d.ts, so a broken import
// there would silently become `any` for every consumer.
import * as path from 'path';
import * as ts from 'typescript';

const root = path.join(__dirname, '..');

const parsed = ts.getParsedCommandLineOfConfigFile(
  path.join(root, 'tsconfig.json'),
  {},
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (d) => {
      throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    },
  },
);
if (!parsed) {
  throw new Error('could not read tsconfig.json');
}
const { options, fileNames, errors } = parsed;

const program = ts.createProgram({ rootNames: fileNames, options });
// TypeScript stores file names with forward slashes on every platform, so
// don't split on path.sep: on Windows that would filter out nothing.
const diagnostics = [...errors, ...ts.getPreEmitDiagnostics(program)].filter(
  (d) => !d.file || !d.file.fileName.split('/').includes('node_modules'),
);

if (diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (f) => f,
      getCurrentDirectory: () => root,
      getNewLine: () => ts.sys.newLine,
    }),
  );
  process.exit(1);
}
console.log(`typecheck: ${fileNames.length} files, no errors`);
