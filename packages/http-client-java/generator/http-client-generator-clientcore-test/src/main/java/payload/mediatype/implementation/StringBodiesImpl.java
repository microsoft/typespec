package payload.mediatype.implementation;

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
 * An instance of this class provides access to all the operations defined in StringBodies.
 */
public final class StringBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final StringBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final MediaTypeClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of StringBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    StringBodiesImpl(MediaTypeClientImpl client) {
        this.service = StringBodiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for MediaTypeClientStringBodies to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "MediaTypeClientStringBodies", host = "{endpoint}")
    public interface StringBodiesService {
        static StringBodiesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("payload.mediatype.implementation.StringBodiesServiceImpl");
                return (StringBodiesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/payload/media-type/string-body/sendAsText",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> sendAsText(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("text/plain") String text,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/media-type/string-body/getAsText",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<String> getAsText(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/payload/media-type/string-body/sendAsJson",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Void> sendAsJson(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @BodyParam("application/json") String text,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/payload/media-type/string-body/getAsJson",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<String> getAsJson(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);
    }

    /**
     * The sendAsText operation.
     * 
     * @param text The text parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sendAsTextWithResponse(String text, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MediaType.StringBody.sendAsText", requestContext,
            updatedContext -> {
                final String contentType = "text/plain";
                return service.sendAsText(this.client.getEndpoint(), contentType, text, updatedContext);
            });
    }

    /**
     * The getAsText operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<String> getAsTextWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MediaType.StringBody.getAsText", requestContext,
            updatedContext -> {
                final String accept = "text/plain";
                return service.getAsText(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The sendAsJson operation.
     * 
     * @param text The text parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> sendAsJsonWithResponse(String text, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MediaType.StringBody.sendAsJson", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.sendAsJson(this.client.getEndpoint(), contentType, text, updatedContext);
            });
    }

    /**
     * The getAsJson operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a sequence of textual characters along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<String> getAsJsonWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.MediaType.StringBody.getAsJson", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getAsJson(this.client.getEndpoint(), accept, updatedContext);
            });
    }
}
