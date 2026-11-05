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
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import io.clientcore.core.utils.UriBuilder;

/**
 * An instance of this class provides access to all the operations defined in SpecialChars.
 */
public final class SpecialCharsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final SpecialCharsService service;

    /**
     * The service client containing this operation class.
     */
    private final QueryClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of SpecialCharsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    SpecialCharsImpl(QueryClientImpl client) {
        this.service = SpecialCharsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface SpecialCharsService {
        static SpecialCharsService getNewInstance(HttpPipeline pipeline) {
            return new SpecialCharsServiceImpl(pipeline);
        }

        Response<Void> dollarSign(String endpoint, String filter, RequestContext requestContext);
    }

    private static final class SpecialCharsServiceImpl implements SpecialCharsService {
        private static final ClientLogger LOGGER = new ClientLogger(SpecialCharsServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private SpecialCharsServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> dollarSign(String endpoint, String filter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/parameters/query/special-char/dollar-sign");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "$filter", true, filter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, SpecialCharsServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The dollarSign operation.
     * 
     * @param filter The filter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> dollarSignWithResponse(String filter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Query.SpecialChar.dollarSign", requestContext,
            updatedContext -> {
                return service.dollarSign(this.client.getEndpoint(), filter, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(SpecialCharsImpl.class);
}
