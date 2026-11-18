// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ListType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.implementation.utils.UriEscapers;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.serialization.xml.XmlSerializer;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import io.clientcore.core.utils.UriBuilder;
import java.lang.reflect.ParameterizedType;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Generates ClientCore HTTP operations directly from the proxy model, replacing the ClientCore annotation processor.
 *
 * <p>By default, {@link ProxyTemplate} uses this template for the {@code generic} and {@code azurev2} flavors.
 * The proxy template emits the service interface and its factory; this template emits the private nested class
 * that the factory instantiates. Methods with an existing default implementation are inherited from the interface.
 * Enabling {@code use-rest-proxy} bypasses this template and retains the annotated interface for runtime reflection.
 *
 * <p>{@link ProxyMethod} describes the HTTP verb, route, and response types, while {@link ProxyMethodParameter}
 * describes how each wire value is bound to the request. The emitted methods use that metadata to build requests,
 * send them through the client's existing HTTP pipeline, and handle success and error responses.
 */
final class ClientCoreHttpOperationTemplate {
    private static final Pattern PATH_PLACEHOLDER = Pattern.compile("\\{([^{}]+)}");
    private static final String RESPONSE_DECODER
        = "<T> T decodeResponse(BinaryData value, " + "ParameterizedType type, SerializationFormat format)";

    static String implementationName(Proxy proxy) {
        return proxy.getName() + "Impl";
    }

    static List<String> parameterDeclarations(ProxyMethod method) {
        return method.getParameters()
            .stream()
            .map(parameter -> parameter.getWireType() + " " + parameter.getName())
            .collect(Collectors.toList());
    }

    static void addImportsTo(Proxy proxy, Set<String> imports, JavaSettings settings) {
        if (proxy == null || !settings.generateClientCoreHttpOperations()) {
            return;
        }

        for (ProxyMethod method : proxy.getMethods()) {
            if (method.getImplementation() != null) {
                continue;
            }
            imports.add(HttpMethod.class.getName());
            imports.add(HttpRequest.class.getName());
            imports.add(Response.class.getName());
            imports.add(BinaryData.class.getName());
            imports.add(GeneratedCodeUtils.class.getName());
            imports.add(ClientLogger.class.getName());
            imports.add(JsonSerializer.class.getName());
            imports.add(XmlSerializer.class.getName());
            if (!bindings(method, RequestParameterLocation.QUERY).isEmpty()) {
                imports.add(UriBuilder.class.getName());
            }
            for (ProxyMethodParameter parameter : method.getParameters()) {
                if (parameter.getRequestParameterLocation() == RequestParameterLocation.PATH
                    && !parameter.getAlreadyEncoded()
                    && ClassType.STRING.equals(parameter.getWireType())) {
                    imports.add(UriEscapers.class.getName());
                } else if (parameter.getRequestParameterLocation() == RequestParameterLocation.HEADER
                    && isOffsetDateTime(parameter.getWireType())) {
                    imports.add(DateTimeFormatter.class.getName());
                }
            }
            ProxyMethodParameter body = bodyParameter(method);
            if (body != null || !bindings(method, RequestParameterLocation.HEADER).isEmpty()) {
                imports.add(HttpHeaderName.class.getName());
            }
            if ((body != null && serializesBody(method, body)) || decodesResponse(method)) {
                imports.add(CoreUtils.class.getName());
                imports.add(SerializationFormat.class.getName());
            }
            if (decodesResponse(method)) {
                imports.add(ParameterizedType.class.getName());
            }
            if (ArrayType.BYTE_ARRAY.equals(entityType(method))
                && ClassType.BASE_64_URL.equals(method.getReturnValueWireType())) {
                ClassType.BASE_64_URL.addImportsTo(imports, false);
            }
            if (!statusErrorTypes(method, settings).isEmpty()) {
                imports.add(CoreUtils.class.getName());
                imports.add(Map.class.getName());
            }
            if (!"null".equals(defaultErrorType(method, settings))) {
                imports.add(CoreUtils.class.getName());
            }
        }
    }

    static void write(Proxy proxy, JavaClass owner, JavaSettings settings) {
        List<ProxyMethod> operations = proxy.getMethods()
            .stream()
            .filter(method -> method.getImplementation() == null)
            .collect(Collectors.toList());
        String impl = implementationName(proxy);
        owner.privateStaticFinalClass(impl + " implements " + proxy.getName(), service -> {
            if (!operations.isEmpty()) {
                service.privateStaticFinalVariable(
                    "ClientLogger HTTP_LOG = new ClientLogger(" + proxy.getName() + ".class)");
                service.privateFinalMemberVariable("HttpPipeline", "httpPipeline");
                service.privateFinalMemberVariable("JsonSerializer", "jsonSerializer", "JsonSerializer.getInstance()");
                service.privateFinalMemberVariable("XmlSerializer", "xmlSerializer", "XmlSerializer.getInstance()");
            }
            service.privateConstructor(impl + "(HttpPipeline httpPipeline)", constructor -> {
                if (!operations.isEmpty()) {
                    constructor.line("this.httpPipeline = httpPipeline;");
                }
            });
            for (ProxyMethod method : operations) {
                service.annotation("Override");
                service.publicMethod(
                    method.getReturnType().getClientType() + " " + method.getName() + "("
                        + String.join(", ", parameterDeclarations(method)) + ")",
                    body -> writeOperation(proxy, method, body, settings));
            }
            if (operations.stream().anyMatch(ClientCoreHttpOperationTemplate::decodesResponse)) {
                service.privateMethod(RESPONSE_DECODER, body -> {
                    body.ifBlock("this.jsonSerializer.supportsFormat(format)",
                        json -> json.methodReturn("CoreUtils.decodeNetworkResponse(value, this.jsonSerializer, type)"));
                    body.ifBlock("this.xmlSerializer.supportsFormat(format)",
                        xml -> xml.methodReturn("CoreUtils.decodeNetworkResponse(value, this.xmlSerializer, type)"));
                    body.line("throw HTTP_LOG.throwableAtError().addKeyValue(\"serializationFormat\", format.name())"
                        + ".log(\"None of the provided serializers support the format.\", "
                        + "UnsupportedOperationException::new);");
                });
            }
        });
    }

    private static void writeOperation(Proxy proxy, ProxyMethod method, JavaBlock block, JavaSettings settings) {
        // Reserve parameter names so generated locals like httpRequest cannot collide with them.
        Set<String> names
            = method.getParameters().stream().map(ProxyMethodParameter::getName).collect(Collectors.toSet());
        String request = localName(names, "httpRequest");
        String uri = uriExpression(proxy, method);
        Map<String, ProxyMethodParameter> query = bindings(method, RequestParameterLocation.QUERY);
        if (!query.isEmpty()) {
            String builder = localName(names, "uriBuilder");
            block.line("UriBuilder %s = UriBuilder.parse(%s);", builder, uri);
            // The mapper supplies lists for exploded queries and delimited strings for non-exploded queries.
            query.forEach((name, parameter) -> block.line("GeneratedCodeUtils.addQueryParameter(%s, %s, true, %s, %s);",
                builder, literal(name), parameter.getName(), !parameter.getAlreadyEncoded()));
            uri = builder + ".toString()";
        }
        block.line("HttpRequest %s = new HttpRequest().setMethod(HttpMethod.%s).setUri(%s);", request,
            method.getHttpMethod(), uri);
        writeHeaders(method, block, request);
        String requestFormat = writeRequestBody(method, block, request, names);
        // Run the callback after setting headers and body so callers can inspect or modify the complete request.
        method.getParameters()
            .stream()
            .filter(parameter -> ClassType.REQUEST_CONTEXT.equals(parameter.getWireType()))
            .findFirst()
            .ifPresent(context -> {
                block.line("%s.setContext(%s);", request, context.getName());
                block.line("%s.getContext().getRequestCallback().accept(%s);", request, request);
            });

        String response = localName(names, "networkResponse");
        String responseDeclaration = "Response<BinaryData> " + response + " = this.httpPipeline.send(" + request + ")";
        IType entity = entityType(method);
        // Match the processor's close behavior. Raw BinaryData and InputStream results must remain usable by the caller.
        boolean closeResponse = isVoid(entity)
            || isBooleanHead(method)
            || ArrayType.BYTE_ARRAY.equals(entity)
            || (entity instanceof ListType && ClassType.BINARY_DATA.equals(((ListType) entity).getElementType()));
        Consumer<JavaBlock> handleResponse
            = responseBlock -> writeResponse(method, responseBlock, response, requestFormat, names, settings);
        if (closeResponse) {
            block.tryBlock(responseDeclaration, handleResponse);
        } else {
            block.line(responseDeclaration + ";");
            handleResponse.accept(block);
        }
    }

    /**
     * Builds a Java expression for the request URI before adding query parameters. Absolute URLs bypass the
     * service host. Placeholders are matched by wire name, and only unencoded string path values are escaped.
     *
     * @param proxy the proxy that supplies the service host
     * @param method the operation that supplies the path and parameter bindings
     * @return the Java expression for the request URI
     */
    private static String uriExpression(Proxy proxy, ProxyMethod method) {
        String host = proxy.getBaseURL();
        String path = method.getUrlPath();
        if (path == null) {
            path = "";
        }
        boolean hasHost = !CoreUtils.isNullOrEmpty(host);
        if (hasHost && !"/".equals(host) && !path.contains("://")) {
            path = host + (path.startsWith("/") ? path : "/" + path);
        }

        Map<String, ProxyMethodParameter> substitutions = new LinkedHashMap<>();
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() == RequestParameterLocation.URI
                || parameter.getRequestParameterLocation() == RequestParameterLocation.PATH) {
                substitutions.put(parameter.getRequestParameterName(), parameter);
            }
        }
        if (path.contains("{nextLink}") && substitutions.containsKey("nextLink")) {
            // A continuation link already contains its endpoint, path, and encoding.
            return substitutions.get("nextLink").getName();
        }

        List<String> parts = new ArrayList<>();
        if (!hasHost) {
            // Without a host template, URI-bound parameters supply the base endpoint in declaration order.
            method.getParameters()
                .stream()
                .filter(parameter -> parameter.getRequestParameterLocation() == RequestParameterLocation.URI)
                .forEach(parameter -> parts.add(stringValue(parameter)));
            if (!parts.isEmpty()) {
                parts.add("\"/\"");
            }
        }
        Matcher placeholder = PATH_PLACEHOLDER.matcher(path);
        int start = 0;
        while (placeholder.find()) {
            if (start < placeholder.start()) {
                parts.add(literal(path.substring(start, placeholder.start())));
            }
            ProxyMethodParameter parameter = substitutions.get(placeholder.group(1));
            if (parameter == null) {
                throw new IllegalArgumentException("Unbound URL placeholder " + placeholder.group() + " in "
                    + proxy.getName() + "." + method.getName());
            }
            if (parameter.getRequestParameterLocation() == RequestParameterLocation.PATH
                && !parameter.getAlreadyEncoded()
                && ClassType.STRING.equals(parameter.getWireType())) {
                parts.add("UriEscapers.PATH_ESCAPER.escape(" + parameter.getName() + ")");
            } else {
                parts.add(stringValue(parameter));
            }
            start = placeholder.end();
        }
        if (start < path.length() || parts.isEmpty()) {
            parts.add(literal(path.substring(start)));
        }
        return String.join(" + ", parts);
    }

    private static Map<String, ProxyMethodParameter> bindings(ProxyMethod method, RequestParameterLocation location) {
        Map<String, ProxyMethodParameter> bindings = new LinkedHashMap<>();
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() != location) {
                continue;
            }
            String name = parameter.getRequestParameterName();
            if (location == RequestParameterLocation.HEADER
                && !CoreUtils.isNullOrEmpty(parameter.getHeaderCollectionPrefix())) {
                name = parameter.getHeaderCollectionPrefix();
            }
            if (!CoreUtils.isNullOrEmpty(name)) {
                // Match the processor: the first header or query parameter for a wire name wins.
                bindings.putIfAbsent(name, parameter);
            }
        }
        return bindings;
    }

    private static void writeHeaders(ProxyMethod method, JavaBlock block, String request) {
        bindings(method, RequestParameterLocation.HEADER).forEach((name, parameter) -> {
            if ("Content-Type".equalsIgnoreCase(name)) {
                return; // As in the annotated implementation, the body determines Content-Type.
            }
            String value = isOffsetDateTime(parameter.getWireType())
                ? parameter.getName() + ".format(DateTimeFormatter.ISO_INSTANT)"
                : stringValue(parameter);
            String statement
                = request + ".getHeaders().add(HttpHeaderName.fromString(" + literal(name) + "), " + value + ");";
            if (parameter.getWireType() instanceof PrimitiveType) {
                block.line(statement);
            } else {
                block.ifBlock(parameter.getName() + " != null", header -> header.line(statement));
            }
        });
    }

    private static ProxyMethodParameter bodyParameter(ProxyMethod method) {
        // The processor did not treat @FormParam as a request body binding.
        if ("application/x-www-form-urlencoded".equals(method.getRequestContentType())) {
            return null;
        }
        ProxyMethodParameter body = null;
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() == RequestParameterLocation.BODY) {
                body = parameter;
            }
        }
        return body;
    }

    /**
     * Emits the body and its Content-Type together. To match the processor, typed response decoding reuses the
     * serialization format computed for a primitive request body. For reference types, any format variable is scoped
     * to the body null check, so response decoding uses the response Content-Type instead.
     *
     * @param method the operation whose body binding and media type are used
     * @param block the generated method body
     * @param request the generated request variable name
     * @param names the names already in use in the generated method
     * @return the serialization format variable if available to response decoding, or {@code null}
     */
    private static String writeRequestBody(ProxyMethod method, JavaBlock block, String request, Set<String> names) {
        ProxyMethodParameter body = bodyParameter(method);
        if (body == null) {
            return null;
        }
        // The processor let a parameter named contentType override the declared media type.
        String mediaType = method.getParameters()
            .stream()
            .filter(parameter -> "contentType".equals(parameter.getName()))
            .findFirst()
            .map(ClientCoreHttpOperationTemplate::stringValue)
            .orElseGet(() -> literal(
                method.getRequestContentType() == null ? "application/json" : method.getRequestContentType()));
        boolean serialize = serializesBody(method, body);
        String format = serialize ? localName(names, "requestFormat") : null;
        if (body.getWireType() instanceof PrimitiveType) {
            writeNonNullBody(block, request, body, mediaType, format);
            return format;
        }
        block.ifBlock(body.getName() + " != null",
            present -> writeNonNullBody(present, request, body, mediaType, format));
        return null;
    }

    private static boolean serializesBody(ProxyMethod method, ProxyMethodParameter body) {
        String contentType = method.getRequestContentType();
        IType type = body.getWireType();
        // A declared JSON body is serialized even for String. For other media types, raw text and bytes pass through.
        return (contentType != null && "application/json".equalsIgnoreCase(contentType.trim()))
            || !(ClassType.BINARY_DATA.equals(type)
                || ClassType.STRING.equals(type)
                || ClassType.BYTE_BUFFER.equals(type)
                || ArrayType.BYTE_ARRAY.equals(type));
    }

    private static void writeNonNullBody(JavaBlock block, String request, ProxyMethodParameter body, String mediaType,
        String format) {
        block.line("%s.getHeaders().set(HttpHeaderName.CONTENT_TYPE, %s);", request, mediaType);
        String value = body.getName();
        IType type = body.getWireType();
        if (format != null) {
            block.line("SerializationFormat %s = CoreUtils.serializationFormatFromContentType(%s.getHeaders());",
                format, request);
            block.line("%s.setBody(BinaryData.fromObject(%s, this.xmlSerializer.supportsFormat(%s)"
                + " ? this.xmlSerializer : this.jsonSerializer));", request, value, format);
        } else if (ClassType.BINARY_DATA.equals(type)) {
            // The processor did not attach raw bodies of unknown length. For known lengths, setBody sets Content-Length.
            block.ifBlock(value + ".getLength() != null", known -> known.line("%s.setBody(%s);", request, value));
        } else if (ClassType.STRING.equals(type)) {
            block.line("%s.setBody(BinaryData.fromString(%s));", request, value);
        } else {
            block.line("%s.setBody(BinaryData.fromBytes(%s));", request,
                ClassType.BYTE_BUFFER.equals(type) ? value + ".array()" : value);
        }
    }

    private static void writeResponse(ProxyMethod method, JavaBlock block, String response, String requestFormat,
        Set<String> names, JavaSettings settings) {
        String status = localName(names, "responseCode");
        block.line("int %s = %s.getStatusCode();", status, response);
        List<Integer> statuses = method.getResponseExpectedStatusCodes();
        // Only an empty list accepts any 2xx. Even a boolean HEAD operation must pass this check before returning.
        String success = CoreUtils.isNullOrEmpty(statuses)
            ? status + " >= 200 && " + status + " < 300"
            : statuses.stream().map(code -> status + " == " + code).collect(Collectors.joining(" || "));
        String expected = localName(names, "expectedResponse");
        block.line("boolean %s = %s;", expected, success);
        block.ifBlock("!" + expected, unexpected -> {
            // The runtime prefers a status-specific error body type over the default and closes the failed response.
            String defaultType = defaultErrorType(method, settings);
            Map<Integer, String> errorTypes = statusErrorTypes(method, settings);
            String specificTypes = errorTypes.isEmpty()
                ? "null"
                : errorTypes.entrySet()
                    .stream()
                    .map(entry -> "Map.entry(" + entry.getKey() + ", " + entry.getValue() + ")")
                    .collect(Collectors.joining(", ", "Map.ofEntries(", ")"));
            unexpected.line("GeneratedCodeUtils.handleUnexpectedResponse(%s, %s, this.jsonSerializer, "
                + "this.xmlSerializer, %s, %s, HTTP_LOG);", status, response, defaultType, specificTypes);
        });

        IType type = entityType(method);
        boolean wrapped = isResponse(method.getReturnType().getClientType());
        String value;
        if (type == PrimitiveType.VOID && !wrapped) {
            return;
        } else if (isVoid(type)) {
            value = "null";
        } else if (isBooleanHead(method)) {
            value = expected;
        } else if (ClassType.BINARY_DATA.equals(type)) {
            block.methodReturn(wrapped ? response : response + ".getValue()");
            return;
        } else if (ClassType.INPUT_STREAM.equals(type)) {
            value = response + ".getValue().toStream()";
        } else if (ArrayType.BYTE_ARRAY.equals(type)) {
            String bytes = localName(names, "responseBody");
            block.line("BinaryData %s = %s.getValue();", bytes, response);
            String decode = bytes + ".toBytes()";
            // Both raw and base64url responses return byte[]; the wire type determines whether to decode.
            if (ClassType.BASE_64_URL.equals(method.getReturnValueWireType())) {
                decode = "new " + ClassType.BASE_64_URL.getName() + "(" + decode + ").decodedBytes()";
            }
            value = bytes + " == null ? null : " + decode;
        } else {
            // CoreUtils unwraps a Response token and passes its entity Type to the serializer.
            String token = "CoreUtils.createParameterizedType(Response.class, " + typeToken(type) + ")";
            String format = requestFormat == null
                ? "CoreUtils.serializationFormatFromContentType(" + response + ".getHeaders())"
                : requestFormat;
            value = "this.decodeResponse(" + response + ".getValue(), " + token + ", " + format + ")";
        }
        block.methodReturn(wrapped
            ? "new Response<>(" + response + ".getRequest(), " + status + ", " + response + ".getHeaders(), " + value
                + ")"
            : value);
    }

    private static boolean isResponse(IType type) {
        return ClassType.RESPONSE.equals(type)
            || (type instanceof GenericType
                && "Response".equals(((GenericType) type).getName())
                && ClassType.RESPONSE.getPackage().equals(((GenericType) type).getPackage()));
    }

    private static IType entityType(ProxyMethod method) {
        IType type = method.getReturnType().getClientType();
        if (isResponse(type)) {
            return type instanceof GenericType
                ? ((GenericType) type).getTypeArguments()[0].asNullable()
                : ClassType.BINARY_DATA;
        }
        return type;
    }

    private static boolean isBooleanHead(ProxyMethod method) {
        return HttpMethod.HEAD == method.getHttpMethod() && ClassType.BOOLEAN.equals(entityType(method).asNullable());
    }

    private static boolean isVoid(IType type) {
        return ClassType.VOID.equals(type.asNullable());
    }

    private static boolean decodesResponse(ProxyMethod method) {
        IType type = entityType(method);
        return !isVoid(type)
            && !isBooleanHead(method)
            && !ClassType.BINARY_DATA.equals(type)
            && !ClassType.INPUT_STREAM.equals(type)
            && !ArrayType.BYTE_ARRAY.equals(type);
    }

    private static String typeToken(IType type) {
        if (type instanceof GenericType) {
            GenericType generic = (GenericType) type;
            // Preserve nested type arguments for deserialization; a raw class literal would erase them.
            return Arrays.stream(generic.getTypeArguments())
                .map(argument -> typeToken(argument.asNullable()))
                .collect(Collectors.joining(", ", "CoreUtils.createParameterizedType(" + generic.getName() + ".class, ",
                    ")"));
        }
        return type + ".class";
    }

    private static String defaultErrorType(ProxyMethod method, JavaSettings settings) {
        ClientModel model = errorModel(method.getUnexpectedResponseExceptionType(), settings);
        return model == null ? "null" : "CoreUtils.createParameterizedType(" + model.getFullName() + ".class)";
    }

    private static Map<Integer, String> statusErrorTypes(ProxyMethod method, JavaSettings settings) {
        Map<Integer, String> types = new LinkedHashMap<>();
        if (method.getUnexpectedResponseExceptionTypes() != null) {
            method.getUnexpectedResponseExceptionTypes().forEach((exception, codes) -> {
                ClientModel model = errorModel(exception, settings);
                // An explicit status without a model still needs an Object entry to override the default error model.
                String type = "CoreUtils.createParameterizedType(" + (model == null ? "Object" : model.getFullName())
                    + ".class)";
                codes.forEach(code -> types.put(code, type));
            });
        }
        return types;
    }

    private static ClientModel errorModel(ClassType exception, JavaSettings settings) {
        return exception == null || settings.isUseDefaultHttpStatusCodeToExceptionTypeMapping()
            ? null
            : ClientModelUtil.getErrorModelFromException(exception);
    }

    private static boolean isOffsetDateTime(IType type) {
        return type instanceof ClassType && "java.time.OffsetDateTime".equals(((ClassType) type).getFullName());
    }

    private static String stringValue(ProxyMethodParameter parameter) {
        return ClassType.STRING.equals(parameter.getWireType())
            ? parameter.getName()
            : "String.valueOf(" + parameter.getName() + ")";
    }

    private static String literal(String value) {
        return "\"" + TemplateUtil.escapeString(value) + "\"";
    }

    private static String localName(Set<String> names, String preferred) {
        String name = preferred;
        for (int i = 1; !names.add(name); i++) {
            name = preferred + i;
        }
        return name;
    }

    private ClientCoreHttpOperationTemplate() {
    }
}
