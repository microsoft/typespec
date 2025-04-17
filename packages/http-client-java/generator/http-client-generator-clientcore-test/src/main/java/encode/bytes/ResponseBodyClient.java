package encode.bytes;

import encode.bytes.implementation.ResponseBodiesImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * Initializes a new instance of the synchronous BytesClient type.
 */
@ServiceClient(builder = BytesClientBuilder.class)
public final class ResponseBodyClient {
    @Metadata(generated = true)
    private final ResponseBodiesImpl serviceClient;

    /**
     * Initializes an instance of ResponseBodyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ResponseBodyClient(ResponseBodiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The defaultMethod operation.
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
    public Response<BinaryData> defaultMethodWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.defaultMethodWithResponse(requestOptions);
    }

    /**
     * The octetStream operation.
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
    public Response<BinaryData> octetStreamWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.octetStreamWithResponse(requestOptions);
    }

    /**
     * The customContentType operation.
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
    public Response<BinaryData> customContentTypeWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.customContentTypeWithResponse(requestOptions);
    }

    /**
     * The base64 operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * byte[]
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return represent a byte array.
     */
    @Metadata(generated = true)
    public Response<byte[]> base64WithResponse(RequestOptions requestOptions) {
        return this.serviceClient.base64WithResponse(requestOptions);
    }

    /**
     * The base64url operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * Base64Uri
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<byte[]> base64urlWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.base64urlWithResponse(requestOptions);
    }

    /**
     * The defaultMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public BinaryData defaultMethod() {
        // Generated convenience method for defaultMethodWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return defaultMethodWithResponse(requestOptions).getValue();
    }

    /**
     * The octetStream operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public BinaryData octetStream() {
        // Generated convenience method for octetStreamWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return octetStreamWithResponse(requestOptions).getValue();
    }

    /**
     * The customContentType operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public BinaryData customContentType() {
        // Generated convenience method for customContentTypeWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return customContentTypeWithResponse(requestOptions).getValue();
    }

    /**
     * The base64 operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return represent a byte array.
     */
    @Metadata(generated = true)
    public byte[] base64() {
        // Generated convenience method for base64WithResponse
        RequestOptions requestOptions = new RequestOptions();
        return base64WithResponse(requestOptions).getValue();
    }

    /**
     * The base64url operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public byte[] base64url() {
        // Generated convenience method for base64urlWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return base64urlWithResponse(requestOptions).getValue();
    }
}
