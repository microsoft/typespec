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
import type.property.optional.PlainDateProperty;

/**
 * An instance of this class provides access to all the operations defined in PlainDates.
 */
public final class PlainDatesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PlainDatesService service;

    /**
     * The service client containing this operation class.
     */
    private final OptionalClientImpl client;

    /**
     * Initializes an instance of PlainDatesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PlainDatesImpl(OptionalClientImpl client) {
        this.service = RestProxy.create(PlainDatesService.class, client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for OptionalClientPlainDates to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "OptionalClientPlainD", host = "{endpoint}")
    public interface PlainDatesService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/optional/plainDate/all",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<PlainDateProperty> getAllSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/optional/plainDate/default",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<PlainDateProperty> getDefaultSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/property/optional/plainDate/all",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putAllSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/property/optional/plainDate/default",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putDefaultSync(@HostParam("endpoint") String endpoint,
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
     *     property: LocalDate (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return models that will return all properties in the model.
     */
    public Response<PlainDateProperty> getAllWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getAllSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * Get models that will return the default object.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     property: LocalDate (Optional)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return models that will return the default object.
     */
    public Response<PlainDateProperty> getDefaultWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getDefaultSync(this.client.getEndpoint(), accept, requestOptions);
    }

    /**
     * Put a body with all properties present.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     property: LocalDate (Optional)
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
     * Put a body with default properties.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     property: LocalDate (Optional)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> putDefaultWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.putDefaultSync(this.client.getEndpoint(), contentType, body, requestOptions);
    }
}
