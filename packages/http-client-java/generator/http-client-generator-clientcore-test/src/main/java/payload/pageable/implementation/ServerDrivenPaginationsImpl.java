package payload.pageable.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.paging.PagedIterable;
import io.clientcore.core.http.paging.PagedResponse;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import payload.pageable.Pet;
import payload.pageable.serverdrivenpagination.implementation.LinkResponse;
import payload.pageable.serverdrivenpagination.implementation.LinkStringResponse;
import payload.pageable.serverdrivenpagination.implementation.NestedLinkResponse;

/**
 * An instance of this class provides access to all the operations defined in ServerDrivenPaginations.
 */
public final class ServerDrivenPaginationsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ServerDrivenPaginationsService service;

    /**
     * The service client containing this operation class.
     */
    private final PageableClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ServerDrivenPaginationsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ServerDrivenPaginationsImpl(PageableClientImpl client) {
        this.service = ServerDrivenPaginationsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ServerDrivenPaginationsService {
        static ServerDrivenPaginationsService getNewInstance(HttpPipeline pipeline) {
            return new ServerDrivenPaginationsServiceImpl(pipeline);
        }

        Response<LinkResponse> link(String endpoint, String accept, RequestContext requestContext);

        Response<LinkStringResponse> linkString(String endpoint, String accept, RequestContext requestContext);

        Response<NestedLinkResponse> nestedLink(String endpoint, String accept, RequestContext requestContext);

        Response<LinkResponse> linkNext(String nextLink, String endpoint, String accept, RequestContext requestContext);

        Response<LinkStringResponse> linkStringNext(String nextLink, String endpoint, String accept,
            RequestContext requestContext);

        Response<NestedLinkResponse> nestedLinkNext(String nextLink, String endpoint, String accept,
            RequestContext requestContext);
    }

    private static final class ServerDrivenPaginationsServiceImpl implements ServerDrivenPaginationsService {
        private static final ClientLogger LOGGER = new ClientLogger(ServerDrivenPaginationsServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private ServerDrivenPaginationsServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<LinkResponse> link(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/payload/pageable/server-driven-pagination/link");
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, ServerDrivenPaginationsServiceImpl.LOGGER);
            }
            try {
                LinkResponse deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, LinkResponse.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<LinkStringResponse> linkString(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/payload/pageable/server-driven-pagination/link-string");
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, ServerDrivenPaginationsServiceImpl.LOGGER);
            }
            try {
                LinkStringResponse deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, LinkStringResponse.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<NestedLinkResponse> nestedLink(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/payload/pageable/server-driven-pagination/nested-link");
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, ServerDrivenPaginationsServiceImpl.LOGGER);
            }
            try {
                NestedLinkResponse deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, NestedLinkResponse.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<LinkResponse> linkNext(String nextLink, String endpoint, String accept,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(nextLink);
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, ServerDrivenPaginationsServiceImpl.LOGGER);
            }
            try {
                LinkResponse deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, LinkResponse.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<LinkStringResponse> linkStringNext(String nextLink, String endpoint, String accept,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(nextLink);
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, ServerDrivenPaginationsServiceImpl.LOGGER);
            }
            try {
                LinkStringResponse deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, LinkStringResponse.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<NestedLinkResponse> nestedLinkNext(String nextLink, String endpoint, String accept,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(nextLink);
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, ServerDrivenPaginationsServiceImpl.LOGGER);
            }
            try {
                NestedLinkResponse deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, NestedLinkResponse.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The link operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> linkSinglePage() {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.ServerDrivenPagination.link",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<LinkResponse> res = service.link(this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, res.getValue().getNext() != null ? res.getValue().getNext() : null,
                    null, null, null);
            });
    }

    /**
     * The link operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> linkSinglePage(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.ServerDrivenPagination.link",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                Response<LinkResponse> res = service.link(this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, res.getValue().getNext() != null ? res.getValue().getNext() : null,
                    null, null, null);
            });
    }

    /**
     * The link operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> link(RequestContext requestContext) {
        RequestContext requestContextForNextPage = requestContext != null ? requestContext : RequestContext.none();
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "link")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "link")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "link")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "continuationToken")
                    .addKeyValue("methodName", "link")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            return linkSinglePage(requestContext);
        }, (pagingOptions, nextLink) -> linkNextSinglePage(nextLink, requestContextForNextPage));
    }

    /**
     * The linkString operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> linkStringSinglePage() {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.ServerDrivenPagination.linkString",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<LinkStringResponse> res
                    = service.linkString(this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, res.getValue().getNext() != null ? res.getValue().getNext() : null,
                    null, null, null);
            });
    }

    /**
     * The linkString operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> linkStringSinglePage(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.ServerDrivenPagination.linkString",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                Response<LinkStringResponse> res
                    = service.linkString(this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, res.getValue().getNext() != null ? res.getValue().getNext() : null,
                    null, null, null);
            });
    }

    /**
     * The linkString operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> linkString(RequestContext requestContext) {
        RequestContext requestContextForNextPage = requestContext != null ? requestContext : RequestContext.none();
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "linkString")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "linkString")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "linkString")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "continuationToken")
                    .addKeyValue("methodName", "linkString")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            return linkStringSinglePage(requestContext);
        }, (pagingOptions, nextLink) -> linkStringNextSinglePage(nextLink, requestContextForNextPage));
    }

    /**
     * The nestedLink operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> nestedLinkSinglePage() {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.ServerDrivenPagination.nestedLink",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<NestedLinkResponse> res
                    = service.nestedLink(this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getNestedItems().getPets(), null,
                    res.getValue().getNestedNext() != null && res.getValue().getNestedNext().getNext() != null
                        ? res.getValue().getNestedNext().getNext()
                        : null,
                    null, null, null);
            });
    }

    /**
     * The nestedLink operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> nestedLinkSinglePage(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.ServerDrivenPagination.nestedLink",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                Response<NestedLinkResponse> res
                    = service.nestedLink(this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getNestedItems().getPets(), null,
                    res.getValue().getNestedNext() != null && res.getValue().getNestedNext().getNext() != null
                        ? res.getValue().getNestedNext().getNext()
                        : null,
                    null, null, null);
            });
    }

    /**
     * The nestedLink operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> nestedLink(RequestContext requestContext) {
        RequestContext requestContextForNextPage = requestContext != null ? requestContext : RequestContext.none();
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "nestedLink")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "nestedLink")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "nestedLink")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "continuationToken")
                    .addKeyValue("methodName", "nestedLink")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            return nestedLinkSinglePage(requestContext);
        }, (pagingOptions, nextLink) -> nestedLinkNextSinglePage(nextLink, requestContextForNextPage));
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
    public PagedResponse<Pet> linkNextSinglePage(String nextLink) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.ServerDrivenPagination.link",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<LinkResponse> res
                    = service.linkNext(nextLink, this.client.getEndpoint(), accept, updatedContext);
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
    public PagedResponse<Pet> linkNextSinglePage(String nextLink, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.ServerDrivenPagination.link",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                Response<LinkResponse> res
                    = service.linkNext(nextLink, this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, res.getValue().getNext() != null ? res.getValue().getNext() : null,
                    null, null, null);
            });
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
    public PagedResponse<Pet> linkStringNextSinglePage(String nextLink) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.ServerDrivenPagination.linkString",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<LinkStringResponse> res
                    = service.linkStringNext(nextLink, this.client.getEndpoint(), accept, updatedContext);
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
    public PagedResponse<Pet> linkStringNextSinglePage(String nextLink, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.ServerDrivenPagination.linkString",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                Response<LinkStringResponse> res
                    = service.linkStringNext(nextLink, this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, res.getValue().getNext() != null ? res.getValue().getNext() : null,
                    null, null, null);
            });
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
    public PagedResponse<Pet> nestedLinkNextSinglePage(String nextLink) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.ServerDrivenPagination.nestedLink",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<NestedLinkResponse> res
                    = service.nestedLinkNext(nextLink, this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getNestedItems().getPets(), null,
                    res.getValue().getNestedNext() != null && res.getValue().getNestedNext().getNext() != null
                        ? res.getValue().getNestedNext().getNext()
                        : null,
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
    public PagedResponse<Pet> nestedLinkNextSinglePage(String nextLink, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.ServerDrivenPagination.nestedLink",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                Response<NestedLinkResponse> res
                    = service.nestedLinkNext(nextLink, this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getNestedItems().getPets(), null,
                    res.getValue().getNestedNext() != null && res.getValue().getNestedNext().getNext() != null
                        ? res.getValue().getNestedNext().getNext()
                        : null,
                    null, null, null);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ServerDrivenPaginationsImpl.class);
}
