export const ENUM_TEMPLATE = `
<%- importStructures -%>
<%- importsModules -%>
<%- importsEnums -%>

export enum <%- _enum.name %> {
<% for (const value of values) { -%>
<%- value -%>,
<% } -%>
}`.trim();
