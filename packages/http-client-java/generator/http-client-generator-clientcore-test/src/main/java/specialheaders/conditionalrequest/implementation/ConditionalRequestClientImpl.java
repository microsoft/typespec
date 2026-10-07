package specialheaders.conditionalrequest.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.utils.DateTimeRfc1123;
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

    public interface ConditionalRequestClientService {
        static ConditionalRequestClientService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new ConditionalRequestClientServiceImpl(pipeline);
        }

        Response<Void> postIfMatch(String endpoint, String ifMatch, RequestContext requestContext);

        Response<Void> postIfNoneMatch(String endpoint, String ifNoneMatch, RequestContext requestContext);

        Response<Void> headIfModifiedSince(String endpoint, DateTimeRfc1123 ifModifiedSince,
            RequestContext requestContext);

        Response<Void> postIfUnmodifiedSince(String endpoint, DateTimeRfc1123 ifUnmodifiedSince,
            RequestContext requestContext);
    }

    private static final class ConditionalRequestClientServiceImpl implements ConditionalRequestClientService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(ConditionalRequestClientServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private ConditionalRequestClientServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> postIfMatch(String endpoint, String ifMatch, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/special-headers/conditional-request/if-match");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (ifMatch != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("If-Match"), ifMatch);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, ConditionalRequestClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> postIfNoneMatch(String endpoint, String ifNoneMatch, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/special-headers/conditional-request/if-none-match");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (ifNoneMatch != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("If-None-Match"), ifNoneMatch);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, ConditionalRequestClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> headIfModifiedSince(String endpoint, DateTimeRfc1123 ifModifiedSince,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/special-headers/conditional-request/if-modified-since");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.HEAD)
                .setUri(uriBuilder.toString());
            if (ifModifiedSince != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("If-Modified-Since"),
                        String.valueOf(ifModifiedSince));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, ConditionalRequestClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> postIfUnmodifiedSince(String endpoint, DateTimeRfc1123 ifUnmodifiedSince,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/special-headers/conditional-request/if-unmodified-since");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (ifUnmodifiedSince != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("If-Unmodified-Since"),
                        String.valueOf(ifUnmodifiedSince));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, ConditionalRequestClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
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

    private static final ClientLogger LOGGER = new ClientLogger(ConditionalRequestClientImpl.class);
}
