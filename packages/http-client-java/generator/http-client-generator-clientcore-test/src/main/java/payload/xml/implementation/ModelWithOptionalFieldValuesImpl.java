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
import payload.xml.ModelWithOptionalField;

/**
 * An instance of this class provides access to all the operations defined in ModelWithOptionalFieldValues.
 */
public final class ModelWithOptionalFieldValuesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelWithOptionalFieldValuesService service;

    /**
     * The service client containing this operation class.
     */
    private final XmlClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ModelWithOptionalFieldValuesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ModelWithOptionalFieldValuesImpl(XmlClientImpl client) {
        this.service = ModelWithOptionalFieldValuesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ModelWithOptionalFieldValuesService {
        static ModelWithOptionalFieldValuesService getNewInstance(HttpPipeline pipeline) {
            return new ModelWithOptionalFieldValuesServiceImpl(pipeline);
        }

        Response<ModelWithOptionalField> get(String endpoint, String accept, RequestContext requestContext);

        Response<Void> put(String endpoint, String contentType, ModelWithOptionalField input,
            RequestContext requestContext);
    }

    private static final class ModelWithOptionalFieldValuesServiceImpl implements ModelWithOptionalFieldValuesService {
        private static final ClientLogger LOGGER = new ClientLogger(ModelWithOptionalFieldValuesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private static final JsonSerializer JSON_SERIALIZER = JsonSerializer.getInstance();

        private static final XmlSerializer XML_SERIALIZER = XmlSerializer.getInstance();

        private ModelWithOptionalFieldValuesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<ModelWithOptionalField> get(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.GET).setUri(endpoint + "/payload/xml/modelWithOptionalField");
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
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse,
                    ModelWithOptionalFieldValuesServiceImpl.JSON_SERIALIZER,
                    ModelWithOptionalFieldValuesServiceImpl.XML_SERIALIZER, null, null,
                    ModelWithOptionalFieldValuesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> {
                ModelWithOptionalField deserializedResult;
                SerializationFormat responseSerializationFormat
                    = CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders());
                if (ModelWithOptionalFieldValuesServiceImpl.JSON_SERIALIZER
                    .supportsFormat(responseSerializationFormat)) {
                    deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        ModelWithOptionalFieldValuesServiceImpl.JSON_SERIALIZER,
                        CoreUtils.createParameterizedType(Response.class, ModelWithOptionalField.class));
                } else if (ModelWithOptionalFieldValuesServiceImpl.XML_SERIALIZER
                    .supportsFormat(responseSerializationFormat)) {
                    deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        ModelWithOptionalFieldValuesServiceImpl.XML_SERIALIZER,
                        CoreUtils.createParameterizedType(Response.class, ModelWithOptionalField.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return deserializedResult;
            });
        }

        @Override
        public Response<Void> put(String endpoint, String contentType, ModelWithOptionalField input,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.PUT).setUri(endpoint + "/payload/xml/modelWithOptionalField");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("content-type"), contentType);
            }
            if (input != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/xml");
                }
                httpRequest
                    .setBody(BinaryData.fromObject(input, ModelWithOptionalFieldValuesServiceImpl.XML_SERIALIZER));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse,
                    ModelWithOptionalFieldValuesServiceImpl.JSON_SERIALIZER,
                    ModelWithOptionalFieldValuesServiceImpl.XML_SERIALIZER, null, null,
                    ModelWithOptionalFieldValuesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> null);
        }
    }

    /**
     * The get operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return contains an optional field along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelWithOptionalField> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithOptionalFieldValue.get",
            requestContext, updatedContext -> {
                final String accept = "application/xml";
                return service.get(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The put operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putWithResponse(ModelWithOptionalField input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithOptionalFieldValue.put",
            requestContext, updatedContext -> {
                final String contentType = "application/xml";
                return service.put(this.client.getEndpoint(), contentType, input, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ModelWithOptionalFieldValuesImpl.class);
}
