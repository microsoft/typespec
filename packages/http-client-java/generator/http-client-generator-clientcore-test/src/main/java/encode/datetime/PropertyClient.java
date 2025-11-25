package encode.datetime;

import encode.datetime.implementation.PropertiesImpl;
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
 * Initializes a new instance of the synchronous DatetimeClient type.
 */
@ServiceClient(builder = DatetimeClientBuilder.class)
public final class PropertyClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final PropertiesImpl serviceClient;

    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of PropertyClient class.
     * 
     * @param serviceClient the service client implementation.
     * @param instrumentation the instrumentation instance.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    PropertyClient(PropertiesImpl serviceClient, Instrumentation instrumentation) {
        this.serviceClient = serviceClient;
        this.instrumentation = instrumentation;
    }

    /**
     * The defaultMethod operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<DefaultDatetimeProperty> defaultMethodWithResponse(DefaultDatetimeProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Property.default", requestContext,
            updatedContext -> this.serviceClient.defaultMethodWithResponse(body, updatedContext));
    }

    /**
     * The defaultMethod operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public DefaultDatetimeProperty defaultMethod(DefaultDatetimeProperty body) {
        return defaultMethodWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The rfc3339 operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Rfc3339DatetimeProperty> rfc3339WithResponse(Rfc3339DatetimeProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Property.rfc3339", requestContext,
            updatedContext -> this.serviceClient.rfc3339WithResponse(body, updatedContext));
    }

    /**
     * The rfc3339 operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Rfc3339DatetimeProperty rfc3339(Rfc3339DatetimeProperty body) {
        return rfc3339WithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The rfc7231 operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Rfc7231DatetimeProperty> rfc7231WithResponse(Rfc7231DatetimeProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Property.rfc7231", requestContext,
            updatedContext -> this.serviceClient.rfc7231WithResponse(body, updatedContext));
    }

    /**
     * The rfc7231 operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Rfc7231DatetimeProperty rfc7231(Rfc7231DatetimeProperty body) {
        return rfc7231WithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The unixTimestamp operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<UnixTimestampDatetimeProperty> unixTimestampWithResponse(UnixTimestampDatetimeProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Property.unixTimestamp", requestContext,
            updatedContext -> this.serviceClient.unixTimestampWithResponse(body, updatedContext));
    }

    /**
     * The unixTimestamp operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public UnixTimestampDatetimeProperty unixTimestamp(UnixTimestampDatetimeProperty body) {
        return unixTimestampWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The unixTimestampArray operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<UnixTimestampArrayDatetimeProperty>
        unixTimestampArrayWithResponse(UnixTimestampArrayDatetimeProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Property.unixTimestampArray",
            requestContext, updatedContext -> this.serviceClient.unixTimestampArrayWithResponse(body, updatedContext));
    }

    /**
     * The unixTimestampArray operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public UnixTimestampArrayDatetimeProperty unixTimestampArray(UnixTimestampArrayDatetimeProperty body) {
        return unixTimestampArrayWithResponse(body, RequestContext.none()).getValue();
    }
}
