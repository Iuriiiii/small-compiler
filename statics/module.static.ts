export const MODULE_TEMPLATE = `
// deno-lint-ignore-file
<%- importStructures -%>
<%- importsModules -%>
<%- importsEnums -%>
import {
  type Unwrappable,
  type ClassOrInterface,
  type AtLeastOneOf,
  type SerializedClass,
  registerClass,
  HttpError,
  MethodResponse,
  RequestBody,
  rawRpc as rpc,
  MapStructure,
  makeItUnwrappable,
  normalizeObject,
  SerializableClass,
} from "@tinyrpc/sdk-core";

<%- paramInterfaces %>

export class <%- module.name -%> <% if (module.isSerializable) { %> extends SerializableClass <% } %> {
  <%- members.join(";") %>

  constructor(<%- constructorParams %>) {
  <% if (module.isSerializable) { %> super(); <% } %>
  }

  <% for (const method of methods) { %>
  <%- method -%>
  <% } %>

  serialize(): AtLeastOneOf<SerializedClass<typeof <%- module.name -%>>> {
    return {
      arguments: [<%- moduleArguments -%>] as unknown as ConstructorParameters<typeof <%- module.name -%>>,
      members: {<%- moduleMembers -%>}
    }
  }

  static from(obj: ClassOrInterface<<%- module.name -%>>) {
    if (obj instanceof <%- module.name -%>) {
      return obj;
    }

    const instance = new <%- module.name -%>(<%- moduleFromArguments -%>);
    
    <%- membersAssignation %>

    return instance;
  }
}

<% if (module.isSerializable) { %>
registerClass(<%- module.name -%>);
<% } %>
`.trim();
