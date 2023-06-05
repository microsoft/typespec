import "@typespec/http";
import "./rest-decorators.tsp";
import "./resource.tsp";

namespace TypeSpec.Rest;

/**
 * A URL that points to a resource.
 * @template TResource The type of resource that the URL points to.
 */
@doc("The location of an instance of {name}", TResource)
@Private.resourceLocation(TResource)
scalar ResourceLocation<TResource extends {}> extends url;
