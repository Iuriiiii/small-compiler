import type { CompilerOptions, EnumMetadata, ModuleMetadata } from "@tinyrpc/server/types";
import type { SmallCompilerOptions } from "../interfaces/mod.ts";
import ejs from "ejs";
import { PROMPT_ENUM_TEMPLATE, PROMPT_MODULE_TEMPLATE } from "../statics/prompt/mod.ts";
import { getEnumKeys, quoteKeyIfNeeded, quoteValueIfNeeded } from "../utils/mod.ts";

export function compileEnumPrompt(
  _enum: EnumMetadata,
  _options: CompilerOptions,
  _compilerOptions: SmallCompilerOptions,
) {
  const enumerator = _enum.value as Record<string, string | number>;
  const keys = getEnumKeys(enumerator);
  const values = keys
    .map((key) =>
      key.trim() ? `${quoteKeyIfNeeded(key)} = ${quoteValueIfNeeded(enumerator[key])}` : ""
    )
    .filter(Boolean);

  return ejs.render(PROMPT_ENUM_TEMPLATE, {
    enum: _enum,
    values
  });
}

export function compileEnumsPrompt(
  enums: EnumMetadata[],
  options: CompilerOptions,
  compilerOptions: SmallCompilerOptions
) {
  const enumsPrompt: string[] = [];

  for (const _enum of enums) {
    const enumPrompt = compileEnumPrompt(_enum, options, compilerOptions);
    enumsPrompt.push(enumPrompt);
  }

  return enumsPrompt.join("\n\n");
}

export function compileModulePrompt(
  module: ModuleMetadata,
  options: CompilerOptions,
  compilerOptions: SmallCompilerOptions
) {
  ;

  return ejs.render(PROMPT_MODULE_TEMPLATE, {
    module
  });
}

export function promptCompiler(
  options: CompilerOptions,
  _compilerOptions: SmallCompilerOptions,
  mainPath: string,
) {
  const { structures, modules, enums } = options.metadata;

  const enumsPrompt = compileEnumsPrompt(enums, options, _compilerOptions);
}