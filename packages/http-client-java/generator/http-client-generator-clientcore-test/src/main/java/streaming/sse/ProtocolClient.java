package streaming.sse;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.models.binarydata.BinaryData;
import streaming.sse.implementation.ProtocolsImpl;

/**
 * Initializes a new instance of the synchronous SseClient type.
 */
@ServiceClient(builder = SseClientBuilder.class)
public final class ProtocolClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ProtocolsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ProtocolClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ProtocolClient(ProtocolsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The id operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> idWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.id", requestContext,
            updatedContext -> this.serviceClient.idWithResponse(updatedContext));
    }

    /**
     * The id operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData id() {
        return idWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The invalidId operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> invalidIdWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.invalidId", requestContext,
            updatedContext -> this.serviceClient.invalidIdWithResponse(updatedContext));
    }

    /**
     * The invalidId operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData invalidId() {
        return invalidIdWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The retry operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> retryWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.retry", requestContext,
            updatedContext -> this.serviceClient.retryWithResponse(updatedContext));
    }

    /**
     * The retry operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData retry() {
        return retryWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The invalidRetry operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> invalidRetryWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.invalidRetry", requestContext,
            updatedContext -> this.serviceClient.invalidRetryWithResponse(updatedContext));
    }

    /**
     * The invalidRetry operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData invalidRetry() {
        return invalidRetryWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The reconnect operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> reconnectWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.reconnect", requestContext,
            updatedContext -> this.serviceClient.reconnectWithResponse(updatedContext));
    }

    /**
     * The reconnect operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData reconnect() {
        return reconnectWithResponse(RequestContext.none()).getValue();
    }
}
