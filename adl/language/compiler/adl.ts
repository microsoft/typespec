
import { readdir, readFile } from "fs/promises";
import { join } from "path";
import { ADLScriptNode, ArrayExpressionNode, IdentifierNode, InterfaceParameterNode, InterfacePropertyNode, InterfaceStatementNode, ModelExpressionNode, ModelPropertyNode, ModelStatementNode, Node, NumericLiteralNode, parse, StringLiteralNode, SyntaxKind, TupleExpressionNode } from "../parser.js";

interface DecoratorSymbol {
  kind: "decorator",
  path: string,
  name: string
}

interface TypeSymbol {
  kind: "type",
  node: Node
}

interface Program {
  globals: SymbolTable,
  sourceFiles: ADLSourceFile[],
  typeCache: WeakMap<Node, Type>,
  literalTypes: Map<string | number, StringLiteralType | NumericLiteralType>,
  onBuild(cb: (program: Program) => void): void;
}

type Symbol = DecoratorSymbol | TypeSymbol;

type SymbolTable = Map<string, Symbol>;

interface ADLSourceFile {
  ast: ADLScriptNode,
  path: string,
  symbols: SymbolTable,
  models: ModelType[],
  interfaces: InterfaceType[],
}

export async function compile(rootDir: string) {
  const buildCbs: any = [];

  const program: Program = {
    globals: new Map(),
    sourceFiles: [] as ADLSourceFile[],
    typeCache: new WeakMap(),
    literalTypes: new Map(),
    onBuild(cb) {
      buildCbs.push(cb);
    }
  }

  await loadStandardLibrary(program);
  await loadDirectory(program, './samples/petstore');
  bind(program);
  evaluateProgram(program);
  await executeDecorators(program);
  buildCbs.forEach((cb: any) => cb(program));
  //emit(program);
  /*
  const bv = program.globals.get('ListPetResponse') as TypeSymbol;
  const type = evaluate(bv.node) as ModelType;

  console.log(type.properties.get('content')!.type)
  */

  /**
   * Evaluation resolves identifiers and type expressions and
   * does type checking.
   */
  function evaluate(node: Node): Type {
    if (program.typeCache.has(node)) {
      return program.typeCache.get(node)!;
    }
    switch (node.kind) {
      case SyntaxKind.ModelExpression:
      case SyntaxKind.ModelStatement:
        return evaluateModel(node as any);
      case SyntaxKind.InterfaceStatement:
        return evaluateInterface(node as any);
      case SyntaxKind.Identifier:
        return evaluateIdentifier(node as any) as any;
      case SyntaxKind.NumericLiteral:
        return evaluateNumericLiteral(node as any);
      case SyntaxKind.TupleExpression:
        return evaluateTupleExpression(node as any);
      case SyntaxKind.StringLiteral:
        return evaluateStringLiteral(node as any);
      case SyntaxKind.ArrayExpression:
        return evaluateArrayExpression(node as any);
    }

    throw new Error('cant eval ' + SyntaxKind[node.kind]);
  }

  function evaluateArrayExpression(node: ArrayExpressionNode) {
    return createType({
      kind: "Array",
      node,
      elementType: evaluate(node.elementType)
    });
  }

  function evaluateInterface(node: InterfaceStatementNode) {
    const type: InterfaceType = createType({
      kind: "Interface",
      name: node.id.sv,
      node: node,
      properties: new Map()
    })

    for (const prop of node.properties) {
      type.properties.set(prop.id.sv, createType({
        kind: "InterfaceProperty",
        name: prop.id.sv,
        node: prop,
        parameters: prop.parameters.flatMap(evaluateInterfaceParam),
        returnType: evaluate(prop.returnType)
      }));
    }

    return type;
  }

  function evaluateInterfaceParam(paramNode: InterfaceParameterNode) {
    const type: InterfaceTypeParameter = createType({
      kind: "InterfaceParameter",
      name: paramNode.id.sv,
      node: paramNode,
      optional: paramNode.optional,
      type: evaluate(paramNode.value)
    })

    return type;
  }

  function evaluateTupleExpression(node: TupleExpressionNode): TupleType {
    return createType({
      kind: "Tuple",
      node: node,
      values: node.values.map(v => evaluate(v))
    });
  }

  function evaluateIdentifier(node: IdentifierNode) {
    const binding = program.globals.get(node.sv);
    if (!binding) {
      throw new Error('Unknown identifier ' + node.sv);
    }

    if (binding.kind === 'decorator') {
      return {}
    } else {
      return evaluate(binding.node);
    }
  }

  function evaluateStringLiteral(str: StringLiteralNode): StringLiteralType {
    return getLiteralType(str);
  }

  function evaluateNumericLiteral(num: NumericLiteralNode): NumericLiteralType {
    return getLiteralType(num);
  }

  function evaluateProgram(program: Program) {
    for (const file of program.sourceFiles) {
      evaluateSourceFile(file);
    }
  }

  function evaluateSourceFile(file: ADLSourceFile) {
    for (const statement of file.ast.statements) {
      evaluate(statement);
    }

  }
  function evaluateModel(node: ModelExpressionNode | ModelStatementNode) {
    const type: ModelType = createType({
      name: node.kind === SyntaxKind.ModelStatement ? node.id.sv : "",
      kind: "Model",
      node: node,
      properties: new Map()
    });

    for (const prop of node.properties) {
      if (prop.id.kind === SyntaxKind.Identifier) {
        type.properties.set(prop.id.sv, createType({
          kind: "ModelProperty",
          name: prop.id.sv,
          node: prop,
          optional: prop.optional,
          type: evaluate(prop.value)
        }))
      } else {
        const name = prop.id.value.slice(1, -1);
        type.properties.set(name, createType({
          kind: "ModelProperty",
          name,
          node: prop,
          optional: prop.optional,
          type: evaluate(prop.value)
        }))
      }
    }

    return type;
  }

  function createType<T extends Type>(type: T): T {
    program.typeCache.set(type.node, type);
    return type;
  }

  function getLiteralType<
    T extends StringLiteralNode | NumericLiteralNode
  >(node: T): T extends StringLiteralNode ? StringLiteralType : NumericLiteralType {
    const value = node.kind === SyntaxKind.NumericLiteral
      ? Number(node.value)
      : node.value.slice(1, -1)

    if (program.literalTypes.has(value)) {
      return program.literalTypes.get(value) as any;
    }

    let type = { node, value } as any;

    program.literalTypes.set(value, type);
    return type;
  }

  async function executeDecorators(program: Program) {
    for (const file of program.sourceFiles) {
      for (const stmt of file.ast.statements) {
        if (stmt.kind === SyntaxKind.ModelStatement) {
          await executeModelDecorators(stmt);
        } else if (stmt.kind === SyntaxKind.InterfaceStatement) {
          await executeInterfaceDecorators(stmt);
        }
      }
    }
  }

  async function executeInterfaceDecorators(stmt: InterfaceStatementNode) {
    const type = evaluate(stmt);
    for (const dec of stmt.decorators) {
      if (dec.target.kind === SyntaxKind.Identifier) {
        const decFn = await importDecorator(dec.target);
        const args = dec.arguments.map(a => toJSON(evaluate(a)));
        decFn(program, type, ...args);
      }
    }

    for (const prop of stmt.properties) {
      const type = evaluate(prop);
      for (const dec of prop.decorators) {
        if (dec.target.kind === SyntaxKind.Identifier) {
          const decFn = await importDecorator(dec.target);
          const args = dec.arguments.map(a => toJSON(evaluate(a)));
          decFn(program, type, ...args);
        }
      }
    }
  }

  async function executeModelDecorators(stmt: ModelStatementNode) {
    for (const dec of stmt.decorators) {
      if (dec.target.kind === SyntaxKind.Identifier) {
        const decFn = await importDecorator(dec.target);
        const type = evaluate(stmt);
        const args = dec.arguments.map(a => toJSON(evaluate(a)));
        decFn(program, type, ...args);
      }
    }
  }

  async function importDecorator(id: IdentifierNode) {
    const name = id.sv;
    const binding: Symbol | undefined = program.globals.get(name);
    if (!binding) {
      throw new Error('Cannot find binding ' + name);
    }

    if (binding.kind !== 'decorator') {
      throw new Error('Cannot decorate using non-decorator');
    }

    const modpath = 'file:///' + join(process.cwd(), binding.path);
    const module = await import(modpath);
    return (module as any)[name];
  }

  function toJSON(type: Type): Type | string | number {
    if ("value" in type) {
      return (type as any).value;
    }

    return type;
  }



  function dumpSymbols(program: Program) {
    for (const [binding, value] of program.globals) {
      console.log(`${binding} =>`);
      console.dir(value, { depth: 0 });
    }
  }

  /**
   * Binding creates symbol table entries for declared models
   * and interfaces.
   */
  function bind(program: Program) {
    for (const file of program.sourceFiles) {
      bindSourceFile(file);

      // everything is global
      for (const name of file.symbols.keys()) {
        if (program.globals.has(name)) {
          // todo: collect all the redeclarations of
          // this binding and mark each as errors
          throw new Error('Duplicate binding ' + name);
        }

        program.globals.set(name, file.symbols.get(name)!);
      }
    }
  }

  function bindSourceFile(file: ADLSourceFile) {
    const ast = file.ast;
    for (const statement of ast.statements) {
      switch (statement.kind) {
        case SyntaxKind.ImportStatement:
          // throw new Error("NYI");
          break;
        case SyntaxKind.ModelStatement:
        case SyntaxKind.InterfaceStatement:
          bindStatement(file, statement);
          break;
      }
    }
  }

  function bindStatement(file: ADLSourceFile, statement: ModelStatementNode | InterfaceStatementNode) {
    file.symbols.set(statement.id.sv, {
      kind: "type",
      node: statement
    });
  }

  function loadStandardLibrary(program: Program) {
    return loadDirectory(program, './lib');
  }

  async function loadDirectory(program: Program, rootDir: string) {
    const dir = await readdir(rootDir, { withFileTypes: true });
    for (let entry of dir) {
      if (entry.isFile()) {
        const path = join(rootDir, entry.name);
        if (entry.name.endsWith(".js")) {
          await loadJsFile(program, path);
        } else if (entry.name.endsWith(".adl")) {
          await loadAdlFile(program, path);
        }
      }
    }
  }

  async function loadAdlFile(program: Program, path: string) {
    const contents = await readFile(path, 'utf-8');
    const ast = parse(contents);
    program.sourceFiles.push({
      ast,
      path,
      interfaces: [],
      models: [],
      symbols: new Map()
    });
  }

  async function loadJsFile(program: Program, path: string) {
    const contents = await readFile(path, 'utf-8');

    const exports = contents.match(/export function \w+/g);
    if (!exports) return;
    for (const match of exports) {
      // bind JS files early since this is the only work
      // we have to do with them.
      const name = match.match(/function (\w+)/)![1];
      program.globals.set(name, {
        kind: "decorator",
        path,
        name
      });
    }
  }
}

export interface Type {
  node: Node,
}

export interface ModelType extends Type {
  kind: "Model",
  name: string,
  properties: Map<string, ModelTypeProperty>,
}

export interface ModelTypeProperty {
  kind: "ModelProperty",
  node: ModelPropertyNode,
  name: string,
  type: Type,
  optional: boolean
}

export interface InterfaceTypeProperty {
  kind: "InterfaceProperty"
  node: InterfacePropertyNode,
  name: string,
  parameters: InterfaceTypeParameter[],
  returnType: Type
}

export interface InterfaceTypeParameter {
  kind: "InterfaceParameter",
  node: InterfaceParameterNode,
  name: string,
  type: Type,
  optional: boolean
}

export interface InterfaceType extends Type {
  kind: "Interface",
  name: string,
  node: InterfaceStatementNode,
  properties: Map<string, InterfaceTypeProperty>
}

export interface StringLiteralType extends Type {
  kind: "StringLiteral",
  node: StringLiteralNode,
  value: string
}

export interface NumericLiteralType extends Type {
  kind: "NumberLiteral",
  node: NumericLiteralNode,
  value: number
}
export interface ArrayType extends Type {
  kind: "Array",
  node: ArrayExpressionNode,
  elementType: Type
}

export interface TupleType extends Type {
  kind: "Tuple",
  node: TupleExpressionNode,
  values: Type[]
}

compile('./samples/petstore').catch(e => console.error(e));