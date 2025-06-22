import { isNumber } from "@online/is";

export function quoteValueIfNeeded(value: string | number) {
  if (isNumber(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '\\"')}"`;
}