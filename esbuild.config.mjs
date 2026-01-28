import esbuild from 'esbuild';
import { execSync } from 'child_process';
import { watch } from 'fs';
import process from 'process';

const isWatch = process.argv.includes('--watch');

const buildCss = () => {
  execSync('npx postcss src/styles.css -o styles.css', { stdio: 'inherit' });
};

const ctx = await esbuild.context({
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: ['obsidian'],
  format: 'cjs',
  target: 'es2020',
  platform: 'browser',
  outfile: 'main.js',
  sourcemap: isWatch ? 'inline' : false,
  jsx: 'automatic'
});

if (isWatch) {
  buildCss();
  await ctx.watch();
  let timer = null;
  watch('src', { recursive: true }, () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(buildCss, 100);
  });
} else {
  buildCss();
  await ctx.rebuild();
  await ctx.dispose();
}
