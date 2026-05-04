package payload.pageable.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
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
import payload.pageable.pagesize.implementation.ListWithPageSizeResponse;
import payload.pageable.pagesize.implementation.ListWithoutContinuationResponse;

/**
 * An instance of this class provides access to all the operations defined in PageSizes.
 */
public final class PageSizesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PageSizesService service;

    /**
     * The service client containing this operation class.
     */
    private final PageableClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of PageSizesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PageSizesImpl(PageableClientImpl client) {
        this.service = PageSizesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for PageableClientPageSizes to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "PageableClientPageSizes", host = "{endpoint}")
    public interface PageSizesService {
        static PageSizesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("payload.pageable.implementation.PageSizesServiceImpl");
                return (PageSizesService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/pagesize/without-continuation",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ListWithoutContinuationResponse> listWithoutContinuation(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/pageable/pagesize/list",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ListWithPageSizeResponse> listWithPageSize(@HostParam("endpoint") String endpoint,
            @QueryParam("pageSize") Integer pageSize, @HeaderParam("Accept") String accept,
            RequestContext requestContext);
    }

    /**
     * The listWithoutContinuation operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> listWithoutContinuationSinglePage() {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.PageSize.listWithoutContinuation",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<ListWithoutContinuationResponse> res
                    = service.listWithoutContinuation(this.client.getEndpoint(), accept, updatedContext);
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
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> listWithoutContinuationSinglePage(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.PageSize.listWithoutContinuation",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                Response<ListWithoutContinuationResponse> res
                    = service.listWithoutContinuation(this.client.getEndpoint(), accept, updatedContext);
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
     * @return the paginated response with {@link PagedIterable}.
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

    /**
     * The listWithPageSize operation.
     * 
     * @param pageSize The pageSize parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> listWithPageSizeSinglePage(Integer pageSize) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.PageSize.listWithPageSize",
            RequestContext.none(), updatedContext -> {
                final String accept = "application/json";
                Response<ListWithPageSizeResponse> res
                    = service.listWithPageSize(this.client.getEndpoint(), pageSize, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, null, null, null, null);
            });
    }

    /**
     * The listWithPageSize operation.
     * 
     * @param pageSize The pageSize parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link PagedResponse}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PagedResponse<Pet> listWithPageSizeSinglePage(Integer pageSize, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Pageable.PageSize.listWithPageSize", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                Response<ListWithPageSizeResponse> res
                    = service.listWithPageSize(this.client.getEndpoint(), pageSize, accept, updatedContext);
                return new PagedResponse<>(res.getRequest(), res.getStatusCode(), res.getHeaders(),
                    res.getValue().getPets(), null, null, null, null, null);
            });
    }

    /**
     * The listWithPageSize operation.
     * 
     * @param pageSize The pageSize parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> listWithPageSize(Integer pageSize) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "listWithPageSize")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "listWithPageSize")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "listWithPageSize")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "continuationToken")
                    .addKeyValue("methodName", "listWithPageSize")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            return listWithPageSizeSinglePage(pageSize);
        });
    }

    /**
     * The listWithPageSize operation.
     * 
     * @param pageSize The pageSize parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> listWithPageSize(Integer pageSize, RequestContext requestContext) {
        return new PagedIterable<>((pagingOptions) -> {
            if (pagingOptions.getOffset() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "offset")
                    .addKeyValue("methodName", "listWithPageSize")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageSize() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageSize")
                    .addKeyValue("methodName", "listWithPageSize")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getPageIndex() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "pageIndex")
                    .addKeyValue("methodName", "listWithPageSize")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            if (pagingOptions.getContinuationToken() != null) {
                throw LOGGER.throwableAtError()
                    .addKeyValue("propertyName", "continuationToken")
                    .addKeyValue("methodName", "listWithPageSize")
                    .log("Not a supported paging option in this API", IllegalArgumentException::new);
            }
            return listWithPageSizeSinglePage(pageSize, requestContext);
        });
    }

    private static final ClientLogger LOGGER = new ClientLogger(PageSizesImpl.class);
}
