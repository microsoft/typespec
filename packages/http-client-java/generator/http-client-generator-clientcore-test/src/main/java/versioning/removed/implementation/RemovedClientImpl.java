package versioning.removed.implementation;

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
import versioning.removed.ModelV2;
import versioning.removed.ModelV3;
import versioning.removed.RemovedServiceVersion;

/**
 * Initializes a new instance of the RemovedClient type.
 */
public final class RemovedClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RemovedClientService service;

    /**
     * Need to be set as 'http://localhost:3000' in client.
     */
    private final String endpoint;

    /**
     * Gets Need to be set as 'http://localhost:3000' in client.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * Service version.
     */
    private final RemovedServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public RemovedServiceVersion getServiceVersion() {
        return this.serviceVersion;
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
     * Initializes an instance of RemovedClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param serviceVersion Service version.
     */
    public RemovedClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint,
        RemovedServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.serviceVersion = serviceVersion;
        this.service = RemovedClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for RemovedClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "RemovedClient", host = "{endpoint}/versioning/removed/api-version:{version}")
    public interface RemovedClientService {
        static RemovedClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("versioning.removed.implementation.RemovedClientServiceImpl");
                return (RemovedClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.POST, path = "/v2", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelV2> v2(@HostParam("endpoint") String endpoint, @HostParam("version") String version,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") ModelV2 body, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.POST, path = "/v3", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<ModelV3> modelV3(@HostParam("endpoint") String endpoint, @HostParam("version") String version,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") ModelV3 body, RequestContext requestContext);
    }

    /**
     * The v2 operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelV2> v2WithResponse(ModelV2 body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.Removed.v2", requestContext, updatedContext -> {
            final String contentType = "application/json";
            final String accept = "application/json";
            return service.v2(this.getEndpoint(), this.getServiceVersion().getVersion(), contentType, accept, body,
                updatedContext);
        });
    }

    /**
     * This operation will pass different paths and different request bodies based on different versions.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelV3> modelV3WithResponse(ModelV3 body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.Removed.modelV3", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.modelV3(this.getEndpoint(), this.getServiceVersion().getVersion(), contentType, accept,
                    body, updatedContext);
            });
    }
}
