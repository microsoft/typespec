package versioning.typechangedfrom.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceInterface;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.RestProxy;
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
import java.lang.reflect.InvocationTargetException;
import versioning.typechangedfrom.TestModel;
import versioning.typechangedfrom.TypeChangedFromServiceVersion;
import versioning.typechangedfrom.Versions;

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
     * Need to be set as 'v1' or 'v2' in client.
     */
    private final Versions version;

    /**
     * Gets Need to be set as 'v1' or 'v2' in client.
     * 
     * @return the version value.
     */
    public Versions getVersion() {
        return this.version;
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
     * Initializes an instance of TypeChangedFromClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Need to be set as 'http://localhost:3000' in client.
     * @param version Need to be set as 'v1' or 'v2' in client.
     * @param serviceVersion Service version.
     */
    public TypeChangedFromClientImpl(HttpPipeline httpPipeline, String endpoint, Versions version,
        TypeChangedFromServiceVersion serviceVersion) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.version = version;
        this.serviceVersion = serviceVersion;
        this.service = RestProxy.create(TypeChangedFromClientService.class, this.httpPipeline);
    }

    /**
     * The interface defining all the services for TypeChangedFromClient to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(
        name = "TypeChangedFromClien",
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
        Response<TestModel> test(@HostParam("endpoint") String endpoint, @HostParam("version") Versions version,
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
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<TestModel> testWithResponse(String param, TestModel body, RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.test(this.getEndpoint(), this.getVersion(), param, contentType, accept, body, requestContext);
    }

    /**
     * The test operation.
     * 
     * @param param The param parameter.
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public TestModel test(String param, TestModel body) {
        return testWithResponse(param, body, RequestContext.none()).getValue();
    }
}
