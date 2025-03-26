package encode.duration;

import encode.duration.implementation.HeadersImpl;
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
public final class HeaderClient {
    @Metadata(generated = true)
    private final HeadersImpl serviceClient;

    /**
     * Initializes an instance of HeaderClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    HeaderClient(HeadersImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The defaultMethod operation.
     * 
     * @param duration The duration parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> defaultMethodWithResponse(Duration duration, RequestOptions requestOptions) {
        return this.serviceClient.defaultMethodWithResponse(duration, requestOptions);
    }

    /**
     * The iso8601 operation.
     * 
     * @param duration The duration parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> iso8601WithResponse(Duration duration, RequestOptions requestOptions) {
        return this.serviceClient.iso8601WithResponse(duration, requestOptions);
    }

    /**
     * The iso8601Array operation.
     * 
     * @param duration The duration parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> iso8601ArrayWithResponse(List<Duration> duration, RequestOptions requestOptions) {
        return this.serviceClient.iso8601ArrayWithResponse(duration, requestOptions);
    }

    /**
     * The int32Seconds operation.
     * 
     * @param duration The duration parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> int32SecondsWithResponse(Duration duration, RequestOptions requestOptions) {
        return this.serviceClient.int32SecondsWithResponse(duration, requestOptions);
    }

    /**
     * The floatSeconds operation.
     * 
     * @param duration The duration parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> floatSecondsWithResponse(Duration duration, RequestOptions requestOptions) {
        return this.serviceClient.floatSecondsWithResponse(duration, requestOptions);
    }

    /**
     * The float64Seconds operation.
     * 
     * @param duration The duration parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> float64SecondsWithResponse(Duration duration, RequestOptions requestOptions) {
        return this.serviceClient.float64SecondsWithResponse(duration, requestOptions);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param duration The duration parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void defaultMethod(Duration duration) {
        // Generated convenience method for defaultMethodWithResponse
        RequestOptions requestOptions = new RequestOptions();
        defaultMethodWithResponse(duration, requestOptions).getValue();
    }

    /**
     * The iso8601 operation.
     * 
     * @param duration The duration parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void iso8601(Duration duration) {
        // Generated convenience method for iso8601WithResponse
        RequestOptions requestOptions = new RequestOptions();
        iso8601WithResponse(duration, requestOptions).getValue();
    }

    /**
     * The iso8601Array operation.
     * 
     * @param duration The duration parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void iso8601Array(List<Duration> duration) {
        // Generated convenience method for iso8601ArrayWithResponse
        RequestOptions requestOptions = new RequestOptions();
        iso8601ArrayWithResponse(duration, requestOptions).getValue();
    }

    /**
     * The int32Seconds operation.
     * 
     * @param duration The duration parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void int32Seconds(Duration duration) {
        // Generated convenience method for int32SecondsWithResponse
        RequestOptions requestOptions = new RequestOptions();
        int32SecondsWithResponse(duration, requestOptions).getValue();
    }

    /**
     * The floatSeconds operation.
     * 
     * @param duration The duration parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void floatSeconds(Duration duration) {
        // Generated convenience method for floatSecondsWithResponse
        RequestOptions requestOptions = new RequestOptions();
        floatSecondsWithResponse(duration, requestOptions).getValue();
    }

    /**
     * The float64Seconds operation.
     * 
     * @param duration The duration parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void float64Seconds(Duration duration) {
        // Generated convenience method for float64SecondsWithResponse
        RequestOptions requestOptions = new RequestOptions();
        float64SecondsWithResponse(duration, requestOptions).getValue();
    }
}
