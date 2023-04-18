import "@typespec/http";
import "./rest-decorators.tsp";
import "./resource.tsp";

namespace TypeSpec.Rest;

@doc("The location of an instance of {name}", TResource)
@Private.resourceLocation(TResource)
scalar ResourceLocation<TResource extends {}> extends url;
