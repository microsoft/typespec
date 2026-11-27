package type.model.visibility.implementation;

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
import io.clientcore.core.utils.UriBuilder;
import java.lang.reflect.ParameterizedType;
import type.model.visibility.ReadOnlyModel;
import type.model.visibility.VisibilityModel;

/**
 * Initializes a new instance of the VisibilityClient type.
 */
public final class VisibilityClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final VisibilityClientService service;

    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Gets The instance of instrumentation to report telemetry.
     * 
     * @return the instrumentation value.
     */
    public Instrumentation getInstrumentation() {
        return this.instrumentation;
    }

    /**
     * Initializes an instance of VisibilityClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public VisibilityClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = VisibilityClientService.getNewInstance(this.httpPipeline);
    }

    /**
     * The HTTP operations for VisibilityClient.
     */
    public interface VisibilityClientService {
        static VisibilityClientService getNewInstance(HttpPipeline pipeline) {
            return new VisibilityClientServiceImpl(pipeline);
        }

        Response<VisibilityModel> getModel(String endpoint, int queryProp, String contentType, String accept,
            VisibilityModel input, RequestContext requestContext);

        Response<Void> headModel(String endpoint, int queryProp, String contentType, VisibilityModel input,
            RequestContext requestContext);

        Response<Void> putModel(String endpoint, String contentType, VisibilityModel input,
            RequestContext requestContext);

        Response<Void> patchModel(String endpoint, String contentType, VisibilityModel input,
            RequestContext requestContext);

        Response<Void> postModel(String endpoint, String contentType, VisibilityModel input,
            RequestContext requestContext);

        Response<Void> deleteModel(String endpoint, String contentType, VisibilityModel input,
            RequestContext requestContext);

        Response<ReadOnlyModel> putReadOnlyModel(String endpoint, String contentType, String accept,
            ReadOnlyModel input, RequestContext requestContext);
    }

    private static final class VisibilityClientServiceImpl implements VisibilityClientService {
        private static final ClientLogger HTTP_LOG = new ClientLogger(VisibilityClientService.class);

        private final HttpPipeline httpPipeline;

        private final JsonSerializer jsonSerializer = JsonSerializer.getInstance();

        private final XmlSerializer xmlSerializer = XmlSerializer.getInstance();

        private VisibilityClientServiceImpl(HttpPipeline httpPipeline) {
            this.httpPipeline = httpPipeline;
        }

        @Override
        public Response<VisibilityModel> getModel(String endpoint, int queryProp, String contentType, String accept,
            VisibilityModel input, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/type/model/visibility");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "queryProp", true, queryProp, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders().add(HttpHeaderName.fromString("Accept"), accept);
            }
            if (input != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(input,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            boolean expectedResponse = responseCode == 200;
            if (!expectedResponse) {
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                    this.xmlSerializer, null, null, HTTP_LOG);
            }
            return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                this.decodeResponse(networkResponse.getValue(),
                    CoreUtils.createParameterizedType(Response.class, VisibilityModel.class),
                    CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())));
        }

        @Override
        public Response<Void> headModel(String endpoint, int queryProp, String contentType, VisibilityModel input,
            RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/type/model/visibility");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "queryProp", true, queryProp, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.HEAD).setUri(uriBuilder.toString());
            if (input != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(input,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 200;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null, null, HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }

        @Override
        public Response<Void> putModel(String endpoint, String contentType, VisibilityModel input,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.PUT).setUri(endpoint + "/type/model/visibility");
            if (input != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(input,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null, null, HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }

        @Override
        public Response<Void> patchModel(String endpoint, String contentType, VisibilityModel input,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.PATCH).setUri(endpoint + "/type/model/visibility");
            if (input != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(input,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null, null, HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }

        @Override
        public Response<Void> postModel(String endpoint, String contentType, VisibilityModel input,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.POST).setUri(endpoint + "/type/model/visibility");
            if (input != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(input,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null, null, HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }

        @Override
        public Response<Void> deleteModel(String endpoint, String contentType, VisibilityModel input,
            RequestContext requestContext) {
            HttpRequest httpRequest
                = new HttpRequest().setMethod(HttpMethod.DELETE).setUri(endpoint + "/type/model/visibility");
            if (input != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(input,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            try (Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest)) {
                int responseCode = networkResponse.getStatusCode();
                boolean expectedResponse = responseCode == 204;
                if (!expectedResponse) {
                    GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                        this.xmlSerializer, null, null, HTTP_LOG);
                }
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            }
        }

        @Override
        public Response<ReadOnlyModel> putReadOnlyModel(String endpoint, String contentType, String accept,
            ReadOnlyModel input, RequestContext requestContext) {
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.PUT)
                .setUri(endpoint + "/type/model/visibility/readonlyroundtrip");
            if (accept != null) {
                httpRequest.getHeaders().add(HttpHeaderName.fromString("Accept"), accept);
            }
            if (input != null) {
                httpRequest.getHeaders().set(HttpHeaderName.CONTENT_TYPE, contentType);
                SerializationFormat requestFormat
                    = CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(BinaryData.fromObject(input,
                    this.xmlSerializer.supportsFormat(requestFormat) ? this.xmlSerializer : this.jsonSerializer));
            }
            httpRequest.setContext(requestContext);
            httpRequest.getContext().getRequestCallback().accept(httpRequest);
            Response<BinaryData> networkResponse = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            boolean expectedResponse = responseCode == 200;
            if (!expectedResponse) {
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, this.jsonSerializer,
                    this.xmlSerializer, null, null, HTTP_LOG);
            }
            return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(),
                this.decodeResponse(networkResponse.getValue(),
                    CoreUtils.createParameterizedType(Response.class, ReadOnlyModel.class),
                    CoreUtils.serializationFormatFromContentType(networkResponse.getHeaders())));
        }

        private <T> T decodeResponse(BinaryData value, ParameterizedType type, SerializationFormat format) {
            if (this.jsonSerializer.supportsFormat(format)) {
                return CoreUtils.decodeNetworkResponse(value, this.jsonSerializer, type);
            }
            if (this.xmlSerializer.supportsFormat(format)) {
                return CoreUtils.decodeNetworkResponse(value, this.xmlSerializer, type);
            }
            throw HTTP_LOG.throwableAtError()
                .addKeyValue("serializationFormat", format.name())
                .log("None of the provided serializers support the format.", UnsupportedOperationException::new);
        }
    }

    /**
     * The getModel operation.
     * 
     * @param queryProp Required int32, illustrating a query property.
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return output model with visibility properties along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<VisibilityModel> getModelWithResponse(int queryProp, VisibilityModel input,
        RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.getModel", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.getModel(this.getEndpoint(), queryProp, contentType, accept, input, updatedContext);
            });
    }

    /**
     * The headModel operation.
     * 
     * @param queryProp Required int32, illustrating a query property.
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> headModelWithResponse(int queryProp, VisibilityModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.headModel", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.headModel(this.getEndpoint(), queryProp, contentType, input, updatedContext);
            });
    }

    /**
     * The putModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putModelWithResponse(VisibilityModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.putModel", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.putModel(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * The patchModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> patchModelWithResponse(VisibilityModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.patchModel", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.patchModel(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * The postModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> postModelWithResponse(VisibilityModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.postModel", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.postModel(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * The deleteModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> deleteModelWithResponse(VisibilityModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.deleteModel", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                return service.deleteModel(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * The putReadOnlyModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return roundTrip model with readonly optional properties along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<ReadOnlyModel> putReadOnlyModelWithResponse(ReadOnlyModel input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Visibility.putReadOnlyModel", requestContext,
            updatedContext -> {
                final String contentType = "application/json";
                final String accept = "application/json";
                return service.putReadOnlyModel(this.getEndpoint(), contentType, accept, input, updatedContext);
            });
    }
}
