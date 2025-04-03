// Utility function to format token counts consistently
export const formatTokens = (tokens: number, includeK = true): string => {
  const absTokens = Math.abs(tokens);
  const formatted = (absTokens / 1000).toFixed(2);
  return `~${formatted}${includeK ? "k" : ""}`;
};
