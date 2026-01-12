package versioning.added;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import versioning.added.implementation.AddedClientImpl;

/**
 * Initializes a new instance of the synchronous AddedClient type.
 */
@ServiceClient(builder = AddedClientBuilder.class)
public final class AddedClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final AddedClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of AddedClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    AddedClient(AddedClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The v1 operation.
     * 
     * @param headerV2 The headerV2 parameter.
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelV1> v1WithResponse(String headerV2, ModelV1 body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.Added.v1", requestContext,
            updatedContext -> this.serviceClient.v1WithResponse(headerV2, body, updatedContext));
    }

    /**
     * The v1 operation.
     * 
     * @param headerV2 The headerV2 parameter.
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public ModelV1 v1(String headerV2, ModelV1 body) {
        return v1WithResponse(headerV2, body, RequestContext.none()).getValue();
    }

    /**
     * The v2 operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelV2> v2WithResponse(ModelV2 body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.Added.v2", requestContext,
            updatedContext -> this.serviceClient.v2WithResponse(body, updatedContext));
    }

    /**
     * The v2 operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public ModelV2 v2(ModelV2 body) {
        return v2WithResponse(body, RequestContext.none()).getValue();
    }
}
