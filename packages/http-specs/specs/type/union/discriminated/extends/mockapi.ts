import type { ScenarioMockApi } from "@typespec/spec-api";
import { json, passOnSuccess } from "@typespec/spec-api";

export const Scenarios: Record<string, ScenarioMockApi> = {};

const cat = { name: "Whiskers", meow: true };
const dog = { name: "Rex", bark: false };
const inlineCat = { kind: "cat", ...cat };
const inlineDog = { kind: "dog", ...dog };

function receive(uri: string, body: unknown): ScenarioMockApi {
  return passOnSuccess({
    uri,
    method: "get",
    request: {},
    response: { status: 200, body: json(body) },
    kind: "MockApiDefinition",
  });
}

function send(uri: string, body: unknown): ScenarioMockApi {
  return passOnSuccess({
    uri,
    method: "put",
    request: { body: json(body) },
    response: { status: 204 },
    kind: "MockApiDefinition",
  });
}

const cases = [
  {
    name: "ExplicitDiscriminator",
    route: "explicit-discriminator",
    cat: inlineCat,
    dog: inlineDog,
  },
  {
    name: "InjectedDiscriminator",
    route: "injected-discriminator",
    cat: inlineCat,
    dog: inlineDog,
  },
  {
    name: "CustomDiscriminator",
    route: "custom-discriminator",
    cat: { petType: "feline", ...cat },
    dog: { petType: "canine", ...dog },
  },
  {
    name: "EnumDiscriminator",
    route: "enum-discriminator",
    cat: inlineCat,
    dog: inlineDog,
  },
];

for (const test of cases) {
  const name = `Type_Union_Discriminated_Extends_${test.name}_Operations`;
  const uri = `/type/union/discriminated/extends/${test.route}`;
  Scenarios[`${name}_getCat`] = receive(`${uri}/cat`, test.cat);
  Scenarios[`${name}_putCat`] = send(`${uri}/cat`, test.cat);
  Scenarios[`${name}_getDog`] = receive(`${uri}/dog`, test.dog);
  Scenarios[`${name}_putDog`] = send(`${uri}/dog`, test.dog);
}

const recursive = {
  ...inlineCat,
  friend: inlineDog,
  friends: [{ kind: "cat", name: "Kitten", meow: false }],
  lookup: { best: inlineDog },
  nullableFriend: null,
};

Scenarios.Type_Union_Discriminated_Extends_Recursive_get = receive(
  "/type/union/discriminated/extends/recursive",
  recursive,
);
Scenarios.Type_Union_Discriminated_Extends_Recursive_put = send(
  "/type/union/discriminated/extends/recursive",
  recursive,
);
