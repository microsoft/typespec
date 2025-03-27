package parameters.bodyoptionality.implementation;

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
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.models.binarydata.BinaryData;

/**
 * Initializes a new instance of the BodyOptionalityClient type.
 */
public final class BodyOptionalityClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final BodyOptionalityClientService service;

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The OptionalExplicitsImpl object to access its operations.
     */
    private final OptionalExplicitsImpl optionalExplicits;

    /**
     * Gets the OptionalExplicitsImpl object to access its operations.
     * 
     * @return the OptionalExplicitsImpl object.
     */
    public OptionalExplicitsImpl getOptionalExplicits() {
        return this.optionalExplicits;
    }

    /**
     * Initializes an instance of BodyOptionalityClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public BodyOptionalityClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.optionalExplicits = new OptionalExplicitsImpl(this);
        this.service = RestProxy.create(BodyOptionalityClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for BodyOptionalityClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "BodyOptionalityClien", host = "{endpoint}")
    public interface BodyOptionalityClientService {
        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/parameters/body-optionality/required-explicit",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> requiredExplicitSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData body,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/parameters/body-optionality/required-implicit",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> requiredImplicitSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData bodyModel,
            RequestOptions requestOptions);
    }

    /**
     * The requiredExplicit operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param body The body parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> requiredExplicitWithResponse(BinaryData body, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.requiredExplicitSync(this.getEndpoint(), contentType, body, requestOptions);
    }

    /**
     * The requiredImplicit operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     name: String (Required)
     * }
     * }
     * </pre>
     * 
     * @param bodyModel The bodyModel parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> requiredImplicitWithResponse(BinaryData bodyModel, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.requiredImplicitSync(this.getEndpoint(), contentType, bodyModel, requestOptions);
    }
}
