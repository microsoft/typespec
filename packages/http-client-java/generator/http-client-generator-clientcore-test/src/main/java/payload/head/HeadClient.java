package payload.head;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import payload.head.implementation.HeadClientImpl;

/**
 * Initializes a new instance of the synchronous HeadClient type.
 */
@ServiceClient(builder = HeadClientBuilder.class)
public final class HeadClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final HeadClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of HeadClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    HeadClient(HeadClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The contentTypeHeaderInResponse operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> contentTypeHeaderInResponseWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Head.contentTypeHeaderInResponse", requestContext,
            updatedContext -> this.serviceClient.contentTypeHeaderInResponseWithResponse(updatedContext));
    }

    /**
     * The contentTypeHeaderInResponse operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void contentTypeHeaderInResponse() {
        contentTypeHeaderInResponseWithResponse(RequestContext.none());
    }
}
