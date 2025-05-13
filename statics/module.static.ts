export const MODULE_TEMPLATE = `
// deno-lint-ignore-file
<%- importStructures -%>
<%- importsModules -%>
<%- importsEnums -%>
import {
  type Unwrappable,
  type ClassOrInterface,
  type RequireAtLeastOne,
  type SerializedClass,
  HttpError,
  MethodResponse,
  RequestBody,
  rawRpc as rpc,
  MapStructure,
  makeItUnwrappable,
  normalizeObject,
  SerializableClass,
  Serializable
} from "@tinyrpc/sdk-core";

<%- paramInterfaces %>

<%- module.serializable -%>
export class <%- module.name -%> {
  <% for (const method of methods) { %>
  <%- method -%>
  <% } %>
}
`.trim();
