package type.array.implementation;

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
import io.clientcore.core.models.CoreException;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import java.io.IOException;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * An instance of this class provides access to all the operations defined in DatetimeValues.
 */
public final class DatetimeValuesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final DatetimeValuesService service;

    /**
     * The service client containing this operation class.
     */
    private final ArrayClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of DatetimeValuesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    DatetimeValuesImpl(ArrayClientImpl client) {
        this.service = DatetimeValuesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface DatetimeValuesService {
        static DatetimeValuesService getNewInstance(HttpPipeline pipeline) {
            return new DatetimeValuesServiceImpl(pipeline);
        }

        Response<List<OffsetDateTime>> get(String endpoint, String accept, RequestContext requestContext);

        Response<Void> put(String endpoint, String contentType, List<OffsetDateTime> body,
            RequestContext requestContext);
    }

    private static final class DatetimeValuesServiceImpl implements DatetimeValuesService {
        private static final ClientLogger LOGGER = new ClientLogger(DatetimeValuesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private DatetimeValuesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<List<OffsetDateTime>> get(String endpoint, String accept, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.GET).setUri(endpoint + "/type/array/datetime");
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
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, DatetimeValuesServiceImpl.LOGGER);
            }
            try {
                List<OffsetDateTime> deserializedResult;
                byte[] responseBodyBytes
                    = networkResponse.getValue() == null ? null : networkResponse.getValue().toBytes();
                if (responseBodyBytes == null || responseBodyBytes.length == 0) {
                    deserializedResult = null;
                } else {
                    try (JsonReader jsonReader = JsonReader.fromBytes(responseBodyBytes)) {
                        deserializedResult = jsonReader.nextToken() == null
                            ? null
                            : jsonReader.readArray(elementReader -> elementReader
                                .getNullable(nonNullReader -> OffsetDateTime.parse(nonNullReader.getString())));
                    } catch (IOException exception) {
                        throw LOGGER.throwableAtError().log(exception, CoreException::from);
                    }

                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                    deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> put(String endpoint, String contentType, List<OffsetDateTime> body,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.PUT).setUri(endpoint + "/type/array/datetime");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (body != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(body, this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                if (CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())
                    == SerializationFormat.XML) {
                    try {
                        throw new HttpResponseException("Unexpected XML response.", networkResponse, (Object) null);
                    } finally {
                        networkResponse.close();
                    }
                }
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer, null,
                    null, null, DatetimeValuesServiceImpl.LOGGER);
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
     * @return the response body along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<List<OffsetDateTime>> getWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Array.DatetimeValue.get", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.get(this.client.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The put operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putWithResponse(List<OffsetDateTime> body, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Array.DatetimeValue.put", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.put(this.client.getEndpoint(), contentType, body, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(DatetimeValuesImpl.class);
}
