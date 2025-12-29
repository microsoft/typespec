import { Tester } from "#test/test-host.js";
import { List } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import { t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { ClassDeclaration } from "../../../../src/python/components/class-declaration/class-declaration.js";
import { Method } from "../../../../src/python/components/class-declaration/class-method.js";
import { EnumDeclaration } from "../../../../src/python/components/enum-declaration/enum-declaration.js";
import { getOutput } from "../../test-utils.js";
import { TypeAliasDeclaration } from "../type-alias-declaration/type-alias-declaration.js";

describe("Python Class from model", () => {
  it("creates a class", async () => {
    const { program, Widget } = await Tester.compile(t.code`

    model ${t.model("Widget")} {
      id: string;
      weight: int32;
      aliases: string[];
      isActive: boolean;
      color: "blue" | "red";
      promotionalPrice: float64;
      description?: string = "This is a widget";
      createdAt: int64 = 1717334400;
      tags: string[] = #["tag1", "tag2"];
      isDeleted: boolean = false;
      alternativeColor: "green" | "yellow" = "green";
      price: float64 = 100.0;
    }
    `);

    expect(getOutput(program, [<ClassDeclaration type={Widget} />])).toRenderTo(
      `
          from dataclasses import dataclass
          from typing import Literal
          from typing import Optional


          @dataclass(kw_only=True)
          class Widget:
            id: str
            weight: int
            aliases: list[str]
            is_active: bool
            color: Literal["blue", "red"]
            promotional_price: float
            description: Optional[str] = "This is a widget"
            created_at: int = 1717334400
            tags: list[str] = ["tag1", "tag2"]
            is_deleted: bool = False
            alternative_color: Literal["green", "yellow"] = "green"
            price: float = 100.0
          
          `,
    );
  });

  it("creates a class with non-default values followed by default values", async () => {
    const { program, Widget } = await Tester.compile(t.code`

    model ${t.model("Widget")} {
      id: string;
      description?: string = "This is a widget";
    }
    `);

    expect(getOutput(program, [<ClassDeclaration type={Widget} />])).toRenderTo(
      `
          from dataclasses import dataclass
          from typing import Optional


          @dataclass(kw_only=True)
          class Widget:
            id: str
            description: Optional[str] = "This is a widget"
          
          `,
    );
  });

  it("creates a class with non-default values followed by default values", async () => {
    const { program, Widget } = await Tester.compile(t.code`

    model ${t.model("Widget")} {
      description?: string = "This is a widget";
      id: string;
    }
    `);

    expect(getOutput(program, [<ClassDeclaration type={Widget} />])).toRenderTo(
      `
          from dataclasses import dataclass
          from typing import Optional


          @dataclass(kw_only=True)
          class Widget:
            description: Optional[str] = "This is a widget"
            id: str
          
          `,
    );
  });

  it("declares a class with multi line docs", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      /**
       * This is a test
       * with multiple lines
       */
      model ${t.model("Foo")} {
        knownProp: string;
      }
    `);

    expect(getOutput(program, [<ClassDeclaration type={Foo} />])).toRenderTo(
      `
          from dataclasses import dataclass


          @dataclass(kw_only=True)
          class Foo:
            """
            This is a test
            with multiple lines
            """

            known_prop: str

          `,
    );
  });

  it("declares a class overriding docs", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      /**
       * This is a test
       * with multiple lines
       */
      model ${t.model("Foo")} {
        knownProp: string;
      }
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration
          type={Foo}
          doc={["This is an overridden doc comment\nwith multiple lines"]}
        />,
      ]),
    ).toRenderTo(
      `
          from dataclasses import dataclass


          @dataclass(kw_only=True)
          class Foo:
            """
            This is an overridden doc comment
            with multiple lines
            """

            known_prop: str

          `,
    );
  });

  it("declares a class overriding docs with paragraphs array", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      /**
       * Base doc will be overridden
       */
      model ${t.model("Foo")} {
        knownProp: string;
      }
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration type={Foo} doc={["First paragraph", "Second paragraph"]} />,
      ]),
    ).toRenderTo(
      `
          from dataclasses import dataclass


          @dataclass(kw_only=True)
          class Foo:
            """
            First paragraph

            Second paragraph
            """

            known_prop: str

          `,
    );
  });

  it("declares a class overriding docs with prebuilt ClassDoc", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      /**
       * Base doc will be overridden
       */
      model ${t.model("Foo")} {
        knownProp: string;
      }
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration type={Foo} doc={<py.ClassDoc description={[<>Alpha</>, <>Beta</>]} />} />,
      ]),
    ).toRenderTo(
      `
          from dataclasses import dataclass


          @dataclass(kw_only=True)
          class Foo:
            """
            Alpha

            Beta
            """

            known_prop: str

          `,
    );
  });

  it("declares a class from a model with @doc", async () => {
    const { program, Foo } = await Tester.compile(t.code`
        @doc("This is a test")
        model ${t.model("Foo")} {
          knownProp: string;
        }
        `);

    expect(getOutput(program, [<ClassDeclaration type={Foo} />])).toRenderTo(
      `
          from dataclasses import dataclass


          @dataclass(kw_only=True)
          class Foo:
            """
            This is a test
            """

            known_prop: str

          `,
    );
  });

  it("declares a model property with @doc", async () => {
    const { program, Foo } = await Tester.compile(t.code`
        /**
         * This is a test
         */
        model ${t.model("Foo")} {
          @doc("This is a known property")
          knownProp: string;
        }
        `);

    expect(getOutput(program, [<ClassDeclaration type={Foo} />])).toRenderTo(
      `
          from dataclasses import dataclass


          @dataclass(kw_only=True)
          class Foo:
            """
            This is a test
            """

            # This is a known property
            known_prop: str

          `,
    );
  });

  it("throws error for model is Record<T>", async () => {
    const { program, Person } = await Tester.compile(t.code`
      model ${t.model("Person")} is Record<string>;
    `);

    expect(() => {
      expect(getOutput(program, [<ClassDeclaration type={Person} />])).toRenderTo("");
    }).toThrow(/Models with additional properties \(Record\[…\]\) are not supported/);
  });

  it("throws error for model is Record<string> with properties", async () => {
    const { program, Person } = await Tester.compile(t.code`
      model ${t.model("Person")} is Record<string> {
        name: string;
      }
    `);

    expect(() => {
      expect(getOutput(program, [<ClassDeclaration type={Person} />])).toRenderTo("");
    }).toThrow(/Models with additional properties \(Record\[…\]\) are not supported/);
  });

  it("throws error for model extends Record<string>", async () => {
    const { program, Person } = await Tester.compile(t.code`
      model ${t.model("Person")} extends Record<string> {
        name: string;
      }
    `);

    expect(() => {
      expect(getOutput(program, [<ClassDeclaration type={Person} />])).toRenderTo("");
    }).toThrow(/Models with additional properties \(Record\[…\]\) are not supported/);
  });

  it("throws error for model with ...Record<string>", async () => {
    const { program, Person } = await Tester.compile(t.code`
      model ${t.model("Person")} {
        age: int32;
        ...Record<string>;
      }
    `);

    expect(() => {
      expect(getOutput(program, [<ClassDeclaration type={Person} />])).toRenderTo("");
    }).toThrow(/Models with additional properties \(Record\[…\]\) are not supported/);
  });

  it("creates a class from a model that 'is' an array ", async () => {
    const { program, Foo } = await Tester.compile(t.code`
      model ${t.model("Foo")} is Array<string>;
    `);

    expect(getOutput(program, [<ClassDeclaration type={Foo} />])).toRenderTo(
      `
      class Foo(list[str]):
        pass

    `,
    );
  });

  it("handles a type reference to a union variant in a class property", async () => {
    const { program, Color, Widget } = await Tester.compile(t.code`
      union ${t.union("Color")} {
        red: "RED",
        blue: "BLUE",
      }
  
      model ${t.model("Widget")} {
        id: string = "123";
        weight: int32 = 100;
        color: Color.blue;
      }
      `);

    expect(
      getOutput(program, [<EnumDeclaration type={Color} />, <ClassDeclaration type={Widget} />]),
    ).toRenderTo(
      `
      from dataclasses import dataclass
      from enum import StrEnum
      from typing import Literal


      class Color(StrEnum):
        RED = "RED"
        BLUE = "BLUE"


      @dataclass(kw_only=True)
      class Widget:
        id: str = "123"
        weight: int = 100
        color: Literal[Color.BLUE]

      `,
    );
  });

  it("handles a union of variant references in a class property", async () => {
    const { program, Color, Widget } = await Tester.compile(t.code`
      union ${t.union("Color")} {
        red: "RED",
        blue: "BLUE",
        green: "GREEN",
      }
  
      model ${t.model("Widget")} {
        id: string;
        primaryColor: Color.red | Color.blue;
      }
      `);

    expect(
      getOutput(program, [<EnumDeclaration type={Color} />, <ClassDeclaration type={Widget} />]),
    ).toRenderTo(
      `
      from dataclasses import dataclass
      from enum import StrEnum
      from typing import Literal


      class Color(StrEnum):
        RED = "RED"
        BLUE = "BLUE"
        GREEN = "GREEN"


      @dataclass(kw_only=True)
      class Widget:
        id: str
        primary_color: Literal[Color.RED, Color.BLUE]

      `,
    );
  });

  it("handles a union of integer literals in a class property", async () => {
    const { program, Widget } = await Tester.compile(t.code`
      model ${t.model("Widget")} {
        id: string;
        priority: 1 | 2 | 3;
      }
      `);

    expect(getOutput(program, [<ClassDeclaration type={Widget} />])).toRenderTo(
      `
      from dataclasses import dataclass
      from typing import Literal


      @dataclass(kw_only=True)
      class Widget:
        id: str
        priority: Literal[1, 2, 3]

      `,
    );
  });

  it("handles a union of boolean literals in a class property", async () => {
    const { program, Widget } = await Tester.compile(t.code`
      model ${t.model("Widget")} {
        id: string;
        isActiveOrEnabled: true | false;
      }
      `);

    expect(getOutput(program, [<ClassDeclaration type={Widget} />])).toRenderTo(
      `
      from dataclasses import dataclass
      from typing import Literal


      @dataclass(kw_only=True)
      class Widget:
        id: str
        is_active_or_enabled: Literal[True, False]

      `,
    );
  });

  it("handles a mixed union of literals and variant references", async () => {
    const { program, Color, Widget } = await Tester.compile(t.code`
      union ${t.union("Color")} {
        red: "RED",
        blue: "BLUE",
      }
  
      model ${t.model("Widget")} {
        id: string;
        mixedValue: "custom" | 42 | true | Color.red;
      }
      `);

    expect(
      getOutput(program, [<EnumDeclaration type={Color} />, <ClassDeclaration type={Widget} />]),
    ).toRenderTo(
      `
      from dataclasses import dataclass
      from enum import StrEnum
      from typing import Literal


      class Color(StrEnum):
        RED = "RED"
        BLUE = "BLUE"


      @dataclass(kw_only=True)
      class Widget:
        id: str
        mixed_value: Literal["custom", 42, True, Color.RED]

      `,
    );
  });

  it("renders a never-typed member as typing.Never", async () => {
    const { program, Widget } = await Tester.compile(t.code`
    model ${t.model("Widget")} {
      property: never;
    }
    `);

    expect(getOutput(program, [<ClassDeclaration type={Widget} />])).toRenderTo(`
      from dataclasses import dataclass
      from typing import Never


      @dataclass(kw_only=True)
      class Widget:
        property: Never

  `);
  });

  it("can override class name", async () => {
    const { program, Widget } = await Tester.compile(t.code`
    model ${t.model("Widget")} {
      id: string;
      weight: int32;
      color: "blue" | "red";
    }
    `);

    expect(getOutput(program, [<ClassDeclaration name="MyOperations" type={Widget} />]))
      .toRenderTo(`
      from dataclasses import dataclass
      from typing import Literal


      @dataclass(kw_only=True)
      class MyOperations:
        id: str
        weight: int
        color: Literal["blue", "red"]

      `);
  });

  it("can add a members to the class", async () => {
    const { program, Widget } = await Tester.compile(t.code`
    model ${t.model("Widget")} {
      id: string;
      weight: int32;
      color: "blue" | "red";
    }
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration name="MyOperations" type={Widget}>
          <hbr />
          <List>
            <>custom_property: str</>
          </List>
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      from dataclasses import dataclass
      from typing import Literal


      @dataclass(kw_only=True)
      class MyOperations:
        id: str
        weight: int
        color: Literal["blue", "red"]
        custom_property: str

    `);
  });
  it("creates a class from a model with extends", async () => {
    const { program, Widget, ErrorWidget } = await Tester.compile(t.code`
    model ${t.model("Widget")} {
      id: string;
      weight: int32;
      color: "blue" | "red";
    }
    
    model ${t.model("ErrorWidget")} extends Widget {
      code: int32;
      message: string;
    }
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration type={Widget} />,
        <ClassDeclaration type={ErrorWidget} />,
      ]),
    ).toRenderTo(`
      from dataclasses import dataclass
      from typing import Literal


      @dataclass(kw_only=True)
      class Widget:
        id: str
        weight: int
        color: Literal["blue", "red"]


      @dataclass(kw_only=True)
      class ErrorWidget(Widget):
        code: int
        message: str

    `);
  });
});

describe("Python Class from interface", () => {
  it("creates a class from an interface declaration", async () => {
    const { program, WidgetOperations } = await Tester.compile(t.code`
    interface ${t.interface("WidgetOperations")} {
      op getName(id: string): string;
    }
    `);

    expect(getOutput(program, [<ClassDeclaration type={WidgetOperations} />])).toRenderTo(`
      from abc import ABC
      from abc import abstractmethod


      class WidgetOperations(ABC):
        @abstractmethod
        def get_name(self, id: str) -> str:
          pass


      `);
  });

  it("should handle spread and non spread interface parameters", async () => {
    const { program, Foo, WidgetOperations } = await Tester.compile(t.code`
    model ${t.model("Foo")} {
      name: string
    }

    interface ${t.interface("WidgetOperations")} {
      op getName(foo: Foo): string;
      op getOtherName(...Foo): string
    }
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration type={Foo} />,
        <ClassDeclaration type={WidgetOperations} />,
      ]),
    ).toRenderTo(`
      from abc import ABC
      from abc import abstractmethod
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class Foo:
        name: str


      class WidgetOperations(ABC):
        @abstractmethod
        def get_name(self, foo: Foo) -> str:
          pass

        @abstractmethod
        def get_other_name(self, name: str) -> str:
          pass


    `);
  });

  it("creates a class from an interface with Model references", async () => {
    const { program, WidgetOperations, Widget } = await Tester.compile(t.code`
    /**
     * Operations for Widget
     */
    interface ${t.interface("WidgetOperations")} {
      /**
       * Get the name of the widget
       */
      op getName(
        /**
         * The id of the widget
         */
         id: string
      ): Widget;
    }

    model ${t.model("Widget")} {
      id: string;
      weight: int32;
      color: "blue" | "red";
    }
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration type={WidgetOperations} />,
        <ClassDeclaration type={Widget} />,
      ]),
    ).toRenderTo(`
      from abc import ABC
      from abc import abstractmethod
      from dataclasses import dataclass
      from typing import Literal


      class WidgetOperations(ABC):
        """
        Operations for Widget
        """

        @abstractmethod
        def get_name(self, id: str) -> Widget:
          """
          Get the name of the widget
          """
          pass



      @dataclass(kw_only=True)
      class Widget:
        id: str
        weight: int
        color: Literal["blue", "red"]

      `);
  });

  it("creates a class from an interface that extends another", async () => {
    const { program, WidgetOperations, WidgetOperationsExtended, Widget } =
      await Tester.compile(t.code`
    interface ${t.interface("WidgetOperations")} {
      op getName(id: string): Widget;
    }

    interface ${t.interface("WidgetOperationsExtended")} extends WidgetOperations{
      op delete(id: string): void;
    }

    model ${t.model("Widget")} {
      id: string;
      weight: int32;
      color: "blue" | "red";
    }
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration type={WidgetOperations} />,
        <ClassDeclaration type={WidgetOperationsExtended} />,
        <ClassDeclaration type={Widget} />,
      ]),
    ).toRenderTo(`
      from abc import ABC
      from abc import abstractmethod
      from dataclasses import dataclass
      from typing import Literal


      class WidgetOperations(ABC):
        @abstractmethod
        def get_name(self, id: str) -> Widget:
          pass



      class WidgetOperationsExtended(ABC):
        @abstractmethod
        def get_name(self, id: str) -> Widget:
          pass

        @abstractmethod
        def delete(self, id: str) -> None:
          pass



      @dataclass(kw_only=True)
      class Widget:
        id: str
        weight: int
        color: Literal["blue", "red"]

      `);
  });
});

describe("Python Class overrides", () => {
  it("creates a class with a method if a model is provided and a class method is provided", async () => {
    const { program, WidgetOperations } = await Tester.compile(t.code`
    model ${t.model("WidgetOperations")} {
      id: string;
      weight: int32;
    }
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration type={WidgetOperations}>
          <hbr />
          <hbr />
          <List>
            <Method name="do_work" returnType="None" doc="This is a test" />
          </List>
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class WidgetOperations:
        id: str
        weight: int

        def do_work(self) -> None:
          """
          This is a test
          """
          pass


      `);
  });

  it("creates a class with a method if a model is provided and a class method is provided and methodType is set to method", async () => {
    const { program, WidgetOperations } = await Tester.compile(t.code`
    model ${t.model("WidgetOperations")} {
      id: string;
      weight: int32;
    }
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration type={WidgetOperations} methodType="method">
          <hbr />
          <hbr />
          <List>
            <Method name="do_work" returnType="None" doc="This is a test" />
          </List>
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class WidgetOperations:
        id: str
        weight: int

        def do_work(self) -> None:
          """
          This is a test
          """
          pass


      `);
  });

  it("creates a class with a classmethod if a model is provided, a class method is provided and methodType is set to class", async () => {
    const { program, WidgetOperations } = await Tester.compile(t.code`
    model ${t.model("WidgetOperations")} {
      id: string;
      weight: int32;
    }
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration type={WidgetOperations} methodType="class">
          <hbr />
          <hbr />
          <List>
            <Method name="do_work" returnType="None" doc="This is a test" />
          </List>
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class WidgetOperations:
        id: str
        weight: int

        @classmethod
        def do_work(cls) -> None:
          """
          This is a test
          """
          pass


      `);
  });

  it("creates a class with a staticmethod if a model is provided, a class method is provided and methodType is set to static", async () => {
    const { program, WidgetOperations } = await Tester.compile(t.code`
    model ${t.model("WidgetOperations")} {
      id: string;
      weight: int32;
    }
    `);

    expect(
      getOutput(program, [
        <ClassDeclaration type={WidgetOperations} methodType="static">
          <hbr />
          <hbr />
          <List>
            <Method name="do_work" returnType="None" doc="This is a test" />
          </List>
        </ClassDeclaration>,
      ]),
    ).toRenderTo(`
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class WidgetOperations:
        id: str
        weight: int

        @staticmethod
        def do_work() -> None:
          """
          This is a test
          """
          pass


      `);
  });

  it("creates a class with abstract method if an interface is provided", async () => {
    const { program, WidgetOperations } = await Tester.compile(t.code`
    interface ${t.interface("WidgetOperations")} {
      op getName(id: string): string;
    }
    `);

    expect(getOutput(program, [<ClassDeclaration type={WidgetOperations} />])).toRenderTo(`
      from abc import ABC
      from abc import abstractmethod


      class WidgetOperations(ABC):
        @abstractmethod
        def get_name(self, id: str) -> str:
          pass


      `);
  });

  it("creates a class with abstract method if an interface is provided and methodType is set to method", async () => {
    const { program, WidgetOperations } = await Tester.compile(t.code`
    interface ${t.interface("WidgetOperations")} {
      op getName(id: string): string;
    }
    `);

    expect(getOutput(program, [<ClassDeclaration type={WidgetOperations} methodType="method" />]))
      .toRenderTo(`
      from abc import ABC
      from abc import abstractmethod


      class WidgetOperations(ABC):
        @abstractmethod
        def get_name(self, id: str) -> str:
          pass


      `);
  });

  it("creates a class with abstract classmethod if an interface is provided and methodType is set to class", async () => {
    const { program, WidgetOperations } = await Tester.compile(t.code`
    interface ${t.interface("WidgetOperations")} {
      op getName(id: string): string;
    }
    `);

    expect(getOutput(program, [<ClassDeclaration type={WidgetOperations} methodType="class" />]))
      .toRenderTo(`
      from abc import ABC
      from abc import abstractmethod


      class WidgetOperations(ABC):
        @classmethod
        @abstractmethod
        def get_name(cls, id: str) -> str:
          pass


      `);
  });

  it("creates a class with abstract staticmethod if an interface is provided and methodType is set to static", async () => {
    const { program, WidgetOperations } = await Tester.compile(t.code`
    interface ${t.interface("WidgetOperations")} {
      op getName(id: string): string;
    }
    `);

    expect(getOutput(program, [<ClassDeclaration type={WidgetOperations} methodType="static" />]))
      .toRenderTo(`
      from abc import ABC
      from abc import abstractmethod


      class WidgetOperations(ABC):
        @staticmethod
        @abstractmethod
        def get_name(id: str) -> str:
          pass


      `);
  });

  it("Emits type alias to template instance as dataclass", async () => {
    const { program, StringResponse } = await Tester.compile(t.code`
    model Response<T> {
      data: T;
      status: string;
    }

    alias ${t.type("StringResponse")} = Response<string>;
    `);

    // Type alias to a template instance is emitted as a dataclass,
    // since Python doesn't support parameterized type aliases like TypeScript.
    // This is equivalent to: model StringResponse is Response<string>;
    expect(getOutput(program, [<TypeAliasDeclaration type={StringResponse} />])).toRenderTo(`
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class StringResponse:
        data: str
        status: str

      `);
  });

  it("Emits multiple concrete models from template instances using 'is'", async () => {
    const { program, StringResult, IntResult } = await Tester.compile(t.code`
    model Result<T, E> {
      value: T;
      error: E;
    }

    model ${t.model("StringResult")} is Result<string, string>;
    model ${t.model("IntResult")} is Result<int32, string>;
    `);

    // TypeSpec 'is' copies all properties from the template instance.
    // Each concrete model gets fully expanded properties with substituted types.
    expect(
      getOutput(program, [
        <ClassDeclaration type={StringResult} />,
        <ClassDeclaration type={IntResult} />,
      ]),
    ).toRenderTo(`
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class StringResult:
        value: str
        error: str


      @dataclass(kw_only=True)
      class IntResult:
        value: int
        error: str

      `);
  });

  it("Emits concrete model using 'is' from template instance", async () => {
    const { program, StringResponse } = await Tester.compile(t.code`
    model Response<T> {
      data: T;
      status: string;
    }

    model ${t.model("StringResponse")} is Response<string>;
    `);

    // Using 'is' copies all properties from the template instance.
    // StringResponse becomes a concrete model with all properties from Response<string>.
    expect(getOutput(program, [<ClassDeclaration type={StringResponse} />])).toRenderTo(`
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class StringResponse:
        data: str
        status: str

      `);
  });

  it("Emits concrete interface extending template (operations use concrete types)", async () => {
    const { program, StringRepository } = await Tester.compile(t.code`
    interface Repository<T> {
      get(id: string): T;
      list(): T[];
    }

    interface ${t.interface("StringRepository")} extends Repository<string> {
      findByPrefix(prefix: string): string[];
    }
    `);

    // TypeSpec flattens interface inheritance - StringRepository gets all operations
    // from Repository<string> with T replaced by string.
    expect(getOutput(program, [<ClassDeclaration type={StringRepository} />])).toRenderTo(`
      from abc import ABC
      from abc import abstractmethod


      class StringRepository(ABC):
        @abstractmethod
        def get(self, id: str) -> str:
          pass

        @abstractmethod
        def list(self) -> list[str]:
          pass

        @abstractmethod
        def find_by_prefix(self, prefix: str) -> list[str]:
          pass


      `);
  });

  it("Emits multiple concrete interfaces (templates are macros, no generics)", async () => {
    const { program, UserRepository, ProductRepository } = await Tester.compile(t.code`
    interface Repository<T> {
      get(id: string): T;
    }

    interface ${t.interface("UserRepository")} extends Repository<string> {
      findByEmail(email: string): string;
    }

    interface ${t.interface("ProductRepository")} extends Repository<int32> {
      findByCategory(category: string): int32[];
    }
    `);

    // Each concrete interface extends the template with different type arguments.
    // TypeSpec flattens the inheritance with concrete types substituted.
    expect(
      getOutput(program, [
        <ClassDeclaration type={UserRepository} />,
        <ClassDeclaration type={ProductRepository} />,
      ]),
    ).toRenderTo(`
      from abc import ABC
      from abc import abstractmethod


      class UserRepository(ABC):
        @abstractmethod
        def get(self, id: str) -> str:
          pass

        @abstractmethod
        def find_by_email(self, email: str) -> str:
          pass



      class ProductRepository(ABC):
        @abstractmethod
        def get(self, id: str) -> int:
          pass

        @abstractmethod
        def find_by_category(self, category: str) -> list[int]:
          pass


      `);
  });

  it("Handles template instance with 'is' (copies properties)", async () => {
    const { program, CanadaAddress } = await Tester.compile(t.code`
    model Address<TState> {
      state: TState;
      city: string;
      street: string;
    }

    model ${t.model("CanadaAddress")} is Address<never>;
    `);

    // TypeSpec 'is' copies all properties from the template instance.
    // CanadaAddress is a concrete type with all properties from Address<never>.
    expect(getOutput(program, [<ClassDeclaration type={CanadaAddress} />])).toRenderTo(`
      from dataclasses import dataclass
      from typing import Never


      @dataclass(kw_only=True)
      class CanadaAddress:
        state: Never
        city: str
        street: str

      `);
  });

  it("Handles template with bounded type parameter using 'is'", async () => {
    const { program, StringContainer } = await Tester.compile(t.code`
    model Container<T extends string> {
      value: T;
      label: string;
    }

    model ${t.model("StringContainer")} is Container<string>;
    `);

    // Bounded type parameters (T extends string) work the same as unbounded -
    // the constraint is enforced by TypeSpec at compile time, and the concrete
    // type gets the substituted value.
    expect(getOutput(program, [<ClassDeclaration type={StringContainer} />])).toRenderTo(`
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class StringContainer:
        value: str
        label: str

      `);
  });

  it("Handles template with multiple bounded and unbounded parameters using 'is'", async () => {
    const { program, MyResult } = await Tester.compile(t.code`
    model Result<T extends string, E> {
      value: T;
      error: E;
    }

    model ${t.model("MyResult")} is Result<string, int32>;
    `);

    // Mixed bounded/unbounded parameters are handled the same way -
    // TypeSpec expands the template with concrete types.
    expect(getOutput(program, [<ClassDeclaration type={MyResult} />])).toRenderTo(`
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class MyResult:
        value: str
        error: int

      `);
  });

  it("Handles 'extends' with concrete model (Python inheritance)", async () => {
    const { program, Address, CanadaAddress } = await Tester.compile(t.code`
    model ${t.model("Address")} {
      city: string;
    }

    model ${t.model("CanadaAddress")} extends Address {
      street: string;
    }
    `);

    // TypeSpec 'extends' creates Python class inheritance when the base is a concrete model.
    expect(
      getOutput(program, [
        <ClassDeclaration type={Address} />,
        <ClassDeclaration type={CanadaAddress} />,
      ]),
    ).toRenderTo(`
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class Address:
        city: str


      @dataclass(kw_only=True)
      class CanadaAddress(Address):
        street: str

      `);
  });

  it("Handles 'extends' with template instance base (references concrete base)", async () => {
    const { program, Response, ConcreteResponse } = await Tester.compile(t.code`
    model ${t.model("Response")} {
      data: string;
      status: string;
    }

    model ${t.model("ConcreteResponse")} extends Response {
      timestamp: string;
    }
    `);

    // When extending a concrete model, Python inheritance is used.
    // The base class must be emitted first for the reference to resolve.
    expect(
      getOutput(program, [
        <ClassDeclaration type={Response} />,
        <ClassDeclaration type={ConcreteResponse} />,
      ]),
    ).toRenderTo(`
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class Response:
        data: str
        status: str


      @dataclass(kw_only=True)
      class ConcreteResponse(Response):
        timestamp: str

      `);
  });

  it("Handles template instance with 'extends' and never type using 'is' pattern", async () => {
    const { program, CanadaAddress } = await Tester.compile(t.code`
    model Address<TState> {
      state: TState;
      city: string;
    }

    // Using 'is' instead of 'extends' to copy all properties from the template instance
    model ${t.model("CanadaAddress")} is Address<never> {
      street: string;
    }
    `);

    // When extending template instances, prefer 'is' pattern which copies all properties.
    // The 'extends' keyword with template instances would require the template declaration
    // to be emitted, which is not supported since templates are macros.
    expect(getOutput(program, [<ClassDeclaration type={CanadaAddress} />])).toRenderTo(`
      from dataclasses import dataclass
      from typing import Never


      @dataclass(kw_only=True)
      class CanadaAddress:
        state: Never
        city: str
        street: str

      `);
  });

  it("creates an abstract dataclass when abstract prop is true with a model", async () => {
    const { program, BaseEntity } = await Tester.compile(t.code`
    model ${t.model("BaseEntity")} {
      id: string;
      createdAt: string;
    }
    `);

    expect(getOutput(program, [<ClassDeclaration type={BaseEntity} abstract={true} />]))
      .toRenderTo(`
      from abc import ABC
      from dataclasses import dataclass


      @dataclass(kw_only=True)
      class BaseEntity(ABC):
        id: str
        created_at: str

      `);
  });
});
