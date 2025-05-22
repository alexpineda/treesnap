import ignore, { type Ignore } from "ignore";

const DEFAULT_IGNORE_PATTERNS = `
# repo internals
.git
.git/**        # sub-dirs
.gitattributes
# big/irrelevant directories
node_modules
vendor            # Composer / PHP
dist
build
coverage
.DS_Store
`;


export async function buildIgnoreMatcher(
  ignorePatterns?: string
): Promise<Ignore> {
  const ig = ignore().add(DEFAULT_IGNORE_PATTERNS);
  if (!ignorePatterns) return ig;
  try {
    ig.add(ignorePatterns);
  } catch (_) {
    /* no root .gitignore — fine */
  }
  return ig;
}
