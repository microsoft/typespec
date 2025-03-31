package encode.datetime;

import encode.datetime.implementation.PropertiesImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * Initializes a new instance of the synchronous DatetimeClient type.
 */
@ServiceClient(builder = DatetimeClientBuilder.class)
public final class PropertyClient {
    @Metadata(generated = true)
    private final PropertiesImpl serviceClient;

    /**
     * Initializes an instance of PropertyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(generated = true)
    PropertyClient(PropertiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The defaultMethod operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: OffsetDateTime (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: OffsetDateTime (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<DefaultDatetimeProperty> defaultMethodWithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.defaultMethodWithResponse(body, requestOptions);
    }

    /**
     * The rfc3339 operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: OffsetDateTime (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: OffsetDateTime (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Rfc3339DatetimeProperty> rfc3339WithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.rfc3339WithResponse(body, requestOptions);
    }

    /**
     * The rfc7231 operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: DateTimeRfc1123 (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: DateTimeRfc1123 (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<Rfc7231DatetimeProperty> rfc7231WithResponse(BinaryData body, RequestOptions requestOptions) {
        return this.serviceClient.rfc7231WithResponse(body, requestOptions);
    }

    /**
     * The unixTimestamp operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: long (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: long (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<UnixTimestampDatetimeProperty> unixTimestampWithResponse(BinaryData body,
        RequestOptions requestOptions) {
        return this.serviceClient.unixTimestampWithResponse(body, requestOptions);
    }

    /**
     * The unixTimestampArray operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value (Required): [
     *         long (Required)
     *     ]
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value (Required): [
     *         long (Required)
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    @Metadata(generated = true)
    public Response<UnixTimestampArrayDatetimeProperty> unixTimestampArrayWithResponse(BinaryData body,
        RequestOptions requestOptions) {
        return this.serviceClient.unixTimestampArrayWithResponse(body, requestOptions);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public DefaultDatetimeProperty defaultMethod(DefaultDatetimeProperty body) {
        // Generated convenience method for defaultMethodWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return defaultMethodWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The rfc3339 operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public Rfc3339DatetimeProperty rfc3339(Rfc3339DatetimeProperty body) {
        // Generated convenience method for rfc3339WithResponse
        RequestOptions requestOptions = new RequestOptions();
        return rfc3339WithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The rfc7231 operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public Rfc7231DatetimeProperty rfc7231(Rfc7231DatetimeProperty body) {
        // Generated convenience method for rfc7231WithResponse
        RequestOptions requestOptions = new RequestOptions();
        return rfc7231WithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The unixTimestamp operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public UnixTimestampDatetimeProperty unixTimestamp(UnixTimestampDatetimeProperty body) {
        // Generated convenience method for unixTimestampWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return unixTimestampWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }

    /**
     * The unixTimestampArray operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(generated = true)
    public UnixTimestampArrayDatetimeProperty unixTimestampArray(UnixTimestampArrayDatetimeProperty body) {
        // Generated convenience method for unixTimestampArrayWithResponse
        RequestOptions requestOptions = new RequestOptions();
        return unixTimestampArrayWithResponse(BinaryData.fromObject(body), requestOptions).getValue();
    }
}
