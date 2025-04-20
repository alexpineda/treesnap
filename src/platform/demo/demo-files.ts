import { FileTreeNode } from "../../types";

// --- Demo Workspace Data ---
export const DEMO_WORKSPACE_PATH = "/demo-workspace";
// utils/sort-file-tree.ts
export const sortFileTree = (nodes: FileTreeNode[]): FileTreeNode[] =>
  nodes
    .slice() // don’t mutate caller
    .sort((a, b) => {
      if (a.is_directory !== b.is_directory) {
        return a.is_directory ? -1 : 1; // dirs first
      }
      return a.name.localeCompare(b.name, undefined, {
        sensitivity: "base",
        numeric: true,
      });
    })
    .map((n) =>
      n.children ? { ...n, children: sortFileTree(n.children) } : n
    );

export const createDemoFileTree = (): FileTreeNode[] =>
  sortFileTree([
    {
      name: "Demo Project",
      path: DEMO_WORKSPACE_PATH,
      is_directory: true,
      children: [
        {
          name: "README.md",
          path: `${DEMO_WORKSPACE_PATH}/README.md`,
          is_directory: false,
          children: [],
        },
        {
          name: "src",
          path: `${DEMO_WORKSPACE_PATH}/src`,
          is_directory: true,
          children: [
            {
              name: "index.ts",
              path: `${DEMO_WORKSPACE_PATH}/src/index.ts`,
              is_directory: false,
              children: [],
            },
            {
              name: "utils.ts",
              path: `${DEMO_WORKSPACE_PATH}/src/utils.ts`,
              is_directory: false,
              children: [],
            },
            {
              name: "components",
              path: `${DEMO_WORKSPACE_PATH}/src/components`,
              is_directory: true,
              children: [
                {
                  name: "Button.tsx",
                  path: `${DEMO_WORKSPACE_PATH}/src/components/Button.tsx`,
                  is_directory: false,
                  children: [],
                },
              ],
            },
          ],
        },
        {
          name: "package.json",
          path: `${DEMO_WORKSPACE_PATH}/package.json`,
          is_directory: false,
          children: [],
        },
      ],
    },
  ]);

export const DEMO_FILE_TOKENS: Record<string, number> = {
  [`${DEMO_WORKSPACE_PATH}/README.md`]: 150,
  [`${DEMO_WORKSPACE_PATH}/src/main.ts`]: 500,
  [`${DEMO_WORKSPACE_PATH}/src/utils.ts`]: 250,
  [`${DEMO_WORKSPACE_PATH}/src/components/Button.tsx`]: 300,
  [`${DEMO_WORKSPACE_PATH}/package.json`]: 80,
};

export const DEMO_FILE_TOKENS_COPY_TO_CLIPBOARD = `
${DEMO_WORKSPACE_PATH}/README.md
${DEMO_WORKSPACE_PATH}/src/main.ts
${DEMO_WORKSPACE_PATH}/src/utils.ts
${DEMO_WORKSPACE_PATH}/src/components/Button.tsx
${DEMO_WORKSPACE_PATH}/package.json
`;
