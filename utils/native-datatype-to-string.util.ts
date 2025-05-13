export function nativeDatatypeToString(dataType: unknown): string {
  switch (dataType) {
    case String:
      return "string";
    case Number:
      return "number";
    case Boolean:
      return "boolean";
    case Date:
      return "Date";
    case Uint8Array:
      return "Uint8Array";
    case Object:
      return "Record<string, unknown>";
    case null:
      return "null";
    default:
      return "unknown";
  }
}
