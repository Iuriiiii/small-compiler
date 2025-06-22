export function quoteKeyIfNeeded(value: string) {
  return value.match(/\s+/) ? `"${value}"` : value;
}