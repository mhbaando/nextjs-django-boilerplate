import type { UserConfig } from "@commitlint/types";

/**
 * @file Commitlint configuration for the project.
 * @see https://commitlint.js.org/#/reference-configuration
 */

const config: UserConfig = {
  /**
   * We extend the conventional commit configuration, which enforces a standard
   * commit message format. This is crucial for generating automated changelogs
   * and maintaining a clear, professional commit history.
   *
   * @see https://www.conventionalcommits.org/
   */
  extends: ["@commitlint/config-conventional"],

  /**
   * Here, we explicitly define the "rules" for our commit messages.
   * While extending `config-conventional` already sets these up,
   * defining them here makes the configuration clearer and easier to customize.
   */
  rules: {
    /**
     * `type-enum` is the rule that enforces the allowed commit types.
     * The structure is [level, applicability, value].
     * - Level 2: Always treat a violation as an error.
     * - 'always': This rule is always active.
     * - The array of strings is the list of allowed types.
     */
    "type-enum": [
      2,
      "always",
      [
        "feat", // A new feature
        "fix", // A bug fix
        "docs", // Documentation only changes
        "style", // Changes that do not affect the meaning of the code (white-space, formatting, etc)
        "refactor", // A code change that neither fixes a bug nor adds a feature
        "perf", // A code change that improves performance
        "test", // Adding missing tests or correcting existing tests
        "chore", // Changes to the build process or auxiliary tools and libraries
        "ci", // Changes to CI configuration files and scripts
        "build", // Changes that affect the build system or external dependencies
        "revert", // Reverts a previous commit
      ],
    ],
  },
};

export default config;
