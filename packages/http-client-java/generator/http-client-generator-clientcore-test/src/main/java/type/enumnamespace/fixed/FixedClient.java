package type.enumnamespace.fixed;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import type.enumnamespace.fixed.implementation.StringOperationsImpl;

/**
 * Initializes a new instance of the synchronous FixedClient type.
 */
@ServiceClient(builder = FixedClientBuilder.class)
public final class FixedClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final StringOperationsImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of FixedClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    FixedClient(StringOperationsImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * getKnownValue.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return days of the week along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<DaysOfWeekEnum> getKnownValueWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Enum.Fixed.String.getKnownValue", requestContext,
            updatedContext -> this.serviceClient.getKnownValueWithResponse(updatedContext));
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
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putKnownValueWithResponse(DaysOfWeekEnum body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Enum.Fixed.String.putKnownValue", requestContext,
            updatedContext -> this.serviceClient.putKnownValueWithResponse(body, updatedContext));
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
     * @return the {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putUnknownValueWithResponse(DaysOfWeekEnum body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Enum.Fixed.String.putUnknownValue", requestContext,
            updatedContext -> this.serviceClient.putUnknownValueWithResponse(body, updatedContext));
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
