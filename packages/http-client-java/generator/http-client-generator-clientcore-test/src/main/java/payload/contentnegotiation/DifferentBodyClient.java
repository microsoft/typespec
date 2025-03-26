package payload.contentnegotiation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import payload.contentnegotiation.differentbody.PngImageAsJson;
import payload.contentnegotiation.implementation.DifferentBodiesImpl;

/**
 * Initializes a new instance of the synchronous ContentNegotiationClient type.
 */
@ServiceClient(builder = ContentNegotiationClientBuilder.class)
public final class DifferentBodyClient {
    @Metadata(generated = true)
    private final DifferentBodiesImpl serviceClient;

    /**
     * Initializes an instance of DifferentBodyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    DifferentBodyClient(DifferentBodiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The getAvatarAsPng operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<BinaryData> getAvatarAsPngWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getAvatarAsPngWithResponse(requestOptions);
    }

    /**
     * The getAvatarAsJson operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     content: byte[] (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<PngImageAsJson> getAvatarAsJsonWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getAvatarAsJsonWithResponse(requestOptions);
    }

    /**
     * The getAvatarAsPng operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public BinaryData getAvatarAsPng() {
        // Generated convenience method for getAvatarAsPngWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getAvatarAsPngWithResponse(requestOptions).getValue();
    }

    /**
     * The getAvatarAsJson operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public PngImageAsJson getAvatarAsJson() {
        // Generated convenience method for getAvatarAsJsonWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getAvatarAsJsonWithResponse(requestOptions).getValue();
    }
}
