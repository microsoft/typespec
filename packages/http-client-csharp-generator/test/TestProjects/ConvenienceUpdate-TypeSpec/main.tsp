import "../ConvenienceInitial-Typespec/main.tsp";

namespace ConvenienceInCadl;

using TypeSpec.Http;
using TypeSpec.Rest;
using Azure.ClientGenerator.Core;

@@convenientAPI(protocol, true);
@@doc(protocol, "Initial operation only has protocol method. In the updated version, we add the convenience method.");
@@convenientAPI(protocolShouldNotGenerateConvenience, true);
@@doc(protocolShouldNotGenerateConvenience, "Initial operation only has protocol method, but the convenience method should not be generated even it marks the convenience decorator.");
@@convenientAPI(protocolOptionalQuery, true);
@@doc(protocolOptionalQuery, "Initial operation only has protocol method with optional query parameter. In the updated version, we add the convenience method.");
@@convenientAPI(protocolRequiredQuery, true);
@@doc(protocolRequiredQuery, "Initial operation only has protocol method with required query parameter. In the updated version, we add the convenience method.");
@@convenientAPI(protocolOptionalModel, true);
@@doc(protocolOptionalModel, "Initial operation only has protocol method with optional model parameter. In the updated version, we add the convenience method.");
@@convenientAPI(protocolRequiredModel, true);
@@doc(protocolRequiredModel, "Initial operation only has protocol method with required model parameter. In the updated version, we add the convenience method.");
@@convenientAPI(protocolOptionalBeforeRequired, true);
@@doc(protocolOptionalBeforeRequired, "Initial operation has protocol method with optioanl parameter before required parameter. In the updated version, we add the convenience method.");

@route("/updateConvenience")
@doc("No initial operation methods. In the updated version, we add the protocol method and convenience method.")
@get
@convenientAPI(true)
op updateConvenience(): Model;

@route("/convenienceOptionalBeforeRequired")
@doc("No initial operation methods. In the updated version, we add the protocol method and convenience method.")
@post
@convenientAPI(true)
op convenienceOptionalBeforeRequired(@query optional?: int32, @body required: Model): Response<200>;

@route("/noConvenience")
@doc("No convenience method. But if we add the convenientAPI decorator, there will be ambiguity.")
@get
@convenientAPI(false)
op noConvenience(): Model;

@route("/noConvenienceRequiredBody")
@doc("No convenience method. But if we add the convenientAPI decorator, there will be no ambiguity.")
@get
@convenientAPI(false)
op noConvenienceRequiredBody(@body required: Model): Response<200>;

@route("/noConvenienceOptionalBody")
@doc("No convenience method. But if we add the convenientAPI decorator, there will be ambiguity.")
@get
@convenientAPI(false)
op noConvenienceOptionalBody(@body optional?: Model): Response<200>;
