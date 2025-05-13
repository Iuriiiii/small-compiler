export const STRUCTURE_MEMBER_TEMPLATE = `
<%- member.private -%><%- member.readonly -%><%- member.name -%><%- member.optional -%>:<%- member.stringDatatype -%><%- member.nullable -%>
`.trim();
