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
     * @return the response.
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
     * @return the response.
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
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseBody(String foo, String bar, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "ServerDrivenPaginationContinuationToken.requestQueryResponseBody", requestContext,
            updatedContext -> this.serviceClient.requestQueryResponseBody(foo, bar, updatedContext));
    }

    /**
     * The requestHeaderResponseBody operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
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
     * @return the response.
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
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseBody(String foo, String bar, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "ServerDrivenPaginationContinuationToken.requestHeaderResponseBody", requestContext,
            updatedContext -> this.serviceClient.requestHeaderResponseBody(foo, bar, updatedContext));
    }

    /**
     * The requestQueryResponseHeader operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
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
     * @return the response.
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
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestQueryResponseHeader(String foo, String bar, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "ServerDrivenPaginationContinuationToken.requestQueryResponseHeader", requestContext,
            updatedContext -> this.serviceClient.requestQueryResponseHeader(foo, bar, updatedContext));
    }

    /**
     * The requestHeaderResponseHeader operation.
     * 
     * @param foo The foo parameter.
     * @param bar The bar parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
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
     * @return the response.
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
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> requestHeaderResponseHeader(String foo, String bar, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "ServerDrivenPaginationContinuationToken.requestHeaderResponseHeader", requestContext,
            updatedContext -> this.serviceClient.requestHeaderResponseHeader(foo, bar, updatedContext));
    }
}
