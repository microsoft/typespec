package server.versions.notversioned;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import server.versions.notversioned.implementation.NotVersionedClientImpl;

/**
 * Initializes a new instance of the synchronous NotVersionedClient type.
 */
@ServiceClient(builder = NotVersionedClientBuilder.class)
public final class NotVersionedClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final NotVersionedClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of NotVersionedClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    NotVersionedClient(NotVersionedClientImpl serviceClient, Instrumentation instrumentation) {
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
        return this.instrumentation.instrumentWithResponse("Server.Versions.NotVersioned.withoutApiVersion",
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
     * @param apiVersion The apiVersion parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withQueryApiVersionWithResponse(String apiVersion, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.NotVersioned.withQueryApiVersion",
            requestContext,
            updatedContext -> this.serviceClient.withQueryApiVersionWithResponse(apiVersion, updatedContext));
    }

    /**
     * The withQueryApiVersion operation.
     * 
     * @param apiVersion The apiVersion parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withQueryApiVersion(String apiVersion) {
        withQueryApiVersionWithResponse(apiVersion, RequestContext.none());
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param apiVersion The apiVersion parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withPathApiVersionWithResponse(String apiVersion, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Versions.NotVersioned.withPathApiVersion",
            requestContext,
            updatedContext -> this.serviceClient.withPathApiVersionWithResponse(apiVersion, updatedContext));
    }

    /**
     * The withPathApiVersion operation.
     * 
     * @param apiVersion The apiVersion parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void withPathApiVersion(String apiVersion) {
        withPathApiVersionWithResponse(apiVersion, RequestContext.none());
    }
}
