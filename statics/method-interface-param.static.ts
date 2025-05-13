export const METHOD_INTERFACE_PARAM_TEMPLATE = `
interface I<%- utils.capitalize(method.name) %>Param {
  <% for (const member of members) { -%>
  <%- member -%>,
  <% } -%>
}
`.trim();
