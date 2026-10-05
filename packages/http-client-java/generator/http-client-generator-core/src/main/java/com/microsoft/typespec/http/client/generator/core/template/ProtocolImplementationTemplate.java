package com.microsoft.typespec.http.client.generator.core.template;

import com.github.javaparser.ast.expr.StringLiteralExpr;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IterableType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

final class ProtocolImplementationTemplate {
    private static final String HELPERS = "com.azure.core.util.GeneratedCodeUtils";
    private static final String TRACER = "com.azure.core.util.tracing.Tracer";

    private ProtocolImplementationTemplate() {
    }

    static void write(Proxy proxy, JavaClass outerClass) {
        JavaSettings settings = JavaSettings.getInstance();
        if (!settings.isAzureV1() || !settings.isDataPlaneClient() || settings.isFluent()) {
            throw new IllegalStateException(
                "generate-protocol-implementation currently supports Azure Core V1 data-plane clients only.");
        }
        proxy.getMethods().forEach(ProtocolImplementationTemplate::validate);
        outerClass.privateStaticFinalClass(proxy.getName(), implementation -> {
            implementation.privateFinalMemberVariable("com.azure.core.http.HttpPipeline", "httpPipeline");
            implementation.privateFinalMemberVariable("com.azure.core.util.serializer.SerializerAdapter",
                "serializerAdapter");
            implementation.privateConstructor(proxy.getName() + "(com.azure.core.http.HttpPipeline httpPipeline, "
                + "com.azure.core.util.serializer.SerializerAdapter serializerAdapter)", constructor -> {
                    constructor.line("this.httpPipeline = httpPipeline;");
                    constructor.line("this.serializerAdapter = serializerAdapter;");
                });
            writeTracing(implementation);
            for (ProxyMethod method : proxy.getMethods()) {
                String parameters = method.getParameters()
                    .stream()
                    .map(parameter -> parameter.getWireType() + " " + parameter.getName())
                    .collect(Collectors.joining(", "));
                implementation.publicMethod(
                    method.getReturnType().getClientType() + " " + method.getName() + "(" + parameters + ")",
                    body -> writeMethod(proxy, method, body));
            }
        });
    }

    private static void validate(ProxyMethod method) {
        IType returnType = unwrapMono(method.getReturnType().getClientType());
        if (!(returnType instanceof GenericType)
            || (!("Response".equals(((GenericType) returnType).getName()))
                && !("ResponseBase".equals(((GenericType) returnType).getName())))) {
            throw unsupported(method, "return type " + returnType);
        }
        if (method.isResumable()) {
            throw unsupported(method, "resumable proxy methods");
        }
        IType[] arguments = ((GenericType) returnType).getTypeArguments();
        IType entityType = arguments[arguments.length - 1];
        if ("InputStream".equals(entityType.toString())
            || "ByteBuffer".equals(entityType.toString())
            || entityType instanceof GenericType
                && ("Flux".equals(((GenericType) entityType).getName())
                    || "Mono".equals(((GenericType) entityType).getName()))) {
            throw unsupported(method, "streaming response type " + entityType);
        }
        if (method.getResponseContentTypes() != null
            && method.getResponseContentTypes()
                .stream()
                .map(contentType -> contentType.toLowerCase(Locale.ROOT))
                .anyMatch(contentType -> contentType.startsWith("text/event-stream")
                    || contentType.startsWith("application/octet-stream")
                    || contentType.startsWith("image/")
                    || contentType.startsWith("audio/")
                    || contentType.startsWith("video/"))) {
            throw unsupported(method, "streaming response content types");
        }
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() == RequestParameterLocation.BODY
                && parameter.getWireType() != ClassType.BINARY_DATA
                && parameter.getWireType() != ClassType.STRING
                && parameter.getWireType() != ArrayType.BYTE_ARRAY) {
                throw unsupported(method, "non-protocol request body type " + parameter.getWireType());
            }
            if (parameter.getHeaderCollectionPrefix() != null && !parameter.getHeaderCollectionPrefix().isEmpty()) {
                throw unsupported(method, "header collection parameters");
            }
        }
    }

    private static IllegalStateException unsupported(ProxyMethod method, String feature) {
        return new IllegalStateException("generate-protocol-implementation does not yet support " + feature
            + " on operation '" + method.getName() + "'. Disable the experimental flag for this client.");
    }

    private static void writeMethod(Proxy proxy, ProxyMethod method, JavaBlock body) {
        if (method.getImplementation() != null) {
            body.line(method.getImplementation());
            return;
        }
        boolean async = isMono(method.getReturnType());
        String publisherContext = local(method, "generatedPublisherContext");
        if (async) {
            body.line("return com.azure.core.util.FluxUtil.withContext(%s -> {", publisherContext);
            body.increaseIndent();
        }
        String request = local(method, "generatedRequest");
        String context = local(method, "generatedContext");
        String response = local(method, "generatedResponse");
        String responseBody = local(method, "generatedResponseBody");
        String responseClosed = local(method, "generatedResponseClosed");
        String closeResponse = local(method, "generatedCloseResponse");
        String scope = local(method, "generatedScope");
        String error = local(method, "generatedError");
        String validatedRequest = local(method, "generatedValidatedRequest");
        String options = method.getParameters()
            .stream()
            .filter(parameter -> parameter.getWireType() == ClassType.REQUEST_OPTIONS)
            .map(ProxyMethodParameter::getName)
            .findFirst()
            .orElse("null");
        String callerContext = method.getParameters()
            .stream()
            .filter(parameter -> parameter.getWireType() == ClassType.CONTEXT)
            .map(ProxyMethodParameter::getName)
            .findFirst()
            .orElse(async ? publisherContext : "com.azure.core.util.Context.NONE");
        GenericType responseType = (GenericType) unwrapMono(method.getReturnType().getClientType());
        IType[] arguments = responseType.getTypeArguments();
        IType entityType = arguments[arguments.length - 1];
        String operationName = proxy.getClientTypeName() + "." + method.getName();
        body.line(
            "final com.azure.core.util.Context %s = this.startSpan(%s.createRequestContext(%s, %s, %s, "
                + "true, %s, %s), %s);",
            context, HELPERS, callerContext, options, literal(operationName), isVoid(entityType), arguments.length == 2,
            literal(operationName));
        if (async) {
            body.line("return reactor.core.publisher.Mono.defer(() -> {");
            body.increaseIndent();
            body.line("try (AutoCloseable %s = this.httpPipeline.getTracer().makeSpanCurrent(%s)) {", scope, context);
            body.increaseIndent();
        } else {
            body.line("try (AutoCloseable %s = this.httpPipeline.getTracer().makeSpanCurrent(%s)) {", scope, context);
            body.increaseIndent();
        }
        writeRequest(proxy, method, body, request);
        body.line("%s.applyRequestOptions(%s, %s);", HELPERS, request, options);
        if (async) {
            body.line("return %s.validateRequestBodyLengthAsync(%s)", HELPERS, request);
            body.increaseIndent();
            body.line(".flatMap(%s -> this.httpPipeline.send(%s, %s))", validatedRequest, validatedRequest, context);
            body.line(".flatMap(%s -> {", response);
            body.increaseIndent();
            body.line("java.util.concurrent.atomic.AtomicBoolean %s = new java.util.concurrent.atomic.AtomicBoolean();",
                responseClosed);
            body.line("Runnable %s = () -> { if (%s.compareAndSet(false, true)) { %s.close(); } };", closeResponse,
                responseClosed, response);
            body.line("return %s.getBodyAsByteArray().defaultIfEmpty(new byte[0])", response);
            body.increaseIndent();
            body.line(".flatMap(%s -> reactor.core.publisher.Mono.fromCallable(() -> {", responseBody);
            body.increaseIndent();
            body.line("try {");
            body.increaseIndent();
            writeResponse(method, body, responseType, response, responseBody, options, context);
            body.decreaseIndent();
            body.line("} finally {");
            body.increaseIndent();
            body.line("%s.run();", closeResponse);
            body.decreaseIndent();
            body.line("}");
            body.decreaseIndent();
            body.line("}).subscribeOn(reactor.core.scheduler.Schedulers.boundedElastic()))");
            body.line(".doOnError(%s -> %s.run()).doOnCancel(%s);", error, closeResponse, closeResponse);
            body.decreaseIndent();
            body.decreaseIndent();
            body.line("})");
            body.line(".doOnError(%s -> this.endSpan(0, %s, %s))", error, error, context);
            body.line(".doOnCancel(() -> this.endSpan(-1, null, %s));", context);
            body.decreaseIndent();
            body.decreaseIndent();
            body.line("} catch (Throwable %s) {", error);
            body.increaseIndent();
            body.line("this.endSpan(0, %s, %s);", error, context);
            body.line("return reactor.core.publisher.Mono.error(%s);", error);
            body.decreaseIndent();
            body.line("}");
            body.decreaseIndent();
            body.line("});");
            body.decreaseIndent();
            body.line("});");
        } else {
            body.line("%s.validateRequestBodyLength(%s);", HELPERS, request);
            body.line("try (com.azure.core.http.HttpResponse %s = this.httpPipeline.sendSync(%s, %s)) {", response,
                request, context);
            body.increaseIndent();
            body.line("byte[] %s = %s.getBodyAsBinaryData().toBytes();", responseBody, response);
            writeResponse(method, body, responseType, response, responseBody, options, context);
            body.decreaseIndent();
            body.line("}");
            body.decreaseIndent();
            body.line("} catch (Exception %s) {", error);
            body.increaseIndent();
            body.line("this.endSpan(0, %s, %s);", error, context);
            body.line("throw reactor.core.Exceptions.propagate(%s);", error);
            body.decreaseIndent();
            body.line("}");
        }
    }

    private static void writeRequest(Proxy proxy, ProxyMethod method, JavaBlock body, String request) {
        String path = local(method, "generatedPath");
        String host = local(method, "generatedHost");
        String url = local(method, "generatedUrl");
        String urlBuilder = local(method, "generatedUrlBuilder");
        body.line("String %s = %s;", path, substitute(method.getUrlPath(), method, true));
        body.line("String %s = %s;", host, substitute(proxy.getBaseURL(), method, false));
        body.line(
            "String %s = %s.contains(\"://\") ? %s : %s + (%s.endsWith(\"/\") "
                + "? (%s.startsWith(\"/\") ? %s.substring(1) : %s) : (%s.startsWith(\"/\") ? %s : \"/\" + %s));",
            url, path, path, host, host, path, path, path, path, path, path);
        body.line("com.azure.core.util.UrlBuilder %s = com.azure.core.util.UrlBuilder.parse(%s);", urlBuilder, url);
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() != RequestParameterLocation.QUERY) {
                continue;
            }
            String value = parameter.getName();
            if (!(parameter.getWireType() instanceof PrimitiveType)) {
                body.line("if (%s != null) {", value);
                body.increaseIndent();
            }
            if (parameter.getExplode()
                && (parameter.getWireType() instanceof IterableType || parameter.getWireType() instanceof ArrayType)) {
                String queryValue = local(method, "generatedQueryValue");
                body.line("for (Object %s : %s) {", queryValue, value);
                body.increaseIndent();
                addQuery(body, urlBuilder, parameter, "this.serializerAdapter.serializeRaw(" + queryValue + ")");
                body.decreaseIndent();
                body.line("}");
            } else {
                addQuery(body, urlBuilder, parameter, serializeParameter(parameter));
            }
            if (!(parameter.getWireType() instanceof PrimitiveType)) {
                body.decreaseIndent();
                body.line("}");
            }
        }
        body.line("com.azure.core.http.HttpRequest %s = new com.azure.core.http.HttpRequest("
            + "com.azure.core.http.HttpMethod.%s, %s.toUrl());", request, method.getHttpMethod(), urlBuilder);
        if (method.getResponseContentTypes() != null && !method.getResponseContentTypes().isEmpty()) {
            body.line("%s.setHeader(com.azure.core.http.HttpHeaderName.ACCEPT, %s);", request,
                literal(String.join(", ", method.getResponseContentTypes())));
        }
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() == RequestParameterLocation.BODY) {
                body.line("if (%s != null) {", parameter.getName());
                body.increaseIndent();
                body.line("%s.setHeader(com.azure.core.http.HttpHeaderName.CONTENT_TYPE, %s);", request,
                    literal(method.getRequestContentType()));
                body.line("%s.setBody(%s);", request, parameter.getName());
                body.decreaseIndent();
                body.line("} else {");
                body.increaseIndent();
                body.line("%s.setHeader(com.azure.core.http.HttpHeaderName.CONTENT_LENGTH, \"0\");", request);
                body.decreaseIndent();
                body.line("}");
            }
        }
        if (method.getParameters()
            .stream()
            .noneMatch(parameter -> parameter.getRequestParameterLocation() == RequestParameterLocation.BODY)) {
            body.line("%s.setHeader(com.azure.core.http.HttpHeaderName.CONTENT_LENGTH, \"0\");", request);
        }
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() == RequestParameterLocation.HEADER) {
                if (!(parameter.getWireType() instanceof PrimitiveType)) {
                    body.line("if (%s != null) {", parameter.getName());
                    body.increaseIndent();
                }
                body.line("%s.setHeader(com.azure.core.http.HttpHeaderName.fromString(%s), %s);", request,
                    literal(parameter.getRequestParameterName()), serializeParameter(parameter));
                if (!(parameter.getWireType() instanceof PrimitiveType)) {
                    body.decreaseIndent();
                    body.line("}");
                }
            }
        }
    }

    private static void addQuery(JavaBlock body, String urlBuilder, ProxyMethodParameter parameter, String value) {
        body.line("%s.addQueryParameter(%s, %s, true, %s, %s);", HELPERS, urlBuilder,
            literal(parameter.getRequestParameterName()), value, !parameter.getAlreadyEncoded());
    }

    private static String serializeParameter(ProxyMethodParameter parameter) {
        if (parameter.getWireType() instanceof IterableType || parameter.getWireType() instanceof ArrayType) {
            String format = parameter.getCollectionFormat() == null ? "CSV" : parameter.getCollectionFormat().name();
            String iterable = parameter.getWireType() instanceof ArrayType
                ? "java.util.Arrays.asList(" + parameter.getName() + ")"
                : parameter.getName();
            return "this.serializerAdapter.serializeIterable(" + iterable
                + ", com.azure.core.util.serializer.CollectionFormat." + format + ")";
        }
        return "this.serializerAdapter.serializeRaw(" + parameter.getName() + ")";
    }

    private static String substitute(String template, ProxyMethod method, boolean path) {
        String expression = literal(template);
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() == RequestParameterLocation.PATH
                || parameter.getRequestParameterLocation() == RequestParameterLocation.URI) {
                String value = serializeParameter(parameter);
                if (path && !parameter.getAlreadyEncoded()) {
                    value = HELPERS + ".encodePathParameter(" + value + ")";
                }
                expression
                    += ".replace(" + literal("{" + parameter.getRequestParameterName() + "}") + ", " + value + ")";
            }
        }
        return expression;
    }

    private static void writeResponse(ProxyMethod method, JavaBlock body, GenericType responseType, String response,
        String responseBody, String options, String context) {
        String status = local(method, "generatedStatus");
        body.line("int %s = %s.getStatusCode();", status, response);
        List<Integer> expectedCodes = method.getResponseExpectedStatusCodes();
        String expected = expectedCodes.isEmpty()
            ? status + " >= 200 && " + status + " < 300"
            : expectedCodes.stream().map(code -> status + " == " + code).collect(Collectors.joining(" || "));
        body.line("if (!(%s) && %s.shouldThrowException(%s)) {", expected, HELPERS, options);
        body.increaseIndent();
        String exceptionType = local(method, "generatedExceptionType");
        ClassType defaultException = method.getUnexpectedResponseExceptionType();
        body.line("Class<? extends com.azure.core.exception.HttpResponseException> %s = %s.class;", exceptionType,
            defaultException == null ? "com.azure.core.exception.HttpResponseException" : defaultException);
        if (method.getUnexpectedResponseExceptionTypes() != null) {
            method.getUnexpectedResponseExceptionTypes().forEach((type, codes) -> {
                body.line("if (%s) {",
                    codes.stream().map(code -> status + " == " + code).collect(Collectors.joining(" || ")));
                body.increaseIndent();
                body.line("%s = %s.class;", exceptionType, type);
                body.decreaseIndent();
                body.line("}");
            });
        }
        body.line("throw %s.createUnexpectedResponseException(%s, %s, %s, this.serializerAdapter);", HELPERS, response,
            responseBody, exceptionType);
        body.decreaseIndent();
        body.line("}");
        IType[] arguments = responseType.getTypeArguments();
        IType entityType = arguments[arguments.length - 1];
        String value;
        if (isVoid(entityType)) {
            value = "null";
        } else if (method.getHttpMethod().toString().equals("HEAD") && entityType.toString().equals("Boolean")) {
            value = status + " >= 200 && " + status + " < 300";
        } else if (entityType == ClassType.BINARY_DATA) {
            value = "com.azure.core.util.BinaryData.fromBytes(" + responseBody + ")";
        } else if (entityType == ArrayType.BYTE_ARRAY && method.getReturnValueWireType() == null) {
            value = responseBody;
        } else {
            String wireType
                = method.getReturnValueWireType() == null ? "null" : method.getReturnValueWireType() + ".class";
            value = HELPERS + ".decodeResponseBody(" + response + ", " + responseBody
                + ", new com.azure.core.util.serializer.TypeReference<" + entityType.asNullable()
                + ">() { }.getJavaType(), " + wireType + ", this.serializerAdapter)";
        }
        String result = local(method, "generatedResult");
        String construction = arguments.length == 2
            ? "new com.azure.core.http.rest.ResponseBase<>("
            : "new com.azure.core.http.rest.SimpleResponse<>(";
        construction += response + ".getRequest(), " + status + ", " + response + ".getHeaders(), " + value;
        if (arguments.length == 2) {
            construction += ", " + HELPERS + ".decodeResponseHeaders(" + response
                + ", new com.azure.core.util.serializer.TypeReference<" + arguments[0]
                + ">() { }.getJavaType(), this.serializerAdapter)";
        }
        body.line("%s %s = %s);", responseType, result, construction);
        body.line("this.endSpan(%s, null, %s);", status, context);
        body.methodReturn(result);
    }

    private static void writeTracing(JavaClass implementation) {
        implementation.privateMethod(
            "com.azure.core.util.Context startSpan(com.azure.core.util.Context context, " + "String spanName)",
            body -> {
                body.line("if (!this.httpPipeline.getTracer().isEnabled() || Boolean.TRUE.equals("
                    + "context.getData(%s.DISABLE_TRACING_KEY).orElse(false))) {", TRACER);
                body.increaseIndent();
                body.methodReturn("context");
                body.decreaseIndent();
                body.line("}");
                body.line("Object parent = context.getData(%s.PARENT_TRACE_CONTEXT_KEY).orElse(null);", TRACER);
                body.methodReturn("this.httpPipeline.getTracer().start(spanName, "
                    + "parent instanceof com.azure.core.util.Context ? (com.azure.core.util.Context) parent : context)");
            });
        implementation.privateMethod(
            "void endSpan(int statusCode, Throwable error, com.azure.core.util.Context context)", body -> {
                body.line("if (this.httpPipeline.getTracer().isEnabled() && !Boolean.TRUE.equals("
                    + "context.getData(%s.DISABLE_TRACING_KEY).orElse(false))) {", TRACER);
                body.increaseIndent();
                body.line("this.httpPipeline.getTracer().end(statusCode == -1 ? \"cancelled\" "
                    + ": statusCode >= 400 ? String.valueOf(statusCode) : null, error, context);");
                body.decreaseIndent();
                body.line("}");
            });
    }

    private static boolean isMono(IType type) {
        return type instanceof GenericType && "Mono".equals(((GenericType) type).getName());
    }

    private static IType unwrapMono(IType type) {
        return isMono(type) ? ((GenericType) type).getTypeArguments()[0] : type;
    }

    private static boolean isVoid(IType type) {
        return "Void".equals(type.toString()) || "void".equals(type.toString());
    }

    private static String local(ProxyMethod method, String name) {
        String result = name;
        while (method.getParameters()
            .stream()
            .map(ProxyMethodParameter::getName)
            .collect(Collectors.toSet())
            .contains(result)) {
            result += "_";
        }
        return result;
    }

    private static String literal(String value) {
        return new StringLiteralExpr().setString(value == null ? "" : value).toString();
    }
}
