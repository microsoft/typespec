package server.path.multiple.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.PathParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;
import server.path.multiple.MultipleServiceVersion;

/**
 * Initializes a new instance of the MultipleClient type.
 */
public final class MultipleClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final MultipleClientService service;

    /**
     * Pass in http://localhost:3000 for endpoint.
     */
    private final String endpoint;

    /**
     * Gets Pass in http://localhost:3000 for endpoint.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * Service version.
     */
    private final MultipleServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public MultipleServiceVersion getServiceVersion() {
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
     * Initializes an instance of MultipleClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Pass in http://localhost:3000 for endpoint.
     * @param serviceVersion Service version.
     */
    public MultipleClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint,
        MultipleServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.serviceVersion = serviceVersion;
        this.service = MultipleClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for MultipleClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "MultipleClient", host = "{endpoint}/server/path/multiple/{apiVersion}")
    public interface MultipleClientService {
        static MultipleClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("server.path.multiple.implementation.MultipleClientServiceImpl");
                return (MultipleClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.GET, path = "/", expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> noOperationParams(@HostParam("endpoint") String endpoint,
            @HostParam("apiVersion") String apiVersion, RequestContext requestContext);

        @HttpRequestInformation(method = HttpMethod.GET, path = "/{keyword}", expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> withOperationPathParam(@HostParam("endpoint") String endpoint,
            @HostParam("apiVersion") String apiVersion, @PathParam("keyword") String keyword,
            RequestContext requestContext);
    }

    /**
     * The noOperationParams operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> noOperationParamsWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Path.Multiple.noOperationParams", requestContext,
            updatedContext -> {
                return service.noOperationParams(this.getEndpoint(), this.getServiceVersion().getVersion(),
                    updatedContext);
            });
    }

    /**
     * The withOperationPathParam operation.
     * 
     * @param keyword The keyword parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withOperationPathParamWithResponse(String keyword, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Server.Path.Multiple.withOperationPathParam",
            requestContext, updatedContext -> {
                return service.withOperationPathParam(this.getEndpoint(), this.getServiceVersion().getVersion(),
                    keyword, updatedContext);
            });
    }
}
