package payload.contentnegotiation;

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
import payload.contentnegotiation.differentbody.PngImageAsJson;
import payload.contentnegotiation.implementation.DifferentBodiesImpl;

/**
 * Initializes a new instance of the synchronous ContentNegotiationClient type.
 */
@ServiceClient(builder = ContentNegotiationClientBuilder.class)
public final class DifferentBodyClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final DifferentBodiesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of DifferentBodyClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    DifferentBodyClient(DifferentBodiesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The getAvatarAsPng operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> getAvatarAsPngWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.ContentNegotiation.DifferentBody.getAvatarAsPng",
            requestContext, updatedContext -> this.serviceClient.getAvatarAsPngWithResponse(updatedContext));
    }

    /**
     * The getAvatarAsPng operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BinaryData getAvatarAsPng() {
        return getAvatarAsPngWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The getAvatarAsJson operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PngImageAsJson> getAvatarAsJsonWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.ContentNegotiation.DifferentBody.getAvatarAsJson",
            requestContext, updatedContext -> this.serviceClient.getAvatarAsJsonWithResponse(updatedContext));
    }

    /**
     * The getAvatarAsJson operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PngImageAsJson getAvatarAsJson() {
        return getAvatarAsJsonWithResponse(RequestContext.none()).getValue();
    }
}
