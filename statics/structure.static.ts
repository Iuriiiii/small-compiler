export const STRUCTURE_TEMPLATE = `
<%- importStructures -%>
<%- importsModules -%>
<%- importsEnums -%>
import {
  type AtLeastOneOf,
  type SerializedClass,
  registerClass,
} from "@tinyrpc/sdk-core";

export class <%- structure.name %> {
  <% for (const member of members) { %>
  <%- member -%>
  <% } %>

  constructor(<%- constructorParams %>) { }

  serialize(): AtLeastOneOf<SerializedClass<typeof <%- structure.name -%>>> {
    return {
      arguments: [<%- structureArguments -%>],
      members: {<%- structureMembers -%>}
    }
  }

  static from(members: InterfaceOf<typeof <%- structure.name %>>) {
     

    return Object.assign(, members);
  }
}

registerClass(<%- structure.name %>);
`.trim();
