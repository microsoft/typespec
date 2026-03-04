import type { Model } from "@typespec/compiler";
import { expectDiagnosticEmpty, expectDiagnostics, t } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { getContentType, isEventData, isEvents } from "../src/decorators.js";
import { unsafe_getEventDefinitions as getEventDefinitions } from "../src/experimental/index.js";
import { Tester } from "./test-host.js";

describe("@events", () => {
  it("marks the union as containing event definitions", async () => {
    const { MixedEvents, program } = await Tester.compile(
      t.code`@events union ${t.union("MixedEvents")} {}`,
    );

    expect(isEvents(program, MixedEvents)).toBe(true);
  });

  it("can contain multiple event definitions", async () => {
    const { MixedEvents, JsonEvent, StringEvent, program } = await Tester.compile(
      t.code`
model ${t.model("StringEvent")} {
  payload: {
    @Events.contentType("text/plain")
    @Events.data
    foo: string;
  };
}

model ${t.model("JsonEvent")} {
  @Events.data
  @Events.contentType("application/json")
  payload: {
    foo: string;
    bar: string;
  };
}

@events
union ${t.union("MixedEvents")} {
  @Events.contentType("application/json")
  stringEvent: StringEvent,

  JsonEvent,

  @Events.contentType("text/plain")
  "[done]",
}
      `,
    );

    const variants = Array.from(MixedEvents.variants.values());

    expect(isEvents(program, MixedEvents)).toBe(true);
    const [eventDefinitions, diagnostics] = getEventDefinitions(program, MixedEvents);
    expectDiagnosticEmpty(diagnostics);

    expect(eventDefinitions.length).toBe(3);

    // Verify `StringEvent`
    expect(eventDefinitions[0].root).toBe(variants[0]);
    expect(eventDefinitions[0].eventType).toBe("stringEvent");
    expect(eventDefinitions[0].type).toBe(StringEvent);
    expect(eventDefinitions[0].contentType).toBe("application/json");
    const stringEventPayloadProp = StringEvent.properties.get("payload")!.type as Model;
    expect(eventDefinitions[0].payloadType).toBe(
      stringEventPayloadProp.properties.get("foo")!.type,
    );
    expect(eventDefinitions[0].payloadContentType).toBe("text/plain");

    // Verify `JsonEvent`
    expect(eventDefinitions[1].root).toBe(variants[1]);
    expect(eventDefinitions[1].eventType).toBeUndefined();
    expect(eventDefinitions[1].type).toBe(JsonEvent);
    expect(eventDefinitions[1].contentType).toBeUndefined();
    expect(eventDefinitions[1].payloadType).toBe(JsonEvent.properties.get("payload")!.type);
    expect(eventDefinitions[1].payloadContentType).toBe("application/json");

    //Verify `[done]`
    expect(eventDefinitions[2].root).toBe(variants[2]);
    expect(eventDefinitions[2].eventType).toBeUndefined();
    expect(eventDefinitions[2].type).toMatchObject({ kind: "String", value: "[done]" });
    expect(eventDefinitions[2].contentType).toBe("text/plain");
    expect(eventDefinitions[2].payloadType).toBe(eventDefinitions[2].type);
    expect(eventDefinitions[2].payloadContentType).toBe(eventDefinitions[2].contentType);
  });
});

describe("@data", () => {
  it("marks a model property as being the event payload", async () => {
    const { Event, program } = await Tester.compile(
      t.code`model ${t.model("Event")} { @data foo: string }`,
    );

    expect(isEventData(program, Event.properties.get("foo")!)).toBe(true);
  });

  it("can be applied directly only once in an event model", async () => {
    const diagnostics = await Tester.diagnose(
      `
model SampleEvent {
  @data
  foo: string;
}

@events
union SampleEvents {
  SampleEvent,

  inlineEvent: {
    @data
    bar: string;
  }
}
      `,
    );

    expectDiagnosticEmpty(diagnostics);
  });

  it("cannot be applied directly more than once in an event model", async () => {
    const diagnostics = await Tester.diagnose(
      `
model SampleEvent {
  @data
  foo: string;

  @data
  bar: string;
}

@events
union SampleEvents {
  SampleEvent,
}
      `,
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/events/multiple-event-payloads",
      severity: "error",
    });
  });

  it("cannot be applied indirectly more than once in an event model", async () => {
    const diagnostics = await Tester.diagnose(
      `
model Foo {
  @data
  foo: string;
}

model SampleEvent {
  first: Foo;
  second: Foo;
}

@events
union SampleEvents {
  SampleEvent,
}
      `,
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/events/multiple-event-payloads",
      severity: "error",
    });
  });

  it("cannot be applied in a Record", async () => {
    const diagnostics = await Tester.diagnose(
      `
model Foo {
  @data
  foo: string;
}

model SampleEvent {
  payload: Record<Foo>;
}

@events
union SampleEvents {
  SampleEvent,
}
      `,
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/events/multiple-event-payloads",
      severity: "error",
    });
  });

  it("cannot be applied in an Array", async () => {
    const diagnostics = await Tester.diagnose(
      `
model Foo {
  @data
  foo: string;
}

model SampleEvent {
  payload: Array<Foo>;
}

@events
union SampleEvents {
  SampleEvent,
}
      `,
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/events/multiple-event-payloads",
      severity: "error",
    });
  });

  it("detects multiple event payloads nested in tuples", async () => {
    const diagnostics = await Tester.diagnose(
      `
model Foo {
  @data
  foo: string;
}

model SampleEvent {
  tuple: [
    {
      tuple: [Foo];
    },
    {
      tuple: [Foo];
    }
  ];
}

@events
union SampleEvents {
  SampleEvent,
}
      `,
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/events/multiple-event-payloads",
      severity: "error",
    });
  });
});

describe("@contentType", () => {
  it("can set the top-level event's content-type", async () => {
    const { stringEvent, program } = await Tester.compile(
      t.code`
model StringEvent {
  @Events.contentType("text/plain")
  @Events.data
  payload: string;
}

@events
union MixedEvents {
  @Events.contentType("application/json")
  ${t.unionVariant("stringEvent")}: StringEvent,
}
      `,
    );

    expect(getContentType(program, stringEvent)).toBe("application/json");
  });

  it("can set the event payload's content-type", async () => {
    const { payload, program } = await Tester.compile(
      t.code`
model StringEvent {
  @Events.contentType("text/plain")
  @Events.data
  ${t.modelProperty("payload")}: string;
}

@events
union MixedEvents {
  @Events.contentType("application/json")
  stringEvent: StringEvent,
}
      `,
    );

    expect(getContentType(program, payload)).toBe("text/plain");
  });

  it("cannot be set on a non-payload property", async () => {
    const diagnostics = await Tester.diagnose(
      `
model StringEvent {
  @Events.contentType("text/plain")
  payload: string;
}

@events
union MixedEvents {
  stringEvent: StringEvent,
}
      `,
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/events/invalid-content-type-target",
      severity: "error",
    });
  });
});
