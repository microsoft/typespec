package type.property.optional.implementation;

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
import type.property.optional.IntLiteralProperty;

/**
 * An instance of this class provides access to all the operations defined in IntLiterals.
 */
public final class IntLiteralsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final IntLiteralsService service;

    /**
     * The service client containing this operation class.
     */
    private final OptionalClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of IntLiteralsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    IntLiteralsImpl(OptionalClientImpl client) {
        this.service = IntLiteralsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for OptionalClientIntLiterals to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "OptionalClientIntLiterals", host = "{endpoint}")
    public interface IntLiteralsService {
        static IntLiteralsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.property.optional.implementation.IntLiteralsServiceImpl");
                return (IntLiteralsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/optional/int/literal/all",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<IntLiteralProperty> getAll(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/optional/int/literal/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<IntLiteralProperty> getDefault(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/property/optional/int/literal/all",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putAll(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") IntLiteralProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/property/optional/int/literal/default",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putDefault(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") IntLiteralProperty body,
            RequestContext requestContext);
    }

    /**
     * Get models that will return all properties in the model.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return all properties in the model along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<IntLiteralProperty> getAllWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Optional.IntLiteral.getAll", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getAll(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Get models that will return the default object.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return the default object along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<IntLiteralProperty> getDefaultWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Optional.IntLiteral.getDefault",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getDefault(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Put a body with all properties present.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putAllWithResponse(IntLiteralProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Optional.IntLiteral.putAll", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.putAll(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    /**
     * Put a body with default properties.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putDefaultWithResponse(IntLiteralProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Optional.IntLiteral.putDefault",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.putDefault(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }
}
