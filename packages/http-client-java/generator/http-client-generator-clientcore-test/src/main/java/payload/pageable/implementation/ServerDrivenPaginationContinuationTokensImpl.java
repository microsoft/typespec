package payload.pageable.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.paging.PagedIterable;
import io.clientcore.core.http.paging.PagedResponse;
import io.clientcore.core.http.pipeline.HttpPipeline;
import java.lang.reflect.InvocationTargetException;
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
        static ServerDrivenPaginationContinuationTokensService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class
                    .forName("payload.pageable.implementation.ServerDrivenPaginationContinuationTokensServiceImpl");
                return (ServerDrivenPaginationContinuationTokensService) clazz
                    .getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/server-driven-pagination/continuationtoken/request-query-response-body",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<RequestQueryResponseBodyResponse> requestQueryResponseBody(@HostParam("endpoint") String endpoint,
            @QueryParam("token") String token, @HeaderParam("foo") String foo, @QueryParam("bar") String bar,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/server-driven-pagination/continuationtoken/request-header-response-body",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<RequestHeaderResponseBodyResponse> requestHeaderResponseBody(@HostParam("endpoint") String endpoint,
            @HeaderParam("token") String token, @HeaderParam("foo") String foo, @QueryParam("bar") String bar,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/server-driven-pagination/continuationtoken/request-query-response-header",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<RequestQueryResponseHeaderResponse> requestQueryResponseHeader(@HostParam("endpoint") String endpoint,
            @QueryParam("token") String token, @HeaderParam("foo") String foo, @QueryParam("bar") String bar,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/server-driven-pagination/continuationtoken/request-header-response-header",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<RequestHeaderResponseHeaderResponse> requestHeaderResponseHeader(
            @HostParam("endpoint") String endpoint, @HeaderParam("token") String token, @HeaderParam("foo") String foo,
            @QueryParam("bar") String bar, @HeaderParam("Accept") String accept, RequestContext requestContext);
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestQueryResponseBodySinglePage(String token, String foo, String bar) {
        final String accept = "application/json";
        Response<RequestQueryResponseBodyResponse> res = service.requestQueryResponseBody(this.client.getEndpoint(),
            token, foo, bar, accept, RequestContext.none());
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getValue().getPets(),
            res.getValue().getNextToken(), null, null, null, null);
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestQueryResponseBodySinglePage(String token, String foo, String bar,
        RequestContext requestContext) {
        final String accept = "application/json";
        Response<RequestQueryResponseBodyResponse> res
            = service.requestQueryResponseBody(this.client.getEndpoint(), token, foo, bar, accept, requestContext);
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getValue().getPets(),
            res.getValue().getNextToken(), null, null, null, null);
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody(String token, String foo, String bar) {
        return new PagedIterable<>((pagingOptions) -> requestQueryResponseBodySinglePage(token, foo, bar));
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody() {
        final String token = null;
        final String foo = null;
        final String bar = null;
        return new PagedIterable<>((pagingOptions) -> requestQueryResponseBodySinglePage(token, foo, bar));
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody(String token, String foo, String bar,
        RequestContext requestContext) {
        return new PagedIterable<>(
            (pagingOptions) -> requestQueryResponseBodySinglePage(token, foo, bar, requestContext));
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestHeaderResponseBodySinglePage(String token, String foo, String bar) {
        final String accept = "application/json";
        Response<RequestHeaderResponseBodyResponse> res = service.requestHeaderResponseBody(this.client.getEndpoint(),
            token, foo, bar, accept, RequestContext.none());
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getValue().getPets(),
            res.getValue().getNextToken(), null, null, null, null);
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestHeaderResponseBodySinglePage(String token, String foo, String bar,
        RequestContext requestContext) {
        final String accept = "application/json";
        Response<RequestHeaderResponseBodyResponse> res
            = service.requestHeaderResponseBody(this.client.getEndpoint(), token, foo, bar, accept, requestContext);
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getValue().getPets(),
            res.getValue().getNextToken(), null, null, null, null);
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody(String token, String foo, String bar) {
        return new PagedIterable<>((pagingOptions) -> requestHeaderResponseBodySinglePage(token, foo, bar));
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody() {
        final String token = null;
        final String foo = null;
        final String bar = null;
        return new PagedIterable<>((pagingOptions) -> requestHeaderResponseBodySinglePage(token, foo, bar));
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody(String token, String foo, String bar,
        RequestContext requestContext) {
        return new PagedIterable<>(
            (pagingOptions) -> requestHeaderResponseBodySinglePage(token, foo, bar, requestContext));
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestQueryResponseHeaderSinglePage(String token, String foo, String bar) {
        final String accept = "application/json";
        Response<RequestQueryResponseHeaderResponse> res = service.requestQueryResponseHeader(this.client.getEndpoint(),
            token, foo, bar, accept, RequestContext.none());
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getValue().getPets(),
            res.getHeaders().getValue(HttpHeaderName.fromString("next-token")), null, null, null, null);
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestQueryResponseHeaderSinglePage(String token, String foo, String bar,
        RequestContext requestContext) {
        final String accept = "application/json";
        Response<RequestQueryResponseHeaderResponse> res
            = service.requestQueryResponseHeader(this.client.getEndpoint(), token, foo, bar, accept, requestContext);
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getValue().getPets(),
            res.getHeaders().getValue(HttpHeaderName.fromString("next-token")), null, null, null, null);
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader(String token, String foo, String bar) {
        return new PagedIterable<>((pagingOptions) -> requestQueryResponseHeaderSinglePage(token, foo, bar));
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader() {
        final String token = null;
        final String foo = null;
        final String bar = null;
        return new PagedIterable<>((pagingOptions) -> requestQueryResponseHeaderSinglePage(token, foo, bar));
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader(String token, String foo, String bar,
        RequestContext requestContext) {
        return new PagedIterable<>(
            (pagingOptions) -> requestQueryResponseHeaderSinglePage(token, foo, bar, requestContext));
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestHeaderResponseHeaderSinglePage(String token, String foo, String bar) {
        final String accept = "application/json";
        Response<RequestHeaderResponseHeaderResponse> res = service
            .requestHeaderResponseHeader(this.client.getEndpoint(), token, foo, bar, accept, RequestContext.none());
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getValue().getPets(),
            res.getHeaders().getValue(HttpHeaderName.fromString("next-token")), null, null, null, null);
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> requestHeaderResponseHeaderSinglePage(String token, String foo, String bar,
        RequestContext requestContext) {
        final String accept = "application/json";
        Response<RequestHeaderResponseHeaderResponse> res
            = service.requestHeaderResponseHeader(this.client.getEndpoint(), token, foo, bar, accept, requestContext);
        return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(), res.getValue().getPets(),
            res.getHeaders().getValue(HttpHeaderName.fromString("next-token")), null, null, null, null);
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader(String token, String foo, String bar) {
        return new PagedIterable<>((pagingOptions) -> requestHeaderResponseHeaderSinglePage(token, foo, bar));
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader() {
        final String token = null;
        final String foo = null;
        final String bar = null;
        return new PagedIterable<>((pagingOptions) -> requestHeaderResponseHeaderSinglePage(token, foo, bar));
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader(String token, String foo, String bar,
        RequestContext requestContext) {
        return new PagedIterable<>(
            (pagingOptions) -> requestHeaderResponseHeaderSinglePage(token, foo, bar, requestContext));
    }
}
