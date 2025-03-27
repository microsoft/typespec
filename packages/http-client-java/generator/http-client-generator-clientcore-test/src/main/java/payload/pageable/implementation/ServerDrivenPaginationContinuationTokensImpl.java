package payload.pageable.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.PagedIterable;
import io.clientcore.core.http.models.PagedResponse;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.utils.UriBuilder;
import payload.pageable.Pet;
import payload.pageable.serverdrivenpagination.continuationtoken.implementation.RequestHeaderResponseBodyResponse;
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
     * Initializes an instance of ServerDrivenPaginationContinuationTokensImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ServerDrivenPaginationContinuationTokensImpl(PageableClientImpl client) {
        this.service
            = RestProxy.create(ServerDrivenPaginationContinuationTokensService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for PageableClientServerDrivenPaginationContinuationTokens to be used by
     * the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "PageableClientServer", host = "{endpoint}")
    public interface ServerDrivenPaginationContinuationTokensService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/server-driven-pagination/continuationtoken/request-query-response-body",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<RequestQueryResponseBodyResponse> requestQueryResponseBodySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/server-driven-pagination/continuationtoken/request-header-response-body",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<RequestHeaderResponseBodyResponse> requestHeaderResponseBodySync(
            @HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/server-driven-pagination/continuationtoken/request-query-response-header",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<RequestQueryResponseHeaderResponse> requestQueryResponseHeaderSync(
            @HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/server-driven-pagination/continuationtoken/request-header-response-header",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<RequestHeaderResponseHeaderResponse> requestHeaderResponseHeaderSync(
            @HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);
    }

    /**
     * The requestQueryResponseBody operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>token</td><td>String</td><td>No</td><td>The token parameter</td></tr>
     * <tr><td>bar</td><td>String</td><td>No</td><td>The bar parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>foo</td><td>String</td><td>No</td><td>The foo parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
     *     nextToken: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    private PagedResponse<Pet> requestQueryResponseBodySinglePage(RequestOptions requestOptions) {
        final String accept = "application/json";
        Response<RequestQueryResponseBodyResponse> res
            = service.requestQueryResponseBodySync(this.client.getEndpoint(), accept, requestOptions);
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getBody(),
            res.getValue().getPets(), res.getValue().getNextToken(), null, null, null, null);
    }

    /**
     * The requestQueryResponseBody operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>token</td><td>String</td><td>No</td><td>The token parameter</td></tr>
     * <tr><td>bar</td><td>String</td><td>No</td><td>The bar parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>foo</td><td>String</td><td>No</td><td>The foo parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
     *     nextToken: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public PagedIterable<Pet> requestQueryResponseBody(RequestOptions requestOptions) {
        return new PagedIterable<>(pagingOptions -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'offset' in PagingOptions is not supported in API 'requestQueryResponseBody'."));
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'pageSize' in PagingOptions is not supported in API 'requestQueryResponseBody'."));
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'pageIndex' in PagingOptions is not supported in API 'requestQueryResponseBody'."));
            }
            RequestOptions requestOptionsLocal = requestOptions == null ? new RequestOptions() : requestOptions;
            if (pagingOptions.getContinuationToken() != null) {
                requestOptionsLocal.addRequestCallback(requestLocal -> {
                    UriBuilder urlBuilder = UriBuilder.parse(requestLocal.getUri());
                    urlBuilder.setQueryParameter("token", String.valueOf(pagingOptions.getContinuationToken()));
                    requestLocal.setUri(urlBuilder.toString());
                });
            }
            return requestQueryResponseBodySinglePage(requestOptionsLocal);
        });
    }

    /**
     * The requestHeaderResponseBody operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>bar</td><td>String</td><td>No</td><td>The bar parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>token</td><td>String</td><td>No</td><td>The token parameter</td></tr>
     * <tr><td>foo</td><td>String</td><td>No</td><td>The foo parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
     *     nextToken: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    private PagedResponse<Pet> requestHeaderResponseBodySinglePage(RequestOptions requestOptions) {
        final String accept = "application/json";
        Response<RequestHeaderResponseBodyResponse> res
            = service.requestHeaderResponseBodySync(this.client.getEndpoint(), accept, requestOptions);
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getBody(),
            res.getValue().getPets(), res.getValue().getNextToken(), null, null, null, null);
    }

    /**
     * The requestHeaderResponseBody operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>bar</td><td>String</td><td>No</td><td>The bar parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>token</td><td>String</td><td>No</td><td>The token parameter</td></tr>
     * <tr><td>foo</td><td>String</td><td>No</td><td>The foo parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
     *     nextToken: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public PagedIterable<Pet> requestHeaderResponseBody(RequestOptions requestOptions) {
        return new PagedIterable<>(pagingOptions -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'offset' in PagingOptions is not supported in API 'requestHeaderResponseBody'."));
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'pageSize' in PagingOptions is not supported in API 'requestHeaderResponseBody'."));
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'pageIndex' in PagingOptions is not supported in API 'requestHeaderResponseBody'."));
            }
            RequestOptions requestOptionsLocal = requestOptions == null ? new RequestOptions() : requestOptions;
            if (pagingOptions.getContinuationToken() != null) {
                requestOptionsLocal.setHeader(HttpHeaderName.fromString("token"),
                    String.valueOf(pagingOptions.getContinuationToken()));
            }
            return requestHeaderResponseBodySinglePage(requestOptionsLocal);
        });
    }

    /**
     * The requestQueryResponseHeader operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>token</td><td>String</td><td>No</td><td>The token parameter</td></tr>
     * <tr><td>bar</td><td>String</td><td>No</td><td>The bar parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>foo</td><td>String</td><td>No</td><td>The foo parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    private PagedResponse<Pet> requestQueryResponseHeaderSinglePage(RequestOptions requestOptions) {
        final String accept = "application/json";
        Response<RequestQueryResponseHeaderResponse> res
            = service.requestQueryResponseHeaderSync(this.client.getEndpoint(), accept, requestOptions);
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getBody(),
            res.getValue().getPets(), res.getHeaders().getValue(HttpHeaderName.fromString("next-token")), null, null,
            null, null);
    }

    /**
     * The requestQueryResponseHeader operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>token</td><td>String</td><td>No</td><td>The token parameter</td></tr>
     * <tr><td>bar</td><td>String</td><td>No</td><td>The bar parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>foo</td><td>String</td><td>No</td><td>The foo parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public PagedIterable<Pet> requestQueryResponseHeader(RequestOptions requestOptions) {
        return new PagedIterable<>(pagingOptions -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'offset' in PagingOptions is not supported in API 'requestQueryResponseHeader'."));
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'pageSize' in PagingOptions is not supported in API 'requestQueryResponseHeader'."));
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'pageIndex' in PagingOptions is not supported in API 'requestQueryResponseHeader'."));
            }
            RequestOptions requestOptionsLocal = requestOptions == null ? new RequestOptions() : requestOptions;
            if (pagingOptions.getContinuationToken() != null) {
                requestOptionsLocal.addRequestCallback(requestLocal -> {
                    UriBuilder urlBuilder = UriBuilder.parse(requestLocal.getUri());
                    urlBuilder.setQueryParameter("token", String.valueOf(pagingOptions.getContinuationToken()));
                    requestLocal.setUri(urlBuilder.toString());
                });
            }
            return requestQueryResponseHeaderSinglePage(requestOptionsLocal);
        });
    }

    /**
     * The requestHeaderResponseHeader operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>bar</td><td>String</td><td>No</td><td>The bar parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>token</td><td>String</td><td>No</td><td>The token parameter</td></tr>
     * <tr><td>foo</td><td>String</td><td>No</td><td>The foo parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    private PagedResponse<Pet> requestHeaderResponseHeaderSinglePage(RequestOptions requestOptions) {
        final String accept = "application/json";
        Response<RequestHeaderResponseHeaderResponse> res
            = service.requestHeaderResponseHeaderSync(this.client.getEndpoint(), accept, requestOptions);
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getBody(),
            res.getValue().getPets(), res.getHeaders().getValue(HttpHeaderName.fromString("next-token")), null, null,
            null, null);
    }

    /**
     * The requestHeaderResponseHeader operation.
     * <p><strong>Query Parameters</strong></p>
     * <table border="1">
     * <caption>Query Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>bar</td><td>String</td><td>No</td><td>The bar parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addQueryParam}
     * <p><strong>Header Parameters</strong></p>
     * <table border="1">
     * <caption>Header Parameters</caption>
     * <tr><th>Name</th><th>Type</th><th>Required</th><th>Description</th></tr>
     * <tr><td>token</td><td>String</td><td>No</td><td>The token parameter</td></tr>
     * <tr><td>foo</td><td>String</td><td>No</td><td>The foo parameter</td></tr>
     * </table>
     * You can add these to a request with {@link RequestOptions#addHeader}
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
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public PagedIterable<Pet> requestHeaderResponseHeader(RequestOptions requestOptions) {
        return new PagedIterable<>(pagingOptions -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'offset' in PagingOptions is not supported in API 'requestHeaderResponseHeader'."));
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'pageSize' in PagingOptions is not supported in API 'requestHeaderResponseHeader'."));
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.logThrowableAsError(new IllegalArgumentException(
                    "'pageIndex' in PagingOptions is not supported in API 'requestHeaderResponseHeader'."));
            }
            RequestOptions requestOptionsLocal = requestOptions == null ? new RequestOptions() : requestOptions;
            if (pagingOptions.getContinuationToken() != null) {
                requestOptionsLocal.setHeader(HttpHeaderName.fromString("token"),
                    String.valueOf(pagingOptions.getContinuationToken()));
            }
            return requestHeaderResponseHeaderSinglePage(requestOptionsLocal);
        });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ServerDrivenPaginationContinuationTokensImpl.class);
}
