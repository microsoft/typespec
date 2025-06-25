import type { Model, Union } from "@typespec/compiler";
import {
  expectDiagnosticEmpty,
  expectDiagnostics,
  type BasicTestRunner,
} from "@typespec/compiler/testing";
import { assert, beforeEach, describe, expect, it } from "vitest";
import { getContentType, isEventData, isEvents } from "../src/decorators.js";
import { unsafe_getEventDefinitions as getEventDefinitions } from "../src/experimental/index.js";
import { createEventsTestRunner } from "./test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createEventsTestRunner();
});

describe("@events", () => {
  it("marks the union as containing event definitions", async () => {
    const { MixedEvents } = await runner.compile(`@test @events union MixedEvents {}`);

    expect(isEvents(runner.program, MixedEvents as Union)).toBe(true);
  });

  it("can contain multiple event definitions", async () => {
    const { MixedEvents, JsonEvent, StringEvent } = await runner.compile(
      `
@test
model StringEvent {
  payload: {
    @Events.contentType("text/plain")
    @Events.data
    foo: string;
  };
}

@test
model JsonEvent {
  @Events.data
  @Events.contentType("application/json")
  payload: {
    foo: string;
    bar: string;
  };
}

@test
@events
union MixedEvents {
  @Events.contentType("application/json")
  stringEvent: StringEvent,

  JsonEvent,

  @Events.contentType("text/plain")
  "[done]",
}
      `,
    );

    assert(MixedEvents.kind === "Union");
    assert(JsonEvent.kind === "Model");
    assert(StringEvent.kind === "Model");

    const variants = Array.from(MixedEvents.variants.values());

    expect(isEvents(runner.program, MixedEvents)).toBe(true);
    const [eventDefinitions, diagnostics] = getEventDefinitions(runner.program, MixedEvents);
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
    const { Event } = await runner.compile(`@test model Event { @data foo: string }`);
    assert(Event.kind === "Model");

    expect(isEventData(runner.program, Event.properties.get("foo")!)).toBe(true);
  });

  it("can be applied directly only once in an event model", async () => {
    const diagnostics = await runner.diagnose(
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
    const diagnostics = await runner.diagnose(
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
    const diagnostics = await runner.diagnose(
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
    const diagnostics = await runner.diagnose(
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
    const diagnostics = await runner.diagnose(
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
    const diagnostics = await runner.diagnose(
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
    const { MixedEvents, TargetEvent } = await runner.compile(
      `
model StringEvent {
  @Events.contentType("text/plain")
  @Events.data
  payload: string;
}

@test
@events
union MixedEvents {
  @test("TargetEvent")
  @Events.contentType("application/json")
  stringEvent: StringEvent,
}
      `,
    );

    assert(MixedEvents.kind === "Union");
    assert(TargetEvent.kind === "UnionVariant");

    expect(getContentType(runner.program, TargetEvent)).toBe("application/json");
  });

  it("can set the event payload's content-type", async () => {
    const { MixedEvents, EventPayload } = await runner.compile(
      `
model StringEvent {
  @test("EventPayload")
  @Events.contentType("text/plain")
  @Events.data
  payload: string;
}

@test
@events
union MixedEvents {
  @Events.contentType("application/json")
  stringEvent: StringEvent,
}
      `,
    );

    assert(MixedEvents.kind === "Union");
    assert(EventPayload.kind === "ModelProperty");

    expect(getContentType(runner.program, EventPayload)).toBe("text/plain");
  });

  it("cannot be set on a non-payload property", async () => {
    const diagnostics = await runner.diagnose(
      `
model StringEvent {
  @test("EventPayload")
  @Events.contentType("text/plain")
  payload: string;
}

@test
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
