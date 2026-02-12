package server.versions.versioned;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import server.versions.versioned.implementation.VersionedClientImpl;

/**
 * Initializes a new instance of the synchronous VersionedClient type.
 */
@ServiceClient(builder = VersionedClientBuilder.class)
public final class VersionedClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final VersionedClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of VersionedClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    VersionedClient(VersionedClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The withoutApiVersion operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withoutApiVersionWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.Versioned.withoutApiVersion",
            requestContext, updatedContext -> this.serviceClient.withoutApiVersionWithResponse(updatedContext));
    }

    /**
     * The withoutApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withoutApiVersion() {
        withoutApiVersionWithResponse(RequestContext.none());
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withQueryApiVersionWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.Versioned.withQueryApiVersion",
            requestContext, updatedContext -> this.serviceClient.withQueryApiVersionWithResponse(updatedContext));
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withQueryApiVersion() {
        withQueryApiVersionWithResponse(RequestContext.none());
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withPathApiVersionWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.Versioned.withPathApiVersion",
            requestContext, updatedContext -> this.serviceClient.withPathApiVersionWithResponse(updatedContext));
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withPathApiVersion() {
        withPathApiVersionWithResponse(RequestContext.none());
    }

    /**
     * The withQueryOldApiVersion operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withQueryOldApiVersionWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.Versioned.withQueryOldApiVersion",
            requestContext, updatedContext -> this.serviceClient.withQueryOldApiVersionWithResponse(updatedContext));
    }

    /**
     * The withQueryOldApiVersion operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withQueryOldApiVersion() {
        withQueryOldApiVersionWithResponse(RequestContext.none());
    }
}
