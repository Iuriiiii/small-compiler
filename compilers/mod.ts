import type {
  CalculatedDatatype,
  CompilerOptions,
  Constructor,
  Datatype,
  EnumMetadata,
  MemberMetadata,
  MethodMetadata,
  ModuleMetadata,
  ParameterMetadata,
  StructureMetadata,
} from "@tinyrpc/server/types";
import { SerializableClass } from "@tinyrpc/server";
import {
  calculateDatatype,
  DatatypeType,
  getExposedEnumName,
  getModule,
  getStructure,
} from "@tinyrpc/server/utils";
import {
  createPackageFolder,
  formatFolder,
  getEnumKeys,
  nativeDatatypeToString,
  pascalToKebab,
  quoteKeyIfNeeded,
  quoteValueIfNeeded,
  randomString,
  toFilename,
  writeFile
} from "../utils/mod.ts";
import ejs from "ejs";
import {
  DENO_JSON_TEMPLATE,
  ENUM_TEMPLATE,
  EXTENDED_METHOD_TEMPLATE,
  IMPORT_TEMPLATE,
  METHOD_INTERFACE_PARAM_TEMPLATE,
  METHOD_TEMPLATE,
  MOD_TEMPLATE,
  MODULE_TEMPLATE,
  PARAM_TEMPLATE,
  STRUCTURE_MEMBER_TEMPLATE,
  STRUCTURE_TEMPLATE,
} from "../statics/mod.ts";
import { isConstructor, isUndefined } from "@online/is";
import currentDenoJson from "../deno.json" with { type: "json" };
import {
  CustomDatatype,
  IntersectionDatatype,
  Null,
  OmitDatatype,
  PartialDatatype,
  UnionDatatype,
  Void,
} from "@tinyrpc/server/datatypes";
import type { SmallCompilerOptions } from "../interfaces/mod.ts";
import { getConstructorName } from "../../tinyrpc/src/utils/get-constructor-name.util.ts";

interface ExtendedMemberMetadata
  extends
  Omit<MemberMetadata, "optional" | "nullable" | "private" | "readonly"> {
  stringDatatype: string;
  optional: string;
  nullable: string;
  private: string;
  readonly: string;
}

interface ExtendedParameterMetadata
  extends Omit<ParameterMetadata, "nullable" | "optional"> {
  stringDatatype: string;
  nullable: string;
  optional: string;
}

interface ExtendedMethodMetadata extends MethodMetadata {
  makeVoid: boolean;
  stringReturnType: string;
  parameters: string[];
  paramArgs: string;
  description: string;
}

interface ExtendedModuleMetadata extends ModuleMetadata {
  isSerializable: boolean;
  serializable: string;
}

// TODO: For extended methods only, this is to declare an interface for the arguments

interface CompilationContext {
  imports: CalculatedDatatype[];
  options: CompilerOptions;
  compilerOptions: SmallCompilerOptions;
}

const RENDER_UTILS = {
  capitalize: (s: string) => s.charAt(0).toUpperCase() + s.slice(1),
  pascalToKebab,
  randomString,
};

function importDatatypeIfNeeded(
  calculateDatatype: CalculatedDatatype,
  context: CompilationContext,
) {
  if (
    context.imports.some((datatype) =>
      datatype.reference === calculateDatatype.reference
    )
  ) {
    return;
  }

  context.imports.push(calculateDatatype);
}

function datatypeCompiler(
  context: CompilationContext,
  dataType?: Datatype,
): string {
  if (isUndefined(dataType)) {
    return "unknown";
  }

  const calculatedDatatype = calculateDatatype(dataType);
  const stringDatatype = (() => {
    switch (calculatedDatatype.type) {
      case DatatypeType.Structure:
      case DatatypeType.Module:
        importDatatypeIfNeeded(calculatedDatatype, context);
        return (calculatedDatatype.reference as ModuleMetadata).name;
      case DatatypeType.Enum: {
        importDatatypeIfNeeded(calculatedDatatype, context);
        const enumName = getExposedEnumName(
          calculatedDatatype.dataType as object,
        )!;
        return enumName;
      }
      case DatatypeType.Object:
        return "object";
      case DatatypeType.Primitive:
        return nativeDatatypeToString(calculatedDatatype.dataType);
      // deno-lint-ignore no-fallthrough
      case DatatypeType.Custom: {
        if (isConstructor<Constructor>(calculatedDatatype.dataType)) {
          switch (true) {
            case calculatedDatatype.dataType === Null:
              return "null";
            case calculatedDatatype.dataType === Void:
              return "void";
          }
        } else if (calculatedDatatype.dataType instanceof CustomDatatype) {
          switch (true) {
            case calculatedDatatype.dataType instanceof UnionDatatype: {
              const stringifiedDatatypes = calculatedDatatype.dataType.dataTypes
                .map((_datatype) => datatypeCompiler(context, _datatype))
                .join(" | ");

              return `(${stringifiedDatatypes})`;
            }
            case calculatedDatatype.dataType instanceof IntersectionDatatype: {
              const stringifiedDatatypes = calculatedDatatype.dataType.dataTypes
                .map((_datatype) => datatypeCompiler(context, _datatype))
                .join(" & ");

              return `(${stringifiedDatatypes})`;
            }
            case calculatedDatatype.dataType instanceof OmitDatatype: {
              const stringifiedDatatype = datatypeCompiler(
                context,
                calculatedDatatype.dataType.dataType,
              );
              const stringifiedOmmitedKeys = calculatedDatatype.dataType
                .ommitedKeys.join(" | ");

              return `Omit<${stringifiedDatatype}, ${stringifiedOmmitedKeys}>`;
            }
            case calculatedDatatype.dataType instanceof PartialDatatype: {
              const stringifiedDatatype = datatypeCompiler(
                context,
                calculatedDatatype.dataType.dataType,
              );

              return `Partial<${stringifiedDatatype}>`;
            }
            default:
              return "unknown";
          }
        } else {
          return "never";
        }
      }
      default:
        return "unknown";
    }
  })() + "[]".repeat(calculatedDatatype.arrayLevel);

  return stringDatatype;
}

export function memberCompiler(
  member: MemberMetadata,
  context: CompilationContext,
) {
  const stringDatatype = datatypeCompiler(context, member.dataType);
  const extendedDatatype: ExtendedMemberMetadata = {
    ...member,
    stringDatatype,
    optional: member.optional ? "?" : "!",
    nullable: member.nullable ? " | null" : "",
    private: member.private ? "private " : "",
    readonly: member.readonly ? "readonly " : "",
  };

  if (!isUndefined(member.constructorParam)) {
    if (!member.optional) {
      // extendedDatatype.optional = "";
    }

    if (!member.private) {
      extendedDatatype.private = "public ";
    }
  }

  return ejs.render(STRUCTURE_MEMBER_TEMPLATE, {
    member: extendedDatatype,
    utils: RENDER_UTILS,
  }) as string;
}

export function constructorParamCompiler(
  member: MemberMetadata,
  context: CompilationContext,
) {
  const stringDatatype = datatypeCompiler(context, member.dataType);
  const extendedDatatype: ExtendedMemberMetadata = {
    ...member,
    stringDatatype,
    optional: member.optional ? "?" : "!",
    nullable: member.nullable ? " | null" : "",
    private: member.private ? "private " : "",
    readonly: member.readonly ? "readonly " : "",
  };

  if (!isUndefined(member.constructorParam)) {
    if (!member.optional) {
      extendedDatatype.optional = "";
    }

    if (!member.private) {
      extendedDatatype.private = "public ";
    }
  }

  return ejs.render(STRUCTURE_MEMBER_TEMPLATE, {
    member: extendedDatatype,
    utils: RENDER_UTILS,
  }) as string;
}

interface ImportMetadata {
  imports: string[];
  from: string;
}

function importCompiler(
  from: string,
  context: CompilationContext,
  type: DatatypeType,
) {
  const calculatedTypes = context.imports.filter((i) => i.type === type);
  const imports: ImportMetadata[] = [];

  for (const calculatedType of calculatedTypes) {
    switch (type) {
      case DatatypeType.Module:
      case DatatypeType.Structure: {
        const name = (calculatedType.dataType as StructureMetadata).name;
        imports.push({ imports: [name], from: from + toFilename(name, type) });
        break;
      }
      case DatatypeType.Enum: {
        const name = getExposedEnumName(calculatedType.dataType as object)!;
        imports.push({ imports: [name], from: from + toFilename(name, type) });
        break;
      }
      case DatatypeType.Object:
        break;
      case DatatypeType.Primitive:
        break;
      case DatatypeType.Custom:
        break;
    }
  }

  const stringImports = imports.map(({ imports, from }) => {
    return ejs.render(IMPORT_TEMPLATE, {
      imports: imports.join(", "),
      from,
    });
  }) as string[];

  return stringImports;
}

function compileClass(
  _name: string,
  _constructor: Constructor,
  _members: MemberMetadata[],
  _methods: MethodMetadata[],
  _context: CompilationContext
) {
  const isSerializable = _constructor.prototype instanceof
    SerializableClass;
  const extendedModule: ExtendedModuleMetadata = {
    isSerializable,
    serializable: isSerializable ? "@Serializable()" : "",
    name: _name,
    constructor: _constructor,
    members: _members,
    methods: _methods,
  };
  const methods = _methods
    .map((method) => methodCompiler(extendedModule, method, _context));
  const members = _members
    .filter((member) => isUndefined(member.constructorParam))
    .map((member) => memberCompiler(member, _context));
  const constructorParams = _members
    .filter((member) => !isUndefined(member.constructorParam))
    .map((member) => constructorParamCompiler(member, _context));
  const importStructures = importCompiler("../structures/", _context, DatatypeType.Structure)
    .join("\n");
  const importsModules = importCompiler("./", _context, DatatypeType.Module)
    .join("\n");
  const importsEnums = importCompiler("../enums/", _context, DatatypeType.Enum)
    .join("\n");
  const paramInterfaces = _methods
    .map((method) => interfaceParamsCompiler(method, _context))
    .join("\n\n");
  const moduleArguments = _members
    .filter((member) => !isUndefined(member.constructorParam))
    .sort((memberA, memberB) => memberA.constructorParam! - memberB.constructorParam!)
    .map((member) => {
      if ([String, Number].includes(member.dataType)) {
        return `this.${member.name}`;
      }

      const constructorName = member.dataType.name;
      const structureOrModule = (getModule(constructorName) || getStructure(constructorName))!;
      const identifierMember = structureOrModule.members.find((m) => m.identifier)!;

      return `this.${member.name}.${identifierMember.name}`;
    })
    .join(", ");
  const moduleMembers = _members
    .filter((member) => isUndefined(member.constructorParam))
    .map((member) => `${member.name}: this.${member.name}`)
    .reverse()
    .join(", ");
  const moduleFromArguments = _members
    .filter((member) => !isUndefined(member.constructorParam))
    .sort((memberA, memberB) => memberA.constructorParam! - memberB.constructorParam!)
    .map((member) => `obj.${member.name}`)
    .join(", ");
  const membersAssignation = _members
    .filter((member) => isUndefined(member.constructorParam))
    .map((member) => `instance.${member.name} = obj.${member.name}`)
    .join("\n");

  return ejs.render(MODULE_TEMPLATE, {
    module: extendedModule,
    methods,
    importStructures,
    importsModules,
    importsEnums,
    paramInterfaces,
    utils: RENDER_UTILS,
    moduleArguments,
    moduleMembers,
    members,
    constructorParams,
    membersAssignation,
    moduleFromArguments
  }) as string;
}

export function structureCompiler(
  structure: StructureMetadata,
  context: CompilationContext,
) {
  return compileClass(
    structure.name,
    structure.constructor,
    structure.members,
    [],
    context
  );
}

export function enumCompiler(
  _enum: EnumMetadata,
  context: CompilationContext,
) {
  const enumerator = _enum.value as Record<string, string | number>;
  const keys = getEnumKeys(enumerator);
  const values = keys.map((key) =>
    key.trim()
      ? `${quoteKeyIfNeeded(key)} = ${quoteValueIfNeeded(enumerator[key])}`
      : ""
  );
  const importStructures = importCompiler(
    "../structures/",
    context,
    DatatypeType.Structure,
  ).join("\n");
  const importsModules = importCompiler(
    "../modules/",
    context,
    DatatypeType.Module,
  ).join("\n");
  const importsEnums = importCompiler("./", context, DatatypeType.Enum).join(
    "\n",
  );

  return ejs.render(ENUM_TEMPLATE, {
    _enum,
    values,
    importStructures,
    importsModules,
    importsEnums,
  }) as string;
}

export function interfaceParamsCompiler(
  method: MethodMetadata,
  context: CompilationContext,
) {
  const params = method.params.map((param) => paramCompiler(param, context));

  return ejs.render(METHOD_INTERFACE_PARAM_TEMPLATE, {
    method,
    members: params,
    utils: RENDER_UTILS,
  }) as string;
}

export function paramCompiler(
  param: ParameterMetadata,
  context: CompilationContext,
) {
  const stringDatatype = datatypeCompiler(context, param.dataType);
  const extendedParam: ExtendedParameterMetadata = {
    ...param,
    stringDatatype,
    nullable: param.nullable ? " | null" : "",
    optional: param.optional ? "?" : "",
  };

  return ejs.render(PARAM_TEMPLATE, {
    param: extendedParam,
    utils: RENDER_UTILS,
  }) as string;
}

export function methodCompiler(
  module: ExtendedModuleMetadata,
  method: MethodMetadata,
  context: CompilationContext,
) {
  const calculatedDatatype = datatypeCompiler(context, method.returnType);
  const paramNames = method.params.map((p) => p.name!).reverse().join(", ");
  const paramArgs = method.params.map((p) => {
    const calculatedDatatype = calculateDatatype(p.dataType);

    if (
      calculatedDatatype.type === DatatypeType.Structure ||
      (calculatedDatatype.type === DatatypeType.Module &&
        (calculatedDatatype.reference as Constructor).prototype instanceof
        SerializableClass)
    ) {
      const constructor = calculatedDatatype.reference as Constructor;
      const constructorName = constructor.name;
      const arrayPosfix = "[]".repeat(calculatedDatatype.arrayLevel);
      return `${p.name}: normalizeObject(${constructorName}, ${p.name}) as unknown as ${constructorName}${arrayPosfix}`;
    }

    return p.name;
  }).join(", ");
  const parameters = method.params.map((param) => paramCompiler(param, context))
    .reverse();
  const extendedMethod: ExtendedMethodMetadata = {
    ...method,
    makeVoid: calculatedDatatype === "void",
    stringReturnType: calculatedDatatype,
    parameters,
    paramArgs,
    description: method.description ?? "",
  };

  const commonMethod = ejs.render(METHOD_TEMPLATE, {
    module,
    method: extendedMethod,
    paramNames,
    paramArgs,
    utils: RENDER_UTILS,
  }) as string;

  const _extendedMethod = ejs.render(EXTENDED_METHOD_TEMPLATE, {
    module,
    method: extendedMethod,
    paramNames,
    paramArgs,
    utils: RENDER_UTILS,
  }) as string;

  return commonMethod + "\n\n" + _extendedMethod;
}

export function moduleCompiler(
  module: ModuleMetadata,
  context: CompilationContext,
) {
  return compileClass(
    module.name,
    module.constructor,
    module.members,
    module.methods,
    context
  );
}

export function modCompiler(
  files: string[],
  _options: CompilerOptions,
) {
  return ejs.render(MOD_TEMPLATE, { files }) as string;
}

function enumsCompiler(
  enums: EnumMetadata[],
  options: CompilerOptions,
  compilerOptions: SmallCompilerOptions,
) {
  const { path = `${Deno.cwd()}/small-sdk` } = options.sdkOptions ?? {};
  const enumsPath = `${path}/enums`;
  const enumsMod: string[] = [];

  for (const _enum of enums) {
    const { name: enumName } = _enum;
    const enumFileName = toFilename(enumName, "enum");
    const enumFullPath = `${enumsPath}/${enumFileName}`;
    const compilationContext: CompilationContext = {
      imports: [],
      compilerOptions,
      options,
    };

    writeFile(
      enumFullPath,
      enumCompiler(_enum, compilationContext),
    );
    enumsMod.push(enumFileName);
  }

  writeFile(`${enumsPath}/mod.ts`, modCompiler(enumsMod, options));
}

function structuresCompiler(
  structures: StructureMetadata[],
  options: CompilerOptions,
  compilerOptions: SmallCompilerOptions,
  structuresPath: string,
) {
  const structuresMod: string[] = [];

  for (const structure of structures) {
    const { name: structureName, constructor: structureConstructor } =
      structure;

    /** If the structure is a module, then ignore it. */
    if (
      options.metadata.modules.find((m) =>
        m.constructor === structureConstructor
      )
    ) {
      continue;
    }

    const compilationContext: CompilationContext = {
      imports: [],
      options,
      compilerOptions,
    };

    const structureFileName = toFilename(structureName, "structure");

    writeFile(
      `${structuresPath}/${structureFileName}`,
      structureCompiler(structure, compilationContext),
    );
    structuresMod.push(structureFileName);
  }

  writeFile(`${structuresPath}/mod.ts`, modCompiler(structuresMod, options));
}

function modulesCompiler(
  modules: ModuleMetadata[],
  options: CompilerOptions,
  compilerOptions: SmallCompilerOptions,
  modulesPath: string,
) {
  const modulesMod: string[] = [];

  for (const module of modules) {
    const { name: moduleName } = module;
    const moduleFileName = toFilename(moduleName, "module");

    const compilationContext: CompilationContext = {
      imports: [],
      options,
      compilerOptions,
    };

    writeFile(
      `${modulesPath}/${moduleFileName}`,
      moduleCompiler(module, compilationContext),
    );
    modulesMod.push(moduleFileName);
  }

  writeFile(`${modulesPath}/mod.ts`, modCompiler(modulesMod, options));
}

function denoJsonCompiler(
  options: CompilerOptions,
  compilerOptions: SmallCompilerOptions,
  mainPath: string,
) {
  const imports = compilerOptions?.imports ?? {};
  const {
    name: packageName = `tinyrpc-sdk-${randomString()}`,
    version: packageVersion = "0.1.0",
  } = options.sdkOptions ?? {};
  const denoJson = ejs.render(DENO_JSON_TEMPLATE, {
    project: {
      name: packageName,
      version: packageVersion,
      imports: { ...currentDenoJson.defaultSdkImports, ...imports },
    },
  }) as string;

  writeFile(`${mainPath}/deno.json`, denoJson);
}

function exportAll(
  options: CompilerOptions,
  _compilerOptions: SmallCompilerOptions,
  mainPath: string,
) {
  const allFiles = ["structures/mod.ts", "modules/mod.ts", "enums/mod.ts"];
  const finalConfiguration = `
import { configSdk } from "@tinyrpc/sdk-core";

configSdk({
  host: "${options.server?.hostname ?? "[::1]"}:${options.server?.port ?? 8080
    }",
  https: ${options.server?.port === 443},
  deserializers: [],
  serializers: []
});
`.trim();

  writeFile(
    `${mainPath}/mod.ts`,
    modCompiler(allFiles, options) + finalConfiguration,
  );
}



export function compilePackage(
  options: CompilerOptions,
  config: SmallCompilerOptions,
) {
  const { structures, modules, enums } = options.metadata;
  const { path = `${Deno.cwd()}/small-sdk` } = options.sdkOptions ?? {};
  const modulesPath = `${path}/modules`;
  const structuresPath = `${path}/structures`;
  const enumsPath = `${path}/enums`;

  createPackageFolder(path);
  createPackageFolder(structuresPath);
  createPackageFolder(modulesPath);
  createPackageFolder(enumsPath);

  enumsCompiler(enums, options, config);
  structuresCompiler(structures, options, config, structuresPath);
  modulesCompiler(modules, options, config, modulesPath);
  denoJsonCompiler(options, config, path);
  exportAll(options, config, path);

  formatFolder(path);
}
