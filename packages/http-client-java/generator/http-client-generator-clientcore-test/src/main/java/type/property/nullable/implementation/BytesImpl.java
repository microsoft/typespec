package type.property.nullable.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
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
import type.property.nullable.BytesProperty;

/**
 * An instance of this class provides access to all the operations defined in Bytes.
 */
public final class BytesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final BytesService service;

    /**
     * The service client containing this operation class.
     */
    private final NullableClientImpl client;

    /**
     * Initializes an instance of BytesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    BytesImpl(NullableClientImpl client) {
        this.service = BytesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
    }

    /**
     * The interface defining all the services for NullableClientBytes to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "NullableClientBytes", host = "{endpoint}")
    public interface BytesService {
        static BytesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.property.nullable.implementation.BytesServiceImpl");
                return (BytesService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/nullable/bytes/non-null",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BytesProperty> getNonNull(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/property/nullable/bytes/null",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BytesProperty> getNull(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/type/property/nullable/bytes/non-null",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> patchNonNull(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/merge-patch+json") BytesProperty body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/type/property/nullable/bytes/null",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> patchNull(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/merge-patch+json") BytesProperty body, RequestContext requestContext);
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
    public Response<BytesProperty> getNonNullWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.getNonNull(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * Get models that will return all properties in the model.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return all properties in the model.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BytesProperty getNonNull() {
        return getNonNullWithResponse(RequestContext.none()).getValue();
    }

    /**
     * Get models that will return the default object.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return the default object.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BytesProperty> getNullWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.getNull(this.client.getEndpoint(), accept, requestContext);
    }

    /**
     * Get models that will return the default object.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return models that will return the default object.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public BytesProperty getNull() {
        return getNullWithResponse(RequestContext.none()).getValue();
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
    public Response<Void> patchNonNullWithResponse(BytesProperty body, RequestContext requestContext) {
        final String contentType = "application/merge-patch+json";
        return service.patchNonNull(this.client.getEndpoint(), contentType, body, requestContext);
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
    public void patchNonNull(BytesProperty body) {
        patchNonNullWithResponse(body, RequestContext.none());
    }

    /**
     * Put a body with default properties.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> patchNullWithResponse(BytesProperty body, RequestContext requestContext) {
        final String contentType = "application/merge-patch+json";
        return service.patchNull(this.client.getEndpoint(), contentType, body, requestContext);
    }

    /**
     * Put a body with default properties.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void patchNull(BytesProperty body) {
        patchNullWithResponse(body, RequestContext.none());
    }
}
