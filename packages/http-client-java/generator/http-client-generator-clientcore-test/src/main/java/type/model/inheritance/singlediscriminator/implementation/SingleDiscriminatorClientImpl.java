package type.model.inheritance.singlediscriminator.implementation;

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
import type.model.inheritance.singlediscriminator.Bird;
import type.model.inheritance.singlediscriminator.Dinosaur;

/**
 * Initializes a new instance of the SingleDiscriminatorClient type.
 */
public final class SingleDiscriminatorClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final SingleDiscriminatorClientService service;

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
     * Initializes an instance of SingleDiscriminatorClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public SingleDiscriminatorClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = RestProxy.create(SingleDiscriminatorClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for SingleDiscriminatorClient to be used by the proxy service to perform
     * REST calls.
     */
    @ServiceInterface(name = "SingleDiscriminatorC", host = "{endpoint}")
    public interface SingleDiscriminatorClientService {
        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/single-discriminator/model",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Bird> getModelSync(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/single-discriminator/model",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/single-discriminator/recursivemodel",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Bird> getRecursiveModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/single-discriminator/recursivemodel",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putRecursiveModelSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") BinaryData input,
            RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/single-discriminator/missingdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Bird> getMissingDiscriminatorSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/single-discriminator/wrongdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Bird> getWrongDiscriminatorSync(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestOptions requestOptions);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/single-discriminator/legacy-model",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Dinosaur> getLegacyModelSync(@HostParam("endpoint") String endpoint,
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
     *     wingspan: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    public Response<Bird> getModelWithResponse(RequestOptions requestOptions) {
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
     *     wingspan: int (Required)
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
     *     wingspan: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    public Response<Bird> getRecursiveModelWithResponse(RequestOptions requestOptions) {
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
     *     wingspan: int (Required)
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
     *     wingspan: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    public Response<Bird> getMissingDiscriminatorWithResponse(RequestOptions requestOptions) {
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
     *     wingspan: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return this is base model for polymorphic single level inheritance with a discriminator.
     */
    public Response<Bird> getWrongDiscriminatorWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getWrongDiscriminatorSync(this.getEndpoint(), accept, requestOptions);
    }

    /**
     * The getLegacyModel operation.
     * <p><strong>Response Body Schema</strong></p>
     * 
     * <pre>
     * {@code
     * {
     *     kind: String (Required)
     *     size: int (Required)
     * }
     * }
     * </pre>
     * 
     * @param requestOptions The options to configure the HTTP request before HTTP client sends it.
     * @throws HttpResponseException thrown if the service returns an error.
     * @return define a base class in the legacy way.
     */
    public Response<Dinosaur> getLegacyModelWithResponse(RequestOptions requestOptions) {
        final String accept = "application/json";
        return service.getLegacyModelSync(this.getEndpoint(), accept, requestOptions);
    }
}
