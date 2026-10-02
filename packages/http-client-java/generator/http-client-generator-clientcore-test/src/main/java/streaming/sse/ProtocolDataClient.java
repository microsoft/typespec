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
import streaming.sse.implementation.ProtocolDatasImpl;

/**
 * Initializes a new instance of the synchronous SseClient type.
 */
@ServiceClient(builder = SseClientBuilder.class)
public final class ProtocolDataClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ProtocolDatasImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ProtocolDataClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ProtocolDataClient(ProtocolDatasImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The withEnvelope operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> withEnvelopeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.Data.withEnvelope", requestContext,
            updatedContext -> this.serviceClient.withEnvelopeWithResponse(updatedContext));
    }

    /**
     * The withEnvelope operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData withEnvelope() {
        return withEnvelopeWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The withoutEnvelope operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> withoutEnvelopeWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Protocol.Data.withoutEnvelope",
            requestContext, updatedContext -> this.serviceClient.withoutEnvelopeWithResponse(updatedContext));
    }

    /**
     * The withoutEnvelope operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData withoutEnvelope() {
        return withoutEnvelopeWithResponse(RequestContext.none()).getValue();
    }
}
