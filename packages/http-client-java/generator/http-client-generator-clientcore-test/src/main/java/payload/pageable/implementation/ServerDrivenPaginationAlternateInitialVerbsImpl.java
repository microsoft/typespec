package payload.pageable.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.BodyParam;
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

    /**
     * The interface defining all the services for PageableClientServerDrivenPaginationAlternateInitialVerbs to be used
     * by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "PageableClientServerDrivenPaginationAlternateInitialVerbs", host = "{endpoint}")
    public interface ServerDrivenPaginationAlternateInitialVerbsService {
        static ServerDrivenPaginationAlternateInitialVerbsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class
                    .forName("payload.pageable.implementation.ServerDrivenPaginationAlternateInitialVerbsServiceImpl");
                return (ServerDrivenPaginationAlternateInitialVerbsService) clazz
                    .getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/payload/pageable/server-driven-pagination/link/initial-post",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<PostResponse> post(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Filter body, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.GET, path = "{nextLink}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<PostResponse> postNext(@PathParam(value = "nextLink", encoded = true) String nextLink,
            @HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);
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
