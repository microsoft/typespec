package encode.duration.implementation;

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
import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;

/**
 * An instance of this class provides access to all the operations defined in Properties.
 */
public final class PropertiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PropertiesService service;

    /**
     * The service client containing this operation class.
     */
    private final DurationClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of PropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PropertiesImpl(DurationClientImpl client) {
        this.service = PropertiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for DurationClientProperties to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "DurationClientProperties", host = "{endpoint}")
    public interface PropertiesService {
        static PropertiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("encode.duration.implementation.PropertiesServiceImpl");
                return (PropertiesService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<DefaultDurationProperty> defaultMethod(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") DefaultDurationProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/iso8601",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ISO8601DurationProperty> iso8601(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") ISO8601DurationProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/int32-seconds",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Int32SecondsDurationProperty> int32Seconds(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Int32SecondsDurationProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/float-seconds",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<FloatSecondsDurationProperty> floatSeconds(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") FloatSecondsDurationProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/float64-seconds",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Float64SecondsDurationProperty> float64Seconds(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Float64SecondsDurationProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/int32-milliseconds",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Int32MillisecondsDurationProperty> int32Milliseconds(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Int32MillisecondsDurationProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/float-milliseconds",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<FloatMillisecondsDurationProperty> floatMilliseconds(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") FloatMillisecondsDurationProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/float64-milliseconds",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Float64MillisecondsDurationProperty> float64Milliseconds(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Float64MillisecondsDurationProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/float-seconds-array",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<FloatSecondsDurationArrayProperty> floatSecondsArray(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") FloatSecondsDurationArrayProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/float-milliseconds-array",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<FloatMillisecondsDurationArrayProperty> floatMillisecondsArray(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") FloatMillisecondsDurationArrayProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/int32-seconds-larger-unit",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Int32SecondsLargerUnitDurationProperty> int32SecondsLargerUnit(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Int32SecondsLargerUnitDurationProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/float-seconds-larger-unit",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<FloatSecondsLargerUnitDurationProperty> floatSecondsLargerUnit(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") FloatSecondsLargerUnitDurationProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/int32-milliseconds-larger-unit",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Int32MillisecondsLargerUnitDurationProperty> int32MillisecondsLargerUnit(
            @HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Int32MillisecondsLargerUnitDurationProperty body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/duration/property/float-milliseconds-larger-unit",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<FloatMillisecondsLargerUnitDurationProperty> floatMillisecondsLargerUnit(
            @HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept,
            @BodyParam("application/json") FloatMillisecondsLargerUnitDurationProperty body,
            RequestContext requestContext);
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<DefaultDurationProperty> defaultMethodWithResponse(DefaultDurationProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.default", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.defaultMethod(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ISO8601DurationProperty> iso8601WithResponse(ISO8601DurationProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.iso8601", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.iso8601(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Int32SecondsDurationProperty> int32SecondsWithResponse(Int32SecondsDurationProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.int32Seconds", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.int32Seconds(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<FloatSecondsDurationProperty> floatSecondsWithResponse(FloatSecondsDurationProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.floatSeconds", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.floatSeconds(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Float64SecondsDurationProperty> float64SecondsWithResponse(Float64SecondsDurationProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.float64Seconds", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.float64Seconds(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Int32MillisecondsDurationProperty>
        int32MillisecondsWithResponse(Int32MillisecondsDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.int32Milliseconds", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.int32Milliseconds(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<FloatMillisecondsDurationProperty>
        floatMillisecondsWithResponse(FloatMillisecondsDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.floatMilliseconds", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.floatMilliseconds(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Float64MillisecondsDurationProperty>
        float64MillisecondsWithResponse(Float64MillisecondsDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.float64Milliseconds",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.float64Milliseconds(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<FloatSecondsDurationArrayProperty>
        floatSecondsArrayWithResponse(FloatSecondsDurationArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.floatSecondsArray", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.floatSecondsArray(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<FloatMillisecondsDurationArrayProperty>
        floatMillisecondsArrayWithResponse(FloatMillisecondsDurationArrayProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.floatMillisecondsArray",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.floatMillisecondsArray(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Int32SecondsLargerUnitDurationProperty>
        int32SecondsLargerUnitWithResponse(Int32SecondsLargerUnitDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.int32SecondsLargerUnit",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.int32SecondsLargerUnit(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<FloatSecondsLargerUnitDurationProperty>
        floatSecondsLargerUnitWithResponse(FloatSecondsLargerUnitDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.floatSecondsLargerUnit",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.floatSecondsLargerUnit(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Int32MillisecondsLargerUnitDurationProperty> int32MillisecondsLargerUnitWithResponse(
        Int32MillisecondsLargerUnitDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.int32MillisecondsLargerUnit",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.int32MillisecondsLargerUnit(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<FloatMillisecondsLargerUnitDurationProperty> floatMillisecondsLargerUnitWithResponse(
        FloatMillisecondsLargerUnitDurationProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Duration.Property.floatMillisecondsLargerUnit",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.floatMillisecondsLargerUnit(this.client.getEndpoint(), contentType, accept, body,
                    updatedContext);
            });
    }
}
