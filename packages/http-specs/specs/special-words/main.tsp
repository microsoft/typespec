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
 * any
 * apiVersion
 * arguments
 * as
 * assert
 * async
 * await
 * boolean
 * break
 * case
 * catch
 * class
 * client
 * const
 * constructor
 * continue
 * date
 * debugger
 * declare
 * def
 * default
 * del
 * delete
 * do
 * elif
 * else
 * endpoint
 * enum
 * error
 * except
 * exec
 * export
 * extends
 * false
 * finally
 * for
 * from
 * function
 * get
 * global
 * if
 * implements
 * import
 * in
 * instanceof
 * interface
 * is
 * lambda
 * let
 * module
 * new
 * not
 * null
 * number
 * of
 * or
 * package
 * pass
 * private
 * protected
 * public
 * raise
 * requestoptions
 * require
 * return
 * set
 * static
 * string
 * super
 * switch
 * symbol
 * this
 * throw
 * true
 * try
 * type
 * typeof
 * var
 * void
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
  @opNameScenario("async") `async`(): void;
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
  @opNameScenario("let") `let`(): void;
  @opNameScenario("module") `module`(): void;
  @opNameScenario("new") `new`(): void;
  @opNameScenario("not") not(): void;
  @opNameScenario("null") `null`(): void;
  @opNameScenario("number") number(): void;
  @opNameScenario("of") of(): void;
  @opNameScenario("or") or(): void;
  @opNameScenario("package") `package`(): void;
  @opNameScenario("pass") pass(): void;
  @opNameScenario("private") `private`(): void;
  @opNameScenario("protected") `protected`(): void;
  @opNameScenario("public") `public`(): void;
  @opNameScenario("raise") raise(): void;
  @opNameScenario("requestoptions") requestoptions(): void;
  @opNameScenario("require") require(): void;
  @opNameScenario("return") `return`(): void;
  @opNameScenario("set") set(): void;
  @opNameScenario("static") `static`(): void;
  @opNameScenario("string") string(): void;
  @opNameScenario("super") `super`(): void;
  @opNameScenario("switch") `switch`(): void;
  @opNameScenario("symbol") symbol(): void;
  @opNameScenario("this") `this`(): void;
  @opNameScenario("throw") `throw`(): void;
  @opNameScenario("true") `true`(): void;
  @opNameScenario("try") try(): void;
  @opNameScenario("type") `type`(): void;
  @opNameScenario("typeof") `typeof`(): void;
  @opNameScenario("var") `var`(): void;
  @opNameScenario("void") `void`(): void;
  @opNameScenario("while") while(): void;
  @opNameScenario("with") `with`(): void;
  @opNameScenario("yield") yield(): void;
  @opNameScenario("any") `any`(): void;
  @opNameScenario("apiVersion") apiVersion(): void;
  @opNameScenario("arguments") `arguments`(): void;
  @opNameScenario("boolean") boolean(): void;
  @opNameScenario("case") `case`(): void;
  @opNameScenario("catch") `catch`(): void;
  @opNameScenario("client") client(): void;
  @opNameScenario("const") `const`(): void;
  @opNameScenario("date") date(): void;
  @opNameScenario("debugger") `debugger`(): void;
  @opNameScenario("declare") declare(): void;
  @opNameScenario("default") `default`(): void;
  @opNameScenario("delete") `delete`(): void;
  @opNameScenario("do") `do`(): void;
  @opNameScenario("endpoint") endpoint(): void;
  @opNameScenario("enum") `enum`(): void;
  @opNameScenario("error") error(): void;
  @opNameScenario("export") `export`(): void;
  @opNameScenario("extends") `extends`(): void;
  @opNameScenario("false") `false`(): void;
  @opNameScenario("function") `function`(): void;
  @opNameScenario("get") get(): void;
  @opNameScenario("implements") `implements`(): void;
  @opNameScenario("instanceof") `instanceof`(): void;
  @opNameScenario("interface") `interface`(): void;
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
  @paramNameScenario("any") withAny(@query `any`: string): void;
  @paramNameScenario("apiVersion") withApiVersion(@query apiVersion: string): void;
  @paramNameScenario("arguments") withArguments(@query `arguments`: string): void;
  @paramNameScenario("boolean") withBoolean(@query boolean: string): void;
  @paramNameScenario("case") withCase(@query `case`: string): void;
  @paramNameScenario("catch") withCatch(@query `catch`: string): void;
  @paramNameScenario("client") withClient(@query client: string): void;
  @paramNameScenario("const") withConst(@query `const`: string): void;
  @paramNameScenario("date") withDate(@query date: string): void;
  @paramNameScenario("debugger") withDebugger(@query `debugger`: string): void;
  @paramNameScenario("declare") withDeclare(@query declare: string): void;
  @paramNameScenario("default") withDefault(@query `default`: string): void;
  @paramNameScenario("delete") withDelete(@query `delete`: string): void;
  @paramNameScenario("do") withDo(@query `do`: string): void;
  @paramNameScenario("endpoint") withEndpoint(@query endpoint: string): void;
  @paramNameScenario("enum") withEnum(@query `enum`: string): void;
  @paramNameScenario("error") withError(@query error: string): void;
  @paramNameScenario("export") withExport(@query `export`: string): void;
  @paramNameScenario("extends") withExtends(@query `extends`: string): void;
  @paramNameScenario("false") withFalse(@query `false`: string): void;
  @paramNameScenario("function") withFunction(@query `function`: string): void;
  @paramNameScenario("get") withGet(@query get: string): void;
  @paramNameScenario("implements") withImplements(@query `implements`: string): void;
  @paramNameScenario("instanceof") withInstanceof(@query `instanceof`: string): void;
  @paramNameScenario("interface") withInterface(@query `interface`: string): void;
  @paramNameScenario("let") withLet(@query `let`: string): void;
  @paramNameScenario("module") withModule(@query `module`: string): void;
  @paramNameScenario("new") withNew(@query `new`: string): void;
  @paramNameScenario("null") withNull(@query `null`: string): void;
  @paramNameScenario("number") withNumber(@query number: string): void;
  @paramNameScenario("of") withOf(@query of: string): void;
  @paramNameScenario("package") withPackage(@query `package`: string): void;
  @paramNameScenario("private") withPrivate(@query `private`: string): void;
  @paramNameScenario("protected") withProtected(@query `protected`: string): void;
  @paramNameScenario("public") withPublic(@query `public`: string): void;
  @paramNameScenario("requestoptions") withRequestOptions(@query requestoptions: string): void;
  @paramNameScenario("require") withRequire(@query require: string): void;
  @paramNameScenario("set") withSet(@query set: string): void;
  @paramNameScenario("static") withStatic(@query `static`: string): void;
  @paramNameScenario("string") withString(@query string: string): void;
  @paramNameScenario("super") withSuper(@query `super`: string): void;
  @paramNameScenario("switch") withSwitch(@query `switch`: string): void;
  @paramNameScenario("symbol") withSymbol(@query symbol: string): void;
  @paramNameScenario("this") withThis(@query `this`: string): void;
  @paramNameScenario("throw") withThrow(@query `throw`: string): void;
  @paramNameScenario("true") withTrue(@query `true`: string): void;
  @paramNameScenario("type") withType(@query `type`: string): void;
  @paramNameScenario("typeof") withTypeof(@query `typeof`: string): void;
  @paramNameScenario("var") withVar(@query `var`: string): void;
  @paramNameScenario("void") withVoid(@query `void`: string): void;

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
  model `async` is Base;
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
  model `with` is Base;
  model yield is Base;
  model `any` is Base;
  model apiVersion is Base;
  model `arguments` is Base;
  model boolean is Base;
  model `case` is Base;
  model `catch` is Base;
  model client is Base;
  model `const` is Base;
  model date is Base;
  model `debugger` is Base;
  model declare is Base;
  model `default` is Base;
  model `delete` is Base;
  model `do` is Base;
  model endpoint is Base;
  model `enum` is Base;
  model error is Base;
  model `export` is Base;
  model `extends` is Base;
  model `false` is Base;
  model `function` is Base;
  model get is Base;
  model `implements` is Base;
  model `instanceof` is Base;
  model `interface` is Base;
  model `let` is Base;
  model `module` is Base;
  model `new` is Base;
  model `null` is Base;
  model number is Base;
  model of is Base;
  model `package` is Base;
  model `private` is Base;
  model `protected` is Base;
  model `public` is Base;
  model requestoptions is Base;
  model require is Base;
  model set is Base;
  model `static` is Base;
  model string is Base;
  model `super` is Base;
  model `switch` is Base;
  model symbol is Base;
  model `this` is Base;
  model `throw` is Base;
  model `true` is Base;
  model `type` is Base;
  model `typeof` is Base;
  model `var` is Base;
  model `void` is Base;

  @modelNameScenario("and") op withAnd(@body body: and): void;
  @modelNameScenario("as") op withAs(@body body: as): void;
  @modelNameScenario("assert") op withAssert(@body body: assert): void;
  @modelNameScenario("async") op withAsync(@body body: `async`): void;
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
  @modelNameScenario("with") op withWith(@body body: `with`): void;
  @modelNameScenario("yield") op withYield(@body body: yield): void;
  @modelNameScenario("any") op withAny(@body body: `any`): void;
  @modelNameScenario("apiVersion") op withApiVersion(@body body: apiVersion): void;
  @modelNameScenario("arguments") op withArguments(@body body: `arguments`): void;
  @modelNameScenario("boolean") op withBoolean(@body body: boolean): void;
  @modelNameScenario("case") op withCase(@body body: `case`): void;
  @modelNameScenario("catch") op withCatch(@body body: `catch`): void;
  @modelNameScenario("client") op withClient(@body body: client): void;
  @modelNameScenario("const") op withConst(@body body: `const`): void;
  @modelNameScenario("date") op withDate(@body body: date): void;
  @modelNameScenario("debugger") op withDebugger(@body body: `debugger`): void;
  @modelNameScenario("declare") op withDeclare(@body body: declare): void;
  @modelNameScenario("default") op withDefault(@body body: `default`): void;
  @modelNameScenario("delete") op withDelete(@body body: `delete`): void;
  @modelNameScenario("do") op withDo(@body body: `do`): void;
  @modelNameScenario("endpoint") op withEndpoint(@body body: endpoint): void;
  @modelNameScenario("enum") op withEnum(@body body: `enum`): void;
  @modelNameScenario("error") op withError(@body body: error): void;
  @modelNameScenario("export") op withExport(@body body: `export`): void;
  @modelNameScenario("extends") op withExtends(@body body: `extends`): void;
  @modelNameScenario("false") op withFalse(@body body: `false`): void;
  @modelNameScenario("function") op withFunction(@body body: `function`): void;
  @modelNameScenario("get") op withGet(@body body: get): void;
  @modelNameScenario("implements") op withImplements(@body body: `implements`): void;
  @modelNameScenario("instanceof") op withInstanceof(@body body: `instanceof`): void;
  @modelNameScenario("interface") op withInterface(@body body: `interface`): void;
  @modelNameScenario("let") op withLet(@body body: `let`): void;
  @modelNameScenario("module") op withModule(@body body: `module`): void;
  @modelNameScenario("new") op withNew(@body body: `new`): void;
  @modelNameScenario("null") op withNull(@body body: `null`): void;
  @modelNameScenario("number") op withNumber(@body body: number): void;
  @modelNameScenario("of") op withOf(@body body: of): void;
  @modelNameScenario("package") op withPackage(@body body: `package`): void;
  @modelNameScenario("private") op withPrivate(@body body: `private`): void;
  @modelNameScenario("protected") op withProtected(@body body: `protected`): void;
  @modelNameScenario("public") op withPublic(@body body: `public`): void;
  @modelNameScenario("requestoptions") op withRequestOptions(@body body: requestoptions): void;
  @modelNameScenario("require") op withRequire(@body body: require): void;
  @modelNameScenario("set") op withSet(@body body: set): void;
  @modelNameScenario("static") op withStatic(@body body: `static`): void;
  @modelNameScenario("string") op withString(@body body: string): void;
  @modelNameScenario("super") op withSuper(@body body: `super`): void;
  @modelNameScenario("switch") op withSwitch(@body body: `switch`): void;
  @modelNameScenario("symbol") op withSymbol(@body body: symbol): void;
  @modelNameScenario("this") op withThis(@body body: `this`): void;
  @modelNameScenario("throw") op withThrow(@body body: `throw`): void;
  @modelNameScenario("true") op withTrue(@body body: `true`): void;
  @modelNameScenario("type") op withType(@body body: `type`): void;
  @modelNameScenario("typeof") op withTypeof(@body body: `typeof`): void;
  @modelNameScenario("var") op withVar(@body body: `var`): void;
  @modelNameScenario("void") op withVoid(@body body: `void`): void;
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
