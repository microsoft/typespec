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
import petstore.Pet;
import petstore.PetCollectionWithNextLink;
import petstore.PetStoreError;

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
        @HttpRequestInformation(method = HttpMethod.GET, path = "/pets/{petId}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Pet> getSync(@HostParam("endpoint") String endpoint, @PathParam("petId") int petId,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.PATCH, path = "/pets/{petId}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Pet> updateSync(@HostParam("endpoint") String endpoint, @PathParam("petId") int petId,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData properties, RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.DELETE, path = "/pets/{petId}", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Void> deleteSync(@HostParam("endpoint") String endpoint, @PathParam("petId") int petId,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.POST, path = "/pets", expectedStatusCodes = { 200, 201 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<Pet> createSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") BinaryData resource, RequestOptions requestOptions);

        @HttpRequestInformation(method = HttpMethod.GET, path = "/pets", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail(exceptionBodyClass = PetStoreError.class)
        Response<PetCollectionWithNextLink> listSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);
    }

    /**
     * Gets an instance of the resource.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: int (Required)
     *     name: String (Required)
     *     tag: String (Optional)
     *     age: int (Required)
     *     ownerId: long (Required)
     * }
     * }
     * </pre>
     * 
     * @param petId The petId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return an instance of the resource.
     */
    public Response<Pet> getWithResponse(int petId, RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getSync(this.client.getEndpoint(), petId, accept, requestOptions);
    }

    /**
     * Updates an existing instance of the resource.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Optional)
     *     tag: String (Optional)
     *     age: Integer (Optional)
     *     ownerId: Long (Optional)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: int (Required)
     *     name: String (Required)
     *     tag: String (Optional)
     *     age: int (Required)
     *     ownerId: long (Required)
     * }
     * }
     * </pre>
     * 
     * @param petId The petId parameter.
     * @param properties The properties parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Pet> updateWithResponse(int petId, BinaryData properties, RequestOptions requestOptions) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.updateSync(this.client.getEndpoint(), petId, contentType, accept, properties, requestOptions);
    }

    /**
     * Deletes an existing instance of the resource.
     * 
     * @param petId The petId parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> deleteWithResponse(int petId, RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.deleteSync(this.client.getEndpoint(), petId, accept, requestOptions);
    }

    /**
     * Creates a new instance of the resource.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     *     tag: String (Optional)
     *     age: int (Required)
     *     ownerId: long (Required)
     * }
     * }
     * </pre>
     * 
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     id: int (Required)
     *     name: String (Required)
     *     tag: String (Optional)
     *     age: int (Required)
     *     ownerId: long (Required)
     * }
     * }
     * </pre>
     * 
     * @param resource The resource parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Pet> createWithResponse(BinaryData resource, RequestOptions requestOptions) {
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
     *             id: int (Required)
     *             name: String (Required)
     *             tag: String (Optional)
     *             age: int (Required)
     *             ownerId: long (Required)
     *         }
     *     ]
     *     nextLink: String (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return paged response of Pet items.
     */
    public Response<PetCollectionWithNextLink> listWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.listSync(this.client.getEndpoint(), accept, requestOptions);
    }
}
