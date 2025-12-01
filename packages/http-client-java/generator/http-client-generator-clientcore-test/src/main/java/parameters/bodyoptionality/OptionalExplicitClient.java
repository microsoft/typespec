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
import parameters.bodyoptionality.implementation.OptionalExplicitsImpl;

/**
 * Initializes a new instance of the synchronous BodyOptionalityClient type.
 */
@ServiceClient(builder = BodyOptionalityClientBuilder.class)
public final class OptionalExplicitClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final OptionalExplicitsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of OptionalExplicitClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    OptionalExplicitClient(OptionalExplicitsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The set operation.
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
    public Response<Void> setWithResponse(BodyModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.BodyOptionality.OptionalExplicit.set",
            requestContext, updatedContext -> this.serviceClient.setWithResponse(body, updatedContext));
    }

    /**
     * The set operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void set(BodyModel body) {
        setWithResponse(body, RequestContext.none());
    }

    /**
     * The set operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void set() {
        final BodyModel body = null;
        setWithResponse(body, RequestContext.none());
    }

    /**
     * The omit operation.
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
    public Response<Void> omitWithResponse(BodyModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.BodyOptionality.OptionalExplicit.omit",
            requestContext, updatedContext -> this.serviceClient.omitWithResponse(body, updatedContext));
    }

    /**
     * The omit operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void omit(BodyModel body) {
        omitWithResponse(body, RequestContext.none());
    }

    /**
     * The omit operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void omit() {
        final BodyModel body = null;
        omitWithResponse(body, RequestContext.none());
    }
}
