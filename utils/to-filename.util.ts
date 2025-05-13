import { pascalToKebab } from "./pascal-to-kebab.util.ts";

/**
 * Converts PascalCase name to kebab-case and adds postfix and `.ts` extension
 *
 * @example
 * toFilename("MyStructure", "model") // my-structure.model.ts
 * @param {string} name PascalCase name of the structure
 * @param {string} postfix Postfix for file name (e.g. "model", "resolver")
 * @returns {string} A file name with `.ts` extension
 */
export function toFilename(name: string, postfix: string) {
  return `${pascalToKebab(name).toLowerCase()}.${postfix}.ts`;
}
