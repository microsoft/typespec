package encode.datetime;

import encode.datetime.implementation.ResponseHeadersImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;

/**
 * Initializes a new instance of the synchronous DatetimeClient type.
 */
@ServiceClient(builder = DatetimeClientBuilder.class)
public final class ResponseHeaderClient {
    @Metadata(generated = true)
    private final ResponseHeadersImpl serviceClient;

    /**
     * Initializes an instance of ResponseHeaderClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    ResponseHeaderClient(ResponseHeadersImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The defaultMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> defaultMethodWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.defaultMethodWithResponse(requestOptions);
    }

    /**
     * The rfc3339 operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> rfc3339WithResponse(RequestOptions requestOptions) {
        return this.serviceClient.rfc3339WithResponse(requestOptions);
    }

    /**
     * The rfc7231 operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> rfc7231WithResponse(RequestOptions requestOptions) {
        return this.serviceClient.rfc7231WithResponse(requestOptions);
    }

    /**
     * The unixTimestamp operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> unixTimestampWithResponse(RequestOptions requestOptions) {
        return this.serviceClient.unixTimestampWithResponse(requestOptions);
    }

    /**
     * The defaultMethod operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void defaultMethod() {
        // Generated convenience method for defaultMethodWithResponse
        RequestOptions requestOptions = new RequestOptions();
        defaultMethodWithResponse(requestOptions).getValue();
    }

    /**
     * The rfc3339 operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void rfc3339() {
        // Generated convenience method for rfc3339WithResponse
        RequestOptions requestOptions = new RequestOptions();
        rfc3339WithResponse(requestOptions).getValue();
    }

    /**
     * The rfc7231 operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void rfc7231() {
        // Generated convenience method for rfc7231WithResponse
        RequestOptions requestOptions = new RequestOptions();
        rfc7231WithResponse(requestOptions).getValue();
    }

    /**
     * The unixTimestamp operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void unixTimestamp() {
        // Generated convenience method for unixTimestampWithResponse
        RequestOptions requestOptions = new RequestOptions();
        unixTimestampWithResponse(requestOptions).getValue();
    }
}
