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
import petstore.Checkup;
import petstore.CheckupCollectionWithNextLink;
import petstore.CheckupUpdate;
import petstore.PetStoreError;

/**
 * An instance of this class provides access to all the operations defined in Checkups.
 */
public final class CheckupsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final CheckupsService service;

    /**
     * The service client containing this operation class.
     */
    private final PetStoreClientImpl client;

    /**
     * Initializes an instance of CheckupsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    CheckupsImpl(PetStoreClientImpl client) {
        this.service = RestProxy.create(CheckupsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for PetStoreClientCheckups to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "PetStoreClientChecku", host = "{endpoint}")
    public interface CheckupsService {
        static CheckupsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("petstore.implementation.CheckupsServiceImpl");
                return (CheckupsService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/checkups/{checkupId}",
            expectedStatusCodes = { 200, 201 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Checkup> createOrUpdate(@HostParam("endpoint") String endpoint, @PathParam("checkupId") int checkupId,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") CheckupUpdate resource, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.GET, path = "/checkups", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<CheckupCollectionWithNextLink> list(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);
    }

    /**
     * Creates or update an instance of the resource.
     * 
     * @param checkupId The checkupId parameter.
     * @param resource The resource parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Checkup> createOrUpdateWithResponse(int checkupId, CheckupUpdate resource,
        RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.createOrUpdate(this.client.getEndpoint(), checkupId, contentType, accept, resource,
            requestContext);
    }

    /**
     * Creates or update an instance of the resource.
     * 
     * @param checkupId The checkupId parameter.
     * @param resource The resource parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Checkup createOrUpdate(int checkupId, CheckupUpdate resource) {
        return createOrUpdateWithResponse(checkupId, resource, RequestContext.none()).getValue();
    }

    /**
     * Lists all instances of the resource.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Checkup items.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<CheckupCollectionWithNextLink> listWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.list(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * Lists all instances of the resource.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return paged response of Checkup items.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public CheckupCollectionWithNextLink list() {
        return listWithResponse(RequestContext.none()).getValue();
    }
}
