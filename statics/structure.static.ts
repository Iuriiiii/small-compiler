export const STRUCTURE_TEMPLATE = `
<%- importStructures -%>
<%- importsModules -%>
<%- importsEnums -%>

export class <%- structure.name %> {
  <% for (const member of members) { %>
  <%- member -%>
  <% } %>
}
`.trim();
