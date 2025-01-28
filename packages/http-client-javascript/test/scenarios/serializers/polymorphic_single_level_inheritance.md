# Should emit serializer and deserializer correctly for properties with primitive Record type

## Typespec

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

## TypeScript

```ts src/models/serializers.ts function birdToTransport

```

```ts src/models/serializers.ts function seaGullToTransport

```

```ts src/models/serializers.ts function sparrowToTransport

```

```ts src/models/serializers.ts function gooseToTransport

```

```ts src/models/serializers.ts function eagleToTransport

```
