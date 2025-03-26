package encode.bytes;

import encode.bytes.implementation.QueriesImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import java.util.List;

/**
 * Initializes a new instance of the synchronous BytesClient type.
 */
@ServiceClient(builder = BytesClientBuilder.class)
public final class QueryClient {
    @Metadata(generated = true)
    private final QueriesImpl serviceClient;

    /**
     * Initializes an instance of QueryClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    QueryClient(QueriesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The defaultMethod operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> defaultMethodWithResponse(byte[] value, RequestOptions requestOptions) {
        return this.serviceClient.defaultMethodWithResponse(value, requestOptions);
    }

    /**
     * The base64 operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> base64WithResponse(byte[] value, RequestOptions requestOptions) {
        return this.serviceClient.base64WithResponse(value, requestOptions);
    }

    /**
     * The base64url operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> base64urlWithResponse(byte[] value, RequestOptions requestOptions) {
        return this.serviceClient.base64urlWithResponse(value, requestOptions);
    }

    /**
     * The base64urlArray operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> base64urlArrayWithResponse(List<byte[]> value, RequestOptions requestOptions) {
        return this.serviceClient.base64urlArrayWithResponse(value, requestOptions);
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
    public void defaultMethod(byte[] value) {
        // Generated convenience method for defaultMethodWithResponse
        RequestOptions requestOptions = new RequestOptions();
        defaultMethodWithResponse(value, requestOptions).getValue();
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
        base64WithResponse(value, requestOptions).getValue();
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
        base64urlWithResponse(value, requestOptions).getValue();
    }

    /**
     * The base64urlArray operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void base64urlArray(List<byte[]> value) {
        // Generated convenience method for base64urlArrayWithResponse
        RequestOptions requestOptions = new RequestOptions();
        base64urlArrayWithResponse(value, requestOptions).getValue();
    }
}
