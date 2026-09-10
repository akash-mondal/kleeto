/**
 * ThreeUI's components load their shader documents with Vite's `?raw` suffix, which the
 * bundler is taught about in next.config.ts. TypeScript needs telling separately: without
 * this the registered source does not typecheck, and editing it to remove the suffix would
 * break the published hashes.
 */
declare module "*.html?raw" {
  const content: string;
  export default content;
}
