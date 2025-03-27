package type.enumnamespace.fixed.implementation;

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
import type.enumnamespace.fixed.DaysOfWeekEnum;

/**
 * An instance of this class provides access to all the operations defined in StringOperations.
 */
public final class StringOperationsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final StringOperationsService service;

    /**
     * The service client containing this operation class.
     */
    private final FixedClientImpl client;

    /**
     * Initializes an instance of StringOperationsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    StringOperationsImpl(FixedClientImpl client) {
        this.service = RestProxy.create(StringOperationsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for FixedClientStringOperations to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "FixedClientStringOpe", host = "{endpoint}")
    public interface StringOperationsService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/enum/fixed/string/known-value",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<DaysOfWeekEnum> getKnownValueSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/enum/fixed/string/known-value",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putKnownValueSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/enum/fixed/string/unknown-value",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putUnknownValueSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);
    }

    /**
     * getKnownValue.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String(Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday)
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return days of the week.
     */
    public Response<DaysOfWeekEnum> getKnownValueWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getKnownValueSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * putKnownValue.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String(Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday)
     * }
     * </pre>
     * 
     * @param body _.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> putKnownValueWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.putKnownValueSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * putUnknownValue.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * String(Monday/Tuesday/Wednesday/Thursday/Friday/Saturday/Sunday)
     * }
     * </pre>
     * 
     * @param body _.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> putUnknownValueWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.putUnknownValueSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }
}
