package payload.jsonmergepatch;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import payload.jsonmergepatch.implementation.JsonMergePatchClientImpl;

/**
 * Initializes a new instance of the synchronous JsonMergePatchClient type.
 */
@ServiceClient(builder = JsonMergePatchClientBuilder.class)
public final class JsonMergePatchClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final JsonMergePatchClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of JsonMergePatchClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    JsonMergePatchClient(JsonMergePatchClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * Test content-type: application/merge-patch+json with required body.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Resource> createResourceWithResponse(Resource body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.JsonMergePatch.createResource", requestContext,
            updatedContext -> this.serviceClient.createResourceWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: application/merge-patch+json with required body.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Resource createResource(Resource body) {
        return createResourceWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * Test content-type: application/merge-patch+json with required body.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Resource> updateResourceWithResponse(ResourcePatch body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.JsonMergePatch.updateResource", requestContext,
            updatedContext -> this.serviceClient.updateResourceWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: application/merge-patch+json with required body.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Resource updateResource(ResourcePatch body) {
        return updateResourceWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * Test content-type: application/merge-patch+json with optional body.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Resource> updateOptionalResourceWithResponse(ResourcePatch body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.JsonMergePatch.updateOptionalResource",
            requestContext,
            updatedContext -> this.serviceClient.updateOptionalResourceWithResponse(body, updatedContext));
    }

    /**
     * Test content-type: application/merge-patch+json with optional body.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Resource updateOptionalResource(ResourcePatch body) {
        return updateOptionalResourceWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * Test content-type: application/merge-patch+json with optional body.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Resource updateOptionalResource() {
        final ResourcePatch body = null;
        return updateOptionalResourceWithResponse(body, RequestContext.none()).getValue();
    }
}
