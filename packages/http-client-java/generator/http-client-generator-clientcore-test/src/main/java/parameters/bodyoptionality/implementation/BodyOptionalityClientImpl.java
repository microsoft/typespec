package parameters.bodyoptionality.implementation;

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
import parameters.bodyoptionality.BodyModel;

/**
 * Initializes a new instance of the BodyOptionalityClient type.
 */
public final class BodyOptionalityClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final BodyOptionalityClientService service;

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
     * The OptionalExplicitsImpl object to access its operations.
     */
    private final OptionalExplicitsImpl optionalExplicits;

    /**
     * Gets the OptionalExplicitsImpl object to access its operations.
     * 
     * @return the OptionalExplicitsImpl object.
     */
    public OptionalExplicitsImpl getOptionalExplicits() {
        return this.optionalExplicits;
    }

    /**
     * Initializes an instance of BodyOptionalityClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public BodyOptionalityClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.optionalExplicits = new OptionalExplicitsImpl(this);
        this.service = BodyOptionalityClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for BodyOptionalityClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "BodyOptionalityClient", host = "{endpoint}")
    public interface BodyOptionalityClientService {
        static BodyOptionalityClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz
                    = Class.forName("parameters.bodyoptionality.implementation.BodyOptionalityClientServiceImpl");
                return (BodyOptionalityClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/parameters/body-optionality/required-explicit",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> requiredExplicit(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BodyModel body,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/parameters/body-optionality/required-implicit",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> requiredImplicit(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BodyModel bodyModel,
            RequestContext requestContext);
    }

    /**
     * The requiredExplicit operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> requiredExplicitWithResponse(BodyModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.BodyOptionality.requiredExplicit",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.requiredExplicit(this.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * The requiredImplicit operation.
     * 
     * @param name The name parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> requiredImplicitWithResponse(String name, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.BodyOptionality.requiredImplicit",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                BodyModel bodyModel = new BodyModel(name);
                return service.requiredImplicit(this.getEndpoint(), contentType, bodyModel, updatedContext);
            });
    }
}
