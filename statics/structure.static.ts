export const STRUCTURE_TEMPLATE = `
<%- importStructures -%>
<%- importsModules -%>
<%- importsEnums -%>
import {
  type RequireAtLeastOne,
  type SerializedClass,
  Serializable
} from "@tinyrpc/sdk-core";

@Serializable()
export class <%- structure.name %> {
  <% for (const member of members) { %>
  <%- member -%>
  <% } %>

  constructor(<%- constructorParams %>) { }

  serialize(): RequireAtLeastOne<SerializedClass<typeof <%- structure.name -%>>> {
    return {
      arguments: [<%- structureArguments -%>],
      members: {<%- structureMembers -%>}
    }
  }

  static from(members: InterfaceOf<typeof <%- structure.name %>>) {
     

    return Object.assign(, members);
  }
}
`.trim();
