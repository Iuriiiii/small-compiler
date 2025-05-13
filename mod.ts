import type { CompilerInformation, CompilerOptions } from "@tinyrpc/server/types";
import type { SmallCompilerOptions } from "./interfaces/mod.ts";
import { compilePackage } from "./compilers/mod.ts";

export function SmallCompiler(
  config: SmallCompilerOptions = { imports: {} },
): CompilerInformation<SmallCompilerOptions> {
  return {
    name: "Small Compiler",
    // deno-lint-ignore require-await
    compiler: async (options: CompilerOptions) => {
      return compilePackage(options, config);
    },
    custom: config,
  };
}
