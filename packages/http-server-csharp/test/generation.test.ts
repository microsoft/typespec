import { Program, Type, navigateProgram } from "@typespec/compiler";
import { BasicTestRunner, resolveVirtualPath } from "@typespec/compiler/testing";
import assert, { deepStrictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
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

function assertFileDoesNotContain(
  fileName: string,
  fileContents: string,
  searchString: string,
): void {
  assert.strictEqual(
    fileContents.includes(searchString),
    false,
    `Unwanted "${searchString}" found in ${fileName}, contents of file: ${fileContents}`,
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
  code: string | [string, string],
  fileChecks: [string, string[]][],
  notFileChecks?: [string, string[]][],
): Promise<void> {
  const spec =
    typeof code === "string" ? getStandardService(code) : getStandardService(code[0], code[1]);
  await runner.compile(spec);
  for (const [fileToCheck, expectedContent] of fileChecks) {
    const [modelKey, modelContents] = getGeneratedFile(runner, fileToCheck);
    expectedContent.forEach((element) => {
      assertFileContains(modelKey, modelContents, element);
    });
  }

  if (notFileChecks) {
    for (const [fileToCheck, expectedContent] of notFileChecks) {
      const [modelKey, modelContents] = getGeneratedFile(runner, fileToCheck);
      expectedContent.forEach((element) => {
        assertFileDoesNotContain(modelKey, modelContents, element);
      });
    }
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
      "[NumericConstraint<int>( MinValue = 100, MaxValue = 1000)]",
      "public int? Int32Prop { get; set; }",
      "[NumericConstraint<UInt32>( MaxValue = 5000)]",
      "public UInt32? Uint32Prop { get; set; }",
      "[NumericConstraint<float>( MinValue = 0, MinValueExclusive = true)]",
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
      "[StringConstraint( MinLength = 3, MaxLength = 72)]",
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
it("generates default values in required properties", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      /** A simple test model*/
      model Foo {
        /** string literal */
        stringLiteralProp: string = "This is a string literal";
        /** boolean literal */
        boolLiteralProp: boolean =  true;
        /** numeric literal */
        numericLiteralProp: int32 = 17;
      }
      `,
    "Foo.cs",
    [
      "public partial class Foo",
      `public string StringLiteralProp { get; set; } = "This is a string literal";`,
      "public bool BoolLiteralProp { get; set; } = true;",
      "public int NumericLiteralProp { get; set; } = 17;",
    ],
  );
});

it("generates standard scalar array properties", async () => {
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

it("generates standard scalar array constraints", async () => {
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
      "[ArrayConstraint<SByte>( MinItems = 1, MaxItems = 10)]",
      "public SByte[] ArrSbyteProp { get; set; }",
      "[ArrayConstraint<Byte>( MaxItems = 10)]",
      "public Byte[] ArrByteProp { get; set; }",
    ],
  );
});

it("generates standard scalar array for uniqueItems properties", async () => {
  await compileAndValidateMultiple(
    runner,
    `    
      /** A simple test model*/
      model Foo {
        /** Names */
        @uniqueItems 
        arrUniqueNames: string[];

        /** Colors */
        @uniqueItems
        arrUniqueColors: Array<string>;
      }
        
     @patch(#{implicitOptionality: true}) @route("/Foo") op update(...Foo): Foo;

      `,
    [
      [
        "Foo.cs",
        [
          "public partial class Foo",
          "public ISet<string> ArrUniqueNames { get; set; }",
          "public ISet<string> ArrUniqueColors { get; set; }",
        ],
      ],
      [
        "IContosoOperations.cs",
        ["Task<Foo> UpdateAsync( ISet<string> arrUniqueNames, ISet<string> arrUniqueColors)"],
      ],
    ],
  );
});

it("generates standard scalar array for uniqueItems model", async () => {
  await compileAndValidateSingleModel(
    runner,
    `    
      /** A simple test model*/
      @uniqueItems
      model Foo is Array<string>;
      @get @route("/Foo") op list(): Foo[];
      @route("/Foo/{id}") @get op get(@path id: string): Foo;
      `,
    "IContosoOperations.cs",
    ["Task<ISet<string>[]> ListAsync( )", "Task<ISet<string>> GetNameAsync( string id)"],
  );
});

it("generates standard array properties", async () => {
  await compileAndValidateMultiple(
    runner,
    `    
      /** A simple test model*/
      model Foo {
        /** Names */
        arrNames: string[];

        /** Colors */
        arrColors: Array<string>;
      }
        
     @patch(#{implicitOptionality: true})@route("/Foo") op update(...Foo): Foo[];

      `,
    [
      [
        "Foo.cs",
        [
          "public partial class Foo",
          "public string[] ArrNames { get; set; }",
          "public string[] ArrColors { get; set; }",
        ],
      ],
      [
        "IContosoOperations.cs",
        ["Task<Foo[]> UpdateAsync( string[] arrNames, string[] arrColors)"],
      ],
    ],
  );
});
it("generates bytes array properties", async () => {
  await compileAndValidateMultiple(
    runner,
    `    
      /** A simple test model*/
      model Foo {
        /** Names */
        arrBytes: uint8[];

        /** Colors */
        arrSBytes: int8[];
      }
        
     @patch(#{implicitOptionality: true})@route("/Foo") op update(...Foo): int8[];

      `,
    [
      [
        "Foo.cs",
        [
          "public partial class Foo",
          "public Byte[] ArrBytes { get; set; }",
          "public SByte[] ArrSBytes { get; set; }",
        ],
      ],
      ["IContosoOperations.cs", ["Task<SByte[]> UpdateAsync( Byte[] arrBytes, SByte[] arrSBytes)"]],
    ],
  );
});

it("handles enum, complex type properties, and circular references", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      /** A simple enum */
      enum SimpleBar { /** one */ One, /** two */Two, /** three */ Three}
      /** A named enum */
      enum ComplexBar {/** one */ One: "first", /** two */Two: "second", /** three */ Three: "third"}
      /** An escaped enum */
      enum EscapedBar {/** one */ One:"2023-02-01-preview", /** two */Two:"2024-02-01-preview", /** three */ Three:"2025-02-01"}
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
        barProp?: SimpleBar;
        /** circular */
        bazProp?: Baz;
      }
      `,
    [
      [
        "Foo.cs",
        [
          "public partial class Foo",
          `public SimpleBar? BarProp { get; set; }`,
          `public Baz BazProp { get; set; }`,
        ],
      ],
      [
        "SimpleBar.cs",
        [
          "[JsonConverter(typeof(JsonStringEnumConverter))]",
          "public enum SimpleBar",
          "One",
          "Two",
          "Three",
        ],
      ],
      [
        "ComplexBar.cs",
        [
          "[JsonConverter(typeof(JsonStringEnumConverter))]",
          "public enum ComplexBar",
          `[JsonStringEnumMemberName("first")]`,
          "One",
          `[JsonStringEnumMemberName("second")]`,
          "Two",
          `[JsonStringEnumMemberName("third")]`,
          "Three",
        ],
      ],
      [
        "EscapedBar.cs",
        [
          "[JsonConverter(typeof(JsonStringEnumConverter))]",
          "public enum EscapedBar",
          `[JsonStringEnumMemberName("2023-02-01-preview")]`,
          `[JsonStringEnumMemberName("2024-02-01-preview")]`,
          `[JsonStringEnumMemberName("2025-02-01")]`,
        ],
      ],
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

it("handles integer enums", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      /** An integer enum */
      enum IntegerEnum { /** one */ One: 1, /** three */Three: 3, /** five */ Five: 5}
      /** A simple test model*/
      model Foo {
        /** enum */
        barProp?: IntegerEnum;

        /** non-nullable enum */
        bazProp: IntegerEnum;
      }
`,
    [
      [
        "Foo.cs",
        [
          "public partial class Foo",
          `public IntegerEnum? BarProp { get; set; }`,
          `public IntegerEnum BazProp { get; set; }`,
        ],
      ],
    ],
  );
});

it("handles non-integer numeric enums", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      /** A floating point enum */
      enum DoubleEnum { /** one */ One: 1.1, /** three */Three: 3.333, /** five */ Five: 5.55555}
      /** A mixed integer and float enum */
      enum MixedEnum { /** one */ One: 1, /** three */Three: 3.3, /** five */ Five: 5}
      /** A simple test model*/
      model Foo {
        /** nullable enum */
        barNullableProp?: DoubleEnum;
        /** enum */
        barProp: DoubleEnum;
        /** non-nullable enum */
        bazProp: MixedEnum;
        /** nullable enum */
        bazNullableProp?: MixedEnum;
      }
      `,
    [
      [
        "Foo.cs",
        [
          "public partial class Foo",
          `public double BarProp { get; set; }`,
          `public double? BarNullableProp { get; set; }`,
          `public double BazProp { get; set; }`,
          `public double? BazNullableProp { get; set; }`,
        ],
      ],
    ],
  );
});

it("handles extensible enums and discriminators for inheritance", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      /** An extensible string union */
      union PetType { /** Dog */ Dog: "dog", /** Cat */ Cat: "cat", string}
      /** A fixed string union */
      union AnimalType {/** Wolf */ Wolf: "wolf", /** Bear */ Bear: "bear"}

      /** another extensible string union */
      union WolfBreed {string, red: "red", timber: "timber", dire: "dire"}

      /** base discriminated type */
      @discriminator("kind")
      model Pet {
        /** The disriminated type */
        kind: PetType;

        /** The name */
        name: string;

        /** Age in years */
        age: safeint;
      }
      
      /** A leaf instance */
      model Dog extends Pet {
        /** specific kind */
        kind: PetType.Dog;
      /** tail length */
        tail: "long" | "short";
      }

      /** A leaf instance */
      model Cat extends Pet {
        /** specific kind */
        kind: PetType.Cat;
        /** hair length */
        hair: "long" | "short" | "hairless";
      }
      
      /** A base animal */
      @discriminator("kind")
      model Animal {
        /** The animal */
        kind: AnimalType;
      }

      /** A leaf animal */
      model Wolf extends Animal {
        kind: AnimalType.Wolf;
        variety: WolfBreed = WolfBreed.dire;
      }

      /** A leaf animal */
      model Bear extends Animal {
        kind: AnimalType.Bear;
        color: "brown" | "black" | "white";

      }
      `,
    [
      [
        "Pet.cs",
        [
          "public partial class Pet",
          "[JsonConverter(typeof(JsonStringEnumConverter))]",
          `public PetType Kind { get; set; }`,
          `public string Name { get; set; }`,
          `public long Age { get; set; }`,
        ],
      ],
      [
        "Animal.cs",
        [
          "public partial class Animal",
          "[JsonConverter(typeof(JsonStringEnumConverter))]",
          `public AnimalType Kind { get; set; }`,
        ],
      ],
      [
        "Dog.cs",
        [
          "public partial class Dog : Pet {",
          `public new PetType Kind { get; } = PetType.Dog;`,
          `public string Tail { get; set; }`,
        ],
      ],
      [
        "Cat.cs",
        [
          "public partial class Cat : Pet {",
          `public new PetType Kind { get; } = PetType.Cat;`,
          `public string Hair { get; set; }`,
        ],
      ],
      [
        "Bear.cs",
        [
          "public partial class Bear : Animal {",
          `public new AnimalType Kind { get; } = AnimalType.Bear;`,
          `public string Color { get; set; }`,
        ],
      ],
      [
        "Wolf.cs",
        [
          "public partial class Wolf : Animal {",
          `public new AnimalType Kind { get; } = AnimalType.Wolf;`,
          `public WolfBreed Variety { get; set; } = WolfBreed.Dire`,
        ],
      ],
      [
        "PetType.cs",
        [
          "[JsonConverter(typeof(JsonStringEnumConverter))]",
          "public enum PetType",
          `[JsonStringEnumMemberName("dog")]`,
          "Dog,",
          `[JsonStringEnumMemberName("cat")]`,
          "Cat",
        ],
      ],
      [
        "AnimalType.cs",
        [
          "[JsonConverter(typeof(JsonStringEnumConverter))]",
          "public enum AnimalType",
          `[JsonStringEnumMemberName("wolf")]`,
          "Wolf,",
          `[JsonStringEnumMemberName("bear")]`,
          "Bear",
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

it("Generates types for named model instantiation", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
       using Rest.Resource;

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
       using Rest.Resource;

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
       using Rest.Resource;

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

it("Generates good names for anonymous responses", async () => {
  await compileAndValidateMultiple(
    runner,
    `
       using Rest.Resource;

       model Toy {
        @key("toyId")
        id: int64;
      
        petId: int64;
        name: string;
      }

      model Foo<T> {
        prop: T;
      }

      #suppress "@typespec/http-server-csharp/anonymous-model" "test"
      #suppress "@typespec/http-server-csharp/invalid-identifier" "test"
       op foo(): { /** a property */ foo: Foo<Toy>};
    `,
    [
      ["FooToy.cs", ["public partial class FooToy", "public Toy Prop { get; set; }"]],
      [
        "ContosoOperationsFooResponse.cs",
        ["public partial class ContosoOperationsFooResponse", "public FooToy Foo { get; set; }"],
      ],
      [
        "ContosoOperationsController.cs",
        [
          "public partial class ContosoOperationsController",
          "[ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(ContosoOperationsFooResponse))]",
          "public virtual async Task<IActionResult> Foo()",
        ],
      ],
    ],
  );
});

it("Generates types and controllers in a service subnamespace", async () => {
  await compileAndValidateMultiple(
    runner,
    `
       using Rest.Resource;

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

it("Handles MergePatchUpdate", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      
model Widget {
  id: string;
  weight: int32;
  color: "red" | "blue";
}

model WidgetList {
  items: Widget[];
}

@error
model Error {
  code: int32;
  message: string;
}

model AnalyzeResult {
  id: string;
  analysis: string;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  /** Update a widget */
  @patch update(@path id: string, @body body: MergePatchUpdate<Widget>): Widget | Error;
}
    `,
    [
      [
        "IWidgets.cs",
        [
          "using TypeSpec.Http;",
          "public interface IWidgets",
          "Task<Widget> UpdateAsync( string id, WidgetMergePatchUpdate body);",
        ],
      ],
      [
        "WidgetsController.cs",
        [
          "using TypeSpec.Http;",
          "public partial class WidgetsController: ControllerBase",
          "public virtual async Task<IActionResult> Update(string id, WidgetMergePatchUpdate body)",
        ],
      ],
      [
        "WidgetMergePatchUpdate.cs",
        [
          "namespace TypeSpec.Http {",
          "public string Id { get; set; }",
          "public int? Weight { get; set; }",
          "public string Color { get; set; }",
        ],
      ],
    ],
  );
});

it("Handles user-defined model templates", async () => {
  await compileAndValidateMultiple(
    runner,
    `
       using Rest.Resource;

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
       using Rest.Resource;

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
       using Rest.Resource;

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
          "public virtual async Task<IActionResult> Foo(MyServiceOperationsFooRequest body)",
          ".FooAsync(body.Id, body.PetId, body.Name)",
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

it("generates appropriate types for records", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      /** A simple test model*/
      model BarResponse {
        /** Typed record */
        recordProp: Record<string>;
        /** Floating point literal */
        stringMap: Record<string>;
      }

      @route("/foo") @post op foo(recordProp: Record<string>): Record<unknown>;
      @route("/foo") @get op bar(): BarResponse;
      `,
    [
      [
        "BarResponse.cs",
        [
          "using System.Text.Json.Nodes;",
          "namespace Microsoft.Contoso",
          "public partial class BarResponse",
          "public JsonObject RecordProp { get; set; }",
          "public JsonObject StringMap { get; set; }",
        ],
      ],
      [
        "ContosoOperationsFooRequest.cs",
        [
          "using System.Text.Json.Nodes;",
          "namespace Microsoft.Contoso",
          "public partial class ContosoOperationsFooRequest",
          "public JsonObject RecordProp { get; set; }",
        ],
      ],
      [
        "ContosoOperationsController.cs",
        [
          "using System.Text.Json.Nodes;",
          "namespace Microsoft.Contoso.Controllers",
          "[ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(JsonObject))]",
          `public virtual async Task<IActionResult> Foo(ContosoOperationsFooRequest body)`,
          `public virtual async Task<IActionResult> Bar()`,
        ],
      ],
      [
        "IContosoOperations.cs",
        [
          "using System.Text.Json.Nodes;",
          "namespace Microsoft.Contoso",
          `Task<JsonObject> FooAsync( JsonObject recordProp);`,
          `Task<BarResponse> BarAsync( );`,
        ],
      ],
    ],
  );
});

it("generates appropriate types for inherited instantiated models", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      /** A simple test model*/
      model BarResponse extends File {
        
      }

      @route("/foo") @post op foo(recordProp: Record<string>): Record<unknown>;
      @route("/foo") @get op bar(): BarResponse;
      `,
    [
      [
        "FileStringNameBytes.cs",
        ["namespace TypeSpec.Http", "public partial class FileStringNameBytes"],
      ],
      [
        "BarResponse.cs",
        [
          "using TypeSpec.Http;",
          "namespace Microsoft.Contoso",
          "public partial class BarResponse : FileStringNameBytes",
        ],
      ],
      [
        "ContosoOperationsFooRequest.cs",
        [
          "using System.Text.Json.Nodes;",
          "namespace Microsoft.Contoso",
          "public partial class ContosoOperationsFooRequest",
          "public JsonObject RecordProp { get; set; }",
        ],
      ],
      [
        "ContosoOperationsController.cs",
        [
          "using System.Text.Json.Nodes;",
          "namespace Microsoft.Contoso.Controllers",
          "[ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(JsonObject))]",
          `public virtual async Task<IActionResult> Foo(ContosoOperationsFooRequest body)`,
          `public virtual async Task<IActionResult> Bar()`,
        ],
      ],
      [
        "IContosoOperations.cs",
        [
          "using System.Text.Json.Nodes;",
          "namespace Microsoft.Contoso",
          `Task<JsonObject> FooAsync( JsonObject recordProp);`,
          `Task<BarResponse> BarAsync( );`,
        ],
      ],
    ],
  );
});

it("generates appropriate types for arrays", async () => {
  await compileAndValidateMultiple(
    await createCSharpServiceEmitterTestRunner({ "emit-mocks": "mocks-and-project-files" }),
    [
      `
      @doc("Template to have Array operations")
      interface ArrayOperations<TArr> {
        /** Get an array value */
        @get
        get(): TArr;
 
        /** Put an array value */
        @put
        put(@body body: TArr): void;
      }


      @doc("Array inner model")
    model InnerModel {
      @doc("Required string property")
      property: string;

      @doc("self reference")
      children?: InnerModel[];
    }

    alias NullableModel = InnerModel | null;
    @doc("Array of nullable model values")
    @route("/nullable-model")
    interface NullableModelValue
      extends ArrayOperations<NullableModel[]> {}
      `,
      "Type.Array",
    ],
    [
      [
        "InnerModel.cs",
        [
          "namespace TypeName.Array",
          "public partial class InnerModel",
          "public string Property { get; set; }",
          "public InnerModel[] Children { get; set; }",
        ],
      ],
      [
        "NullableModelValueController.cs",
        [
          "using TypeName.Array;",
          "namespace TypeName.Array.Controllers",
          "[ProducesResponseType((int)HttpStatusCode.OK, Type = typeof(InnerModel[]))]",
          `public virtual async Task<IActionResult> GetName()`,
          "[ProducesResponseType((int)HttpStatusCode.NoContent, Type = typeof(void))]",
          `public virtual async Task<IActionResult> Put(InnerModel[] body)`,
        ],
      ],
      [
        "INullableModelValue.cs",
        [
          "namespace TypeName.Array",
          `Task<InnerModel[]> GetNameAsync( );`,
          `Task PutAsync( InnerModel[] body);`,
        ],
      ],
    ],
    [
      ["InnerModel.cs", ["using TypeSpec.Service", "using undefined"]],
      ["INullableModelValue.cs", ["using TypeSpec.Service", "using undefined"]],
      ["NullableModelValueController.cs", ["using TypeSpec.Service", "using undefined"]],
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
        "ContosoOperationsController.cs",
        [
          `public virtual async Task<IActionResult> Foo(ContosoOperationsFooRequest body)`,
          ".FooAsync(body.IntProp, body.ArrayProp)",
        ],
      ],
      ["IContosoOperations.cs", [`Task FooAsync( int? intProp, string[]? arrayProp);`]],
      ["ContosoOperationsFooRequest.cs", ["namespace Microsoft.Contoso {"]],
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

it("handles complex multipartBody requests", async () => {
  await compileAndValidateMultiple(
    runner,
    `
      model Bar<T extends {}> {
        ...T;
      }

      model FileRequiredMetaData extends File {
        filename: string;
        contentType: string;
      }
        
      model Address {
        city: string;
      }

      model FooRequest {
        id: HttpPart<string>;
        address: HttpPart<Address>;
        profileImage: HttpPart<FileRequiredMetaData>;
        previousAddresses: HttpPart<Address[]>;
        pictures: HttpPart<FileRequiredMetaData>[];
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
          "using Microsoft.Contoso;",
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

const multipartSpec = `
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
`;

it("Produces correct scaffolding", async () => {
  await compileAndValidateMultiple(
    await createCSharpServiceEmitterTestRunner({ "emit-mocks": "mocks-and-project-files" }),
    multipartSpec,
    [
      ["IInitializer.cs", ["public interface IInitializer"]],
      ["Initializer.cs", ["public class Initializer : IInitializer"]],
      ["ContosoOperations.cs", ["public class ContosoOperations : IContosoOperations"]],
      [
        "MockRegistration.cs",
        [
          "public static class MockRegistration",
          "<IContosoOperations, ContosoOperations>()",
          "builder.Services.AddHttpContextAccessor();",
        ],
      ],
      ["Program.cs", ["MockRegistration"]],
      ["README.md", [`  - \`mocks/ContosoOperations.cs\``]],
      ["usage.md", [`**controllers**`]],
      ["emitter.md", [`@typespec/http-server-csharp`]],
    ],
  );
});

it("Does not overwrite mock files", async () => {
  const runner = await createCSharpServiceEmitterTestRunner({
    "emit-mocks": "mocks-and-project-files",
  });
  runner.fs.set(
    resolveVirtualPath("@typespec", "http-server-csharp", "ServiceProject.csproj"),
    "ServiceProject\n",
  );
  await compileAndValidateMultiple(runner, multipartSpec, [
    ["ServiceProject.csproj", ["ServiceProject"]],
  ]);
});

it("Does overwrite mock files with overWrite option", async () => {
  const runner = await createCSharpServiceEmitterTestRunner({
    "emit-mocks": "mocks-and-project-files",
    overwrite: true,
  });
  runner.fs.set(
    resolveVirtualPath("@typespec", "http-server-csharp", "ServiceProject.csproj"),
    "ServiceProject\n",
  );
  await compileAndValidateMultiple(runner, multipartSpec, [
    ["ServiceProject.csproj", ["<TargetFramework>net9.0</TargetFramework>"]],
  ]);
});

it("reads default location for OpenAPI from config", async () => {
  const runner = await createCSharpServiceEmitterTestRunner({
    "emit-mocks": "mocks-and-project-files",
    "use-swaggerui": true,
  });
  runner.fs.set(
    resolveVirtualPath("tspconfig.yaml"),
    `
emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    emitter-output-dir: "{project-root}/openapi"
    output-file: "openapi.yaml"

`,
  );
  await compileAndValidateMultiple(runner, multipartSpec, [
    [
      "Program.cs",
      [
        "builder.Services.AddSwaggerGen();",
        "app.UseSwagger();",
        "app.UseSwaggerUI( c=> {",
        `c.DocumentTitle = "TypeSpec Generated OpenAPI Viewer";`,
        `c.SwaggerEndpoint("/openapi.yaml", "TypeSpec Generated OpenAPI Docs");`,
        `c.RoutePrefix = "swagger";`,
        `var externalFilePath = "../../openapi/openapi.yaml"; // Full path to the file outside the project`,
      ],
    ],
  ]);
});

it("Handles spread parameters", async () => {
  await compileAndValidateMultiple(
    await createCSharpServiceEmitterTestRunner({ "emit-mocks": "mocks-and-project-files" }),
    `
    model Widget {
      @path id: string;
      @query kind?: string;
      color: string;
    }

    @route("/widgets")

    @post op create(...Widget) : Widget;

    `,
    [
      [
        "IContosoOperations.cs",
        ["Task<Widget> CreateAsync( string id, string color, string? kind);"],
      ],
      [
        "ContosoOperations.cs",
        [
          "public class ContosoOperations : IContosoOperations",
          "public ContosoOperations(IInitializer initializer, IHttpContextAccessor accessor)",
          "_initializer = initializer;",
          "HttpContextAccessor = accessor;",
          "public IHttpContextAccessor HttpContextAccessor { get; }",
          "public Task<Widget> CreateAsync( string id, string color, string? kind)",
        ],
      ],
      ["ContosoOperationsCreateRequest.cs", ["namespace Microsoft.Contoso {"]],
      [
        "ContosoOperationsController.cs",
        [
          `public virtual async Task<IActionResult> Create(string id, ContosoOperationsCreateRequest body, [FromQuery(Name="kind")] string? kind)`,
          ".CreateAsync(id, body.Color, kind)",
        ],
      ],
      [
        "MockRegistration.cs",
        ["public static class MockRegistration", "<IContosoOperations, ContosoOperations>()"],
      ],
      ["Program.cs", ["MockRegistration"]],
    ],
  );
});

it("Handles bodyRoot parameters", async () => {
  await compileAndValidateMultiple(
    await createCSharpServiceEmitterTestRunner({ "emit-mocks": "mocks-and-project-files" }),
    `
    model Widget {
      @visibility(Lifecycle.Update, Lifecycle.Read)
      @path id: string;
      @query kind?: string;
      color: string;
    }

    @route("/widgets")

    @post op create(@bodyRoot body: Widget) : Widget;

    `,
    [
      ["IContosoOperations.cs", ["Task<Widget> CreateAsync( Widget body);"]],
      [
        "ContosoOperations.cs",
        [
          "public class ContosoOperations : IContosoOperations",
          "public Task<Widget> CreateAsync( Widget body)",
        ],
      ],
      [
        "ContosoOperationsController.cs",
        [`public virtual async Task<IActionResult> Create(Widget body)`, ".CreateAsync(body)"],
      ],
      [
        "MockRegistration.cs",
        ["public static class MockRegistration", "<IContosoOperations, ContosoOperations>()"],
      ],
      ["Program.cs", ["MockRegistration"]],
    ],
  );
});

it("Initializes enum types", async () => {
  await compileAndValidateMultiple(
    await createCSharpServiceEmitterTestRunner({ "emit-mocks": "mocks-and-project-files" }),
    `
    enum Color {
      Red,
      Blue,
      Green
    }
    model Widget {
      @visibility(Lifecycle.Update, Lifecycle.Read)
      @path id: string;
      @query kind?: string;
      color: Color;
    }

    @route("/widgets")
    @post op create(@bodyRoot body: Widget) : Widget;
    @route("/colors")
    @get op getDefaultColor(): Color;

    `,
    [
      [
        "IContosoOperations.cs",
        [
          "namespace Microsoft.Contoso",
          "Task<Widget> CreateAsync( Widget body);",
          "Task<Color> GetDefaultColorAsync( );",
        ],
      ],
      [
        "ContosoOperations.cs",
        [
          "public class ContosoOperations : IContosoOperations",
          "public Task<Widget> CreateAsync( Widget body)",
          "public Task<Color> GetDefaultColorAsync( )",
          "return Task.FromResult<Color>(default);",
        ],
      ],
      [
        "ContosoOperationsController.cs",
        [
          `public virtual async Task<IActionResult> Create(Widget body)`,
          ".CreateAsync(body)",
          `public virtual async Task<IActionResult> GetDefaultColor()`,
          ".GetDefaultColorAsync()",
        ],
      ],
      [
        "MockRegistration.cs",
        ["public static class MockRegistration", "<IContosoOperations, ContosoOperations>()"],
      ],
      ["Program.cs", ["MockRegistration"]],
    ],
  );
});

it("emits correct code for GET requests with body parameters", async () => {
  await compileAndValidateMultiple(
    await createCSharpServiceEmitterTestRunner({ "emit-mocks": "mocks-and-project-files" }),
    `
      #suppress "@typespec/http-server-csharp/get-request-body" "Test"
      @route("/foo") @get op foo(intProp?: int32): void;
      `,
    [
      [
        "ContosoOperationsController.cs",
        [`public virtual async Task<IActionResult> Foo()`, ".FooAsync()"],
      ],
      ["IContosoOperations.cs", [`Task FooAsync( );`]],
      [
        "ContosoOperations.cs",
        ["public class ContosoOperations : IContosoOperations", "public Task FooAsync( )"],
      ],
    ],
  );
});

it("emits correct code for GET requests with explicit body parameters", async () => {
  await compileAndValidateMultiple(
    await createCSharpServiceEmitterTestRunner({ "emit-mocks": "mocks-and-project-files" }),
    `
      #suppress "@typespec/http-server-csharp/anonymous-model" "Test"
      #suppress "@typespec/http-server-csharp/get-request-body" "Test"
      @route("/foo") @get op foo(@body body?: { intProp?: int32}): void;
      `,
    [
      [
        "ContosoOperationsController.cs",
        [`public virtual async Task<IActionResult> Foo()`, ".FooAsync()"],
      ],
      ["IContosoOperations.cs", [`Task FooAsync( );`]],
      [
        "ContosoOperations.cs",
        ["public class ContosoOperations : IContosoOperations", "public Task FooAsync( )"],
      ],
    ],
  );
});

it("generates one line `@doc` decorator comments", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      model Pet {
        @doc("Pet name in the format of a string")
        name?: string;
      }
    `,
    "Pet.cs",
    [
      "public partial class Pet",
      "///<summary>",
      "/// Pet name in the format of a string",
      "///</summary>",
      "public string Name { get; set; }",
    ],
  );
});

it("generates multiline jsdoc comments", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
    model Pet {
      /**
       * Pet name in the format of a string.
       * The name will be the main identifier for the dog. It is suggested to keep it short and simple.
       * Pets have a difficult time understanding and learning complex names.
       */
      name?: string;
    }
    `,
    "Pet.cs",
    [
      "public partial class Pet",
      "///<summary>",
      "/// Pet name in the format of a string. The name will be the main identifier",
      "/// for the dog. It is suggested to keep it short and simple. Pets have a",
      "/// difficult time understanding and learning complex names.",
      "///</summary>",
      "public string Name { get; set; }",
    ],
  );
});

it("generates multiline jsdoc comments with long non-space words", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
    model Pet {
      /**
       * Pet name in the format of a string.
       * Visit example.funnamesforpets.com/bestowners/popularnames/let-your-best-friend-have-the-best-name where you can find many unique names.
       */
      name?: string;
    }
    `,
    "Pet.cs",
    [
      "public partial class Pet",
      "///<summary>",
      "/// Pet name in the format of a string. Visit",
      "/// example.funnamesforpets.com/bestowners/popularnames/let-your-best-friend-have-the-best-name",
      "/// where you can find many unique names.",
      "///</summary>",
      "public string Name { get; set; }",
    ],
  );
});

it("generates correct (awkward) multiline jsdoc comments without multiline asterisk", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
    /**
     * A multiline comment.
     *   This line is indented.
     * This line is not
     * This line is quite long and likely should be broken into multiple lines as it goes on and on and on and on and doesn't stop ever, really it doesn't ever stop.  OK, it stops now.
     * https://verylongdomainname.verylogdomainserver.biz/verylongpathcomponent1/compoent2/compoent3/component4/additional-components/andothergoodies/andyetmoregoodies/andthenitends.html
     * and a line afterward.
     */
    model Pet {
      /**
        Pet name in the format of a string.
        The name will be the main identifier for the dog. It is suggested to keep it short and simple.
        Pets have a difficult time understanding and learning complex names.
       */
      name?: string;
    }
    `,
    "Pet.cs",
    [
      "///<summary>",
      "/// A multiline comment. This line is indented. This line is not This line is",
      "/// quite long and likely should be broken into multiple lines as it goes on",
      "/// and on and on and on and doesn't stop ever, really it doesn't ever stop. ",
      "/// OK, it stops now.",
      "/// https://verylongdomainname.verylogdomainserver.biz/verylongpathcomponent1/compoent2/compoent3/component4/additional-components/andothergoodies/andyetmoregoodies/andthenitends.html",
      "/// and a line afterward.",
      "///</summary>",
      "public partial class Pet",
      "///<summary>",
      "/// Pet name in the format of a string.         The name will be the main",
      "/// identifier for the dog. It is suggested to keep it short and simple.  ",
      "///  Pets have a difficult time understanding and learning complex names.",
      "///</summary>",
      "public string Name { get; set; }",
    ],
  );
});

it("generates correct multiline jsdoc comments for operations", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
    model Pet {
      /** Pet name string */
      name?: string;
    }
    
    @route("/pets")
    interface Pets {
      /**
       * List Pet results
       * Provide top/skip or filter by name if needed
       */
      @get op listPets(
        @query top?: int32 = 50, 
        @query skip?: int32 = 0,
        @query nameFilter?: string = "*"
      ) : Pet[];
    }
    `,
    "IPets.cs",
    [
      "public interface IPets",
      "///<summary>",
      "/// List Pet results Provide top/skip or filter by name if needed",
      "///</summary>",
      `Task<Pet[]> ListPetsAsync( int? top, int? skip, string? nameFilter);`,
    ],
  );
});

it("generates correct multiline jsdoc long comments for operations", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
    model Pet {
      /** Pet name string */
      name?: string;
    }
    
    @route("/pets")
    interface Pets {
      /**
       * A multiline comment.
       *   This line is indented.
       * This line is not
       * This line is quite long and likely should be broken into multiple lines as it goes on and on and on and on and doesn't stop ever, really it doesn't ever stop.  OK, it stops now.
       * https://verylongdomainname.verylogdomainserver.biz/verylongpathcomponent1/compoent2/compoent3/component4/additional-components/andothergoodies/andyetmoregoodies/andthenitends.html
       * and a line afterward.
       */
      @get op listPets(
        @query top?: string, 
        @query skip?: string
      ) : Pet[];
    }
    `,
    "IPets.cs",
    [
      "public interface IPets",
      "///<summary>",
      "/// A multiline comment. This line is indented. This line is not This line is",
      "/// quite long and likely should be broken into multiple lines as it goes on",
      "/// and on and on and on and doesn't stop ever, really it doesn't ever stop. ",
      "/// OK, it stops now.",
      "/// https://verylongdomainname.verylogdomainserver.biz/verylongpathcomponent1/compoent2/compoent3/component4/additional-components/andothergoodies/andyetmoregoodies/andthenitends.html",
      "/// and a line afterward.",
      "///</summary>",
      "Task<Pet[]> ListPetsAsync( string? top, string? skip);",
    ],
  );
});

it("generates correct (awkward) multiline jsdoc comments with long non-space words  without multiline asterisk", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
    model Pet {
      /**
        Pet name in the format of a string.
        Visit example.funnamesforpets.com/bestowners/popularnames/let-your-best-friend-have-the-best-name where you can find many unique names.
       */
      name?: string;
    }
    `,
    "Pet.cs",
    [
      "public partial class Pet",
      "///<summary>",
      "/// Pet name in the format of a string.         Visit",
      "/// example.funnamesforpets.com/bestowners/popularnames/let-your-best-friend-have-the-best-name",
      "/// where you can find many unique names.",
      "///</summary>",
      "public string Name { get; set; }",
    ],
  );
});

it("generates multiline `@doc` decorator comments", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
    model Pet {
      @doc("""
        Pet name in the format of a string.
        The name will be the main identifier for the dog. It is suggested to keep it short and simple.
        Pets have a difficult time understanding and learning complex names.
        """)
      name?: string;
    }
    `,
    "Pet.cs",
    [
      "public partial class Pet",
      "///<summary>",
      "/// Pet name in the format of a string. The name will be the main identifier",
      "/// for the dog. It is suggested to keep it short and simple. Pets have a",
      "/// difficult time understanding and learning complex names.",
      "///</summary>",
      "public string Name { get; set; }",
    ],
  );
});

it("generates multiline `@doc` decorator comments with long non-space words", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
    model Pet {
      @doc("""
        Pet name in the format of a string.
        Visit example.funnamesforpets.com/bestowners/popularnames/let-your-best-friend-have-the-best-name where you can find many unique names.
        """)
      name?: string;
    }
    `,
    "Pet.cs",
    [
      "public partial class Pet",
      "///<summary>",
      "/// Pet name in the format of a string. Visit",
      "/// example.funnamesforpets.com/bestowners/popularnames/let-your-best-friend-have-the-best-name",
      "/// where you can find many unique names.",
      "///</summary>",
      "public string Name { get; set; }",
    ],
  );
});

it("generates single line `@doc` decorator comments", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      model Pet {
        @doc("Pet name in the format of a string")
        name?: string;
      }
    `,
    "Pet.cs",
    [
      "public partial class Pet",
      "///<summary>",
      "/// Pet name in the format of a string",
      "///</summary>",
      "public string Name { get; set; }",
    ],
  );
});

it("generates jsdoc comments", async () => {
  await compileAndValidateSingleModel(
    runner,
    `
      model Pet {
        /**
         * Pet name in the format of a string
        **/
        name?: string;
      }
    `,
    "Pet.cs",
    [
      "public partial class Pet",
      "///<summary>",
      "/// Pet name in the format of a string",
      "///</summary>",
      "public string Name { get; set; }",
    ],
  );
});

describe("emit correct code for `@error` models", () => {
  it("model has additional properties apart from `@statusCode`", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
        @error
        model NotFoundError {
          @statusCode statusCode: 404;
          code: "not-found";
        }
      `,
      "NotFoundError.cs",
      [
        "public partial class NotFoundError : HttpServiceException {",
        `public NotFoundError(string code = "not-found") : base(404,`,
        "value: new{code = code}) ",
      ],
    );
  });
  it("model only has `@statusCode` property", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
        @error
        model NotFoundError {
          @statusCode _: 404;
        }
      `,
      "NotFoundError.cs",
      [
        "public partial class NotFoundError : HttpServiceException {",
        "public NotFoundError() : base(404)",
      ],
    );
  });
  it("emits `@min` value when `@statusCode` property is not defined but has `@min` and `@max` decorators", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
        @error
        model ErrorInRange {
          @minValue(500)
          @maxValue(599)
          @statusCode
          _: int32;
        }
      `,
      "ErrorInRange.cs",
      [
        "public partial class ErrorInRange : HttpServiceException {",
        "public ErrorInRange() : base(500)",
      ],
    );
  });
  it("emits first value when `@statusCode` is defined with an union reference", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
        @error
        model Error {
          @statusCode
          statusCode: statusCodes;
        }

        union statusCodes {
          400,
          404,
        }
      `,
      "Error.cs",
      [
        "public partial class Error : HttpServiceException {",
        "public Error(int statusCode) : base(statusCode)",
      ],
    );
  });
  it("emits first value when `@statusCode` is defined with an union", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
        @error
        model Error {
          @statusCode
          statusCode: 200 | 202;
        }
      `,
      "Error.cs",
      [
        "public partial class Error : HttpServiceException {",
        "public Error(int statusCode) : base(statusCode)",
      ],
    );
  });
  it("emits error models when they inherit the `@error` decorator and resolves all the inheritance correctly", async () => {
    await compileAndValidateMultiple(
      runner,
      `
        @error
        model ApiError {
          code: string;
          message: string;
        }
     
        model Error extends ApiError {
          @statusCode
          statusCode: 500;
        }
      `,
      [
        [
          "ApiError.cs",
          [
            "public partial class ApiError : HttpServiceException {",
            "public ApiError(string code, string message) : base(400,",
            "public string Code { get; set; }",
            "public string MessageProp { get; set; }",
          ],
        ],
        ["Error.cs", ["public partial class Error : ApiError {", "public Error() : base(500)"]],
      ],
    );
  });
  it("emit error constructor with parameters ordered by required followed by optional/default", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
        @error
        model Error {
          @statusCode
          statusCode: 200;
          optionalMessage?: string;
          code: string;
          defined: string = "default message";
          message: string;
        }
      `,
      "Error.cs",
      [
        `public Error(string code, string message, string optionalMessage = default, string defined = "default message") : base(200,`,
      ],
    );
  });
  it("emit error with headers", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
        @error
        model Error {
          @statusCode statusCode: 200;
          @header("x-ms-error-code") code: string;
          @header customHeader: string;
        }
      `,
      "Error.cs",
      [
        `public Error(string code, string customHeader) : base(200,`,
        ` headers: new(){{"x-ms-error-code", code}, {"custom-header", customHeader}})`,
      ],
    );
  });
  it("emit error constructor with value/regular properties", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
        @error
        model Error {
          code: string;
          message: string;
        }
      `,
      "Error.cs",
      [
        `public Error(string code, string message) : base(400,`,
        `value: new{code = code,message = message}) `,
      ],
    );
  });
  it("emit error constructor properties and defined in body", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
        @error
        model Error {
          @statusCode
          statusCode: 200;
          code: string;
          message: string;
        }
      `,
      "Error.cs",
      [
        `public Error(string code, string message) : base(200,`,
        `Code = code;`,
        `MessageProp = message;`,
      ],
    );
  });
  it("renames body properties that conflict with properties from exception", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
        @error
        model Error {
          @statusCode
          statusCode: 200;
          code: string;
          message: string;
          value: string;
          headers: string;
          stackTrace: string;
          source: string;
          innerException: string;
          hResult: string;
          data: string;
          targetSite: string;
          helpLink: string;
        }
      `,
      "Error.cs",
      [
        `public Error(string code, string message, string value, string headers, string stackTrace, string source, string innerException, string hResult, string data, string targetSite, string helpLink) : base(200,`,
        `Code = code;`,
        `MessageProp = message;`,
        `ValueName = value;`,
        `HeadersProp = headers;`,
        `StackTraceProp = stackTrace;`,
        `SourceProp = source;`,
        `InnerExceptionProp = innerException;`,
        `HResultProp = hResult;`,
        `DataProp = data;`,
        `TargetSiteProp = targetSite;`,
        `HelpLinkProp = helpLink;`,
        `public string Code { get; set; }`,
        `public string MessageProp { get; set; }`,
        `public string ValueName { get; set; }`,
        `public string HeadersProp { get; set; }`,
        `public string StackTraceProp { get; set; }`,
        `public string SourceProp { get; set; }`,
        `public string InnerExceptionProp { get; set; }`,
        `public string HResultProp { get; set; }`,
        `public string DataProp { get; set; }`,
        `public string TargetSiteProp { get; set; }`,
        `public string HelpLinkProp { get; set; }`,
      ],
    );
  });

  it("generates standard scalar array for uniqueItems model", async () => {
    await compileAndValidateSingleModel(
      runner,
      `    
        /** A simple test model*/
        model Foo is Array<string>;
        @get @route("/Foo") op list(): Foo[];
        @route("/Foo/{id}") @get op get(@path id: string): Foo;
        `,
      "IContosoOperations.cs",
      ["Task<string[][]> ListAsync( )", "Task<string[]> GetNameAsync( string id)"],
    );
  });
});

describe("collection type: defined as emitter option", () => {
  const collectionTest = `
  model Foo {
    byteProp: uint8[];
    sbyteProp: int8[];
    intProp: int32[];
    stringProp: string[];
    modelProp: FooProp[];
    intPropInitialized: [8, 10];
    intArr: Array<int32>;
    stringArr: Array<string>;
    modelArr: Array<FooProp>;
        
    @uniqueItems
    stringUnique: string[];
  }

  model FooProp {
    name: string;
  }
  
  model Bar is Array<string>;

  @route("/foo") op foo(): Foo[];
  @route("/Bar") op bar(): Bar[];
`;
  it("defined collection type as enumerable", async () => {
    const runner = await createCSharpServiceEmitterTestRunner({
      "collection-type": "enumerable",
    });
    await compileAndValidateMultiple(runner, collectionTest, [
      [
        "Foo.cs",
        [
          `public Byte[] ByteProp { get; set; }`,
          "public SByte[] SbyteProp { get; set; }",
          "public IEnumerable<int> IntProp { get; set; }",
          "public IEnumerable<string> StringProp { get; set; }",
          "public IEnumerable<FooProp> ModelProp { get; set; }",
          "public IEnumerable<int> IntPropInitialized { get; } = new List<int> {8, 10};",
          "public IEnumerable<int> IntArr { get; set; }",
          "public IEnumerable<string> StringArr { get; set; }",
          "public IEnumerable<FooProp> ModelArr { get; set; }",
          "public ISet<string> StringUnique { get; set; }",
        ],
      ],
      [
        "IContosoOperations.cs",
        [
          "Task<IEnumerable<Foo>> FooAsync( );",
          "Task<IEnumerable<IEnumerable<string>>> BarAsync( );",
        ],
      ],
    ]);
  });
  it("default collection is array", async () => {
    await compileAndValidateMultiple(runner, collectionTest, [
      [
        "Foo.cs",
        [
          `public Byte[] ByteProp { get; set; }`,
          "public SByte[] SbyteProp { get; set; }",
          "public int[] IntProp { get; set; }",
          "public string[] StringProp { get; set; }",
          "public FooProp[] ModelProp { get; set; }",
          "public int[] IntPropInitialized { get; } = [8, 10];",
          "public int[] IntArr { get; set; }",
          "public string[] StringArr { get; set; }",
          "public FooProp[] ModelArr { get; set; }",
          "public ISet<string> StringUnique { get; set; }",
        ],
      ],
      ["IContosoOperations.cs", ["Task<Foo[]> FooAsync( );"]],
    ]);
  });
  it("array is explicitly defined", async () => {
    const runner = await createCSharpServiceEmitterTestRunner({
      "collection-type": "array",
    });
    await compileAndValidateMultiple(runner, collectionTest, [
      [
        "Foo.cs",
        [
          `public Byte[] ByteProp { get; set; }`,
          "public SByte[] SbyteProp { get; set; }",
          "public int[] IntProp { get; set; }",
          "public string[] StringProp { get; set; }",
          "public FooProp[] ModelProp { get; set; }",
          "public int[] IntPropInitialized { get; } = [8, 10];",
          "public int[] IntArr { get; set; }",
          "public string[] StringArr { get; set; }",
          "public FooProp[] ModelArr { get; set; }",
          "public ISet<string> StringUnique { get; set; }",
        ],
      ],
      ["IContosoOperations.cs", ["Task<Foo[]> FooAsync( );", "Task<string[][]> BarAsync( );"]],
    ]);
  });
});
