package encode.bytes;

import encode.bytes.implementation.RequestBodiesImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.utils.Base64Uri;

/**
 * Initializes a new instance of the synchronous BytesClient type.
 */
@ServiceClient(builder = BytesClientBuilder.class)
public final class RequestBodyClient {
    @Metadata(generated = true)
    private final RequestBodiesImpl serviceClient;

    /**
     * Initializes an instance of RequestBodyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    RequestBodyClient(RequestBodiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The defaultMethod operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> defaultMethodWithResponse(BinaryData value, RequestOptions requestOptions) {
        return this.serviceClient.defaultMethodWithResponse(value, requestOptions);
    }

    /**
     * The octetStream operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> octetStreamWithResponse(BinaryData value, RequestOptions requestOptions) {
        return this.serviceClient.octetStreamWithResponse(value, requestOptions);
    }

    /**
     * The customContentType operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * BinaryData
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> customContentTypeWithResponse(BinaryData value, RequestOptions requestOptions) {
        return this.serviceClient.customContentTypeWithResponse(value, requestOptions);
    }

    /**
     * The base64 operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * byte[]
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> base64WithResponse(BinaryData value, RequestOptions requestOptions) {
        return this.serviceClient.base64WithResponse(value, requestOptions);
    }

    /**
     * The base64url operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * Base64Uri
     * }
     * </pre>
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> base64urlWithResponse(BinaryData value, RequestOptions requestOptions) {
        return this.serviceClient.base64urlWithResponse(value, requestOptions);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void defaultMethod(BinaryData value) {
        // Generated convenience method for defaultMethodWithResponse
        RequestOptions requestOptions = new RequestOptions();
        defaultMethodWithResponse(value, requestOptions).getValue();
    }

    /**
     * The octetStream operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void octetStream(BinaryData value) {
        // Generated convenience method for octetStreamWithResponse
        RequestOptions requestOptions = new RequestOptions();
        octetStreamWithResponse(value, requestOptions).getValue();
    }

    /**
     * The customContentType operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void customContentType(BinaryData value) {
        // Generated convenience method for customContentTypeWithResponse
        RequestOptions requestOptions = new RequestOptions();
        customContentTypeWithResponse(value, requestOptions).getValue();
    }

    /**
     * The base64 operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void base64(byte[] value) {
        // Generated convenience method for base64WithResponse
        RequestOptions requestOptions = new RequestOptions();
        base64WithResponse(BinaryData.fromObject(value), requestOptions).getValue();
    }

    /**
     * The base64url operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void base64url(byte[] value) {
        // Generated convenience method for base64urlWithResponse
        RequestOptions requestOptions = new RequestOptions();
        base64urlWithResponse(BinaryData.fromObject(Base64Uri.encode(value)), requestOptions).getValue();
    }
}
