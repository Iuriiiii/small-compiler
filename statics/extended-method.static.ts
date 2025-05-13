export const EXTENDED_METHOD_TEMPLATE = `
public <%- method.name -%>Ex (
  args: I<%- utils.capitalize(method.name) %>Param,
  request: RequestBody = {}
): Unwrappable<MethodResponse<<%- method.stringReturnType -%>>,<%- method.stringReturnType -%>> {
  const argument = {
    connection: {
      module: "<%- module.name -%>",
      method: "<%- method.name -%>",
    },
    args,
    updates: {
      parent: this,
      keys: <%- JSON.stringify(method.links ?? []) -%> as unknown as MapStructure<object>,
    },
    request,
    context: <%- !module.isSerializable ? "[]" : "this.serialize().arguments ?? []" -%>,
    voidIt: <%- method.makeVoid -%>
  };

  return makeItUnwrappable(rpc<<%- method.stringReturnType -%>, HttpError>(argument));
}
`.trim();
