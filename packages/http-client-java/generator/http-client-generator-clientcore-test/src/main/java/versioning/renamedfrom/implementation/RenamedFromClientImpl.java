package versioning.renamedfrom.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.annotations.BodyParam;
import io.clientcore.core.http.annotations.HeaderParam;
import io.clientcore.core.http.annotations.HostParam;
import io.clientcore.core.http.annotations.HttpRequestInformation;
import io.clientcore.core.http.annotations.QueryParam;
import io.clientcore.core.http.annotations.UnexpectedResponseExceptionDetail;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import java.lang.reflect.InvocationTargetException;
import versioning.renamedfrom.NewModel;
import versioning.renamedfrom.RenamedFromServiceVersion;

/**
 * Initializes a new instance of the RenamedFromClient type.
 */
public final class RenamedFromClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RenamedFromClientService service;

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
    private final RenamedFromServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public RenamedFromServiceVersion getServiceVersion() {
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
     * The NewInterfacesImpl object to access its operations.
     */
    private final NewInterfacesImpl newInterfaces;

    /**
     * Gets the NewInterfacesImpl object to access its operations.
     * 
     * @return the NewInterfacesImpl object.
     */
    public NewInterfacesImpl getNewInterfaces() {
        return this.newInterfaces;
    }

    /**
     * Initializes an instance of RenamedFromClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param serviceVersion Service version.
     */
    public RenamedFromClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint,
        RenamedFromServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.serviceVersion = serviceVersion;
        this.newInterfaces = new NewInterfacesImpl(this);
        this.service = RenamedFromClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for RenamedFromClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "RenamedFromClient", host = "{endpoint}/versioning/renamed-from/api-version:{version}")
    public interface RenamedFromClientService {
        static RenamedFromClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("versioning.renamedfrom.implementation.RenamedFromClientServiceImpl");
                return (RenamedFromClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.POST, path = "/test", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<NewModel> newOp(@HostParam("endpoint") String endpoint, @HostParam("version") String version,
            @QueryParam("newQuery") String newQuery, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") NewModel body,
            RequestContext requestContext);
    }

    /**
     * The newOp operation.
     * 
     * @param newQuery The newQuery parameter.
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<NewModel> newOpWithResponse(String newQuery, NewModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.RenamedFrom.newOp", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.newOp(this.getEndpoint(), this.getServiceVersion().getVersion(), newQuery, contentType,
                    accept, body, updatedContext);
            });
    }
}
