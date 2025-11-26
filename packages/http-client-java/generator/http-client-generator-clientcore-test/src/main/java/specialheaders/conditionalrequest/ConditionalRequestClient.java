package specialheaders.conditionalrequest;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import java.time.OffsetDateTime;
import specialheaders.conditionalrequest.implementation.ConditionalRequestClientImpl;

/**
 * Initializes a new instance of the synchronous ConditionalRequestClient type.
 */
@ServiceClient(builder = ConditionalRequestClientBuilder.class)
public final class ConditionalRequestClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ConditionalRequestClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ConditionalRequestClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ConditionalRequestClient(ConditionalRequestClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postIfMatchWithResponse(String ifMatch, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialHeaders.ConditionalRequest.postIfMatch",
            requestContext, updatedContext -> this.serviceClient.postIfMatchWithResponse(ifMatch, updatedContext));
    }

    /**
     * Check when only If-Match in header is defined.
     * 
     * @param ifMatch The request should only proceed if an entity matches this string.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
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
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postIfNoneMatchWithResponse(String ifNoneMatch, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialHeaders.ConditionalRequest.postIfNoneMatch",
            requestContext,
            updatedContext -> this.serviceClient.postIfNoneMatchWithResponse(ifNoneMatch, updatedContext));
    }

    /**
     * Check when only If-None-Match in header is defined.
     * 
     * @param ifNoneMatch The request should only proceed if no entity matches this string.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
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
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> headIfModifiedSinceWithResponse(OffsetDateTime ifModifiedSince,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialHeaders.ConditionalRequest.headIfModifiedSince",
            requestContext,
            updatedContext -> this.serviceClient.headIfModifiedSinceWithResponse(ifModifiedSince, updatedContext));
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
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
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
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postIfUnmodifiedSinceWithResponse(OffsetDateTime ifUnmodifiedSince,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialHeaders.ConditionalRequest.postIfUnmodifiedSince",
            requestContext,
            updatedContext -> this.serviceClient.postIfUnmodifiedSinceWithResponse(ifUnmodifiedSince, updatedContext));
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
    @Metadata(properties = { MetadataProperties.GENERATED })
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void postIfUnmodifiedSince() {
        final OffsetDateTime ifUnmodifiedSince = null;
        postIfUnmodifiedSinceWithResponse(ifUnmodifiedSince, RequestContext.none());
    }
}
