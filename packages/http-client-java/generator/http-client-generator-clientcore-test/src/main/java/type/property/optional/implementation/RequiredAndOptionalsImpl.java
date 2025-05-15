package type.property.optional.implementation;

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
        static RequiredAndOptionalsService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.property.optional.implementation.RequiredAndOptionalsServiceImpl");
                return (RequiredAndOptionalsService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/optional/requiredAndOptional/all",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<RequiredAndOptionalProperty> getAll(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/optional/requiredAndOptional/requiredOnly",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<RequiredAndOptionalProperty> getRequiredOnly(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/property/optional/requiredAndOptional/all",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putAll(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") RequiredAndOptionalProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/type/property/optional/requiredAndOptional/requiredOnly",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> putRequiredOnly(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") RequiredAndOptionalProperty body, RequestContext requestContext);
    }

    /**
     * Get models that will return all properties in the model.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return all properties in the model.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<RequiredAndOptionalProperty> getAllWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.getAll(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * Get models that will return all properties in the model.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return all properties in the model.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public RequiredAndOptionalProperty getAll() {
        return getAllWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Get models that will return only the required properties.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return only the required properties.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<RequiredAndOptionalProperty> getRequiredOnlyWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.getRequiredOnly(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * Get models that will return only the required properties.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return only the required properties.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public RequiredAndOptionalProperty getRequiredOnly() {
        return getRequiredOnlyWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Put a body with all properties present.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putAllWithResponse(RequiredAndOptionalProperty body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.putAll(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * Put a body with all properties present.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putAll(RequiredAndOptionalProperty body) {
        putAllWithResponse(body, RequestContext.none());
    }

    /**
     * Put a body with only required properties.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putRequiredOnlyWithResponse(RequiredAndOptionalProperty body, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.putRequiredOnly(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * Put a body with only required properties.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void putRequiredOnly(RequiredAndOptionalProperty body) {
        putRequiredOnlyWithResponse(body, RequestContext.none());
    }
}
