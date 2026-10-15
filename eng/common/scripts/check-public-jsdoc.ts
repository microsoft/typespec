import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import ts from "typescript";
import { repoRoot } from "./utils/common.ts";

// These are client emitters, not the shared http-client library or emitter-framework.
const excludedPackages = new Set([
  "@typespec/http-client-csharp",
  "@typespec/http-client-java",
  "@typespec/http-client-js",
  "@typespec/http-client-python",
]);
const baselineFile = join(repoRoot, "eng/common/config/public-jsdoc-baseline.json");
const args = process.argv.slice(2);
if (args.some((arg) => !["--prune", "--update-baseline"].includes(arg)) || args.length > 1) {
  throw new Error(
    "Usage: node eng/common/scripts/check-public-jsdoc.ts [--prune|--update-baseline]",
  );
}

interface Manifest {
  name: string;
  private?: boolean;
  main?: string;
  types?: string;
  exports?: ExportTarget | Record<string, ExportTarget>;
}
type ExportTarget = string | null | ExportTarget[] | { [condition: string]: ExportTarget };
interface Package {
  dir: string;
  manifest: Manifest;
  config: ts.ParsedCommandLine;
  entries: Map<string, string[]>;
}

// Packaging defects are deliberately visible, rather than counted as documentation-complete.
// Pin exceptions to the exact manifest target so a packaging fix automatically invalidates them.
const unavailableEntries = new Map([
  [
    "@typespec/tspd:.:./dist/src/index.js",
    "No root source/index artifact; CLI and ref-doc are separate.",
  ],
  ["@typespec/protobuf:./testing:./dist/src/testing/index.js", "No testing entry source exists."],
  ["@typespec/http-specs:.:dist/index.js", "Scenario/data package with no root JavaScript module."],
]);
const sourceOverrides = new Map([
  [
    "@typespec/compiler:./module-resolver:./dist/module-resolver/index.d.ts",
    "src/module-resolver/index.ts",
  ],
  ["@typespec/prettier-plugin-typespec:.:dist/index.js", "src/index.mjs"],
  ["@typespec/html-program-viewer:.:./dist/emitter/index.js", "src/index.ts"],
]);
const usedExceptions = new Set<string>();
const packages: Package[] = [];
const errors = new Set<string>();
const missing = new Set<string>();
let entryCount = 0;
let itemCount = 0;

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

function targets(target: ExportTarget): string[] {
  if (target === null) return [];
  if (typeof target === "string") return [target];
  return (Array.isArray(target) ? target : Object.values(target)).flatMap(targets);
}

function isJavaScript(file: string): boolean {
  return /\.(?:[cm]?js|[cm]?tsx?)$/.test(file);
}

function comparablePath(file: string): string {
  const normalized = resolve(file).replace(/\\/g, "/").replace(/\/$/, "");
  return ts.sys.useCaseSensitiveFileNames ? normalized : normalized.toLowerCase();
}

function containsPath(parent: string, file: string): boolean {
  return comparablePath(file).startsWith(`${comparablePath(parent)}/`);
}

function loadPackage(dir: string, manifest: Manifest): Package {
  const configPath =
    ["tsconfig.build.json", "tsconfig.json"].map((name) => join(dir, name)).find(existsSync) ??
    join(repoRoot, "tsconfig.base.json");
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configFile.error)
    throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, "\n"));
  const config = ts.parseJsonConfigFileContent(
    configPath === join(repoRoot, "tsconfig.base.json")
      ? { ...configFile.config, files: [] }
      : configFile.config,
    ts.sys,
    dirname(configPath),
    undefined,
    configPath,
  );
  for (const diagnostic of config.errors) {
    if (![18002, 18003].includes(diagnostic.code)) {
      throw new Error(
        `${manifest.name}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`,
      );
    }
  }
  const exports = manifest.exports;
  const entries = new Map<string, string[]>();
  if (
    exports &&
    typeof exports === "object" &&
    !Array.isArray(exports) &&
    Object.keys(exports).some((x) => x.startsWith("."))
  ) {
    for (const [name, target] of Object.entries(exports)) entries.set(name, targets(target));
  } else {
    entries.set(
      ".",
      exports !== undefined
        ? targets(exports)
        : [manifest.types, manifest.main ?? (manifest.types ? undefined : "index.js")].filter(
            (x): x is string => !!x,
          ),
    );
  }
  return { dir, manifest, config, entries };
}

for (const directory of readdirSync(join(repoRoot, "packages")).sort()) {
  const dir = join(repoRoot, "packages", directory);
  const file = join(dir, "package.json");
  if (!existsSync(file)) continue;
  const manifest = readJson<Manifest>(file);
  if (manifest.private || excludedPackages.has(manifest.name)) continue;
  packages.push(loadPackage(dir, manifest));
}

function sourceFor(pkg: Package, route: string, target: string): string | undefined {
  const key = `${pkg.manifest.name}:${route}:${target}`;
  const override = sourceOverrides.get(key);
  if (override) {
    usedExceptions.add(key);
    const file = join(pkg.dir, override);
    if (!existsSync(file)) throw new Error(`${key}: source override is missing: ${override}`);
    return file;
  }
  const output = resolve(pkg.dir, target);
  const outDir = resolve(pkg.config.options.outDir ?? join(pkg.dir, "dist"));
  const stem = relative(outDir, output).replace(/(?:\.d)?\.[cm]?[jt]sx?$/, "");
  const stems = containsPath(outDir, output)
    ? [
        resolve(pkg.config.options.rootDir ?? pkg.dir, stem),
        join(pkg.dir, stem),
        join(pkg.dir, "src", stem),
      ]
    : [output.replace(/(?:\.d)?\.[cm]?[jt]sx?$/, "")];
  const candidates = [
    ...new Map(
      stems.flatMap((stem) =>
        [".ts", ".tsx", ".mts", ".cts", ".mjs", ".js", ".d.ts", ".d.mts", ".d.cts"].map(
          (ext) => [comparablePath(stem + ext), stem + ext] as const,
        ),
      ),
    ).values(),
  ].filter(existsSync);
  // A declaration and its implementation are one source, not competing entry points.
  const implementations = candidates.filter((x) => !/\.d\.[cm]?ts$/.test(x));
  const choices = implementations.length ? implementations : candidates;
  if (unavailableEntries.has(key)) {
    if (choices.length || existsSync(output)) {
      throw new Error(
        `${key}: previously unavailable entry now exists; remove its exclusion and map its API.`,
      );
    }
    usedExceptions.add(key);
    return undefined;
  }
  if (choices.length !== 1) {
    throw new Error(
      `${key}: expected one source mapping, got ${choices.length}: ${choices.join(", ")}`,
    );
  }
  return choices[0];
}

const sourceEntries = new Map<Package, Map<string, string[]>>();
for (const pkg of packages) {
  const entries = new Map<string, string[]>();
  for (const [route, allTargets] of pkg.entries) {
    if (route.split("/").includes("internals")) continue;
    if (route.includes("*") || allTargets.some((x) => x.includes("*"))) {
      throw new Error(
        `${pkg.manifest.name}:${route}: wildcard exports need an explicit source mapping.`,
      );
    }
    for (const target of allTargets) {
      if (!isJavaScript(target) && !/\.(?:json|css|tsp)$/.test(target)) {
        throw new Error(`${pkg.manifest.name}:${route}: unrecognized export target ${target}`);
      }
    }
    const files = allTargets
      .filter(isJavaScript)
      .map((target) => sourceFor(pkg, route, target))
      .filter((x): x is string => !!x);
    if (files.length) entries.set(route, [...new Set(files)]);
    else if (allTargets.some(isJavaScript)) {
      console.log(`Excluded unavailable entry: ${pkg.manifest.name}:${route}`);
    }
    // JSON, CSS and TypeSpec assets have no JavaScript API.
  }
  sourceEntries.set(pkg, entries);
}

function localFile(pkg: Package, file: string): boolean {
  return (
    containsPath(pkg.dir, file) &&
    !comparablePath(file)
      .slice(comparablePath(pkg.dir).length + 1)
      .split("/")
      .includes("node_modules")
  );
}

for (const pkg of packages) {
  for (const [route, files] of sourceEntries.get(pkg)!) {
    // Isolate each conditional implementation too: unrelated typekit augmentations must not
    // become visible simply because another package/subpath was also being checked.
    for (const entry of files) {
      entryCount++;
      inspectEntry(pkg, route, entry);
    }
  }
}

for (const key of [...unavailableEntries.keys(), ...sourceOverrides.keys()]) {
  if (!usedExceptions.has(key)) errors.add(`Stale entry point exception: ${key}`);
}

if (errors.size) {
  console.error([...errors].sort().join("\n"));
  process.exit(1);
}
const current = [...missing].sort();
if (args.includes("--update-baseline")) {
  writeFileSync(baselineFile, JSON.stringify(current, null, 2) + "\n");
  console.log(
    `Recorded ${current.length} existing undocumented identities. Review every added identity.`,
  );
} else {
  const baseline = readJson<string[]>(baselineFile);
  const known = new Set(baseline);
  const added = current.filter((id) => !known.has(id));
  if (added.length) {
    console.error(`New undocumented public APIs (${added.length}):\n${added.join("\n")}`);
    process.exit(1);
  }
  const retained = baseline.filter((id) => missing.has(id)).sort();
  if (args.includes("--prune")) {
    writeFileSync(baselineFile, JSON.stringify(retained, null, 2) + "\n");
  } else if (retained.length !== baseline.length) {
    console.error(
      "Resolved public JSDoc debt: run pnpm check:public-jsdoc --prune and commit the smaller baseline.",
    );
    process.exit(1);
  }
}
console.log(
  `Checked ${packages.length} packages, ${entryCount} isolated entry points, ${itemCount} documentation checks; ${current.length} existing gap identities.`,
);

function inspectEntry(pkg: Package, route: string, entry: string) {
  const options: ts.CompilerOptions = {
    ...pkg.config.options,
    noEmit: true,
    allowJs: true,
    checkJs: false,
  };
  const host = ts.createCompilerHost(options);
  const defaultResolve = ts.resolveModuleName;
  host.resolveModuleNameLiterals = (
    names,
    containingFile,
    redirectedReference,
    _options,
    sourceFile,
  ) =>
    names.map((literal) => {
      const name = literal.text;
      // Resolve workspace imports against THIS checkout, not a possibly stale build or a
      // symlinked dependency installation in another worktree.
      const dependency = packages.find(
        (p) => name === p.manifest.name || name.startsWith(`${p.manifest.name}/`),
      );
      if (dependency) {
        const subpath =
          name === dependency.manifest.name
            ? "."
            : `.${name.slice(dependency.manifest.name.length)}`;
        const target = dependency.entries.get(subpath)?.find(isJavaScript);
        if (target) {
          const file = sourceFor(dependency, subpath, target);
          if (file)
            return {
              resolvedModule: { resolvedFileName: file, extension: extname(file) as ts.Extension },
            };
        }
      }
      return defaultResolve(
        name,
        containingFile,
        options,
        host,
        undefined,
        redirectedReference,
        ts.getModeForUsageLocation(sourceFile, literal, options),
      );
    });
  const ambient = pkg.config.fileNames.filter((x) => x.endsWith(".d.ts") && localFile(pkg, x));
  // Vite's worker/CSS imports are build assets, not unresolved JavaScript APIs.
  if (existsSync(join(pkg.dir, "vite.config.ts"))) {
    const vite = ts.resolveTypeReferenceDirective(
      "vite/client",
      join(pkg.dir, "tsconfig.json"),
      options,
      host,
    ).resolvedTypeReferenceDirective;
    if (!vite?.resolvedFileName)
      throw new Error(`${pkg.manifest.name}: cannot resolve Vite's asset declarations`);
    ambient.push(vite.resolvedFileName);
  }
  const program = ts.createProgram([entry, ...ambient], options, host);
  const checker = program.getTypeChecker();
  const file = program.getSourceFile(entry);
  const module = file && checker.getSymbolAtLocation(file);
  if (!module) {
    errors.add(
      `${pkg.manifest.name}:${route}: cannot resolve entry module ${relative(repoRoot, entry)}`,
    );
    return;
  }
  // Other type errors belong to the build. Missing imports, however, can erase the API
  // graph into `any`, so this check must never silently accept them.
  const diagnostics = [
    ...program.getOptionsDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...program
      .getSourceFiles()
      .filter((file) => localFile(pkg, file.fileName))
      .flatMap((file) => program.getSemanticDiagnostics(file)),
  ];
  for (const diagnostic of diagnostics) {
    if ([2304, 2305, 2307, 2318, 2503, 2688, 2694, 2792, 6053, 7016].includes(diagnostic.code)) {
      errors.add(
        `${diagnostic.file ? relative(repoRoot, diagnostic.file.fileName) : pkg.manifest.name}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`,
      );
    }
  }
  const seenTypes = new Set<ts.Type>();
  const seenSymbols = new Set<ts.Symbol>();
  const checkedNamedDeclarations = new Set<ts.Symbol>();
  const seenNamedInstances = new Map<ts.Symbol, Set<string>>();
  const cacheIds = new Map<object, number>();
  let typeDepth = 0;
  const docsInProgress = new Set<ts.Symbol>();
  const prefix = `${pkg.manifest.name}|${route}|`;
  let context = entry;

  function unalias(symbol: ts.Symbol): ts.Symbol {
    return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  }
  function declarations(symbol: ts.Symbol): readonly ts.Declaration[] {
    return symbol.getDeclarations() ?? [];
  }
  function cacheId(value: object): number {
    let id = cacheIds.get(value);
    if (id === undefined) cacheIds.set(value, (id = cacheIds.size));
    return id;
  }
  function argumentKey(type: ts.Type, active = new Set<ts.Type>()): string {
    // Generic methods recreate bound parameters. Canonicalize those by declaration
    // and bounds, without treating alias arguments as additional public types.
    const symbol = type.aliasSymbol ?? type.getSymbol();
    const owner = symbol ? cacheId(declarations(symbol)[0] ?? symbol) : cacheId(type);
    if (active.has(type)) return `recursive:${owner}`;
    active.add(type);
    try {
      if (type.flags & ts.TypeFlags.TypeParameter) {
        const constraint = checker.getBaseConstraintOfType(type);
        const defaultType = (type as ts.TypeParameter).getDefault();
        return `parameter:${owner}:${constraint ? argumentKey(constraint, active) : ""}:${defaultType ? argumentKey(defaultType, active) : ""}`;
      }
      const arguments_ =
        type.aliasTypeArguments ??
        (type.flags & ts.TypeFlags.Object &&
        (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference
          ? checker.getTypeArguments(type as ts.TypeReference)
          : undefined);
      if (arguments_)
        return `${owner}<${arguments_.map((arg) => argumentKey(arg, active)).join(",")}>`;
      return `type:${cacheId(type)}`;
    } finally {
      active.delete(type);
    }
  }
  function excludedDeclaration(decl: ts.Declaration): boolean {
    for (let node: ts.Node | undefined = decl; node && !ts.isSourceFile(node); node = node.parent) {
      if (
        ts
          .getJSDocTags(node)
          .some((tag) => ["internal", "private", "hidden"].includes(tag.tagName.text))
      )
        return true;
      if (
        ts.canHaveModifiers(node) &&
        ts
          .getModifiers(node)
          ?.some(
            (m) =>
              m.kind === ts.SyntaxKind.PrivateKeyword || m.kind === ts.SyntaxKind.ProtectedKeyword,
          )
      )
        return true;
      if ("name" in node && node.name && ts.isPrivateIdentifier(node.name as ts.Node)) return true;
    }
    return false;
  }
  function excluded(symbol: ts.Symbol): boolean {
    return declarations(symbol).some(excludedDeclaration);
  }
  function owned(symbol: ts.Symbol): boolean {
    return declarations(symbol).some((decl) =>
      packages.some((owner) => localFile(owner, decl.getSourceFile().fileName)),
    );
  }
  function identity(symbol: ts.Symbol): string {
    const decl = declarations(symbol)[0];
    if (!decl) throw new Error(`No declaration for exposed symbol ${symbol.name}`);
    const declaredName =
      "name" in decl && decl.name ? (decl.name as ts.Node).getText() : symbol.name;
    const names = [ts.isSourceFile(decl) ? "(module)" : declaredName];
    for (let node = decl.parent; node && !ts.isSourceFile(node); node = node.parent) {
      if ("name" in node && node.name && typeof (node.name as ts.Node).getText === "function")
        names.unshift((node.name as ts.Node).getText());
    }
    const owner = packages.find((p) => localFile(p, decl.getSourceFile().fileName));
    const source = relative(owner?.dir ?? pkg.dir, decl.getSourceFile().fileName)
      .split(sep)
      .join("/")
      .replace(/\.[cm]?tsx?$/, "");
    return `${source}#${names.join(".")}`;
  }
  function hasDocs(symbol: ts.Symbol): boolean {
    if (docsInProgress.has(symbol)) return false;
    docsInProgress.add(symbol);
    try {
      const summary = ts
        .displayPartsToString(symbol.getDocumentationComment(checker))
        .replace(/\{@inherit[Dd]oc\b[^}]*\}/g, "")
        .trim();
      if (summary) return true;
      for (const decl of declarations(symbol)) {
        const text = ts
          .getJSDocCommentsAndTags(decl)
          .map((doc) => doc.getText())
          .join("\n");
        const link = text.match(/(?:\{@inherit[Dd]oc|@inherit[Dd]oc)\s+([\w$.]+)/)?.[1];
        if (link) {
          const [head, ...parts] = link.split(".");
          let linked = checker.resolveName(
            head,
            decl,
            ts.SymbolFlags.Type | ts.SymbolFlags.Value | ts.SymbolFlags.Namespace,
            false,
          );
          if (linked) {
            linked = unalias(linked);
            for (const part of parts) {
              linked = checker.getPropertyOfType(checker.getDeclaredTypeOfSymbol(linked), part);
              if (!linked) break;
            }
            if (linked && hasDocs(linked)) return true;
          }
        }
        const owner = decl.parent;
        if (
          owner &&
          (ts.isClassDeclaration(owner) || ts.isInterfaceDeclaration(owner)) &&
          owner.name
        ) {
          const ownerType = checker.getTypeAtLocation(owner) as ts.InterfaceType;
          for (const base of checker.getBaseTypes(ownerType) ?? []) {
            const inherited = checker.getPropertyOfType(base, symbol.name);
            if (inherited && hasDocs(inherited)) return true;
          }
        }
      }
      return false;
    } finally {
      docsInProgress.delete(symbol);
    }
  }
  function isUtilityFilterMember(symbol: ts.Symbol): boolean {
    return declarations(symbol).some((decl) => {
      for (let node: ts.Node = decl; node.parent; node = node.parent) {
        const parent = node.parent;
        if (ts.isTypeReferenceNode(parent) && parent.typeArguments?.[1] === node) {
          const reference = checker.getSymbolAtLocation(parent.typeName);
          const target = reference && unalias(reference);
          if (
            target &&
            ["Extract", "Exclude"].includes(target.name) &&
            declarations(target).some((d) =>
              program.isSourceFileDefaultLibrary(d.getSourceFile()),
            ) &&
            ts.isTypeLiteralNode(node) &&
            decl.parent === node &&
            parent.typeArguments[0]
          ) {
            const existing = checker.getPropertyOfType(
              checker.getTypeFromTypeNode(parent.typeArguments[0]),
              symbol.name,
            );
            if (existing && declarations(existing).some((d) => d !== decl)) return true;
          }
        }
      }
      return false;
    });
  }
  function record(symbol: ts.Symbol, id = identity(symbol)) {
    itemCount++;
    const decl = declarations(symbol)[0];
    const foreign =
      decl && packages.find((p) => p !== pkg && localFile(p, decl.getSourceFile().fileName));
    const key =
      foreign && !id.startsWith("export:")
        ? `${foreign.manifest.name}|(exposed type)|${id}`
        : prefix + id;
    // Conditional narrowing can synthesize intersections with an Extract/Exclude
    // filter. Its fields constrain existing members; they are not new API members.
    if (!isUtilityFilterMember(symbol) && !hasDocs(symbol)) missing.add(key);
  }
  function visitSymbol(input: ts.Symbol, exportedName?: string) {
    const symbol = unalias(input);
    if (excluded(input) || excluded(symbol)) return;
    if (!declarations(symbol).length) {
      errors.add(
        `${prefix}${exportedName ?? input.name}: exposed symbol has no resolvable declaration`,
      );
      return;
    }
    if (!owned(symbol)) {
      if (exportedName && owned(input)) {
        itemCount++;
        if (!hasDocs(input) && !hasDocs(symbol)) missing.add(`${prefix}export:${exportedName}`);
      }
      return;
    }
    if (exportedName) record(symbol, `export:${exportedName}`);
    if (seenSymbols.has(symbol)) return;
    seenSymbols.add(symbol);
    if (!exportedName) record(symbol);
    if (symbol.flags & ts.SymbolFlags.Module) {
      for (const child of checker.getExportsOfModule(symbol)) visitSymbol(child);
    } else {
      if (symbol.flags & ts.SymbolFlags.Type) visitType(checker.getDeclaredTypeOfSymbol(symbol));
      if (symbol.flags & ts.SymbolFlags.Value) {
        visitType(checker.getTypeOfSymbolAtLocation(symbol, declarations(symbol)[0]));
      }
    }
  }
  function visitType(type: ts.Type) {
    if (seenTypes.has(type)) return;
    if (typeDepth >= 200) {
      errors.add(`${prefix}public type graph exceeds supported nesting: ${context}`);
      return;
    }
    seenTypes.add(type);
    typeDepth++;
    try {
      visitResolvedType(type);
    } finally {
      typeDepth--;
    }
  }
  function visitResolvedType(type: ts.Type) {
    if ((type as ts.Type & { intrinsicName?: string }).intrinsicName === "error") {
      errors.add(`${prefix}unresolved type in public signature: ${context}`);
      return;
    }
    if (type.flags & ts.TypeFlags.TypeParameter) {
      const constraint = checker.getBaseConstraintOfType(type);
      if (constraint) visitType(constraint);
      const defaultType = (type as ts.TypeParameter).getDefault();
      if (defaultType) visitType(defaultType);
      return;
    }
    const named = type.aliasSymbol ?? type.getSymbol();
    if (named && excluded(named)) return;
    inspectType(type, named);
  }
  function inspectType(type: ts.Type, named: ts.Symbol | undefined) {
    const local = named && owned(named);
    const meaningfulName =
      named &&
      declarations(named).some((decl) => "name" in decl && !!decl.name) &&
      !declarations(named).some(ts.isSourceFile);
    if (local && meaningfulName) {
      const key = argumentKey(type);
      let instances = seenNamedInstances.get(named);
      if (instances?.has(key)) return;
      if (!instances) seenNamedInstances.set(named, (instances = new Set()));
      instances.add(key);
    }
    // Follow real generic container elements (Map<K,V>, Promise<T>, arrays, etc.),
    // not syntactic alias arguments such as the hidden keys in Omit<Helper, "hidden">.
    if (
      type.flags & ts.TypeFlags.Object &&
      (type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference
    ) {
      for (const argument of checker.getTypeArguments(type as ts.TypeReference))
        visitType(argument);
    }
    // Documentation and declaration metadata are shared, but each concrete type
    // instance can expose different members, signatures or conditional results.
    if (local && meaningfulName && !checkedNamedDeclarations.has(named)) {
      checkedNamedDeclarations.add(named);
      if (named.flags & ts.SymbolFlags.Type) {
        record(named);
      }
      if (named.flags & (ts.SymbolFlags.Class | ts.SymbolFlags.Interface)) {
        for (const base of checker.getBaseTypes(
          checker.getDeclaredTypeOfSymbol(named) as ts.InterfaceType,
        ) ?? [])
          visitType(base);
      }
      for (const decl of declarations(named)) {
        if ("typeParameters" in decl) {
          for (const parameter of (decl.typeParameters as
            ts.NodeArray<ts.TypeParameterDeclaration> | undefined) ?? []) {
            visitType(checker.getTypeAtLocation(parameter));
          }
        }
      }
    }
    if (type.isUnionOrIntersection()) {
      for (const part of type.types) visitType(part);
    }
    if (type.flags & ts.TypeFlags.Conditional) {
      const conditional = type as ts.ConditionalType;
      visitType(
        conditional.resolvedTrueType ?? checker.getTypeFromTypeNode(conditional.root.node.trueType),
      );
      visitType(
        conditional.resolvedFalseType ??
          checker.getTypeFromTypeNode(conditional.root.node.falseType),
      );
    }
    const structuralAlias =
      !!type.aliasSymbol &&
      !!(type.flags & ts.TypeFlags.Object) &&
      !!((type as ts.ObjectType).objectFlags & (ts.ObjectFlags.Mapped | ts.ObjectFlags.Anonymous));
    if (named && !local && meaningfulName && !structuralAlias) return;
    for (const property of checker.getPropertiesOfType(type)) {
      if (excluded(property) || (!owned(property) && !structuralAlias)) continue;
      const decl = declarations(property)[0];
      if (!decl) continue;
      if (owned(property) && !seenSymbols.has(property)) {
        seenSymbols.add(property);
        record(property);
      }
      context = identity(property);
      visitType(checker.getTypeOfSymbolAtLocation(property, decl));
    }
    for (const kind of [ts.SignatureKind.Call, ts.SignatureKind.Construct]) {
      const signatures = checker.getSignaturesOfType(type, kind);
      for (const signature of signatures) {
        const decl = signature.getDeclaration();
        if (!decl || excludedDeclaration(decl)) continue;
        for (const parameter of signature.getParameters()) {
          const parameterDecl = parameter.valueDeclaration ?? decl;
          context = `${relative(pkg.dir, decl.getSourceFile().fileName)}:parameter:${parameter.name}`;
          visitType(checker.getTypeOfSymbolAtLocation(parameter, parameterDecl));
        }
        if (signature.thisParameter) {
          visitType(checker.getTypeOfSymbolAtLocation(signature.thisParameter, decl));
        }
        context = `${relative(pkg.dir, decl.getSourceFile().fileName)}:return:${decl.getText().slice(0, 100)}`;
        visitType(signature.getReturnType());
        const predicate = checker.getTypePredicateOfSignature(signature);
        if (predicate?.type) visitType(predicate.type);
        for (const parameter of signature.typeParameters ?? []) {
          const constraint = checker.getBaseConstraintOfType(parameter);
          if (constraint) visitType(constraint);
          const defaultType = parameter.getDefault();
          if (defaultType) visitType(defaultType);
        }
      }
    }
    for (const index of checker.getIndexInfosOfType(type)) {
      if (index.declaration && excludedDeclaration(index.declaration)) continue;
      visitType(index.keyType);
      visitType(index.type);
    }
  }

  for (const symbol of checker.getExportsOfModule(module)) visitSymbol(symbol, symbol.name);
  for (const source of program
    .getSourceFiles()
    .filter((source) => localFile(pkg, source.fileName))) {
    function visitAugmentations(node: ts.Node) {
      if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name)) {
        const augmented = checker.getSymbolAtLocation(node.name);
        if (augmented) {
          for (const symbol of checker.getExportsOfModule(augmented)) {
            if (declarations(symbol).some((decl) => localFile(pkg, decl.getSourceFile().fileName)))
              visitSymbol(symbol);
          }
        }
      } else {
        ts.forEachChild(node, visitAugmentations);
      }
    }
    visitAugmentations(source);
  }
}
