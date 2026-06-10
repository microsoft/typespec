import { Tester } from "#test/test-host.js";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getOutput } from "../../test-utils.js";
import { Method } from "./class-method.js";
import { PydanticClassDeclaration } from "./pydantic-class-declaration.js";
import {
  computedFieldDecorator,
  fieldSerializerDecorator,
  fieldValidatorDecorator,
  modelValidatorDecorator,
} from "./pydantic-decorators.js";

describe("Python pydantic decorator helpers", () => {
  it("builds @field_validator decorator with mode", async () => {
    const { program, normalizeName } = await Tester.compile(
      t.code`@test op ${t.op("normalizeName")}(value: string): string;`,
    );

    expect(
      getOutput(program, [
        <PydanticClassDeclaration name="User">
          <Method
            type={normalizeName}
            methodType="class"
            decorators={[fieldValidatorDecorator("name", { mode: "before" })]}
          />
        </PydanticClassDeclaration>,
      ]),
    ).toRenderTo(`
      from pydantic import BaseModel
      from pydantic import field_validator


      class User(BaseModel):
        @field_validator("name", mode="before")
        @classmethod
        def normalize_name(cls, value: str) -> str:
          pass


    `);
  });

  it("builds @model_validator decorator for class methods", async () => {
    const { program, checkModel } = await Tester.compile(
      t.code`@test op ${t.op("checkModel")}(value: string): string;`,
    );

    expect(
      getOutput(program, [
        <PydanticClassDeclaration name="User">
          <Method
            type={checkModel}
            methodType="class"
            decorators={[modelValidatorDecorator({ mode: "after" })]}
          />
        </PydanticClassDeclaration>,
      ]),
    ).toRenderTo(`
      from pydantic import BaseModel
      from pydantic import model_validator


      class User(BaseModel):
        @model_validator(mode="after")
        @classmethod
        def check_model(cls, value: str) -> str:
          pass


    `);
  });

  it("builds serializer and computed field decorators", async () => {
    const { program } = await Tester.compile(``);

    expect(
      getOutput(program, [
        <PydanticClassDeclaration name="User">
          <Method
            name="serializeName"
            methodType="method"
            returnType="str"
            decorators={[fieldSerializerDecorator("name", { whenUsed: "json" })]}
          />
          <Method
            name="displayName"
            methodType="method"
            returnType="str"
            decorators={[computedFieldDecorator()]}
          />
        </PydanticClassDeclaration>,
      ]),
    ).toRenderTo(`
      from pydantic import BaseModel
      from pydantic import computed_field
      from pydantic import field_serializer


      class User(BaseModel):
        @field_serializer("name", when_used="json")
        def serialize_name(self) -> str:
          pass
        @computed_field
        def display_name(self) -> str:
          pass


    `);
  });
});
