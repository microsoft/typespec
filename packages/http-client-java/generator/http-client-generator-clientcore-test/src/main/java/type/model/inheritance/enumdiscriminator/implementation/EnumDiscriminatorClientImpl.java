package type.model.inheritance.enumdiscriminator.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import type.model.inheritance.enumdiscriminator.Dog;
import type.model.inheritance.enumdiscriminator.Snake;

/**
 * Initializes a new instance of the EnumDiscriminatorClient type.
 */
public final class EnumDiscriminatorClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final EnumDiscriminatorClientService service;

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
     * Initializes an instance of EnumDiscriminatorClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public EnumDiscriminatorClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = EnumDiscriminatorClientService.getNewInstance(this.httpPipeline);
    }

    public interface EnumDiscriminatorClientService {
        static EnumDiscriminatorClientService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new EnumDiscriminatorClientServiceImpl(pipeline);
        }

        Response<Dog> getExtensibleModel(String endpoint, String accept, RequestContext requestContext);

        Response<Void> putExtensibleModel(String endpoint, String contentType, Dog input,
            RequestContext requestContext);

        Response<Dog> getExtensibleModelMissingDiscriminator(String endpoint, String accept,
            RequestContext requestContext);

        Response<Dog> getExtensibleModelWrongDiscriminator(String endpoint, String accept,
            RequestContext requestContext);

        Response<Snake> getFixedModel(String endpoint, String accept, RequestContext requestContext);

        Response<Void> putFixedModel(String endpoint, String contentType, Snake input, RequestContext requestContext);

        Response<Snake> getFixedModelMissingDiscriminator(String endpoint, String accept,
            RequestContext requestContext);

        Response<Snake> getFixedModelWrongDiscriminator(String endpoint, String accept, RequestContext requestContext);
    }

    private static final class EnumDiscriminatorClientServiceImpl implements EnumDiscriminatorClientService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(EnumDiscriminatorClientServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private EnumDiscriminatorClientServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Dog> getExtensibleModel(String endpoint, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/enum-discriminator/extensible-enum");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, EnumDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                Dog deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Dog.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Dog.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> putExtensibleModel(String endpoint, String contentType, Dog input,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/enum-discriminator/extensible-enum");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.PUT)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (input != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(input,
                    this.xmlSerializer.supportsFormat(requestSerializationFormat)
                        ? this.xmlSerializer
                        : this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, EnumDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Dog> getExtensibleModelMissingDiscriminator(String endpoint, String accept,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/enum-discriminator/extensible-enum/missingdiscriminator");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, EnumDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                Dog deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Dog.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Dog.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Dog> getExtensibleModelWrongDiscriminator(String endpoint, String accept,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/enum-discriminator/extensible-enum/wrongdiscriminator");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, EnumDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                Dog deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Dog.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Dog.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Snake> getFixedModel(String endpoint, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/enum-discriminator/fixed-enum");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, EnumDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                Snake deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Snake.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Snake.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> putFixedModel(String endpoint, String contentType, Snake input,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/enum-discriminator/fixed-enum");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.PUT)
                .setUri(uriBuilder.toString());
            if (contentType != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Content-Type"), contentType);
            }
            if (input != null) {
                if (httpRequest.getHeaders().get(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE) == null) {
                    httpRequest.getHeaders()
                        .set(io.clientcore.core.http.models.HttpHeaderName.CONTENT_TYPE, "application/json");
                }
                io.clientcore.core.serialization.SerializationFormat requestSerializationFormat
                    = io.clientcore.core.utils.CoreUtils.serializationFormatFromContentType(httpRequest.getHeaders());
                httpRequest.setBody(io.clientcore.core.models.binarydata.BinaryData.fromObject(input,
                    this.xmlSerializer.supportsFormat(requestSerializationFormat)
                        ? this.xmlSerializer
                        : this.jsonSerializer));
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 204)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, EnumDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Snake> getFixedModelMissingDiscriminator(String endpoint, String accept,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/enum-discriminator/fixed-enum/missingdiscriminator");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, EnumDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                Snake deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Snake.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Snake.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Snake> getFixedModelWrongDiscriminator(String endpoint, String accept,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/enum-discriminator/fixed-enum/wrongdiscriminator");
            io.clientcore.core.http.models.HttpRequest httpRequest = new io.clientcore.core.http.models.HttpRequest()
                .setMethod(io.clientcore.core.http.models.HttpMethod.GET)
                .setUri(uriBuilder.toString());
            if (accept != null) {
                httpRequest.getHeaders()
                    .set(io.clientcore.core.http.models.HttpHeaderName.fromString("Accept"), accept);
            }
            if (requestContext != null) {
                httpRequest.setContext(requestContext);
                requestContext.getRequestCallback().accept(httpRequest);
            }
            io.clientcore.core.http.models.Response<io.clientcore.core.models.binarydata.BinaryData> networkResponse
                = this.httpPipeline.send(httpRequest);
            int responseCode = networkResponse.getStatusCode();
            if (!(responseCode == 200)) {
                io.clientcore.core.utils.GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse,
                    this.jsonSerializer, this.xmlSerializer, null, null, EnumDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                Snake deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Snake.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Snake.class));
                } else {
                    throw new UnsupportedOperationException(
                        "Unsupported response serialization format: " + responseSerializationFormat);
                }
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), deserializedResult);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * Receive model with extensible enum discriminator type.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test extensible enum type for discriminator along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Dog> getExtensibleModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.EnumDiscriminator.getExtensibleModel", requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getExtensibleModel(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Send model with extensible enum discriminator type.
     * 
     * @param input Dog to create.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putExtensibleModelWithResponse(Dog input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.EnumDiscriminator.putExtensibleModel", requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.putExtensibleModel(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * Get a model omitting the discriminator.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model omitting the discriminator along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Dog> getExtensibleModelMissingDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.EnumDiscriminator.getExtensibleModelMissingDiscriminator", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getExtensibleModelMissingDiscriminator(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Get a model containing discriminator value never defined.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model containing discriminator value never defined along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Dog> getExtensibleModelWrongDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.EnumDiscriminator.getExtensibleModelWrongDiscriminator", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getExtensibleModelWrongDiscriminator(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Receive model with fixed enum discriminator type.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return test fixed enum type for discriminator along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Snake> getFixedModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.EnumDiscriminator.getFixedModel",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getFixedModel(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Send model with fixed enum discriminator type.
     * 
     * @param input Snake to create.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putFixedModelWithResponse(Snake input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.EnumDiscriminator.putFixedModel",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.putFixedModel(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * Get a model omitting the discriminator.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model omitting the discriminator along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Snake> getFixedModelMissingDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.EnumDiscriminator.getFixedModelMissingDiscriminator", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getFixedModelMissingDiscriminator(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * Get a model containing discriminator value never defined.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a model containing discriminator value never defined along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Snake> getFixedModelWrongDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.EnumDiscriminator.getFixedModelWrongDiscriminator", requestContext,
            updatedContext -> {
                final String accept = "application/json";
                return service.getFixedModelWrongDiscriminator(this.getEndpoint(), accept, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(EnumDiscriminatorClientImpl.class);
}
