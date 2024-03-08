import { BasicTestRunner } from "@typespec/compiler/testing";
import assert from "assert";
import { beforeEach, describe, it } from "vitest";
import { createCSharpServiceEmitterTestRunner, getStandardService } from "./test-host.js";

function getGeneratedFile(runner: BasicTestRunner, fileName: string): [string, string] {
  const result = [...runner.fs.entries()].filter((e) => e[0].includes(fileName));
  assert.strictEqual(
    result === null || result === undefined,
    false,
    `No file matching ${fileName} found in output`
  );
  assert.strictEqual(result.length, 1, `found ${result.length} entries of ${fileName}`);
  const fileData = result[0];
  assert.strictEqual(
    fileData[0] === null || fileData[0] === undefined,
    false,
    `${fileName} not found`
  );
  assert.strictEqual(
    fileData[1] === null || fileData[1] === undefined,
    false,
    `${fileName} has no contents`
  );
  return fileData;
}

function assertFileContains(fileName: string, fileContents: string, searchString: string): void {
  assert.strictEqual(
    fileContents.includes(searchString),
    true,
    `"${searchString}" not found in ${fileName}, contents of file: ${fileContents}`
  );
}

async function compileAndValidateSingleModel(
  runner: BasicTestRunner,
  code: string,
  fileToCheck: string,
  expectedContent: string[]
): Promise<void> {
  await compileAndValidateMultiple(runner, code, [[fileToCheck, expectedContent]]);
}

async function compileAndValidateMultiple(
  runner: BasicTestRunner,
  code: string,
  fileChecks: [string, string[]][]
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

describe("service-generator-csharp: core service generation", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createCSharpServiceEmitterTestRunner();
  });

  it("generates standard scalar properties", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
      /** A simple test model*/
      model Foo {
        /** binary data */
        bytesProp: bytes;

        /** generic decimal data */
        decimalProp: decimal;
        /** decimal128 data */
        decimal128Prop: decimal128;

        /** SByte */
        signedByteProp: int8;
        /** Byte */
        byteProp: uint8;
        /** Int16 */
        int16Prop: int16;
        /** int */
        int32Prop: int32;
        /** long */
        int64Prop: int64;
        /** Uint16 */
        uint16Prop: uint16;
        /** Uint32 */
        uint32Prop: uint32;
        /** ulong */
        uint64Prop: uint64;
        /** js safeint property */
        safeIntProp: safeint;
        /** float */
        f32Prop: float32;
        /** double */
        f64Prop: float64;
        /** bool */
        boolProp: boolean;
        /** DateTime */
        dateProp: plainDate;
        /** DateTime */
        timeProp: plainTime;
        /** DateTimeOffset */
        utcDateTimeProp: utcDateTime;
        /** DateTimeOffset */
        #suppress "@azure-tools/typespec-azure-core/no-offsetdatetime" "This is a test"
        offsetDateTimeProp: offsetDateTime;
        /** TimeSpan */
        durationProp: duration;
        /** unix timestamp data */
        timestampProp: unixTimestamp32;
        /** string */
        stringProp: string;
        /** resource locator prop */
        urlProp: url;
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
        "public TimeSpan? DurationProp { get; set; }",
        "public DateTimeOffset? UtcDateTimeProp { get; set; }",
        "public DateTimeOffset? OffsetDateTimeProp { get; set; }",
        "public string StringProp { get; set; }",
        "public int? TimestampProp { get; set; }",
        "public string UrlProp { get; set; }",
        "public long? SafeIntProp { get; set; }",
        "public decimal? DecimalProp { get; set; }",
        "public decimal? Decimal128Prop { get; set; }",
      ]
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
      ["public partial class Foo", `public string AdminPassword { get; set; }`]
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
      ["public partial class Foo", `public string Id { get; set; }`]
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
        `[JsonPropertyName("pass")]`,
      ]
    );
  });

  it("generates literal properties", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
      /** A simple test model*/
      model Foo {
        /** string literal */
        stringLiteralProp: "This is a string literal";
        /** boolean literal */
        boolLiteralProp: true;
        /** numeric literal */
        numericLiteralProp: 17;
      }
      `,
      "Foo.cs",
      [
        "public partial class Foo",
        `public string StringLiteralProp { get; } = "This is a string literal";`,
        "public bool? BoolLiteralProp { get; } = true;",
        "public object? NumericLiteralProp { get; set; }",
      ]
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
        `public string? StringLiteralProp { get; set; } = "This is a string literal";`,
        "public bool? BoolLiteralProp { get; set; } = true;",
        "public int? NumericLiteralProp { get; set; } = 17;",
      ]
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
      ]
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
        fooProp: Foo;
        /** Recursive definition */
        nextBazProp: Baz;
      }
      /** A simple test model*/
      model Foo {
        /** enum */
        barProp: Bar;
        /** circular */
        bazProp: Baz;
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
      ]
    );
  });

  it("creates Valid Identifiers", async () => {
    await compileAndValidateSingleModel(
      runner,
      `
      /** A simple test model*/
      model Foo {
        #suppress "@azure-tools/typespec-azure-core/casing-style" "Testing"
        #suppress "@typespec/service-generator-csharp/invalid-identifier" "Testing"
        /** An invalid name test */
        \`**()invalid~~Name\`?: string = "This is a string literal";
      }
      `,
      "Foo.cs",
      [
        "public partial class Foo",
        `public string? GeneratedInvalidName { get; set; } = "This is a string literal";`,
      ]
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
      ]
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
      ["public partial class ToyCollection"]
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
      ["public partial class ToyCollectionWithNextLink"]
    );
  });
  it("Generates appropriate response attributes for GET", async () => {});
  it("Generates appropriate response attributes for List", async () => {});
});
