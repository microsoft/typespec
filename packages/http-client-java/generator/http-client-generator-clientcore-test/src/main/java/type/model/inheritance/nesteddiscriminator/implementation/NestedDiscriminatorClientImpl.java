package type.model.inheritance.nesteddiscriminator.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import java.lang.reflect.InvocationTargetException;
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
        static NestedDiscriminatorClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName(
                    "type.model.inheritance.nesteddiscriminator.implementation.NestedDiscriminatorClientServiceImpl");
                return (NestedDiscriminatorClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/nested-discriminator/model",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Fish> getModel(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/nested-discriminator/model",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putModel(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") Fish input, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/nested-discriminator/recursivemodel",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Fish> getRecursiveModel(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/model/inheritance/nested-discriminator/recursivemodel",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putRecursiveModel(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @BodyParam("application/json") Fish input,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/nested-discriminator/missingdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Fish> getMissingDiscriminator(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/inheritance/nested-discriminator/wrongdiscriminator",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Fish> getWrongDiscriminator(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);
    }

    /**
     * The getModel operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Fish> getModelWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.getModel(this.getEndpoint(), accept, requestContext);
    }

    /**
     * The getModel operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Fish getModel() {
        return getModelWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The putModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putModelWithResponse(Fish input, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.putModel(this.getEndpoint(), contentType, input, requestContext);
    }

    /**
     * The putModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putModel(Fish input) {
        putModelWithResponse(input, RequestContext.none());
    }

    /**
     * The getRecursiveModel operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Fish> getRecursiveModelWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.getRecursiveModel(this.getEndpoint(), accept, requestContext);
    }

    /**
     * The getRecursiveModel operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Fish getRecursiveModel() {
        return getRecursiveModelWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The putRecursiveModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putRecursiveModelWithResponse(Fish input, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.putRecursiveModel(this.getEndpoint(), contentType, input, requestContext);
    }

    /**
     * The putRecursiveModel operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putRecursiveModel(Fish input) {
        putRecursiveModelWithResponse(input, RequestContext.none());
    }

    /**
     * The getMissingDiscriminator operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Fish> getMissingDiscriminatorWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.getMissingDiscriminator(this.getEndpoint(), accept, requestContext);
    }

    /**
     * The getMissingDiscriminator operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Fish getMissingDiscriminator() {
        return getMissingDiscriminatorWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The getWrongDiscriminator operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Fish> getWrongDiscriminatorWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.getWrongDiscriminator(this.getEndpoint(), accept, requestContext);
    }

    /**
     * The getWrongDiscriminator operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic multiple levels inheritance with a discriminator.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Fish getWrongDiscriminator() {
        return getWrongDiscriminatorWithResponse(RequestContext.none()).getValue();
    }
}
