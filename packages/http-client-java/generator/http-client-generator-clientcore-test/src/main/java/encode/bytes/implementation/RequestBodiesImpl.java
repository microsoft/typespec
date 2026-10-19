package encode.bytes.implementation;

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
import io.clientcore.core.utils.Base64Uri;

/**
 * An instance of this class provides access to all the operations defined in RequestBodies.
 */
public final class RequestBodiesImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final RequestBodiesService service;

    /**
     * The service client containing this operation class.
     */
    private final BytesClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of RequestBodiesImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    RequestBodiesImpl(BytesClientImpl client) {
        this.service = RequestBodiesService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface RequestBodiesService {
        static RequestBodiesService getNewInstance(HttpPipeline pipeline) {
            return new RequestBodiesServiceImpl(pipeline);
        }

        Response<Void> defaultMethod(String endpoint, String contentType, BinaryData value, long contentLength,
            RequestContext requestContext);

        Response<Void> octetStream(String endpoint, String contentType, BinaryData value, long contentLength,
            RequestContext requestContext);

        Response<Void> customContentType(String endpoint, String contentType, BinaryData value, long contentLength,
            RequestContext requestContext);

        Response<Void> base64(String endpoint, String contentType, byte[] value, RequestContext requestContext);

        Response<Void> base64url(String endpoint, String contentType, Base64Uri value, RequestContext requestContext);
    }

    private static final class RequestBodiesServiceImpl implements RequestBodiesService {
        private static final ClientLogger LOGGER = new ClientLogger(RequestBodiesServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private static final JsonSerializer JSON_SERIALIZER = JsonSerializer.getInstance();

        private RequestBodiesServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> defaultMethod(String endpoint, String contentType, BinaryData value, long contentLength,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.POST).setUri(endpoint + "/encode/bytes/body/request/default");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Length"), String.valueOf(contentLength));
            if (value != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/octet-stream");
                }
                httpRequest.setBody(value);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse,
                    RequestBodiesServiceImpl.JSON_SERIALIZER, null, null, null, RequestBodiesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> null);
        }

        @Override
        public Response<Void> octetStream(String endpoint, String contentType, BinaryData value, long contentLength,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/encode/bytes/body/request/octet-stream");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("content-type"), contentType);
            }
            httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Length"), String.valueOf(contentLength));
            if (value != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/octet-stream");
                }
                httpRequest.setBody(value);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse,
                    RequestBodiesServiceImpl.JSON_SERIALIZER, null, null, null, RequestBodiesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> null);
        }

        @Override
        public Response<Void> customContentType(String endpoint, String contentType, BinaryData value,
            long contentLength, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/encode/bytes/body/request/custom-content-type");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("content-type"), contentType);
            }
            httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Length"), String.valueOf(contentLength));
            if (value != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "image/png");
                }
                httpRequest.setBody(value);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse,
                    RequestBodiesServiceImpl.JSON_SERIALIZER, null, null, null, RequestBodiesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> null);
        }

        @Override
        public Response<Void> base64(String endpoint, String contentType, byte[] value, RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.POST).setUri(endpoint + "/encode/bytes/body/request/base64");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("content-type"), contentType);
            }
            if (value != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(value, RequestBodiesServiceImpl.JSON_SERIALIZER));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse,
                    RequestBodiesServiceImpl.JSON_SERIALIZER, null, null, null, RequestBodiesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> null);
        }

        @Override
        public Response<Void> base64url(String endpoint, String contentType, Base64Uri value,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.POST)
                .setUri(endpoint + "/encode/bytes/body/request/base64url");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("content-type"), contentType);
            }
            if (value != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(value, RequestBodiesServiceImpl.JSON_SERIALIZER));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                ClientCoreProtocolUtils.handleUnexpectedResponse(networkResponse,
                    RequestBodiesServiceImpl.JSON_SERIALIZER, null, null, null, RequestBodiesServiceImpl.LOGGER);
            }
            return ClientCoreProtocolUtils.mapResponse(networkResponse, () -> null);
        }
    }

    /**
     * The defaultMethod operation.
     * 
     * @param value The value parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> defaultMethodWithResponse(BinaryData value, long contentLength,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.RequestBody.default", requestContext,
            updatedContext -> {
                final String contentType = "application/octet-stream";
                return service.defaultMethod(this.client.getEndpoint(), contentType, value, contentLength,
                    updatedContext);
            });
    }

    /**
     * The octetStream operation.
     * 
     * @param value The value parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> octetStreamWithResponse(BinaryData value, long contentLength, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.RequestBody.octetStream", requestContext,
            updatedContext -> {
                final String contentType = "application/octet-stream";
                return service.octetStream(this.client.getEndpoint(), contentType, value, contentLength,
                    updatedContext);
            });
    }

    /**
     * The customContentType operation.
     * 
     * @param value The value parameter.
     * @param contentLength The Content-Length header for the request.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> customContentTypeWithResponse(BinaryData value, long contentLength,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.RequestBody.customContentType", requestContext,
            updatedContext -> {
                final String contentType = "image/png";
                return service.customContentType(this.client.getEndpoint(), contentType, value, contentLength,
                    updatedContext);
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
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.RequestBody.base64", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.base64(this.client.getEndpoint(), contentType, value, updatedContext);
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
        return this.instrumentation.instrumentWithResponse("Encode.Bytes.RequestBody.base64url", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                Base64Uri valueConverted = Base64Uri.encode(value);
                return service.base64url(this.client.getEndpoint(), contentType, valueConverted, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(RequestBodiesImpl.class);
}
