import { MockRequest, passOnSuccess, ScenarioMockApi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

Scenarios.Special_Words_Model_Properties_Same_As_Model = passOnSuccess({
  uri: "/special-words/model-properties/same-as-model",
  mockMethods: [
    {
      method: "post",
      request: {
        body: {
          SameAsModel: "ok",
        },
      },
      response: {
        status: 204,
      },
      handler: (req: MockRequest) => {
        req.expect.bodyEquals({ ["SameAsModel"]: "ok" });
        return {
          status: 204,
        };
      },
    },
  ],
  kind: "MockApiDefinition",
});

function createModelsTests(uri: string) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "post",
        request: {
          body: {
            name: "ok",
          },
        },
        response: {
          status: 204,
        },
        handler: (req: MockRequest) => {
          req.expect.bodyEquals({ name: "ok" });
          return {
            status: 204,
          };
        },
      },
    ],
    kind: "MockApiDefinition",
  });
}
Scenarios.Special_Words_Models_And = createModelsTests(`/special-words/models/and`);
Scenarios.Special_Words_Models_As = createModelsTests(`/special-words/models/as`);
Scenarios.Special_Words_Models_Assert = createModelsTests(`/special-words/models/assert`);
Scenarios.Special_Words_Models_Async = createModelsTests(`/special-words/models/async`);
Scenarios.Special_Words_Models_Await = createModelsTests(`/special-words/models/await`);
Scenarios.Special_Words_Models_Break = createModelsTests(`/special-words/models/break`);
Scenarios.Special_Words_Models_Class = createModelsTests(`/special-words/models/class`);
Scenarios.Special_Words_Models_Constructor = createModelsTests(`/special-words/models/constructor`);
Scenarios.Special_Words_Models_Continue = createModelsTests(`/special-words/models/continue`);
Scenarios.Special_Words_Models_Def = createModelsTests(`/special-words/models/def`);
Scenarios.Special_Words_Models_Del = createModelsTests(`/special-words/models/del`);
Scenarios.Special_Words_Models_Elif = createModelsTests(`/special-words/models/elif`);
Scenarios.Special_Words_Models_Else = createModelsTests(`/special-words/models/else`);
Scenarios.Special_Words_Models_Except = createModelsTests(`/special-words/models/except`);
Scenarios.Special_Words_Models_Exec = createModelsTests(`/special-words/models/exec`);
Scenarios.Special_Words_Models_Finally = createModelsTests(`/special-words/models/finally`);
Scenarios.Special_Words_Models_For = createModelsTests(`/special-words/models/for`);
Scenarios.Special_Words_Models_From = createModelsTests(`/special-words/models/from`);
Scenarios.Special_Words_Models_Global = createModelsTests(`/special-words/models/global`);
Scenarios.Special_Words_Models_If = createModelsTests(`/special-words/models/if`);
Scenarios.Special_Words_Models_Import = createModelsTests(`/special-words/models/import`);
Scenarios.Special_Words_Models_In = createModelsTests(`/special-words/models/in`);
Scenarios.Special_Words_Models_Is = createModelsTests(`/special-words/models/is`);
Scenarios.Special_Words_Models_Lambda = createModelsTests(`/special-words/models/lambda`);
Scenarios.Special_Words_Models_Not = createModelsTests(`/special-words/models/not`);
Scenarios.Special_Words_Models_Or = createModelsTests(`/special-words/models/or`);
Scenarios.Special_Words_Models_Pass = createModelsTests(`/special-words/models/pass`);
Scenarios.Special_Words_Models_Raise = createModelsTests(`/special-words/models/raise`);
Scenarios.Special_Words_Models_Return = createModelsTests(`/special-words/models/return`);
Scenarios.Special_Words_Models_Try = createModelsTests(`/special-words/models/try`);
Scenarios.Special_Words_Models_While = createModelsTests(`/special-words/models/while`);
Scenarios.Special_Words_Models_With = createModelsTests(`/special-words/models/with`);
Scenarios.Special_Words_Models_Yield = createModelsTests(`/special-words/models/yield`);

function createOperationsTests(uri: string) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {},
        response: {
          status: 204,
        },
        handler: (req: MockRequest) => {
          return {
            status: 204,
          };
        },
      },
    ],
    kind: "MockApiDefinition",
  });
}

Scenarios.Special_Words_Operations_And = createOperationsTests(`/special-words/operations/and`);
Scenarios.Special_Words_Operations_As = createOperationsTests(`/special-words/operations/as`);
Scenarios.Special_Words_Operations_Assert = createOperationsTests(
  `/special-words/operations/assert`,
);
Scenarios.Special_Words_Operations_Async = createOperationsTests(`/special-words/operations/async`);
Scenarios.Special_Words_Operations_Await = createOperationsTests(`/special-words/operations/await`);
Scenarios.Special_Words_Operations_Break = createOperationsTests(`/special-words/operations/break`);
Scenarios.Special_Words_Operations_Class = createOperationsTests(`/special-words/operations/class`);
Scenarios.Special_Words_Operations_Constructor = createOperationsTests(
  `/special-words/operations/constructor`,
);
Scenarios.Special_Words_Operations_Continue = createOperationsTests(
  `/special-words/operations/continue`,
);
Scenarios.Special_Words_Operations_Def = createOperationsTests(`/special-words/operations/def`);
Scenarios.Special_Words_Operations_Del = createOperationsTests(`/special-words/operations/del`);
Scenarios.Special_Words_Operations_Elif = createOperationsTests(`/special-words/operations/elif`);
Scenarios.Special_Words_Operations_Else = createOperationsTests(`/special-words/operations/else`);
Scenarios.Special_Words_Operations_Except = createOperationsTests(
  `/special-words/operations/except`,
);
Scenarios.Special_Words_Operations_Exec = createOperationsTests(`/special-words/operations/exec`);
Scenarios.Special_Words_Operations_Finally = createOperationsTests(
  `/special-words/operations/finally`,
);
Scenarios.Special_Words_Operations_For = createOperationsTests(`/special-words/operations/for`);
Scenarios.Special_Words_Operations_From = createOperationsTests(`/special-words/operations/from`);
Scenarios.Special_Words_Operations_Global = createOperationsTests(
  `/special-words/operations/global`,
);
Scenarios.Special_Words_Operations_If = createOperationsTests(`/special-words/operations/if`);
Scenarios.Special_Words_Operations_Import = createOperationsTests(
  `/special-words/operations/import`,
);
Scenarios.Special_Words_Operations_In = createOperationsTests(`/special-words/operations/in`);
Scenarios.Special_Words_Operations_Is = createOperationsTests(`/special-words/operations/is`);
Scenarios.Special_Words_Operations_Lambda = createOperationsTests(
  `/special-words/operations/lambda`,
);
Scenarios.Special_Words_Operations_Not = createOperationsTests(`/special-words/operations/not`);
Scenarios.Special_Words_Operations_Or = createOperationsTests(`/special-words/operations/or`);
Scenarios.Special_Words_Operations_Pass = createOperationsTests(`/special-words/operations/pass`);
Scenarios.Special_Words_Operations_Raise = createOperationsTests(`/special-words/operations/raise`);
Scenarios.Special_Words_Operations_Return = createOperationsTests(
  `/special-words/operations/return`,
);
Scenarios.Special_Words_Operations_Try = createOperationsTests(`/special-words/operations/try`);
Scenarios.Special_Words_Operations_While = createOperationsTests(`/special-words/operations/while`);
Scenarios.Special_Words_Operations_With = createOperationsTests(`/special-words/operations/with`);
Scenarios.Special_Words_Operations_Yield = createOperationsTests(`/special-words/operations/yield`);

function createParametersTests(uri: string, data: any, paramName: string) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {
          params: data,
        },
        response: {
          status: 204,
        },
        handler: (req: MockRequest) => {
          req.expect.containsQueryParam(paramName, "ok");
          return {
            status: 204,
          };
        },
      },
    ],
    kind: "MockApiDefinition",
  });
}

Scenarios.Special_Words_Parameters_And = createParametersTests(
  `/special-words/parameters/and`,
  {
    and: "ok",
  },
  "and",
);
Scenarios.Special_Words_Parameters_As = createParametersTests(
  `/special-words/parameters/as`,
  {
    as: "ok",
  },
  "as",
);
Scenarios.Special_Words_Parameters_Assert = createParametersTests(
  `/special-words/parameters/assert`,
  {
    assert: "ok",
  },
  "assert",
);
Scenarios.Special_Words_Parameters_Async = createParametersTests(
  `/special-words/parameters/async`,
  {
    async: "ok",
  },
  "async",
);
Scenarios.Special_Words_Parameters_Await = createParametersTests(
  `/special-words/parameters/await`,
  {
    await: "ok",
  },
  "await",
);
Scenarios.Special_Words_Parameters_Break = createParametersTests(
  `/special-words/parameters/break`,
  {
    break: "ok",
  },
  "break",
);
Scenarios.Special_Words_Parameters_Class = createParametersTests(
  `/special-words/parameters/class`,
  {
    class: "ok",
  },
  "class",
);
Scenarios.Special_Words_Parameters_Constructor = createParametersTests(
  `/special-words/parameters/constructor`,
  {
    constructor: "ok",
  },
  "constructor",
);
Scenarios.Special_Words_Parameters_Continue = createParametersTests(
  `/special-words/parameters/continue`,
  {
    continue: "ok",
  },
  "continue",
);
Scenarios.Special_Words_Parameters_Def = createParametersTests(
  `/special-words/parameters/def`,
  {
    def: "ok",
  },
  "def",
);
Scenarios.Special_Words_Parameters_Del = createParametersTests(
  `/special-words/parameters/del`,
  {
    del: "ok",
  },
  "del",
);
Scenarios.Special_Words_Parameters_Elif = createParametersTests(
  `/special-words/parameters/elif`,
  {
    elif: "ok",
  },
  "elif",
);
Scenarios.Special_Words_Parameters_Else = createParametersTests(
  `/special-words/parameters/else`,
  {
    else: "ok",
  },
  "else",
);
Scenarios.Special_Words_Parameters_Except = createParametersTests(
  `/special-words/parameters/except`,
  {
    except: "ok",
  },
  "except",
);
Scenarios.Special_Words_Parameters_Exec = createParametersTests(
  `/special-words/parameters/exec`,
  {
    exec: "ok",
  },
  "exec",
);
Scenarios.Special_Words_Parameters_Finally = createParametersTests(
  `/special-words/parameters/finally`,
  {
    finally: "ok",
  },
  "finally",
);

Scenarios.Special_Words_Parameters_For = createParametersTests(
  `/special-words/parameters/for`,
  {
    for: "ok",
  },
  "for",
);
Scenarios.Special_Words_Parameters_From = createParametersTests(
  `/special-words/parameters/from`,
  {
    from: "ok",
  },
  "from",
);
Scenarios.Special_Words_Parameters_Global = createParametersTests(
  `/special-words/parameters/global`,
  {
    global: "ok",
  },
  "global",
);
Scenarios.Special_Words_Parameters_If = createParametersTests(
  `/special-words/parameters/if`,
  {
    if: "ok",
  },
  "if",
);
Scenarios.Special_Words_Parameters_Import = createParametersTests(
  `/special-words/parameters/import`,
  {
    import: "ok",
  },
  "import",
);
Scenarios.Special_Words_Parameters_In = createParametersTests(
  `/special-words/parameters/in`,
  {
    in: "ok",
  },
  "in",
);
Scenarios.Special_Words_Parameters_Is = createParametersTests(
  `/special-words/parameters/is`,
  {
    is: "ok",
  },
  "is",
);
Scenarios.Special_Words_Parameters_Lambda = createParametersTests(
  `/special-words/parameters/lambda`,
  {
    lambda: "ok",
  },
  "lambda",
);
Scenarios.Special_Words_Parameters_Not = createParametersTests(
  `/special-words/parameters/not`,
  {
    not: "ok",
  },
  "not",
);
Scenarios.Special_Words_Parameters_Or = createParametersTests(
  `/special-words/parameters/or`,
  {
    or: "ok",
  },
  "or",
);
Scenarios.Special_Words_Parameters_Pass = createParametersTests(
  `/special-words/parameters/pass`,
  {
    pass: "ok",
  },
  "pass",
);
Scenarios.Special_Words_Parameters_Raise = createParametersTests(
  `/special-words/parameters/raise`,
  {
    raise: "ok",
  },
  "raise",
);
Scenarios.Special_Words_Parameters_Return = createParametersTests(
  `/special-words/parameters/return`,
  {
    return: "ok",
  },
  "return",
);
Scenarios.Special_Words_Parameters_Try = createParametersTests(
  `/special-words/parameters/try`,
  {
    try: "ok",
  },
  "try",
);
Scenarios.Special_Words_Parameters_While = createParametersTests(
  `/special-words/parameters/while`,
  {
    while: "ok",
  },
  "while",
);
Scenarios.Special_Words_Parameters_With = createParametersTests(
  `/special-words/parameters/with`,
  {
    with: "ok",
  },
  "with",
);
Scenarios.Special_Words_Parameters_Yield = createParametersTests(
  `/special-words/parameters/yield`,
  {
    yield: "ok",
  },
  "yield",
);
Scenarios.Special_Words_Parameters_Cancellation_Token = createParametersTests(
  `/special-words/parameters/cancellationToken`,
  {
    cancellationToken: "ok",
  },
  "cancellationToken",
);
