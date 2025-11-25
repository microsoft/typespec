package response.statuscoderange;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import response.statuscoderange.implementation.StatusCodeRangeClientImpl;

/**
 * Initializes a new instance of the synchronous StatusCodeRangeClient type.
 */
@ServiceClient(builder = StatusCodeRangeClientBuilder.class)
public final class StatusCodeRangeClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final StatusCodeRangeClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of StatusCodeRangeClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    StatusCodeRangeClient(StatusCodeRangeClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The errorResponseStatusCodeInRange operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> errorResponseStatusCodeInRangeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Response.StatusCodeRange.errorResponseStatusCodeInRange",
            requestContext,
            updatedContext -> this.serviceClient.errorResponseStatusCodeInRangeWithResponse(updatedContext));
    }

    /**
     * The errorResponseStatusCodeInRange operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void errorResponseStatusCodeInRange() {
        errorResponseStatusCodeInRangeWithResponse(RequestContext.none());
    }

    /**
     * The errorResponseStatusCode404 operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> errorResponseStatusCode404WithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Response.StatusCodeRange.errorResponseStatusCode404",
            requestContext,
            updatedContext -> this.serviceClient.errorResponseStatusCode404WithResponse(updatedContext));
    }

    /**
     * The errorResponseStatusCode404 operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void errorResponseStatusCode404() {
        errorResponseStatusCode404WithResponse(RequestContext.none());
    }
}
