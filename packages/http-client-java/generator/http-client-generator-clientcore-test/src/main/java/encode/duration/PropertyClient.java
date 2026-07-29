package encode.duration;

import encode.duration.implementation.PropertiesImpl;
import encode.duration.property.DefaultDurationProperty;
import encode.duration.property.Float64MillisecondsDurationProperty;
import encode.duration.property.Float64SecondsDurationProperty;
import encode.duration.property.FloatMillisecondsDurationArrayProperty;
import encode.duration.property.FloatMillisecondsDurationProperty;
import encode.duration.property.FloatMillisecondsLargerUnitDurationProperty;
import encode.duration.property.FloatSecondsDurationArrayProperty;
import encode.duration.property.FloatSecondsDurationProperty;
import encode.duration.property.FloatSecondsLargerUnitDurationProperty;
import encode.duration.property.ISO8601DurationProperty;
import encode.duration.property.Int32MillisecondsDurationProperty;
import encode.duration.property.Int32MillisecondsLargerUnitDurationProperty;
import encode.duration.property.Int32SecondsDurationProperty;
import encode.duration.property.Int32SecondsLargerUnitDurationProperty;
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
 * Initializes a new instance of the synchronous DurationClient type.
 */
@ServiceClient(builder = DurationClientBuilder.class)
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
    public Response<DefaultDurationProperty> defaultMethodWithResponse(DefaultDurationProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.default", requestContext,
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
    public DefaultDurationProperty defaultMethod(DefaultDurationProperty body) {
        return defaultMethodWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The iso8601 operation.
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
    public Response<ISO8601DurationProperty> iso8601WithResponse(ISO8601DurationProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.iso8601", requestContext,
            updatedContext -> this.serviceClient.iso8601WithResponse(body, updatedContext));
    }

    /**
     * The iso8601 operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public ISO8601DurationProperty iso8601(ISO8601DurationProperty body) {
        return iso8601WithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The int32Seconds operation.
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
    public Response<Int32SecondsDurationProperty> int32SecondsWithResponse(Int32SecondsDurationProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.int32Seconds", requestContext,
            updatedContext -> this.serviceClient.int32SecondsWithResponse(body, updatedContext));
    }

    /**
     * The int32Seconds operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Int32SecondsDurationProperty int32Seconds(Int32SecondsDurationProperty body) {
        return int32SecondsWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The floatSeconds operation.
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
    public Response<FloatSecondsDurationProperty> floatSecondsWithResponse(FloatSecondsDurationProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.floatSeconds", requestContext,
            updatedContext -> this.serviceClient.floatSecondsWithResponse(body, updatedContext));
    }

    /**
     * The floatSeconds operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public FloatSecondsDurationProperty floatSeconds(FloatSecondsDurationProperty body) {
        return floatSecondsWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The float64Seconds operation.
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
    public Response<Float64SecondsDurationProperty> float64SecondsWithResponse(Float64SecondsDurationProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.float64Seconds", requestContext,
            updatedContext -> this.serviceClient.float64SecondsWithResponse(body, updatedContext));
    }

    /**
     * The float64Seconds operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Float64SecondsDurationProperty float64Seconds(Float64SecondsDurationProperty body) {
        return float64SecondsWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The int32Milliseconds operation.
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
    public Response<Int32MillisecondsDurationProperty>
        int32MillisecondsWithResponse(Int32MillisecondsDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.int32Milliseconds", requestContext,
            updatedContext -> this.serviceClient.int32MillisecondsWithResponse(body, updatedContext));
    }

    /**
     * The int32Milliseconds operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Int32MillisecondsDurationProperty int32Milliseconds(Int32MillisecondsDurationProperty body) {
        return int32MillisecondsWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The floatMilliseconds operation.
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
    public Response<FloatMillisecondsDurationProperty>
        floatMillisecondsWithResponse(FloatMillisecondsDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.floatMilliseconds", requestContext,
            updatedContext -> this.serviceClient.floatMillisecondsWithResponse(body, updatedContext));
    }

    /**
     * The floatMilliseconds operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public FloatMillisecondsDurationProperty floatMilliseconds(FloatMillisecondsDurationProperty body) {
        return floatMillisecondsWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The float64Milliseconds operation.
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
    public Response<Float64MillisecondsDurationProperty>
        float64MillisecondsWithResponse(Float64MillisecondsDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.float64Milliseconds",
            requestContext, updatedContext -> this.serviceClient.float64MillisecondsWithResponse(body, updatedContext));
    }

    /**
     * The float64Milliseconds operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Float64MillisecondsDurationProperty float64Milliseconds(Float64MillisecondsDurationProperty body) {
        return float64MillisecondsWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The floatSecondsArray operation.
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
    public Response<FloatSecondsDurationArrayProperty>
        floatSecondsArrayWithResponse(FloatSecondsDurationArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.floatSecondsArray", requestContext,
            updatedContext -> this.serviceClient.floatSecondsArrayWithResponse(body, updatedContext));
    }

    /**
     * The floatSecondsArray operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public FloatSecondsDurationArrayProperty floatSecondsArray(FloatSecondsDurationArrayProperty body) {
        return floatSecondsArrayWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The floatMillisecondsArray operation.
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
    public Response<FloatMillisecondsDurationArrayProperty>
        floatMillisecondsArrayWithResponse(FloatMillisecondsDurationArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.floatMillisecondsArray",
            requestContext,
            updatedContext -> this.serviceClient.floatMillisecondsArrayWithResponse(body, updatedContext));
    }

    /**
     * The floatMillisecondsArray operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public FloatMillisecondsDurationArrayProperty floatMillisecondsArray(FloatMillisecondsDurationArrayProperty body) {
        return floatMillisecondsArrayWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The int32SecondsLargerUnit operation.
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
    public Response<Int32SecondsLargerUnitDurationProperty>
        int32SecondsLargerUnitWithResponse(Int32SecondsLargerUnitDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.int32SecondsLargerUnit",
            requestContext,
            updatedContext -> this.serviceClient.int32SecondsLargerUnitWithResponse(body, updatedContext));
    }

    /**
     * The int32SecondsLargerUnit operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Int32SecondsLargerUnitDurationProperty int32SecondsLargerUnit(Int32SecondsLargerUnitDurationProperty body) {
        return int32SecondsLargerUnitWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The floatSecondsLargerUnit operation.
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
    public Response<FloatSecondsLargerUnitDurationProperty>
        floatSecondsLargerUnitWithResponse(FloatSecondsLargerUnitDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.floatSecondsLargerUnit",
            requestContext,
            updatedContext -> this.serviceClient.floatSecondsLargerUnitWithResponse(body, updatedContext));
    }

    /**
     * The floatSecondsLargerUnit operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public FloatSecondsLargerUnitDurationProperty floatSecondsLargerUnit(FloatSecondsLargerUnitDurationProperty body) {
        return floatSecondsLargerUnitWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The int32MillisecondsLargerUnit operation.
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
    public Response<Int32MillisecondsLargerUnitDurationProperty> int32MillisecondsLargerUnitWithResponse(
        Int32MillisecondsLargerUnitDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.int32MillisecondsLargerUnit",
            requestContext,
            updatedContext -> this.serviceClient.int32MillisecondsLargerUnitWithResponse(body, updatedContext));
    }

    /**
     * The int32MillisecondsLargerUnit operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Int32MillisecondsLargerUnitDurationProperty
        int32MillisecondsLargerUnit(Int32MillisecondsLargerUnitDurationProperty body) {
        return int32MillisecondsLargerUnitWithResponse(body, RequestContext.none()).getValue();
    }

    /**
     * The floatMillisecondsLargerUnit operation.
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
    public Response<FloatMillisecondsLargerUnitDurationProperty> floatMillisecondsLargerUnitWithResponse(
        FloatMillisecondsLargerUnitDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.floatMillisecondsLargerUnit",
            requestContext,
            updatedContext -> this.serviceClient.floatMillisecondsLargerUnitWithResponse(body, updatedContext));
    }

    /**
     * The floatMillisecondsLargerUnit operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public FloatMillisecondsLargerUnitDurationProperty
        floatMillisecondsLargerUnit(FloatMillisecondsLargerUnitDurationProperty body) {
        return floatMillisecondsLargerUnitWithResponse(body, RequestContext.none()).getValue();
    }
}
