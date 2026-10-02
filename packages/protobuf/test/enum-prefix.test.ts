import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { Tester as BaseTester } from "./tester.js";

const Tester = BaseTester.importLibraries().using("Protobuf");
const PrefixTester = Tester.emit("@typespec/protobuf", { "enum-value-prefix": "enum-name" });

describe("enum-value-prefix", () => {
  it.each([undefined, "none"])("preserves member names with option %s", async (option) => {
    const result = await Tester.emit(
      "@typespec/protobuf",
      option === undefined ? {} : { "enum-value-prefix": option },
    ).compile(`
      @package
      namespace Test;
      model Example {
        @field(1) state: OrderState;
      }
      enum OrderState {
        Unknown: 0,
        pendingShipment: 5,
      }
    `);

    expect(result.outputs["main.proto"]).toContain(`enum OrderState {
  Unknown = 0;
  pendingShipment = 5;
}`);
  });

  it("prefixes shared short names while preserving numbers, aliases, and documentation", async () => {
    const result = await PrefixTester.compile(`
      @package
      namespace Test;
      model Example {
        @field(1) state: OrderState;
        @field(2) payment: PaymentMethod;
      }
      enum OrderState {
        Unspecified: 0,
        /** Awaiting shipment. */
        Pending: 5,
        AwaitingShipment: 5,
        ORDER_STATE_SHIPPED: 10,
      }
      enum PaymentMethod {
        Unspecified: 0,
        CreditCard: 20,
      }
    `);

    expect(result.outputs["main.proto"]).toContain(`enum OrderState {
  option allow_alias = true;

  ORDER_STATE_UNSPECIFIED = 0;
  ORDER_STATE_PENDING = 5; // Awaiting shipment.
  ORDER_STATE_AWAITING_SHIPMENT = 5;
  ORDER_STATE_SHIPPED = 10;
}`);
    expect(result.outputs["main.proto"]).toContain(`enum PaymentMethod {
  PAYMENT_METHOD_UNSPECIFIED = 0;
  PAYMENT_METHOD_CREDIT_CARD = 20;
}`);
    expect(result.outputs["main.proto"]).toContain(`message Example {
  OrderState state = 1;
  PaymentMethod payment = 2;
}`);
  });

  it.each([
    ["OrderState", "pendingShipment", "ORDER_STATE_PENDING_SHIPMENT"],
    ["HTTPStatus", "HTTPTimeout", "HTTP_STATUS_HTTP_TIMEOUT"],
    ["Http2Status", "retryAfter2Seconds", "HTTP2_STATUS_RETRY_AFTER2_SECONDS"],
    ["order_state", "in_progress", "ORDER_STATE_IN_PROGRESS"],
    ["OrderState", "ORDER_STATE_SHIPPED", "ORDER_STATE_SHIPPED"],
    ["OrderState", "ORDER_STATE_READY__NOW", "ORDER_STATE_READY__NOW"],
    ["OrderState", "OrderStateShipped", "ORDER_STATE_SHIPPED"],
    ["OrderState", "OrderStateful", "ORDER_STATE_ORDER_STATEFUL"],
  ])("converts %s.%s to %s", async (enumName, memberName, expectedName) => {
    const result = await PrefixTester.compile(`
      @package
      namespace Test;
      model Example {
        @field(1) value: ${enumName};
      }
      enum ${enumName} {
        Unknown: 0,
        ${memberName}: 5,
      }
    `);

    expect(result.outputs["main.proto"]).toContain(`enum ${enumName} {`);
    expect(result.outputs["main.proto"]).toContain(`  ${expectedName} = 5;`);
    expect(result.outputs["main.proto"]).not.toContain("_UNSPECIFIED");
  });

  it("diagnoses member names that collide after normalization", async () => {
    const [result, diagnostics] = await PrefixTester.compileAndDiagnose(`
      @package
      namespace Test;
      model Example {
        @field(1) state: OrderState;
      }
      enum OrderState {
        Unspecified: 0,
        InProgress: 1,
        in_progress: 2,
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/protobuf/enum-value-name-collision",
      message: "enum value name 'ORDER_STATE_IN_PROGRESS' is already used in this Protobuf package",
    });
    expect(result.outputs).toEqual({});
  });

  it("diagnoses a collision with an already-prefixed alias", async () => {
    const [result, diagnostics] = await PrefixTester.compileAndDiagnose(`
      @package
      namespace Test;
      model Example {
        @field(1) state: OrderState;
      }
      enum OrderState {
        Unspecified: 0,
        Shipped: 1,
        ORDER_STATE_SHIPPED: 1,
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/protobuf/enum-value-name-collision",
      message: "enum value name 'ORDER_STATE_SHIPPED' is already used in this Protobuf package",
    });
    expect(result.outputs).toEqual({});
  });

  it("diagnoses collisions across enums in nested namespaces of the same package", async () => {
    const [result, diagnostics] = await PrefixTester.compileAndDiagnose(`
      @package
      namespace Test;
      model Example {
        @field(1) first: HTTPStatus;
        @field(2) second: Nested.HttpStatus;
      }
      enum HTTPStatus {
        Unknown: 0,
      }
      namespace Nested {
        enum HttpStatus {
          Unknown: 0,
        }
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/protobuf/enum-value-name-collision",
      message: "enum value name 'HTTP_STATUS_UNKNOWN' is already used in this Protobuf package",
    });
    expect(result.outputs).toEqual({});
  });

  it("allows identical enum value names in different packages", async () => {
    const result = await PrefixTester.compile(`
      @package({ name: "first" })
      namespace First {
        model Example {
          @field(1) state: OrderState;
        }
        enum OrderState {
          Unknown: 0,
        }
      }
      @package({ name: "second" })
      namespace Second {
        model Example {
          @field(1) state: OrderState;
        }
        enum OrderState {
          Unknown: 0,
        }
      }
    `);

    expect(result.outputs["first.proto"]).toContain("  ORDER_STATE_UNKNOWN = 0;");
    expect(result.outputs["second.proto"]).toContain("  ORDER_STATE_UNKNOWN = 0;");
  });

  it("diagnoses a collision with a package-level message name", async () => {
    const [result, diagnostics] = await PrefixTester.compileAndDiagnose(`
      @package
      namespace Test;
      model Example {
        @field(1) state: OrderState;
      }
      @message
      model ORDER_STATE_SHIPPED {}
      enum OrderState {
        Unknown: 0,
        Shipped: 1,
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/protobuf/enum-value-name-collision",
      message: "enum value name 'ORDER_STATE_SHIPPED' is already used in this Protobuf package",
    });
    expect(result.outputs).toEqual({});
  });

  it("still requires an explicit integer on every member", async () => {
    const [, diagnostics] = await PrefixTester.compileAndDiagnose(`
      @package
      namespace Test;
      model Example {
        @field(1) state: OrderState;
      }
      enum OrderState {
        Unknown: 0,
        Shipped,
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/protobuf/unconvertible-enum",
      message:
        "enums must explicitly assign exactly one integer to each member to be used in a Protobuf message",
    });
  });

  it("does not insert a zero member when the first value is nonzero", async () => {
    const [, diagnostics] = await PrefixTester.compileAndDiagnose(`
      @package
      namespace Test;
      model Example {
        @field(1) state: OrderState;
      }
      enum OrderState {
        Pending: 1,
        Shipped: 2,
      }
    `);

    expectDiagnostics(diagnostics, {
      code: "@typespec/protobuf/unconvertible-enum",
      message: "the first variant of an enum must be set to zero to be used in a Protobuf message",
    });
  });
});
