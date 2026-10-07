package payload.pageable.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.paging.PagedIterable;
import io.clientcore.core.http.paging.PagedResponse;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import payload.pageable.Pet;
import payload.pageable.serverdrivenpagination.alternateinitialverb.Filter;
import payload.pageable.serverdrivenpagination.alternateinitialverb.implementation.PostResponse;

/**
 * An instance of this class provides access to all the operations defined in
 * ServerDrivenPaginationAlternateInitialVerbs.
 */
public final class ServerDrivenPaginationAlternateInitialVerbsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ServerDrivenPaginationAlternateInitialVerbsService service;

    /**
     * The service client containing this operation class.
     */
    private final PageableClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ServerDrivenPaginationAlternateInitialVerbsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ServerDrivenPaginationAlternateInitialVerbsImpl(PageableClientImpl client) {
        this.service = ServerDrivenPaginationAlternateInitialVerbsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ServerDrivenPaginationAlternateInitialVerbsService {
        static ServerDrivenPaginationAlternateInitialVerbsService
            getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new ServerDrivenPaginationAlternateInitialVerbsServiceImpl(pipeline);
        }

        Response<PostResponse> post(String endpoint, String accept, Filter body, RequestContext requestContext);

        Response<PostResponse> postNext(String nextLink, String endpoint, String accept, RequestContext requestContext);
    }

    private static final class ServerDrivenPaginationAlternateInitialVerbsServiceImpl
        implements ServerDrivenPaginationAlternateInitialVerbsService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(
                ServerDrivenPaginationAlternateInitialVerbsServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private ServerDrivenPaginationAlternateInitialVerbsServiceImpl(
            io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<PostResponse> post(String endpoint, String accept, Filter body, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/payload/pageable/server-driven-pagination/link/initial-post");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(body,
                    this.xmlSerializer.supportsFormat(requestSerializationFormat)
                        ? this.xmlSerializer
                        : this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null,
                    ServerDrivenPaginationAlternateInitialVerbsServiceImpl.LOGGER);
            }
            try {
                PostResponse deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, PostResponse.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.xmlSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, PostResponse.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<PostResponse> postNext(String nextLink, String endpoint, String accept,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder.parse(nextLink);
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null,
                    ServerDrivenPaginationAlternateInitialVerbsServiceImpl.LOGGER);
            }
            try {
                PostResponse deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, PostResponse.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.xmlSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, PostResponse.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The post operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> postSinglePage(Filter body) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.AlternateInitialVerb.post", RequestContext.none(),
            updatedContext -> {
                final String accept = "application/json";
                Response<PostResponse> res = service.post(this.client.getEndpoint(), accept, body, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, res.getValue().getNext() != null ? res.getValue().getNext() : null,
                    null, null, null);
            });
    }

    /**
     * The post operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> postSinglePage(Filter body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.AlternateInitialVerb.post", requestContext, updatedContext -> {
                final String accept = "application/json";
                Response<PostResponse> res = service.post(this.client.getEndpoint(), accept, body, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, res.getValue().getNext() != null ? res.getValue().getNext() : null,
                    null, null, null);
            });
    }

    /**
     * The post operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> post(Filter body) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "post")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "post")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "post")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "continuationToken")
                    .addKeyValue("methodName", "post")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            return postSinglePage(body);
        }, (pagingOptions, nextLink) -> postNextSinglePage(nextLink));
    }

    /**
     * The post operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> post(Filter body, RequestContext requestContext) {
        RequestContext requestContextForNextPage = requestContext != null ? requestContext : RequestContext.none();
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "post")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "post")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "post")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "continuationToken")
                    .addKeyValue("methodName", "post")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            return postSinglePage(body, requestContext);
        }, (pagingOptions, nextLink) -> postNextSinglePage(nextLink, requestContextForNextPage));
    }

    /**
     * Get the next page of items.
     * 
     * @param nextLink The URL to get the next list of items.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> postNextSinglePage(String nextLink) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.AlternateInitialVerb.post", RequestContext.none(),
            updatedContext -> {
                final String accept = "application/json";
                Response<PostResponse> res
                    = service.postNext(nextLink, this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, res.getValue().getNext() != null ? res.getValue().getNext() : null,
                    null, null, null);
            });
    }

    /**
     * Get the next page of items.
     * 
     * @param nextLink The URL to get the next list of items.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> postNextSinglePage(String nextLink, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.AlternateInitialVerb.post", requestContext, updatedContext -> {
                final String accept = "application/json";
                Response<PostResponse> res
                    = service.postNext(nextLink, this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, res.getValue().getNext() != null ? res.getValue().getNext() : null,
                    null, null, null);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ServerDrivenPaginationAlternateInitialVerbsImpl.class);
}
