package response.bodyornocontent.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
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
import response.bodyornocontent.BlobLayout;

/**
 * Initializes a new instance of the BodyOrNoContentClient type.
 */
public final class BodyOrNoContentClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final BodyOrNoContentClientService service;

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Gets The instance of instrumentation to report telemetry.
     * 
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }

    /**
     * Initializes an instance of BodyOrNoContentClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public BodyOrNoContentClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = BodyOrNoContentClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for BodyOrNoContentClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "BodyOrNoContentClient", host = "{endpoint}")
    public interface BodyOrNoContentClientService {
        static BodyOrNoContentClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz
                    = Class.forName("response.bodyornocontent.implementation.BodyOrNoContentClientServiceImpl");
                return (BodyOrNoContentClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/response/body-or-no-content/body",
            expectedStatusCodes = { 200, 204 })
        @UnexpectedResponseExceptionDetail
        Response<BlobLayout> getBody(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/response/body-or-no-content/no-content",
            expectedStatusCodes = { 200, 204 })
        @UnexpectedResponseExceptionDetail
        Response<BlobLayout> getNoContent(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);
    }

    /**
     * The getBody operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BlobLayout> getBodyWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Response.BodyOrNoContent.getBody", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getBody(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The getNoContent operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BlobLayout> getNoContentWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Response.BodyOrNoContent.getNoContent", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getNoContent(this.getEndpoint(), accept, updatedContext);
            });
    }
}
