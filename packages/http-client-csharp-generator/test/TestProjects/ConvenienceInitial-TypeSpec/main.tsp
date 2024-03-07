import "@typespec/rest";
import "@azure-tools/typespec-client-generator-core";

@service(
    {
        title: "Convenience methods in Typespec",
        version: "0.1.0"
    }
)
@doc("Typespec project to test various types of convenience methods.")
namespace ConvenienceInCadl;

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.ClientGenerator.Core;

@doc("A model.")
model Model {
    id: string;
}

@route("/protocol")
@doc("Operation only has protocol method.")
@get
op protocol(): Model;

@route("/convenienceWithOptional")
@doc("Operation has protocol method with optional RequestContext and convenience method.")
@get
@convenientAPI(true)
op convenienceWithOptional(): Model;

@route("/convenienceWithRequired")
@doc("Operation has protocol method with required RequestContext and convenience method.")
@get
@convenientAPI(true)
op convenienceWithRequired(): Model;

@route("/convenienceShouldNotGenerate")
@doc("Operation has protocol method marked with convenience method, but the convenience method should not be generated.")
@get
@convenientAPI(true)
op convenienceShouldNotGenerate(): Response<200>;

@route("/protocolShouldNotGenerateConvenience")
@doc("Operation only has protocol method, but the convenience method should not be generated even it marks the convenience decorator.")
@get
op protocolShouldNotGenerateConvenience(): Response<200>;

@route("/protocolOptionalQuery")
@doc("Operation only has protocol method with optional query parameter.")
@get
op protocolOptionalQuery(@query optional?: int32): Model;

@route("/protocolRequiredQuery")
@doc("Operation only has protocol method with required query parameter.")
@get
op protocolRequiredQuery(@query required: int32): Model;

@route("/protocolOptionalModel")
@doc("Operation only has protocol method with optional body parameter.")
@post
op protocolOptionalModel(@body optional?: Model): Response<200>;

@route("/protocolRequiredModel")
@doc("Operation only has protocol method with required body parameter.")
@post
op protocolRequiredModel(@body required: Model): Response<200>;

@route("/convenienceOptionalQueryWithOptional")
@doc("Operation has protocol method with optional query parameter and optional RequestContext and convenience method.")
@get
@convenientAPI(true)
op convenienceOptionalQueryWithOptional(@query optional?: int32): Model;

@route("/convenienceRequiredQueryWithOptional")
@doc("Operation has protocol method with required query parameter and optional RequestContext and convenience method.")
@get
@convenientAPI(true)
op convenienceRequiredQueryWithOptional(@query required: int32): Model;

@route("/convenienceOptionalQueryWithRequired")
@doc("Operation has protocol method with optional query parameter and required RequestContext and convenience method.")
@get
@convenientAPI(true)
op convenienceOptionalQueryWithRequired(@query optional?: int32): Model;

@route("/convenienceRequiredQueryWithRequired")
@doc("Operation has protocol method with required query parameter and required RequestContext and convenience method.")
@get
@convenientAPI(true)
op convenienceRequiredQueryWithRequired(@query required: int32): Model;

@route("/convenienceOptionalModelWithOptional")
@doc("Operation has protocol method with optional body parameter and optional RequestContext and convenience method.")
@post
@convenientAPI(true)
op convenienceOptionalModelWithOptional(@body optional?: Model): Response<200>;

@route("/convenienceRequiredModelWithOptional")
@doc("Operation has protocol method with required body parameter and optional RequestContext and convenience method.")
@post
@convenientAPI(true)
op convenienceRequiredModelWithOptional(@body required: Model): Response<200>;

@route("/convenienceOptionalModelWithRequired")
@doc("Operation has protocol method with optional body parameter and required RequestContext and convenience method.")
@post
@convenientAPI(true)
op convenienceOptionalModelWithRequired(@body optional?: Model): Response<200>;

@route("/protocolOptionalBeforeRequired")
@doc("Operation has protocol method with optioanl parameter before required parameter and convenience method.")
@post
op protocolOptionalBeforeRequired(@query optional?: int32, @body required: Model): Response<200>;