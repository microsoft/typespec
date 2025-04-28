package petstore.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import petstore.Owner;
import petstore.OwnerCollectionWithNextLink;
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
        @HttpRequestInformation(method = HttpMethod.GET, path = "/owners/{ownerId}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Owner> getSync(@HostParam("endpoint") String endpoint, @PathParam("ownerId") long ownerId,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.PATCH, path = "/owners/{ownerId}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Owner> updateSync(@HostParam("endpoint") String endpoint, @PathParam("ownerId") long ownerId,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData properties, RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.DELETE, path = "/owners/{ownerId}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Void> deleteSync(@HostParam("endpoint") String endpoint, @PathParam("ownerId") long ownerId,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.POST, path = "/owners", expectedStatusCodes = { 200, 201 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Owner> createSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData resource, RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.GET, path = "/owners", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<OwnerCollectionWithNextLink> listSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);
    }

    /**
     * Gets an instance of the resource.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: long (Required)
     *     name: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param ownerId The ownerId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return an instance of the resource.
     */
    public Response<Owner> getWithResponse(long ownerId, RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getSync(this.client.getEndpoint(), ownerId, accept, requestOptions);
    }

    /**
     * Updates an existing instance of the resource.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Optional)
     *     age: Integer (Optional)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: long (Required)
     *     name: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param ownerId The ownerId parameter.
     * @param properties The properties parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Owner> updateWithResponse(long ownerId, BinaryData properties, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.updateSync(this.client.getEndpoint(), ownerId, contentType, accept, properties, requestOptions);
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param ownerId The ownerId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> deleteWithResponse(long ownerId, RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.deleteSync(this.client.getEndpoint(), ownerId, accept, requestOptions);
    }

    /**
     * Creates a new instance of the resource.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: long (Required)
     *     name: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param resource The resource parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Owner> createWithResponse(BinaryData resource, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.createSync(this.client.getEndpoint(), contentType, accept, resource, requestOptions);
    }

    /**
     * Lists all instances of the resource.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     value (Required): [
     *          (Required){
     *             id: long (Required)
     *             name: String (Required)
     *             age: int (Required)
     *         }
     *     ]
     *     nextLink: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return paged response of Owner items.
     */
    public Response<OwnerCollectionWithNextLink> listWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.listSync(this.client.getEndpoint(), accept, requestOptions);
    }
}
