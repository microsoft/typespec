package authentication.oauth2;

import authentication.oauth2.implementation.OAuth2ClientImpl;
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
 * Initializes a new instance of the synchronous OAuth2Client type.
 */
@ServiceClient(builder = OAuth2ClientBuilder.class)
public final class OAuth2Client {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final OAuth2ClientImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of OAuth2Client class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    OAuth2Client(OAuth2ClientImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * Check whether client is authenticated.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> validWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Authentication.OAuth2.valid", requestContext,
            updatedContext -> this.serviceClient.validWithResponse(updatedContext));
    }

    /**
     * Check whether client is authenticated.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void valid() {
        validWithResponse(RequestContext.none());
    }

    /**
     * Check whether client is authenticated. Will return an invalid bearer error.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> invalidWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Authentication.OAuth2.invalid", requestContext,
            updatedContext -> this.serviceClient.invalidWithResponse(updatedContext));
    }

    /**
     * Check whether client is authenticated. Will return an invalid bearer error.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void invalid() {
        invalidWithResponse(RequestContext.none());
    }
}
