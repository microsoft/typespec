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
Scenarios.SpecialWords_Parameters_cancellationToken = createParametersTests(
  `/special-words/parameters/cancellationToken`,
  {
    cancellationToken: "ok",
  },
  "cancellationToken",
);
