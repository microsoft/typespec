package server.path.multiple.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.implementation.utils.UriEscapers;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.serialization.xml.XmlSerializer;
import io.clientcore.core.utils.GeneratedCodeUtils;
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
     * The HTTP operations for MultipleClient.
     */
    public interface MultipleClientService {
        static MultipleClientService getNewInstance(HttpPipeline pipeline) {
            return new MultipleClientServiceImpl(pipeline);
        }

        Response<Void> noOperationParams(String endpoint, String apiVersion, RequestContext requestContext);

        Response<Void> withOperationPathParam(String endpoint, String apiVersion, String keyword,
            RequestContext requestContext);
    }

    private static final class MultipleClientServiceImpl implements MultipleClientService {
        private static final ClientLogger HTTP_LOG = new ClientLogger(MultipleClientService.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private MultipleClientServiceImpl(HttpPipeline httpPipeline) {
            this.httpPipeline = httpPipeline;
        }

        @Override
        public Response<Void> noOperationParams(String endpoint, String apiVersion, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/server/path/multiple/" + apiVersion + "/");
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null, null, HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }

        @Override
        public Response<Void> withOperationPathParam(String endpoint, String apiVersion, String keyword,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(
                    endpoint + "/server/path/multiple/" + apiVersion + "/" + UriEscapers.PATH_ESCAPER.escape(keyword));
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null, null, HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }
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
