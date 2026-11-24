package parameters.query.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.serialization.xml.XmlSerializer;
import io.clientcore.core.utils.GeneratedCodeUtils;
import io.clientcore.core.utils.UriBuilder;

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

    /**
     * The HTTP operations for QueryClientConstants.
     */
    public interface ConstantsService {
        static ConstantsService getNewInstance(HttpPipeline pipeline) {
            return new ConstantsServiceImpl(pipeline);
        }

        Response<Void> post(String endpoint, String queryParam, RequestContext requestContext);
    }

    private static final class ConstantsServiceImpl implements ConstantsService {
        private static final ClientLogger HTTP_LOG = new ClientLogger(ConstantsService.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private ConstantsServiceImpl(HttpPipeline httpPipeline) {
            this.httpPipeline = httpPipeline;
        }

        @Override
        public Response<Void> post(String endpoint, String queryParam, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/parameters/query/constant");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "queryParam", true, queryParam, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST).setUri(uriBuilder.toString());
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
}
