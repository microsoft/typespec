package payload.xml.implementation;

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
import java.util.HashMap;
import java.util.Map;
import payload.xml.SimpleModel;
import payload.xml.XmlErrorBody;

/**
 * An instance of this class provides access to all the operations defined in XmlErrorValues.
 */
public final class XmlErrorValuesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final XmlErrorValuesService service;

    /**
     * The service client containing this operation class.
     */
    private final XmlClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of XmlErrorValuesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    XmlErrorValuesImpl(XmlClientImpl client) {
        this.service = XmlErrorValuesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface XmlErrorValuesService {
        static XmlErrorValuesService getNewInstance(HttpPipeline pipeline) {
            return new XmlErrorValuesServiceImpl(pipeline);
        }

        Response<SimpleModel> get(String endpoint, String accept, RequestContext requestContext);
    }

    private static final class XmlErrorValuesServiceImpl implements XmlErrorValuesService {
        private static final ClientLogger LOGGER = new ClientLogger(XmlErrorValuesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private XmlErrorValuesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<SimpleModel> get(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.GET).setUri(endpoint + "/payload/xml/error");
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                Map<Integer, ParameterizedType> statusToExceptionTypeMap = new HashMap<>();
                statusToExceptionTypeMap.put(400, CoreUtils.createParameterizedType(XmlErrorBody.class));
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                    this.xmlSerializer, null, statusToExceptionTypeMap, XmlErrorValuesServiceImpl.LOGGER);
            }
            try {
                SimpleModel deserializedResult;
                SerializationFormat responseSerializationFormat
                    = CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        this.jsonSerializer, CoreUtils.createParameterizedType(Response.class, SimpleModel.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.xmlSerializer,
                        CoreUtils.createParameterizedType(Response.class, SimpleModel.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The get operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return §1.1 — Contains fields of primitive types along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<SimpleModel> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.XmlErrorValue.get", requestContext,
            updatedContext -> {
                final String accept = "application/xml";
                return service.get(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(XmlErrorValuesImpl.class);
}
