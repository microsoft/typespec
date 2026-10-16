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
import payload.xml.ModelWithEncodedNames;

/**
 * An instance of this class provides access to all the operations defined in ModelWithEncodedNamesValues.
 */
public final class ModelWithEncodedNamesValuesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelWithEncodedNamesValuesService service;

    /**
     * The service client containing this operation class.
     */
    private final XmlClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ModelWithEncodedNamesValuesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ModelWithEncodedNamesValuesImpl(XmlClientImpl client) {
        this.service = ModelWithEncodedNamesValuesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ModelWithEncodedNamesValuesService {
        static ModelWithEncodedNamesValuesService getNewInstance(HttpPipeline pipeline) {
            return new ModelWithEncodedNamesValuesServiceImpl(pipeline);
        }

        Response<ModelWithEncodedNames> get(String endpoint, String accept, RequestContext requestContext);

        Response<Void> put(String endpoint, String contentType, ModelWithEncodedNames input,
            RequestContext requestContext);
    }

    private static final class ModelWithEncodedNamesValuesServiceImpl implements ModelWithEncodedNamesValuesService {
        private static final ClientLogger LOGGER = new ClientLogger(ModelWithEncodedNamesValuesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private ModelWithEncodedNamesValuesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<ModelWithEncodedNames> get(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.GET).setUri(endpoint + "/payload/xml/modelWithEncodedNames");
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                    this.xmlSerializer, null, null, ModelWithEncodedNamesValuesServiceImpl.LOGGER);
            }
            try {
                ModelWithEncodedNames deserializedResult;
                SerializationFormat responseSerializationFormat
                    = CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult
                        = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                            CoreUtils.createParameterizedType(Response.class, ModelWithEncodedNames.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.xmlSerializer,
                        CoreUtils.createParameterizedType(Response.class, ModelWithEncodedNames.class));
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

        @Override
        public Response<Void> put(String endpoint, String contentType, ModelWithEncodedNames input,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.PUT).setUri(endpoint + "/payload/xml/modelWithEncodedNames");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("content-type"), contentType);
            }
            if (input != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/xml");
                }
                httpRequest.setBody(BinaryData.fromObject(input, this.xmlSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                    this.xmlSerializer, null, null, ModelWithEncodedNamesValuesServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
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
     * @return uses encodedName instead of Xml.Name which is functionally equivalent along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ModelWithEncodedNames> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithEncodedNamesValue.get", requestContext,
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
    public Response<Void> putWithResponse(ModelWithEncodedNames input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Payload.Xml.ModelWithEncodedNamesValue.put", requestContext,
            updatedContext -> {
                final String contentType = "application/xml";
                return service.put(this.client.getEndpoint(), contentType, input, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ModelWithEncodedNamesValuesImpl.class);
}
