import { json, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.SpecialWords_ModelProperties_sameAsModel = passOnSuccess({
  uri: "/special-words/model-properties/same-as-model",
  method: "post",
  request: {
    body: json({
      SameAsModel: "ok",
    }),
  },
  response: {
    status: 204,
  },
  kind: "MockApiDefinition",
});

function createModelsTests(uri: string) {
  return passOnSuccess({
    uri,
    method: "post",
    request: {
      body: json({
        name: "ok",
      }),
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  });
}
Scenarios.SpecialWords_Models_and = createModelsTests(`/special-words/models/and`);
Scenarios.SpecialWords_Models_as = createModelsTests(`/special-words/models/as`);
Scenarios.SpecialWords_Models_assert = createModelsTests(`/special-words/models/assert`);
Scenarios.SpecialWords_Models_async = createModelsTests(`/special-words/models/async`);
Scenarios.SpecialWords_Models_await = createModelsTests(`/special-words/models/await`);
Scenarios.SpecialWords_Models_break = createModelsTests(`/special-words/models/break`);
Scenarios.SpecialWords_Models_class = createModelsTests(`/special-words/models/class`);
Scenarios.SpecialWords_Models_constructor = createModelsTests(`/special-words/models/constructor`);
Scenarios.SpecialWords_Models_continue = createModelsTests(`/special-words/models/continue`);
Scenarios.SpecialWords_Models_def = createModelsTests(`/special-words/models/def`);
Scenarios.SpecialWords_Models_del = createModelsTests(`/special-words/models/del`);
Scenarios.SpecialWords_Models_elif = createModelsTests(`/special-words/models/elif`);
Scenarios.SpecialWords_Models_else = createModelsTests(`/special-words/models/else`);
Scenarios.SpecialWords_Models_except = createModelsTests(`/special-words/models/except`);
Scenarios.SpecialWords_Models_exec = createModelsTests(`/special-words/models/exec`);
Scenarios.SpecialWords_Models_finally = createModelsTests(`/special-words/models/finally`);
Scenarios.SpecialWords_Models_for = createModelsTests(`/special-words/models/for`);
Scenarios.SpecialWords_Models_from = createModelsTests(`/special-words/models/from`);
Scenarios.SpecialWords_Models_global = createModelsTests(`/special-words/models/global`);
Scenarios.SpecialWords_Models_if = createModelsTests(`/special-words/models/if`);
Scenarios.SpecialWords_Models_import = createModelsTests(`/special-words/models/import`);
Scenarios.SpecialWords_Models_in = createModelsTests(`/special-words/models/in`);
Scenarios.SpecialWords_Models_is = createModelsTests(`/special-words/models/is`);
Scenarios.SpecialWords_Models_lambda = createModelsTests(`/special-words/models/lambda`);
Scenarios.SpecialWords_Models_not = createModelsTests(`/special-words/models/not`);
Scenarios.SpecialWords_Models_or = createModelsTests(`/special-words/models/or`);
Scenarios.SpecialWords_Models_pass = createModelsTests(`/special-words/models/pass`);
Scenarios.SpecialWords_Models_raise = createModelsTests(`/special-words/models/raise`);
Scenarios.SpecialWords_Models_return = createModelsTests(`/special-words/models/return`);
Scenarios.SpecialWords_Models_try = createModelsTests(`/special-words/models/try`);
Scenarios.SpecialWords_Models_while = createModelsTests(`/special-words/models/while`);
Scenarios.SpecialWords_Models_with = createModelsTests(`/special-words/models/with`);
Scenarios.SpecialWords_Models_yield = createModelsTests(`/special-words/models/yield`);
Scenarios.SpecialWords_Models_any = createModelsTests(`/special-words/models/any`);
Scenarios.SpecialWords_Models_apiVersion = createModelsTests(`/special-words/models/apiVersion`);
Scenarios.SpecialWords_Models_arguments = createModelsTests(`/special-words/models/arguments`);
Scenarios.SpecialWords_Models_boolean = createModelsTests(`/special-words/models/boolean`);
Scenarios.SpecialWords_Models_case = createModelsTests(`/special-words/models/case`);
Scenarios.SpecialWords_Models_catch = createModelsTests(`/special-words/models/catch`);
Scenarios.SpecialWords_Models_client = createModelsTests(`/special-words/models/client`);
Scenarios.SpecialWords_Models_const = createModelsTests(`/special-words/models/const`);
Scenarios.SpecialWords_Models_date = createModelsTests(`/special-words/models/date`);
Scenarios.SpecialWords_Models_debugger = createModelsTests(`/special-words/models/debugger`);
Scenarios.SpecialWords_Models_declare = createModelsTests(`/special-words/models/declare`);
Scenarios.SpecialWords_Models_default = createModelsTests(`/special-words/models/default`);
Scenarios.SpecialWords_Models_delete = createModelsTests(`/special-words/models/delete`);
Scenarios.SpecialWords_Models_do = createModelsTests(`/special-words/models/do`);
Scenarios.SpecialWords_Models_endpoint = createModelsTests(`/special-words/models/endpoint`);
Scenarios.SpecialWords_Models_enum = createModelsTests(`/special-words/models/enum`);
Scenarios.SpecialWords_Models_error = createModelsTests(`/special-words/models/error`);
Scenarios.SpecialWords_Models_export = createModelsTests(`/special-words/models/export`);
Scenarios.SpecialWords_Models_extends = createModelsTests(`/special-words/models/extends`);
Scenarios.SpecialWords_Models_false = createModelsTests(`/special-words/models/false`);
Scenarios.SpecialWords_Models_function = createModelsTests(`/special-words/models/function`);
Scenarios.SpecialWords_Models_get = createModelsTests(`/special-words/models/get`);
Scenarios.SpecialWords_Models_implements = createModelsTests(`/special-words/models/implements`);
Scenarios.SpecialWords_Models_instanceof = createModelsTests(`/special-words/models/instanceof`);
Scenarios.SpecialWords_Models_interface = createModelsTests(`/special-words/models/interface`);
Scenarios.SpecialWords_Models_let = createModelsTests(`/special-words/models/let`);
Scenarios.SpecialWords_Models_module = createModelsTests(`/special-words/models/module`);
Scenarios.SpecialWords_Models_new = createModelsTests(`/special-words/models/new`);
Scenarios.SpecialWords_Models_null = createModelsTests(`/special-words/models/null`);
Scenarios.SpecialWords_Models_number = createModelsTests(`/special-words/models/number`);
Scenarios.SpecialWords_Models_of = createModelsTests(`/special-words/models/of`);
Scenarios.SpecialWords_Models_package = createModelsTests(`/special-words/models/package`);
Scenarios.SpecialWords_Models_private = createModelsTests(`/special-words/models/private`);
Scenarios.SpecialWords_Models_protected = createModelsTests(`/special-words/models/protected`);
Scenarios.SpecialWords_Models_public = createModelsTests(`/special-words/models/public`);
Scenarios.SpecialWords_Models_requestoptions = createModelsTests(`/special-words/models/requestoptions`);
Scenarios.SpecialWords_Models_require = createModelsTests(`/special-words/models/require`);
Scenarios.SpecialWords_Models_set = createModelsTests(`/special-words/models/set`);
Scenarios.SpecialWords_Models_static = createModelsTests(`/special-words/models/static`);
Scenarios.SpecialWords_Models_string = createModelsTests(`/special-words/models/string`);
Scenarios.SpecialWords_Models_super = createModelsTests(`/special-words/models/super`);
Scenarios.SpecialWords_Models_switch = createModelsTests(`/special-words/models/switch`);
Scenarios.SpecialWords_Models_symbol = createModelsTests(`/special-words/models/symbol`);
Scenarios.SpecialWords_Models_this = createModelsTests(`/special-words/models/this`);
Scenarios.SpecialWords_Models_throw = createModelsTests(`/special-words/models/throw`);
Scenarios.SpecialWords_Models_true = createModelsTests(`/special-words/models/true`);
Scenarios.SpecialWords_Models_type = createModelsTests(`/special-words/models/type`);
Scenarios.SpecialWords_Models_typeof = createModelsTests(`/special-words/models/typeof`);
Scenarios.SpecialWords_Models_var = createModelsTests(`/special-words/models/var`);
Scenarios.SpecialWords_Models_void = createModelsTests(`/special-words/models/void`);

function createOperationsTests(uri: string) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {},
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  });
}

Scenarios.SpecialWords_Operations_and = createOperationsTests(`/special-words/operations/and`);
Scenarios.SpecialWords_Operations_as = createOperationsTests(`/special-words/operations/as`);
Scenarios.SpecialWords_Operations_assert = createOperationsTests(
  `/special-words/operations/assert`,
);
Scenarios.SpecialWords_Operations_async = createOperationsTests(`/special-words/operations/async`);
Scenarios.SpecialWords_Operations_await = createOperationsTests(`/special-words/operations/await`);
Scenarios.SpecialWords_Operations_break = createOperationsTests(`/special-words/operations/break`);
Scenarios.SpecialWords_Operations_class = createOperationsTests(`/special-words/operations/class`);
Scenarios.SpecialWords_Operations_constructor = createOperationsTests(
  `/special-words/operations/constructor`,
);
Scenarios.SpecialWords_Operations_continue = createOperationsTests(
  `/special-words/operations/continue`,
);
Scenarios.SpecialWords_Operations_def = createOperationsTests(`/special-words/operations/def`);
Scenarios.SpecialWords_Operations_del = createOperationsTests(`/special-words/operations/del`);
Scenarios.SpecialWords_Operations_elif = createOperationsTests(`/special-words/operations/elif`);
Scenarios.SpecialWords_Operations_else = createOperationsTests(`/special-words/operations/else`);
Scenarios.SpecialWords_Operations_except = createOperationsTests(
  `/special-words/operations/except`,
);
Scenarios.SpecialWords_Operations_exec = createOperationsTests(`/special-words/operations/exec`);
Scenarios.SpecialWords_Operations_finally = createOperationsTests(
  `/special-words/operations/finally`,
);
Scenarios.SpecialWords_Operations_for = createOperationsTests(`/special-words/operations/for`);
Scenarios.SpecialWords_Operations_from = createOperationsTests(`/special-words/operations/from`);
Scenarios.SpecialWords_Operations_global = createOperationsTests(
  `/special-words/operations/global`,
);
Scenarios.SpecialWords_Operations_if = createOperationsTests(`/special-words/operations/if`);
Scenarios.SpecialWords_Operations_import = createOperationsTests(
  `/special-words/operations/import`,
);
Scenarios.SpecialWords_Operations_in = createOperationsTests(`/special-words/operations/in`);
Scenarios.SpecialWords_Operations_is = createOperationsTests(`/special-words/operations/is`);
Scenarios.SpecialWords_Operations_lambda = createOperationsTests(
  `/special-words/operations/lambda`,
);
Scenarios.SpecialWords_Operations_not = createOperationsTests(`/special-words/operations/not`);
Scenarios.SpecialWords_Operations_or = createOperationsTests(`/special-words/operations/or`);
Scenarios.SpecialWords_Operations_pass = createOperationsTests(`/special-words/operations/pass`);
Scenarios.SpecialWords_Operations_raise = createOperationsTests(`/special-words/operations/raise`);
Scenarios.SpecialWords_Operations_return = createOperationsTests(
  `/special-words/operations/return`,
);
Scenarios.SpecialWords_Operations_try = createOperationsTests(`/special-words/operations/try`);
Scenarios.SpecialWords_Operations_while = createOperationsTests(`/special-words/operations/while`);
Scenarios.SpecialWords_Operations_with = createOperationsTests(`/special-words/operations/with`);
Scenarios.SpecialWords_Operations_yield = createOperationsTests(`/special-words/operations/yield`);
Scenarios.SpecialWords_Operations_any = createOperationsTests(`/special-words/operations/any`);
Scenarios.SpecialWords_Operations_apiVersion = createOperationsTests(`/special-words/operations/apiVersion`);
Scenarios.SpecialWords_Operations_arguments = createOperationsTests(`/special-words/operations/arguments`);
Scenarios.SpecialWords_Operations_boolean = createOperationsTests(`/special-words/operations/boolean`);
Scenarios.SpecialWords_Operations_case = createOperationsTests(`/special-words/operations/case`);
Scenarios.SpecialWords_Operations_catch = createOperationsTests(`/special-words/operations/catch`);
Scenarios.SpecialWords_Operations_client = createOperationsTests(`/special-words/operations/client`);
Scenarios.SpecialWords_Operations_const = createOperationsTests(`/special-words/operations/const`);
Scenarios.SpecialWords_Operations_date = createOperationsTests(`/special-words/operations/date`);
Scenarios.SpecialWords_Operations_debugger = createOperationsTests(`/special-words/operations/debugger`);
Scenarios.SpecialWords_Operations_declare = createOperationsTests(`/special-words/operations/declare`);
Scenarios.SpecialWords_Operations_default = createOperationsTests(`/special-words/operations/default`);
Scenarios.SpecialWords_Operations_delete = createOperationsTests(`/special-words/operations/delete`);
Scenarios.SpecialWords_Operations_do = createOperationsTests(`/special-words/operations/do`);
Scenarios.SpecialWords_Operations_endpoint = createOperationsTests(`/special-words/operations/endpoint`);
Scenarios.SpecialWords_Operations_enum = createOperationsTests(`/special-words/operations/enum`);
Scenarios.SpecialWords_Operations_error = createOperationsTests(`/special-words/operations/error`);
Scenarios.SpecialWords_Operations_export = createOperationsTests(`/special-words/operations/export`);
Scenarios.SpecialWords_Operations_extends = createOperationsTests(`/special-words/operations/extends`);
Scenarios.SpecialWords_Operations_false = createOperationsTests(`/special-words/operations/false`);
Scenarios.SpecialWords_Operations_function = createOperationsTests(`/special-words/operations/function`);
Scenarios.SpecialWords_Operations_get = createOperationsTests(`/special-words/operations/get`);
Scenarios.SpecialWords_Operations_implements = createOperationsTests(`/special-words/operations/implements`);
Scenarios.SpecialWords_Operations_instanceof = createOperationsTests(`/special-words/operations/instanceof`);
Scenarios.SpecialWords_Operations_interface = createOperationsTests(`/special-words/operations/interface`);
Scenarios.SpecialWords_Operations_let = createOperationsTests(`/special-words/operations/let`);
Scenarios.SpecialWords_Operations_module = createOperationsTests(`/special-words/operations/module`);
Scenarios.SpecialWords_Operations_new = createOperationsTests(`/special-words/operations/new`);
Scenarios.SpecialWords_Operations_null = createOperationsTests(`/special-words/operations/null`);
Scenarios.SpecialWords_Operations_number = createOperationsTests(`/special-words/operations/number`);
Scenarios.SpecialWords_Operations_of = createOperationsTests(`/special-words/operations/of`);
Scenarios.SpecialWords_Operations_package = createOperationsTests(`/special-words/operations/package`);
Scenarios.SpecialWords_Operations_private = createOperationsTests(`/special-words/operations/private`);
Scenarios.SpecialWords_Operations_protected = createOperationsTests(`/special-words/operations/protected`);
Scenarios.SpecialWords_Operations_public = createOperationsTests(`/special-words/operations/public`);
Scenarios.SpecialWords_Operations_requestoptions = createOperationsTests(`/special-words/operations/requestoptions`);
Scenarios.SpecialWords_Operations_require = createOperationsTests(`/special-words/operations/require`);
Scenarios.SpecialWords_Operations_set = createOperationsTests(`/special-words/operations/set`);
Scenarios.SpecialWords_Operations_static = createOperationsTests(`/special-words/operations/static`);
Scenarios.SpecialWords_Operations_string = createOperationsTests(`/special-words/operations/string`);
Scenarios.SpecialWords_Operations_super = createOperationsTests(`/special-words/operations/super`);
Scenarios.SpecialWords_Operations_switch = createOperationsTests(`/special-words/operations/switch`);
Scenarios.SpecialWords_Operations_symbol = createOperationsTests(`/special-words/operations/symbol`);
Scenarios.SpecialWords_Operations_this = createOperationsTests(`/special-words/operations/this`);
Scenarios.SpecialWords_Operations_throw = createOperationsTests(`/special-words/operations/throw`);
Scenarios.SpecialWords_Operations_true = createOperationsTests(`/special-words/operations/true`);
Scenarios.SpecialWords_Operations_type = createOperationsTests(`/special-words/operations/type`);
Scenarios.SpecialWords_Operations_typeof = createOperationsTests(`/special-words/operations/typeof`);
Scenarios.SpecialWords_Operations_var = createOperationsTests(`/special-words/operations/var`);
Scenarios.SpecialWords_Operations_void = createOperationsTests(`/special-words/operations/void`);

function createParametersTests(uri: string, data: any, paramName: string) {
  return passOnSuccess({
    uri,
    method: "get",
    request: {
      query: data,
    },
    response: {
      status: 204,
    },
    kind: "MockApiDefinition",
  });
}

Scenarios.SpecialWords_Parameters_and = createParametersTests(
  `/special-words/parameters/and`,
  {
    and: "ok",
  },
  "and",
);
Scenarios.SpecialWords_Parameters_as = createParametersTests(
  `/special-words/parameters/as`,
  {
    as: "ok",
  },
  "as",
);
Scenarios.SpecialWords_Parameters_assert = createParametersTests(
  `/special-words/parameters/assert`,
  {
    assert: "ok",
  },
  "assert",
);
Scenarios.SpecialWords_Parameters_async = createParametersTests(
  `/special-words/parameters/async`,
  {
    async: "ok",
  },
  "async",
);
Scenarios.SpecialWords_Parameters_await = createParametersTests(
  `/special-words/parameters/await`,
  {
    await: "ok",
  },
  "await",
);
Scenarios.SpecialWords_Parameters_break = createParametersTests(
  `/special-words/parameters/break`,
  {
    break: "ok",
  },
  "break",
);
Scenarios.SpecialWords_Parameters_class = createParametersTests(
  `/special-words/parameters/class`,
  {
    class: "ok",
  },
  "class",
);
Scenarios.SpecialWords_Parameters_constructor = createParametersTests(
  `/special-words/parameters/constructor`,
  {
    constructor: "ok",
  },
  "constructor",
);
Scenarios.SpecialWords_Parameters_continue = createParametersTests(
  `/special-words/parameters/continue`,
  {
    continue: "ok",
  },
  "continue",
);
Scenarios.SpecialWords_Parameters_def = createParametersTests(
  `/special-words/parameters/def`,
  {
    def: "ok",
  },
  "def",
);
Scenarios.SpecialWords_Parameters_del = createParametersTests(
  `/special-words/parameters/del`,
  {
    del: "ok",
  },
  "del",
);
Scenarios.SpecialWords_Parameters_elif = createParametersTests(
  `/special-words/parameters/elif`,
  {
    elif: "ok",
  },
  "elif",
);
Scenarios.SpecialWords_Parameters_else = createParametersTests(
  `/special-words/parameters/else`,
  {
    else: "ok",
  },
  "else",
);
Scenarios.SpecialWords_Parameters_except = createParametersTests(
  `/special-words/parameters/except`,
  {
    except: "ok",
  },
  "except",
);
Scenarios.SpecialWords_Parameters_exec = createParametersTests(
  `/special-words/parameters/exec`,
  {
    exec: "ok",
  },
  "exec",
);
Scenarios.SpecialWords_Parameters_finally = createParametersTests(
  `/special-words/parameters/finally`,
  {
    finally: "ok",
  },
  "finally",
);

Scenarios.SpecialWords_Parameters_for = createParametersTests(
  `/special-words/parameters/for`,
  {
    for: "ok",
  },
  "for",
);
Scenarios.SpecialWords_Parameters_from = createParametersTests(
  `/special-words/parameters/from`,
  {
    from: "ok",
  },
  "from",
);
Scenarios.SpecialWords_Parameters_global = createParametersTests(
  `/special-words/parameters/global`,
  {
    global: "ok",
  },
  "global",
);
Scenarios.SpecialWords_Parameters_if = createParametersTests(
  `/special-words/parameters/if`,
  {
    if: "ok",
  },
  "if",
);
Scenarios.SpecialWords_Parameters_import = createParametersTests(
  `/special-words/parameters/import`,
  {
    import: "ok",
  },
  "import",
);
Scenarios.SpecialWords_Parameters_in = createParametersTests(
  `/special-words/parameters/in`,
  {
    in: "ok",
  },
  "in",
);
Scenarios.SpecialWords_Parameters_is = createParametersTests(
  `/special-words/parameters/is`,
  {
    is: "ok",
  },
  "is",
);
Scenarios.SpecialWords_Parameters_lambda = createParametersTests(
  `/special-words/parameters/lambda`,
  {
    lambda: "ok",
  },
  "lambda",
);
Scenarios.SpecialWords_Parameters_not = createParametersTests(
  `/special-words/parameters/not`,
  {
    not: "ok",
  },
  "not",
);
Scenarios.SpecialWords_Parameters_or = createParametersTests(
  `/special-words/parameters/or`,
  {
    or: "ok",
  },
  "or",
);
Scenarios.SpecialWords_Parameters_pass = createParametersTests(
  `/special-words/parameters/pass`,
  {
    pass: "ok",
  },
  "pass",
);
Scenarios.SpecialWords_Parameters_raise = createParametersTests(
  `/special-words/parameters/raise`,
  {
    raise: "ok",
  },
  "raise",
);
Scenarios.SpecialWords_Parameters_return = createParametersTests(
  `/special-words/parameters/return`,
  {
    return: "ok",
  },
  "return",
);
Scenarios.SpecialWords_Parameters_try = createParametersTests(
  `/special-words/parameters/try`,
  {
    try: "ok",
  },
  "try",
);
Scenarios.SpecialWords_Parameters_while = createParametersTests(
  `/special-words/parameters/while`,
  {
    while: "ok",
  },
  "while",
);
Scenarios.SpecialWords_Parameters_with = createParametersTests(
  `/special-words/parameters/with`,
  {
    with: "ok",
  },
  "with",
);
Scenarios.SpecialWords_Parameters_yield = createParametersTests(
  `/special-words/parameters/yield`,
  {
    yield: "ok",
  },
  "yield",
);
Scenarios.SpecialWords_Parameters_any = createParametersTests(
  `/special-words/parameters/any`,
  {
    any: "ok",
  },
  "any",
);
Scenarios.SpecialWords_Parameters_apiVersion = createParametersTests(
  `/special-words/parameters/apiVersion`,
  {
    apiVersion: "ok",
  },
  "apiVersion",
);
Scenarios.SpecialWords_Parameters_arguments = createParametersTests(
  `/special-words/parameters/arguments`,
  {
    arguments: "ok",
  },
  "arguments",
);
Scenarios.SpecialWords_Parameters_boolean = createParametersTests(
  `/special-words/parameters/boolean`,
  {
    boolean: "ok",
  },
  "boolean",
);
Scenarios.SpecialWords_Parameters_case = createParametersTests(
  `/special-words/parameters/case`,
  {
    case: "ok",
  },
  "case",
);
Scenarios.SpecialWords_Parameters_catch = createParametersTests(
  `/special-words/parameters/catch`,
  {
    catch: "ok",
  },
  "catch",
);
Scenarios.SpecialWords_Parameters_client = createParametersTests(
  `/special-words/parameters/client`,
  {
    client: "ok",
  },
  "client",
);
Scenarios.SpecialWords_Parameters_const = createParametersTests(
  `/special-words/parameters/const`,
  {
    const: "ok",
  },
  "const",
);
Scenarios.SpecialWords_Parameters_date = createParametersTests(
  `/special-words/parameters/date`,
  {
    date: "ok",
  },
  "date",
);
Scenarios.SpecialWords_Parameters_debugger = createParametersTests(
  `/special-words/parameters/debugger`,
  {
    debugger: "ok",
  },
  "debugger",
);
Scenarios.SpecialWords_Parameters_declare = createParametersTests(
  `/special-words/parameters/declare`,
  {
    declare: "ok",
  },
  "declare",
);
Scenarios.SpecialWords_Parameters_default = createParametersTests(
  `/special-words/parameters/default`,
  {
    default: "ok",
  },
  "default",
);
Scenarios.SpecialWords_Parameters_delete = createParametersTests(
  `/special-words/parameters/delete`,
  {
    delete: "ok",
  },
  "delete",
);
Scenarios.SpecialWords_Parameters_do = createParametersTests(
  `/special-words/parameters/do`,
  {
    do: "ok",
  },
  "do",
);
Scenarios.SpecialWords_Parameters_endpoint = createParametersTests(
  `/special-words/parameters/endpoint`,
  {
    endpoint: "ok",
  },
  "endpoint",
);
Scenarios.SpecialWords_Parameters_enum = createParametersTests(
  `/special-words/parameters/enum`,
  {
    enum: "ok",
  },
  "enum",
);
Scenarios.SpecialWords_Parameters_error = createParametersTests(
  `/special-words/parameters/error`,
  {
    error: "ok",
  },
  "error",
);
Scenarios.SpecialWords_Parameters_export = createParametersTests(
  `/special-words/parameters/export`,
  {
    export: "ok",
  },
  "export",
);
Scenarios.SpecialWords_Parameters_extends = createParametersTests(
  `/special-words/parameters/extends`,
  {
    extends: "ok",
  },
  "extends",
);
Scenarios.SpecialWords_Parameters_false = createParametersTests(
  `/special-words/parameters/false`,
  {
    false: "ok",
  },
  "false",
);
Scenarios.SpecialWords_Parameters_function = createParametersTests(
  `/special-words/parameters/function`,
  {
    function: "ok",
  },
  "function",
);
Scenarios.SpecialWords_Parameters_get = createParametersTests(
  `/special-words/parameters/get`,
  {
    get: "ok",
  },
  "get",
);
Scenarios.SpecialWords_Parameters_implements = createParametersTests(
  `/special-words/parameters/implements`,
  {
    implements: "ok",
  },
  "implements",
);
Scenarios.SpecialWords_Parameters_instanceof = createParametersTests(
  `/special-words/parameters/instanceof`,
  {
    instanceof: "ok",
  },
  "instanceof",
);
Scenarios.SpecialWords_Parameters_interface = createParametersTests(
  `/special-words/parameters/interface`,
  {
    interface: "ok",
  },
  "interface",
);
Scenarios.SpecialWords_Parameters_let = createParametersTests(
  `/special-words/parameters/let`,
  {
    let: "ok",
  },
  "let",
);
Scenarios.SpecialWords_Parameters_module = createParametersTests(
  `/special-words/parameters/module`,
  {
    module: "ok",
  },
  "module",
);
Scenarios.SpecialWords_Parameters_new = createParametersTests(
  `/special-words/parameters/new`,
  {
    new: "ok",
  },
  "new",
);
Scenarios.SpecialWords_Parameters_null = createParametersTests(
  `/special-words/parameters/null`,
  {
    null: "ok",
  },
  "null",
);
Scenarios.SpecialWords_Parameters_number = createParametersTests(
  `/special-words/parameters/number`,
  {
    number: "ok",
  },
  "number",
);
Scenarios.SpecialWords_Parameters_of = createParametersTests(
  `/special-words/parameters/of`,
  {
    of: "ok",
  },
  "of",
);
Scenarios.SpecialWords_Parameters_package = createParametersTests(
  `/special-words/parameters/package`,
  {
    package: "ok",
  },
  "package",
);
Scenarios.SpecialWords_Parameters_private = createParametersTests(
  `/special-words/parameters/private`,
  {
    private: "ok",
  },
  "private",
);
Scenarios.SpecialWords_Parameters_protected = createParametersTests(
  `/special-words/parameters/protected`,
  {
    protected: "ok",
  },
  "protected",
);
Scenarios.SpecialWords_Parameters_public = createParametersTests(
  `/special-words/parameters/public`,
  {
    public: "ok",
  },
  "public",
);
Scenarios.SpecialWords_Parameters_requestoptions = createParametersTests(
  `/special-words/parameters/requestoptions`,
  {
    requestoptions: "ok",
  },
  "requestoptions",
);
Scenarios.SpecialWords_Parameters_require = createParametersTests(
  `/special-words/parameters/require`,
  {
    require: "ok",
  },
  "require",
);
Scenarios.SpecialWords_Parameters_set = createParametersTests(
  `/special-words/parameters/set`,
  {
    set: "ok",
  },
  "set",
);
Scenarios.SpecialWords_Parameters_static = createParametersTests(
  `/special-words/parameters/static`,
  {
    static: "ok",
  },
  "static",
);
Scenarios.SpecialWords_Parameters_string = createParametersTests(
  `/special-words/parameters/string`,
  {
    string: "ok",
  },
  "string",
);
Scenarios.SpecialWords_Parameters_super = createParametersTests(
  `/special-words/parameters/super`,
  {
    super: "ok",
  },
  "super",
);
Scenarios.SpecialWords_Parameters_switch = createParametersTests(
  `/special-words/parameters/switch`,
  {
    switch: "ok",
  },
  "switch",
);
Scenarios.SpecialWords_Parameters_symbol = createParametersTests(
  `/special-words/parameters/symbol`,
  {
    symbol: "ok",
  },
  "symbol",
);
Scenarios.SpecialWords_Parameters_this = createParametersTests(
  `/special-words/parameters/this`,
  {
    this: "ok",
  },
  "this",
);
Scenarios.SpecialWords_Parameters_throw = createParametersTests(
  `/special-words/parameters/throw`,
  {
    throw: "ok",
  },
  "throw",
);
Scenarios.SpecialWords_Parameters_true = createParametersTests(
  `/special-words/parameters/true`,
  {
    true: "ok",
  },
  "true",
);
Scenarios.SpecialWords_Parameters_type = createParametersTests(
  `/special-words/parameters/type`,
  {
    type: "ok",
  },
  "type",
);
Scenarios.SpecialWords_Parameters_typeof = createParametersTests(
  `/special-words/parameters/typeof`,
  {
    typeof: "ok",
  },
  "typeof",
);
Scenarios.SpecialWords_Parameters_var = createParametersTests(
  `/special-words/parameters/var`,
  {
    var: "ok",
  },
  "var",
);
Scenarios.SpecialWords_Parameters_void = createParametersTests(
  `/special-words/parameters/void`,
  {
    void: "ok",
  },
  "void",
);
Scenarios.SpecialWords_Parameters_cancellationToken = createParametersTests(
  `/special-words/parameters/cancellationToken`,
  {
    cancellationToken: "ok",
  },
  "cancellationToken",
);
