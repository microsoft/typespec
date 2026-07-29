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
import type.property.optional.StringProperty;

/**
 * An instance of this class provides access to all the operations defined in StringOperations.
 */
public final class StringOperationsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final StringOperationsService service;

    /**
     * The service client containing this operation class.
     */
    private final OptionalClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of StringOperationsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    StringOperationsImpl(OptionalClientImpl client) {
        this.service = StringOperationsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for OptionalClientStringOperations to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "OptionalClientStringOperations", host = "{endpoint}")
    public interface StringOperationsService {
        static StringOperationsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.property.optional.implementation.StringOperationsServiceImpl");
                return (StringOperationsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/optional/string/all",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<StringProperty> getAll(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/optional/string/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<StringProperty> getDefault(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/property/optional/string/all",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putAll(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") StringProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/property/optional/string/default",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putDefault(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") StringProperty body,
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
    public Response<StringProperty> getAllWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Optional.String.getAll", requestContext,
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
    public Response<StringProperty> getDefaultWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Optional.String.getDefault", requestContext,
            updatedContext -> {
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
    public Response<Void> putAllWithResponse(StringProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Optional.String.putAll", requestContext,
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
    public Response<Void> putDefaultWithResponse(StringProperty body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Property.Optional.String.putDefault", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.putDefault(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }
}
