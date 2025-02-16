import { Program, Type, navigateProgram } from "@typespec/compiler";
import { BasicTestRunner } from "@typespec/compiler/testing";
import assert, { deepStrictEqual } from "assert";
import { beforeEach, it } from "vitest";
import { getPropertySource, getSourceModel } from "../src/lib/utils.js";
import { createCSharpServiceEmitterTestRunner, getStandardService } from "./test-host.js";

function getGeneratedFile(runner: BasicTestRunner, fileName: string): [string, string] {
  const result = [...runner.fs.entries()].filter((e) => e[0].includes(`/${fileName}`));
  assert.strictEqual(
    result === null || result === undefined,
    false,
    `No file matching ${fileName} found in output`,
  );
  assert.strictEqual(result.length, 1, `found ${result.length} entries of ${fileName}`);
  const fileData = result[0];
  assert.strictEqual(
    fileData[0] === null || fileData[0] === undefined,
    false,
    `${fileName} not found`,
  );
  assert.strictEqual(
    fileData[1] === null || fileData[1] === undefined,
    false,
    `${fileName} has no contents`,
  );
  return fileData;
}

function assertFileContains(fileName: string, fileContents: string, searchString: string): void {
  assert.strictEqual(
    fileContents.includes(searchString),
    true,
    `"${searchString}" not found in ${fileName}, contents of file: ${fileContents}`,
  );
}

async function compileAndValidateSingleModel(
  runner: BasicTestRunner,
  code: string,
  fileToCheck: string,
  expectedContent: string[],
): Promise<void> {
  await compileAndValidateMultiple(runner, code, [[fileToCheck, expectedContent]]);
}

async function compile(
  runner: BasicTestRunner,
  code: string,
): Promise<{ program: Program; types: Record<string, Type> }> {
  const spec = getStandardService(code);
  const [types, _] = await runner.compileAndDiagnose(spec);
  return { program: runner.program, types: types };
}

async function compileAndValidateMultiple(
  runner: BasicTestRunner,
  code: string,
  fileChecks: [string, string[]][],
): Promise<void> {
  const spec = getStandardService(code);
  const [_, diagnostics] = await runner.compileAndDiagnose(spec);
  assert.ok(diagnostics === undefined || diagnostics.length === 0);
  for (const [fileToCheck, expectedContent] of fileChecks) {
    const [modelKey, modelContents] = getGeneratedFile(runner, fileToCheck);
    expectedContent.forEach((element) => {
      assertFileContains(modelKey, modelContents, element);
    });
  }
}

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createCSharpServiceEmitterTestRunner();
});

it("can source properties", async () => {
  const result = await compile(
    runner,
    `
      model Foo {
        @visibility("update");
        prop1: string;
        prop2: string;
        prop3: string;
      }

      model Bar is OptionalProperties<UpdateableProperties<OmitProperties<Foo, "prop3">>>;
      `,
  );
  assert.ok(result);
  assert.ok(result.types);
  assert.ok(result.program);
  navigateProgram(result.program, {
    modelProperty: (prop) => {
      if (prop.name === "prop2") {
        const sourceModel = getPropertySource(result.program, prop);
        assert.ok(sourceModel);
        assert.deepStrictEqual(sourceModel.kind, "Model");
        assert.deepStrictEqual(sourceModel.name, "Foo");
      }
    },
  });
});

it("can source models", async () => {
  const result = await compile(
    runner,
    `
      model Foo {
        @visibility("update");
        prop1: string;
        prop2: string;
      }

      model Bar is OptionalProperties<OmitProperties<Foo, "prop1">>;
      `,
  );
  assert.ok(result);
  assert.ok(result.types);
  assert.ok(result.program);
  navigateProgram(result.program, {
    model: (model) => {
      if (model.name === "Bar") {
        const sourceModel = getSourceModel(result.program, model);
        assert.ok(sourceModel);
        assert.deepStrictEqual(sourceModel.kind, "Model");
        assert.deepStrictEqual(sourceModel.name, "Foo");
      }
    },
  });
});

it("generates standard scalar properties", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** binary data */
        bytesProp?: bytes;

        /** generic decimal data */
        decimalProp?: decimal;
        /** decimal128 data */
        decimal128Prop?: decimal128;

        /** SByte */
        signedByteProp?: int8;
        /** Byte */
        byteProp?: uint8;
        /** Int16 */
        int16Prop?: int16;
        /** int */
        int32Prop?: int32;
        /** long */
        int64Prop?: int64;
        /** Uint16 */
        uint16Prop?: uint16;
        /** Uint32 */
        uint32Prop?: uint32;
        /** ulong */
        uint64Prop?: uint64;
        /** js safeint property */
        safeIntProp?: safeint;
        /** float */
        f32Prop?: float32;
        /** double */
        f64Prop?: float64;
        /** bool */
        boolProp?: boolean;
        /** DateTime */
        dateProp?: plainDate;
        /** DateTime */
        timeProp?: plainTime;
        /** DateTimeOffset */
        utcDateTimeProp?: utcDateTime;
        /** DateTimeOffset */
        offsetDateTimeProp?: offsetDateTime;
        /** TimeSpan */
        durationProp?: duration;
        /** unix timestamp data */
        timestampProp?: unixTimestamp32;
        /** string */
        stringProp?: string;
        /** resource locator prop */
        urlProp?: url;
      }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      "public byte[] BytesProp { get; set; }",
      "public SByte? SignedByteProp { get; set; }",
      "public Byte? ByteProp { get; set; }",
      "public Int16? Int16Prop { get; set; }",
      "public int? Int32Prop { get; set; }",
      "public long? Int64Prop { get; set; }",
      "public UInt16? Uint16Prop { get; set; }",
      "public UInt32? Uint32Prop { get; set; }",
      "public UInt64? Uint64Prop { get; set; }",
      "public float? F32Prop { get; set; }",
      "public double? F64Prop { get; set; }",
      "public bool? BoolProp { get; set; }",
      "public DateTime? DateProp { get; set; }",
      "public DateTime? TimeProp { get; set; }",
      "[JsonConverter( typeof(TimeSpanDurationConverter))]",
      "public TimeSpan? DurationProp { get; set; }",
      "public DateTimeOffset? UtcDateTimeProp { get; set; }",
      "public DateTimeOffset? OffsetDateTimeProp { get; set; }",
      "public string StringProp { get; set; }",
      "[JsonConverter( typeof(UnixEpochDateTimeOffsetConverter))]",
      "public DateTimeOffset? TimestampProp { get; set; }",
      "public string UrlProp { get; set; }",
      "public long? SafeIntProp { get; set; }",
      "public decimal? DecimalProp { get; set; }",
      "public decimal? Decimal128Prop { get; set; }",
    ],
  );
});

it("generates numeric constraints", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A simple test model*/
      model Foo {

        /** int */
        @minValue(100)
        @maxValue(1000)
        int32Prop?: int32;
        /** Uint32 */
        @maxValue(5000)
        uint32Prop?: uint32;
        /** float */
        @minValueExclusive(0.0)
        f32Prop?: float32;
      }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      "[TypeSpec.Helpers.JsonConverters.NumericConstraint<int>( MinValue = 100, MaxValue = 1000)]",
      "public int? Int32Prop { get; set; }",
      "[TypeSpec.Helpers.JsonConverters.NumericConstraint<UInt32>( MaxValue = 5000)]",
      "public UInt32? Uint32Prop { get; set; }",
      "[TypeSpec.Helpers.JsonConverters.NumericConstraint<float>( MinValue = 0, MinValueExclusive = true)]",
      "public float? F32Prop { get; set; }",
    ],
  );
});

it("generates string constraints", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** string */
        @minLength(3)
        @maxLength(72)
        stringProp?: string;
        /** resource locator prop */
        urlProp?: url;
      }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      "[TypeSpec.Helpers.JsonConverters.StringConstraint( MinLength = 3, MaxLength = 72)]",
      "public string StringProp { get; set; }",
    ],
  );
});

it("handles scalar extensions", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A secret value */
      @secret
      scalar password extends string;

      /** A simple test model*/
      model Foo {
        /** string literal */
        adminPassword: password;
      }
      `,
    "Foo.cs",
    ["public partial class Foo", `public string AdminPassword { get; set; }`],
  );
});

it("handles scalar templates", async () => {
  await compileAndValidateSingleModel(
    runner,
    `

      /** A simple test model*/
      model Foo {
        /** string literal */
        id: ResourceLocation<Foo>;
      }
      `,
    "Foo.cs",
    ["public partial class Foo", `public string Id { get; set; }`],
  );
});

it("handles encoded property names", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A secret value */
      @secret
      scalar password extends string;

      /** A simple test model*/
      model Foo {
        /** string literal */
        @encodedName("application/json", "pass")
        adminPassword: password;
      }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      `public string AdminPassword { get; set; }`,
      `[JsonPropertyName( "pass")]`,
    ],
  );
});

it("generates default model namespaces", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A secret value */
      @secret
      scalar password extends string;

      /** A simple test model*/
      model Foo {
        /** string literal */
        @encodedName("application/json", "pass")
        adminPassword: password;
      }
      `,
    "Foo.cs",
    [
      "using System.Text.Json;",
      `using System.Text.Json.Serialization;`,
      `using System;`,
      `[JsonPropertyName( "pass")]`,
    ],
  );
});

it("generates literal properties", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** string literal */
        stringLiteralProp?: "This is a string literal";
        /** boolean literal */
        boolLiteralProp?: true;
        /** numeric literal */
        numericLiteralProp?: 17;
      }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      `public string StringLiteralProp { get; } = "This is a string literal";`,
      "public bool? BoolLiteralProp { get; } = true;",
      "public int? NumericLiteralProp { get; } = 17",
    ],
  );
});

it("generates default values in properties", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** string literal */
        stringLiteralProp?: string = "This is a string literal";
        /** boolean literal */
        boolLiteralProp?: boolean =  true;
        /** numeric literal */
        numericLiteralProp?: int32 = 17;
      }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      `public string StringLiteralProp { get; set; } = "This is a string literal";`,
      "public bool? BoolLiteralProp { get; set; } = true;",
      "public int? NumericLiteralProp { get; set; } = 17;",
    ],
  );
});

it("generates standard scalar array  properties", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** SByte */
        arrSbyteProp: int8[];
        /** Byte */
        arrByteProp: uint8[];
        /** Int16 */
        arrint16Prop: int16[];
        /** int */
        arrint32Prop: int32[];
        /** long */
        arrint64Prop: int64[];
        /** Uint16 */
        arrayUint16Prop: uint16[];
        /** Uint32 */
        arrayUint32Prop: uint32[];
        /** ulong */
        arrayUint64Prop: uint64[];
        /** float */
        arrayF32Prop: float32[];
        /** double */
        arrayF64Prop: float64[];
        /** bool */
        arrayBoolProp: boolean[];
        /** DateTimeOffset */
        arrdateProp: plainDate[];
        /** DateTimeOffset */
        arrtimeProp: plainTime[];
        /** DateTimeOffset */
        arrutcDateTimeProp: utcDateTime[];
        /** DateTimeOffset */
        arroffsetDateTimeProp: offsetDateTime[];
        /** TimeSpan */
        arrdurationProp: duration[];
        /** string */
        arrStringProp: string[];
      }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      "public SByte[] ArrSbyteProp { get; set; }",
      "public Byte[] ArrByteProp { get; set; }",
      "public Int16[] Arrint16Prop { get; set; }",
      "public int[] Arrint32Prop { get; set; }",
      "public long[] Arrint64Prop { get; set; }",
      "public UInt16[] ArrayUint16Prop { get; set; }",
      "public UInt32[] ArrayUint32Prop { get; set; }",
      "public UInt64[] ArrayUint64Prop { get; set; }",
      "public float[] ArrayF32Prop { get; set; }",
      "public double[] ArrayF64Prop { get; set; }",
      "public bool[] ArrayBoolProp { get; set; }",
      "public DateTime[] ArrdateProp { get; set; }",
      "public DateTime[] ArrtimeProp { get; set; }",
      "public TimeSpan[] ArrdurationProp { get; set; }",
      "public DateTimeOffset[] ArrutcDateTimeProp { get; set; }",
      "public DateTimeOffset[] ArroffsetDateTimeProp { get; set; }",
      "public string[] ArrStringProp { get; set; }",
    ],
  );
});

it("generates standard scalar array  constraints", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** SByte */
        @minItems(1)
        @maxItems(10)
        arrSbyteProp: int8[];
        /** Byte */
        @maxItems(10)
        arrByteProp: uint8[];
      }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      "[TypeSpec.Helpers.JsonConverters.ArrayConstraint( MinItems = 1, MaxItems = 10)]",
      "public SByte[] ArrSbyteProp { get; set; }",
      "[TypeSpec.Helpers.JsonConverters.ArrayConstraint( MaxItems = 10)]",
      "public Byte[] ArrByteProp { get; set; }",
    ],
  );
});

it("handles enum, complex type properties, and circular references", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      /** A simple enum */
      enum Bar { /** one */ One, /** two */Two, /** three */ Three}
      /** A model with a circular references */
      model Baz {
        /** Mutually circular with Foo */
        fooProp?: Foo;
        /** Recursive definition */
        nextBazProp?: Baz;
      }
      /** A simple test model*/
      model Foo {
        /** enum */
        barProp?: Bar;
        /** circular */
        bazProp?: Baz;
      }
      `,
    [
      [
        "Foo.cs",
        [
          "public partial class Foo",
          `public Bar? BarProp { get; set; }`,
          `public Baz BazProp { get; set; }`,
        ],
      ],
      ["Bar.cs", ["public enum Bar"]],
      [
        "Baz.cs",
        [
          "public partial class Baz",
          `public Foo FooProp { get; set; }`,
          `public Baz NextBazProp { get; set; }`,
        ],
      ],
    ],
  );
});

it("processes sub-namespaces of a service", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      namespace Bar {
      /** A simple test model*/
      model Foo {
        #suppress "@azure-tools/typespec-azure-core/casing-style" "Testing"
        #suppress "@typespec/http-server-csharp/invalid-identifier" "Testing"
        /** An invalid name test */
        \`**()invalid~~Name\`?: string = "This is a string literal";
      }
  }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      `public string GeneratedInvalidName { get; set; } = "This is a string literal";`,
    ],
  );
});

it("creates Valid Identifiers", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A simple test model*/
      model Foo {
        #suppress "@azure-tools/typespec-azure-core/casing-style" "Testing"
        #suppress "@typespec/http-server-csharp/invalid-identifier" "Testing"
        /** An invalid name test */
        \`**()invalid~~Name\`?: string = "This is a string literal";
      }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      `[JsonPropertyName( "**()invalid~~Name")]`,
      `public string GeneratedInvalidName { get; set; } = "This is a string literal";`,
    ],
  );
});

it("Coalesces union types", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** object property */
        objectUnionProp: int32 | string;
        /** string property */
        stringUnionProp: "foo" | "bar" | "baz";
      }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      `public object ObjectUnionProp { get; set; }`,
      `public string StringUnionProp { get; set; }`,
    ],
  );
});

it("Organizes controllers by interface", async () => {});
it("Generates types for named model instantiation", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
       using TypeSpec.Rest.Resource;

       model Toy {
        @key("toyId")
        id: int64;
      
        petId: int64;
        name: string;
      }

       model ToyCollection is CollectionWithNextLink<Toy>;
    `,
    "ToyCollection.cs",
    ["public partial class ToyCollection"],
  );
});

it("Generates types for generic model instantiation", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
       using TypeSpec.Rest.Resource;

       model Toy {
        @key("toyId")
        id: int64;
      
        petId: int64;
        name: string;
      }

       op foo(): CollectionWithNextLink<Toy>;
    `,
    "ToyCollectionWithNextLink.cs",
    ["public partial class ToyCollectionWithNextLink"],
  );
});

it("Generates good name for model instantiation without hints", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
       using TypeSpec.Rest.Resource;

       model Toy {
        @key("toyId")
        id: int64;
      
        petId: int64;
        name: string;
      }

      model Foo<T> {
        prop: T;
      }

       op foo(): Foo<Toy>;
    `,
    "FooToy.cs",
    ["public partial class FooToy"],
  );
});

it("Generates types and controllers in a service subnamespace", async () => {
  await compileAndValidateMultiple(
    runner,
    `
       using TypeSpec.Rest.Resource;

       namespace MyService {
         model Toy {
          @key("toyId")
          id: int64;
      
          petId: int64;
          name: string;
        }

         op foo(): CollectionWithNextLink<Toy>;
      }
    `,
    [
      ["IMyServiceOperations.cs", ["interface IMyServiceOperations"]],
      [
        "MyServiceOperationsController.cs",
        ["public partial class MyServiceOperationsController: ControllerBase"],
      ],
      ["ToyCollectionWithNextLink.cs", ["public partial class ToyCollectionWithNextLink"]],
    ],
  );
});

it("Handles user-defined model templates", async () => {
  await compileAndValidateMultiple(
    runner,
    `
       using TypeSpec.Rest.Resource;

       namespace MyService {
         model Toy {
          @key("toyId")
          id: int64;
      
          petId: int64;
          name: string;
        }

       model ResponsePage<Item> {
        items: Item[];
        nextLink?: string;
       }

         op foo(): ResponsePage<Toy>;
      }
    `,
    [
      [
        "IMyServiceOperations.cs",
        ["interface IMyServiceOperations", "Task<ResponsePageToy> FooAsync( );"],
      ],
      [
        "MyServiceOperationsController.cs",
        [
          "public partial class MyServiceOperationsController: ControllerBase",
          "[ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ResponsePageToy))]",
          "public virtual async Task<IActionResult> Foo()",
        ],
      ],
      ["ResponsePageToy.cs", ["public partial class ResponsePageToy"]],
    ],
  );
});

it("Handles void type in operations", async () => {
  await compileAndValidateMultiple(
    runner,
    `
       using TypeSpec.Rest.Resource;

       namespace MyService {
         model Toy {
          @key("toyId")
          id: int64;
      
          petId: int64;
          name: string;
        }

      @friendlyName("{name}ListResults", Item)
       model ResponsePage<Item> {
        items: Item[];
        nextLink?: string;
       }

         @post @route("/foo") op foo(...Toy): void;
      }
    `,
    [
      ["IMyServiceOperations.cs", ["interface IMyServiceOperations"]],
      [
        "MyServiceOperationsController.cs",
        ["public partial class MyServiceOperationsController: ControllerBase"],
      ],
      ["Toy.cs", ["public partial class Toy"]],
    ],
  );
});

it("Handles empty body 2xx as void", async () => {
  await compileAndValidateMultiple(
    runner,
    `
       using TypeSpec.Rest.Resource;

       namespace MyService {
         model Toy {
          @key("toyId")
          id: int64;
      
          petId: int64;
          name: string;
        }

      @friendlyName("{name}ListResults", Item)
       model ResponsePage<Item> {
        items: Item[];
        nextLink?: string;
       }

         @post @route("/foo") op foo(...Toy): OkResponse;
      }
    `,
    [
      [
        "IMyServiceOperations.cs",
        ["interface IMyServiceOperations", "Task FooAsync( long id, long petId, string name)"],
      ],
      [
        "MyServiceOperationsController.cs",
        [
          "public partial class MyServiceOperationsController: ControllerBase",
          "public virtual async Task<IActionResult> Foo(Toy body)",
        ],
      ],
      ["Toy.cs", ["public partial class Toy"]],
    ],
  );
  deepStrictEqual([...runner.fs.keys()].filter((k) => k.includes("OkResponse.cs")).length, 0);
});

it("generates appropriate types for literals", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** Numeric literal */
        intProp: 8;
        /** Floating point literal */
        floatProp: 3.14;
        /** string literal */
        stringProp: "A string of characters";
        /** string template prop */
        stringTempProp: "\${Foo.stringProp} and then some";
        /** boolean */
        trueProp: true;
        /** boolean */
        falseProp: false;
      }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      "public int IntProp { get; } = 8",
      "public double FloatProp { get; } = 3.14",
      `public string StringProp { get; } = "A string of characters"`,
      `public string StringTempProp { get; } = "A string of characters and then some"`,
      "public bool TrueProp { get; } = true",
      "public bool FalseProp { get; } = false",
    ],
  );
});

it("generates appropriate types for literals in operation parameters", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** Numeric literal */
        @header intProp: 8;
        /** Floating point literal */
        @header floatProp: 3.14;
        /** string literal */
        @header stringProp: "A string of characters";
        /** string template prop */
        @header stringTempProp: "\${Foo.stringProp} and then some";
        /** boolean */
        @header trueProp: true;
        /** boolean */
        @header falseProp: false;
      }

      @route("/foo") op foo(...Foo): void;
      `,
    [
      [
        "Foo.cs",
        [
          "public partial class Foo",
          "public int IntProp { get; } = 8",
          "public double FloatProp { get; } = 3.14",
          `public string StringProp { get; } = "A string of characters"`,
          `public string StringTempProp { get; } = "A string of characters and then some"`,
          "public bool TrueProp { get; } = true",
          "public bool FalseProp { get; } = false",
        ],
      ],
      [
        "ContosoOperationsController.cs",
        [
          `public virtual async Task<IActionResult> Foo([FromHeader(Name="int-prop")] int intProp = 8, [FromHeader(Name="float-prop")] double floatProp = 3.14, [FromHeader(Name="string-prop")] string stringProp = "A string of characters", [FromHeader(Name="string-temp-prop")] string stringTempProp = "A string of characters and then some", [FromHeader(Name="true-prop")] bool trueProp = true, [FromHeader(Name="false-prop")] bool falseProp = false)`,
        ],
      ],
      [
        "IContosoOperations.cs",
        [
          `Task FooAsync( int intProp, double floatProp, string stringProp, string stringTempProp, bool trueProp, bool falseProp);`,
        ],
      ],
    ],
  );
});

it("generates appropriate types for literal tuples in operation parameters", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** Numeric literal */
        @header intProp: [8, 10];
        /** Floating point literal */
        @header floatProp: [3.14, 5.2];
        /** string literal */
        @header stringProp: "string of characters";
        /** string literal */
        @header stringArrayProp: ["A string of characters", "and another"];
        /** string template prop */
        @header stringTempProp: ["A \${Foo.stringProp} and then some", "Yet another \${Foo.stringProp}"];
        /** boolean */
        @header trueProp: [true, true];
        /** boolean */
        @header falseProp: [false, false];
      }

      @route("/foo") op foo(...Foo): void;
      `,
    [
      [
        "Foo.cs",
        [
          "public partial class Foo",
          "public int[] IntProp { get; } = [8, 10]",
          "public double[] FloatProp { get; } = [3.14, 5.2]",
          `public string StringProp { get; } = "string of characters"`,
          `public string[] StringArrayProp { get; } = ["A string of characters", "and another"]`,
          `public string[] StringTempProp { get; } = ["A string of characters and then some", "Yet another string of characters"]`,
          "public bool[] TrueProp { get; } = [true, true]",
          "public bool[] FalseProp { get; } = [false, false]",
        ],
      ],
      [
        "ContosoOperationsController.cs",
        [
          `public virtual async Task<IActionResult> Foo([FromHeader(Name="int-prop")] int[] intProp, [FromHeader(Name="float-prop")] double[] floatProp, [FromHeader(Name="string-prop")] string stringProp = "string of characters", [FromHeader(Name="string-array-prop")] string[] stringArrayProp, [FromHeader(Name="string-temp-prop")] string[] stringTempProp, [FromHeader(Name="true-prop")] bool[] trueProp, [FromHeader(Name="false-prop")] bool[] falseProp)`,
        ],
      ],
      [
        "IContosoOperations.cs",
        [
          `Task FooAsync( int[] intProp, double[] floatProp, string stringProp, string[] stringArrayProp, string[] stringTempProp, bool[] trueProp, bool[] falseProp);`,
        ],
      ],
    ],
  );
});

it("generates valid code for overridden parameters", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      /** A base model */
      model FooBase {
        intProp: int32[];
      }
      /** A simple test model*/
      model Foo extends FooBase {
        /** Numeric literal */
        intProp: [8, 10];
        
      }

      @route("/foo") op foo(): void;
      `,
    [
      ["FooBase.cs", ["public partial class FooBase", "public int[] IntProp { get; set; }"]],
      [
        "Foo.cs",
        ["public partial class Foo : FooBase", "public new int[] IntProp { get; } = [8, 10]"],
      ],
      ["ContosoOperationsController.cs", [`public virtual async Task<IActionResult> Foo()`]],
      ["IContosoOperations.cs", [`Task FooAsync( );`]],
    ],
  );
});

it("generates valid code for anonymous models", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** Numeric literal */
        intProp: [8, 10];
        #suppress "@typespec/http-server-csharp/anonymous-model" "This is a test"
        /** A complex property */
        modelProp: {
          bar: string;
        };
        #suppress "@typespec/http-server-csharp/anonymous-model" "This is a test"
        anotherModelProp: {
          baz: string;
        };
        
        yetAnother: Foo.modelProp;
        
      }

      @route("/foo") op foo(): void;
      `,
    [
      ["Model0.cs", ["public partial class Model0", "public string Bar { get; set; }"]],
      ["Model1.cs", ["public partial class Model1", "public string Baz { get; set; }"]],
      [
        "Foo.cs",
        [
          "public partial class Foo",
          "public int[] IntProp { get; } = [8, 10]",
          "public Model0 ModelProp { get; set; }",
          "public Model1 AnotherModelProp { get; set; }",
          "public Model0 YetAnother { get; set; }",
        ],
      ],
      ["ContosoOperationsController.cs", [`public virtual async Task<IActionResult> Foo()`]],
      ["IContosoOperations.cs", [`Task FooAsync( );`]],
    ],
  );
});

it("handles nullable types correctly", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** Nullable numeric property */
        intProp: int32 | null;
        /** Nullable reference type */
        stringProp: string | null;
        #suppress "@typespec/http-server-csharp/anonymous-model" "This is a test"
        /** A complex property */
        modelProp: {
          bar: string;
        } | null;
        #suppress "@typespec/http-server-csharp/anonymous-model" "This is a test"
        anotherModelProp: {
          baz: string;
        };
        
        yetAnother: Foo.modelProp | null;
        
      }

      @route("/foo") op foo(): void;
      `,
    [
      ["Model0.cs", ["public partial class Model0", "public string Bar { get; set; }"]],
      ["Model1.cs", ["public partial class Model1", "public string Baz { get; set; }"]],
      [
        "Foo.cs",
        [
          "public partial class Foo",
          "public int? IntProp { get; set; }",
          "public string StringProp { get; set; }",
          "public Model0 ModelProp { get; set; }",
          "public Model1 AnotherModelProp { get; set; }",
          "public Model0 YetAnother { get; set; }",
        ],
      ],
      ["ContosoOperationsController.cs", [`public virtual async Task<IActionResult> Foo()`]],
      ["IContosoOperations.cs", [`Task FooAsync( );`]],
    ],
  );
});

it("handles implicit request body models correctly", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      #suppress "@typespec/http-server-csharp/anonymous-model" "Test"
      @route("/foo") @post op foo(intProp?: int32, arrayProp?: string[]): void;
      `,
    [
      [
        "Model0.cs",
        [
          "public partial class Model0",
          "public int? IntProp { get; set; }",
          "public string[] ArrayProp { get; set; }",
        ],
      ],
      [
        "ContosoOperationsController.cs",
        [
          `public virtual async Task<IActionResult> Foo(Model0 body)`,
          ".FooAsync(body?.IntProp, body?.ArrayProp)",
        ],
      ],
      ["IContosoOperations.cs", [`Task FooAsync( int? intProp, string[]? arrayProp);`]],
    ],
  );
});

it("handles multipartBody requests and shared routes", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      model Bar<T extends {}> {
        ...T;
      }
      model FooRequest {
        contents: HttpPart<File>;
        other: HttpPart<Bar<FooJsonRequest>>;
      }
      model FooJsonRequest {
        mediaType: string;
        filename: string;
        contents: bytes;
      }

      @sharedRoute
      @route("/foo/{id}") 
      @post 
      op fooBinary(
        @path id: string,
        @header("content-type") contentType: "multipart/form-data", 
        @multipartBody body: FooRequest
      ): void;

      @sharedRoute
      @route("/foo/{id}") 
      @post 
      op fooJson(
        @path id: string,
        @header("content-type") contentType: "application/json", 
        @body body: FooJsonRequest
      ): void;
      `,
    [
      [
        "FooJsonRequest.cs",
        [
          "public partial class FooJsonRequest",
          "public string MediaType { get; set; }",
          "public string Filename { get; set; }",
          "public byte[] Contents { get; set; }",
        ],
      ],
      [
        "ContosoOperationsController.cs",
        [
          "using Microsoft.AspNetCore.WebUtilities;",
          "using Microsoft.AspNetCore.Http.Extensions;",
          `[Consumes("multipart/form-data")]`,
          "public virtual async Task<IActionResult> FooBinary(string id)",
          ".FooBinaryAsync(id, reader)",
          "public virtual async Task<IActionResult> FooJson(string id, FooJsonRequest body)",
          ".FooJsonAsync(id, body)",
        ],
      ],
      [
        "IContosoOperations.cs",
        [
          "using Microsoft.AspNetCore.WebUtilities;",
          "Task FooBinaryAsync( string id, MultipartReader reader);",
          "Task FooJsonAsync( string id, FooJsonRequest body);",
        ],
      ],
      [
        "BarFooJsonRequest.cs",
        [
          "public partial class BarFooJsonRequest",
          "public string MediaType { get; set; }",
          "public string Filename { get; set; }",
          "public byte[] Contents { get; set; }",
        ],
      ],
    ],
  );

  const files = [...runner.fs.keys()];
  assert.deepStrictEqual(
    files.some((k) => k.endsWith("HttpPartFile.cs")),
    false,
  );
  assert.deepStrictEqual(
    files.some((k) => k.endsWith("FooRequest.cs")),
    false,
  );
});

it("Produces NoContent result", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      @error
  model NotFoundErrorResponse {
     @statusCode statusCode: 404;
     code: "not-found";
  }
model ApiError {
  /** A machine readable error code */
  code: string;

  /** A human readable message */
  message: string;
}
    /**
 * Something is wrong with you.
 */
model Standard4XXResponse extends ApiError {
  @minValue(400)
  @maxValue(499)
  @statusCode
  statusCode: int32;
}

/**
 * Something is wrong with me.
 */
model Standard5XXResponse extends ApiError {
  @minValue(500)
  @maxValue(599)
  @statusCode
  statusCode: int32;
}

model FileAttachmentMultipartRequest {
  contents: HttpPart<File>;
}

    alias WithStandardErrors<T> = T | Standard4XXResponse | Standard5XXResponse;

    @post
    op createFileAttachment(
      @header contentType: "multipart/form-data",
      @path itemId: int32,
      @multipartBody body: FileAttachmentMultipartRequest,
    ): WithStandardErrors<NoContentResponse | NotFoundErrorResponse>;
    `,
    [["ContosoOperationsController.cs", ["return NoContent()"]]],
  );
});

it("Produces correct scaffolding", async () => {
  await compileAndValidateMultiple(
    await createCSharpServiceEmitterTestRunner({ "emit-mocks": "all" }),
    `
      @error
  model NotFoundErrorResponse {
     @statusCode statusCode: 404;
     code: "not-found";
  }
model ApiError {
  /** A machine readable error code */
  code: string;

  /** A human readable message */
  message: string;
}
    /**
 * Something is wrong with you.
 */
model Standard4XXResponse extends ApiError {
  @minValue(400)
  @maxValue(499)
  @statusCode
  statusCode: int32;
}

/**
 * Something is wrong with me.
 */
model Standard5XXResponse extends ApiError {
  @minValue(500)
  @maxValue(599)
  @statusCode
  statusCode: int32;
}

model FileAttachmentMultipartRequest {
  contents: HttpPart<File>;
}

    alias WithStandardErrors<T> = T | Standard4XXResponse | Standard5XXResponse;

    @post
    op createFileAttachment(
      @header contentType: "multipart/form-data",
      @path itemId: int32,
      @multipartBody body: FileAttachmentMultipartRequest,
    ): WithStandardErrors<NoContentResponse | NotFoundErrorResponse>;
    `,
    [
      ["IInitializer.cs", ["public interface IInitializer"]],
      ["Initializer.cs", ["public class Initializer : IInitializer"]],
      ["ContosoOperations.cs", ["public class ContosoOperations : IContosoOperations"]],
      [
        "MockRegistration.cs",
        ["public static class MockRegistration", "<IContosoOperations, ContosoOperations>()"],
      ],
      ["Program.cs", ["MockRegistration"]],
    ],
  );
});
