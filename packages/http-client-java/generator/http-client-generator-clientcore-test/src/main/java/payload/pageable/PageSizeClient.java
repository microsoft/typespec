package payload.pageable;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.paging.PagedIterable;
import io.clientcore.core.instrumentation.Instrumentation;
import payload.pageable.implementation.PageSizesImpl;

/**
 * Initializes a new instance of the synchronous PageableClient type.
 */
@ServiceClient(builder = PageableClientBuilder.class)
public final class PageSizeClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final PageSizesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of PageSizeClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    PageSizeClient(PageSizesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The listWithoutContinuation operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> listWithoutContinuation() {
        return listWithoutContinuation(RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> listWithoutContinuation(RequestContext requestContext) {
        return this.serviceClient.listWithoutContinuation(requestContext);
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> listWithPageSize(Integer pageSize) {
        return listWithPageSize(pageSize, RequestContext.none());
    }

    /**
     * The listWithPageSize operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> listWithPageSize() {
        final Integer pageSize = null;
        return listWithPageSize(pageSize, RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> listWithPageSize(Integer pageSize, RequestContext requestContext) {
        return this.serviceClient.listWithPageSize(pageSize, requestContext);
    }
}
