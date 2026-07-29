package versioning.typechangedfrom.implementation;

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
import versioning.typechangedfrom.TestModel;
import versioning.typechangedfrom.TypeChangedFromServiceVersion;

/**
 * Initializes a new instance of the TypeChangedFromClient type.
 */
public final class TypeChangedFromClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final TypeChangedFromClientService service;

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
    private final TypeChangedFromServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public TypeChangedFromServiceVersion getServiceVersion() {
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
     * Initializes an instance of TypeChangedFromClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param serviceVersion Service version.
     */
    public TypeChangedFromClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint,
        TypeChangedFromServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.serviceVersion = serviceVersion;
        this.service = TypeChangedFromClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for TypeChangedFromClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(
        name = "TypeChangedFromClient",
        host = "{endpoint}/versioning/type-changed-from/api-version:{version}")
    public interface TypeChangedFromClientService {
        static TypeChangedFromClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz
                    = Class.forName("versioning.typechangedfrom.implementation.TypeChangedFromClientServiceImpl");
                return (TypeChangedFromClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(method = HttpMethod.POST, path = "/test", expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<TestModel> test(@HostParam("endpoint") String endpoint, @HostParam("version") String version,
            @QueryParam("param") String param, @HeaderParam("Content-Type") String contentType,
            @HeaderParam("Accept") String accept, @BodyParam("application/json") TestModel body,
            RequestContext requestContext);
    }

    /**
     * The test operation.
     * 
     * @param param The param parameter.
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TestModel> testWithResponse(String param, TestModel body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.TypeChangedFrom.test", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.test(this.getEndpoint(), this.getServiceVersion().getVersion(), param, contentType,
                    accept, body, updatedContext);
            });
    }
}
