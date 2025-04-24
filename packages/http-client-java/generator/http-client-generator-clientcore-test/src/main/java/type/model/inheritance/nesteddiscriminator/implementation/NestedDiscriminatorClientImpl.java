package type.model.inheritance.nesteddiscriminator.implementation;

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
import type.model.inheritance.nesteddiscriminator.Fish;

/**
 * Initializes a new instance of the NestedDiscriminatorClient type.
 */
public final class NestedDiscriminatorClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final NestedDiscriminatorClientService service;

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
     * Initializes an instance of NestedDiscriminatorClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public NestedDiscriminatorClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(NestedDiscriminatorClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for NestedDiscriminatorClient to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "NestedDiscriminatorC", host = "{endpoint}")
    public interface NestedDiscriminatorClientService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/nested-discriminator/model",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Fish> getModelSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/nested-discriminator/model",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/nested-discriminator/recursivemodel",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Fish> getRecursiveModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/nested-discriminator/recursivemodel",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putRecursiveModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/nested-discriminator/missingdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Fish> getMissingDiscriminatorSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/nested-discriminator/wrongdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Fish> getWrongDiscriminatorSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);
    }

    /**
     * The getModel operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    public Response<Fish> getModelWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getModelSync(this.getEndpoint(), accept, requestOptions);
    }

    /**
     * The putModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> putModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.putModelSync(this.getEndpoint(), contentType, input, requestOptions);
    }

    /**
     * The getRecursiveModel operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    public Response<Fish> getRecursiveModelWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getRecursiveModelSync(this.getEndpoint(), accept, requestOptions);
    }

    /**
     * The putRecursiveModel operation.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param input The input parameter.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> putRecursiveModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.putRecursiveModelSync(this.getEndpoint(), contentType, input, requestOptions);
    }

    /**
     * The getMissingDiscriminator operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    public Response<Fish> getMissingDiscriminatorWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getMissingDiscriminatorSync(this.getEndpoint(), accept, requestOptions);
    }

    /**
     * The getWrongDiscriminator operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     age: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    public Response<Fish> getWrongDiscriminatorWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getWrongDiscriminatorSync(this.getEndpoint(), accept, requestOptions);
    }
}
