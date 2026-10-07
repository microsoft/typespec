package parameters.basic.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import parameters.basic.implicitbody.implementation.SimpleRequest;

/**
 * An instance of this class provides access to all the operations defined in ImplicitBodies.
 */
public final class ImplicitBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ImplicitBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final BasicClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ImplicitBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ImplicitBodiesImpl(BasicClientImpl client) {
        this.service = ImplicitBodiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ImplicitBodiesService {
        static ImplicitBodiesService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new ImplicitBodiesServiceImpl(pipeline);
        }

        Response<Void> simple(String endpoint, String contentType, SimpleRequest simpleRequest,
            RequestContext requestContext);
    }

    private static final class ImplicitBodiesServiceImpl implements ImplicitBodiesService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(ImplicitBodiesServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private ImplicitBodiesServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> simple(String endpoint, String contentType, SimpleRequest simpleRequest,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/parameters/basic/implicit-body/simple");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.PUT)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (simpleRequest != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(simpleRequest,
                    this.xmlSerializer.supportsFormat(requestSerializationFormat)
                        ? this.xmlSerializer
                        : this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, ImplicitBodiesServiceImpl.LOGGER);
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
     * The simple operation.
     * 
     * @param name The name parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> simpleWithResponse(String name, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Basic.ImplicitBody.simple", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                SimpleRequest simpleRequest = new SimpleRequest(name);
                return service.simple(this.client.getEndpoint(), contentType, simpleRequest, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ImplicitBodiesImpl.class);
}
