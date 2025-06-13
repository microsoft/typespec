package type.enumnamespace.fixed;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import type.enumnamespace.fixed.implementation.StringOperationsImpl;

/**
 * Initializes a new instance of the synchronous FixedClient type.
 */
@ServiceClient(builder = FixedClientBuilder.class)
public final class FixedClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final StringOperationsImpl serviceClient;

    /**
     * Initializes an instance of FixedClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    FixedClient(StringOperationsImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * getKnownValue.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return days of the week.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<DaysOfWeekEnum> getKnownValueWithResponse(RequestContext requestContext) {
        return this.serviceClient.getKnownValueWithResponse(requestContext);
    }

    /**
     * getKnownValue.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return days of the week.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public DaysOfWeekEnum getKnownValue() {
        return getKnownValueWithResponse(RequestContext.none()).getValue();
    }

    /**
     * putKnownValue.
     * 
     * @param body _.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putKnownValueWithResponse(DaysOfWeekEnum body, RequestContext requestContext) {
        return this.serviceClient.putKnownValueWithResponse(body, requestContext);
    }

    /**
     * putKnownValue.
     * 
     * @param body _.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putKnownValue(DaysOfWeekEnum body) {
        putKnownValueWithResponse(body, RequestContext.none());
    }

    /**
     * putUnknownValue.
     * 
     * @param body _.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putUnknownValueWithResponse(DaysOfWeekEnum body, RequestContext requestContext) {
        return this.serviceClient.putUnknownValueWithResponse(body, requestContext);
    }

    /**
     * putUnknownValue.
     * 
     * @param body _.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putUnknownValue(DaysOfWeekEnum body) {
        putUnknownValueWithResponse(body, RequestContext.none());
    }
}
