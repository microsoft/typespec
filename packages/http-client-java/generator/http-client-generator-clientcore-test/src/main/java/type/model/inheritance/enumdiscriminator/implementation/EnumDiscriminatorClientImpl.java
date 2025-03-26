package type.model.inheritance.enumdiscriminator.implementation;

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
import type.model.inheritance.enumdiscriminator.Dog;
import type.model.inheritance.enumdiscriminator.Snake;

/**
 * Initializes a new instance of the EnumDiscriminatorClient type.
 */
public final class EnumDiscriminatorClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final EnumDiscriminatorClientService service;

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
     * Initializes an instance of EnumDiscriminatorClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public EnumDiscriminatorClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(EnumDiscriminatorClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for EnumDiscriminatorClient to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "EnumDiscriminatorCli", host = "{endpoint}")
    public interface EnumDiscriminatorClientService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/enum-discriminator/extensible-enum",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Dog> getExtensibleModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/enum-discriminator/extensible-enum",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putExtensibleModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/enum-discriminator/extensible-enum/missingdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Dog> getExtensibleModelMissingDiscriminatorSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/enum-discriminator/extensible-enum/wrongdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Dog> getExtensibleModelWrongDiscriminatorSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/enum-discriminator/fixed-enum",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Snake> getFixedModelSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/enum-discriminator/fixed-enum",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putFixedModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/enum-discriminator/fixed-enum/missingdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Snake> getFixedModelMissingDiscriminatorSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/enum-discriminator/fixed-enum/wrongdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Snake> getFixedModelWrongDiscriminatorSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);
    }

    /**
     * Receive model with extensible enum discriminator type.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(golden) (Required)
     *     weight: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return test extensible enum type for discriminator.
     */
    public Response<Dog> getExtensibleModelWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getExtensibleModelSync(this.getEndpoint(), accept, requestOptions);
    }

    /**
     * Send model with extensible enum discriminator type.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(golden) (Required)
     *     weight: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param input Dog to create.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> putExtensibleModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.putExtensibleModelSync(this.getEndpoint(), contentType, input, requestOptions);
    }

    /**
     * Get a model omitting the discriminator.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(golden) (Required)
     *     weight: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a model omitting the discriminator.
     */
    public Response<Dog> getExtensibleModelMissingDiscriminatorWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getExtensibleModelMissingDiscriminatorSync(this.getEndpoint(), accept, requestOptions);
    }

    /**
     * Get a model containing discriminator value never defined.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(golden) (Required)
     *     weight: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a model containing discriminator value never defined.
     */
    public Response<Dog> getExtensibleModelWrongDiscriminatorWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getExtensibleModelWrongDiscriminatorSync(this.getEndpoint(), accept, requestOptions);
    }

    /**
     * Receive model with fixed enum discriminator type.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(cobra) (Required)
     *     length: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return test fixed enum type for discriminator.
     */
    public Response<Snake> getFixedModelWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getFixedModelSync(this.getEndpoint(), accept, requestOptions);
    }

    /**
     * Send model with fixed enum discriminator type.
     * <p><strong>Request Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(cobra) (Required)
     *     length: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param input Snake to create.
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return the response.
     */
    public Response<Void> putFixedModelWithResponse(BinaryData input, RequestOptions requestOptions) {
        final String contentType = "application/json";
        return service.putFixedModelSync(this.getEndpoint(), contentType, input, requestOptions);
    }

    /**
     * Get a model omitting the discriminator.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(cobra) (Required)
     *     length: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a model omitting the discriminator.
     */
    public Response<Snake> getFixedModelMissingDiscriminatorWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getFixedModelMissingDiscriminatorSync(this.getEndpoint(), accept, requestOptions);
    }

    /**
     * Get a model containing discriminator value never defined.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String(cobra) (Required)
     *     length: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return a model containing discriminator value never defined.
     */
    public Response<Snake> getFixedModelWrongDiscriminatorWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getFixedModelWrongDiscriminatorSync(this.getEndpoint(), accept, requestOptions);
    }
}
