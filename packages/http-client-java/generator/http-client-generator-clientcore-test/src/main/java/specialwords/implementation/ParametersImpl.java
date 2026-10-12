package specialwords.implementation;

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
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import io.clientcore.core.utils.UriBuilder;

/**
 * An instance of this class provides access to all the operations defined in Parameters.
 */
public final class ParametersImpl {
    /**
     * The proxy service used to perform REST calls.
     */
    private final ParametersService service;

    /**
     * The service client containing this operation class.
     */
    private final SpecialWordsClientImpl client;

    /**
     * The instance of instrumentation to report telemetry.
     */
    private final Instrumentation instrumentation;

    /**
     * Initializes an instance of ParametersImpl.
     * 
     * @param client the instance of the service client containing this operation class.
     */
    ParametersImpl(SpecialWordsClientImpl client) {
        this.service = ParametersService.getNewInstance(client.getHttpPipeline());
        this.client = client;
        this.instrumentation = client.getInstrumentation();
    }

    public interface ParametersService {
        static ParametersService getNewInstance(HttpPipeline pipeline) {
            return new ParametersServiceImpl(pipeline);
        }

        Response<Void> withAnd(String endpoint, String and, RequestContext requestContext);

        Response<Void> withAs(String endpoint, String as, RequestContext requestContext);

        Response<Void> withAssert(String endpoint, String assertParameter, RequestContext requestContext);

        Response<Void> withAsync(String endpoint, String async, RequestContext requestContext);

        Response<Void> withAwait(String endpoint, String await, RequestContext requestContext);

        Response<Void> withBreak(String endpoint, String breakParameter, RequestContext requestContext);

        Response<Void> withClass(String endpoint, String classParameter, RequestContext requestContext);

        Response<Void> withConstructor(String endpoint, String constructor, RequestContext requestContext);

        Response<Void> withContinue(String endpoint, String continueParameter, RequestContext requestContext);

        Response<Void> withDef(String endpoint, String def, RequestContext requestContext);

        Response<Void> withDel(String endpoint, String del, RequestContext requestContext);

        Response<Void> withElif(String endpoint, String elif, RequestContext requestContext);

        Response<Void> withElse(String endpoint, String elseParameter, RequestContext requestContext);

        Response<Void> withExcept(String endpoint, String except, RequestContext requestContext);

        Response<Void> withExec(String endpoint, String exec, RequestContext requestContext);

        Response<Void> withFinally(String endpoint, String finallyParameter, RequestContext requestContext);

        Response<Void> withFor(String endpoint, String forParameter, RequestContext requestContext);

        Response<Void> withFrom(String endpoint, String from, RequestContext requestContext);

        Response<Void> withGlobal(String endpoint, String global, RequestContext requestContext);

        Response<Void> withIf(String endpoint, String ifParameter, RequestContext requestContext);

        Response<Void> withImport(String endpoint, String importParameter, RequestContext requestContext);

        Response<Void> withIn(String endpoint, String in, RequestContext requestContext);

        Response<Void> withIs(String endpoint, String is, RequestContext requestContext);

        Response<Void> withLambda(String endpoint, String lambda, RequestContext requestContext);

        Response<Void> withNot(String endpoint, String not, RequestContext requestContext);

        Response<Void> withOr(String endpoint, String or, RequestContext requestContext);

        Response<Void> withPass(String endpoint, String pass, RequestContext requestContext);

        Response<Void> withRaise(String endpoint, String raise, RequestContext requestContext);

        Response<Void> withReturn(String endpoint, String returnParameter, RequestContext requestContext);

        Response<Void> withTry(String endpoint, String tryParameter, RequestContext requestContext);

        Response<Void> withWhile(String endpoint, String whileParameter, RequestContext requestContext);

        Response<Void> withWith(String endpoint, String with, RequestContext requestContext);

        Response<Void> withYield(String endpoint, String yield, RequestContext requestContext);

        Response<Void> withCancellationToken(String endpoint, String cancellationToken, RequestContext requestContext);
    }

    private static final class ParametersServiceImpl implements ParametersService {
        private static final ClientLogger LOGGER = new ClientLogger(ParametersServiceImpl.class);

        private final HttpPipeline httpPipeline;

        private ParametersServiceImpl(HttpPipeline pipeline) {
            this.httpPipeline = pipeline;
        }

        @Override
        public Response<Void> withAnd(String endpoint, String and, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/and");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "and", true, and, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withAs(String endpoint, String as, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/as");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "as", true, as, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withAssert(String endpoint, String assertParameter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/assert");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "assert", true, assertParameter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withAsync(String endpoint, String async, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/async");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "async", true, async, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withAwait(String endpoint, String await, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/await");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "await", true, await, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withBreak(String endpoint, String breakParameter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/break");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "break", true, breakParameter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withClass(String endpoint, String classParameter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/class");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "class", true, classParameter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withConstructor(String endpoint, String constructor, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/constructor");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "constructor", true, constructor, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withContinue(String endpoint, String continueParameter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/continue");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "continue", true, continueParameter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withDef(String endpoint, String def, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/def");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "def", true, def, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withDel(String endpoint, String del, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/del");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "del", true, del, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withElif(String endpoint, String elif, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/elif");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "elif", true, elif, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withElse(String endpoint, String elseParameter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/else");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "else", true, elseParameter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withExcept(String endpoint, String except, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/except");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "except", true, except, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withExec(String endpoint, String exec, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/exec");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "exec", true, exec, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withFinally(String endpoint, String finallyParameter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/finally");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "finally", true, finallyParameter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withFor(String endpoint, String forParameter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/for");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "for", true, forParameter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withFrom(String endpoint, String from, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/from");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "from", true, from, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withGlobal(String endpoint, String global, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/global");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "global", true, global, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withIf(String endpoint, String ifParameter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/if");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "if", true, ifParameter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withImport(String endpoint, String importParameter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/import");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "import", true, importParameter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withIn(String endpoint, String in, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/in");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "in", true, in, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withIs(String endpoint, String is, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/is");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "is", true, is, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withLambda(String endpoint, String lambda, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/lambda");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "lambda", true, lambda, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withNot(String endpoint, String not, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/not");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "not", true, not, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withOr(String endpoint, String or, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/or");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "or", true, or, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withPass(String endpoint, String pass, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/pass");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "pass", true, pass, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withRaise(String endpoint, String raise, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/raise");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "raise", true, raise, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withReturn(String endpoint, String returnParameter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/return");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "return", true, returnParameter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withTry(String endpoint, String tryParameter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/try");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "try", true, tryParameter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withWhile(String endpoint, String whileParameter, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/while");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "while", true, whileParameter, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withWith(String endpoint, String with, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/with");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "with", true, with, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withYield(String endpoint, String yield, RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/yield");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "yield", true, yield, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }

        @Override
        public Response<Void> withCancellationToken(String endpoint, String cancellationToken,
            RequestContext requestContext) {
            UriBuilder uriBuilder = UriBuilder.parse(endpoint + "/special-words/parameters/cancellationToken");
            GeneratedCodeUtils.addQueryParameter(uriBuilder, "cancellationToken", true, cancellationToken, true);
            HttpRequest httpRequest = new HttpRequest().setMethod(HttpMethod.GET).setUri(uriBuilder.toString());
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
                GeneratedCodeUtils.handleUnexpectedResponse(responseCode, networkResponse, JsonSerializer.getInstance(),
                    null, null, null, ParametersServiceImpl.LOGGER);
            }
            try {
                return new Response<>(networkResponse.getRequest(), responseCode, networkResponse.getHeaders(), null);
            } finally {
                networkResponse.close();
            }
        }
    }

    /**
     * The withAnd operation.
     * 
     * @param and The and parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAndWithResponse(String and, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withAnd", requestContext,
            updatedContext -> {
                return service.withAnd(this.client.getEndpoint(), and, updatedContext);
            });
    }

    /**
     * The withAs operation.
     * 
     * @param as The as parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAsWithResponse(String as, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withAs", requestContext,
            updatedContext -> {
                return service.withAs(this.client.getEndpoint(), as, updatedContext);
            });
    }

    /**
     * The withAssert operation.
     * 
     * @param assertParameter The assertParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAssertWithResponse(String assertParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withAssert", requestContext,
            updatedContext -> {
                return service.withAssert(this.client.getEndpoint(), assertParameter, updatedContext);
            });
    }

    /**
     * The withAsync operation.
     * 
     * @param async The async parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAsyncWithResponse(String async, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withAsync", requestContext,
            updatedContext -> {
                return service.withAsync(this.client.getEndpoint(), async, updatedContext);
            });
    }

    /**
     * The withAwait operation.
     * 
     * @param await The await parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withAwaitWithResponse(String await, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withAwait", requestContext,
            updatedContext -> {
                return service.withAwait(this.client.getEndpoint(), await, updatedContext);
            });
    }

    /**
     * The withBreak operation.
     * 
     * @param breakParameter The breakParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withBreakWithResponse(String breakParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withBreak", requestContext,
            updatedContext -> {
                return service.withBreak(this.client.getEndpoint(), breakParameter, updatedContext);
            });
    }

    /**
     * The withClass operation.
     * 
     * @param classParameter The classParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withClassWithResponse(String classParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withClass", requestContext,
            updatedContext -> {
                return service.withClass(this.client.getEndpoint(), classParameter, updatedContext);
            });
    }

    /**
     * The withConstructor operation.
     * 
     * @param constructor The constructor parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withConstructorWithResponse(String constructor, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withConstructor", requestContext,
            updatedContext -> {
                return service.withConstructor(this.client.getEndpoint(), constructor, updatedContext);
            });
    }

    /**
     * The withContinue operation.
     * 
     * @param continueParameter The continueParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withContinueWithResponse(String continueParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withContinue", requestContext,
            updatedContext -> {
                return service.withContinue(this.client.getEndpoint(), continueParameter, updatedContext);
            });
    }

    /**
     * The withDef operation.
     * 
     * @param def The def parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withDefWithResponse(String def, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withDef", requestContext,
            updatedContext -> {
                return service.withDef(this.client.getEndpoint(), def, updatedContext);
            });
    }

    /**
     * The withDel operation.
     * 
     * @param del The del parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withDelWithResponse(String del, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withDel", requestContext,
            updatedContext -> {
                return service.withDel(this.client.getEndpoint(), del, updatedContext);
            });
    }

    /**
     * The withElif operation.
     * 
     * @param elif The elif parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withElifWithResponse(String elif, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withElif", requestContext,
            updatedContext -> {
                return service.withElif(this.client.getEndpoint(), elif, updatedContext);
            });
    }

    /**
     * The withElse operation.
     * 
     * @param elseParameter The elseParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withElseWithResponse(String elseParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withElse", requestContext,
            updatedContext -> {
                return service.withElse(this.client.getEndpoint(), elseParameter, updatedContext);
            });
    }

    /**
     * The withExcept operation.
     * 
     * @param except The except parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withExceptWithResponse(String except, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withExcept", requestContext,
            updatedContext -> {
                return service.withExcept(this.client.getEndpoint(), except, updatedContext);
            });
    }

    /**
     * The withExec operation.
     * 
     * @param exec The exec parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withExecWithResponse(String exec, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withExec", requestContext,
            updatedContext -> {
                return service.withExec(this.client.getEndpoint(), exec, updatedContext);
            });
    }

    /**
     * The withFinally operation.
     * 
     * @param finallyParameter The finallyParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withFinallyWithResponse(String finallyParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withFinally", requestContext,
            updatedContext -> {
                return service.withFinally(this.client.getEndpoint(), finallyParameter, updatedContext);
            });
    }

    /**
     * The withFor operation.
     * 
     * @param forParameter The forParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withForWithResponse(String forParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withFor", requestContext,
            updatedContext -> {
                return service.withFor(this.client.getEndpoint(), forParameter, updatedContext);
            });
    }

    /**
     * The withFrom operation.
     * 
     * @param from The from parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withFromWithResponse(String from, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withFrom", requestContext,
            updatedContext -> {
                return service.withFrom(this.client.getEndpoint(), from, updatedContext);
            });
    }

    /**
     * The withGlobal operation.
     * 
     * @param global The global parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withGlobalWithResponse(String global, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withGlobal", requestContext,
            updatedContext -> {
                return service.withGlobal(this.client.getEndpoint(), global, updatedContext);
            });
    }

    /**
     * The withIf operation.
     * 
     * @param ifParameter The ifParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withIfWithResponse(String ifParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withIf", requestContext,
            updatedContext -> {
                return service.withIf(this.client.getEndpoint(), ifParameter, updatedContext);
            });
    }

    /**
     * The withImport operation.
     * 
     * @param importParameter The importParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withImportWithResponse(String importParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withImport", requestContext,
            updatedContext -> {
                return service.withImport(this.client.getEndpoint(), importParameter, updatedContext);
            });
    }

    /**
     * The withIn operation.
     * 
     * @param in The in parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withInWithResponse(String in, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withIn", requestContext,
            updatedContext -> {
                return service.withIn(this.client.getEndpoint(), in, updatedContext);
            });
    }

    /**
     * The withIs operation.
     * 
     * @param is The is parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withIsWithResponse(String is, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withIs", requestContext,
            updatedContext -> {
                return service.withIs(this.client.getEndpoint(), is, updatedContext);
            });
    }

    /**
     * The withLambda operation.
     * 
     * @param lambda The lambda parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withLambdaWithResponse(String lambda, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withLambda", requestContext,
            updatedContext -> {
                return service.withLambda(this.client.getEndpoint(), lambda, updatedContext);
            });
    }

    /**
     * The withNot operation.
     * 
     * @param not The not parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withNotWithResponse(String not, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withNot", requestContext,
            updatedContext -> {
                return service.withNot(this.client.getEndpoint(), not, updatedContext);
            });
    }

    /**
     * The withOr operation.
     * 
     * @param or The or parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withOrWithResponse(String or, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withOr", requestContext,
            updatedContext -> {
                return service.withOr(this.client.getEndpoint(), or, updatedContext);
            });
    }

    /**
     * The withPass operation.
     * 
     * @param pass The pass parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withPassWithResponse(String pass, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withPass", requestContext,
            updatedContext -> {
                return service.withPass(this.client.getEndpoint(), pass, updatedContext);
            });
    }

    /**
     * The withRaise operation.
     * 
     * @param raise The raise parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withRaiseWithResponse(String raise, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withRaise", requestContext,
            updatedContext -> {
                return service.withRaise(this.client.getEndpoint(), raise, updatedContext);
            });
    }

    /**
     * The withReturn operation.
     * 
     * @param returnParameter The returnParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withReturnWithResponse(String returnParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withReturn", requestContext,
            updatedContext -> {
                return service.withReturn(this.client.getEndpoint(), returnParameter, updatedContext);
            });
    }

    /**
     * The withTry operation.
     * 
     * @param tryParameter The tryParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withTryWithResponse(String tryParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withTry", requestContext,
            updatedContext -> {
                return service.withTry(this.client.getEndpoint(), tryParameter, updatedContext);
            });
    }

    /**
     * The withWhile operation.
     * 
     * @param whileParameter The whileParameter parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWhileWithResponse(String whileParameter, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withWhile", requestContext,
            updatedContext -> {
                return service.withWhile(this.client.getEndpoint(), whileParameter, updatedContext);
            });
    }

    /**
     * The withWith operation.
     * 
     * @param with The with parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withWithWithResponse(String with, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withWith", requestContext,
            updatedContext -> {
                return service.withWith(this.client.getEndpoint(), with, updatedContext);
            });
    }

    /**
     * The withYield operation.
     * 
     * @param yield The yield parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withYieldWithResponse(String yield, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withYield", requestContext,
            updatedContext -> {
                return service.withYield(this.client.getEndpoint(), yield, updatedContext);
            });
    }

    /**
     * The withCancellationToken operation.
     * 
     * @param cancellationToken The cancellationToken parameter.
     * @param requestContext The context to configure the HTTP request before HTTP client sends it.
     * @throws IllegalArgumentException thrown if parameters fail the validation.
     * @throws HttpResponseException thrown if the service returns an error.
     * @throws RuntimeException all other wrapped checked exceptions if the request fails to be sent.
     * @return the {@link Response}.
     */
    @ServiceMethod(returns = ReturnType.SINGLE)
    public Response<Void> withCancellationTokenWithResponse(String cancellationToken, RequestContext requestContext) {
        return this.instrumentation.instrumentWithResponse("SpecialWords.Parameters.withCancellationToken",
            requestContext, updatedContext -> {
                return service.withCancellationToken(this.client.getEndpoint(), cancellationToken, updatedContext);
            });
    }

    private static final ClientLogger LOGGER = new ClientLogger(ParametersImpl.class);
}
