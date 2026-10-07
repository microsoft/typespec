package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import io.clientcore.core.http.models.HttpMethod;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

final class ClientCoreProtocolImplementationTemplate {
    private static final String CORE = "io.clientcore.core.";
    private static final String HTTP = CORE + "http.models.";
    private static final String UTILS = CORE + "utils.";
    private static final String BINARY_DATA = CORE + "models.binarydata.BinaryData";
    private static final Pattern PATH_PARAMETER = Pattern.compile("\\{([^{}]+)}");

    private ClientCoreProtocolImplementationTemplate() {
    }

    static void write(Proxy proxy, JavaClass classBlock) {
        JavaVisibility visibility
            = JavaSettings.getInstance().isServiceInterfaceAsPublic() ? JavaVisibility.Public : JavaVisibility.Private;
        classBlock.interfaceBlock(visibility, proxy.getName(), interfaceBlock -> {
            interfaceBlock.staticMethod(JavaVisibility.PackagePrivate,
                proxy.getName() + " getNewInstance(" + CORE + "http.pipeline.HttpPipeline pipeline)",
                block -> block.line("return new %sImpl(pipeline);", proxy.getName()));
            for (ProxyMethod method : proxy.getMethods()) {
                if (method.getImplementation() == null) {
                    interfaceBlock.publicMethod(signature(method));
                } else {
                    interfaceBlock.defaultMethod(signature(method), block -> block.line(method.getImplementation()));
                }
            }
        });
        classBlock.privateStaticFinalClass(proxy.getName() + "Impl implements " + proxy.getName(), implementation -> {
            implementation.privateStaticFinalVariable(CORE + "instrumentation.logging.ClientLogger LOGGER = new " + CORE
                + "instrumentation.logging.ClientLogger(" + proxy.getName() + "Impl.class)");
            implementation.privateFinalMemberVariable(CORE + "http.pipeline.HttpPipeline httpPipeline");
            implementation.privateFinalMemberVariable(CORE + "serialization.json.JsonSerializer jsonSerializer = "
                + CORE + "serialization.json.JsonSerializer.getInstance()");
            implementation.privateFinalMemberVariable(CORE + "serialization.xml.XmlSerializer xmlSerializer = " + CORE
                + "serialization.xml.XmlSerializer.getInstance()");
            implementation.privateConstructor(proxy.getName() + "Impl(" + CORE + "http.pipeline.HttpPipeline pipeline)",
                block -> block.line("this.httpPipeline = pipeline;"));
            for (ProxyMethod method : proxy.getMethods()) {
                if (method.getImplementation() == null) {
                    implementation.annotation("Override");
                    implementation.publicMethod(signature(method), block -> writeMethod(proxy, method, block));
                }
            }
        });
    }

    private static String signature(ProxyMethod method) {
        return method.getReturnType().getClientType() + " " + method.getName() + "("
            + method.getParameters()
                .stream()
                .map(parameter -> parameter.getWireType() + " " + parameter.getName())
                .collect(Collectors.joining(", "))
            + ")";
    }

    private static void writeMethod(Proxy proxy, ProxyMethod method, JavaBlock block) {
        Set<String> names = method.getParameters()
            .stream()
            .map(ProxyMethodParameter::getName)
            .collect(Collectors.toCollection(HashSet::new));
        String request = localName(names, "httpRequest");
        String uri = localName(names, "uriBuilder");
        String response = localName(names, "networkResponse");
        String status = localName(names, "responseCode");
        block.line(UTILS + "UriBuilder %s = " + UTILS + "UriBuilder.parse(%s);", uri, urlExpression(proxy, method));
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() == RequestParameterLocation.QUERY) {
                block.line(UTILS + "GeneratedCodeUtils.addQueryParameter(%s, %s, true, %s, %s);", uri,
                    quote(parameter.getRequestParameterName()), parameter.getName(), !parameter.getAlreadyEncoded());
            }
        }
        block.line(HTTP + "HttpRequest %s = new " + HTTP + "HttpRequest().setMethod(" + HTTP
            + "HttpMethod.%s).setUri(%s.toString());", request, method.getHttpMethod(), uri);
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() == RequestParameterLocation.HEADER) {
                writeHeader(parameter, block, request, names);
            }
        }
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() == RequestParameterLocation.BODY) {
                if (parameter.getWireType() instanceof PrimitiveType) {
                    writeBody(method, parameter, block, request, names);
                } else {
                    block.ifBlock(parameter.getName() + " != null",
                        body -> writeBody(method, parameter, body, request, names));
                }
            }
        }
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (ClassType.REQUEST_CONTEXT.equals(parameter.getWireType())) {
                block.ifBlock(parameter.getName() + " != null", contextBlock -> {
                    contextBlock.line("%s.setContext(%s);", request, parameter.getName());
                    contextBlock.line("%s.getRequestCallback().accept(%s);", parameter.getName(), request);
                });
            }
        }
        block.line(HTTP + "Response<" + BINARY_DATA + "> %s = this.httpPipeline.send(%s);", response, request);
        block.line("int %s = %s.getStatusCode();", status, response);
        String expected = method.getResponseExpectedStatusCodes().isEmpty()
            ? status + " >= 200 && " + status + " < 300"
            : method.getResponseExpectedStatusCodes()
                .stream()
                .map(code -> status + " == " + code)
                .collect(Collectors.joining(" || "));
        block.ifBlock("!(" + expected + ")", error -> writeError(proxy, method, error, response, status, names));
        IType returnType = method.getReturnType().getClientType();
        boolean returnsResponse = returnType instanceof GenericType
            && ((GenericType) returnType).getName().equals(ClassType.RESPONSE.getName());
        IType bodyType = returnsResponse ? ((GenericType) returnType).getTypeArguments()[0] : returnType;
        if (ClassType.BINARY_DATA.equals(bodyType) || ClassType.INPUT_STREAM.equals(bodyType)) {
            writeReturn(method, block, response, status, bodyType, returnsResponse, names);
        } else {
            block.tryBlock(success -> writeReturn(method, success, response, status, bodyType, returnsResponse, names))
                .finallyBlock(cleanup -> cleanup.line("%s.close();", response));
        }
    }

    private static void writeHeader(ProxyMethodParameter parameter, JavaBlock block, String request,
        Set<String> names) {
        String prefix = parameter.getHeaderCollectionPrefix();
        if (prefix != null && !prefix.isEmpty()) {
            String key = localName(names, "headerName");
            String value = localName(names, "headerValue");
            block.ifBlock(parameter.getName() + " != null",
                headers -> headers.line(
                    "%s.forEach((%s, %s) -> %s.getHeaders().set(" + HTTP
                        + "HttpHeaderName.fromString(%s + %s), String.valueOf(%s)));",
                    parameter.getName(), key, value, request, quote(prefix), key, value));
        } else {
            String statement = request + ".getHeaders().set(" + HTTP + "HttpHeaderName.fromString("
                + quote(parameter.getRequestParameterName()) + "), " + stringValue(parameter) + ");";
            if (parameter.getWireType() instanceof PrimitiveType) {
                block.line(statement);
            } else {
                block.ifBlock(parameter.getName() + " != null", header -> header.line(statement));
            }
        }
    }

    private static void writeBody(ProxyMethod method, ProxyMethodParameter parameter, JavaBlock block, String request,
        Set<String> names) {
        block.ifBlock(request + ".getHeaders().get(" + HTTP + "HttpHeaderName.CONTENT_TYPE) == null",
            contentType -> contentType.line("%s.getHeaders().set(" + HTTP + "HttpHeaderName.CONTENT_TYPE, %s);",
                request, quote(method.getRequestContentType())));
        IType type = parameter.getWireType();
        String value = parameter.getName();
        String mediaType = method.getRequestContentType();
        boolean json = mediaType.contains("json");
        if (ClassType.BINARY_DATA.equals(type)) {
            block.line("%s.setBody(%s);", request, value);
        } else if (ArrayType.BYTE_ARRAY.equals(type) && !json) {
            block.line("%s.setBody(" + BINARY_DATA + ".fromBytes(%s));", request, value);
        } else if (ClassType.STRING.equals(type) && !json) {
            block.line("%s.setBody(" + BINARY_DATA + ".fromString(%s));", request, value);
        } else if (ClassType.INPUT_STREAM.equals(type)) {
            block.line("%s.setBody(" + BINARY_DATA + ".fromStream(%s));", request, value);
        } else {
            String format = localName(names, "requestSerializationFormat");
            block.line(CORE + "serialization.SerializationFormat %s = " + UTILS
                + "CoreUtils.serializationFormatFromContentType(%s.getHeaders());", format, request);
            block.line("%s.setBody(" + BINARY_DATA
                + ".fromObject(%s, this.xmlSerializer.supportsFormat(%s) ? this.xmlSerializer : this.jsonSerializer));",
                request, value, format);
        }
    }

    private static void writeError(Proxy proxy, ProxyMethod method, JavaBlock block, String response, String status,
        Set<String> names) {
        String errorTypes = "null";
        if (method.getUnexpectedResponseExceptionTypes() != null
            && !method.getUnexpectedResponseExceptionTypes().isEmpty()) {
            errorTypes = localName(names, "statusToExceptionTypeMap");
            block.line("java.util.Map<Integer, java.lang.reflect.ParameterizedType> %s = new java.util.HashMap<>();",
                errorTypes);
            for (Map.Entry<ClassType, List<Integer>> mapping : method.getUnexpectedResponseExceptionTypes()
                .entrySet()) {
                String bodyType = errorBodyType(mapping.getKey());
                if ("null".equals(bodyType)) {
                    bodyType = UTILS + "CoreUtils.createParameterizedType(Object.class)";
                }
                for (Integer code : mapping.getValue()) {
                    block.line("%s.put(%s, %s);", errorTypes, code, bodyType);
                }
            }
        }
        block.line(UTILS
            + "GeneratedCodeUtils.handleUnexpectedResponse(%s, %s, this.jsonSerializer, this.xmlSerializer, %s, %s, %sImpl.LOGGER);",
            status, response, errorBodyType(method.getUnexpectedResponseExceptionType()), errorTypes, proxy.getName());
    }

    private static String errorBodyType(ClassType exception) {
        ClientModel model = exception == null ? null : ClientModelUtil.getErrorModelFromException(exception);
        return model == null ? "null" : UTILS + "CoreUtils.createParameterizedType(" + model.getFullName() + ".class)";
    }

    private static void writeReturn(ProxyMethod method, JavaBlock block, String response, String status, IType bodyType,
        boolean returnsResponse, Set<String> names) {
        if (PrimitiveType.VOID.equals(bodyType)) {
            block.line("return;");
            return;
        }
        String value;
        if (ClassType.VOID.equals(bodyType)) {
            value = "null";
        } else if (ClassType.BINARY_DATA.equals(bodyType)) {
            if (returnsResponse) {
                block.line("return %s;", response);
                return;
            }
            value = response + ".getValue()";
        } else if (ClassType.INPUT_STREAM.equals(bodyType)) {
            value = response + ".getValue() == null ? null : " + response + ".getValue().toStream()";
        } else if (method.getHttpMethod() == HttpMethod.HEAD
            && (PrimitiveType.BOOLEAN.equals(bodyType) || ClassType.BOOLEAN.equals(bodyType))) {
            value = status + " >= 200 && " + status + " < 300";
        } else if (ArrayType.BYTE_ARRAY.equals(bodyType)) {
            value = response + ".getValue() == null ? null : " + response + ".getValue().toBytes()";
            if (ClassType.BASE_64_URL.equals(method.getReturnValueWireType())) {
                value = response + ".getValue() == null ? null : new " + UTILS + "Base64Uri(" + response
                    + ".getValue().toBytes()).decodedBytes()";
            }
        } else {
            IType wireType = method.getReturnValueWireType();
            if (wireType == null) {
                IType wireReturn = method.getReturnType();
                wireType = returnsResponse ? ((GenericType) wireReturn).getTypeArguments()[0] : wireReturn;
            }
            String decoded = localName(names, "deserializedResult");
            String format = localName(names, "responseSerializationFormat");
            String responseType
                = UTILS + "CoreUtils.createParameterizedType(" + HTTP + "Response.class, " + typeToken(wireType) + ")";
            block.line("%s %s;", wireType.asNullable(), decoded);
            block.line(CORE + "serialization.SerializationFormat %s = " + UTILS
                + "CoreUtils.serializationFormatFromContentType(%s.getHeaders());", format, response);
            block
                .ifBlock("this.jsonSerializer.supportsFormat(" + format + ")",
                    json -> json.line(
                        "%s = " + UTILS + "CoreUtils.decodeNetworkResponse(%s.getValue(), this.jsonSerializer, %s);",
                        decoded, response, responseType))
                .elseIfBlock("this.xmlSerializer.supportsFormat(" + format + ")",
                    xml -> xml.line(
                        "%s = " + UTILS + "CoreUtils.decodeNetworkResponse(%s.getValue(), this.xmlSerializer, %s);",
                        decoded, response, responseType))
                .elseBlock(unsupported -> unsupported.line(
                    "throw new UnsupportedOperationException(\"Unsupported response serialization format: \" + %s);",
                    format));
            value = wireType.convertToClientType(decoded);
            if (!wireType.equals(wireType.getClientType()) && !(bodyType instanceof PrimitiveType)) {
                value = decoded + " == null ? null : " + value;
            }
        }
        if (returnsResponse) {
            block.line("return new " + HTTP + "Response<>(%s.getRequest(), %s, %s.getHeaders(), %s);", response, status,
                response, value);
        } else {
            block.line("return %s;", value);
        }
    }

    private static String typeToken(IType type) {
        if (type instanceof GenericType) {
            GenericType generic = (GenericType) type;
            return UTILS + "CoreUtils.createParameterizedType(" + generic.getPackage() + "." + generic.getName()
                + ".class, "
                + java.util.Arrays.stream(generic.getTypeArguments())
                    .map(ClientCoreProtocolImplementationTemplate::typeToken)
                    .collect(Collectors.joining(", "))
                + ")";
        }
        return type.asNullable() + ".class";
    }

    private static String urlExpression(Proxy proxy, ProxyMethod method) {
        String path = method.getUrlPath();
        String host = proxy.getBaseURL();
        String template;
        if (path.contains("{nextLink}")) {
            template = "{nextLink}";
        } else if (path.contains("://") || host == null || host.isEmpty()) {
            template = path;
        } else {
            template = host + (host.endsWith("/") || path.startsWith("/") ? "" : "/") + path;
        }
        List<String> expressions = new ArrayList<>();
        Matcher matcher = PATH_PARAMETER.matcher(template);
        int offset = 0;
        while (matcher.find()) {
            if (matcher.start() > offset) {
                expressions.add(quote(template.substring(offset, matcher.start())));
            }
            String parameterName = matcher.group(1);
            ProxyMethodParameter parameter = method.getParameters()
                .stream()
                .filter(candidate -> parameterName.equals(candidate.getRequestParameterName())
                    && (candidate.getRequestParameterLocation() == RequestParameterLocation.URI
                        || candidate.getRequestParameterLocation() == RequestParameterLocation.PATH))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                    "Missing path parameter '" + parameterName + "' in protocol method '" + method.getName() + "'."));
            String value = stringValue(parameter);
            if (!parameter.getAlreadyEncoded() && !"nextLink".equals(parameterName)) {
                value = CORE + "implementation.utils.UriEscapers.PATH_ESCAPER.escape(" + value + ")";
            }
            expressions.add(value);
            offset = matcher.end();
        }
        if (offset < template.length() || expressions.isEmpty()) {
            expressions.add(quote(template.substring(offset)));
        }
        return String.join(" + ", expressions);
    }

    private static String stringValue(ProxyMethodParameter parameter) {
        if (ClassType.STRING.equals(parameter.getWireType())) {
            return parameter.getName();
        } else if (ClassType.DATE_TIME.equals(parameter.getWireType())) {
            return parameter.getName() + ".format(java.time.format.DateTimeFormatter.ISO_INSTANT)";
        }
        return "String.valueOf(" + parameter.getName() + ")";
    }

    private static String quote(String value) {
        return "\"" + TemplateUtil.escapeString(value) + "\"";
    }

    private static String localName(Set<String> names, String preferred) {
        String name = preferred;
        while (!names.add(name)) {
            name += "_";
        }
        return name;
    }
}
