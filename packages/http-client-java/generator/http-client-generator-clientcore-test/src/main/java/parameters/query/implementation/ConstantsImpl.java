package parameters.query.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;

/**
 * An instance of this class provides access to all the operations defined in Constants.
 */
public final class ConstantsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ConstantsService service;

    /**
     * The service client containing this operation class.
     */
    private final QueryClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ConstantsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ConstantsImpl(QueryClientImpl client) {
        this.service = ConstantsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ConstantsService {
        static ConstantsService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new ConstantsServiceImpl(pipeline);
        }

        Response<Void> post(String endpoint, String queryParam, RequestContext requestContext);
    }

    private static final class ConstantsServiceImpl implements ConstantsService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(ConstantsServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private ConstantsServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> post(String endpoint, String queryParam, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/parameters/query/constant");
            io.clientcore.core.utils.GeneratedCodeUtils.addQueryParameter(uriBuilder, "queryParam", true, queryParam,
                true);
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
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
                    this.jsonSerializer, this.xmlSerializer, null, null, ConstantsServiceImpl.LOGGER);
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
     * post constant query value.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Query.Constant.post", requestContext,
            updatedContext -> {
                final String queryParam = "constantValue";
                return service.post(this.client.getEndpoint(), queryParam, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ConstantsImpl.class);
}
