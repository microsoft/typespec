package type.scalar.implementation;

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
import java.lang.reflect.ParameterizedType;
import java.math.BigDecimal;
import java.util.List;

/**
 * An instance of this class provides access to all the operations defined in DecimalVerifies.
 */
public final class DecimalVerifiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final DecimalVerifiesService service;

    /**
     * The service client containing this operation class.
     */
    private final ScalarClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of DecimalVerifiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    DecimalVerifiesImpl(ScalarClientImpl client) {
        this.service = DecimalVerifiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    /**
     * The HTTP operations for ScalarClientDecimalVerifies.
     */
    public interface DecimalVerifiesService {
        static DecimalVerifiesService getNewInstance(HttpPipeline pipeline) {
            return new DecimalVerifiesServiceImpl(pipeline);
        }

        Response<List<BigDecimal>> prepareVerify(String endpoint, String accept, RequestContext requestContext);

        Response<Void> verify(String endpoint, String contentType, BigDecimal body, RequestContext requestContext);
    }

    private static final class DecimalVerifiesServiceImpl implements DecimalVerifiesService {
        private static final ClientLogger HTTP_LOG = new ClientLogger(DecimalVerifiesService.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private DecimalVerifiesServiceImpl(HttpPipeline httpPipeline) {
            this.httpPipeline = httpPipeline;
        }

        @Override
        public Response<List<BigDecimal>> prepareVerify(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.GET).setUri(endpoint + "/type/scalar/decimal/prepare_verify");
            if (accept != null) {
                httpRequest.getHeaders().add(HttpHeaderName.fromString("Accept"), accept);
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            boolean expectedResponse = responseCode == 200;
            if (!expectedResponse) {
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                    this.xmlSerializer, null, null, HTTP_LOG);
            }
            return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                this.decodeResponse(networkResponse.getValue(),
                    CoreUtils.createParameterizedType(Response.class,
                        CoreUtils.createParameterizedType(List.class, BigDecimal.class)),
                    CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())));
        }

        @Override
        public Response<Void> verify(String endpoint, String contentType, BigDecimal body,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.POST).setUri(endpoint + "/type/scalar/decimal/verify");
            if (body != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(body,
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

        private <T> T decodeResponse(BinaryData value, ParameterizedType type, SerializationFormat format) {
            if (this.jsonSerializer.supportsFormat(format)) {
                return CoreUtils.decodeNetworkResponse(value, this.jsonSerializer, type);
            }
            if (this.xmlSerializer.supportsFormat(format)) {
                return CoreUtils.decodeNetworkResponse(value, this.xmlSerializer, type);
            }
            throw HTTP_LOG.throwableAtError()
                .addKeyValue("serializationFormat", format.name())
                .log("None of the provided serializers support the format.", UnsupportedOperationException::new);
        }
    }

    /**
     * The prepareVerify operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<List<BigDecimal>> prepareVerifyWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Scalar.DecimalVerify.prepareVerify", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.prepareVerify(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The verify operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> verifyWithResponse(BigDecimal body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Scalar.DecimalVerify.verify", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.verify(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }
}
