package petstore.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import java.lang.reflect.InvocationTargetException;
import petstore.Insurance;
import petstore.InsuranceUpdate;
import petstore.PetStoreError;

/**
 * An instance of this class provides access to all the operations defined in OwnerInsurances.
 */
public final class OwnerInsurancesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final OwnerInsurancesService service;

    /**
     * The service client containing this operation class.
     */
    private final PetStoreClientImpl client;

    /**
     * Initializes an instance of OwnerInsurancesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    OwnerInsurancesImpl(PetStoreClientImpl client) {
        this.service = RestProxy.create(OwnerInsurancesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for PetStoreClientOwnerInsurances to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "PetStoreClientOwnerI", host = "{endpoint}")
    public interface OwnerInsurancesService {
        static OwnerInsurancesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("petstore.implementation.OwnerInsurancesServiceImpl");
                return (OwnerInsurancesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/owners/{ownerId}/insurance",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Insurance> get(@HostParam("endpoint") String endpoint, @PathParam("ownerId") long ownerId,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/owners/{ownerId}/insurance",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Insurance> update(@HostParam("endpoint") String endpoint, @PathParam("ownerId") long ownerId,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") InsuranceUpdate properties, RequestContext requestContext);
    }

    /**
     * Gets the singleton resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the singleton resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Insurance> getWithResponse(long ownerId, RequestContext requestContext) {
        final String accept = "application/json";
        return service.get(this.client.getEndpoint(), ownerId, accept, requestContext);
    }

    /**
     * Gets the singleton resource.
     * 
     * @param ownerId The ownerId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the singleton resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Insurance get(long ownerId) {
        return getWithResponse(ownerId, RequestContext.none()).getValue();
    }

    /**
     * Updates the singleton resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param properties The properties parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Insurance> updateWithResponse(long ownerId, InsuranceUpdate properties,
        RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.update(this.client.getEndpoint(), ownerId, contentType, accept, properties, requestContext);
    }

    /**
     * Updates the singleton resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param properties The properties parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Insurance update(long ownerId, InsuranceUpdate properties) {
        return updateWithResponse(ownerId, properties, RequestContext.none()).getValue();
    }
}
