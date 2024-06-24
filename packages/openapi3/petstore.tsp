import "@typespec/http";

using TypeSpec.Http;

@route("/pets")
@get
op listPets(@query limit?: unknown): void;

@route("/pets")
@post
op createPets(): void;

@route("/pets/{petId}")
@get
op showPetById(@path petId: string): void;
