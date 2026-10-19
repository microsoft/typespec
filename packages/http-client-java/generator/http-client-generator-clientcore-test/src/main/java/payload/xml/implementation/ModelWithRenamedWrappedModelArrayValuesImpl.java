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
import payload.xml.ModelWithRenamedWrappedModelArray;

/**
 * An instance of this class provides access to all the operations defined in ModelWithRenamedWrappedModelArrayValues.
 */
public final class ModelWithRenamedWrappedModelArrayValuesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelWithRenamedWrappedModelArrayValuesService service;

    /**
     * The service client containing this operation class.
     */
    private final XmlClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ModelWithRenamedWrappedModelArrayValuesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ModelWithRenamedWrappedModelArrayValuesImpl(XmlClientImpl client) {
        this.service = ModelWithRenamedWrappedModelArrayValuesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ModelWithRenamedWrappedModelArrayValuesService {
        static ModelWithRenamedWrappedModelArrayValuesService getNewInstance(HttpPipeline pipeline) {
            return new ModelWithRenamedWrappedModelArrayValuesServiceImpl(pipeline);
        }

        Response<ModelWithRenamedWrappedModelArray> get(String endpoint, String accept, RequestContext requestContext);

        Response<Void> put(String endpoint, String contentType, ModelWithRenamedWrappedModelArray input,
            RequestContext requestContext);
    }

    private static final class ModelWithRenamedWrappedModelArrayValuesServiceImpl
        implements ModelWithRenamedWrappedModelArrayValuesService {
        private static final ClientLogger LOGGER
            = new ClientLogger(ModelWithRenamedWrappedModelArrayValuesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private static final JsonSerializer JSON_SERIALIZER = JsonSerializer.getInstance();

        private static final XmlSerializer XML_SERIALIZER = XmlSerializer.getInstance();

        private ModelWithRenamedWrappedModelArrayValuesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<ModelWithRenamedWrappedModelArray> get(String endpoint, String accept,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET)
                .setUri(endpoint + "/payload/xml/modelWithRenamedWrappedModelArray");
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
                    ModelWithRenamedWrappedModelArrayValuesServiceImpl.JSON_SERIALIZER,
                    ModelWithRenamedWrappedModelArrayValuesServiceImpl.XML_SERIALIZER, null, null,
                    ModelWithRenamedWrappedModelArrayValuesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> {
                ModelWithRenamedWrappedModelArray deserializedResult;
                SerializationFormat responseSerializationFormat
                    = CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders());
                if (ModelWithRenamedWrappedModelArrayValuesServiceImpl.JSON_SERIALIZER
                    .supportsFormat(responseSerializationFormat)) {
                    deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        ModelWithRenamedWrappedModelArrayValuesServiceImpl.JSON_SERIALIZER,
                        CoreUtils.createParameterizedType(Response.class, ModelWithRenamedWrappedModelArray.class));
                } else if (ModelWithRenamedWrappedModelArrayValuesServiceImpl.XML_SERIALIZER
                    .supportsFormat(responseSerializationFormat)) {
                    deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(),
                        ModelWithRenamedWrappedModelArrayValuesServiceImpl.XML_SERIALIZER,
                        CoreUtils.createParameterizedType(Response.class, ModelWithRenamedWrappedModelArray.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return deserializedResult;
            });
        }

        @Override
        public Response<Void> put(String endpoint, String contentType, ModelWithRenamedWrappedModelArray input,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/payload/xml/modelWithRenamedWrappedModelArray");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("content-type"), contentType);
            }
            if (input != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/xml");
                }
                httpRequest.setBody(
                    BinaryData.fromObject(input, ModelWithRenamedWrappedModelArrayValuesServiceImpl.XML_SERIALIZER));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse,
                    ModelWithRenamedWrappedModelArrayValuesServiceImpl.JSON_SERIALIZER,
                    ModelWithRenamedWrappedModelArrayValuesServiceImpl.XML_SERIALIZER, null, null,
                    ModelWithRenamedWrappedModelArrayValuesServiceImpl.LOGGER);
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
     * @return §4.3 — Contains a wrapped array of models with a custom wrapper name along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelWithRenamedWrappedModelArray> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithRenamedWrappedModelArrayValue.get",
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
    public Response<Void> putWithResponse(ModelWithRenamedWrappedModelArray input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithRenamedWrappedModelArrayValue.put",
            requestContext, updatedContext -> {
                final String contentType = "application/xml";
                return service.put(this.client.getEndpoint(), contentType, input, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ModelWithRenamedWrappedModelArrayValuesImpl.class);
}
