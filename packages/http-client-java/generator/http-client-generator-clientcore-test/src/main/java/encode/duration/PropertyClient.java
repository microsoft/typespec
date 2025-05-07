package encode.duration;

import encode.duration.implementation.PropertiesImpl;
import encode.duration.property.DefaultDurationProperty;
import encode.duration.property.Float64SecondsDurationProperty;
import encode.duration.property.FloatSecondsDurationArrayProperty;
import encode.duration.property.FloatSecondsDurationProperty;
import encode.duration.property.ISO8601DurationProperty;
import encode.duration.property.Int32SecondsDurationProperty;
import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceClient;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;

/**
 * Initializes a new instance of the synchronous DurationClient type.
 */
@ServiceClient(builder = DurationClientBuilder.class)
public final class PropertyClient {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final PropertiesImpl serviceClient;

    /**
     * Initializes an instance of PropertyClient class.
     * 
     * @param serviceClient the service client implementation.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    PropertyClient(PropertiesImpl serviceClient) {
        this.serviceClient = serviceClient;
    }

    /**
     * The defaultMethod operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<DefaultDurationProperty> defaultMethodWithResponse(DefaultDurationProperty body,
        RequestContext requestContext) {
        return this.serviceClient.defaultMethodWithResponse(body, requestContext);
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
        return this.serviceClient.defaultMethod(body);
    }

    /**
     * The iso8601 operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ISO8601DurationProperty> iso8601WithResponse(ISO8601DurationProperty body,
        RequestContext requestContext) {
        return this.serviceClient.iso8601WithResponse(body, requestContext);
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
        return this.serviceClient.iso8601(body);
    }

    /**
     * The int32Seconds operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Int32SecondsDurationProperty> int32SecondsWithResponse(Int32SecondsDurationProperty body,
        RequestContext requestContext) {
        return this.serviceClient.int32SecondsWithResponse(body, requestContext);
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
        return this.serviceClient.int32Seconds(body);
    }

    /**
     * The floatSeconds operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<FloatSecondsDurationProperty> floatSecondsWithResponse(FloatSecondsDurationProperty body,
        RequestContext requestContext) {
        return this.serviceClient.floatSecondsWithResponse(body, requestContext);
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
        return this.serviceClient.floatSeconds(body);
    }

    /**
     * The float64Seconds operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Float64SecondsDurationProperty> float64SecondsWithResponse(Float64SecondsDurationProperty body,
        RequestContext requestContext) {
        return this.serviceClient.float64SecondsWithResponse(body, requestContext);
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
        return this.serviceClient.float64Seconds(body);
    }

    /**
     * The floatSecondsArray operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<FloatSecondsDurationArrayProperty>
        floatSecondsArrayWithResponse(FloatSecondsDurationArrayProperty body, RequestContext requestContext) {
        return this.serviceClient.floatSecondsArrayWithResponse(body, requestContext);
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
        return this.serviceClient.floatSecondsArray(body);
    }
}
