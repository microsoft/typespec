package payload.contentnegotiation;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import payload.contentnegotiation.implementation.SameBodiesImpl;

/**
 * Initializes a new instance of the synchronous ContentNegotiationClient type.
 */
@ServiceClient(builder = ContentNegotiationClientBuilder.class)
public final class SameBodyClient {
    @Metadata(generated = true)
    private final SameBodiesImpl serviceClient;

    /**
     * Initializes an instance of SameBodyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    SameBodyClient(SameBodiesImpl serviceClient) {
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
     * The getAvatarAsJpeg operation.
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
    public Response<BinaryData> getAvatarAsJpegWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.getAvatarAsJpegWithResponse(requestOptions);
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
     * The getAvatarAsJpeg operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public BinaryData getAvatarAsJpeg() {
        // Generated convenience method for getAvatarAsJpegWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return getAvatarAsJpegWithResponse(requestOptions).getValue();
    }
}
