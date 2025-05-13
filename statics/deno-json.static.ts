export const DENO_JSON_TEMPLATE = `
{
  "name": "<%- project.name -%>",
  "version": "<%- project.version -%>",
  "tasks": {},
  "imports": <%- JSON.stringify(project.imports, null, 2) -%>,
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
`.trim();
