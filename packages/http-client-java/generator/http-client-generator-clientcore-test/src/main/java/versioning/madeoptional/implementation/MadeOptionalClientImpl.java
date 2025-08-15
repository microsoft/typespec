package versioning.madeoptional.implementation;

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
import versioning.madeoptional.MadeOptionalServiceVersion;
import versioning.madeoptional.TestModel;

/**
 * Initializes a new instance of the MadeOptionalClient type.
 */
public final class MadeOptionalClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final MadeOptionalClientService service;

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
    private final MadeOptionalServiceVersion serviceVersion;

    /**
     * Gets Service version.
     * 
     * @return the serviceVersion value.
     */
    public MadeOptionalServiceVersion getServiceVersion() {
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
     * Initializes an instance of MadeOptionalClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param serviceVersion Service version.
     */
    public MadeOptionalClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint,
        MadeOptionalServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.serviceVersion = serviceVersion;
        this.service = MadeOptionalClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for MadeOptionalClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "MadeOptionalClient", host = "{endpoint}/versioning/made-optional/api-version:{version}")
    public interface MadeOptionalClientService {
        static MadeOptionalClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("versioning.madeoptional.implementation.MadeOptionalClientServiceImpl");
                return (MadeOptionalClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
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
     * @param body The body parameter.
     * @param param The param parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TestModel> testWithResponse(TestModel body, String param, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Versioning.MadeOptional.test", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.test(this.getEndpoint(), this.getServiceVersion().getVersion(), param, contentType,
                    accept, body, updatedContext);
            });
    }
}
