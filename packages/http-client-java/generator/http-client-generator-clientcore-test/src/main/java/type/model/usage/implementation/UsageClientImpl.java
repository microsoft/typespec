package type.model.usage.implementation;

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
import type.model.usage.InputOutputRecord;
import type.model.usage.InputRecord;
import type.model.usage.OutputRecord;

/**
 * Initializes a new instance of the UsageClient type.
 */
public final class UsageClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final UsageClientService service;

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
     * Initializes an instance of UsageClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public UsageClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.endpoint = endpoint;
        this.service = UsageClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The interface defining all the services for UsageClient to be used by the proxy service to perform REST calls.
     */
    @ServiceInterface(name = "UsageClient", host = "{endpoint}")
    public interface UsageClientService {
        static UsageClientService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("type.model.usage.implementation.UsageClientServiceImpl");
                return (UsageClientService) clazz.getMethod("getNewInstance", HttpPipeline.class)
                    .invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/model/usage/input",
            expectedStatusCodes = { 204 })
        @UnexpectedResponseExceptionDetail
        Response<Void> input(@HostParam("endpoint") String endpoint, @HeaderParam("Content-Type") String contentType,
            @BodyParam("application/json") InputRecord input, RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.GET,
            path = "/type/model/usage/output",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<OutputRecord> output(@HostParam("endpoint") String endpoint, @HeaderParam("Accept") String accept,
            RequestContext requestContext);

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/type/model/usage/input-output",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<InputOutputRecord> inputAndOutput(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") InputOutputRecord body, RequestContext requestContext);
    }

    /**
     * The input operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> inputWithResponse(InputRecord input, RequestContext requestContext) {
        final String contentType = "application/json";
        return service.input(this.getEndpoint(), contentType, input, requestContext);
    }

    /**
     * The input operation.
     * 
     * @param input The input parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public void input(InputRecord input) {
        inputWithResponse(input, RequestContext.none());
    }

    /**
     * The output operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return record used in operation return type.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<OutputRecord> outputWithResponse(RequestContext requestContext) {
        final String accept = "application/json";
        return service.output(this.getEndpoint(), accept, requestContext);
    }

    /**
     * The output operation.
     * 
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return record used in operation return type.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public OutputRecord output() {
        return outputWithResponse(RequestContext.none()).getValue();
    }

    /**
     * The inputAndOutput operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return record used both as operation parameter and return type.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<InputOutputRecord> inputAndOutputWithResponse(InputOutputRecord body,
        RequestContext requestContext) {
        final String contentType = "application/json";
        final String accept = "application/json";
        return service.inputAndOutput(this.getEndpoint(), contentType, accept, body, requestContext);
    }

    /**
     * The inputAndOutput operation.
     * 
     * @param body The body parameter.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return record used both as operation parameter and return type.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public InputOutputRecord inputAndOutput(InputOutputRecord body) {
        return inputAndOutputWithResponse(body, RequestContext.none()).getValue();
    }
}
