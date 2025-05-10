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
 * An instance of this class provides access to all the operations defined in ToyInsurances.
 */
public final class ToyInsurancesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ToyInsurancesService service;

    /**
     * The service client containing this operation class.
     */
    private final PetStoreClientImpl client;

    /**
     * Initializes an instance of ToyInsurancesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ToyInsurancesImpl(PetStoreClientImpl client) {
        this.service = RestProxy.create(ToyInsurancesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for PetStoreClientToyInsurances to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "PetStoreClientToyIns", host = "{endpoint}")
    public interface ToyInsurancesService {
        static ToyInsurancesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("petstore.implementation.ToyInsurancesServiceImpl");
                return (ToyInsurancesService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/pets/{petId}/toys/{toyId}/insurance",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Insurance> get(@HostParam("endpoint") String endpoint, @PathParam("petId") int petId,
            @PathParam("toyId") long toyId, @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/pets/{petId}/toys/{toyId}/insurance",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Insurance> update(@HostParam("endpoint") String endpoint, @PathParam("petId") int petId,
            @PathParam("toyId") long toyId, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") InsuranceUpdate properties,
            RequestContext requestContext);
    }

    /**
     * Gets the singleton resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the singleton resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Insurance> getWithResponse(int petId, long toyId, RequestContext requestContext) {
        final String accept = "application/json";
        return service.get(this.client.getEndpoint(), petId, toyId, accept, requestContext);
    }

    /**
     * Gets the singleton resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the singleton resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Insurance get(int petId, long toyId) {
        return getWithResponse(petId, toyId, RequestContext.none()).getValue();
    }

    /**
     * Updates the singleton resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @param properties The properties parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Insurance> updateWithResponse(int petId, long toyId, InsuranceUpdate properties,
        RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.update(this.client.getEndpoint(), petId, toyId, contentType, accept, properties, requestContext);
    }

    /**
     * Updates the singleton resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @param properties The properties parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Insurance update(int petId, long toyId, InsuranceUpdate properties) {
        return updateWithResponse(petId, toyId, properties, RequestContext.none()).getValue();
    }
}
