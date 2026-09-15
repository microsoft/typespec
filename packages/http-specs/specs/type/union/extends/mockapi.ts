import type { MockApiDefinition, ScenarioMockApi } from "@typespec/spec-api";
import { json, passOnSuccess } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

type Fixtures = Record<string, unknown>;
type ModelFixtures = Record<string, Record<string, unknown>>;

function define(name: string, route: string, fixtures: Fixtures) {
  for (const method of ["get", "put"] as const) {
    const apis: MockApiDefinition[] = Object.entries(fixtures).map(([choice, value]) => {
      const response = {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: json(value),
      };
      return {
        kind: "MockApiDefinition",
        uri: `/type/union/extends/${route}/${choice}`,
        method,
        request:
          method === "put"
            ? { headers: { "Content-Type": "application/json" }, body: json(value) }
            : {},
        response,
        handler:
          method === "put"
            ? (req) => {
                req.expect.containsHeader("content-type", "application/json");
                // Compare decoded JSON without coercion; null is a body, not an omitted body.
                req.expect.deepEqual(req.body, value, "Unexpected union payload");
                return response;
              }
            : undefined,
      };
    });
    // Distinct concrete paths require every choice, not just one successful response.
    Scenarios[`Type_Union_Extends_${name}_${method}`] = passOnSuccess(apis);
  }
}

function inline(fixtures: ModelFixtures, discriminator = "kind"): ModelFixtures {
  return Object.fromEntries(
    Object.entries(fixtures).map(([tag, value]) => [tag, { [discriminator]: tag, ...value }]),
  );
}

function envelope(fixtures: Fixtures, discriminator = "kind", property = "value"): ModelFixtures {
  return Object.fromEntries(
    Object.entries(fixtures).map(([tag, value]) => [
      tag,
      { [discriminator]: tag, [property]: value },
    ]),
  );
}

function models(
  name: string,
  route: string,
  fixtures: ModelFixtures,
  inlineDiscriminator = "kind",
  envelopeDiscriminator = "kind",
  envelopeProperty = "value",
) {
  define(`${name}_Untagged`, `${route}/untagged`, fixtures);
  define(`${name}_Inline`, `${route}/inline`, inline(fixtures, inlineDiscriminator));
  define(
    `${name}_Envelope`,
    `${route}/envelope`,
    envelope(fixtures, envelopeDiscriminator, envelopeProperty),
  );
}

function values(name: string, route: string, fixtures: Fixtures) {
  define(`${name}_Untagged`, `${route}/untagged`, fixtures);
  define(`${name}_Envelope`, `${route}/envelope`, envelope(fixtures));
}

const cat = { name: "Whiskers", meow: true };
const dog = { name: "Rex", bark: false };
const bird = { name: "Sky", wings: 2 };
const fish = { name: "Gold", fins: 3 };
const pets = { cat, dog };

// UE01, UE03, UE05 (first context), UE06 (first context), UE08 and matched controls.
for (const [name, route] of [
  ["DirectInheritance", "direct-inheritance"],
  ["SpreadAndIs", "spread-and-is"],
  ["SharedSameBase_First", "shared-same-base/first"],
  ["DisjointSameBase_First", "disjoint-same-base/first"],
  ["UnionAndDirect", "union-and-direct"],
  ["Controls_DirectInheritance", "controls/direct-inheritance"],
  ["Controls_SharedSameBase_First", "controls/shared-same-base/first"],
]) {
  models(name, route, pets);
}

// UE02: Optional specific properties create one deliberately ambiguous untagged value.
const structural = {
  quiet: { name: "Quiet", volume: 2 },
  calm: { name: "Calm", asleep: true },
};
for (const [name, route] of [
  ["Structural", "structural"],
  ["Controls_Structural", "controls/structural"],
]) {
  define(`${name}_Untagged`, `${route}/untagged`, {
    ...structural,
    overlap: { name: "Both" },
  });
  define(`${name}_Inline`, `${route}/inline`, inline(structural));
  define(`${name}_Envelope`, `${route}/envelope`, envelope(structural));
}

// UE04: Neither intermediate nor alternate-ancestor fields may disappear.
models("Ancestry", "ancestry", {
  cat: { name: "Kitten", age: 1, meow: true },
  dog: { name: "Rex", origin: "shelter", bark: false },
});

// UE05: The exact same Cat has different tags and property names in the second union.
for (const [name, route] of [
  ["SharedSameBase_Second", "shared-same-base/second"],
  ["Controls_SharedSameBase_Second", "controls/shared-same-base/second"],
]) {
  models(name, route, { feline: cat, bird }, "petType", "animal", "data");
}

// UE06: No cat/dog endpoints in the second union, nor bird/fish in the first.
models("DisjointSameBase_Second", "disjoint-same-base/second", { bird, fish });

// UE07: Both name and id must survive in both structurally constrained contexts.
const shared = { name: "Shared", id: 7, active: true };
models("SharedDifferentBases_ByName", "shared-different-bases/named", { shared, cat });
models(
  "SharedDifferentBases_ById",
  "shared-different-bases/identified",
  { entity: shared, other: { id: 8, code: "other" } },
  "entityType",
  "entityType",
  "entityData",
);

// UE08: Direct model uses have neither a union tag nor an envelope.
define("UnionAndDirect_Direct", "union-and-direct/direct", { cat });
define(
  "UnionAndDirect_Properties",
  "union-and-direct/properties",
  Object.fromEntries(
    Object.entries(pets).map(([tag, pet]) => [
      tag,
      {
        direct: cat,
        untagged: pet,
        inline: { kind: tag, ...pet },
        envelope: { kind: tag, value: pet },
      },
    ]),
  ),
);

// UE09: Base is an explicit named variant, not a default or an implicit alternative.
models("ExplicitBase", "explicit-base", { cat, base: { name: "Base" } });

// UE10: Only the explicitly modeled inline default admits this unknown tag and data.
const defaults = {
  ...inline(pets),
  unknown: {
    kind: "dragon",
    name: "Future",
    extra: { color: "gold", size: 3, nested: { active: true } },
  },
};
define("ExplicitDefault_Inline", "explicit-default/inline", defaults);
define("Controls_ExplicitDefault_Inline", "controls/explicit-default/inline", defaults);

// UE11a: Every nested leaf and the outer sibling have their own concrete choice.
for (const [name, route] of [
  ["NestedVariant", "nested-variant"],
  ["Controls_NestedVariant", "controls/nested-variant"],
]) {
  define(`${name}_Untagged`, `${route}/untagged`, { ...pets, bird });
  define(`${name}_Envelope`, `${route}/envelope`, {
    cat: { kind: "pet", value: { kind: "cat", value: cat } },
    dog: { kind: "pet", value: { kind: "dog", value: dog } },
    bird: { kind: "bird", value: bird },
  });
}

// UE11b/c: Named union and union-expression constraints.
models("UnionConstraint", "union-constraint", pets);
values("UnionExpressionConstraint", "union-expression-constraint", { text: "hello", number: 42 });

// UE12a/b: Open string branch is explicit; the closed union has no unknown fixture.
for (const [name, route] of [
  ["ClosedScalar", "closed-scalar"],
  ["Controls_ClosedScalar", "controls/closed-scalar"],
]) {
  values(name, route, { start: "start", stop: "stop" });
}
for (const [name, route] of [
  ["OpenScalar", "open-scalar"],
  ["Controls_OpenScalar", "controls/open-scalar"],
]) {
  values(name, route, { known: "known", custom: "future" });
}

// UE12c/d/e/f: Preserve primitive/array bodies, intersection fields and template data.
values("EnumConstraint", "enum", { left: "left", right: "right" });
values("ArrayConstraint", "array", { cats: [cat], dogs: [dog] });
models("IntersectionConstraint", "intersection", {
  first: { name: "First", id: 1, text: "hello" },
  second: { name: "Second", id: 2, count: 3 },
});
models("TemplateInstance", "template-instance", {
  first: { item: "one", label: "First" },
  second: { item: "two", active: true },
});

define("Nullable_Untagged", "nullable/untagged", { ...pets, null: null });
define("Nullable_Inline", "nullable/inline", { ...inline(pets), null: null });
define("Nullable_Envelope", "nullable/envelope", { ...envelope(pets), null: null });

const leaf = { name: "Leaf", value: 1 };
define("Recursive_Untagged", "recursive/untagged", {
  leaf,
  branch: { name: "Branch", children: [leaf] },
});
define("Recursive_Envelope", "recursive/envelope", {
  leaf: { kind: "leaf", value: leaf },
  branch: {
    kind: "branch",
    value: { name: "Branch", children: [{ kind: "leaf", value: leaf }] },
  },
});

const data = { display_name: "Data", createdAt: 1704067200, content: "-_8" };
models(
  "Conversion",
  "conversion",
  { data, count: { display_name: "Count", createdAt: 1704067200, count: 3 } },
  "dataType",
  "dataType",
  "payload",
);
define("Conversion_Direct", "conversion/direct", { data });
