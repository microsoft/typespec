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
export function birdToTransport(item: Bird): any {
  if (item.kind === "seagull") {
    return seaGullToTransport(item as SeaGull);
  }

  if (item.kind === "sparrow") {
    return sparrowToTransport(item as Sparrow);
  }

  if (item.kind === "goose") {
    return gooseToTransport(item as Goose);
  }

  if (item.kind === "eagle") {
    return eagleToTransport(item as Eagle);
  }

  console.warn(`Received unknown snake kind: ${item.kind}`);
  return item as any;
}
```

```ts src/models/serializers.ts function seaGullToTransport
export function seaGullToTransport(item: SeaGull): any {
  return {
    ...{
      kind: item.kind,
      wingspan: item.wingspan,
    },
    kind: item.kind,
  };
}
```

```ts src/models/serializers.ts function sparrowToTransport
export function sparrowToTransport(item: Sparrow): any {
  return {
    ...{
      kind: item.kind,
      wingspan: item.wingspan,
    },
    kind: item.kind,
  };
}
```

```ts src/models/serializers.ts function gooseToTransport
export function gooseToTransport(item: Goose): any {
  return {
    ...{
      kind: item.kind,
      wingspan: item.wingspan,
    },
    kind: item.kind,
  };
}
```

```ts src/models/serializers.ts function eagleToTransport
export function eagleToTransport(item: Eagle): any {
  return {
    ...{
      kind: item.kind,
      wingspan: item.wingspan,
    },
    kind: item.kind,
    friends: item.friends ? arraySerializer(item.friends, birdToTransport) : item.friends,
    hate: item.hate ? recordSerializer(item.hate, birdToTransport) : item.hate,
    partner: item.partner ? birdToTransport(item.partner) : item.partner,
  };
}
```
