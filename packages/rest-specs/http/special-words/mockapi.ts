import { passOnSuccess, ScenarioMockApi, mockapi } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

// ------------------------------------------------------------------------
// Operation name scenarios
// ------------------------------------------------------------------------
function opNameScenario(name: string) {
  return passOnSuccess(
    mockapi.get(`/special-words/operations/${name}`, (req) => {
      return {
        status: 204,
      };
    }),
  );
}

Scenarios.SpecialWords_Operations_and = opNameScenario("and");
Scenarios.SpecialWords_Operations_as = opNameScenario("as");
Scenarios.SpecialWords_Operations_assert = opNameScenario("assert");
Scenarios.SpecialWords_Operations_async = opNameScenario("async");
Scenarios.SpecialWords_Operations_await = opNameScenario("await");
Scenarios.SpecialWords_Operations_break = opNameScenario("break");
Scenarios.SpecialWords_Operations_class = opNameScenario("class");
Scenarios.SpecialWords_Operations_constructor = opNameScenario("constructor");
Scenarios.SpecialWords_Operations_continue = opNameScenario("continue");
Scenarios.SpecialWords_Operations_def = opNameScenario("def");
Scenarios.SpecialWords_Operations_del = opNameScenario("del");
Scenarios.SpecialWords_Operations_elif = opNameScenario("elif");
Scenarios.SpecialWords_Operations_else = opNameScenario("else");
Scenarios.SpecialWords_Operations_except = opNameScenario("except");
Scenarios.SpecialWords_Operations_exec = opNameScenario("exec");
Scenarios.SpecialWords_Operations_finally = opNameScenario("finally");
Scenarios.SpecialWords_Operations_for = opNameScenario("for");
Scenarios.SpecialWords_Operations_from = opNameScenario("from");
Scenarios.SpecialWords_Operations_global = opNameScenario("global");
Scenarios.SpecialWords_Operations_if = opNameScenario("if");
Scenarios.SpecialWords_Operations_import = opNameScenario("import");
Scenarios.SpecialWords_Operations_in = opNameScenario("in");
Scenarios.SpecialWords_Operations_is = opNameScenario("is");
Scenarios.SpecialWords_Operations_lambda = opNameScenario("lambda");
Scenarios.SpecialWords_Operations_not = opNameScenario("not");
Scenarios.SpecialWords_Operations_or = opNameScenario("or");
Scenarios.SpecialWords_Operations_pass = opNameScenario("pass");
Scenarios.SpecialWords_Operations_raise = opNameScenario("raise");
Scenarios.SpecialWords_Operations_return = opNameScenario("return");
Scenarios.SpecialWords_Operations_try = opNameScenario("try");
Scenarios.SpecialWords_Operations_while = opNameScenario("while");
Scenarios.SpecialWords_Operations_with = opNameScenario("with");
Scenarios.SpecialWords_Operations_yield = opNameScenario("yield");

// ------------------------------------------------------------------------
// Parameter name scenarios
// ------------------------------------------------------------------------
function paramNameScenario(name: string) {
  return passOnSuccess(
    mockapi.get(`/special-words/parameters/${name}`, (req) => {
      req.expect.containsQueryParam(name, "ok");
      return {
        status: 204,
      };
    }),
  );
}

Scenarios.SpecialWords_Parameters_and = paramNameScenario("and");
Scenarios.SpecialWords_Parameters_as = paramNameScenario("as");
Scenarios.SpecialWords_Parameters_assert = paramNameScenario("assert");
Scenarios.SpecialWords_Parameters_async = paramNameScenario("async");
Scenarios.SpecialWords_Parameters_await = paramNameScenario("await");
Scenarios.SpecialWords_Parameters_break = paramNameScenario("break");
Scenarios.SpecialWords_Parameters_class = paramNameScenario("class");
Scenarios.SpecialWords_Parameters_constructor = paramNameScenario("constructor");
Scenarios.SpecialWords_Parameters_continue = paramNameScenario("continue");
Scenarios.SpecialWords_Parameters_def = paramNameScenario("def");
Scenarios.SpecialWords_Parameters_del = paramNameScenario("del");
Scenarios.SpecialWords_Parameters_elif = paramNameScenario("elif");
Scenarios.SpecialWords_Parameters_else = paramNameScenario("else");
Scenarios.SpecialWords_Parameters_except = paramNameScenario("except");
Scenarios.SpecialWords_Parameters_exec = paramNameScenario("exec");
Scenarios.SpecialWords_Parameters_finally = paramNameScenario("finally");
Scenarios.SpecialWords_Parameters_for = paramNameScenario("for");
Scenarios.SpecialWords_Parameters_from = paramNameScenario("from");
Scenarios.SpecialWords_Parameters_global = paramNameScenario("global");
Scenarios.SpecialWords_Parameters_if = paramNameScenario("if");
Scenarios.SpecialWords_Parameters_import = paramNameScenario("import");
Scenarios.SpecialWords_Parameters_in = paramNameScenario("in");
Scenarios.SpecialWords_Parameters_is = paramNameScenario("is");
Scenarios.SpecialWords_Parameters_lambda = paramNameScenario("lambda");
Scenarios.SpecialWords_Parameters_not = paramNameScenario("not");
Scenarios.SpecialWords_Parameters_or = paramNameScenario("or");
Scenarios.SpecialWords_Parameters_pass = paramNameScenario("pass");
Scenarios.SpecialWords_Parameters_raise = paramNameScenario("raise");
Scenarios.SpecialWords_Parameters_return = paramNameScenario("return");
Scenarios.SpecialWords_Parameters_try = paramNameScenario("try");
Scenarios.SpecialWords_Parameters_while = paramNameScenario("while");
Scenarios.SpecialWords_Parameters_with = paramNameScenario("with");
Scenarios.SpecialWords_Parameters_yield = paramNameScenario("yield");

Scenarios.SpecialWords_Parameters_cancellationToken = paramNameScenario("cancellationToken");

// ------------------------------------------------------------------------
// Model name scenarios
// ------------------------------------------------------------------------
function modelNameScenario(name: string) {
  return passOnSuccess(
    mockapi.post(`/special-words/models/${name}`, (req) => {
      req.expect.bodyEquals({ name: "ok" });
      return {
        status: 204,
      };
    }),
  );
}

Scenarios.SpecialWords_Models_and = modelNameScenario("and");
Scenarios.SpecialWords_Models_as = modelNameScenario("as");
Scenarios.SpecialWords_Models_assert = modelNameScenario("assert");
Scenarios.SpecialWords_Models_async = modelNameScenario("async");
Scenarios.SpecialWords_Models_await = modelNameScenario("await");
Scenarios.SpecialWords_Models_break = modelNameScenario("break");
Scenarios.SpecialWords_Models_class = modelNameScenario("class");
Scenarios.SpecialWords_Models_constructor = modelNameScenario("constructor");
Scenarios.SpecialWords_Models_continue = modelNameScenario("continue");
Scenarios.SpecialWords_Models_def = modelNameScenario("def");
Scenarios.SpecialWords_Models_del = modelNameScenario("del");
Scenarios.SpecialWords_Models_elif = modelNameScenario("elif");
Scenarios.SpecialWords_Models_else = modelNameScenario("else");
Scenarios.SpecialWords_Models_except = modelNameScenario("except");
Scenarios.SpecialWords_Models_exec = modelNameScenario("exec");
Scenarios.SpecialWords_Models_finally = modelNameScenario("finally");
Scenarios.SpecialWords_Models_for = modelNameScenario("for");
Scenarios.SpecialWords_Models_from = modelNameScenario("from");
Scenarios.SpecialWords_Models_global = modelNameScenario("global");
Scenarios.SpecialWords_Models_if = modelNameScenario("if");
Scenarios.SpecialWords_Models_import = modelNameScenario("import");
Scenarios.SpecialWords_Models_in = modelNameScenario("in");
Scenarios.SpecialWords_Models_is = modelNameScenario("is");
Scenarios.SpecialWords_Models_lambda = modelNameScenario("lambda");
Scenarios.SpecialWords_Models_not = modelNameScenario("not");
Scenarios.SpecialWords_Models_or = modelNameScenario("or");
Scenarios.SpecialWords_Models_pass = modelNameScenario("pass");
Scenarios.SpecialWords_Models_raise = modelNameScenario("raise");
Scenarios.SpecialWords_Models_return = modelNameScenario("return");
Scenarios.SpecialWords_Models_try = modelNameScenario("try");
Scenarios.SpecialWords_Models_while = modelNameScenario("while");
Scenarios.SpecialWords_Models_with = modelNameScenario("with");
Scenarios.SpecialWords_Models_yield = modelNameScenario("yield");

// ------------------------------------------------------------------------
// Property name scenarios
// ------------------------------------------------------------------------
function propertyNameScenario(route: string, name: string) {
  return passOnSuccess(
    mockapi.post(`/special-words/model-properties/${route}`, (req) => {
      req.expect.bodyEquals({ [name]: "ok" });
      return {
        status: 204,
      };
    }),
  );
}

Scenarios.SpecialWords_ModelProperties_sameAsModel = propertyNameScenario("same-as-model", "SameAsModel");

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
    },
  ],
});

function createPostServerTests(uri: string, data?: any) {
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
      },
    ],
  });
}
Scenarios.Special_Words_Models_And = createPostServerTests(`/special-words/models/and`);
Scenarios.Special_Words_Models_As = createPostServerTests(`/special-words/models/as`);
Scenarios.Special_Words_Models_Assert = createPostServerTests(`/special-words/models/assert`);
Scenarios.Special_Words_Models_Async = createPostServerTests(`/special-words/models/async`);
Scenarios.Special_Words_Models_Await = createPostServerTests(`/special-words/models/await`);
Scenarios.Special_Words_Models_Break = createPostServerTests(`/special-words/models/break`);
Scenarios.Special_Words_Models_Class = createPostServerTests(`/special-words/models/class`);
Scenarios.Special_Words_Models_Constructor = createPostServerTests(`/special-words/models/constructor`);
Scenarios.Special_Words_Models_Continue = createPostServerTests(`/special-words/models/continue`);
Scenarios.Special_Words_Models_Def = createPostServerTests(`/special-words/models/def`);
Scenarios.Special_Words_Models_Del = createPostServerTests(`/special-words/models/del`);
Scenarios.Special_Words_Models_Elif = createPostServerTests(`/special-words/models/elif`);
Scenarios.Special_Words_Models_Else = createPostServerTests(`/special-words/models/else`);
Scenarios.Special_Words_Models_Except = createPostServerTests(`/special-words/models/except`);
Scenarios.Special_Words_Models_Exec = createPostServerTests(`/special-words/models/exec`);
Scenarios.Special_Words_Models_Finally = createPostServerTests(`/special-words/models/finally`);
Scenarios.Special_Words_Models_For = createPostServerTests(`/special-words/models/for`);
Scenarios.Special_Words_Models_From = createPostServerTests(`/special-words/models/from`);
Scenarios.Special_Words_Models_Global = createPostServerTests(`/special-words/models/global`);
Scenarios.Special_Words_Models_If = createPostServerTests(`/special-words/models/if`);
Scenarios.Special_Words_Models_Import = createPostServerTests(`/special-words/models/import`);
Scenarios.Special_Words_Models_In = createPostServerTests(`/special-words/models/in`);
Scenarios.Special_Words_Models_Is = createPostServerTests(`/special-words/models/is`);
Scenarios.Special_Words_Models_Lambda = createPostServerTests(`/special-words/models/lambda`);
Scenarios.Special_Words_Models_Not = createPostServerTests(`/special-words/models/not`);
Scenarios.Special_Words_Models_Or = createPostServerTests(`/special-words/models/or`);
Scenarios.Special_Words_Models_Pass = createPostServerTests(`/special-words/models/pass`);
Scenarios.Special_Words_Models_Raise = createPostServerTests(`/special-words/models/raise`);
Scenarios.Special_Words_Models_Return = createPostServerTests(`/special-words/models/return`);
Scenarios.Special_Words_Models_Try = createPostServerTests(`/special-words/models/try`);
Scenarios.Special_Words_Models_While = createPostServerTests(`/special-words/models/while`);
Scenarios.Special_Words_Models_With = createPostServerTests(`/special-words/models/with`);
Scenarios.Special_Words_Models_Yield = createPostServerTests(`/special-words/models/yield`);

function createServerTests(uri: string, data?: any) {
  return passOnSuccess({
    uri,
    mockMethods: [
      {
        method: "get",
        request: {
          config: {
            params: data,
          },
        },
        response: {
          status: 204,
        },
      },
    ],
  });
}

Scenarios.Special_Words_Operations_And = createServerTests(`/special-words/operations/and`);
Scenarios.Special_Words_Operations_As = createServerTests(`/special-words/operations/as`);
Scenarios.Special_Words_Operations_Assert = createServerTests(`/special-words/operations/assert`);
Scenarios.Special_Words_Operations_Async = createServerTests(`/special-words/operations/async`);
Scenarios.Special_Words_Operations_Await = createServerTests(`/special-words/operations/await`);
Scenarios.Special_Words_Operations_Break = createServerTests(`/special-words/operations/break`);
Scenarios.Special_Words_Operations_Class = createServerTests(`/special-words/operations/class`);
Scenarios.Special_Words_Operations_Constructor = createServerTests(`/special-words/operations/constructor`);
Scenarios.Special_Words_Operations_Continue = createServerTests(`/special-words/operations/continue`);
Scenarios.Special_Words_Operations_Def = createServerTests(`/special-words/operations/def`);
Scenarios.Special_Words_Operations_Del = createServerTests(`/special-words/operations/del`);
Scenarios.Special_Words_Operations_Elif = createServerTests(`/special-words/operations/elif`);
Scenarios.Special_Words_Operations_Else = createServerTests(`/special-words/operations/else`);
Scenarios.Special_Words_Operations_Except = createServerTests(`/special-words/operations/except`);
Scenarios.Special_Words_Operations_Exec = createServerTests(`/special-words/operations/exec`);
Scenarios.Special_Words_Operations_Finally = createServerTests(`/special-words/operations/finally`);
Scenarios.Special_Words_Operations_For = createServerTests(`/special-words/operations/for`);
Scenarios.Special_Words_Operations_From = createServerTests(`/special-words/operations/from`);
Scenarios.Special_Words_Operations_Global = createServerTests(`/special-words/operations/global`);
Scenarios.Special_Words_Operations_If = createServerTests(`/special-words/operations/if`);
Scenarios.Special_Words_Operations_Import = createServerTests(`/special-words/operations/import`);
Scenarios.Special_Words_Operations_In = createServerTests(`/special-words/operations/in`);
Scenarios.Special_Words_Operations_Is = createServerTests(`/special-words/operations/is`);
Scenarios.Special_Words_Operations_Lambda = createServerTests(`/special-words/operations/lambda`);
Scenarios.Special_Words_Operations_Not = createServerTests(`/special-words/operations/not`);
Scenarios.Special_Words_Operations_Or = createServerTests(`/special-words/operations/or`);
Scenarios.Special_Words_Operations_Pass = createServerTests(`/special-words/operations/pass`);
Scenarios.Special_Words_Operations_Raise = createServerTests(`/special-words/operations/raise`);
Scenarios.Special_Words_Operations_Return = createServerTests(`/special-words/operations/return`);
Scenarios.Special_Words_Operations_Try = createServerTests(`/special-words/operations/try`);
Scenarios.Special_Words_Operations_While = createServerTests(`/special-words/operations/while`);
Scenarios.Special_Words_Operations_With = createServerTests(`/special-words/operations/with`);
Scenarios.Special_Words_Operations_Yield = createServerTests(`/special-words/operations/yield`);
Scenarios.Special_Words_Parameters_And = createServerTests(`/special-words/parameters/and`, {
  and: "ok",
});
Scenarios.Special_Words_Parameters_As = createServerTests(`/special-words/parameters/as`, {
  as: "ok",
});
Scenarios.Special_Words_Parameters_Assert = createServerTests(`/special-words/parameters/assert`, {
  assert: "ok",
});
Scenarios.Special_Words_Parameters_Async = createServerTests(`/special-words/parameters/async`, {
  async: "ok",
});
Scenarios.Special_Words_Parameters_Await = createServerTests(`/special-words/parameters/await`, {
  await: "ok",
});
Scenarios.Special_Words_Parameters_Break = createServerTests(`/special-words/parameters/break`, {
  break: "ok",
});
Scenarios.Special_Words_Parameters_Class = createServerTests(`/special-words/parameters/class`, {
  class: "ok",
});
Scenarios.Special_Words_Parameters_Constructor = createServerTests(`/special-words/parameters/constructor`, {
  constructor: "ok",
});
Scenarios.Special_Words_Parameters_Continue = createServerTests(`/special-words/parameters/continue`, {
  continue: "ok",
});
Scenarios.Special_Words_Parameters_Def = createServerTests(`/special-words/parameters/def`, {
  def: "ok",
});
Scenarios.Special_Words_Parameters_Del = createServerTests(`/special-words/parameters/del`, {
  del: "ok",
});
Scenarios.Special_Words_Parameters_Elif = createServerTests(`/special-words/parameters/elif`, {
  elif: "ok",
});
Scenarios.Special_Words_Parameters_Else = createServerTests(`/special-words/parameters/else`, {
  else: "ok",
});
Scenarios.Special_Words_Parameters_Except = createServerTests(`/special-words/parameters/except`, {
  except: "ok",
});
Scenarios.Special_Words_Parameters_Exec = createServerTests(`/special-words/parameters/exec`, {
  exec: "ok",
});
Scenarios.Special_Words_Parameters_Finally = createServerTests(`/special-words/parameters/finally`, {
  finally: "ok",
});
Scenarios.Special_Words_Parameters_For = createServerTests(`/special-words/parameters/for`, {
  for: "ok",
});
Scenarios.Special_Words_Parameters_From = createServerTests(`/special-words/parameters/from`, {
  from: "ok",
});
Scenarios.Special_Words_Parameters_Global = createServerTests(`/special-words/parameters/global`, {
  global: "ok",
});
Scenarios.Special_Words_Parameters_If = createServerTests(`/special-words/parameters/if`, {
  if: "ok",
});
Scenarios.Special_Words_Parameters_Import = createServerTests(`/special-words/parameters/import`, {
  import: "ok",
});
Scenarios.Special_Words_Parameters_In = createServerTests(`/special-words/parameters/in`, {
  in: "ok",
});
Scenarios.Special_Words_Parameters_Is = createServerTests(`/special-words/parameters/is`, {
  is: "ok",
});
Scenarios.Special_Words_Parameters_Lambda = createServerTests(`/special-words/parameters/lambda`, {
  lambda: "ok",
});
Scenarios.Special_Words_Parameters_Not = createServerTests(`/special-words/parameters/not`, {
  not: "ok",
});
Scenarios.Special_Words_Parameters_Or = createServerTests(`/special-words/parameters/or`, {
  or: "ok",
});
Scenarios.Special_Words_Parameters_Pass = createServerTests(`/special-words/parameters/pass`, {
  pass: "ok",
});
Scenarios.Special_Words_Parameters_Raise = createServerTests(`/special-words/parameters/raise`, {
  raise: "ok",
});
Scenarios.Special_Words_Parameters_Return = createServerTests(`/special-words/parameters/return`, {
  return: "ok",
});
Scenarios.Special_Words_Parameters_Try = createServerTests(`/special-words/parameters/try`, {
  try: "ok",
});
Scenarios.Special_Words_Parameters_While = createServerTests(`/special-words/parameters/while`, {
  while: "ok",
});
Scenarios.Special_Words_Parameters_With = createServerTests(`/special-words/parameters/with`, {
  with: "ok",
});
Scenarios.Special_Words_Parameters_Yield = createServerTests(`/special-words/parameters/yield`, {
  yield: "ok",
});
Scenarios.Special_Words_Parameters_Cancellation_Token = createServerTests(
  `/special-words/parameters/cancellationToken`,
  {
    cancellationToken: "ok",
  },
);
