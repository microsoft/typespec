package response.bodyornocontent;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import response.bodyornocontent.implementation.BodyOrNoContentClientImpl;

/**
 * Initializes a new instance of the synchronous BodyOrNoContentClient type.
 */
@ServiceClient(builder = BodyOrNoContentClientBuilder.class)
public final class BodyOrNoContentClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final BodyOrNoContentClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of BodyOrNoContentClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    BodyOrNoContentClient(BodyOrNoContentClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The getBody operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BlobLayout> getBodyWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Response.BodyOrNoContent.getBody", requestContext,
            updatedContext -> this.serviceClient.getBodyWithResponse(updatedContext));
    }

    /**
     * The getBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BlobLayout getBody() {
        return getBodyWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The getNoContent operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BlobLayout> getNoContentWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Response.BodyOrNoContent.getNoContent", requestContext,
            updatedContext -> this.serviceClient.getNoContentWithResponse(updatedContext));
    }

    /**
     * The getNoContent operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BlobLayout getNoContent() {
        return getNoContentWithResponse(RequestContext.none()).getValue();
    }
}
