package parameters.spread.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.implementation.utils.UriEscapers;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import parameters.spread.model.BodyParameter;

/**
 * An instance of this class provides access to all the operations defined in Models.
 */
public final class ModelsImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ModelsService service;

    /**
     * The service client containing this operation class.
     */
    private final SpreadClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ModelsImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ModelsImpl(SpreadClientImpl client) {
        this.service = ModelsService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ModelsService {
        static ModelsService getNewInstance(HttpPipeline pipeline) {
            return new ModelsServiceImpl(pipeline);
        }

        Response<Void> spreadAsRequestBody(String endpoint, String contentType, BodyParameter bodyParameter,
            RequestContext requestContext);

        Response<Void> spreadCompositeRequestOnlyWithBody(String endpoint, String contentType, BodyParameter body,
            RequestContext requestContext);

        Response<Void> spreadCompositeRequestWithoutBody(String endpoint, String name, String testHeader,
            RequestContext requestContext);

        Response<Void> spreadCompositeRequest(String endpoint, String name, String testHeader, String contentType,
            BodyParameter body, RequestContext requestContext);

        Response<Void> spreadCompositeRequestMix(String endpoint, String name, String testHeader, String contentType,
            SpreadCompositeRequestMixRequest spreadCompositeRequestMixRequest, RequestContext requestContext);
    }

    private static final class ModelsServiceImpl implements ModelsService {
        private static final ClientLogger LOGGER = new ClientLogger(ModelsServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private ModelsServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> spreadAsRequestBody(String endpoint, String contentType, BodyParameter bodyParameter,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/parameters/spread/model/request-body");
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (bodyParameter != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(bodyParameter, this.jsonSerializer));
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
                    null, null, ModelsServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> spreadCompositeRequestOnlyWithBody(String endpoint, String contentType,
            BodyParameter body, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/parameters/spread/model/composite-request-only-with-body");
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
                    null, null, ModelsServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> spreadCompositeRequestWithoutBody(String endpoint, String name, String testHeader,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/parameters/spread/model/composite-request-without-body/"
                    + UriEscapers.PATH_ESCAPER.escape(name));
            if (testHeader != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("test-header"), testHeader);
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
                    null, null, ModelsServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> spreadCompositeRequest(String endpoint, String name, String testHeader,
            String contentType, BodyParameter body, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(
                    endpoint + "/parameters/spread/model/composite-request/" + UriEscapers.PATH_ESCAPER.escape(name));
            if (testHeader != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("test-header"), testHeader);
            }
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
                    null, null, ModelsServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> spreadCompositeRequestMix(String endpoint, String name, String testHeader,
            String contentType, SpreadCompositeRequestMixRequest spreadCompositeRequestMixRequest,
            RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/parameters/spread/model/composite-request-mix/"
                    + UriEscapers.PATH_ESCAPER.escape(name));
            if (testHeader != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("test-header"), testHeader);
            }
            if (contentType != null) {
                httpRequest.getHeaders().set(HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (spreadCompositeRequestMixRequest != null) {
                if (httpRequest.getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                httpRequest.setBody(BinaryData.fromObject(spreadCompositeRequestMixRequest, this.jsonSerializer));
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
                    null, null, ModelsServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The spreadAsRequestBody operation.
     * 
     * @param name The name parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadAsRequestBodyWithResponse(String name, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Model.spreadAsRequestBody",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                BodyParameter bodyParameter = new BodyParameter(name);
                return service.spreadAsRequestBody(this.client.getEndpoint(), contentType, bodyParameter,
                    updatedContext);
            });
    }

    /**
     * The spreadCompositeRequestOnlyWithBody operation.
     * 
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadCompositeRequestOnlyWithBodyWithResponse(BodyParameter body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Model.spreadCompositeRequestOnlyWithBody",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.spreadCompositeRequestOnlyWithBody(this.client.getEndpoint(), contentType, body,
                    updatedContext);
            });
    }

    /**
     * The spreadCompositeRequestWithoutBody operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadCompositeRequestWithoutBodyWithResponse(String name, String testHeader,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Model.spreadCompositeRequestWithoutBody",
            requestContext, updatedContext -> {
                return service.spreadCompositeRequestWithoutBody(this.client.getEndpoint(), name, testHeader,
                    updatedContext);
            });
    }

    /**
     * The spreadCompositeRequest operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param body The body parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadCompositeRequestWithResponse(String name, String testHeader, BodyParameter body,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Model.spreadCompositeRequest",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.spreadCompositeRequest(this.client.getEndpoint(), name, testHeader, contentType, body,
                    updatedContext);
            });
    }

    /**
     * The spreadCompositeRequestMix operation.
     * 
     * @param name The name parameter.
     * @param testHeader The testHeader parameter.
     * @param prop The prop parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> spreadCompositeRequestMixWithResponse(String name, String testHeader, String prop,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Parameters.Spread.Model.spreadCompositeRequestMix",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                SpreadCompositeRequestMixRequest spreadCompositeRequestMixRequest
                    = new SpreadCompositeRequestMixRequest(prop);
                return service.spreadCompositeRequestMix(this.client.getEndpoint(), name, testHeader, contentType,
                    spreadCompositeRequestMixRequest, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ModelsImpl.class);
}
