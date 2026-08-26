package payload.jsonmergepatch.implementation;

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
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;
import payload.jsonmergepatch.Resource;
import payload.jsonmergepatch.ResourcePatch;

/**
 * Initializes a new instance of the JsonMergePatchClient type.
 */
public final class JsonMergePatchClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final JsonMergePatchClientService service;

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
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Gets The instance of instrumentation to report telemetry.
     * 
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }

    /**
     * Initializes an instance of JsonMergePatchClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public JsonMergePatchClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = JsonMergePatchClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for JsonMergePatchClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "JsonMergePatchClient", host = "{endpoint}")
    public interface JsonMergePatchClientService {
        static JsonMergePatchClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("payload.jsonmergepatch.implementation.JsonMergePatchClientServiceImpl");
                return (JsonMergePatchClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.PUT,
            path = "/json-merge-patch/create/resource",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Resource> createResource(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") Resource body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/json-merge-patch/update/resource",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Resource> updateResource(@HostParam("endpoint") String endpoint,
            @HeaderParam("content-type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/merge-patch+json") ResourcePatch body, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.PATCH,
            path = "/json-merge-patch/update/resource/optional",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<Resource> updateOptionalResource(@HostParam("endpoint") String endpoint,
            @HeaderParam("Accept") String accept, @BodyParam("application/merge-patch+json") ResourcePatch body,
            RequestContext requestContext);
    }

    /**
     * Test content-type: application/merge-patch+json with required body.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Resource> createResourceWithResponse(Resource body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.JsonMergePatch.createResource", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.createResource(this.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * Test content-type: application/merge-patch+json with required body.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Resource> updateResourceWithResponse(ResourcePatch body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.JsonMergePatch.updateResource", requestContext,
            updatedContext -> {
                final String contentType = "application/merge-patch+json";
                final String accept = "application/json";
                return service.updateResource(this.getEndpoint(), contentType, accept, body, updatedContext);
            });
    }

    /**
     * Test content-type: application/merge-patch+json with optional body.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return details about a resource along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Resource> updateOptionalResourceWithResponse(ResourcePatch body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.JsonMergePatch.updateOptionalResource",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.updateOptionalResource(this.getEndpoint(), accept, body, updatedContext);
            });
    }
}
