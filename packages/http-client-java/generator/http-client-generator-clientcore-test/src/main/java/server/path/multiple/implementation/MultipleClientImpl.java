package server.path.multiple.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
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

    public interface MultipleClientService {
        static MultipleClientService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new MultipleClientServiceImpl(pipeline);
        }

        Response<Void> noOperationParams(String endpoint, String apiVersion, RequestContext requestContext);

        Response<Void> withOperationPathParam(String endpoint, String apiVersion, String keyword,
            RequestContext requestContext);
    }

    private static final class MultipleClientServiceImpl implements MultipleClientService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(MultipleClientServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private MultipleClientServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> noOperationParams(String endpoint, String apiVersion, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/server/path/multiple/"
                    + io.clientcore.core.implementation.utils.UriEscapers.PATH_ESCAPER.escape(apiVersion) + "/");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, MultipleClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withOperationPathParam(String endpoint, String apiVersion, String keyword,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/server/path/multiple/"
                    + io.clientcore.core.implementation.utils.UriEscapers.PATH_ESCAPER.escape(apiVersion) + "/"
                    + io.clientcore.core.implementation.utils.UriEscapers.PATH_ESCAPER.escape(keyword));
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, MultipleClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
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

    private static final ClientLogger LOGGER = new ClientLogger(MultipleClientImpl.class);
}
