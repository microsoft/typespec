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
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.serialization.xml.XmlSerializer;
import io.clientcore.core.utils.CoreUtils;
import payload.xml.ModelWithEnum;

/**
 * An instance of this class provides access to all the operations defined in ModelWithEnumValues.
 */
public final class ModelWithEnumValuesImpl {

    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelWithEnumValuesService service;

    /**
     * The service client containing this operation class.
     */
    private final XmlClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ModelWithEnumValuesImpl.
     *
     * @param client the instance of the service client containing this operation class.
     */
    ModelWithEnumValuesImpl(XmlClientImpl client) {
        this.service = ModelWithEnumValuesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ModelWithEnumValuesService {

        static ModelWithEnumValuesService getNewInstance(HttpPipeline pipeline) {
            return new ModelWithEnumValuesServiceImpl(pipeline);
        }

        Response<ModelWithEnum> get(String endpoint, String accept, RequestContext requestContext);

        Response<Void> put(String endpoint, String contentType, ModelWithEnum input, RequestContext requestContext);
    }

    private static final class ModelWithEnumValuesServiceImpl implements ModelWithEnumValuesService {

        private static final ClientLogger LOGGER = new ClientLogger(ModelWithEnumValuesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private static final JsonSerializer JSON_SERIALIZER = JsonSerializer.getInstance();

        private static final XmlSerializer XML_SERIALIZER = XmlSerializer.getInstance();

        private ModelWithEnumValuesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<ModelWithEnum> get(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.GET).setUri(endpoint + "/payload/xml/modelWithEnum");
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.ACCEPT, accept);
            }
            Response<BinaryData> networkResponse
                = ClientCoreProtocolUtils.send(this.httpPipeline, httpRequest, requestContext);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse,
                    ModelWithEnumValuesServiceImpl.JSON_SERIALIZER, ModelWithEnumValuesServiceImpl.XML_SERIALIZER, null,
                    null, ModelWithEnumValuesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse,
                () -> ClientCoreProtocolUtils.readMixed(networkResponse,
                    () -> CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        ModelWithEnumValuesServiceImpl.JSON_SERIALIZER,
                        PayloadXmlConstants.RESPONSE_OF_MODEL_WITH_ENUM_TYPE),
                    () -> CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        ModelWithEnumValuesServiceImpl.XML_SERIALIZER,
                        PayloadXmlConstants.RESPONSE_OF_MODEL_WITH_ENUM_TYPE)));
        }

        @Override
        public Response<Void> put(String endpoint, String contentType, ModelWithEnum input,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.PUT).setUri(endpoint + "/payload/xml/modelWithEnum");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
            }
            ClientCoreProtocolUtils.setBody(httpRequest, input, "application/xml",
                () -> BinaryData.fromObject(input, ModelWithEnumValuesServiceImpl.XML_SERIALIZER));
            Response<BinaryData> networkResponse
                = ClientCoreProtocolUtils.send(this.httpPipeline, httpRequest, requestContext);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse,
                    ModelWithEnumValuesServiceImpl.JSON_SERIALIZER, ModelWithEnumValuesServiceImpl.XML_SERIALIZER, null,
                    null, ModelWithEnumValuesServiceImpl.LOGGER);
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
     * @return contains a single property with an enum value along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelWithEnum> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithEnumValue.get", requestContext,
            updatedContext -> {
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
    public Response<Void> putWithResponse(ModelWithEnum input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithEnumValue.put", requestContext,
            updatedContext -> {
                final String contentType = "application/xml";
                return service.put(this.client.getEndpoint(), contentType, input, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ModelWithEnumValuesImpl.class);
}
