package payload.pageable.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.PagedIterable;
import io.clientcore.core.http.models.PagedResponse;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.utils.Context;
import payload.pageable.Pet;
import payload.pageable.serverdrivenpagination.implementation.LinkResponse;

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
     * Initializes an instance of ServerDrivenPaginationsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ServerDrivenPaginationsImpl(PageableClientImpl client) {
        this.service = RestProxy.create(ServerDrivenPaginationsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for PageableClientServerDrivenPaginations to be used by the proxy service
     * to perform REST calls.
     */
    @ServiceInterface(name = "PageableClientServer", host = "{endpoint}")
    public interface ServerDrivenPaginationsService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/server-driven-pagination/link",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<LinkResponse> linkSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.GET, path = "{nextLink}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<LinkResponse> linkNextSync(@PathParam(value = "nextLink", encoded = true) String nextLink,
            @HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);
    }

    /**
     * The link operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     pets (Required): [
     *          (Required){
     *             id: String (Required)
     *             name: String (Required)
     *         }
     *     ]
     *     next: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    private PagedResponse<Pet> linkSinglePage(RequestOptions requestOptions) {
        final String accept = "application/json";
        Response<LinkResponse> res = service.linkSync(this.client.getEndpoint(), accept, requestOptions);
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getBody(),
            res.getValue().getPets(), null, res.getValue().getNext(), null, null, null);
    }

    /**
     * The link operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     pets (Required): [
     *          (Required){
     *             id: String (Required)
     *             name: String (Required)
     *         }
     *     ]
     *     next: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public PagedIterable<Pet> link(RequestOptions requestOptions) {
        RequestOptions requestOptionsForNextPage = new RequestOptions();
        requestOptionsForNextPage.setContext(requestOptions != null && requestOptions.getContext() != null
            ? requestOptions.getContext()
            : Context.none());
        return new PagedIterable<>(pagingOptions -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.logThrowableAsError(
                    new IllegalArgumentException("'offset' in PagingOptions is not supported in API 'link'."));
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.logThrowableAsError(
                    new IllegalArgumentException("'pageSize' in PagingOptions is not supported in API 'link'."));
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.logThrowableAsError(
                    new IllegalArgumentException("'pageIndex' in PagingOptions is not supported in API 'link'."));
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'continuationToken' in PagingOptions is not supported in API 'link'."));
            }
            return linkSinglePage(requestOptions);
        }, (pagingOptions, nextLink) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.logThrowableAsError(
                    new IllegalArgumentException("'offset' in PagingOptions is not supported in API 'link'."));
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.logThrowableAsError(
                    new IllegalArgumentException("'pageSize' in PagingOptions is not supported in API 'link'."));
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.logThrowableAsError(
                    new IllegalArgumentException("'pageIndex' in PagingOptions is not supported in API 'link'."));
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'continuationToken' in PagingOptions is not supported in API 'link'."));
            }
            return linkNextSinglePage(nextLink, requestOptionsForNextPage);
        });
    }

    /**
     * Get the next page of items.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     pets (Required): [
     *          (Required){
     *             id: String (Required)
     *             name: String (Required)
     *         }
     *     ]
     *     next: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param nextLink The URL to get the next list of items.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    private PagedResponse<Pet> linkNextSinglePage(String nextLink, RequestOptions requestOptions) {
        final String accept = "application/json";
        Response<LinkResponse> res = service.linkNextSync(nextLink, this.client.getEndpoint(), accept, requestOptions);
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getBody(),
            res.getValue().getPets(), null, res.getValue().getNext(), null, null, null);
    }

    private static final ClientLogger LOGGER = new ClientLogger(ServerDrivenPaginationsImpl.class);
}
