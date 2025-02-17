import { describe, it } from "vitest";
import {
  ModelPropertiesClient,
  ModelsClient,
  OperationsClient,
  ParametersClient,
} from "../../generated/special-words/src/index.js";

describe("SpecialWords", () => {
  describe("OperationsClient", () => {
    const client = new OperationsClient({ allowInsecureConnection: true });

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
      await client.constructor_2();
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
    const client = new ParametersClient({ allowInsecureConnection: true });

    it("should handle parameter 'and'", async () => {
      await client.withAnd("ok");
    });

    it("should handle parameter 'as'", async () => {
      await client.withAs("ok");
    });

    it("should handle parameter 'assert'", async () => {
      await client.withAssert("ok");
    });

    it("should handle parameter 'async'", async () => {
      await client.withAsync("ok");
    });

    it("should handle parameter 'await'", async () => {
      await client.withAwait("ok");
    });

    it("should handle parameter 'break'", async () => {
      await client.withBreak("ok");
    });

    it("should handle parameter 'class'", async () => {
      await client.withClass("ok");
    });

    it("should handle parameter 'constructor'", async () => {
      await client.withConstructor("ok");
    });

    it("should handle parameter 'continue'", async () => {
      await client.withContinue("ok");
    });

    it("should handle parameter 'def'", async () => {
      await client.withDef("ok");
    });

    it("should handle parameter 'del'", async () => {
      await client.withDel("ok");
    });

    it("should handle parameter 'elif'", async () => {
      await client.withElif("ok");
    });

    it("should handle parameter 'else'", async () => {
      await client.withElse("ok");
    });

    it("should handle parameter 'except'", async () => {
      await client.withExcept("ok");
    });

    it("should handle parameter 'exec'", async () => {
      await client.withExec("ok");
    });

    it("should handle parameter 'finally'", async () => {
      await client.withFinally("ok");
    });

    it("should handle parameter 'for'", async () => {
      await client.withFor("ok");
    });

    it("should handle parameter 'from'", async () => {
      await client.withFrom("ok");
    });

    it("should handle parameter 'global'", async () => {
      await client.withGlobal("ok");
    });

    it("should handle parameter 'if'", async () => {
      await client.withIf("ok");
    });

    it("should handle parameter 'import'", async () => {
      await client.withImport("ok");
    });

    it("should handle parameter 'in'", async () => {
      await client.withIn("ok");
    });

    it("should handle parameter 'is'", async () => {
      await client.withIs("ok");
    });

    it("should handle parameter 'lambda'", async () => {
      await client.withLambda("ok");
    });

    it("should handle parameter 'not'", async () => {
      await client.withNot("ok");
    });

    it("should handle parameter 'or'", async () => {
      await client.withOr("ok");
    });

    it("should handle parameter 'pass'", async () => {
      await client.withPass("ok");
    });

    it("should handle parameter 'raise'", async () => {
      await client.withRaise("ok");
    });

    it("should handle parameter 'return'", async () => {
      await client.withReturn("ok");
    });

    it("should handle parameter 'try'", async () => {
      await client.withTry("ok");
    });

    it("should handle parameter 'while'", async () => {
      await client.withWhile("ok");
    });

    it("should handle parameter 'with'", async () => {
      await client.withWith("ok");
    });

    it("should handle parameter 'yield'", async () => {
      await client.withYield("ok");
    });

    it("should handle parameter 'cancellationToken'", async () => {
      await client.withCancellationToken("ok");
    });
  });

  describe("ModelsClient", () => {
    const client = new ModelsClient({ allowInsecureConnection: true });

    it("should handle model 'and'", async () => {
      await client.withAnd({ name: "ok" });
    });

    it("should handle model 'as'", async () => {
      await client.withAs({ name: "ok" });
    });

    it("should handle model 'assert'", async () => {
      await client.withAssert({ name: "ok" });
    });

    it("should handle model 'async'", async () => {
      await client.withAsync({ name: "ok" });
    });

    it("should handle model 'await'", async () => {
      await client.withAwait({ name: "ok" });
    });

    it("should handle model 'break'", async () => {
      await client.withBreak({ name: "ok" });
    });

    it("should handle model 'class'", async () => {
      await client.withClass({ name: "ok" });
    });

    it("should handle model 'constructor'", async () => {
      await client.withConstructor({ name: "ok" });
    });

    it("should handle model 'continue'", async () => {
      await client.withContinue({ name: "ok" });
    });

    it("should handle model 'def'", async () => {
      await client.withDef({ name: "ok" });
    });

    it("should handle model 'del'", async () => {
      await client.withDel({ name: "ok" });
    });

    it("should handle model 'elif'", async () => {
      await client.withElif({ name: "ok" });
    });

    it("should handle model 'else'", async () => {
      await client.withElse({ name: "ok" });
    });

    it("should handle model 'except'", async () => {
      await client.withExcept({ name: "ok" });
    });

    it("should handle model 'exec'", async () => {
      await client.withExec({ name: "ok" });
    });

    it("should handle model 'finally'", async () => {
      await client.withFinally({ name: "ok" });
    });

    it("should handle model 'for'", async () => {
      await client.withFor({ name: "ok" });
    });

    it("should handle model 'from'", async () => {
      await client.withFrom({ name: "ok" });
    });

    it("should handle model 'global'", async () => {
      await client.withGlobal({ name: "ok" });
    });

    it("should handle model 'if'", async () => {
      await client.withIf({ name: "ok" });
    });

    it("should handle model 'import'", async () => {
      await client.withImport({ name: "ok" });
    });

    it("should handle model 'in'", async () => {
      await client.withIn({ name: "ok" });
    });

    it("should handle model 'is'", async () => {
      await client.withIs({ name: "ok" });
    });

    it("should handle model 'lambda'", async () => {
      await client.withLambda({ name: "ok" });
    });

    it("should handle model 'not'", async () => {
      await client.withNot({ name: "ok" });
    });

    it("should handle model 'or'", async () => {
      await client.withOr({ name: "ok" });
    });

    it("should handle model 'pass'", async () => {
      await client.withPass({ name: "ok" });
    });

    it("should handle model 'raise'", async () => {
      await client.withRaise({ name: "ok" });
    });

    it("should handle model 'return'", async () => {
      await client.withReturn({ name: "ok" });
    });

    it("should handle model 'try'", async () => {
      await client.withTry({ name: "ok" });
    });

    it("should handle model 'while'", async () => {
      await client.withWhile({ name: "ok" });
    });

    it("should handle model 'with'", async () => {
      await client.withWith({ name: "ok" });
    });

    it("should handle model 'yield'", async () => {
      await client.withYield({ name: "ok" });
    });
  });

  describe("ModelPropertiesClient", () => {
    const client = new ModelPropertiesClient({
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
