export const MOD_TEMPLATE = `
<% for (const file of files) { -%>
export * from "./<%- file -%>";
<% } -%>
`.trim();
