package encode.duration;

import encode.duration.implementation.QueriesImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import java.time.Duration;
import java.util.List;

/**
 * Initializes a new instance of the synchronous DurationClient type.
 */
@ServiceClient(builder = DurationClientBuilder.class)
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
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> defaultMethodWithResponse(Duration input, RequestOptions requestOptions) {
        return this.serviceClient.defaultMethodWithResponse(input, requestOptions);
    }

    /**
     * The iso8601 operation.
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> iso8601WithResponse(Duration input, RequestOptions requestOptions) {
        return this.serviceClient.iso8601WithResponse(input, requestOptions);
    }

    /**
     * The int32Seconds operation.
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> int32SecondsWithResponse(Duration input, RequestOptions requestOptions) {
        return this.serviceClient.int32SecondsWithResponse(input, requestOptions);
    }

    /**
     * The floatSeconds operation.
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> floatSecondsWithResponse(Duration input, RequestOptions requestOptions) {
        return this.serviceClient.floatSecondsWithResponse(input, requestOptions);
    }

    /**
     * The float64Seconds operation.
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> float64SecondsWithResponse(Duration input, RequestOptions requestOptions) {
        return this.serviceClient.float64SecondsWithResponse(input, requestOptions);
    }

    /**
     * The int32SecondsArray operation.
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> int32SecondsArrayWithResponse(List<Duration> input, RequestOptions requestOptions) {
        return this.serviceClient.int32SecondsArrayWithResponse(input, requestOptions);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void defaultMethod(Duration input) {
        // Generated convenience method for defaultMethodWithResponse
        RequestOptions requestOptions = new RequestOptions();
        defaultMethodWithResponse(input, requestOptions).getValue();
    }

    /**
     * The iso8601 operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void iso8601(Duration input) {
        // Generated convenience method for iso8601WithResponse
        RequestOptions requestOptions = new RequestOptions();
        iso8601WithResponse(input, requestOptions).getValue();
    }

    /**
     * The int32Seconds operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void int32Seconds(Duration input) {
        // Generated convenience method for int32SecondsWithResponse
        RequestOptions requestOptions = new RequestOptions();
        int32SecondsWithResponse(input, requestOptions).getValue();
    }

    /**
     * The floatSeconds operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void floatSeconds(Duration input) {
        // Generated convenience method for floatSecondsWithResponse
        RequestOptions requestOptions = new RequestOptions();
        floatSecondsWithResponse(input, requestOptions).getValue();
    }

    /**
     * The float64Seconds operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void float64Seconds(Duration input) {
        // Generated convenience method for float64SecondsWithResponse
        RequestOptions requestOptions = new RequestOptions();
        float64SecondsWithResponse(input, requestOptions).getValue();
    }

    /**
     * The int32SecondsArray operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void int32SecondsArray(List<Duration> input) {
        // Generated convenience method for int32SecondsArrayWithResponse
        RequestOptions requestOptions = new RequestOptions();
        int32SecondsArrayWithResponse(input, requestOptions).getValue();
    }
}
