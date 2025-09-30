import { efRefkey } from "#python/utils/refkey.js";
import { Tester } from "#test/test-host.js";
import { d } from "@alloy-js/core/testing";
import * as py from "@alloy-js/python";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getOutput } from "../../test-utils.js";
import { EnumDeclaration } from "./enum-declaration.js";

describe("Python Enum Declaration", () => {
  it("takes an enum type parameter", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      enum ${t.enum("Foo")} {
        one: 1,
        two: 2,
        three: 3
      }
    `);

    expect(getOutput(program, [<EnumDeclaration type={Foo} />])).toRenderTo(d`
      from enum import IntEnum

      class Foo(IntEnum):
        ONE = 1
        TWO = 2
        THREE = 3


    `);
  });

  it("adds Python doc from TypeSpec", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      /**
       * This is a test enum
       */
      enum ${t.enum("Foo")} {
        @doc("This is one")
        one: 1,
        two: 2,
        three: 3
      }
    `);
    const output = getOutput(program, [<EnumDeclaration type={Foo} />]);

    expect(output).toRenderTo(d`
      from enum import IntEnum

      class Foo(IntEnum):
        """
        This is a test enum
        """

        ONE = 1  #: This is one
        TWO = 2
        THREE = 3


    `);
  });

  it("explicit doc take precedence", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      /**
       * This is a test enum
       */
      enum ${t.enum("Foo")} {
        @doc("This is one")
        one: 1,
        two: 2,
        three: 3
      }
    `);
    const output = getOutput(program, [
      <EnumDeclaration type={Foo} doc={["This is an explicit doc"]} />,
    ]);

    expect(output).toRenderTo(d`
      from enum import IntEnum

      class Foo(IntEnum):
        """
        This is an explicit doc
        """

        ONE = 1  #: This is one
        TWO = 2
        THREE = 3


    `);
  });

  it("takes a union type parameter", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      union ${t.union("Foo")} {
        one: 1,
        two: 2,
        three: 3
      }
    `);
    const output = getOutput(program, [<EnumDeclaration type={Foo} />]);

    expect(output).toRenderTo(d`
      from enum import IntEnum

      class Foo(IntEnum):
        ONE = 1
        TWO = 2
        THREE = 3


    `);
  });

  it("can be referenced", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      enum ${t.enum("Foo")} {
        one: 1,
        two: 2,
        three: 3
      }
    `);

    const output = getOutput(program, [
      <EnumDeclaration type={Foo} />,
      <py.StatementList>
        {efRefkey(Foo)}
        {efRefkey(Foo.members.get("one"))}
      </py.StatementList>,
    ]);

    expect(output).toRenderTo(d`
      from enum import IntEnum

      class Foo(IntEnum):
        ONE = 1
        TWO = 2
        THREE = 3


      Foo
      Foo.ONE
    `);
  });

  it("can be referenced using union", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      union ${t.union("Foo")}  {
        one: 1,
        two: 2,
        three: 3
      }
    `);

    const output = getOutput(program, [
      <EnumDeclaration type={Foo} />,
      <py.StatementList>
        {efRefkey(Foo)}
        {efRefkey(Foo.variants.get("one"))}
      </py.StatementList>,
    ]);

    expect(output).toRenderTo(d`
      from enum import IntEnum

      class Foo(IntEnum):
        ONE = 1
        TWO = 2
        THREE = 3


      Foo
      Foo.ONE
    `);
  });

  describe("Enum Type Detection", () => {
    it("generates IntEnum if all values are integer values", async () => {
      const { program, StatusCode } = await Tester.compile(t.code`
        enum ${t.enum("StatusCode")} {
          success: 200,
          notFound: 404,
          serverError: 500
        }
      `);
      const output = getOutput(program, [<EnumDeclaration type={StatusCode} />]);

      expect(output).toRenderTo(d`
        from enum import IntEnum

        class StatusCode(IntEnum):
          SUCCESS = 200
          NOT_FOUND = 404
          SERVER_ERROR = 500


      `);
    });

    it("generates StrEnum if all values are string values", async () => {
      const { program, Color } = await Tester.compile(t.code`
        enum ${t.enum("Color")} {
          red: "red",
          green: "green",
          blue: "blue"
        }
      `);
      const output = getOutput(program, [<EnumDeclaration type={Color} />]);

      expect(output).toRenderTo(d`
        from enum import StrEnum

        class Color(StrEnum):
          RED = "red"
          GREEN = "green"
          BLUE = "blue"


      `);
    });

    it("generates StrEnum if all values are string values with custom values", async () => {
      const { program, Color } = await Tester.compile(t.code`
        enum ${t.enum("Color")} {
          red: "This is red",
          green: "This is green",
          blue: "This is blue"
        }
      `);
      const output = getOutput(program, [
        <EnumDeclaration type={Color} />,
        <py.StatementList>
          {efRefkey(Color.members.get("red"))}
          {efRefkey(Color.members.get("green"))}
          {efRefkey(Color.members.get("blue"))}
        </py.StatementList>,
      ]);

      expect(output).toRenderTo(d`
        from enum import StrEnum

        class Color(StrEnum):
          RED = "This is red"
          GREEN = "This is green"
          BLUE = "This is blue"


        Color.RED
        Color.GREEN
        Color.BLUE

      `);
    });

    it("generates Enum for mixed value types", async () => {
      const { program, Mixed } = await Tester.compile(t.code`
        enum ${t.enum("Mixed")} {
          stringValue: "hello",
          numericValue: 42,
          autoValue
        }
      `);
      const output = getOutput(program, [<EnumDeclaration type={Mixed} />]);

      expect(output).toRenderTo(d`
        from enum import auto
        from enum import Enum

        class Mixed(Enum):
          STRING_VALUE = "hello"
          NUMERIC_VALUE = 42
          AUTO_VALUE = auto()
        
        
      `);
    });

    it("handles correctly enums without values", async () => {
      const { program, EnumWithoutValues } = await Tester.compile(t.code`
        enum ${t.enum("EnumWithoutValues")} {
          someValue,
          anotherValue,
          yetAnotherValue
        }
      `);
      const output = getOutput(program, [<EnumDeclaration type={EnumWithoutValues} />]);

      expect(output).toRenderTo(d`
        from enum import auto
        from enum import Enum

        class EnumWithoutValues(Enum):
          SOME_VALUE = auto()
          ANOTHER_VALUE = auto()
          YET_ANOTHER_VALUE = auto()
        
        
      `);
    });
  });
});
