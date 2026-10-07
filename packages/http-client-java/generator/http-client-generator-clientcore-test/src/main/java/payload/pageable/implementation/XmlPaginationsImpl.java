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
import payload.pageable.XmlPet;

/**
 * An instance of this class provides access to all the operations defined in XmlPaginations.
 */
public final class XmlPaginationsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final XmlPaginationsService service;

    /**
     * The service client containing this operation class.
     */
    private final PageableClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of XmlPaginationsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    XmlPaginationsImpl(PageableClientImpl client) {
        this.service = XmlPaginationsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface XmlPaginationsService {
        static XmlPaginationsService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new XmlPaginationsServiceImpl(pipeline);
        }

        Response<XmlPetListResult> listWithContinuation(String endpoint, String marker, String accept,
            RequestContext requestContext);

        Response<XmlPetListResultWithNextLink> listWithNextLink(String endpoint, String accept,
            RequestContext requestContext);

        Response<XmlPetListResultWithNextLink> listWithNextLinkNext(String nextLink, String endpoint, String accept,
            RequestContext requestContext);
    }

    private static final class XmlPaginationsServiceImpl implements XmlPaginationsService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(XmlPaginationsServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private XmlPaginationsServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<XmlPetListResult> listWithContinuation(String endpoint, String marker, String accept,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/payload/pageable/xml/list-with-continuation");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "marker", true, marker, true);
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
                    this.jsonSerializer, this.xmlSerializer, null, null, XmlPaginationsServiceImpl.LOGGER);
            }
            try {
                XmlPetListResult deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, XmlPetListResult.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.xmlSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, XmlPetListResult.class));
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
        public Response<XmlPetListResultWithNextLink> listWithNextLink(String endpoint, String accept,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/payload/pageable/xml/list-with-next-link");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, XmlPaginationsServiceImpl.LOGGER);
            }
            try {
                XmlPetListResultWithNextLink deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, XmlPetListResultWithNextLink.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.xmlSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, XmlPetListResultWithNextLink.class));
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
        public Response<XmlPetListResultWithNextLink> listWithNextLinkNext(String nextLink, String endpoint,
            String accept, RequestContext requestContext) {
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
                    this.jsonSerializer, this.xmlSerializer, null, null, XmlPaginationsServiceImpl.LOGGER);
            }
            try {
                XmlPetListResultWithNextLink deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.jsonSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, XmlPetListResultWithNextLink.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                            this.xmlSerializer, io.clientcore.core.utils.CoreUtils.createParameterizedType(
                                io.clientcore.core.http.models.Response.class, XmlPetListResultWithNextLink.class));
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
     * The listWithContinuation operation.
     * 
     * @param marker The marker parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the XML response for listing pets along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<XmlPet> listWithContinuationSinglePage(String marker) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.XmlPagination.listWithContinuation",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/xml";
                Response<XmlPetListResult> res
                    = service.listWithContinuation(this.client.getEndpoint(), marker, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(),
                    res.getValue().getNextMarker() != null ? res.getValue().getNextMarker() : null, null, null, null,
                    null);
            });
    }

    /**
     * The listWithContinuation operation.
     * 
     * @param marker The marker parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the XML response for listing pets along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<XmlPet> listWithContinuationSinglePage(String marker, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.XmlPagination.listWithContinuation",
            requestContext, updatedContext -> {
                final String accept = "application/xml";
                Response<XmlPetListResult> res
                    = service.listWithContinuation(this.client.getEndpoint(), marker, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(),
                    res.getValue().getNextMarker() != null ? res.getValue().getNextMarker() : null, null, null, null,
                    null);
            });
    }

    /**
     * The listWithContinuation operation.
     * 
     * @param marker The marker parameter.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the XML response for listing pets as paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<XmlPet> listWithContinuation() {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "listWithContinuation")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "listWithContinuation")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "listWithContinuation")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String marker = pagingOptions.getContinuationToken();
            return listWithContinuationSinglePage(marker);
        });
    }

    /**
     * The listWithContinuation operation.
     * 
     * @param marker The marker parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the XML response for listing pets as paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<XmlPet> listWithContinuation(RequestContext requestContext) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "listWithContinuation")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "listWithContinuation")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "listWithContinuation")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            String marker = pagingOptions.getContinuationToken();
            return listWithContinuationSinglePage(marker, requestContext);
        });
    }

    /**
     * The listWithNextLink operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the XML response for listing pets with next link along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<XmlPet> listWithNextLinkSinglePage() {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.XmlPagination.listWithNextLink",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/xml";
                Response<XmlPetListResultWithNextLink> res
                    = service.listWithNextLink(this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null,
                    res.getValue().getNextLink() != null ? res.getValue().getNextLink() : null, null, null, null);
            });
    }

    /**
     * The listWithNextLink operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the XML response for listing pets with next link along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<XmlPet> listWithNextLinkSinglePage(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.XmlPagination.listWithNextLink",
            requestContext, updatedContext -> {
                final String accept = "application/xml";
                Response<XmlPetListResultWithNextLink> res
                    = service.listWithNextLink(this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null,
                    res.getValue().getNextLink() != null ? res.getValue().getNextLink() : null, null, null, null);
            });
    }

    /**
     * The listWithNextLink operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the XML response for listing pets with next link as paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<XmlPet> listWithNextLink(RequestContext requestContext) {
        RequestContext requestContextForNextPage = requestContext != null ? requestContext : RequestContext.none();
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "listWithNextLink")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "listWithNextLink")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "listWithNextLink")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "continuationToken")
                    .addKeyValue("methodName", "listWithNextLink")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            return listWithNextLinkSinglePage(requestContext);
        }, (pagingOptions, nextLink) -> listWithNextLinkNextSinglePage(nextLink, requestContextForNextPage));
    }

    /**
     * Get the next page of items.
     * 
     * @param nextLink The URL to get the next list of items.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the XML response for listing pets with next link along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<XmlPet> listWithNextLinkNextSinglePage(String nextLink) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.XmlPagination.listWithNextLink",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/xml";
                Response<XmlPetListResultWithNextLink> res
                    = service.listWithNextLinkNext(nextLink, this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null,
                    res.getValue().getNextLink() != null ? res.getValue().getNextLink() : null, null, null, null);
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
     * @return the XML response for listing pets with next link along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<XmlPet> listWithNextLinkNextSinglePage(String nextLink, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.XmlPagination.listWithNextLink",
            requestContext, updatedContext -> {
                final String accept = "application/xml";
                Response<XmlPetListResultWithNextLink> res
                    = service.listWithNextLinkNext(nextLink, this.client.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null,
                    res.getValue().getNextLink() != null ? res.getValue().getNextLink() : null, null, null, null);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(XmlPaginationsImpl.class);
}
