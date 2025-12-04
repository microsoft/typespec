package parameters.bodyoptionality;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import parameters.bodyoptionality.implementation.BodyOptionalityClientImpl;

/**
 * Initializes a new instance of the synchronous BodyOptionalityClient type.
 */
@ServiceClient(builder = BodyOptionalityClientBuilder.class)
public final class BodyOptionalityClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final BodyOptionalityClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of BodyOptionalityClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    BodyOptionalityClient(BodyOptionalityClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The requiredExplicit operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> requiredExplicitWithResponse(BodyModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.BodyOptionality.requiredExplicit",
            requestContext, updatedContext -> this.serviceClient.requiredExplicitWithResponse(body, updatedContext));
    }

    /**
     * The requiredExplicit operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void requiredExplicit(BodyModel body) {
        requiredExplicitWithResponse(body, RequestContext.none());
    }

    /**
     * The requiredImplicit operation.
     * 
     * @param name The name parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> requiredImplicitWithResponse(String name, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.BodyOptionality.requiredImplicit",
            requestContext, updatedContext -> this.serviceClient.requiredImplicitWithResponse(name, updatedContext));
    }

    /**
     * The requiredImplicit operation.
     * 
     * @param name The name parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void requiredImplicit(String name) {
        requiredImplicitWithResponse(name, RequestContext.none());
    }
}
