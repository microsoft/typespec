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
import payload.pageable.implementation.ServerDrivenPaginationAlternateInitialVerbsImpl;
import payload.pageable.serverdrivenpagination.alternateinitialverb.Filter;

/**
 * Initializes a new instance of the synchronous PageableClient type.
 */
@ServiceClient(builder = PageableClientBuilder.class)
public final class ServerDrivenPaginationAlternateInitialVerbClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final ServerDrivenPaginationAlternateInitialVerbsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ServerDrivenPaginationAlternateInitialVerbClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    ServerDrivenPaginationAlternateInitialVerbClient(ServerDrivenPaginationAlternateInitialVerbsImpl serviceClient,
        Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> post(Filter body) {
        return post(body, RequestContext.none());
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
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.COLLECTION)
    public PagedIterable<Pet> post(Filter body, RequestContext requestContext) {
        return this.serviceClient.post(body, requestContext);
    }
}
