const buildResult = await Bun.build({
  entrypoints: ["./src/extension.ts"], // Your analysis entrypoint
  outdir: "./dist",
  target: "node",
  format: "esm",
  external: ["vscode"],
  minify: true,
  sourcemap: "external",
});

if (!buildResult.success) {
  throw new AggregateError(buildResult.logs);
}
