import type { CompilerInformation, CompilerOptions } from "../tinyrpc/types.ts";
import { compilePackage } from "./compilers/mod.ts";

export interface CompilerPlainOptions {
  imports: Record<string, string>;
}

export function SmallCompiler(
  config: CompilerPlainOptions = { imports: {} },
): CompilerInformation<CompilerPlainOptions> {
  return {
    name: "Small Compiler",
    // deno-lint-ignore require-await
    compiler: async (options: CompilerOptions) => {
      return compilePackage(options, config);
    },
    custom: config,
  };
}
