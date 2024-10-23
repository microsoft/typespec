import "@typespec/http";

using TypeSpec.Http;

@doc("Illustrates multiple level inheritance with multiple enum discriminators.")
@service({
  title: "EnumNestedDiscriminator",
})
@route("/type/model/inheritance/enum-nested-discriminator")
namespace Type.Model.Inheritance.EnumNestedDiscriminator;

@doc("extensible enum type for discriminator")
union FishKind {
  string,

  @doc("The kind of fish is shark.")
  Shark: "shark",

  @doc("The kind of fish is salmon.")
  Salmon: "salmon",
}

@doc("This is base model for polymorphic multiple levels inheritance with a discriminator.")
@discriminator("kind")
model Fish {
  @doc("discriminator property")
  kind: FishKind;

  age: int32;
}

@doc("extensible enum type for discriminator")
union SharkKind {
  string,

  @doc("The kind of shark is saw.")
  Saw: "saw",

  @doc("The kind of shark is goblin.")
  Goblin: "goblin",
}

@doc("The second level model in polymorphic multiple levels inheritance and it defines a new discriminator.")
@discriminator("sharktype")
model Shark extends Fish {
  kind: FishKind.Shark;
  sharktype: SharkKind;
}

@doc("The second level model in polymorphic multiple levels inheritance which contains references to other polymorphic instances.")
model Salmon extends Fish {
  kind: FishKind.Salmon;
  friends?: Fish[];
  hate?: Record<Fish>;
  partner?: Fish;
}

@doc("The third level model SawShark in polymorphic multiple levels inheritance.")
model SawShark extends Shark {
  sharktype: SharkKind.Saw;
}

@doc("The third level model GoblinShark in polymorphic multiple levels inheritance.")
model GoblinShark extends Shark {
  sharktype: SharkKind.Goblin;
}

@route("/model")
@get
op getModel(): Fish;

@route("/model")
@put
op putModel(@body input: Fish): NoContentResponse;

@route("/recursivemodel")
@get
op getRecursiveModel(): Fish;

@route("/recursivemodel")
@put
op putRecursiveModel(@body input: Fish): NoContentResponse;

@route("/missingdiscriminator")
@get
op getMissingDiscriminator(): Fish;

@route("/wrongdiscriminator")
@get
op getWrongDiscriminator(): Fish;
