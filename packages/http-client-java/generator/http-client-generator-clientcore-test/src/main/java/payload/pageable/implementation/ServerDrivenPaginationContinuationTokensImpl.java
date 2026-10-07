package payload.pageable.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.paging.PagedIterable;
import io.clientcore.core.http.paging.PagedResponse;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import payload.pageable.Pet;
import payload.pageable.serverdrivenpagination.continuationtoken.implementation.RequestHeaderNestedResponseBodyResponse;
import payload.pageable.serverdrivenpagination.continuationtoken.implementation.RequestHeaderResponseBodyResponse;
import payload.pageable.serverdrivenpagination.continuationtoken.implementation.RequestQueryNestedResponseBodyResponse;
import payload.pageable.serverdrivenpagination.continuationtoken.implementation.RequestQueryResponseBodyResponse;

/**
 * An instance of this class provides access to all the operations defined in ServerDrivenPaginationContinuationTokens.
 */
public final class ServerDrivenPaginationContinuationTokensImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ServerDrivenPaginationContinuationTokensService service;

    /**
     * The service client containing this operation class.
     */
    private final PageableClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ServerDrivenPaginationContinuationTokensImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ServerDrivenPaginationContinuationTokensImpl(PageableClientImpl client) {
        this.service = ServerDrivenPaginationContinuationTokensService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ServerDrivenPaginationContinuationTokensService {
        static ServerDrivenPaginationContinuationTokensService
            getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new ServerDrivenPaginationContinuationTokensServiceImpl(pipeline);
        }

        Response<RequestQueryResponseBodyResponse> requestQueryResponseBody(String endpoint, String token, String foo,
            String bar, String accept, RequestContext requestContext);

        Response<RequestHeaderResponseBodyResponse> requestHeaderResponseBody(String endpoint, String token, String foo,
            String bar, String accept, RequestContext requestContext);

        Response<RequestQueryResponseHeaderResponse> requestQueryResponseHeader(String endpoint, String token,
            String foo, String bar, String accept, RequestContext requestContext);

        Response<RequestHeaderResponseHeaderResponse> requestHeaderResponseHeader(String endpoint, String token,
            String foo, String bar, String accept, RequestContext requestContext);

        Response<RequestQueryNestedResponseBodyResponse> requestQueryNestedResponseBody(String endpoint, String token,
            String foo, String bar, String accept, RequestContext requestContext);

        Response<RequestHeaderNestedResponseBodyResponse> requestHeaderNestedResponseBody(String endpoint, String token,
            String foo, String bar, String accept, RequestContext requestContext);
    }

    private static final class ServerDrivenPaginationContinuationTokensServiceImpl
        implements ServerDrivenPaginationContinuationTokensService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(
                ServerDrivenPaginationContinuationTokensServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private ServerDrivenPaginationContinuationTokensServiceImpl(
            io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<RequestQueryResponseBodyResponse> requestQueryResponseBody(String endpoint, String token,
            String foo, String bar, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder.parse(
                endpoint + "/payload/pageable/server-driven-pagination/continuationtoken/request-query-response-body");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "token", true, token, true);
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "bar", true, bar, true);
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (foo != null) {
                httpRequest.getHeaders().set(io.clientcore.core.http.models.HttpHeaderName.fromString("foo"), foo);
            }
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
                    ServerDrivenPaginationContinuationTokensServiceImpl.LOGGER);
            }
            try {
                RequestQueryResponseBodyResponse deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, RequestQueryResponseBodyResponse.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.xmlSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, RequestQueryResponseBodyResponse.class));
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
        public Response<RequestHeaderResponseBodyResponse> requestHeaderResponseBody(String endpoint, String token,
            String foo, String bar, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder.parse(
                endpoint + "/payload/pageable/server-driven-pagination/continuationtoken/request-header-response-body");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "bar", true, bar, true);
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (token != null) {
                httpRequest.getHeaders().set(io.clientcore.core.http.models.HttpHeaderName.fromString("token"), token);
            }
            if (foo != null) {
                httpRequest.getHeaders().set(io.clientcore.core.http.models.HttpHeaderName.fromString("foo"), foo);
            }
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
                    ServerDrivenPaginationContinuationTokensServiceImpl.LOGGER);
            }
            try {
                RequestHeaderResponseBodyResponse deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils
                        .decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                            io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class,
                                RequestHeaderResponseBodyResponse.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils
                        .decodeNetworkResponse(networkResponse.getValue(), this.xmlSerializer,
                            io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class,
                                RequestHeaderResponseBodyResponse.class));
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
        public Response<RequestQueryResponseHeaderResponse> requestQueryResponseHeader(String endpoint, String token,
            String foo, String bar, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder.parse(endpoint
                + "/payload/pageable/server-driven-pagination/continuationtoken/request-query-response-header");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "token", true, token, true);
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "bar", true, bar, true);
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (foo != null) {
                httpRequest.getHeaders().set(io.clientcore.core.http.models.HttpHeaderName.fromString("foo"), foo);
            }
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
                    ServerDrivenPaginationContinuationTokensServiceImpl.LOGGER);
            }
            try {
                RequestQueryResponseHeaderResponse deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils
                        .decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                            io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class,
                                RequestQueryResponseHeaderResponse.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils
                        .decodeNetworkResponse(networkResponse.getValue(), this.xmlSerializer,
                            io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class,
                                RequestQueryResponseHeaderResponse.class));
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
        public Response<RequestHeaderResponseHeaderResponse> requestHeaderResponseHeader(String endpoint, String token,
            String foo, String bar, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder.parse(endpoint
                + "/payload/pageable/server-driven-pagination/continuationtoken/request-header-response-header");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "bar", true, bar, true);
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (token != null) {
                httpRequest.getHeaders().set(io.clientcore.core.http.models.HttpHeaderName.fromString("token"), token);
            }
            if (foo != null) {
                httpRequest.getHeaders().set(io.clientcore.core.http.models.HttpHeaderName.fromString("foo"), foo);
            }
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
                    ServerDrivenPaginationContinuationTokensServiceImpl.LOGGER);
            }
            try {
                RequestHeaderResponseHeaderResponse deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils
                        .decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                            io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class,
                                RequestHeaderResponseHeaderResponse.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils
                        .decodeNetworkResponse(networkResponse.getValue(), this.xmlSerializer,
                            io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class,
                                RequestHeaderResponseHeaderResponse.class));
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
        public Response<RequestQueryNestedResponseBodyResponse> requestQueryNestedResponseBody(String endpoint,
            String token, String foo, String bar, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder.parse(endpoint
                + "/payload/pageable/server-driven-pagination/continuationtoken/request-query-nested-response-body");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "token", true, token, true);
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "bar", true, bar, true);
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (foo != null) {
                httpRequest.getHeaders().set(io.clientcore.core.http.models.HttpHeaderName.fromString("foo"), foo);
            }
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
                    ServerDrivenPaginationContinuationTokensServiceImpl.LOGGER);
            }
            try {
                RequestQueryNestedResponseBodyResponse deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer,
                        io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class,
                            RequestQueryNestedResponseBodyResponse.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer,
                        io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class,
                            RequestQueryNestedResponseBodyResponse.class));
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
        public Response<RequestHeaderNestedResponseBodyResponse> requestHeaderNestedResponseBody(String endpoint,
            String token, String foo, String bar, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder.parse(endpoint
                + "/payload/pageable/server-driven-pagination/continuationtoken/request-header-nested-response-body");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "bar", true, bar, true);
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (token != null) {
                httpRequest.getHeaders().set(io.clientcore.core.http.models.HttpHeaderName.fromString("token"), token);
            }
            if (foo != null) {
                httpRequest.getHeaders().set(io.clientcore.core.http.models.HttpHeaderName.fromString("foo"), foo);
            }
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
                    ServerDrivenPaginationContinuationTokensServiceImpl.LOGGER);
            }
            try {
                RequestHeaderNestedResponseBodyResponse deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer,
                        io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class,
                            RequestHeaderNestedResponseBodyResponse.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer,
                        io.clientcore.core.utils.CoreUtils.createParameterizedType(
                            io.clientcore.core.http.models.Response.class,
                            RequestHeaderNestedResponseBodyResponse.class));
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
     * The requestQueryResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestQueryResponseBodySinglePage(String token, String foo, String bar) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.ContinuationToken.requestQueryResponseBody", RequestContext.none(),
            updatedContext -> {
                final String accept = "application/json";
                Response<RequestQueryResponseBodyResponse> res = service
                    .requestQueryResponseBody(this.client.getEndpoint(), token, foo, bar, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(),
                    res.getValue().getNextToken() != null ? res.getValue().getNextToken() : null, null, null, null,
                    null);
            });
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestQueryResponseBodySinglePage(String token, String foo, String bar,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.ContinuationToken.requestQueryResponseBody", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                Response<RequestQueryResponseBodyResponse> res = service
                    .requestQueryResponseBody(this.client.getEndpoint(), token, foo, bar, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(),
                    res.getValue().getNextToken() != null ? res.getValue().getNextToken() : null, null, null, null,
                    null);
            });
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody(String foo, String bar) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "requestQueryResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "requestQueryResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "requestQueryResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String token = pagingOptions.getContinuationToken();
            return requestQueryResponseBodySinglePage(token, foo, bar);
        });
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody(String foo, String bar, RequestContext requestContext) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "requestQueryResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "requestQueryResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "requestQueryResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String token = pagingOptions.getContinuationToken();
            return requestQueryResponseBodySinglePage(token, foo, bar, requestContext);
        });
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestHeaderResponseBodySinglePage(String token, String foo, String bar) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.ContinuationToken.requestHeaderResponseBody",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<RequestHeaderResponseBodyResponse> res = service
                    .requestHeaderResponseBody(this.client.getEndpoint(), token, foo, bar, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(),
                    res.getValue().getNextToken() != null ? res.getValue().getNextToken() : null, null, null, null,
                    null);
            });
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestHeaderResponseBodySinglePage(String token, String foo, String bar,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.ContinuationToken.requestHeaderResponseBody", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                Response<RequestHeaderResponseBodyResponse> res = service
                    .requestHeaderResponseBody(this.client.getEndpoint(), token, foo, bar, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(),
                    res.getValue().getNextToken() != null ? res.getValue().getNextToken() : null, null, null, null,
                    null);
            });
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody(String foo, String bar) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "requestHeaderResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "requestHeaderResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "requestHeaderResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String token = pagingOptions.getContinuationToken();
            return requestHeaderResponseBodySinglePage(token, foo, bar);
        });
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody(String foo, String bar, RequestContext requestContext) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "requestHeaderResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "requestHeaderResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "requestHeaderResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String token = pagingOptions.getContinuationToken();
            return requestHeaderResponseBodySinglePage(token, foo, bar, requestContext);
        });
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestQueryResponseHeaderSinglePage(String token, String foo, String bar) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.ContinuationToken.requestQueryResponseHeader",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<RequestQueryResponseHeaderResponse> res = service
                    .requestQueryResponseHeader(this.client.getEndpoint(), token, foo, bar, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), res.getHeaders().getValue(HttpHeaderName.fromString("next-token")), null,
                    null, null, null);
            });
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestQueryResponseHeaderSinglePage(String token, String foo, String bar,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.ContinuationToken.requestQueryResponseHeader", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                Response<RequestQueryResponseHeaderResponse> res = service
                    .requestQueryResponseHeader(this.client.getEndpoint(), token, foo, bar, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), res.getHeaders().getValue(HttpHeaderName.fromString("next-token")), null,
                    null, null, null);
            });
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader(String foo, String bar) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "requestQueryResponseHeader")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "requestQueryResponseHeader")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "requestQueryResponseHeader")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String token = pagingOptions.getContinuationToken();
            return requestQueryResponseHeaderSinglePage(token, foo, bar);
        });
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader(String foo, String bar, RequestContext requestContext) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "requestQueryResponseHeader")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "requestQueryResponseHeader")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "requestQueryResponseHeader")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String token = pagingOptions.getContinuationToken();
            return requestQueryResponseHeaderSinglePage(token, foo, bar, requestContext);
        });
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestHeaderResponseHeaderSinglePage(String token, String foo, String bar) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.ContinuationToken.requestHeaderResponseHeader",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<RequestHeaderResponseHeaderResponse> res = service
                    .requestHeaderResponseHeader(this.client.getEndpoint(), token, foo, bar, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), res.getHeaders().getValue(HttpHeaderName.fromString("next-token")), null,
                    null, null, null);
            });
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestHeaderResponseHeaderSinglePage(String token, String foo, String bar,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.ContinuationToken.requestHeaderResponseHeader", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                Response<RequestHeaderResponseHeaderResponse> res = service
                    .requestHeaderResponseHeader(this.client.getEndpoint(), token, foo, bar, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), res.getHeaders().getValue(HttpHeaderName.fromString("next-token")), null,
                    null, null, null);
            });
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader(String foo, String bar) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "requestHeaderResponseHeader")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "requestHeaderResponseHeader")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "requestHeaderResponseHeader")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String token = pagingOptions.getContinuationToken();
            return requestHeaderResponseHeaderSinglePage(token, foo, bar);
        });
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader(String foo, String bar, RequestContext requestContext) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "requestHeaderResponseHeader")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "requestHeaderResponseHeader")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "requestHeaderResponseHeader")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String token = pagingOptions.getContinuationToken();
            return requestHeaderResponseHeaderSinglePage(token, foo, bar, requestContext);
        });
    }

    /**
     * The requestQueryNestedResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestQueryNestedResponseBodySinglePage(String token, String foo, String bar) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.ContinuationToken.requestQueryNestedResponseBody",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<RequestQueryNestedResponseBodyResponse> res = service
                    .requestQueryNestedResponseBody(this.client.getEndpoint(), token, foo, bar, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getNestedItems().getPets(),
                    res.getValue().getNestedNext() != null && res.getValue().getNestedNext().getNextToken() != null
                        ? res.getValue().getNestedNext().getNextToken()
                        : null,
                    null, null, null, null);
            });
    }

    /**
     * The requestQueryNestedResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestQueryNestedResponseBodySinglePage(String token, String foo, String bar,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.ContinuationToken.requestQueryNestedResponseBody", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                Response<RequestQueryNestedResponseBodyResponse> res = service
                    .requestQueryNestedResponseBody(this.client.getEndpoint(), token, foo, bar, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getNestedItems().getPets(),
                    res.getValue().getNestedNext() != null && res.getValue().getNestedNext().getNextToken() != null
                        ? res.getValue().getNestedNext().getNextToken()
                        : null,
                    null, null, null, null);
            });
    }

    /**
     * The requestQueryNestedResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryNestedResponseBody(String foo, String bar) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "requestQueryNestedResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "requestQueryNestedResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "requestQueryNestedResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String token = pagingOptions.getContinuationToken();
            return requestQueryNestedResponseBodySinglePage(token, foo, bar);
        });
    }

    /**
     * The requestQueryNestedResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryNestedResponseBody(String foo, String bar, RequestContext requestContext) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "requestQueryNestedResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "requestQueryNestedResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "requestQueryNestedResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String token = pagingOptions.getContinuationToken();
            return requestQueryNestedResponseBodySinglePage(token, foo, bar, requestContext);
        });
    }

    /**
     * The requestHeaderNestedResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestHeaderNestedResponseBodySinglePage(String token, String foo, String bar) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.ContinuationToken.requestHeaderNestedResponseBody",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<RequestHeaderNestedResponseBodyResponse> res = service.requestHeaderNestedResponseBody(
                    this.client.getEndpoint(), token, foo, bar, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getNestedItems().getPets(),
                    res.getValue().getNestedNext() != null && res.getValue().getNestedNext().getNextToken() != null
                        ? res.getValue().getNestedNext().getNextToken()
                        : null,
                    null, null, null, null);
            });
    }

    /**
     * The requestHeaderNestedResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestHeaderNestedResponseBodySinglePage(String token, String foo, String bar,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Payload.Pageable.ServerDrivenPagination.ContinuationToken.requestHeaderNestedResponseBody", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                Response<RequestHeaderNestedResponseBodyResponse> res = service.requestHeaderNestedResponseBody(
                    this.client.getEndpoint(), token, foo, bar, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getNestedItems().getPets(),
                    res.getValue().getNestedNext() != null && res.getValue().getNestedNext().getNextToken() != null
                        ? res.getValue().getNestedNext().getNextToken()
                        : null,
                    null, null, null, null);
            });
    }

    /**
     * The requestHeaderNestedResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderNestedResponseBody(String foo, String bar) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "requestHeaderNestedResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "requestHeaderNestedResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "requestHeaderNestedResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String token = pagingOptions.getContinuationToken();
            return requestHeaderNestedResponseBodySinglePage(token, foo, bar);
        });
    }

    /**
     * The requestHeaderNestedResponseBody operation.
     * 
     * @param token The token parameter.
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderNestedResponseBody(String foo, String bar, RequestContext requestContext) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "requestHeaderNestedResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "requestHeaderNestedResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "requestHeaderNestedResponseBody")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String token = pagingOptions.getContinuationToken();
            return requestHeaderNestedResponseBodySinglePage(token, foo, bar, requestContext);
        });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ServerDrivenPaginationContinuationTokensImpl.class);
}
