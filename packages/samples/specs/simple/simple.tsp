import "@typespec/rest";

using TypeSpec.Http;

@route("/alpha/{id}")
op doAlpha(id: string): string;

@route("/beta/{id}")
op doBeta(id: string): string;
