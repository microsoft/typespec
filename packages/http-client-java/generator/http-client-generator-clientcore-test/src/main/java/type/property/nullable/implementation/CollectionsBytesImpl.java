package type.property.nullable.implementation;

import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.exceptions.HttpResponseException;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.RequestOptions;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.models.binarydata.BinaryData;
import type.property.nullable.CollectionsByteProperty;

/**
 * An instance of this class provides access to all the operations defined in CollectionsBytes.
 */
public final class CollectionsBytesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final CollectionsBytesService service;

    /**
     * The service client containing this operation class.
     */
    private final NullableClientImpl client;

    /**
     * Initializes an instance of CollectionsBytesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    CollectionsBytesImpl(NullableClientImpl client) {
        this.service = RestProxy.create(CollectionsBytesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for NullableClientCollectionsBytes to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "NullableClientCollec", host = "{endpoint}")
    public interface CollectionsBytesService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/nullable/collections/bytes/non-null",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<CollectionsByteProperty> getNonNullSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/nullable/collections/bytes/null",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<CollectionsByteProperty> getNullSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/type/property/nullable/collections/bytes/non-null",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> patchNonNullSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/merge-patch+json") BinaryData body,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/type/property/nullable/collections/bytes/null",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> patchNullSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/merge-patch+json") BinaryData body,
            RequestOptions requestOptions);
    }

    /**
     * Get models that will return all properties in the model.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     requiredProperty: String (Optional, Required on create)
     *     nullableProperty (Optional, Required on create): [
     *         byte[] (Optional, Required on create)
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return models that will return all properties in the model.
     */
    public Response<CollectionsByteProperty> getNonNullWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getNonNullSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * Get models that will return the default object.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     requiredProperty: String (Optional, Required on create)
     *     nullableProperty (Optional, Required on create): [
     *         byte[] (Optional, Required on create)
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return models that will return the default object.
     */
    public Response<CollectionsByteProperty> getNullWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getNullSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * Put a body with all properties present.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     requiredProperty: String (Optional, Required on create)
     *     nullableProperty (Optional, Required on create): [
     *         byte[] (Optional, Required on create)
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> patchNonNullWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/merge-patch+json";
        return service.patchNonNullSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * Put a body with default properties.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     requiredProperty: String (Optional, Required on create)
     *     nullableProperty (Optional, Required on create): [
     *         byte[] (Optional, Required on create)
     *     ]
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> patchNullWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/merge-patch+json";
        return service.patchNullSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }
}
