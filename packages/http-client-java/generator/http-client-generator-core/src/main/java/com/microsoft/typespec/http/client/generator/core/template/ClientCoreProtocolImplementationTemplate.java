package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IterableType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpMethod;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.implementation.utils.UriEscapers;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.serialization.xml.XmlSerializer;
import io.clientcore.core.utils.Base64Uri;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import io.clientcore.core.utils.UriBuilder;
import java.lang.reflect.ParameterizedType;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

final class ClientCoreProtocolImplementationTemplate {
    private static final Pattern PATH_PARAMETER = Pattern.compile("\\{([^{}]+)}");

    private ClientCoreProtocolImplementationTemplate() {
    }

    static void addImportsTo(Proxy proxy, Set<String> imports) {
        imports.add(HttpPipeline.class.getName());
        if (proxy.getMethods().stream().noneMatch(method -> method.getImplementation() == null)) {
            return;
        }
        imports.addAll(Arrays.asList(ClientLogger.class.getName(), HttpRequest.class.getName(),
            HttpMethod.class.getName(), Response.class.getName(), BinaryData.class.getName(),
            JsonSerializer.class.getName(), CoreUtils.class.getName(), GeneratedCodeUtils.class.getName()));
        imports.add(JavaSettings.getInstance().getPackage(JavaSettings.getInstance().getImplementationSubpackage())
            + "." + ClientModelUtil.CLIENT_CORE_PROTOCOL_UTILS);
        for (ProxyMethod method : proxy.getMethods()) {
            if (method.getImplementation() != null) {
                continue;
            }
            boolean xmlErrors = supportsXmlErrors(method);
            if (usesXmlSerializer(method) || xmlErrors) {
                imports.add(XmlSerializer.class.getName());
            }
            if (method.getUnexpectedResponseExceptionTypes() != null
                && !method.getUnexpectedResponseExceptionTypes().isEmpty()) {
                imports.add(Map.class.getName());
                imports.add(HashMap.class.getName());
                imports.add(Collections.class.getName());
                imports.add(ParameterizedType.class.getName());
                imports.add(IntStream.class.getName());
            }
            if (ClassType.BASE_64_URL.equals(method.getReturnValueWireType())) {
                imports.add(Base64Uri.class.getName());
            }
            if (deserializesResponse(method)
                && responseUsesJson(method)
                && requiresTypedJsonDeserialization(responseWireType(method))) {
                imports.add(JsonReader.class.getName());
                responseWireType(method).getClientType().addImportsTo(imports, true);
            }
            for (ProxyMethodParameter parameter : method.getParameters()) {
                RequestParameterLocation location = parameter.getRequestParameterLocation();
                if (location == RequestParameterLocation.QUERY) {
                    imports.add(UriBuilder.class.getName());
                }
                if (location == RequestParameterLocation.HEADER || location == RequestParameterLocation.BODY) {
                    imports.add(HttpHeaderName.class.getName());
                }
                if (location == RequestParameterLocation.URI || location == RequestParameterLocation.PATH) {
                    if (!parameter.getAlreadyEncoded() && !"nextLink".equals(parameter.getRequestParameterName())) {
                        imports.add(UriEscapers.class.getName());
                    }
                }
                if ((location == RequestParameterLocation.URI
                    || location == RequestParameterLocation.PATH
                    || location == RequestParameterLocation.HEADER)
                    && ClassType.DATE_TIME.equals(parameter.getWireType())) {
                    imports.add(DateTimeFormatter.class.getName());
                }
            }
        }
    }

    static void write(Proxy proxy, JavaClass classBlock) {
        List<ProxyMethod> methods = proxy.getMethods()
            .stream()
            .filter(method -> method.getImplementation() == null)
            .collect(Collectors.toList());
        boolean usesJson = methods.stream().anyMatch(ClientCoreProtocolImplementationTemplate::usesJsonSerializer);
        boolean usesXml = methods.stream().anyMatch(ClientCoreProtocolImplementationTemplate::usesXmlSerializer);
        ProtocolMetadata metadata = new ProtocolMetadata(methods);
        JavaVisibility visibility
            = JavaSettings.getInstance().isServiceInterfaceAsPublic() ? JavaVisibility.Public : JavaVisibility.Private;
        classBlock.interfaceBlock(visibility, proxy.getName(), interfaceBlock -> {
            interfaceBlock.staticMethod(JavaVisibility.PackagePrivate,
                proxy.getName() + " getNewInstance(HttpPipeline pipeline)",
                block -> block.line("return new %sImpl(%s);", proxy.getName(), methods.isEmpty() ? "" : "pipeline"));
            for (ProxyMethod method : proxy.getMethods()) {
                if (method.getImplementation() == null) {
                    interfaceBlock.publicMethod(signature(method));
                } else {
                    interfaceBlock.defaultMethod(signature(method), block -> block.line(method.getImplementation()));
                }
            }
        });
        classBlock.privateStaticFinalClass(proxy.getName() + "Impl implements " + proxy.getName(), implementation -> {
            if (!methods.isEmpty()) {
                implementation.privateStaticFinalVariable(
                    "ClientLogger LOGGER = new ClientLogger(" + proxy.getName() + "Impl.class)");
                implementation.privateFinalMemberVariable("HttpPipeline httpPipeline");
            }
            if (usesJson) {
                implementation
                    .privateStaticFinalVariable("JsonSerializer JSON_SERIALIZER = JsonSerializer.getInstance()");
            }
            if (usesXml) {
                implementation.privateStaticFinalVariable("XmlSerializer XML_SERIALIZER = XmlSerializer.getInstance()");
            }
            metadata.write(implementation);
            implementation.privateConstructor(
                proxy.getName() + "Impl(" + (methods.isEmpty() ? "" : "HttpPipeline pipeline") + ")", block -> {
                    if (!methods.isEmpty()) {
                        block.line("this.httpPipeline = pipeline;");
                    }
                });
            for (ProxyMethod method : methods) {
                implementation.annotation("Override");
                implementation.publicMethod(signature(method),
                    block -> writeMethod(proxy, method, block, usesJson, usesXml, metadata));
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

    private static void writeMethod(Proxy proxy, ProxyMethod method, JavaBlock block, boolean usesJson, boolean usesXml,
        ProtocolMetadata metadata) {
        Set<String> names = method.getParameters()
            .stream()
            .map(ProxyMethodParameter::getName)
            .collect(Collectors.toCollection(HashSet::new));
        String request = localName(names, "httpRequest");
        String uri = localName(names, "uriBuilder");
        String response = localName(names, "networkResponse");
        String status = localName(names, "responseCode");
        boolean hasQuery = method.getParameters()
            .stream()
            .anyMatch(parameter -> parameter.getRequestParameterLocation() == RequestParameterLocation.QUERY);
        String requestUri = urlExpression(proxy, method);
        if (hasQuery) {
            block.line("UriBuilder %s = UriBuilder.parse(%s);", uri, requestUri);
            for (ProxyMethodParameter parameter : method.getParameters()) {
                if (parameter.getRequestParameterLocation() == RequestParameterLocation.QUERY) {
                    block.line("GeneratedCodeUtils.addQueryParameter(%s, %s, true, %s, %s);", uri,
                        quote(parameter.getRequestParameterName()), parameter.getName(),
                        !parameter.getAlreadyEncoded());
                }
            }
            requestUri = uri + ".toString()";
        }
        block.line("HttpRequest %s = new HttpRequest().setMethod(HttpMethod.%s).setUri(%s);", request,
            method.getHttpMethod(), requestUri);
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() == RequestParameterLocation.HEADER) {
                writeHeader(parameter, block, request, names);
            }
        }
        for (ProxyMethodParameter parameter : method.getParameters()) {
            if (parameter.getRequestParameterLocation() == RequestParameterLocation.BODY) {
                writeBody(proxy, method, parameter, block, request);
            }
        }
        String context = method.getParameters()
            .stream()
            .filter(parameter -> ClassType.REQUEST_CONTEXT.equals(parameter.getWireType()))
            .map(ProxyMethodParameter::getName)
            .findFirst()
            .orElse(null);
        if (context == null) {
            block.line("Response<BinaryData> %s = this.httpPipeline.send(%s);", response, request);
        } else {
            block.line("Response<BinaryData> %s = ClientCoreProtocolUtils.send(this.httpPipeline, %s, %s);", response,
                request, context);
        }
        block.line("int %s = %s.getStatusCode();", status, response);
        String expected = expectedStatusCondition(method.getResponseExpectedStatusCodes(), status);
        block.ifBlock("!(" + expected + ")",
            error -> writeError(proxy, method, error, response, usesJson, usesXml, metadata));
        IType returnType = method.getReturnType().getClientType();
        boolean returnsResponse = returnType instanceof GenericType
            && ((GenericType) returnType).getName().equals(ClassType.RESPONSE.getName());
        IType bodyType = returnsResponse ? ((GenericType) returnType).getTypeArguments()[0].asNullable() : returnType;
        if (ClassType.BINARY_DATA.equals(bodyType) || ClassType.INPUT_STREAM.equals(bodyType)) {
            writeReturn(proxy, method, block, response, status, bodyType, returnsResponse, names, metadata);
        } else if (PrimitiveType.VOID.equals(bodyType)) {
            block.line("%s.close();", response);
            block.line("return;");
        } else {
            String expression = responseExpression(proxy, method, response, status, bodyType, names, metadata);
            String helper = returnsResponse ? "mapResponse" : "readResponse";
            if (expression != null) {
                block.line("return ClientCoreProtocolUtils.%s(%s, () -> %s);", helper, response, expression);
            } else {
                block.line("return ClientCoreProtocolUtils.%s(%s, () -> {", helper, response);
                block.indent(
                    () -> writeReturn(proxy, method, block, response, status, bodyType, false, names, metadata));
                block.line("});");
            }
        }
    }

    private static String responseExpression(Proxy proxy, ProxyMethod method, String response, String status,
        IType bodyType, Set<String> names, ProtocolMetadata metadata) {
        if (ClassType.VOID.equals(bodyType)) {
            return "null";
        }
        if (method.getHttpMethod() == HttpMethod.HEAD
            && (PrimitiveType.BOOLEAN.equals(bodyType) || ClassType.BOOLEAN.equals(bodyType))) {
            return status + " >= 200 && " + status + " < 300";
        }
        if (ArrayType.BYTE_ARRAY.equals(bodyType) && !byteResponseUsesJson(method)) {
            return null;
        }
        IType wireType = responseWireType(method);
        if (!wireType.equals(wireType.getClientType())) {
            return null;
        }
        String owner = proxy.getName() + "Impl.";
        if (responseUsesJson(method) && responseUsesXml(method)) {
            return "ClientCoreProtocolUtils.readMixed(" + response + ", () -> "
                + responseDecodingExpression(wireType, response, owner, true, names, metadata) + ", () -> "
                + responseDecodingExpression(wireType, response, owner, false, names, metadata) + ")";
        }
        if (responseUsesJson(method) && requiresTypedJsonDeserialization(wireType)) {
            return jsonResponseExpression(wireType, response, owner, names);
        }
        String serializer = owner + (responseUsesXml(method) ? "XML_SERIALIZER" : "JSON_SERIALIZER");
        return "CoreUtils.decodeNetworkResponse(" + response + ".getValue(), " + serializer + ", "
            + responseTypeToken(wireType) + ")";
    }

    private static String expectedStatusCondition(List<Integer> codes, String status) {
        if (codes.isEmpty()) {
            return status + " >= 200 && " + status + " < 300";
        }
        List<Integer> ordered = codes.stream().distinct().sorted().collect(Collectors.toList());
        List<String> conditions = new ArrayList<>();
        for (int i = 0; i < ordered.size(); i++) {
            int start = ordered.get(i);
            int end = start;
            while (i + 1 < ordered.size() && (long) ordered.get(i + 1) == (long) end + 1) {
                end = ordered.get(++i);
            }
            if ((long) end - start >= 2) {
                conditions.add("(" + status + " >= " + start + " && " + status + " <= " + end + ")");
            } else {
                conditions.add(status + " == " + start);
                if (end != start) {
                    conditions.add(status + " == " + end);
                }
            }
        }
        return String.join(" || ", conditions);
    }

    private static void writeHeader(ProxyMethodParameter parameter, JavaBlock block, String request,
        Set<String> names) {
        String prefix = parameter.getHeaderCollectionPrefix();
        if (prefix != null && !prefix.isEmpty()) {
            String key = localName(names, "headerName");
            String value = localName(names, "headerValue");
            block.ifBlock(parameter.getName() + " != null", headers -> headers.line(
                "%s.forEach((%s, %s) -> %s.getHeaders().set(HttpHeaderName.fromString(%s + %s), String.valueOf(%s)));",
                parameter.getName(), key, value, request, quote(prefix), key, value));
        } else {
            String statement = request + ".getHeaders().set(HttpHeaderName.fromString("
                + quote(parameter.getRequestParameterName()) + "), " + stringValue(parameter) + ");";
            if (parameter.getWireType() instanceof PrimitiveType) {
                block.line(statement);
            } else {
                block.ifBlock(parameter.getName() + " != null", header -> header.line(statement));
            }
        }
    }

    private static void writeBody(Proxy proxy, ProxyMethod method, ProxyMethodParameter parameter, JavaBlock block,
        String request) {
        IType type = parameter.getWireType();
        String value = parameter.getName();
        String mediaType = method.getRequestContentType();
        boolean json = isMediaType(mediaType, "json");
        String expression;
        if (ClassType.BINARY_DATA.equals(type)) {
            expression = value;
        } else if (ArrayType.BYTE_ARRAY.equals(type) && !json) {
            expression = "BinaryData.fromBytes(" + value + ")";
        } else if (ClassType.STRING.equals(type) && !json) {
            expression = "BinaryData.fromString(" + value + ")";
        } else if (ClassType.INPUT_STREAM.equals(type)) {
            expression = "BinaryData.fromStream(" + value + ")";
        } else {
            boolean xml = requestUsesXml(method, parameter);
            boolean jsonFormat = requestUsesJson(method, parameter);
            String owner = proxy.getName() + "Impl.";
            if (xml && jsonFormat) {
                block.line(
                    "ClientCoreProtocolUtils.setMixedBody(%s, %s, %s, () -> BinaryData.fromObject(%s, %sJSON_SERIALIZER), () -> BinaryData.fromObject(%s, %sXML_SERIALIZER));",
                    request, value, quote(mediaType), value, owner, value, owner);
                return;
            }
            expression
                = "BinaryData.fromObject(" + value + ", " + owner + (xml ? "XML_SERIALIZER" : "JSON_SERIALIZER") + ")";
        }
        block.line("ClientCoreProtocolUtils.setBody(%s, %s, %s, () -> %s);", request, value, quote(mediaType),
            expression);
    }

    private static void writeError(Proxy proxy, ProxyMethod method, JavaBlock block, String response, boolean usesJson,
        boolean usesXml, ProtocolMetadata metadata) {
        boolean xmlErrors = supportsXmlErrors(method);
        String owner = proxy.getName() + "Impl.";
        String jsonSerializer = usesJson ? owner + "JSON_SERIALIZER" : "JsonSerializer.getInstance()";
        String xmlSerializer
            = xmlErrors ? (usesXml ? owner + "XML_SERIALIZER" : "XmlSerializer.getInstance()") : "null";
        block.line("ClientCoreProtocolUtils.handleUnexpectedResponse(%s, %s, %s, %s, %s, %sLOGGER);", response,
            jsonSerializer, xmlSerializer, errorBodyType(method.getUnexpectedResponseExceptionType()),
            metadata.errorMap(method, owner), owner);
    }

    private static String errorBodyType(ClassType exception) {
        ClientModel model = exception == null ? null : ClientModelUtil.getErrorModelFromException(exception);
        return model == null ? "null" : "CoreUtils.createParameterizedType(" + model.getName() + ".class)";
    }

    private static void writeReturn(Proxy proxy, ProxyMethod method, JavaBlock block, String response, String status,
        IType bodyType, boolean returnsResponse, Set<String> names, ProtocolMetadata metadata) {
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
        } else if (ArrayType.BYTE_ARRAY.equals(bodyType) && !byteResponseUsesJson(method)) {
            value = response + ".getValue() == null ? null : " + response + ".getValue().toBytes()";
            if (ClassType.BASE_64_URL.equals(method.getReturnValueWireType())) {
                value = response + ".getValue() == null ? null : new Base64Uri(" + response
                    + ".getValue().toBytes()).decodedBytes()";
            }
        } else {
            IType wireType = responseWireType(method);
            String decoded = localName(names, "deserializedResult");
            boolean xml = responseUsesXml(method);
            boolean json = responseUsesJson(method);
            boolean typedJson = json && requiresTypedJsonDeserialization(wireType);
            String owner = proxy.getName() + "Impl.";
            if (typedJson && !xml) {
                block.line("return %s;", jsonResponseExpression(wireType, response, owner, names));
                return;
            }
            block.line("%s %s;", typedJson ? wireType.getClientType().asNullable() : wireType.asNullable(), decoded);
            if (xml && json) {
                String jsonExpression = responseDecodingExpression(wireType, response, owner, true, names, metadata);
                if (!typedJson || wireType.equals(wireType.getClientType())) {
                    block.line("%s = ClientCoreProtocolUtils.readMixed(%s, () -> %s, () -> %s);", decoded, response,
                        jsonExpression, responseDecodingExpression(wireType, response, owner, false, names, metadata));
                } else {
                    block.line("%s = ClientCoreProtocolUtils.readMixed(%s, () -> %s, () -> {", decoded, response,
                        jsonExpression);
                    block.indent(() -> {
                        String xmlDecoded = localName(names, "xmlResult");
                        block.line("%s %s;", wireType.getClientType().asNullable(), xmlDecoded);
                        writeResponseDeserialization(block, response, xmlDecoded, wireType, owner + "XML_SERIALIZER",
                            false, true, names, owner, metadata);
                        block.line("return %s;", xmlDecoded);
                    });
                    block.line("});");
                }
            } else {
                writeResponseDeserialization(block, response, decoded, wireType,
                    owner + (xml ? "XML_SERIALIZER" : "JSON_SERIALIZER"), typedJson, typedJson, names, owner, metadata);
            }
            value = typedJson ? decoded : convertResponseValue(wireType, decoded);
        }
        if (returnsResponse) {
            block.line("return new Response<>(%s.getRequest(), %s, %s.getHeaders(), %s);", response, status, response,
                value);
        } else {
            block.line("return %s;", value);
        }
    }

    private static IType responseWireType(ProxyMethod method) {
        IType type = method.getResponseBodyType();
        if (type == null) {
            type = method.getReturnType();
            if (type instanceof GenericType && ((GenericType) type).getName().equals(ClassType.RESPONSE.getName())) {
                type = ((GenericType) type).getTypeArguments()[0];
            }
        }
        // Return-value wire metadata describes a scalar encoding, not the enclosing collection.
        return type instanceof GenericType || method.getReturnValueWireType() == null
            ? type
            : method.getReturnValueWireType();
    }

    private static boolean requiresTypedJsonDeserialization(IType type) {
        if (type instanceof GenericType) {
            return Arrays.stream(((GenericType) type).getTypeArguments())
                .anyMatch(ClientCoreProtocolImplementationTemplate::requiresTypedJsonDeserialization);
        }
        return ClassType.DATE_TIME.equals(type.getClientType()) || ArrayType.BYTE_ARRAY.equals(type.getClientType());
    }

    private static String responseTypeToken(IType wireType) {
        return "CoreUtils.createParameterizedType(Response.class, " + typeToken(wireType) + ")";
    }

    private static String jsonResponseExpression(IType type, String response, String owner, Set<String> names) {
        String reader = localName(names, "jsonReader");
        return "ClientCoreProtocolUtils.readJson(" + response + ".getValue(), " + reader + " -> "
            + jsonResponseValue(type, reader, names) + ", " + owner + "LOGGER)";
    }

    private static String responseDecodingExpression(IType wireType, String response, String owner, boolean json,
        Set<String> names, ProtocolMetadata metadata) {
        if (json && requiresTypedJsonDeserialization(wireType)) {
            return jsonResponseExpression(wireType, response, owner, names);
        }
        return "CoreUtils.decodeNetworkResponse(" + response + ".getValue(), " + owner
            + (json ? "JSON_SERIALIZER" : "XML_SERIALIZER") + ", " + responseTypeToken(wireType) + ")";
    }

    private static void writeResponseDeserialization(JavaBlock block, String response, String decoded, IType wireType,
        String serializer, boolean typedJson, boolean clientValue, Set<String> names, String owner,
        ProtocolMetadata metadata) {
        if (typedJson) {
            block.line("%s = %s;", decoded, jsonResponseExpression(wireType, response, owner, names));
            return;
        }
        String target
            = clientValue && !wireType.equals(wireType.getClientType()) ? localName(names, "wireResult") : decoded;
        String responseType = responseTypeToken(wireType);
        block.line("%s%s = CoreUtils.decodeNetworkResponse(%s.getValue(), %s, %s);",
            target.equals(decoded) ? "" : wireType.asNullable() + " ", target, response, serializer, responseType);
        if (!target.equals(decoded)) {
            block.line("%s = %s;", decoded, convertResponseValue(wireType, target));
        }
    }

    private static String jsonResponseValue(IType type, String reader, Set<String> names) {
        if (type instanceof IterableType) {
            String elementReader = localName(names, "elementReader");
            return reader + ".readArray(" + elementReader + " -> "
                + jsonResponseValue(((IterableType) type).getElementType(), elementReader, names) + ")";
        }
        if (type instanceof MapType) {
            String valueReader = localName(names, "valueReader");
            return reader + ".readMap(" + valueReader + " -> "
                + jsonResponseValue(((MapType) type).getValueType(), valueReader, names) + ")";
        }
        if (ClassType.BASE_64_URL.equals(type)) {
            return "ClientCoreProtocolUtils.readBase64Url(" + reader + ")";
        }
        IType nullableType = type.asNullable();
        if (!type.equals(type.getClientType())) {
            String valueReader = localName(names, "valueReader");
            String value = nullableType.jsonDeserializationMethod(valueReader)
                .replace("nonNullReader", localName(names, "nonNullReader"));
            return reader + ".getNullable(" + valueReader + " -> " + nullableType.convertToClientType(value) + ")";
        }
        return nullableType.jsonDeserializationMethod(reader)
            .replace("nonNullReader", localName(names, "nonNullReader"));
    }

    private static String convertResponseValue(IType wireType, String value) {
        String converted = wireType.convertToClientType(value);
        return wireType.equals(wireType.getClientType()) ? converted : value + " == null ? null : " + converted;
    }

    private static boolean usesJsonSerializer(ProxyMethod method) {
        return method.getParameters().stream().anyMatch(parameter -> requestUsesJson(method, parameter))
            || (deserializesResponse(method) && responseUsesJson(method));
    }

    private static boolean usesXmlSerializer(ProxyMethod method) {
        return method.getParameters().stream().anyMatch(parameter -> requestUsesXml(method, parameter))
            || (deserializesResponse(method) && responseUsesXml(method));
    }

    private static boolean serializesRequest(ProxyMethod method, ProxyMethodParameter parameter) {
        IType type = parameter.getWireType();
        return parameter.getRequestParameterLocation() == RequestParameterLocation.BODY
            && !ClassType.BINARY_DATA.equals(type)
            && !ClassType.INPUT_STREAM.equals(type)
            && (!(ClassType.STRING.equals(type) || ArrayType.BYTE_ARRAY.equals(type))
                || isMediaType(method.getRequestContentType(), "json"));
    }

    private static boolean requestUsesJson(ProxyMethod method, ProxyMethodParameter parameter) {
        return serializesRequest(method, parameter)
            && (!isMediaType(method.getRequestContentType(), "xml")
                || typeSupportsFormat(parameter.getWireType(), "json"));
    }

    private static boolean requestUsesXml(ProxyMethod method, ProxyMethodParameter parameter) {
        return serializesRequest(method, parameter)
            && (isMediaType(method.getRequestContentType(), "xml")
                || typeSupportsFormat(parameter.getWireType(), "xml"));
    }

    private static boolean responseUsesJson(ProxyMethod method) {
        return method.getResponseContentTypes() == null
            || method.getResponseContentTypes().isEmpty()
            || method.getResponseContentTypes().stream().anyMatch(mediaType -> !isMediaType(mediaType, "xml"));
    }

    private static boolean responseUsesXml(ProxyMethod method) {
        return method.getResponseContentTypes() != null
            && method.getResponseContentTypes().stream().anyMatch(mediaType -> isMediaType(mediaType, "xml"));
    }

    private static boolean byteResponseUsesJson(ProxyMethod method) {
        // Unlike object responses, bytes in non-XML media types aren't necessarily JSON encoded.
        return method.getResponseContentTypes() == null
            || method.getResponseContentTypes().isEmpty()
            || method.getResponseContentTypes().stream().anyMatch(mediaType -> isMediaType(mediaType, "json"));
    }

    private static boolean deserializesResponse(ProxyMethod method) {
        IType type = method.getReturnType().getClientType();
        if (type instanceof GenericType && ((GenericType) type).getName().equals(ClassType.RESPONSE.getName())) {
            type = ((GenericType) type).getTypeArguments()[0];
        }
        return !PrimitiveType.VOID.equals(type)
            && !ClassType.VOID.equals(type)
            && !ClassType.BINARY_DATA.equals(type)
            && !ClassType.INPUT_STREAM.equals(type)
            && (!ArrayType.BYTE_ARRAY.equals(type) || byteResponseUsesJson(method))
            && !(method.getHttpMethod() == HttpMethod.HEAD
                && (PrimitiveType.BOOLEAN.equals(type) || ClassType.BOOLEAN.equals(type)));
    }

    private static boolean supportsXmlErrors(ProxyMethod method) {
        if (responseUsesXml(method)
            || isMediaType(method.getRequestContentType(), "xml")
            || errorSupportsXml(method.getUnexpectedResponseExceptionType())) {
            return true;
        }
        return method.getUnexpectedResponseExceptionTypes() != null
            && method.getUnexpectedResponseExceptionTypes()
                .keySet()
                .stream()
                .anyMatch(ClientCoreProtocolImplementationTemplate::errorSupportsXml);
    }

    private static boolean errorSupportsXml(ClassType exceptionType) {
        ClientModel model = exceptionType == null ? null : ClientModelUtil.getErrorModelFromException(exceptionType);
        return model != null && model.getSerializationFormats().stream().anyMatch(format -> isMediaType(format, "xml"));
    }

    private static boolean typeSupportsFormat(IType type, String format) {
        if (type instanceof GenericType) {
            return Arrays.stream(((GenericType) type).getTypeArguments())
                .anyMatch(argument -> typeSupportsFormat(argument, format));
        }
        ClientModel model
            = type instanceof ClassType ? ClientModels.getInstance().getModel(((ClassType) type).getName()) : null;
        return model != null
            && model.getSerializationFormats().stream().anyMatch(mediaType -> isMediaType(mediaType, format));
    }

    private static boolean isMediaType(String mediaType, String format) {
        if (mediaType == null) {
            return false;
        }
        int separator = mediaType.indexOf(';');
        String type = (separator < 0 ? mediaType : mediaType.substring(0, separator)).trim().toLowerCase(Locale.ROOT);
        return type.equals(format) || type.endsWith("/" + format) || type.endsWith("+" + format);
    }

    private static String typeToken(IType type) {
        if (type instanceof GenericType) {
            GenericType generic = (GenericType) type;
            return "CoreUtils.createParameterizedType(" + generic.getName() + ".class, "
                + Arrays.stream(generic.getTypeArguments())
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
                value = "UriEscapers.PATH_ESCAPER.escape(" + value + ")";
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
            return parameter.getName() + ".format(DateTimeFormatter.ISO_INSTANT)";
        }
        return "String.valueOf(" + parameter.getName() + ")";
    }

    private static String quote(String value) {
        return "\"" + TemplateUtil.escapeString(value) + "\"";
    }

    private static final class ProtocolMetadata {
        private final Map<Map<Integer, String>, String> errorMaps = new LinkedHashMap<>();
        private final Map<ProxyMethod, String> methodErrorMaps = new LinkedHashMap<>();

        private ProtocolMetadata(List<ProxyMethod> methods) {
            for (ProxyMethod method : methods) {
                Map<Integer, String> errors = new TreeMap<>();
                if (method.getUnexpectedResponseExceptionTypes() != null) {
                    method.getUnexpectedResponseExceptionTypes().forEach((exception, codes) -> {
                        String expression = errorBodyType(exception);
                        String bodyType = "null".equals(expression)
                            ? "CoreUtils.createParameterizedType(Object.class)"
                            : expression;
                        codes.forEach(code -> errors.put(code, bodyType));
                    });
                }
                if (!errors.isEmpty()) {
                    methodErrorMaps.put(method,
                        errorMaps.computeIfAbsent(errors, ignored -> "ERROR_TYPES_" + errorMaps.size()));
                }
            }
        }

        private String errorMap(ProxyMethod method, String owner) {
            String name = methodErrorMaps.get(method);
            return name == null ? "null" : owner + name;
        }

        private void write(JavaClass implementation) {
            errorMaps.forEach((errors, name) -> {
                implementation.privateStaticFinalVariable("Map<Integer, ParameterizedType> " + name);
                implementation.staticBlock(block -> {
                    block.line("Map<Integer, ParameterizedType> errorTypes = new HashMap<>();");
                    List<Integer> codes = new ArrayList<>(errors.keySet());
                    for (int i = 0; i < codes.size(); i++) {
                        int start = codes.get(i);
                        int end = start;
                        String type = errors.get(start);
                        while (i + 1 < codes.size()
                            && (long) codes.get(i + 1) == (long) end + 1
                            && type.equals(errors.get(codes.get(i + 1)))) {
                            end = codes.get(++i);
                        }
                        if ((long) end - start >= 2) {
                            block.line("IntStream.rangeClosed(%s, %s).forEach(status -> errorTypes.put(status, %s));",
                                start, end, type);
                        } else {
                            block.line("errorTypes.put(%s, %s);", start, type);
                            if (end != start) {
                                block.line("errorTypes.put(%s, %s);", end, type);
                            }
                        }
                    }
                    block.line("%s = Collections.unmodifiableMap(errorTypes);", name);
                });
            });
        }
    }

    private static String localName(Set<String> names, String preferred) {
        String name = preferred;
        while (!names.add(name)) {
            name += "_";
        }
        return name;
    }
}
