package streaming.sse.implementation;

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
import io.clientcore.core.models.binarydata.BinaryData;
import java.lang.reflect.InvocationTargetException;
import streaming.sse.retrieve.RetrievalRequest;

/**
 * An instance of this class provides access to all the operations defined in Retrieves.
 */
public final class RetrievesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RetrievesService service;

    /**
     * The service client containing this operation class.
     */
    private final SseClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of RetrievesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    RetrievesImpl(SseClientImpl client) {
        this.service = RetrievesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The interface defining all the services for SseClientRetrieves to be used by the proxy service to perform REST
     * calls.
     */
    @ServiceInterface(name = "SseClientRetrieves", host = "{endpoint}")
    public interface RetrievesService {
        static RetrievesService getNewInstance(HttpPipeline pipeline) {
            try {
                Class<?> clazz = Class.forName("streaming.sse.implementation.RetrievesServiceImpl");
                return (RetrievesService) clazz.getMethod("getNewInstance", HttpPipeline.class).invoke(null, pipeline);
            } catch (ClassNotFoundException | NoSuchMethodException | IllegalAccessException
                | InvocationTargetException e) {
                throw new RuntimeException(e);
            }

        }

        @HttpRequestInformation(
            method = HttpMethod.POST,
            path = "/streaming/sse/retrieve/stream",
            expectedStatusCodes = { 200 })
        @UnexpectedResponseExceptionDetail
        Response<BinaryData> stream(@HostParam("endpoint") String endpoint,
            @HeaderParam("Content-Type") String contentType, @HeaderParam("Accept") String accept,
            @BodyParam("application/json") RetrievalRequest request, RequestContext requestContext);
    }

    /**
     * The stream operation.
     * 
     * @param request The request parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BinaryData> streamWithResponse(RetrievalRequest request, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Streaming.Sse.Retrieve.stream", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "text/event-stream";
                return service.stream(this.client.getEndpoint(), contentType, accept, request, updatedContext);
            });
    }
}
