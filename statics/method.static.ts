export const METHOD_TEMPLATE = `
<%- method.docs %>
public <%- method.name -%>(
  <% for (const param of method.parameters) { %>
  <%- param -%>,
  <% } -%>
  request: RequestBody = {}
): Unwrappable<MethodResponse<<%- method.stringReturnType -%>>,<%- method.stringReturnType -%>> {
  return this.<%- method.name -%>Ex({<%- method.paramArgs -%>}, request);
}
`.trim();
