import { describe, it } from "vitest";
import {
  ModelPropertiesClient,
  ModelsClient,
  OperationsClient,
  ParametersClient,
} from "../../generated/http/special-words/http-client-javascript/src/index.js";

describe("SpecialWords", () => {
  describe("OperationsClient", () => {
    const client = new OperationsClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle operation 'and'", async () => {
      await client.and();
    });

    it("should handle operation 'as'", async () => {
      await client.as_();
    });

    it("should handle operation 'assert'", async () => {
      await client.assert();
    });

    it("should handle operation 'async'", async () => {
      await client.async();
    });

    it("should handle operation 'await'", async () => {
      await client.await_();
    });

    it("should handle operation 'break'", async () => {
      await client.break_();
    });

    it("should handle operation 'class'", async () => {
      await client.class_();
    });

    it("should handle operation 'constructor'", async () => {
      await client.constructor();
    });

    it("should handle operation 'continue'", async () => {
      await client.continue_();
    });

    it("should handle operation 'def'", async () => {
      await client.def();
    });

    it("should handle operation 'del'", async () => {
      await client.del();
    });

    it("should handle operation 'elif'", async () => {
      await client.elif();
    });

    it("should handle operation 'else'", async () => {
      await client.else_();
    });

    it("should handle operation 'except'", async () => {
      await client.except();
    });

    it("should handle operation 'exec'", async () => {
      await client.exec();
    });

    it("should handle operation 'finally'", async () => {
      await client.finally_();
    });

    it("should handle operation 'for'", async () => {
      await client.for_();
    });

    it("should handle operation 'from'", async () => {
      await client.from();
    });

    it("should handle operation 'global'", async () => {
      await client.global();
    });

    it("should handle operation 'if'", async () => {
      await client.if_();
    });

    it("should handle operation 'import'", async () => {
      await client.import_();
    });

    it("should handle operation 'in'", async () => {
      await client.in_();
    });

    it("should handle operation 'is'", async () => {
      await client.is();
    });

    it("should handle operation 'lambda'", async () => {
      await client.lambda();
    });

    it("should handle operation 'not'", async () => {
      await client.not();
    });

    it("should handle operation 'or'", async () => {
      await client.or();
    });

    it("should handle operation 'pass'", async () => {
      await client.pass();
    });

    it("should handle operation 'raise'", async () => {
      await client.raise();
    });

    it("should handle operation 'return'", async () => {
      await client.return_();
    });

    it("should handle operation 'try'", async () => {
      await client.try_();
    });

    it("should handle operation 'while'", async () => {
      await client.while_();
    });

    it("should handle operation 'with'", async () => {
      await client.with_();
    });

    it("should handle operation 'yield'", async () => {
      await client.yield_();
    });
  });

  describe("ParametersClient", () => {
    const client = new ParametersClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle parameter 'and'", async () => {
      await client.withAnd("value");
    });

    it("should handle parameter 'as'", async () => {
      await client.withAs("value");
    });

    it("should handle parameter 'assert'", async () => {
      await client.withAssert("value");
    });

    it("should handle parameter 'async'", async () => {
      await client.withAsync("value");
    });

    it("should handle parameter 'await'", async () => {
      await client.withAwait("value");
    });

    it("should handle parameter 'break'", async () => {
      await client.withBreak("value");
    });

    it("should handle parameter 'class'", async () => {
      await client.withClass("value");
    });

    it("should handle parameter 'constructor'", async () => {
      await client.withConstructor("value");
    });

    it("should handle parameter 'continue'", async () => {
      await client.withContinue("value");
    });

    it("should handle parameter 'def'", async () => {
      await client.withDef("value");
    });

    it("should handle parameter 'del'", async () => {
      await client.withDel("value");
    });

    it("should handle parameter 'elif'", async () => {
      await client.withElif("value");
    });

    it("should handle parameter 'else'", async () => {
      await client.withElse("value");
    });

    it("should handle parameter 'except'", async () => {
      await client.withExcept("value");
    });

    it("should handle parameter 'exec'", async () => {
      await client.withExec("value");
    });

    it("should handle parameter 'finally'", async () => {
      await client.withFinally("value");
    });

    it("should handle parameter 'for'", async () => {
      await client.withFor("value");
    });

    it("should handle parameter 'from'", async () => {
      await client.withFrom("value");
    });

    it("should handle parameter 'global'", async () => {
      await client.withGlobal("value");
    });

    it("should handle parameter 'if'", async () => {
      await client.withIf("value");
    });

    it("should handle parameter 'import'", async () => {
      await client.withImport("value");
    });

    it("should handle parameter 'in'", async () => {
      await client.withIn("value");
    });

    it("should handle parameter 'is'", async () => {
      await client.withIs("value");
    });

    it("should handle parameter 'lambda'", async () => {
      await client.withLambda("value");
    });

    it("should handle parameter 'not'", async () => {
      await client.withNot("value");
    });

    it("should handle parameter 'or'", async () => {
      await client.withOr("value");
    });

    it("should handle parameter 'pass'", async () => {
      await client.withPass("value");
    });

    it("should handle parameter 'raise'", async () => {
      await client.withRaise("value");
    });

    it("should handle parameter 'return'", async () => {
      await client.withReturn("value");
    });

    it("should handle parameter 'try'", async () => {
      await client.withTry("value");
    });

    it("should handle parameter 'while'", async () => {
      await client.withWhile("value");
    });

    it("should handle parameter 'with'", async () => {
      await client.withWith("value");
    });

    it("should handle parameter 'yield'", async () => {
      await client.withYield("value");
    });

    it("should handle parameter 'cancellationToken'", async () => {
      await client.withCancellationToken("value");
    });
  });

  describe("ModelsClient", () => {
    const client = new ModelsClient("http://localhost:3000", { allowInsecureConnection: true });

    it("should handle model 'and'", async () => {
      await client.withAnd({ name: "value" });
    });

    it("should handle model 'as'", async () => {
      await client.withAs({ name: "value" });
    });

    it("should handle model 'assert'", async () => {
      await client.withAssert({ name: "value" });
    });

    it("should handle model 'async'", async () => {
      await client.withAsync({ name: "value" });
    });

    it("should handle model 'await'", async () => {
      await client.withAwait({ name: "value" });
    });

    it("should handle model 'break'", async () => {
      await client.withBreak({ name: "value" });
    });

    it("should handle model 'class'", async () => {
      await client.withClass({ name: "value" });
    });

    it("should handle model 'constructor'", async () => {
      await client.withConstructor({ name: "value" });
    });

    it("should handle model 'continue'", async () => {
      await client.withContinue({ name: "value" });
    });

    it("should handle model 'def'", async () => {
      await client.withDef({ name: "value" });
    });

    it("should handle model 'del'", async () => {
      await client.withDel({ name: "value" });
    });

    it("should handle model 'elif'", async () => {
      await client.withElif({ name: "value" });
    });

    it("should handle model 'else'", async () => {
      await client.withElse({ name: "value" });
    });

    it("should handle model 'except'", async () => {
      await client.withExcept({ name: "value" });
    });

    it("should handle model 'exec'", async () => {
      await client.withExec({ name: "value" });
    });

    it("should handle model 'finally'", async () => {
      await client.withFinally({ name: "value" });
    });

    it("should handle model 'for'", async () => {
      await client.withFor({ name: "value" });
    });

    it("should handle model 'from'", async () => {
      await client.withFrom({ name: "value" });
    });

    it("should handle model 'global'", async () => {
      await client.withGlobal({ name: "value" });
    });

    it("should handle model 'if'", async () => {
      await client.withIf({ name: "value" });
    });

    it("should handle model 'import'", async () => {
      await client.withImport({ name: "value" });
    });

    it("should handle model 'in'", async () => {
      await client.withIn({ name: "value" });
    });

    it("should handle model 'is'", async () => {
      await client.withIs({ name: "value" });
    });

    it("should handle model 'lambda'", async () => {
      await client.withLambda({ name: "value" });
    });

    it("should handle model 'not'", async () => {
      await client.withNot({ name: "value" });
    });

    it("should handle model 'or'", async () => {
      await client.withOr({ name: "value" });
    });

    it("should handle model 'pass'", async () => {
      await client.withPass({ name: "value" });
    });

    it("should handle model 'raise'", async () => {
      await client.withRaise({ name: "value" });
    });

    it("should handle model 'return'", async () => {
      await client.withReturn({ name: "value" });
    });

    it("should handle model 'try'", async () => {
      await client.withTry({ name: "value" });
    });

    it("should handle model 'while'", async () => {
      await client.withWhile({ name: "value" });
    });

    it("should handle model 'with'", async () => {
      await client.withWith({ name: "value" });
    });

    it("should handle model 'yield'", async () => {
      await client.withYield({ name: "value" });
    });
  });

  describe("ModelPropertiesClient", () => {
    const client = new ModelPropertiesClient("http://localhost:3000", {
      allowInsecureConnection: true,
      retryOptions: {
        maxRetries: 1,
      },
    });

    it("should handle property same as the model name", async () => {
      await client.sameAsModel({ sameAsModel: "ok" });
    });
  });
});
