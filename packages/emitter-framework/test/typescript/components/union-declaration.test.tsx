import { render } from "@alloy-js/core";
import { d } from "@alloy-js/core/testing";
import { SourceFile } from "@alloy-js/typescript";
import type { Enum, Model, Union } from "@typespec/compiler";
import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, describe, it } from "vitest";
import { Output } from "../../../src/core/components/output.jsx";
import { UnionDeclaration } from "../../../src/typescript/components/union-declaration.js";
import { UnionExpression } from "../../../src/typescript/components/union-expression.js";
import { InterfaceDeclaration } from "../../../src/typescript/index.js";
import { assertFileContents } from "../../utils.js";
import { createEmitterFrameworkTestRunner } from "../test-host.js";

describe("Typescript Union Declaration", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createEmitterFrameworkTestRunner();
  });

  describe("Union not bound to Typespec Types", () => {
    it("creates a union declaration", async () => {
      await runner.compile(``);
      const res = render(
        <Output program={runner.program}>
          <SourceFile path="test.ts">
            <UnionDeclaration name="MyUnion">"red" | "blue"</UnionDeclaration>
          </SourceFile>
        </Output>,
      );

      assertFileContents(
        res,
        d`
          type MyUnion = "red" | "blue";
        `,
      );
    });
  });

  describe("Union bound to Typespec Types", () => {
    describe("Bound to Union", () => {
      it("creates a union declaration", async () => {
        const { TestUnion } = (await runner.compile(`
          namespace DemoService;
          @test union TestUnion {
            one: "one",
            two: "two"
          }
        `)) as { TestUnion: Union };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              <UnionDeclaration type={TestUnion} />
            </SourceFile>
          </Output>,
        );

        assertFileContents(
          res,
          d`
            type TestUnion = "one" | "two";
          `,
        );
      });

      it("creates a union declaration with JSDoc", async () => {
        const { TestUnion } = (await runner.compile(`
          namespace DemoService;
          /**
           * Test Union
           */
          @test union TestUnion {
            one: "one",
            two: "two"
          }
        `)) as { TestUnion: Union };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              <UnionDeclaration type={TestUnion} />
            </SourceFile>
          </Output>,
        );

        assertFileContents(
          res,
          d`
            /**
             * Test Union
             */
            type TestUnion = "one" | "two";
          `,
        );
      });

      it("creates a union declaration with name override", async () => {
        const { TestUnion } = (await runner.compile(`
          namespace DemoService;
          @test union TestUnion {
            one: "one",
            two: "two"
          }
        `)) as { TestUnion: Union };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              <UnionDeclaration export type={TestUnion} name="MyUnion" />
            </SourceFile>
          </Output>,
        );

        assertFileContents(
          res,
          d`
            export type MyUnion = "one" | "two";
          `,
        );
      });

      it("creates a union declaration with extra children", async () => {
        const { TestUnion } = (await runner.compile(`
          namespace DemoService;
          @test union TestUnion {
            one: "one",
            two: "two"
          }
        `)) as { TestUnion: Union };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              <UnionDeclaration type={TestUnion}>"three"</UnionDeclaration>
            </SourceFile>
          </Output>,
        );

        assertFileContents(
          res,
          d`
            type TestUnion = "one" | "two" | "three";
          `,
        );
      });

      it("renders a union expression", async () => {
        const { TestUnion } = (await runner.compile(`
          namespace DemoService;
          @test union TestUnion {
            one: "one",
            two: "two"
          }
        `)) as { TestUnion: Union };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              let x: <UnionExpression type={TestUnion} /> = "one";
            </SourceFile>
          </Output>,
        );

        assertFileContents(
          res,
          d`
            let x: "one" | "two" = "one";
          `,
        );
      });

      describe("Discriminated Union", () => {
        it("renders a discriminated union", async () => {
          const { TestUnion } = (await runner.compile(`
            namespace DemoService;
            @discriminated
            @test union TestUnion {
              one: { oneItem: true },
              two: true
            }
          `)) as { TestUnion: Union };

          const res = render(
            <Output program={runner.program}>
              <SourceFile path="test.ts">
                <UnionDeclaration type={TestUnion} />
              </SourceFile>
            </Output>,
          );

          assertFileContents(
            res,
            d`
              type TestUnion = {
                kind: "one";
                value: {
                  oneItem: true;
                };
              } | {
                kind: "two";
                value: true;
              };
          `,
          );
        });
      });

      it("renders a discriminated union with custom properties", async () => {
        const { TestUnion } = (await runner.compile(`
          namespace DemoService;
            @discriminated(#{ discriminatorPropertyName: "dataKind", envelopePropertyName: "data" })
            @test union TestUnion {
              one: { oneItem: true },
              two: true
            }
          `)) as { TestUnion: Union };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              <UnionDeclaration type={TestUnion} />
            </SourceFile>
          </Output>,
        );
        assertFileContents(
          res,
          d`
            type TestUnion = {
              dataKind: "one";
              data: {
                oneItem: true;
              };
            } | {
              dataKind: "two";
              data: true;
            };
          `,
        );
      });

      it("renders a discriminated union with named models", async () => {
        const { Pet, Cat, Dog } = (await runner.compile(`
            namespace DemoService;
            @test model Cat {
              name: string;
              meow: boolean;
            }

            @test model Dog {
              name: string;
              bark: boolean;
            }

            @discriminated
            @test union Pet {
              cat: Cat,
              dog: Dog,
            }
          `)) as { Pet: Union; Cat: Model; Dog: Model };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              <InterfaceDeclaration type={Cat} />
              <hbr />
              <InterfaceDeclaration type={Dog} />
              <hbr />
              <UnionDeclaration type={Pet} />
            </SourceFile>
          </Output>,
        );
        assertFileContents(
          res,
          d`
            interface Cat {
              name: string;
              meow: boolean;
            }
            interface Dog {
              name: string;
              bark: boolean;
            }
            type Pet = {
              kind: "cat";
              value: Cat;
            } | {
              kind: "dog";
              value: Dog;
            };
          `,
        );
      });

      describe("Discriminated Union with no envelope", () => {
        it("renders named discriminated union", async () => {
          const { Pet, Cat, Dog } = (await runner.compile(`
            namespace DemoService;

            @test model Cat {
              name: string;
              meow: boolean;
            }

            @test model Dog {
              name: string;
              bark: boolean;
            }

            @discriminated(#{ envelope: "none", discriminatorPropertyName: "dataKind" })
            @test union Pet {
              cat: Cat,
              dog: Dog,
            }
          `)) as { Pet: Union; Cat: Model; Dog: Model };

          const res = render(
            <Output program={runner.program}>
              <SourceFile path="test.ts">
                <InterfaceDeclaration type={Cat} />
                <hbr />
                <InterfaceDeclaration type={Dog} />
                <hbr />
                <UnionDeclaration type={Pet} />
              </SourceFile>
            </Output>,
          );

          assertFileContents(
            res,
            d`
              interface Cat {
                name: string;
                meow: boolean;
              }
              interface Dog {
                name: string;
                bark: boolean;
              }
              type Pet = {
                dataKind: "cat"
              } & Cat | {
                dataKind: "dog"
              } & Dog;
            `,
          );
        });

        it("renders anonymous discriminated union", async () => {
          const { TestUnion } = (await runner.compile(`
            namespace DemoService;
            @discriminated(#{ envelope: "none", discriminatorPropertyName: "dataKind" })
            @test union TestUnion {
              one: { oneItem: true },
              two: { secondItem: false }
            }
          `)) as { TestUnion: Union };

          const res = render(
            <Output program={runner.program}>
              <SourceFile path="test.ts">
                <UnionDeclaration type={TestUnion} />
              </SourceFile>
            </Output>,
          );

          assertFileContents(
            res,
            d`
              type TestUnion = {
                dataKind: "one";
                oneItem: true;
              } | {
                dataKind: "two";
                secondItem: false;
              };
            `,
          );
        });
      });
    });

    describe("Bound to Enum", () => {
      it("creates a union declaration", async () => {
        const { TestEnum } = (await runner.compile(`
          namespace DemoService;
          @test enum TestEnum {
            one: "one",
            two: "two"
          }
        `)) as { TestEnum: Enum };

        const res = render(
          <Output program={runner.program}>
            <SourceFile path="test.ts">
              <UnionDeclaration type={TestEnum} />
            </SourceFile>
          </Output>,
        );

        assertFileContents(
          res,
          d`
            type TestEnum = "one" | "two";
          `,
        );
      });
    });
  });
});
