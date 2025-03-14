# Should Emit Correct Serializers and Deserializers for Polymorphic Models with Records, Arrays, and References"

## Typespec

The following TypeSpec block defines a service and several data models that serve as the foundation for our serializer tests. It starts with a base model, Bird, which uses a discriminator (kind) to support polymorphic behavior. Several derived models—SeaGull, Sparrow, Goose, and Eagle—are declared, each with a specific kind value to enable precise runtime type dispatching. Notably, the Eagle model includes additional complex properties (an array, a record, and a singular instance of Bird) to thoroughly test serialization of nested and compound types. This specification also exposes an HTTP GET endpoint returning a polymorphic Bird instance, ensuring that the generated TypeScript serializers handle these scenarios correctly.

```tsp
@service({
  title: "Test Service",
})
namespace Test;

@doc("This is base model for polymorphic single level inheritance with a discriminator.")
@discriminator("kind")
model Bird {
  kind: string;
  wingspan: int32;
}

@doc("The second level model in polymorphic single level inheritance.")
model SeaGull extends Bird {
  kind: "seagull";
}

@doc("The second level model in polymorphic single level inheritance.")
model Sparrow extends Bird {
  kind: "sparrow";
}

@doc("The second level model in polymorphic single level inheritance.")
model Goose extends Bird {
  kind: "goose";
}

@doc("The second level model in polymorphic single levels inheritance which contains references to other polymorphic instances.")
model Eagle extends Bird {
  kind: "eagle";
  friends?: Bird[];
  hate?: Record<Bird>;
  partner?: Bird;
}

@route("/model")
@get
op getModel(): Bird;
```

**Expectation for `jsonBirdToTransportDiscriminator`:**  
This function should select the appropriate transport transformation based on the `kind` property of the `Bird` instance. It checks for specific kinds ("seagull", "sparrow", "goose", "eagle") and delegates to the corresponding transform. If the kind is unknown, it logs a warning and returns a fallback value.

```ts src/models/serializers.ts function jsonBirdToTransportDiscriminator
export function jsonBirdToTransportDiscriminator(input_?: Bird): any {
  if (!input_) {
    return input_ as any;
  }
  const discriminatorValue = input_.kind;
  if (discriminatorValue === "seagull") {
    return jsonSeaGullToTransportTransform(input_ as any)!;
  }

  if (discriminatorValue === "sparrow") {
    return jsonSparrowToTransportTransform(input_ as any)!;
  }

  if (discriminatorValue === "goose") {
    return jsonGooseToTransportTransform(input_ as any)!;
  }

  if (discriminatorValue === "eagle") {
    return jsonEagleToTransportTransform(input_ as any)!;
  }
  console.warn(`Received unknown kind: ` + discriminatorValue);
  return input_ as any;
}
```

**Expectation for `jsonBirdToTransportTransform`:**  
This function should transform a basic `Bird` instance by mapping its core properties (`kind` and `wingspan`) to the transport format.

```ts src/models/serializers.ts function jsonBirdToTransportTransform
export function jsonBirdToTransportTransform(input_?: Bird | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    ...jsonBirdToTransportDiscriminator(input_),
    kind: input_.kind,
    wingspan: input_.wingspan,
  }!;
}
```

**Expectation for `jsonSeaGullToTransportTransform`:**  
For a `SeaGull` instance, the serializer should extend the base transformation provided by `jsonBirdToApplicationTransform` and then explicitly include all properties from SeaGull in this case it is just the `kind` .

```ts src/models/serializers.ts function jsonSeaGullToTransportTransform
export function jsonSeaGullToTransportTransform(input_?: SeaGull | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    kind: input_.kind,
    wingspan: input_.wingspan,
  }!;
}
```

**Expectation for `jsonSparrowToTransportTransform`:**  
Similarly, the serializer for a `Sparrow` instance should build upon the base Bird transformation and add the `kind` property accordingly.

```ts src/models/serializers.ts function jsonSparrowToTransportTransform
export function jsonSparrowToTransportTransform(input_?: Sparrow | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    kind: input_.kind,
    wingspan: input_.wingspan,
  }!;
}
```

**Expectation for `jsonGooseToTransportTransform`:**  
This function should transform a `Goose` instance by reusing the base Bird transformation and explicitly setting the `kind` property.

```ts src/models/serializers.ts function jsonGooseToTransportTransform
export function jsonGooseToTransportTransform(input_?: Goose | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    kind: input_.kind,
    wingspan: input_.wingspan,
  }!;
}
```

**Expectation for `jsonEagleToTransportTransform`:**  
The serializer for an `Eagle` instance is more complex due to additional properties. It must:

- Extend the base transformation (`jsonBirdToApplicationTransform`),
- Transform the `friends` property (an array of `Bird` instances) using `jsonArrayBirdToTransportTransform`,
- Transform the `hate` property (a primitive Record of `Bird` instances) using `jsonRecordBirdToTransportTransform`, and
- Transform the `partner` property (a single `Bird` instance) using `jsonBirdToApplicationTransform`.

```ts src/models/serializers.ts function jsonEagleToTransportTransform
export function jsonEagleToTransportTransform(input_?: Eagle | null): any {
  if (!input_) {
    return input_ as any;
  }
  return {
    kind: input_.kind,
    friends: jsonArrayBirdToTransportTransform(input_.friends),
    hate: jsonRecordBirdToTransportTransform(input_.hate),
    partner: jsonBirdToTransportTransform(input_.partner),
    wingspan: input_.wingspan,
  }!;
}
```
