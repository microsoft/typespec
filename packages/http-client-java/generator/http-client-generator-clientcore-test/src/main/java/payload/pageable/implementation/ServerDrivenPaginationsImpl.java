package payload.pageable.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.paging.PagedIterable;
import io.clientcore.core.http.paging.PagedResponse;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import java.lang.reflect.InvocationTargetException;
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

    /**
     * The interface defining all the services for PageableClientServerDrivenPaginations to be used by the proxy service
     * to perform REST calls.
     */
    @ServiceInterface(name = "PageableClientServerDrivenPaginations", host = "{endpoint}")
    public interface ServerDrivenPaginationsService {
        static ServerDrivenPaginationsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("payload.pageable.implementation.ServerDrivenPaginationsServiceImpl");
                return (ServerDrivenPaginationsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/server-driven-pagination/link",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<LinkResponse> link(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/server-driven-pagination/link-string",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<LinkStringResponse> linkString(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/server-driven-pagination/nested-link",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<NestedLinkResponse> nestedLink(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.GET, path = "{nextLink}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<LinkResponse> linkNext(@PathParam(value = "nextLink", encoded = true) String nextLink,
            @HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.GET, path = "{nextLink}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<LinkStringResponse> linkStringNext(@PathParam(value = "nextLink", encoded = true) String nextLink,
            @HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.GET, path = "{nextLink}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<NestedLinkResponse> nestedLinkNext(@PathParam(value = "nextLink", encoded = true) String nextLink,
            @HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);
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
