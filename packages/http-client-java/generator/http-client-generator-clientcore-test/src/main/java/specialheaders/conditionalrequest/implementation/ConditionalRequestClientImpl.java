package specialheaders.conditionalrequest.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
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
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Gets The instance of instrumentation to report telemetry.
     * 
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }

    /**
     * Initializes an instance of ConditionalRequestClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public ConditionalRequestClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = ConditionalRequestClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for ConditionalRequestClient to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "ConditionalRequestClient", host = "{endpoint}")
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
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postIfMatchWithResponse(String ifMatch, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialHeaders.ConditionalRequest.postIfMatch",
            requestContext, updatedContext -> {
                return service.postIfMatch(this.getEndpoint(), ifMatch, updatedContext);
            });
    }

    /**
     * Check when only If-None-Match in header is defined.
     * 
     * @param ifNoneMatch The request should only proceed if no entity matches this string.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postIfNoneMatchWithResponse(String ifNoneMatch, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialHeaders.ConditionalRequest.postIfNoneMatch",
            requestContext, updatedContext -> {
                return service.postIfNoneMatch(this.getEndpoint(), ifNoneMatch, updatedContext);
            });
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
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> headIfModifiedSinceWithResponse(OffsetDateTime ifModifiedSince,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialHeaders.ConditionalRequest.headIfModifiedSince",
            requestContext, updatedContext -> {
                DateTimeRfc1123 ifModifiedSinceConverted
                    = ifModifiedSince == null ? null : new DateTimeRfc1123(ifModifiedSince);
                return service.headIfModifiedSince(this.getEndpoint(), ifModifiedSinceConverted, updatedContext);
            });
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
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postIfUnmodifiedSinceWithResponse(OffsetDateTime ifUnmodifiedSince,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialHeaders.ConditionalRequest.postIfUnmodifiedSince",
            requestContext, updatedContext -> {
                DateTimeRfc1123 ifUnmodifiedSinceConverted
                    = ifUnmodifiedSince == null ? null : new DateTimeRfc1123(ifUnmodifiedSince);
                return service.postIfUnmodifiedSince(this.getEndpoint(), ifUnmodifiedSinceConverted, updatedContext);
            });
    }
}
