package type.model.inheritance.singlediscriminator.implementation;

import io.clientcore.core.annotations.ReturnType;
import io.clientcore.core.annotations.ServiceMethod;
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.RequestContext;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import type.model.inheritance.singlediscriminator.Bird;
import type.model.inheritance.singlediscriminator.Dinosaur;
import type.model.inheritance.singlediscriminator.Fish;

/**
 * Initializes a new instance of the SingleDiscriminatorClient type.
 */
public final class SingleDiscriminatorClientImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final SingleDiscriminatorClientService service;

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
     * Initializes an instance of SingleDiscriminatorClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param instrumentation The instance of instrumentation to report telemetry.
     * @param endpoint Service host.
     */
    public SingleDiscriminatorClientImpl(HttpPipeline httpPipeline, Instrumentation instrumentation, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.instrumentation = instrumentation;
        this.endpoint = endpoint;
        this.service = SingleDiscriminatorClientService.getNewInstance(this.httpPipeline);
    }

    public interface SingleDiscriminatorClientService {
        static SingleDiscriminatorClientService getNewInstance(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            return new SingleDiscriminatorClientServiceImpl(pipeline);
        }

        Response<Bird> getModel(String endpoint, String accept, RequestContext requestContext);

        Response<Void> putModel(String endpoint, String contentType, Bird input, RequestContext requestContext);

        Response<Bird> getRecursiveModel(String endpoint, String accept, RequestContext requestContext);

        Response<Void> putRecursiveModel(String endpoint, String contentType, Bird input,
            RequestContext requestContext);

        Response<Bird> getMissingDiscriminator(String endpoint, String accept, RequestContext requestContext);

        Response<Bird> getWrongDiscriminator(String endpoint, String accept, RequestContext requestContext);

        Response<Dinosaur> getLegacyModel(String endpoint, String accept, RequestContext requestContext);

        Response<Fish> getNoSubtypesModel(String endpoint, String accept, RequestContext requestContext);

        Response<Void> putNoSubtypesModel(String endpoint, String contentType, Fish input,
            RequestContext requestContext);
    }

    private static final class SingleDiscriminatorClientServiceImpl implements SingleDiscriminatorClientService {
        private static final io.clientcore.core.instrumentation.logging.ClientLogger LOGGER
            = new io.clientcore.core.instrumentation.logging.ClientLogger(SingleDiscriminatorClientServiceImpl.class);

        private final io.clientcore.core.http.pipeline.HttpPipeline httpPipeline;

        private final io.clientcore.core.serialization.json.JsonSerializer jsonSerializer
            = io.clientcore.core.serialization.json.JsonSerializer.getInstance();

        private final io.clientcore.core.serialization.xml.XmlSerializer xmlSerializer
            = io.clientcore.core.serialization.xml.XmlSerializer.getInstance();

        private SingleDiscriminatorClientServiceImpl(io.clientcore.core.http.pipeline.HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Bird> getModel(String endpoint, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/single-discriminator/model");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, SingleDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                Bird deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Bird.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Bird.class));
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
        public Response<Void> putModel(String endpoint, String contentType, Bird input, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/single-discriminator/model");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, SingleDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Bird> getRecursiveModel(String endpoint, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/single-discriminator/recursivemodel");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, SingleDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                Bird deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Bird.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Bird.class));
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
        public Response<Void> putRecursiveModel(String endpoint, String contentType, Bird input,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/single-discriminator/recursivemodel");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, SingleDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Bird> getMissingDiscriminator(String endpoint, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/single-discriminator/missingdiscriminator");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, SingleDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                Bird deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Bird.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Bird.class));
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
        public Response<Bird> getWrongDiscriminator(String endpoint, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/single-discriminator/wrongdiscriminator");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, SingleDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                Bird deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Bird.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Bird.class));
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
        public Response<Dinosaur> getLegacyModel(String endpoint, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/single-discriminator/legacy-model");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, SingleDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                Dinosaur deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Dinosaur.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Dinosaur.class));
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
        public Response<Fish> getNoSubtypesModel(String endpoint, String accept, RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/single-discriminator/no-subtypes/model");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, SingleDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                Fish deserializedResult;
                io.clientcore.core.serialization.SerializationFormat responseSerializationFormat
                    = io.clientcore.core.utils.CoreUtils
                        .serializationFormatFromContentType(networkResponse.getHeaders());
                if (this.jsonSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.jsonSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Fish.class));
                } else if (this.xmlSerializer.supportsFormat(responseSerializationFormat)) {
                    deserializedResult = io.clientcore.core.utils.CoreUtils.decodeNetworkResponse(
                        networkResponse.getValue(), this.xmlSerializer, io.clientcore.core.utils.CoreUtils
                            .createParameterizedType(io.clientcore.core.http.models.Response.class, Fish.class));
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
        public Response<Void> putNoSubtypesModel(String endpoint, String contentType, Fish input,
            RequestContext requestContext) {
            io.clientcore.core.utils.UriBuilder uriBuilder = io.clientcore.core.utils.UriBuilder
                .parse(endpoint + "/type/model/inheritance/single-discriminator/no-subtypes/model");
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
                    this.jsonSerializer, this.xmlSerializer, null, null, SingleDiscriminatorClientServiceImpl.LOGGER);
            }
            try {
                return new io.clientcore.core.http.models.Response<>(networkResponse.getRequest(), responseCode,
                    networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The getModel operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator along with
     * {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Bird> getModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.SingleDiscriminator.getModel",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getModel(this.getEndpoint(), accept, updatedContext);
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
    public Response<Void> putModelWithResponse(Bird input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.SingleDiscriminator.putModel",
            requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.putModel(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * The getRecursiveModel operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator along with
     * {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Bird> getRecursiveModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.SingleDiscriminator.getRecursiveModel", requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getRecursiveModel(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The putRecursiveModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putRecursiveModelWithResponse(Bird input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.SingleDiscriminator.putRecursiveModel", requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.putRecursiveModel(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    /**
     * The getMissingDiscriminator operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator along with
     * {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Bird> getMissingDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.SingleDiscriminator.getMissingDiscriminator", requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getMissingDiscriminator(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The getWrongDiscriminator operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return this is base model for polymorphic single level inheritance with a discriminator along with
     * {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Bird> getWrongDiscriminatorWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.SingleDiscriminator.getWrongDiscriminator", requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getWrongDiscriminator(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The getLegacyModel operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return define a base class in the legacy way along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Dinosaur> getLegacyModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("Type.Model.Inheritance.SingleDiscriminator.getLegacyModel",
            requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getLegacyModel(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The getNoSubtypesModel operation.
     * 
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return a discriminated model with no defined subtypes along with {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Fish> getNoSubtypesModelWithResponse(RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.SingleDiscriminator.getNoSubtypesModel", requestContext, updatedContext -> {
                final String accept = "application/json";
                return service.getNoSubtypesModel(this.getEndpoint(), accept, updatedContext);
            });
    }

    /**
     * The putNoSubtypesModel operation.
     * 
     * @param input The input parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> putNoSubtypesModelWithResponse(Fish input, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse(
            "Type.Model.Inheritance.SingleDiscriminator.putNoSubtypesModel", requestContext, updatedContext -> {
                final String contentType = "application/json";
                return service.putNoSubtypesModel(this.getEndpoint(), contentType, input, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(SingleDiscriminatorClientImpl.class);
}
