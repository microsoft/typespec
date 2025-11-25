package encode.datetime.implementation;

import encode.datetime.DefaultDatetimeProperty;
import encode.datetime.Rfc3339DatetimeProperty;
import encode.datetime.Rfc7231DatetimeProperty;
import encode.datetime.UnixTimestampArrayDatetimeProperty;
import encode.datetime.UnixTimestampDatetimeProperty;
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
    private final DatetimeClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of PropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PropertiesImpl(DatetimeClientImpl client) {
        this.service = PropertiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for DatetimeClientProperties to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "DatetimeClientProperties", host = "{endpoint}")
    public interface PropertiesService {
        static PropertiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("encode.datetime.implementation.PropertiesServiceImpl");
                return (PropertiesService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/datetime/property/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<DefaultDatetimeProperty> defaultMethod(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") DefaultDatetimeProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/datetime/property/rfc3339",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Rfc3339DatetimeProperty> rfc3339(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Rfc3339DatetimeProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/datetime/property/rfc7231",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Rfc7231DatetimeProperty> rfc7231(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Rfc7231DatetimeProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/datetime/property/unix-timestamp",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<UnixTimestampDatetimeProperty> unixTimestamp(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") UnixTimestampDatetimeProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/datetime/property/unix-timestamp-array",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<UnixTimestampArrayDatetimeProperty> unixTimestampArray(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") UnixTimestampArrayDatetimeProperty body, RequestContext requestContext);
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
    public Response<DefaultDatetimeProperty> defaultMethodWithResponse(DefaultDatetimeProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Property.default", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.defaultMethod(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Rfc3339DatetimeProperty> rfc3339WithResponse(Rfc3339DatetimeProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Property.rfc3339", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.rfc3339(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Rfc7231DatetimeProperty> rfc7231WithResponse(Rfc7231DatetimeProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Property.rfc7231", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.rfc7231(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<UnixTimestampDatetimeProperty> unixTimestampWithResponse(UnixTimestampDatetimeProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Property.unixTimestamp", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.unixTimestamp(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
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
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<UnixTimestampArrayDatetimeProperty>
        unixTimestampArrayWithResponse(UnixTimestampArrayDatetimeProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Datetime.Property.unixTimestampArray",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.unixTimestampArray(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }
}
