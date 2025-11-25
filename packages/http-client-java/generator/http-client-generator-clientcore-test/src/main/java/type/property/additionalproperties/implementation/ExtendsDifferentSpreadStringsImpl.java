package type.property.additionalproperties.implementation;

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
import type.property.additionalproperties.DifferentSpreadStringDerived;

/**
 * An instance of this class provides access to all the operations defined in ExtendsDifferentSpreadStrings.
 */
public final class ExtendsDifferentSpreadStringsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ExtendsDifferentSpreadStringsService service;

    /**
     * The service client containing this operation class.
     */
    private final AdditionalPropertiesClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ExtendsDifferentSpreadStringsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ExtendsDifferentSpreadStringsImpl(AdditionalPropertiesClientImpl client) {
        this.service = ExtendsDifferentSpreadStringsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for AdditionalPropertiesClientExtendsDifferentSpreadStrings to be used by
     * the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "AdditionalPropertiesClientExtendsDifferentSpreadStrings", host = "{endpoint}")
    public interface ExtendsDifferentSpreadStringsService {
        static ExtendsDifferentSpreadStringsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName(
                    "type.property.additionalproperties.implementation.ExtendsDifferentSpreadStringsServiceImpl");
                return (ExtendsDifferentSpreadStringsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/additionalProperties/extendsDifferentSpreadString",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<DifferentSpreadStringDerived> get(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/property/additionalProperties/extendsDifferentSpreadString",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> put(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") DifferentSpreadStringDerived body, RequestContext requestContext);
    }

    /**
     * Get call.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return call along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<DifferentSpreadStringDerived> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Property.AdditionalProperties.ExtendsDifferentSpreadString.get", requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.get(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Put operation.
     * 
     * @param body body.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putWithResponse(DifferentSpreadStringDerived body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Property.AdditionalProperties.ExtendsDifferentSpreadString.put", requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.put(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }
}
