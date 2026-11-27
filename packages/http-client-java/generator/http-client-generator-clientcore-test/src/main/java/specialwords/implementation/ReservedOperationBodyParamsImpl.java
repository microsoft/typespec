package specialwords.implementation;

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
import io.clientcore.core.serialization.xml.XmlSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
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

    /**
     * The HTTP operations for SpecialWordsClientReservedOperationBodyParams.
     */
    public interface ReservedOperationBodyParamsService {
        static ReservedOperationBodyParamsService getNewInstance(HttpPipeline pipeline) {
            return new ReservedOperationBodyParamsServiceImpl(pipeline);
        }

        Response<Void> withItems(String endpoint, String contentType, WithItemsRequest withItemsRequest,
            RequestContext requestContext);
    }

    private static final class ReservedOperationBodyParamsServiceImpl implements ReservedOperationBodyParamsService {
        private static final ClientLogger HTTP_LOG = new ClientLogger(ReservedOperationBodyParamsService.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private ReservedOperationBodyParamsServiceImpl(HttpPipeline httpPipeline) {
            this.httpPipeline = httpPipeline;
        }

        @Override
        public Response<Void> withItems(String endpoint, String contentType, WithItemsRequest withItemsRequest,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/special-words/operations/body-param-reserved");
            if (withItemsRequest != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(withItemsRequest,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
            }
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
}
