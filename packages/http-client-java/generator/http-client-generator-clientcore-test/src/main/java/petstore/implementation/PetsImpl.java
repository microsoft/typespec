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
import petstore.Pet;
import petstore.PetCollectionWithNextLink;
import petstore.PetCreate;
import petstore.PetStoreError;
import petstore.PetUpdate;

/**
 * An instance of this class provides access to all the operations defined in Pets.
 */
public final class PetsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PetsService service;

    /**
     * The service client containing this operation class.
     */
    private final PetStoreClientImpl client;

    /**
     * Initializes an instance of PetsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PetsImpl(PetStoreClientImpl client) {
        this.service = RestProxy.create(PetsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for PetStoreClientPets to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "PetStoreClientPets", host = "{endpoint}")
    public interface PetsService {
        static PetsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("petstore.implementation.PetsServiceImpl");
                return (PetsService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.GET, path = "/pets/{petId}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Pet> get(@HostParam("endpoint") String endpoint, @PathParam("petId") int petId,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.PATCH, path = "/pets/{petId}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Pet> update(@HostParam("endpoint") String endpoint, @PathParam("petId") int petId,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") PetUpdate properties, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.DELETE, path = "/pets/{petId}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Void> delete(@HostParam("endpoint") String endpoint, @PathParam("petId") int petId,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.POST, path = "/pets", expectedStatusCodes = { 200, 201 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Pet> create(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") PetCreate resource,
            RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.GET, path = "/pets", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<PetCollectionWithNextLink> list(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Pet> getWithResponse(int petId, RequestContext requestContext) {
        final String accept = "application/json";
        return service.get(this.client.getEndpoint(), petId, accept, requestContext);
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param petId The petId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Pet get(int petId) {
        return getWithResponse(petId, RequestContext.none()).getValue();
    }

    /**
     * Updates an existing instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param properties The properties parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Pet> updateWithResponse(int petId, PetUpdate properties, RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.update(this.client.getEndpoint(), petId, contentType, accept, properties, requestContext);
    }

    /**
     * Updates an existing instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param properties The properties parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Pet update(int petId, PetUpdate properties) {
        return updateWithResponse(petId, properties, RequestContext.none()).getValue();
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> deleteWithResponse(int petId, RequestContext requestContext) {
        final String accept = "application/json";
        return service.delete(this.client.getEndpoint(), petId, accept, requestContext);
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param petId The petId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void delete(int petId) {
        deleteWithResponse(petId, RequestContext.none());
    }

    /**
     * Creates a new instance of the resource.
     * 
     * @param resource The resource parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Pet> createWithResponse(PetCreate resource, RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.create(this.client.getEndpoint(), contentType, accept, resource, requestContext);
    }

    /**
     * Creates a new instance of the resource.
     * 
     * @param resource The resource parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Pet create(PetCreate resource) {
        return createWithResponse(resource, RequestContext.none()).getValue();
    }

    /**
     * Lists all instances of the resource.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Pet items.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<PetCollectionWithNextLink> listWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.list(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * Lists all instances of the resource.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Pet items.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public PetCollectionWithNextLink list() {
        return listWithResponse(RequestContext.none()).getValue();
    }
}
