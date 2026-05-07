import { Tester } from "#test/test-host.js";
import { code } from "@alloy-js/core";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { pydanticModule, pydanticSettingsModule } from "../../builtins.js";
import { getOutput } from "../../test-utils.js";
import { ClassDeclaration } from "./class-declaration.js";
import { Method } from "./class-method.js";
import { PydanticClassDeclaration } from "./pydantic-class-declaration.js";

describe("Python PydanticClassDeclaration", () => {
  it("creates a pydantic class from a model", async () => {
    const { program, User } = await Tester.compile(t.code`
      model ${t.model("User")} {
        id: string;
      }
    `);

    expect(getOutput(program, [<PydanticClassDeclaration type={User} />])).toRenderTo(`
      from pydantic import BaseModel


      class User(BaseModel):
        id: str

    `);
  });

  it("emits model_config from structured modelConfig", async () => {
    const { program, User } = await Tester.compile(t.code`
      model ${t.model("User")} {
        id: string;
      }
    `);

    expect(
      getOutput(program, [
        <PydanticClassDeclaration
          type={User}
          modelConfig={{ frozen: true, extra: "forbid", validateAssignment: true }}
        />,
      ]),
    ).toRenderTo(`
      from pydantic import BaseModel
      from pydantic import ConfigDict


      class User(BaseModel):
        model_config = ConfigDict(frozen=True, extra="forbid", validate_assignment=True)
        id: str

    `);
  });

  it("places pydantic validator decorators above @classmethod", async () => {
    const { program, stripName } = await Tester.compile(
      t.code`@test op ${t.op("stripName")}(value: string): string;`,
    );

    expect(
      getOutput(program, [
        <PydanticClassDeclaration name="User">
          <Method
            type={stripName}
            methodType="class"
            decorators={[code`@${pydanticModule["."].field_validator}("name", mode="before")`]}
          />
        </PydanticClassDeclaration>,
      ]),
    ).toRenderTo(`
      from pydantic import BaseModel
      from pydantic import field_validator


      class User(BaseModel):
        @field_validator("name", mode="before")
        @classmethod
        def strip_name(cls, value: str) -> str:
          pass


    `);
  });

  it("supports BaseSettings via pydantic_settings module", async () => {
    const { program } = await Tester.compile(``);

    expect(
      getOutput(program, [
        <ClassDeclaration name="AppSettings" bases={[pydanticSettingsModule["."].BaseSettings]} />,
      ]),
    ).toRenderTo(`
      from pydantic_settings import BaseSettings


      class AppSettings(BaseSettings):
        pass

    `);
  });
});
