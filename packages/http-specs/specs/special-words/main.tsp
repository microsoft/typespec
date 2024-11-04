import "@typespec/http";
import "@typespec/spector";
import "./dec.js";

using Http;
using Spector;

/**
 * Scenarios to verify that reserved words can be used in service and generators will handle it appropriately.
 *
 * Current list of special words
 * ```txt
 * and
 * as
 * assert
 * async
 * await
 * break
 * class
 * constructor
 * continue
 * def
 * del
 * elif
 * else
 * except
 * exec
 * finally
 * for
 * from
 * global
 * if
 * import
 * in
 * is
 * lambda
 * not
 * or
 * pass
 * raise
 * return
 * try
 * while
 * with
 * yield
 * ```
 */
@scenarioService("/special-words")
namespace SpecialWords;

/**
 * Test reserved words as operation name.
 */
@route("/operations")
interface Operations {
  @opNameScenario("and") and(): void;
  @opNameScenario("as") as(): void;
  @opNameScenario("assert") assert(): void;
  @opNameScenario("async") async(): void;
  @opNameScenario("await") await(): void;
  @opNameScenario("break") break(): void;
  @opNameScenario("class") class(): void;
  @opNameScenario("constructor") constructor(): void;
  @opNameScenario("continue") continue(): void;
  @opNameScenario("def") def(): void;
  @opNameScenario("del") del(): void;
  @opNameScenario("elif") elif(): void;
  @opNameScenario("else") `else`(): void;
  @opNameScenario("except") except(): void;
  @opNameScenario("exec") exec(): void;
  @opNameScenario("finally") finally(): void;
  @opNameScenario("for") for(): void;
  @opNameScenario("from") from(): void;
  @opNameScenario("global") global(): void;
  @opNameScenario("if") `if`(): void;
  @opNameScenario("import") `import`(): void;
  @opNameScenario("in") in(): void;
  @opNameScenario("is") `is`(): void;
  @opNameScenario("lambda") lambda(): void;
  @opNameScenario("not") not(): void;
  @opNameScenario("or") or(): void;
  @opNameScenario("pass") pass(): void;
  @opNameScenario("raise") raise(): void;
  @opNameScenario("return") `return`(): void;
  @opNameScenario("try") try(): void;
  @opNameScenario("while") while(): void;
  @opNameScenario("with") with(): void;
  @opNameScenario("yield") yield(): void;
}

/**
 * Verify reserved words as parameter name.
 */
@route("/parameters")
interface Parameters {
  @paramNameScenario("and") withAnd(@query and: string): void;
  @paramNameScenario("as") withAs(@query as: string): void;
  @paramNameScenario("assert") withAssert(@query assert: string): void;
  @paramNameScenario("async") withAsync(@query async: string): void;
  @paramNameScenario("await") withAwait(@query await: string): void;
  @paramNameScenario("break") withBreak(@query break: string): void;
  @paramNameScenario("class") withClass(@query class: string): void;
  @paramNameScenario("constructor") withConstructor(@query constructor: string): void;
  @paramNameScenario("continue") withContinue(@query continue: string): void;
  @paramNameScenario("def") withDef(@query def: string): void;
  @paramNameScenario("del") withDel(@query del: string): void;
  @paramNameScenario("elif") withElif(@query elif: string): void;
  @paramNameScenario("else") withElse(@query `else`: string): void;
  @paramNameScenario("except") withExcept(@query except: string): void;
  @paramNameScenario("exec") withExec(@query exec: string): void;
  @paramNameScenario("finally") withFinally(@query finally: string): void;
  @paramNameScenario("for") withFor(@query for: string): void;
  @paramNameScenario("from") withFrom(@query from: string): void;
  @paramNameScenario("global") withGlobal(@query global: string): void;
  @paramNameScenario("if") withIf(@query `if`: string): void;
  @paramNameScenario("import") withImport(@query `import`: string): void;
  @paramNameScenario("in") withIn(@query in: string): void;
  @paramNameScenario("is") withIs(@query `is`: string): void;
  @paramNameScenario("lambda") withLambda(@query lambda: string): void;
  @paramNameScenario("not") withNot(@query not: string): void;
  @paramNameScenario("or") withOr(@query or: string): void;
  @paramNameScenario("pass") withPass(@query pass: string): void;
  @paramNameScenario("raise") withRaise(@query raise: string): void;
  @paramNameScenario("return") withReturn(@query `return`: string): void;
  @paramNameScenario("try") withTry(@query try: string): void;
  @paramNameScenario("while") withWhile(@query while: string): void;
  @paramNameScenario("with") withWith(@query with: string): void;
  @paramNameScenario("yield") withYield(@query yield: string): void;

  // Non keywords but parameters name that could cause conflict with some language standards
  @paramNameScenario("cancellationToken") withCancellationToken(
    @query cancellationToken: string,
  ): void;
}

/**
 * Verify model names
 */
@route("/models")
namespace Models {
  model Base {
    name: string;
  }
  model and is Base;
  model as is Base;
  model assert is Base;
  model async is Base;
  model await is Base;
  model break is Base;
  model class is Base;
  model continue is Base;
  model constructor is Base;
  model def is Base;
  model del is Base;
  model elif is Base;
  model `else` is Base;
  model except is Base;
  model exec is Base;
  model finally is Base;
  model for is Base;
  model from is Base;
  model global is Base;
  model `if` is Base;
  model `import` is Base;
  model in is Base;
  model `is` is Base;
  model lambda is Base;
  model not is Base;
  model or is Base;
  model pass is Base;
  model raise is Base;
  model `return` is Base;
  model try is Base;
  model while is Base;
  model with is Base;
  model yield is Base;

  @modelNameScenario("and") op withAnd(@body body: and): void;
  @modelNameScenario("as") op withAs(@body body: as): void;
  @modelNameScenario("assert") op withAssert(@body body: assert): void;
  @modelNameScenario("async") op withAsync(@body body: async): void;
  @modelNameScenario("await") op withAwait(@body body: await): void;
  @modelNameScenario("break") op withBreak(@body body: break): void;
  @modelNameScenario("class") op withClass(@body body: class): void;
  @modelNameScenario("constructor") op withConstructor(@body body: constructor): void;
  @modelNameScenario("continue") op withContinue(@body body: continue): void;
  @modelNameScenario("def") op withDef(@body body: def): void;
  @modelNameScenario("del") op withDel(@body body: del): void;
  @modelNameScenario("elif") op withElif(@body body: elif): void;
  @modelNameScenario("else") op withElse(@body body: `else`): void;
  @modelNameScenario("except") op withExcept(@body body: except): void;
  @modelNameScenario("exec") op withExec(@body body: exec): void;
  @modelNameScenario("finally") op withFinally(@body body: finally): void;
  @modelNameScenario("for") op withFor(@body body: for): void;
  @modelNameScenario("from") op withFrom(@body body: from): void;
  @modelNameScenario("global") op withGlobal(@body body: global): void;
  @modelNameScenario("if") op withIf(@body body: `if`): void;
  @modelNameScenario("import") op withImport(@body body: `import`): void;
  @modelNameScenario("in") op withIn(@body body: in): void;
  @modelNameScenario("is") op withIs(@body body: `is`): void;
  @modelNameScenario("lambda") op withLambda(@body body: lambda): void;
  @modelNameScenario("not") op withNot(@body body: not): void;
  @modelNameScenario("or") op withOr(@body body: or): void;
  @modelNameScenario("pass") op withPass(@body body: pass): void;
  @modelNameScenario("raise") op withRaise(@body body: raise): void;
  @modelNameScenario("return") op withReturn(@body body: `return`): void;
  @modelNameScenario("try") op withTry(@body body: try): void;
  @modelNameScenario("while") op withWhile(@body body: while): void;
  @modelNameScenario("with") op withWith(@body body: with): void;
  @modelNameScenario("yield") op withYield(@body body: yield): void;
}

/**
 * Verify model names
 */
@route("/model-properties")
namespace ModelProperties {
  model SameAsModel {
    SameAsModel: string;
  }

  @scenario
  @scenarioDoc("""
    Verify that a property can be called the same as the model name. This can be an issue in some languages where the class name is the constructor.
    
    Send 
    
    ```json
    {"SameAsModel": "ok"}
    ```
    """)
  @route("same-as-model")
  op sameAsModel(@body body: SameAsModel): void;
}
