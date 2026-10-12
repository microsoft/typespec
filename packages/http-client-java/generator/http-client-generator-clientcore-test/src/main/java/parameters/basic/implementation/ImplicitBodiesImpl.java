package parameters.basic.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
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
        static ImplicitBodiesService getNewInstance(HttpPipeline pipeline) {
            return new ImplicitBodiesServiceImpl(pipeline);
        }

        Response<Void> simple(String endpoint, String contentType, SimpleRequest simpleRequest,
            RequestContext requestContext);
    }

    private static final class ImplicitBodiesServiceImpl implements ImplicitBodiesService {
        private static final ClientLogger LOGGER = new ClientLogger(ImplicitBodiesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private ImplicitBodiesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> simple(String endpoint, String contentType, SimpleRequest simpleRequest,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/parameters/basic/implicit-body/simple");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (simpleRequest != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(simpleRequest, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, ImplicitBodiesServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
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
