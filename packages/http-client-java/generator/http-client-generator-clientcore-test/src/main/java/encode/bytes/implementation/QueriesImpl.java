package encode.bytes.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
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
import io.clientcore.core.utils.Base64Uri;
import io.clientcore.core.utils.GeneratedCodeUtils;
import io.clientcore.core.utils.UriBuilder;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

/**
 * An instance of this class provides access to all the operations defined in Queries.
 */
public final class QueriesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final QueriesService service;

    /**
     * The service client containing this operation class.
     */
    private final BytesClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of QueriesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    QueriesImpl(BytesClientImpl client) {
        this.service = QueriesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface QueriesService {
        static QueriesService getNewInstance(HttpPipeline pipeline) {
            return new QueriesServiceImpl(pipeline);
        }

        Response<Void> defaultMethod(String endpoint, String value, RequestContext requestContext);

        Response<Void> base64(String endpoint, String value, RequestContext requestContext);

        Response<Void> base64url(String endpoint, Base64Uri value, RequestContext requestContext);

        Response<Void> base64urlArray(String endpoint, String value, RequestContext requestContext);
    }

    private static final class QueriesServiceImpl implements QueriesService {
        private static final ClientLogger LOGGER = new ClientLogger(QueriesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private QueriesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> defaultMethod(String endpoint, String value, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/bytes/query/default");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "value", true, value, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
            Response<BinaryData> networkResponse
                = ClientCoreProtocolUtils.send(this.httpPipeline, httpRequest, requestContext);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse, JsonSerializer.getInstance(), null,
                    null, null, QueriesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> null);
        }

        @Override
        public Response<Void> base64(String endpoint, String value, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/bytes/query/base64");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "value", true, value, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
            Response<BinaryData> networkResponse
                = ClientCoreProtocolUtils.send(this.httpPipeline, httpRequest, requestContext);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse, JsonSerializer.getInstance(), null,
                    null, null, QueriesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> null);
        }

        @Override
        public Response<Void> base64url(String endpoint, Base64Uri value, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/bytes/query/base64url");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "value", true, value, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
            Response<BinaryData> networkResponse
                = ClientCoreProtocolUtils.send(this.httpPipeline, httpRequest, requestContext);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse, JsonSerializer.getInstance(), null,
                    null, null, QueriesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> null);
        }

        @Override
        public Response<Void> base64urlArray(String endpoint, String value, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/encode/bytes/query/base64url-array");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "value", true, value, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
            Response<BinaryData> networkResponse
                = ClientCoreProtocolUtils.send(this.httpPipeline, httpRequest, requestContext);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse, JsonSerializer.getInstance(), null,
                    null, null, QueriesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> null);
        }
    }

    /**
     * The defaultMethod operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defaultMethodWithResponse(byte[] value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.Query.default", requestContext,
            updatedContext -> {
                String valueConverted = new String(Base64.getEncoder().encode(value));
                return service.defaultMethod(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    /**
     * The base64 operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> base64WithResponse(byte[] value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.Query.base64", requestContext,
            updatedContext -> {
                String valueConverted = new String(Base64.getEncoder().encode(value));
                return service.base64(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    /**
     * The base64url operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> base64urlWithResponse(byte[] value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.Query.base64url", requestContext,
            updatedContext -> {
                Base64Uri valueConverted = Base64Uri.encode(value);
                return service.base64url(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    /**
     * The base64urlArray operation.
     * 
     * @param value The value parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> base64urlArrayWithResponse(List<byte[]> value, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.Query.base64urlArray", requestContext,
            updatedContext -> {
                String valueConverted = value.stream()
                    .map(paramItemValue -> Base64Uri.encode(paramItemValue))
                    .collect(Collectors.toList())
                    .stream()
                    .map(paramItemValue -> {
                        if (paramItemValue == null) {
                            return "";
                        } else {
                            String itemValueString = BinaryData.fromObject(paramItemValue).toString();
                            int strLength = itemValueString.length();
                            int startOffset = 0;
                            while (startOffset < strLength) {
                                if (itemValueString.charAt(startOffset) != '"') {
                                    break;
                                }
                                startOffset++;
                            }
                            if (startOffset == strLength) {
                                return "";
                            }
                            int endOffset = strLength - 1;
                            while (endOffset >= 0) {
                                if (itemValueString.charAt(endOffset) != '"') {
                                    break;
                                }

                                endOffset--;
                            }
                            return itemValueString.substring(startOffset, endOffset + 1);
                        }
                    })
                    .collect(Collectors.joining(","));
                return service.base64urlArray(this.client.getEndpoint(), valueConverted, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(QueriesImpl.class);
}
