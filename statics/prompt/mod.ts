export const PROMPT_ENUM_TEMPLATE = `
The enum "<%- enum.name %>" has the following member(s) and value(s):

<% for (const value of values) { -%>
<%- value -%>,
<% } -%>
`.trim();

export const PROMPT_MODULE_TEMPLATE = `

`.trim();

export const PROMPT_TEMPLATE = `
<%- importStructures -%>
<%- importsModules -%>
<%- importsEnums -%>
`.trim();