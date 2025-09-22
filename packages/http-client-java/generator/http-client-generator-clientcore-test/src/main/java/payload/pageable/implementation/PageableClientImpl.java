package payload.pageable.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
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

/**
 * Initializes a new instance of the PageableClient type.
 */
public final class PageableClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PageableClientService service;

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
     * The ServerDrivenPaginationsImpl object to access its operations.
     */
    private final ServerDrivenPaginationsImpl serverDrivenPaginations;

    /**
     * Gets the ServerDrivenPaginationsImpl object to access its operations.
     * 
     * @return the ServerDrivenPaginationsImpl object.
     */
    public ServerDrivenPaginationsImpl getServerDrivenPaginations() {
        return this.serverDrivenPaginations;
    }

    /**
     * The ServerDrivenPaginationContinuationTokensImpl object to access its operations.
     */
    private final ServerDrivenPaginationContinuationTokensImpl serverDrivenPaginationContinuationTokens;

    /**
     * Gets the ServerDrivenPaginationContinuationTokensImpl object to access its operations.
     * 
     * @return the ServerDrivenPaginationContinuationTokensImpl object.
     */
    public ServerDrivenPaginationContinuationTokensImpl getServerDrivenPaginationContinuationTokens() {
        return this.serverDrivenPaginationContinuationTokens;
    }

    /**
     * Initializes an instance of PageableClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public PageableClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.serverDrivenPaginations = new ServerDrivenPaginationsImpl(this);
        this.serverDrivenPaginationContinuationTokens = new ServerDrivenPaginationContinuationTokensImpl(this);
        this.service = PageableClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for PageableClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "PageableClient", host = "{endpoint}")
    public interface PageableClientService {
        static PageableClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("payload.pageable.implementation.PageableClientServiceImpl");
                return (PageableClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/simple",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ListWithoutContinuationResponse> listWithoutContinuation(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);
    }

    /**
     * The listWithoutContinuation operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> listWithoutContinuationSinglePage() {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.listWithoutContinuation",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<ListWithoutContinuationResponse> res
                    = service.listWithoutContinuation(this.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, null, null, null, null);
            });
    }

    /**
     * The listWithoutContinuation operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> listWithoutContinuationSinglePage(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.listWithoutContinuation", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                Response<ListWithoutContinuationResponse> res
                    = service.listWithoutContinuation(this.getEndpoint(), accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, null, null, null, null);
            });
    }

    /**
     * The listWithoutContinuation operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> listWithoutContinuation(RequestContext requestContext) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "listWithoutContinuation")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "listWithoutContinuation")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "listWithoutContinuation")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "continuationToken")
                    .addKeyValue("methodName", "listWithoutContinuation")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            return listWithoutContinuationSinglePage(requestContext);
        });
    }

    private static final ClientLogger LOGGER = new ClientLogger(PageableClientImpl.class);
}
