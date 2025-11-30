/**
 * @file Lint-staged configuration for the project.
 * @see https://github.com/okonet/lint-staged
 */

const config = {
  // Run the TypeScript compiler to check for type errors in staged files.
  // This is a crucial step to catch type-related issues early.
  "**/*.ts?(x)": () => "bun run type-check",

  // Run ESLint to lint and fix all staged JavaScript and TypeScript files.
  // The `filenames` argument ensures that we only process the files that
  // are part of the commit.
  "*.{js,jsx,ts,tsx}": (filenames: string[]) =>
    `bunx eslint --fix ${filenames.join(" ")}`,

  // Run Prettier to format all staged files. This ensures a consistent
  // code style across the entire project.
  "*.{js,jsx,ts,tsx,json,md,css,scss}": (filenames: string[]) =>
    `bunx prettier --write ${filenames.join(" ")}`,
};

export default config;
