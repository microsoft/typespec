package encode.datetime.implementation;

import encode.datetime.DefaultDatetimeProperty;
import encode.datetime.Rfc3339DatetimeProperty;
import encode.datetime.Rfc7231DatetimeProperty;
import encode.datetime.UnixTimestampArrayDatetimeProperty;
import encode.datetime.UnixTimestampDatetimeProperty;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * An instance of this class provides access to all the operations defined in Properties.
 */
public final class PropertiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PropertiesService service;

    /**
     * The service client containing this operation class.
     */
    private final DatetimeClientImpl client;

    /**
     * Initializes an instance of PropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PropertiesImpl(DatetimeClientImpl client) {
        this.service = RestProxy.create(PropertiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for DatetimeClientProperties to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "DatetimeClientProper", host = "{endpoint}")
    public interface PropertiesService {
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/datetime/property/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<DefaultDatetimeProperty> defaultMethodSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/datetime/property/rfc3339",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Rfc3339DatetimeProperty> rfc3339Sync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/datetime/property/rfc7231",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Rfc7231DatetimeProperty> rfc7231Sync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/datetime/property/unix-timestamp",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<UnixTimestampDatetimeProperty> unixTimestampSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/datetime/property/unix-timestamp-array",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<UnixTimestampArrayDatetimeProperty> unixTimestampArraySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);
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
    public Response<DefaultDatetimeProperty> defaultMethodWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.defaultMethodSync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
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
    public Response<Rfc3339DatetimeProperty> rfc3339WithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.rfc3339Sync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
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
    public Response<Rfc7231DatetimeProperty> rfc7231WithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.rfc7231Sync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
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
    public Response<UnixTimestampDatetimeProperty> unixTimestampWithResponse(BinaryData body,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.unixTimestampSync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
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
    public Response<UnixTimestampArrayDatetimeProperty> unixTimestampArrayWithResponse(BinaryData body,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.unixTimestampArraySync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
    }
}
