import "@typespec/rest";
import "@typespec/openapi";

using Http;

@service(#{ title: "sample" })
namespace Sample;

model Pet {
  name: string;
}

model Feline extends Pet {
  meows: boolean;
  hisses: boolean;
}

model Cat extends Feline {
  likesMilk: boolean;
}

model Kitten extends Cat {
  eatsMiceYet: boolean;
}

model Horse extends Pet {
  isAShowHorse: boolean;
}

@doc("Unexpected error")
@error
model ErrorResponse {
  @body body: string;
}

@route("/multipleInheritance")
namespace MultipleInheritance {
  @doc("Get a horse with name 'Fred' and isAShowHorse true")
  @route("horse")
  op getHorse(): Horse | ErrorResponse;

  @doc("Put a horse with name 'General' and isAShowHorse false")
  @route("horse")
  @put
  op putHorse(@body horse: Horse): string | ErrorResponse;

  @doc("Get a pet with name 'Peanut'")
  @route("pet")
  op getPet(): Pet | ErrorResponse;

  @doc("Put a pet with name 'Butter'")
  @route("pet")
  @put
  op putPet(@body horse: Pet): string | ErrorResponse;

  @doc("Get a feline where meows and hisses are true")
  @route("feline")
  op getFeline(): Feline | ErrorResponse;

  @doc("Put a feline who hisses and doesn't meow")
  @route("feline")
  @put
  op putFeline(@body feline: Feline): string | ErrorResponse;

  @doc("Get a cat with name 'Whiskers' where likesMilk, meows, and hisses is true")
  @route("cat")
  op getCat(): Cat | ErrorResponse;

  @doc("Put a cat with name 'Boots' where likesMilk and hisses is false, meows is true")
  @route("cat")
  @put
  op putCat(@body cat: Cat): string | ErrorResponse;

  @doc("Get a kitten with name 'Gatito' where likesMilk and meows is true, and hisses and eatsMiceYet is false")
  @route("kitten")
  op getKitten(): Kitten | ErrorResponse;

  @doc("Put a kitten with name 'Kitty' where likesMilk and hisses is false, meows and eatsMiceYet is true")
  @route("kitten")
  @put
  op putKitten(@body kitten: Kitten): string | ErrorResponse;
}
