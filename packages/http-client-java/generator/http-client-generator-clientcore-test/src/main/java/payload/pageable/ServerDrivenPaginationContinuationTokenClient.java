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
import payload.pageable.implementation.ServerDrivenPaginationContinuationTokensImpl;

/**
 * Initializes a new instance of the synchronous PageableClient type.
 */
@ServiceClient(builder = PageableClientBuilder.class)
public final class ServerDrivenPaginationContinuationTokenClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ServerDrivenPaginationContinuationTokensImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ServerDrivenPaginationContinuationTokenClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ServerDrivenPaginationContinuationTokenClient(ServerDrivenPaginationContinuationTokensImpl serviceClient,
        Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody(String foo, String bar) {
        return requestQueryResponseBody(foo, bar, RequestContext.none());
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody() {
        final String foo = null;
        final String bar = null;
        return requestQueryResponseBody(foo, bar, RequestContext.none());
    }

    /**
     * The requestQueryResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody(String foo, String bar, RequestContext requestContext) {
        return this.serviceClient.requestQueryResponseBody(foo, bar, requestContext);
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody(String foo, String bar) {
        return requestHeaderResponseBody(foo, bar, RequestContext.none());
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody() {
        final String foo = null;
        final String bar = null;
        return requestHeaderResponseBody(foo, bar, RequestContext.none());
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody(String foo, String bar, RequestContext requestContext) {
        return this.serviceClient.requestHeaderResponseBody(foo, bar, requestContext);
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader(String foo, String bar) {
        return requestQueryResponseHeader(foo, bar, RequestContext.none());
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader() {
        final String foo = null;
        final String bar = null;
        return requestQueryResponseHeader(foo, bar, RequestContext.none());
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader(String foo, String bar, RequestContext requestContext) {
        return this.serviceClient.requestQueryResponseHeader(foo, bar, requestContext);
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader(String foo, String bar) {
        return requestHeaderResponseHeader(foo, bar, RequestContext.none());
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader() {
        final String foo = null;
        final String bar = null;
        return requestHeaderResponseHeader(foo, bar, RequestContext.none());
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader(String foo, String bar, RequestContext requestContext) {
        return this.serviceClient.requestHeaderResponseHeader(foo, bar, requestContext);
    }

    /**
     * The requestQueryNestedResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryNestedResponseBody(String foo, String bar) {
        return requestQueryNestedResponseBody(foo, bar, RequestContext.none());
    }

    /**
     * The requestQueryNestedResponseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryNestedResponseBody() {
        final String foo = null;
        final String bar = null;
        return requestQueryNestedResponseBody(foo, bar, RequestContext.none());
    }

    /**
     * The requestQueryNestedResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryNestedResponseBody(String foo, String bar, RequestContext requestContext) {
        return this.serviceClient.requestQueryNestedResponseBody(foo, bar, requestContext);
    }

    /**
     * The requestHeaderNestedResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderNestedResponseBody(String foo, String bar) {
        return requestHeaderNestedResponseBody(foo, bar, RequestContext.none());
    }

    /**
     * The requestHeaderNestedResponseBody operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderNestedResponseBody() {
        final String foo = null;
        final String bar = null;
        return requestHeaderNestedResponseBody(foo, bar, RequestContext.none());
    }

    /**
     * The requestHeaderNestedResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the paginated response with {@link PagedIterable}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderNestedResponseBody(String foo, String bar, RequestContext requestContext) {
        return this.serviceClient.requestHeaderNestedResponseBody(foo, bar, requestContext);
    }
}
