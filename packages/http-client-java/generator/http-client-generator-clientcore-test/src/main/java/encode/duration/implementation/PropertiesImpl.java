package encode.duration.implementation;

import encode.duration.property.DefaultDurationProperty;
import encode.duration.property.Float64SecondsDurationProperty;
import encode.duration.property.FloatSecondsDurationArrayProperty;
import encode.duration.property.FloatSecondsDurationProperty;
import encode.duration.property.ISO8601DurationProperty;
import encode.duration.property.Int32SecondsDurationProperty;
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
    private final DurationClientImpl client;

    /**
     * Initializes an instance of PropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PropertiesImpl(DurationClientImpl client) {
        this.service = RestProxy.create(PropertiesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for DurationClientProperties to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "DurationClientProper", host = "{endpoint}")
    public interface PropertiesService {
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<DefaultDurationProperty> defaultMethodSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/iso8601",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ISO8601DurationProperty> iso8601Sync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/int32-seconds",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Int32SecondsDurationProperty> int32SecondsSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/float-seconds",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<FloatSecondsDurationProperty> floatSecondsSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/float64-seconds",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Float64SecondsDurationProperty> float64SecondsSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData body, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/float-seconds-array",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<FloatSecondsDurationArrayProperty> floatSecondsArraySync(@HostParam("endpoint") String endpoint,
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
     *     value: Duration (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: Duration (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<DefaultDurationProperty> defaultMethodWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.defaultMethodSync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
    }

    /**
     * The iso8601 operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: Duration (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: Duration (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<ISO8601DurationProperty> iso8601WithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.iso8601Sync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
    }

    /**
     * The int32Seconds operation.
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
    public Response<Int32SecondsDurationProperty> int32SecondsWithResponse(BinaryData body,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.int32SecondsSync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
    }

    /**
     * The floatSeconds operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: double (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: double (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<FloatSecondsDurationProperty> floatSecondsWithResponse(BinaryData body,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.floatSecondsSync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
    }

    /**
     * The float64Seconds operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: double (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value: double (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Float64SecondsDurationProperty> float64SecondsWithResponse(BinaryData body,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.float64SecondsSync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
    }

    /**
     * The floatSecondsArray operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value (Required): [
     *         double (Required)
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
     *         double (Required)
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
    public Response<FloatSecondsDurationArrayProperty> floatSecondsArrayWithResponse(BinaryData body,
        RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.floatSecondsArraySync(this.client.getEndpoint(), contentType, accept, body, requestOptions);
    }
}
