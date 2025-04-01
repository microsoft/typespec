package encode.datetime;

import encode.datetime.implementation.QueriesImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Initializes a new instance of the synchronous DatetimeClient type.
 */
@ServiceClient(builder = DatetimeClientBuilder.class)
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
    public Response<Void> defaultMethodWithResponse(OffsetDateTime value, RequestOptions requestOptions) {
        return this.serviceClient.defaultMethodWithResponse(value, requestOptions);
    }

    /**
     * The rfc3339 operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> rfc3339WithResponse(OffsetDateTime value, RequestOptions requestOptions) {
        return this.serviceClient.rfc3339WithResponse(value, requestOptions);
    }

    /**
     * The rfc7231 operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> rfc7231WithResponse(OffsetDateTime value, RequestOptions requestOptions) {
        return this.serviceClient.rfc7231WithResponse(value, requestOptions);
    }

    /**
     * The unixTimestamp operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> unixTimestampWithResponse(OffsetDateTime value, RequestOptions requestOptions) {
        return this.serviceClient.unixTimestampWithResponse(value, requestOptions);
    }

    /**
     * The unixTimestampArray operation.
     * 
     * @param value The value parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Void> unixTimestampArrayWithResponse(List<OffsetDateTime> value, RequestOptions requestOptions) {
        return this.serviceClient.unixTimestampArrayWithResponse(value, requestOptions);
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
    public void defaultMethod(OffsetDateTime value) {
        // Generated convenience method for defaultMethodWithResponse
        RequestOptions requestOptions = new RequestOptions();
        defaultMethodWithResponse(value, requestOptions).getValue();
    }

    /**
     * The rfc3339 operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void rfc3339(OffsetDateTime value) {
        // Generated convenience method for rfc3339WithResponse
        RequestOptions requestOptions = new RequestOptions();
        rfc3339WithResponse(value, requestOptions).getValue();
    }

    /**
     * The rfc7231 operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void rfc7231(OffsetDateTime value) {
        // Generated convenience method for rfc7231WithResponse
        RequestOptions requestOptions = new RequestOptions();
        rfc7231WithResponse(value, requestOptions).getValue();
    }

    /**
     * The unixTimestamp operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void unixTimestamp(OffsetDateTime value) {
        // Generated convenience method for unixTimestampWithResponse
        RequestOptions requestOptions = new RequestOptions();
        unixTimestampWithResponse(value, requestOptions).getValue();
    }

    /**
     * The unixTimestampArray operation.
     * 
     * @param value The value parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(generated = true)
    public void unixTimestampArray(List<OffsetDateTime> value) {
        // Generated convenience method for unixTimestampArrayWithResponse
        RequestOptions requestOptions = new RequestOptions();
        unixTimestampArrayWithResponse(value, requestOptions).getValue();
    }
}
