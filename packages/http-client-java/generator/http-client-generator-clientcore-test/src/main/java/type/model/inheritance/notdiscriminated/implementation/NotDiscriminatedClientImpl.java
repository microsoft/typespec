package type.model.inheritance.notdiscriminated.implementation;

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
import type.model.inheritance.notdiscriminated.Siamese;

/**
 * Initializes a new instance of the NotDiscriminatedClient type.
 */
public final class NotDiscriminatedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NotDiscriminatedClientService service;

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
     * Initializes an instance of NotDiscriminatedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public NotDiscriminatedClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = NotDiscriminatedClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for NotDiscriminatedClient to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "NotDiscriminatedClient", host = "{endpoint}")
    public interface NotDiscriminatedClientService {
        static NotDiscriminatedClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName(
                    "type.model.inheritance.notdiscriminated.implementation.NotDiscriminatedClientServiceImpl");
                return (NotDiscriminatedClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/model/inheritance/not-discriminated/valid",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> postValid(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Siamese input,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/not-discriminated/valid",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Siamese> getValid(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/not-discriminated/valid",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Siamese> putValid(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Siamese input, RequestContext requestContext);
    }

    /**
     * The postValid operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postValidWithResponse(Siamese input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.NotDiscriminated.postValid",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.postValid(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * The getValid operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the third level model in the normal multiple levels inheritance along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Siamese> getValidWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.NotDiscriminated.getValid",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getValid(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The putValid operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the third level model in the normal multiple levels inheritance along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Siamese> putValidWithResponse(Siamese input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.NotDiscriminated.putValid",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.putValid(this.getEndpoint(), contentType, accept, input, updatedContext);
            });
    }
}
