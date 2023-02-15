import {
  compilerAssert,
  EmitContext,
  emitFile,
  IntrinsicType,
  isTemplateDeclaration,
  joinPaths,
  Model,
  Namespace,
  Program,
  Type,
} from "../core/index.js";
import { CustomKeyMap } from "./custom-key-map.js";
import { Placeholder } from "./placeholder.js";
import { TypeEmitter } from "./type-emitter.js";
import {
  AssetEmitter,
  TypeSpecDeclaration,
  CircularEmit,
  ContextState,
  Declaration,
  EmitEntity,
  EmitterResult,
  EmitterState,
  NamespaceScope,
  NoEmit,
  RawCode,
  Scope,
  SourceFile,
  SourceFileScope,
} from "./types.js";

type EndingWith<Names, Name extends string> = Names extends `${infer _X}${Name}` ? Names : never;

export function createAssetEmitter<T, TOptions extends object>(
  program: Program,
  TypeEmitterClass: typeof TypeEmitter<T, TOptions>,
  emitContext: EmitContext<TOptions>
): AssetEmitter<T, TOptions> {
  const sourceFiles: SourceFile<T>[] = [];

  const options = {
    noEmit: program.compilerOptions.noEmit ?? false,
    emitterOutputDir: emitContext.emitterOutputDir,
    ...emitContext.options,
  };
  const typeId = CustomKeyMap.objectKeyer();
  const contextId = CustomKeyMap.objectKeyer();

  // This is effectively a seen set, ensuring that we don't emit the same
  // type with the same context twice. So the map stores a triple of:
  //
  // 1. the method of TypeEmitter we would call
  // 2. the tsp type we're emitting.
  // 3. the current context.
  //
  // Note that in order for this to work, context needs to be interned so
  // contexts with the same values inside are treated as identical in the
  // map. See createInterner for more details.
  const typeToEmitEntity = new CustomKeyMap<[string, Type, ContextState], EmitEntity<T>>(
    ([method, type, context]) => {
      return `${method}-${typeId.getKey(type)}-${contextId.getKey(context)}`;
    }
  );

  // When we encounter a circular reference, this map will hold a callback
  // that should be called when the circularly referenced type has completed
  // its emit.
  const waitingCircularRefs = new CustomKeyMap<
    [string, Type, ContextState],
    {
      state: EmitterState;
      cb: (entity: EmitEntity<T>) => EmitEntity<T>;
    }[]
  >(([method, type, context]) => {
    return `${method}-${typeId.getKey(type)}-${contextId.getKey(context)}`;
  });

  // Similar to `typeToEmitEntity`, this ensures we don't recompute context
  // for types that we already have context for. Note that context is
  // dependent on the context of the context call, e.g. if a model is
  // referenced with reference context set we need to get its declaration
  // context again. So we use the context's context as a key. Context must
  // be interned, see createInterner for more details.
  const knownContexts = new CustomKeyMap<[Type, ContextState], ContextState>(([type, context]) => {
    return `${typeId.getKey(type)}-${contextId.getKey(context)}`;
  });

  // The stack of types that the currently emitted type is lexically
  // contained in. This gets pushed to when we visit a type that is
  // lexically contained in the current type, and is reset when we jump via
  // reference to another type in a different lexical context. Note that
  // this does not correspond to tsp's lexical nesting, e.g. in the case of
  // an alias to a model expression, the alias is lexically outside the
  // model, but in the type graph we will consider it to be lexically inside
  // whatever references the alias.
  let lexicalTypeStack: Type[] = [];

  // Internally, context is is split between lexicalContext and
  // referenceContext because when a reference is made, we carry over
  // referenceContext but leave lexical context behind. When context is
  // accessed by the user, they are merged by getContext().
  let context: ContextState = {
    lexicalContext: {},
    referenceContext: {},
  };
  let programContext: ContextState | null = null;
  let incomingReferenceContext: Record<string, string> | null = null;
  const interner = createInterner();
  const assetEmitter: AssetEmitter<T, TOptions> = {
    getContext() {
      return {
        ...context.lexicalContext,
        ...context.referenceContext,
      };
    },

    getOptions() {
      return options;
    },

    getProgram() {
      return program;
    },

    result: {
      declaration(name, value) {
        const scope = currentScope();
        compilerAssert(
          scope,
          "Emit context must have a scope set in order to create declarations. Consider setting scope to a new source file's global scope in the `programContext` method of `TypeEmitter`."
        );
        return new Declaration(name, scope, value);
      },
      rawCode(value) {
        return new RawCode(value);
      },
      none() {
        return new NoEmit();
      },
    },
    createScope(block, name, parentScope: Scope<T> | null = null) {
      let newScope: Scope<T>;
      if (!parentScope) {
        // create source file scope
        newScope = {
          kind: "sourceFile",
          name,
          sourceFile: block,
          parentScope,
          childScopes: [],
          declarations: [],
        } as SourceFileScope<T>;
      } else {
        newScope = {
          kind: "namespace",
          name,
          namespace: block,
          childScopes: [],
          declarations: [],
          parentScope,
        } as NamespaceScope<T>;
      }

      parentScope?.childScopes.push(newScope);
      return newScope as any; // the overload of createScope causes type weirdness
    },

    createSourceFile(path): SourceFile<T> {
      const basePath = options.emitterOutputDir;
      const sourceFile = {
        globalScope: undefined as any,
        path: joinPaths(basePath, path),
        imports: new Map(),
      };
      sourceFile.globalScope = this.createScope(sourceFile, "");
      sourceFiles.push(sourceFile);
      return sourceFile;
    },

    emitTypeReference(target): EmitEntity<T> {
      if (target.kind === "ModelProperty") {
        return invokeTypeEmitter("modelPropertyReference", target);
      }

      incomingReferenceContext = context.referenceContext ?? null;

      const entity = this.emitType(target);

      let placeholder: Placeholder<T> | null = null;

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
          cb: (entity) => invokeReference(this, entity),
        });

        placeholder = new Placeholder();
        return this.result.rawCode(placeholder);
      } else {
        return invokeReference(this, entity);
      }

      function invokeReference(
        assetEmitter: AssetEmitter<T, TOptions>,
        entity: EmitEntity<T>
      ): EmitEntity<T> {
        if (entity.kind !== "declaration") {
          return entity;
        }

        const scope = currentScope();
        compilerAssert(
          scope,
          "Emit context must have a scope set in order to create references to declarations."
        );
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

        const pathUp: Scope<T>[] = currentChain.slice(diffStart);
        const pathDown: Scope<T>[] = targetChain.slice(diffStart);

        let ref = typeEmitter.reference(
          entity,
          pathUp,
          pathDown,
          targetChain[diffStart - 1] ?? null
        );

        if (!(ref instanceof EmitterResult)) {
          ref = assetEmitter.result.rawCode(ref) as RawCode<T>;
        }

        if (placeholder) {
          // this should never happen as this function shouldn't be called until
          // the target declaration is finished being emitted.
          compilerAssert(ref.kind !== "circular", "TypeEmitter `reference` returned circular emit");

          // this could presumably be allowed if we want.
          compilerAssert(
            ref.kind === "none" || !(ref.value instanceof Placeholder),
            "TypeEmitter's `reference` method cannot return a placeholder."
          );

          switch (ref.kind) {
            case "code":
            case "declaration":
              placeholder.setValue(ref.value as T);
              break;
            case "none":
              // this cast is incorrect, think about what should happen
              // if reference returns noEmit...
              placeholder.setValue("" as T);
              break;
          }
        }

        return ref;
      }

      function scopeChain(scope: Scope<T> | null) {
        const chain = [];
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
        await emitFile(program, {
          path: outputFile.path,
          content: outputFile.contents,
        });
      }
    },

    emitType(type) {
      const key = typeEmitterKey(type);
      let args: any[];
      switch (key) {
        case "scalarDeclaration":
        case "modelDeclaration":
        case "modelInstantiation":
        case "operationDeclaration":
        case "interfaceDeclaration":
        case "interfaceOperationDeclaration":
        case "enumDeclaration":
        case "unionDeclaration":
        case "unionInstantiation":
          const declarationName = typeEmitter.declarationName(type as TypeSpecDeclaration);
          args = [declarationName];
          break;

        case "arrayDeclaration":
          const arrayDeclName = typeEmitter.declarationName(type as TypeSpecDeclaration);
          const arrayDeclElement = (type as Model).indexer!.value;
          args = [arrayDeclName, arrayDeclElement];
          break;
        case "arrayLiteral":
          const arrayLiteralElement = (type as Model).indexer!.value;
          args = [arrayLiteralElement];
          break;
        case "intrinsic":
          args = [(type as IntrinsicType).name];
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
        if (ns.name === "TypeSpec" && !options?.emitTypeSpecNamespace) continue;
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
      const res = typeEmitter.modelProperties(model);
      if (res instanceof EmitterResult) {
        return res;
      } else {
        return this.result.rawCode(res);
      }
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

  /**
   * This function takes care of calling a method on the TypeEmitter to
   * convert it to some emitted output. It will return a cached type if we
   * have seen it before (and the context is the same). It will establish
   * the emit context by calling the appropriate methods before getting the
   * emit result. Also if a type emitter returns just a T or a
   * Placeholder<T>, it will convert that to a RawCode result.
   */
  function invokeTypeEmitter<
    TMethod extends keyof Omit<
      TypeEmitter<T, TOptions>,
      | "sourceFile"
      | "declarationName"
      | "reference"
      | "emitValue"
      | EndingWith<keyof TypeEmitter<T, TOptions>, "Context">
    >
  >(method: TMethod, ...args: Parameters<TypeEmitter<T, TOptions>[TMethod]>): EmitEntity<T> {
    const type = args[0];
    let entity: EmitEntity<T>;
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

      typeToEmitEntity.set(emitEntityKey, new CircularEmit(emitEntityKey));
      compilerAssert(typeEmitter[method], `TypeEmitter doesn't have a method named ${method}.`);
      entity = liftToRawCode((typeEmitter[method] as any)(...args));
    });

    if (cached) {
      return entity!;
    }

    if (entity! instanceof Placeholder) {
      entity.onValue((v) => handleCompletedEntity(v));
      return entity;
    }

    handleCompletedEntity(entity!);

    return entity!;

    function handleCompletedEntity(entity: EmitEntity<T>) {
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
    }

    function liftToRawCode(value: EmitEntity<T> | Placeholder<T> | T): EmitEntity<T> {
      if (value instanceof EmitterResult) {
        return value;
      }

      return assetEmitter.result.rawCode(value);
    }
  }

  /**
   * This helper takes a type and sets the `context` state to what it should
   * be in order to invoke the type emitter method for that type. This needs
   * to take into account the current context and any incoming reference
   * context.
   */
  function setContextForType(type: Type) {
    let newTypeStack;

    // if we've walked into a new declaration, reset the lexical type stack
    // to the lexical containers of the current type.
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
        referenceContext: interner.intern({}),
      });
    }

    // Establish our context by starting from program and walking up the type stack
    // and merging in context for each of the lexical containers.
    context = programContext;

    for (const contextChainEntry of lexicalTypeStack) {
      // when we're at the top of the lexical context stack (i.e. we are back
      // to the type we passed in), bring in any incoming reference context.
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

      // invoke the context methods
      const key = typeEmitterKey(contextChainEntry);

      const lexicalKey = key + "Context";
      const referenceKey = typeEmitterKey(contextChainEntry) + "ReferenceContext";

      compilerAssert(
        (typeEmitter as any)[lexicalKey],
        `TypeEmitter doesn't have a method named ${lexicalKey}`
      );

      const newContext = (typeEmitter as any)[lexicalKey](contextChainEntry);
      const newReferenceContext = keyHasReferenceContext(key)
        ? (typeEmitter as any)[referenceKey](contextChainEntry)
        : {};

      // assemble our new reference and lexical contexts.
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

  /**
   * Invoke the callback with the proper context for a given type.
   */
  function withTypeContext(type: Type, cb: () => void) {
    const oldContext = context;
    const oldTypeStack = lexicalTypeStack;

    setContextForType(type);
    cb();

    context = oldContext;
    lexicalTypeStack = oldTypeStack;
  }

  /**
   * Invoke the callback with the given context.
   */
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
      case "Model":
        if (program.checker.isStdType(type) && type.name === "Array") {
          // likely an array literal, though could be a bare reference to Array maybe?
          return "arrayLiteral";
        }

        if (type.name === "") {
          return "modelLiteral";
        }

        if (type.templateMapper) {
          return "modelInstantiation";
        }

        if (type.indexer && type.indexer.key!.name === "integer") {
          return "arrayDeclaration";
        }

        return "modelDeclaration";
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

        if (type.templateMapper) {
          return "unionInstantiation";
        }

        return "unionDeclaration";
      case "UnionVariant":
        return "unionVariant";
      case "Tuple":
        return "tupleLiteral";
      case "Scalar":
        return "scalarDeclaration";
      case "Intrinsic":
        return "intrinsic";
      default:
        compilerAssert(false, `Encountered type ${type.kind} which we don't know how to emit.`);
    }
  }
  function currentScope() {
    return context.referenceContext?.scope ?? context.lexicalContext?.scope ?? null;
  }
}

function isDeclaration(type: Type): type is TypeSpecDeclaration | Namespace {
  switch (type.kind) {
    case "Namespace":
    case "Interface":
    case "Enum":
    case "Operation":
    case "Scalar":
      return true;

    case "Model":
      return type.name ? type.name !== "" && type.name !== "Array" : false;
    case "Union":
      return type.name ? type.name !== "" : false;
    default:
      return false;
  }
}

/**
 * An interner takes an object and returns either that same object, or a
 * previously seen object that has the identical shape.
 *
 * This implementation is EXTREMELY non-optimal (O(n*m) where n = number of unique
 * state objects and m = the number of properties a state object contains). This
 * will very quickly be a bottleneck. That said, the common case is no state at
 * all, and also this is essentially implementing records and tuples, so could
 * probably adopt those when they are released. That that said, the records and
 * tuples are presently facing headwinds due to implementations facing exactly
 * these performance characteristics. Regardless, there are optimizations we
 * could consider.
 */
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
  "scalarDeclaration",
  "enumDeclaration",
  "enumMember",
  "intrinsic",
]);

function keyHasReferenceContext(key: keyof TypeEmitter<any, any>): boolean {
  return !noReferenceContext.has(key);
}
