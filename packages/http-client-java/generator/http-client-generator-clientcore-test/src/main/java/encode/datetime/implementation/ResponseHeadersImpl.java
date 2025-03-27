package encode.datetime.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;

/**
 * An instance of this class provides access to all the operations defined in ResponseHeaders.
 */
public final class ResponseHeadersImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ResponseHeadersService service;

    /**
     * The service client containing this operation class.
     */
    private final DatetimeClientImpl client;

    /**
     * Initializes an instance of ResponseHeadersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ResponseHeadersImpl(DatetimeClientImpl client) {
        this.service = RestProxy.create(ResponseHeadersService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for DatetimeClientResponseHeaders to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "DatetimeClientRespon", host = "{endpoint}")
    public interface ResponseHeadersService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/responseheader/default",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> defaultMethodSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/responseheader/rfc3339",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> rfc3339Sync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/responseheader/rfc7231",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> rfc7231Sync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/encode/datetime/responseheader/unix-timestamp",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> unixTimestampSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);
    }

    /**
     * The defaultMethod operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> defaultMethodWithResponse(RequestOptions requestOptions) {
        return service.defaultMethodSync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The rfc3339 operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> rfc3339WithResponse(RequestOptions requestOptions) {
        return service.rfc3339Sync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The rfc7231 operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> rfc7231WithResponse(RequestOptions requestOptions) {
        return service.rfc7231Sync(this.client.getEndpoint(), requestOptions);
    }

    /**
     * The unixTimestamp operation.
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> unixTimestampWithResponse(RequestOptions requestOptions) {
        return service.unixTimestampSync(this.client.getEndpoint(), requestOptions);
    }
}
