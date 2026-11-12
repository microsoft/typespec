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
import streaming.sse.implementation.RetrievesImpl;
import streaming.sse.retrieve.RetrievalRequest;

/**
 * Initializes a new instance of the synchronous SseClient type.
 */
@ServiceClient(builder = SseClientBuilder.class)
public final class RetrieveClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final RetrievesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of RetrieveClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    RetrieveClient(RetrievesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The stream operation.
     * 
     * @param request The request parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> streamWithResponse(RetrievalRequest request, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Retrieve.stream", requestContext,
            updatedContext -> this.serviceClient.streamWithResponse(request, updatedContext));
    }

    /**
     * The stream operation.
     * 
     * @param request The request parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData stream(RetrievalRequest request) {
        return streamWithResponse(request, RequestContext.none()).getValue();
    }
}
