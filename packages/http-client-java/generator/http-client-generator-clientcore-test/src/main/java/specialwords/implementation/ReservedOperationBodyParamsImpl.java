package specialwords.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import java.util.List;
import specialwords.reservedoperationbodyparams.implementation.WithItemsRequest;

/**
 * An instance of this class provides access to all the operations defined in ReservedOperationBodyParams.
 */
public final class ReservedOperationBodyParamsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ReservedOperationBodyParamsService service;

    /**
     * The service client containing this operation class.
     */
    private final SpecialWordsClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ReservedOperationBodyParamsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ReservedOperationBodyParamsImpl(SpecialWordsClientImpl client) {
        this.service = ReservedOperationBodyParamsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ReservedOperationBodyParamsService {
        static ReservedOperationBodyParamsService
            getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new ReservedOperationBodyParamsServiceImpl(pipeline);
        }

        Response<Void> withItems(String endpoint, String contentType, WithItemsRequest withItemsRequest,
            RequestContext requestContext);
    }

    private static final class ReservedOperationBodyParamsServiceImpl implements ReservedOperationBodyParamsService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(ReservedOperationBodyParamsServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private ReservedOperationBodyParamsServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> withItems(String endpoint, String contentType, WithItemsRequest withItemsRequest,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder
                = io.clientcore.core.utils.UriBuilder.parse(endpoint + "/special-words/operations/body-param-reserved");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.POST)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (withItemsRequest != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(withItemsRequest,
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
                    this.jsonSerializer, this.xmlSerializer, null, null, ReservedOperationBodyParamsServiceImpl.LOGGER);
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
     * The withItems operation.
     * 
     * @param items The items parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withItemsWithResponse(List<String> items, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.ReservedOperationBodyParams.withItems",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                WithItemsRequest withItemsRequest = new WithItemsRequest(items);
                return service.withItems(this.client.getEndpoint(), contentType, withItemsRequest, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ReservedOperationBodyParamsImpl.class);
}
