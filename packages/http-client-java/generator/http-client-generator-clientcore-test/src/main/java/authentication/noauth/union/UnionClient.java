package authentication.noauth.union;

import authentication.noauth.union.implementation.UnionClientImpl;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;

/**
 * Initializes a new instance of the synchronous UnionClient type.
 */
@ServiceClient(builder = UnionClientBuilder.class)
public final class UnionClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final UnionClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of UnionClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    UnionClient(UnionClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * Check whether client can make a request without authentication.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> validNoAuthWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Authentication.Noauth.Union.validNoAuth", requestContext,
            updatedContext -> this.serviceClient.validNoAuthWithResponse(updatedContext));
    }

    /**
     * Check whether client can make a request without authentication.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void validNoAuth() {
        validNoAuthWithResponse(RequestContext.none());
    }

    /**
     * Check whether client is authenticated with OAuth2 token.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> validTokenWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Authentication.Noauth.Union.validToken", requestContext,
            updatedContext -> this.serviceClient.validTokenWithResponse(updatedContext));
    }

    /**
     * Check whether client is authenticated with OAuth2 token.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void validToken() {
        validTokenWithResponse(RequestContext.none());
    }
}
