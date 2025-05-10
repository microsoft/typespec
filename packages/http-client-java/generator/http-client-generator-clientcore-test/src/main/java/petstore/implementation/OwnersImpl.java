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
import petstore.Owner;
import petstore.OwnerCollectionWithNextLink;
import petstore.OwnerCreate;
import petstore.OwnerUpdate;
import petstore.PetStoreError;

/**
 * An instance of this class provides access to all the operations defined in Owners.
 */
public final class OwnersImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final OwnersService service;

    /**
     * The service client containing this operation class.
     */
    private final PetStoreClientImpl client;

    /**
     * Initializes an instance of OwnersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    OwnersImpl(PetStoreClientImpl client) {
        this.service = RestProxy.create(OwnersService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for PetStoreClientOwners to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "PetStoreClientOwners", host = "{endpoint}")
    public interface OwnersService {
        static OwnersService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("petstore.implementation.OwnersServiceImpl");
                return (OwnersService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.GET, path = "/owners/{ownerId}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Owner> get(@HostParam("endpoint") String endpoint, @PathParam("ownerId") long ownerId,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.PATCH, path = "/owners/{ownerId}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Owner> update(@HostParam("endpoint") String endpoint, @PathParam("ownerId") long ownerId,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") OwnerUpdate properties, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.DELETE, path = "/owners/{ownerId}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Void> delete(@HostParam("endpoint") String endpoint, @PathParam("ownerId") long ownerId,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.POST, path = "/owners", expectedStatusCodes = { 200, 201 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Owner> create(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") OwnerCreate resource,
            RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.GET, path = "/owners", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<OwnerCollectionWithNextLink> list(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Owner> getWithResponse(long ownerId, RequestContext requestContext) {
        final String accept = "application/json";
        return service.get(this.client.getEndpoint(), ownerId, accept, requestContext);
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Owner get(long ownerId) {
        return getWithResponse(ownerId, RequestContext.none()).getValue();
    }

    /**
     * Updates an existing instance of the resource.
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
    public Response<Owner> updateWithResponse(long ownerId, OwnerUpdate properties, RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.update(this.client.getEndpoint(), ownerId, contentType, accept, properties, requestContext);
    }

    /**
     * Updates an existing instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param properties The properties parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Owner update(long ownerId, OwnerUpdate properties) {
        return updateWithResponse(ownerId, properties, RequestContext.none()).getValue();
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> deleteWithResponse(long ownerId, RequestContext requestContext) {
        final String accept = "application/json";
        return service.delete(this.client.getEndpoint(), ownerId, accept, requestContext);
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void delete(long ownerId) {
        deleteWithResponse(ownerId, RequestContext.none());
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
    public Response<Owner> createWithResponse(OwnerCreate resource, RequestContext requestContext) {
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
    public Owner create(OwnerCreate resource) {
        return createWithResponse(resource, RequestContext.none()).getValue();
    }

    /**
     * Lists all instances of the resource.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Owner items.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<OwnerCollectionWithNextLink> listWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.list(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * Lists all instances of the resource.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Owner items.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public OwnerCollectionWithNextLink list() {
        return listWithResponse(RequestContext.none()).getValue();
    }
}
