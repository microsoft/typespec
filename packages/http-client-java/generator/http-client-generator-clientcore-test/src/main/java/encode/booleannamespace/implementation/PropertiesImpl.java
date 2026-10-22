package encode.booleannamespace.implementation;

import encode.booleannamespace.property.BoolAsStringProperty;
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
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;

/**
 * An instance of this class provides access to all the operations defined in Properties.
 */
public final class PropertiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final PropertiesService service;

    /**
     * The service client containing this operation class.
     */
    private final BooleanClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of PropertiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    PropertiesImpl(BooleanClientImpl client) {
        this.service = PropertiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface PropertiesService {
        static PropertiesService getNewInstance(HttpPipeline pipeline) {
            return new PropertiesServiceImpl(pipeline);
        }

        Response<BoolAsStringProperty> trueLower(String endpoint, String contentType, String accept,
            BoolAsStringProperty value, RequestContext requestContext);

        Response<BoolAsStringProperty> falseLower(String endpoint, String contentType, String accept,
            BoolAsStringProperty value, RequestContext requestContext);

        Response<BoolAsStringProperty> trueUpper(String endpoint, String contentType, String accept,
            BoolAsStringProperty value, RequestContext requestContext);

        Response<BoolAsStringProperty> falseMixed(String endpoint, String contentType, String accept,
            BoolAsStringProperty value, RequestContext requestContext);
    }

    private static final class PropertiesServiceImpl implements PropertiesService {
        private static final ClientLogger LOGGER = new ClientLogger(PropertiesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private PropertiesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<BoolAsStringProperty> trueLower(String endpoint, String contentType, String accept,
            BoolAsStringProperty value, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.POST).setUri(endpoint + "/encode/boolean/property/true-lower");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (value != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(value, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                BoolAsStringProperty deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, BoolAsStringProperty.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<BoolAsStringProperty> falseLower(String endpoint, String contentType, String accept,
            BoolAsStringProperty value, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/encode/boolean/property/false-lower");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (value != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(value, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                BoolAsStringProperty deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, BoolAsStringProperty.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<BoolAsStringProperty> trueUpper(String endpoint, String contentType, String accept,
            BoolAsStringProperty value, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.POST).setUri(endpoint + "/encode/boolean/property/true-upper");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (value != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(value, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                BoolAsStringProperty deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, BoolAsStringProperty.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<BoolAsStringProperty> falseMixed(String endpoint, String contentType, String accept,
            BoolAsStringProperty value, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/encode/boolean/property/false-mixed");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (accept != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Accept"), accept);
            }
            if (value != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(value, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, PropertiesServiceImpl.LOGGER);
            }
            try {
                BoolAsStringProperty deserializedResult;
                deserializedResult = CoreUtils.decodeNetworkResponse(networkResponse.getValue(), this.jsonSerializer,
                    CoreUtils.createParameterizedType(Response.class, BoolAsStringProperty.class));
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The trueLower operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BoolAsStringProperty> trueLowerWithResponse(BoolAsStringProperty value,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Boolean.Property.trueLower", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.trueLower(this.client.getEndpoint(), contentType, accept, value, updatedContext);
            });
    }

    /**
     * The falseLower operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BoolAsStringProperty> falseLowerWithResponse(BoolAsStringProperty value,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Boolean.Property.falseLower", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.falseLower(this.client.getEndpoint(), contentType, accept, value, updatedContext);
            });
    }

    /**
     * The trueUpper operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BoolAsStringProperty> trueUpperWithResponse(BoolAsStringProperty value,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Boolean.Property.trueUpper", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.trueUpper(this.client.getEndpoint(), contentType, accept, value, updatedContext);
            });
    }

    /**
     * The falseMixed operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<BoolAsStringProperty> falseMixedWithResponse(BoolAsStringProperty value,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Boolean.Property.falseMixed", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.falseMixed(this.client.getEndpoint(), contentType, accept, value, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(PropertiesImpl.class);
}
