package specialheaders.conditionalrequest.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.utils.DateTimeRfc1123;
import java.lang.reflect.InvocationTargetException;
import java.time.OffsetDateTime;

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
        static ConditionalRequestClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class
                    .forName("specialheaders.conditionalrequest.implementation.ConditionalRequestClientServiceImpl");
                return (ConditionalRequestClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-headers/conditional-request/if-match",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> postIfMatch(@HostParam("endpoint") String endpoint, @HeaderParam("If-Match") String ifMatch,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-headers/conditional-request/if-none-match",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> postIfNoneMatch(@HostParam("endpoint") String endpoint,
            @HeaderParam("If-None-Match") String ifNoneMatch, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.HEAD,
            path = "/special-headers/conditional-request/if-modified-since",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> headIfModifiedSince(@HostParam("endpoint") String endpoint,
            @HeaderParam("If-Modified-Since") DateTimeRfc1123 ifModifiedSince, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/special-headers/conditional-request/if-unmodified-since",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> postIfUnmodifiedSince(@HostParam("endpoint") String endpoint,
            @HeaderParam("If-Unmodified-Since") DateTimeRfc1123 ifUnmodifiedSince, RequestContext requestContext);
    }

    /**
     * Check when only If-Match in header is defined.
     * 
     * @param ifMatch The request should only proceed if an entity matches this string.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postIfMatchWithResponse(String ifMatch, RequestContext requestContext) {
        return service.postIfMatch(this.getEndpoint(), ifMatch, requestContext);
    }

    /**
     * Check when only If-Match in header is defined.
     * 
     * @param ifMatch The request should only proceed if an entity matches this string.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void postIfMatch(String ifMatch) {
        postIfMatchWithResponse(ifMatch, RequestContext.none());
    }

    /**
     * Check when only If-Match in header is defined.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void postIfMatch() {
        final String ifMatch = null;
        postIfMatchWithResponse(ifMatch, RequestContext.none());
    }

    /**
     * Check when only If-None-Match in header is defined.
     * 
     * @param ifNoneMatch The request should only proceed if no entity matches this string.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postIfNoneMatchWithResponse(String ifNoneMatch, RequestContext requestContext) {
        return service.postIfNoneMatch(this.getEndpoint(), ifNoneMatch, requestContext);
    }

    /**
     * Check when only If-None-Match in header is defined.
     * 
     * @param ifNoneMatch The request should only proceed if no entity matches this string.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void postIfNoneMatch(String ifNoneMatch) {
        postIfNoneMatchWithResponse(ifNoneMatch, RequestContext.none());
    }

    /**
     * Check when only If-None-Match in header is defined.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void postIfNoneMatch() {
        final String ifNoneMatch = null;
        postIfNoneMatchWithResponse(ifNoneMatch, RequestContext.none());
    }

    /**
     * Check when only If-Modified-Since in header is defined.
     * 
     * @param ifModifiedSince A timestamp indicating the last modified time of the resource known to the
     * client. The operation will be performed only if the resource on the service has
     * been modified since the specified time.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> headIfModifiedSinceWithResponse(OffsetDateTime ifModifiedSince,
        RequestContext requestContext) {
        DateTimeRfc1123 ifModifiedSinceConverted
            = ifModifiedSince == null ? null : new DateTimeRfc1123(ifModifiedSince);
        return service.headIfModifiedSince(this.getEndpoint(), ifModifiedSinceConverted, requestContext);
    }

    /**
     * Check when only If-Modified-Since in header is defined.
     * 
     * @param ifModifiedSince A timestamp indicating the last modified time of the resource known to the
     * client. The operation will be performed only if the resource on the service has
     * been modified since the specified time.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void headIfModifiedSince(OffsetDateTime ifModifiedSince) {
        headIfModifiedSinceWithResponse(ifModifiedSince, RequestContext.none());
    }

    /**
     * Check when only If-Modified-Since in header is defined.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void headIfModifiedSince() {
        final OffsetDateTime ifModifiedSince = null;
        headIfModifiedSinceWithResponse(ifModifiedSince, RequestContext.none());
    }

    /**
     * Check when only If-Unmodified-Since in header is defined.
     * 
     * @param ifUnmodifiedSince A timestamp indicating the last modified time of the resource known to the
     * client. The operation will be performed only if the resource on the service has
     * not been modified since the specified time.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postIfUnmodifiedSinceWithResponse(OffsetDateTime ifUnmodifiedSince,
        RequestContext requestContext) {
        DateTimeRfc1123 ifUnmodifiedSinceConverted
            = ifUnmodifiedSince == null ? null : new DateTimeRfc1123(ifUnmodifiedSince);
        return service.postIfUnmodifiedSince(this.getEndpoint(), ifUnmodifiedSinceConverted, requestContext);
    }

    /**
     * Check when only If-Unmodified-Since in header is defined.
     * 
     * @param ifUnmodifiedSince A timestamp indicating the last modified time of the resource known to the
     * client. The operation will be performed only if the resource on the service has
     * not been modified since the specified time.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void postIfUnmodifiedSince(OffsetDateTime ifUnmodifiedSince) {
        postIfUnmodifiedSinceWithResponse(ifUnmodifiedSince, RequestContext.none());
    }

    /**
     * Check when only If-Unmodified-Since in header is defined.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void postIfUnmodifiedSince() {
        final OffsetDateTime ifUnmodifiedSince = null;
        postIfUnmodifiedSinceWithResponse(ifUnmodifiedSince, RequestContext.none());
    }
}
