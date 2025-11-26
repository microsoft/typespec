package encode.bytes.implementation;

import encode.bytes.Base64BytesProperty;
import encode.bytes.Base64urlArrayBytesProperty;
import encode.bytes.Base64urlBytesProperty;
import encode.bytes.DefaultBytesProperty;
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
    private final BytesClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of PropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PropertiesImpl(BytesClientImpl client) {
        this.service = PropertiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for BytesClientProperties to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "BytesClientProperties", host = "{endpoint}")
    public interface PropertiesService {
        static PropertiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("encode.bytes.implementation.PropertiesServiceImpl");
                return (PropertiesService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/property/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<DefaultBytesProperty> defaultMethod(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") DefaultBytesProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/property/base64",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Base64BytesProperty> base64(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Base64BytesProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/property/base64url",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Base64urlBytesProperty> base64url(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Base64urlBytesProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/encode/bytes/property/base64url-array",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Base64urlArrayBytesProperty> base64urlArray(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Base64urlArrayBytesProperty body, RequestContext requestContext);
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
    public Response<DefaultBytesProperty> defaultMethodWithResponse(DefaultBytesProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.Property.default", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.defaultMethod(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The base64 operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Base64BytesProperty> base64WithResponse(Base64BytesProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.Property.base64", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.base64(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The base64url operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Base64urlBytesProperty> base64urlWithResponse(Base64urlBytesProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.Property.base64url", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.base64url(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * The base64urlArray operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Base64urlArrayBytesProperty> base64urlArrayWithResponse(Base64urlArrayBytesProperty body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.Property.base64urlArray", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.base64urlArray(this.client.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }
}
