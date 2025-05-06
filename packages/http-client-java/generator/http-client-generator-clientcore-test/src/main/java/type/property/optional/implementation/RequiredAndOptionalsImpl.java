package type.property.optional.implementation;

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
import type.property.optional.RequiredAndOptionalProperty;

/**
 * An instance of this class provides access to all the operations defined in RequiredAndOptionals.
 */
public final class RequiredAndOptionalsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RequiredAndOptionalsService service;

    /**
     * The service client containing this operation class.
     */
    private final OptionalClientImpl client;

    /**
     * Initializes an instance of RequiredAndOptionalsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    RequiredAndOptionalsImpl(OptionalClientImpl client) {
        this.service = RestProxy.create(RequiredAndOptionalsService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for OptionalClientRequiredAndOptionals to be used by the proxy service to
     * perform REST calls.
     */
    @ServiceInterface(name = "OptionalClientRequir", host = "{endpoint}")
    public interface RequiredAndOptionalsService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/optional/requiredAndOptional/all",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<RequiredAndOptionalProperty> getAllSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/optional/requiredAndOptional/requiredOnly",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<RequiredAndOptionalProperty> getRequiredOnlySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/property/optional/requiredAndOptional/all",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putAllSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/property/optional/requiredAndOptional/requiredOnly",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putRequiredOnlySync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);
    }

    /**
     * Get models that will return all properties in the model.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     optionalProperty: String (Optional)
     *     requiredProperty: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return models that will return all properties in the model.
     */
    public Response<RequiredAndOptionalProperty> getAllWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getAllSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * Get models that will return only the required properties.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     optionalProperty: String (Optional)
     *     requiredProperty: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return models that will return only the required properties.
     */
    public Response<RequiredAndOptionalProperty> getRequiredOnlyWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getRequiredOnlySync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * Put a body with all properties present.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     optionalProperty: String (Optional)
     *     requiredProperty: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> putAllWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.putAllSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * Put a body with only required properties.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     optionalProperty: String (Optional)
     *     requiredProperty: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> putRequiredOnlyWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.putRequiredOnlySync(this.client.getEndpoint(), contentType, body, requestOptions);
    }
}
