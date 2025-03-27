package specialheaders.conditionalrequest.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;

/**
 * Initializes a new instance of the ConditionalRequestClient type.
 */
public final class ConditionalRequestClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ConditionalRequestClientService service;

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * Initializes an instance of ConditionalRequestClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public ConditionalRequestClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(ConditionalRequestClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for ConditionalRequestClient to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "ConditionalRequestCl", host = "{endpoint}")
    public interface ConditionalRequestClientService {
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-headers/conditional-request/if-match",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> postIfMatchSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-headers/conditional-request/if-none-match",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> postIfNoneMatchSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/special-headers/conditional-request/if-modified-since",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> headIfModifiedSinceSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-headers/conditional-request/if-unmodified-since",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> postIfUnmodifiedSinceSync(@HostParam("endpoint") String endpoint, RequestOptions requestOptions);
    }

    /**
     * Check when only If-Match in header is defined.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>If-Match</td><td>String</td><td>No</td><td>The request should only proceed if an entity matches this
     * string.</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> postIfMatchWithResponse(RequestOptions requestOptions) {
        return service.postIfMatchSync(this.getEndpoint(), requestOptions);
    }

    /**
     * Check when only If-None-Match in header is defined.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>If-None-Match</td><td>String</td><td>No</td><td>The request should only proceed if no entity matches this
     * string.</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> postIfNoneMatchWithResponse(RequestOptions requestOptions) {
        return service.postIfNoneMatchSync(this.getEndpoint(), requestOptions);
    }

    /**
     * Check when only If-Modified-Since in header is defined.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>If-Modified-Since</td><td>OffsetDateTime</td><td>No</td><td>A timestamp indicating the last modified time
     * of the resource known to the
     * client. The operation will be performed only if the resource on the service has
     * been modified since the specified time.</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> headIfModifiedSinceWithResponse(RequestOptions requestOptions) {
        return service.headIfModifiedSinceSync(this.getEndpoint(), requestOptions);
    }

    /**
     * Check when only If-Unmodified-Since in header is defined.
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>If-Unmodified-Since</td><td>OffsetDateTime</td><td>No</td><td>A timestamp indicating the last modified
     * time of the resource known to the
     * client. The operation will be performed only if the resource on the service has
     * not been modified since the specified time.</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> postIfUnmodifiedSinceWithResponse(RequestOptions requestOptions) {
        return service.postIfUnmodifiedSinceSync(this.getEndpoint(), requestOptions);
    }
}
