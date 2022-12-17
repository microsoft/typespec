import { isTemplateDeclaration, Model, Namespace, Program, Type } from "@cadl-lang/compiler";
import { CodeBuilder, Placeholder } from "./code-builder.js";
import { CustomKeyMap } from "./custom-key-map.js";
import { TypeEmitter } from "./type-emitter.js";
import {
  AssetEmitter,
  AssetTagFactory,
  AssetTagInstance,
  CadlDeclaration,
  ContextState,
  Declaration,
  EmitContext,
  EmitEntity,
  EmitterState,
  NamespaceScope,
  RawCode,
  Scope,
  SourceFile,
  SourceFileScope,
} from "./types.js";

type EndingWith<Names, Name extends string> = Names extends `${infer _X}${Name}` ? Names : never;

export function createEmitterContext(program: Program): EmitContext {
  return {
    program,
    AssetTag: {
      create(key) {
        return createAssetTagFactory(key);
      },
      language: createAssetTagFactory("language"),
    },
    createAssetEmitter(
      TypeEmitterClass: typeof TypeEmitter,
      ...tags: AssetTagInstance[]
    ): AssetEmitter {
      const sourceFiles: SourceFile[] = [];
      const typeId = CustomKeyMap.objectKeyer();
      const contextId = CustomKeyMap.objectKeyer();
      const typeToEmitEntity = new CustomKeyMap<[string, Type, ContextState], EmitEntity>(
        ([method, type, context]) => {
          return `${method}-${typeId.getKey(type)}-${contextId.getKey(context)}`;
        }
      );
      const waitingCircularRefs = new CustomKeyMap<
        [string, Type, ContextState],
        {
          state: EmitterState;
          cb: (entity: EmitEntity) => EmitEntity;
        }[]
      >(([method, type]) => {
        return `${method}-${typeId.getKey(type)}`;
      });
      const knownContexts = new CustomKeyMap<[Type, ContextState], ContextState>(
        ([type, context]) => {
          return `${typeId.getKey(type)}-${contextId.getKey(context)}`;
        }
      );
      let lexicalTypeStack: Type[] = [];
      let context: ContextState = {
        lexicalContext: {},
        referenceContext: {},
      };
      let programContext: ContextState | null = null;
      let incomingReferenceContext: Record<string, string> | null = null;
      const interner = createInterner();

      const assetEmitter: AssetEmitter = {
        getContext() {
          return {
            ...context.lexicalContext,
            ...context.referenceContext,
          };
        },
        getProgram() {
          return program;
        },
        result: {
          declaration(name, code) {
            const scope = currentScope();
            if (!scope) {
              throw new Error(
                "There is no current scope for this declaration, ensure the current context has a scope."
              );
            }

            const entity: Declaration = {
              kind: "declaration",
              scope,
              name,
              code,
            };

            if (code instanceof CodeBuilder) {
              code.onComplete((value) => (entity.code = value));
            }
            return entity;
          },
          rawCode(code) {
            const entity: RawCode = {
              kind: "code",
              code,
            };

            if (code instanceof CodeBuilder) {
              code.onComplete((value) => (entity.code = value));
            }

            return {
              kind: "code",
              code,
            };
          },
          none() {
            return {
              kind: "none",
              code: "",
            };
          },
        },
        createScope(block, name, parentScope: Scope | null = null) {
          let newScope: Scope;
          if ("imports" in block) {
            // create source file scope
            newScope = {
              kind: "sourceFile",
              name,
              sourceFile: block,
              parentScope,
              childScopes: [],
              declarations: [],
            } as SourceFileScope;
          } else {
            newScope = {
              kind: "namespace",
              name,
              namespace: block,
              childScopes: [],
              declarations: [],
              parentScope,
            } as NamespaceScope;
          }

          parentScope?.childScopes.push(newScope);
          return newScope as any; // todo: fix?
        },

        createSourceFile(path): SourceFile {
          const sourceFile = {
            globalScope: undefined as any,
            path,
            imports: new Map(),
          };
          sourceFile.globalScope = this.createScope(sourceFile, "");
          sourceFiles.push(sourceFile);
          return sourceFile;
        },

        emitTypeReference(target): EmitEntity {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const _this = this;

          if (target.kind === "ModelProperty") {
            return invokeTypeEmitter("modelPropertyReference", target);
          }

          incomingReferenceContext = context.referenceContext ?? null;

          const entity = this.emitType(target);

          let placeholder: Placeholder | null = null;

          if (entity.kind === "circular") {
            let waiting = waitingCircularRefs.get(entity.emitEntityKey);
            if (!waiting) {
              waiting = [];
              waitingCircularRefs.set(entity.emitEntityKey, waiting);
            }

            waiting.push({
              state: {
                lexicalTypeStack,
                context,
              },
              cb: invokeReference,
            });
            const builder = new CodeBuilder();
            placeholder = new Placeholder();
            builder.push(placeholder);
            return this.result.rawCode(builder);
          }

          return invokeReference(entity);

          function invokeReference(entity: EmitEntity): EmitEntity {
            if (entity.kind !== "declaration") {
              return entity;
            }

            const scope = currentScope();
            if (!scope) {
              throw new Error(
                "Can't generate a type reference without a current scope, ensure the current context has a scope"
              );
            }

            const targetScope = entity.scope;
            const targetChain = scopeChain(targetScope);
            const currentChain = scopeChain(scope);
            let diffStart = 0;
            while (
              targetChain[diffStart] &&
              currentChain[diffStart] &&
              targetChain[diffStart] === currentChain[diffStart]
            ) {
              diffStart++;
            }

            const pathUp: Scope[] = currentChain.slice(diffStart);
            const pathDown: Scope[] = targetChain.slice(diffStart);

            let ref = typeEmitter.reference(
              entity,
              pathUp,
              pathDown,
              targetChain[diffStart - 1] ?? null
            );

            if (typeof ref === "string" || ref instanceof CodeBuilder) {
              ref = _this.result.rawCode(ref);
            }

            if (placeholder) {
              if (ref.kind === "circular") {
                throw new Error("Circular resulted in circular?");
              }

              if (typeof ref.code !== "string") {
                // todo: maybe ok if this results in a code builder? But unlikely for references...
                throw new Error("still circular?");
              }

              placeholder.setValue(ref.code);
            }

            return ref;
          }

          function scopeChain(scope: Scope | null) {
            let chain = [];
            while (scope) {
              chain.unshift(scope);
              scope = scope.parentScope;
            }

            return chain;
          }
        },

        emitDeclarationName(type): string {
          return typeEmitter.declarationName!(type);
        },

        async writeOutput() {
          for (const file of sourceFiles) {
            const outputFile = typeEmitter.sourceFile(file);
            await program.host.writeFile(outputFile.path, outputFile.contents);
          }
        },

        emitType(type) {
          const key = typeEmitterKey(type);
          let args: any[];
          switch (key) {
            case "modelScalar":
            case "modelDeclaration":
            case "modelInstantiation":
            case "operationDeclaration":
            case "interfaceDeclaration":
            case "interfaceOperationDeclaration":
            case "enumDeclaration":
            case "unionDeclaration":
            case "unionInstantiation":
              const declarationName = typeEmitter.declarationName(type as Model);
              args = [declarationName];
              break;
            default:
              args = [];
          }

          const result = (invokeTypeEmitter as any)(key, type, ...args);

          return result;
        },

        emitProgram(options) {
          const namespace = program.getGlobalNamespaceType();
          if (options?.emitGlobalNamespace) {
            this.emitType(namespace);
            return;
          }

          for (const ns of namespace.namespaces.values()) {
            if (ns.name === "Cadl" && !options?.emitCadlNamespace) continue;
            this.emitType(ns);
          }

          for (const model of namespace.models.values()) {
            if (!isTemplateDeclaration(model)) {
              this.emitType(model);
            }
          }

          for (const operation of namespace.operations.values()) {
            if (!isTemplateDeclaration(operation)) {
              this.emitType(operation);
            }
          }

          for (const enumeration of namespace.enums.values()) {
            this.emitType(enumeration);
          }

          for (const union of namespace.unions.values()) {
            if (!isTemplateDeclaration(union)) {
              this.emitType(union);
            }
          }

          for (const iface of namespace.interfaces.values()) {
            if (!isTemplateDeclaration(iface)) {
              this.emitType(iface);
            }
          }
        },

        emitModelProperties(model) {
          const entity = typeEmitter.modelProperties(model);
          if (typeof entity === "string" || entity instanceof CodeBuilder) {
            return this.result.rawCode(entity);
          }

          return entity;
        },

        emitModelProperty(property) {
          return invokeTypeEmitter("modelPropertyLiteral", property);
        },

        emitOperationParameters(operation) {
          return invokeTypeEmitter("operationParameters", operation, operation.parameters);
        },

        emitOperationReturnType(operation) {
          return invokeTypeEmitter("operationReturnType", operation, operation.returnType);
        },

        emitInterfaceOperations(iface) {
          return invokeTypeEmitter("interfaceDeclarationOperations", iface);
        },

        emitInterfaceOperation(operation) {
          const name = typeEmitter.declarationName(operation);
          return invokeTypeEmitter("interfaceOperationDeclaration", operation, name);
        },

        emitEnumMembers(en) {
          return invokeTypeEmitter("enumMembers", en);
        },

        emitUnionVariants(union) {
          return invokeTypeEmitter("unionVariants", union);
        },

        emitTupleLiteralValues(tuple) {
          return invokeTypeEmitter("tupleLiteralValues", tuple);
        },
      };

      const typeEmitter = new TypeEmitterClass(assetEmitter);
      return assetEmitter;

      function invokeTypeEmitter<
        T extends keyof Omit<
          TypeEmitter,
          "sourceFile" | "declarationName" | "reference" | EndingWith<keyof TypeEmitter, "Context">
        >
      >(method: T, ...args: Parameters<TypeEmitter[T]>) {
        const type = args[0];
        let entity: EmitEntity;
        let emitEntityKey: [string, Type, ContextState];
        let cached = false;

        withTypeContext(type, () => {
          emitEntityKey = [method, type, context];
          const seenEmitEntity = typeToEmitEntity.get(emitEntityKey);

          if (seenEmitEntity) {
            entity = seenEmitEntity;
            cached = true;
            return;
          }

          typeToEmitEntity.set(emitEntityKey, {
            kind: "circular",
            emitEntityKey,
          });
          if (!typeEmitter[method]) {
            throw new Error("Type emitter doesn't have method " + method);
          }
          entity = (typeEmitter[method] as any)(...args);
          if (typeof entity === "string" || entity instanceof CodeBuilder) {
            entity = assetEmitter.result.rawCode(entity);
          }
        });

        if (cached) {
          return entity!;
        }

        typeToEmitEntity.set(emitEntityKey!, entity!);
        const waitingRefCbs = waitingCircularRefs.get(emitEntityKey!);
        if (waitingRefCbs) {
          for (const record of waitingRefCbs) {
            withContext(record.state, () => {
              record.cb(entity);
            });
          }
          waitingCircularRefs.set(emitEntityKey!, []);
        }

        if (entity!.kind === "declaration") {
          entity!.scope.declarations.push(entity!);
        }

        return entity!;
      }

      function setContextForType(type: Type) {
        let newTypeStack;

        if (isDeclaration(type)) {
          newTypeStack = [type];
          let ns = type.namespace;
          while (ns) {
            if (ns.name === "") break;
            newTypeStack.unshift(ns);
            ns = ns.namespace;
          }
        } else {
          newTypeStack = [...lexicalTypeStack, type];
        }

        lexicalTypeStack = newTypeStack;

        if (!programContext) {
          programContext = interner.intern({
            lexicalContext: typeEmitter.programContext(program),
            referenceContext: {},
          });
        }

        context = programContext;

        for (const contextChainEntry of lexicalTypeStack) {
          if (contextChainEntry === type && incomingReferenceContext) {
            context = interner.intern({
              lexicalContext: context.lexicalContext,
              referenceContext: interner.intern({
                ...context.referenceContext,
                ...incomingReferenceContext,
              }),
            });
            incomingReferenceContext = null;
          }

          const seenContext = knownContexts.get([contextChainEntry, context]);
          if (seenContext) {
            context = seenContext;
            continue;
          }

          const key = typeEmitterKey(contextChainEntry);

          const lexicalKey = key + "Context";
          const referenceKey = typeEmitterKey(contextChainEntry) + "ReferenceContext";

          if (!(typeEmitter as any)[lexicalKey]) {
            throw new Error("Type emitter doesn't have key " + lexicalKey);
          }
          const newContext = (typeEmitter as any)[lexicalKey](contextChainEntry);
          const newReferenceContext = keyHasReferenceContext(key)
            ? (typeEmitter as any)[referenceKey](contextChainEntry)
            : {};

          const newContextState = interner.intern({
            lexicalContext: interner.intern({
              ...context.lexicalContext,
              ...newContext,
            }),
            referenceContext: interner.intern({
              ...context.referenceContext,
              ...newReferenceContext,
            }),
          });

          knownContexts.set([contextChainEntry, context], newContextState);
          context = newContextState;
        }
      }

      function withTypeContext(type: Type, cb: () => void) {
        const oldContext = context;
        const oldTypeStack = lexicalTypeStack;

        setContextForType(type);
        cb();

        context = oldContext;
        lexicalTypeStack = oldTypeStack;
      }

      function withContext(newContext: EmitterState, cb: () => void) {
        const oldContext = newContext.context;
        const oldTypeStack = newContext.lexicalTypeStack;
        context = newContext.context;
        lexicalTypeStack = newContext.lexicalTypeStack;

        cb();

        context = oldContext;
        lexicalTypeStack = oldTypeStack;
      }

      function typeEmitterKey(type: Type) {
        switch (type.kind) {
          case "Scalar":
            return "modelScalar";
          case "Model":
            if (type.name === "" || type.name === "Array") {
              return "modelLiteral";
            }

            if (type.templateArguments === undefined || type.templateArguments.length === 0) {
              return "modelDeclaration";
            }

            return "modelInstantiation";
          case "Namespace":
            return "namespace";
          case "ModelProperty":
            return "modelPropertyLiteral";
          case "Boolean":
            return "booleanLiteral";
          case "String":
            return "stringLiteral";
          case "Number":
            return "numericLiteral";
          case "Operation":
            if (type.interface) {
              return "interfaceOperationDeclaration";
            } else {
              return "operationDeclaration";
            }
          case "Interface":
            return "interfaceDeclaration";
          case "Enum":
            return "enumDeclaration";
          case "EnumMember":
            return "enumMember";
          case "Union":
            if (!type.name) {
              return "unionLiteral";
            }

            if (type.templateArguments === undefined || type.templateArguments.length === 0) {
              return "unionDeclaration";
            }

            return "unionInstantiation";
          case "UnionVariant":
            return "unionVariant";
          case "Tuple":
            return "tupleLiteral";
          case "Intrinsic":
            throw new Error("Unknown intrinsic type: " + type.name);
          default:
            throw new Error("Unknown type: " + type.kind);
        }
      }
      function currentScope() {
        return context.referenceContext?.scope ?? context.lexicalContext?.scope ?? null;
      }
    },
  };

  function createAssetTagFactory(key: string): AssetTagFactory {
    return function (value: string) {
      return { key, value };
    };
  }
}

function isDeclaration(type: Type): type is CadlDeclaration | Namespace {
  switch (type.kind) {
    case "Namespace":
    case "Interface":
    case "Enum":
    case "Operation":
      return true;

    case "Model":
      return type.name ? type.name !== "" && type.name !== "Array" : false;
    case "Union":
      return type.name ? type.name !== "" : false;
    default:
      return false;
  }
}

// This is EXTREMELY non-optimal (O(n*m) where n = number of unique state objects and
// m = the number of properties a state object contains). This will very quickly be a
// bottleneck. That said, the common case is no state at all, and also this is essentially
// implementing records and tuples, so could probably adopt those when they are released.
function createInterner() {
  const emptyObject = {};
  const knownObjects: Set<Record<string, any>> = new Set();

  return {
    intern<T extends Record<string, any>>(object: T): T {
      const keyLen = Object.keys(object).length;
      if (keyLen === 0) return emptyObject as any;

      for (const ko of knownObjects) {
        const entries = Object.entries(ko);
        if (entries.length !== keyLen) continue;

        let found = true;
        for (const [key, value] of entries) {
          if (object[key] !== value) {
            found = false;
            break;
          }
        }

        if (found) {
          return ko as any;
        }
      }

      knownObjects.add(object);
      return object;
    },
  };
}

const noReferenceContext = new Set<string>([
  "booleanLiteral",
  "stringLiteral",
  "numericLiteral",
  "modelScalar",
  "enumDeclaration",
  "enumMember",
]);

function keyHasReferenceContext(key: keyof TypeEmitter): boolean {
  return !noReferenceContext.has(key);
}
