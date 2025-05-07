package petstore.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import java.lang.reflect.InvocationTargetException;
import petstore.PetStoreError;
import petstore.Toy;
import petstore.ToyCollectionWithNextLink;

/**
 * An instance of this class provides access to all the operations defined in Toys.
 */
public final class ToysImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ToysService service;

    /**
     * The service client containing this operation class.
     */
    private final PetStoreClientImpl client;

    /**
     * Initializes an instance of ToysImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ToysImpl(PetStoreClientImpl client) {
        this.service = RestProxy.create(ToysService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for PetStoreClientToys to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "PetStoreClientToys", host = "{endpoint}")
    public interface ToysService {
        static ToysService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("petstore.implementation.ToysServiceImpl");
                return (ToysService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/pets/{petId}/toys/{toyId}",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Toy> get(@HostParam("endpoint") String endpoint, @PathParam("petId") int petId,
            @PathParam("toyId") long toyId, @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.GET, path = "/pets/{petId}/toys", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<ToyCollectionWithNextLink> list(@HostParam("endpoint") String endpoint, @PathParam("petId") int petId,
            @QueryParam("nameFilter") String nameFilter, @HeaderParam("Accept") String accept,
            RequestContext requestContext);
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Toy> getWithResponse(int petId, long toyId, RequestContext requestContext) {
        final String accept = "application/json";
        return service.get(this.client.getEndpoint(), petId, toyId, accept, requestContext);
    }

    /**
     * Gets an instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param toyId The toyId parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return an instance of the resource.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Toy get(int petId, long toyId) {
        return getWithResponse(petId, toyId, RequestContext.none()).getValue();
    }

    /**
     * The list operation.
     * 
     * @param petId The petId parameter.
     * @param nameFilter The nameFilter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Toy items.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ToyCollectionWithNextLink> listWithResponse(int petId, String nameFilter,
        RequestContext requestContext) {
        final String accept = "application/json";
        return service.list(this.client.getEndpoint(), petId, nameFilter, accept, requestContext);
    }

    /**
     * The list operation.
     * 
     * @param petId The petId parameter.
     * @param nameFilter The nameFilter parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Toy items.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public ToyCollectionWithNextLink list(int petId, String nameFilter) {
        return listWithResponse(petId, nameFilter, RequestContext.none()).getValue();
    }
}
