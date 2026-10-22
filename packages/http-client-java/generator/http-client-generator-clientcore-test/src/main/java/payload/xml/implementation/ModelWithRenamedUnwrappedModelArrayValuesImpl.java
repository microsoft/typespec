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
import payload.xml.ModelWithRenamedUnwrappedModelArray;

/**
 * An instance of this class provides access to all the operations defined in ModelWithRenamedUnwrappedModelArrayValues.
 */
public final class ModelWithRenamedUnwrappedModelArrayValuesImpl {

    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelWithRenamedUnwrappedModelArrayValuesService service;

    /**
     * The service client containing this operation class.
     */
    private final XmlClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ModelWithRenamedUnwrappedModelArrayValuesImpl.
     *
     * @param client the instance of the service client containing this operation class.
     */
    ModelWithRenamedUnwrappedModelArrayValuesImpl(XmlClientImpl client) {
        this.service = ModelWithRenamedUnwrappedModelArrayValuesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ModelWithRenamedUnwrappedModelArrayValuesService {

        static ModelWithRenamedUnwrappedModelArrayValuesService getNewInstance(HttpPipeline pipeline) {
            return new ModelWithRenamedUnwrappedModelArrayValuesServiceImpl(pipeline);
        }

        Response<ModelWithRenamedUnwrappedModelArray> get(String endpoint, String accept,
            RequestContext requestContext);

        Response<Void> put(String endpoint, String contentType, ModelWithRenamedUnwrappedModelArray input,
            RequestContext requestContext);
    }

    private static final class ModelWithRenamedUnwrappedModelArrayValuesServiceImpl
        implements ModelWithRenamedUnwrappedModelArrayValuesService {

        private static final ClientLogger LOGGER
            = new ClientLogger(ModelWithRenamedUnwrappedModelArrayValuesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private static final JsonSerializer JSON_SERIALIZER = JsonSerializer.getInstance();

        private static final XmlSerializer XML_SERIALIZER = XmlSerializer.getInstance();

        private ModelWithRenamedUnwrappedModelArrayValuesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<ModelWithRenamedUnwrappedModelArray> get(String endpoint, String accept,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/payload/xml/modelWithRenamedUnwrappedModelArray");
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.ACCEPT, accept);
            }
            Response<BinaryData> networkResponse
                = ClientCoreProtocolUtils.send(this.httpPipeline, httpRequest, requestContext);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse,
                    ModelWithRenamedUnwrappedModelArrayValuesServiceImpl.JSON_SERIALIZER,
                    ModelWithRenamedUnwrappedModelArrayValuesServiceImpl.XML_SERIALIZER, null, null,
                    ModelWithRenamedUnwrappedModelArrayValuesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse,
                () -> ClientCoreProtocolUtils.readMixed(networkResponse,
                    () -> CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        ModelWithRenamedUnwrappedModelArrayValuesServiceImpl.JSON_SERIALIZER,
                        PayloadXmlConstants.RESPONSE_OF_MODEL_WITH_RENAMED_UNWRAPPED_MODEL_ARRAY_TYPE),
                    () -> CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        ModelWithRenamedUnwrappedModelArrayValuesServiceImpl.XML_SERIALIZER,
                        PayloadXmlConstants.RESPONSE_OF_MODEL_WITH_RENAMED_UNWRAPPED_MODEL_ARRAY_TYPE)));
        }

        @Override
        public Response<Void> put(String endpoint, String contentType, ModelWithRenamedUnwrappedModelArray input,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/payload/xml/modelWithRenamedUnwrappedModelArray");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
            }
            ClientCoreProtocolUtils.setBody(httpRequest, input, "application/xml", () -> BinaryData.fromObject(input,
                ModelWithRenamedUnwrappedModelArrayValuesServiceImpl.XML_SERIALIZER));
            Response<BinaryData> networkResponse
                = ClientCoreProtocolUtils.send(this.httpPipeline, httpRequest, requestContext);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse,
                    ModelWithRenamedUnwrappedModelArrayValuesServiceImpl.JSON_SERIALIZER,
                    ModelWithRenamedUnwrappedModelArrayValuesServiceImpl.XML_SERIALIZER, null, null,
                    ModelWithRenamedUnwrappedModelArrayValuesServiceImpl.LOGGER);
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
     * @return §4.4 — Contains an unwrapped array of models with a custom item name along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelWithRenamedUnwrappedModelArray> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithRenamedUnwrappedModelArrayValue.get",
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
    public Response<Void> putWithResponse(ModelWithRenamedUnwrappedModelArray input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithRenamedUnwrappedModelArrayValue.put",
            requestContext, updatedContext -> {
                final String contentType = "application/xml";
                return service.put(this.client.getEndpoint(), contentType, input, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ModelWithRenamedUnwrappedModelArrayValuesImpl.class);
}
