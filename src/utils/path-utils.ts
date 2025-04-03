export const basename = (path: string) => {
  return path.split(/[/\\]/).pop() ?? "unknown";
};
