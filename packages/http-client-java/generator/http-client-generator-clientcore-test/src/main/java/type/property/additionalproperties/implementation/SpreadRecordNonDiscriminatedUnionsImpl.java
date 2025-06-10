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
import java.lang.reflect.InvocationTargetException;
import type.property.additionalproperties.SpreadRecordForNonDiscriminatedUnion;

/**
 * An instance of this class provides access to all the operations defined in SpreadRecordNonDiscriminatedUnions.
 */
public final class SpreadRecordNonDiscriminatedUnionsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final SpreadRecordNonDiscriminatedUnionsService service;

    /**
     * The service client containing this operation class.
     */
    private final AdditionalPropertiesClientImpl client;

    /**
     * Initializes an instance of SpreadRecordNonDiscriminatedUnionsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    SpreadRecordNonDiscriminatedUnionsImpl(AdditionalPropertiesClientImpl client) {
        this.service = SpreadRecordNonDiscriminatedUnionsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for AdditionalPropertiesClientSpreadRecordNonDiscriminatedUnions to be
     * used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "AdditionalPropertiesClientSpreadRecordNonDiscriminatedUnions", host = "{endpoint}")
    public interface SpreadRecordNonDiscriminatedUnionsService {
        static SpreadRecordNonDiscriminatedUnionsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName(
                    "type.property.additionalproperties.implementation.SpreadRecordNonDiscriminatedUnionsServiceImpl");
                return (SpreadRecordNonDiscriminatedUnionsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/additionalProperties/spreadRecordNonDiscriminatedUnion",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<SpreadRecordForNonDiscriminatedUnion> get(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/property/additionalProperties/spreadRecordNonDiscriminatedUnion",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> put(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") SpreadRecordForNonDiscriminatedUnion body, RequestContext requestContext);
    }

    /**
     * Get call.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return call.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<SpreadRecordForNonDiscriminatedUnion> getWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.get(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * Put operation.
     * 
     * @param body body.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putWithResponse(SpreadRecordForNonDiscriminatedUnion body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.put(this.client.getEndpoint(), contentType, body, requestContext);
    }
}
