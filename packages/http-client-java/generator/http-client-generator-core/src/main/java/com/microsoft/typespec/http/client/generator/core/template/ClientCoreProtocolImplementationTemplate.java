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
import io.clientcore.core.http.models.HttpResponseException;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.implementation.utils.UriEscapers;
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.models.CoreException;
import io.clientcore.core.models.binarydata.BinaryData;
import io.clientcore.core.serialization.SerializationFormat;
import io.clientcore.core.serialization.json.JsonReader;
import io.clientcore.core.serialization.json.JsonSerializer;
import io.clientcore.core.serialization.xml.XmlSerializer;
import io.clientcore.core.utils.Base64Uri;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.GeneratedCodeUtils;
import io.clientcore.core.utils.UriBuilder;
import java.io.IOException;
import java.lang.reflect.ParameterizedType;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

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
        for (ProxyMethod method : proxy.getMethods()) {
            if (method.getImplementation() != null) {
                continue;
            }
            boolean xmlErrors = supportsXmlErrors(method);
            if (usesXmlSerializer(method) || xmlErrors) {
                imports.add(XmlSerializer.class.getName());
            }
            if (!xmlErrors) {
                imports.add(HttpResponseException.class.getName());
            }
            if (!xmlErrors || (deserializesResponse(method) && responseUsesJson(method) && responseUsesXml(method))) {
                imports.add(SerializationFormat.class.getName());
            }
            if (method.getUnexpectedResponseExceptionTypes() != null
                && !method.getUnexpectedResponseExceptionTypes().isEmpty()) {
                imports.add(Map.class.getName());
                imports.add(HashMap.class.getName());
                imports.add(ParameterizedType.class.getName());
            }
            if (ClassType.BASE_64_URL.equals(method.getReturnValueWireType())) {
                imports.add(Base64Uri.class.getName());
            }
            if (deserializesResponse(method)
                && responseUsesJson(method)
                && requiresTypedJsonDeserialization(responseWireType(method))) {
                imports.add(JsonReader.class.getName());
                imports.add(IOException.class.getName());
                imports.add(CoreException.class.getName());
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
                if (requestUsesJson(method, parameter) && requestUsesXml(method, parameter)) {
                    imports.add(SerializationFormat.class.getName());
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
                    .privateFinalMemberVariable("JsonSerializer jsonSerializer = JsonSerializer.getInstance()");
            }
            if (usesXml) {
                implementation.privateFinalMemberVariable("XmlSerializer xmlSerializer = XmlSerializer.getInstance()");
            }
            implementation.privateConstructor(
                proxy.getName() + "Impl(" + (methods.isEmpty() ? "" : "HttpPipeline pipeline") + ")", block -> {
                    if (!methods.isEmpty()) {
                        block.line("this.httpPipeline = pipeline;");
                    }
                });
            for (ProxyMethod method : methods) {
                implementation.annotation("Override");
                implementation.publicMethod(signature(method),
                    block -> writeMethod(proxy, method, block, usesJson, usesXml));
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

    private static void writeMethod(Proxy proxy, ProxyMethod method, JavaBlock block, boolean usesJson,
        boolean usesXml) {
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
        block.line("Response<BinaryData> %s = this.httpPipeline.send(%s);", response, request);
        block.line("int %s = %s.getStatusCode();", status, response);
        String expected = method.getResponseExpectedStatusCodes().isEmpty()
            ? status + " >= 200 && " + status + " < 300"
            : method.getResponseExpectedStatusCodes()
                .stream()
                .map(code -> status + " == " + code)
                .collect(Collectors.joining(" || "));
        block.ifBlock("!(" + expected + ")",
            error -> writeError(proxy, method, error, response, status, names, usesJson, usesXml));
        IType returnType = method.getReturnType().getClientType();
        boolean returnsResponse = returnType instanceof GenericType
            && ((GenericType) returnType).getName().equals(ClassType.RESPONSE.getName());
        IType bodyType = returnsResponse ? ((GenericType) returnType).getTypeArguments()[0].asNullable() : returnType;
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

    private static void writeBody(ProxyMethod method, ProxyMethodParameter parameter, JavaBlock block, String request,
        Set<String> names) {
        block.ifBlock(request + ".getHeaders().get(HttpHeaderName.CONTENT_TYPE) == null",
            contentType -> contentType.line("%s.getHeaders().set(HttpHeaderName.CONTENT_TYPE, %s);", request,
                quote(method.getRequestContentType())));
        IType type = parameter.getWireType();
        String value = parameter.getName();
        String mediaType = method.getRequestContentType();
        boolean json = isMediaType(mediaType, "json");
        if (ClassType.BINARY_DATA.equals(type)) {
            block.line("%s.setBody(%s);", request, value);
        } else if (ArrayType.BYTE_ARRAY.equals(type) && !json) {
            block.line("%s.setBody(BinaryData.fromBytes(%s));", request, value);
        } else if (ClassType.STRING.equals(type) && !json) {
            block.line("%s.setBody(BinaryData.fromString(%s));", request, value);
        } else if (ClassType.INPUT_STREAM.equals(type)) {
            block.line("%s.setBody(BinaryData.fromStream(%s));", request, value);
        } else {
            boolean xml = requestUsesXml(method, parameter);
            boolean jsonFormat = requestUsesJson(method, parameter);
            String serializer = xml ? "this.xmlSerializer" : "this.jsonSerializer";
            if (xml && jsonFormat) {
                String format = localName(names, "requestSerializationFormat");
                block.line("SerializationFormat %s = CoreUtils.serializationFormatFromContentType(%s.getHeaders());",
                    format, request);
                serializer
                    = "this.xmlSerializer.supportsFormat(" + format + ") ? this.xmlSerializer : this.jsonSerializer";
            }
            block.line("%s.setBody(BinaryData.fromObject(%s, %s));", request, value, serializer);
        }
    }

    private static void writeError(Proxy proxy, ProxyMethod method, JavaBlock block, String response, String status,
        Set<String> names, boolean usesJson, boolean usesXml) {
        boolean xmlErrors = supportsXmlErrors(method);
        if (!xmlErrors) {
            block.ifBlock(
                "CoreUtils.serializationFormatFromContentType(" + response
                    + ".getHeaders()) == SerializationFormat.XML",
                unsupported -> unsupported
                    .tryBlock(error -> error.line(
                        "throw new HttpResponseException(\"Unexpected XML response.\", %s, (Object) null);", response))
                    .finallyBlock(cleanup -> cleanup.line("%s.close();", response)));
        }
        String errorTypes = "null";
        if (method.getUnexpectedResponseExceptionTypes() != null
            && !method.getUnexpectedResponseExceptionTypes().isEmpty()) {
            errorTypes = localName(names, "statusToExceptionTypeMap");
            block.line("Map<Integer, ParameterizedType> %s = new HashMap<>();", errorTypes);
            for (Map.Entry<ClassType, List<Integer>> mapping : method.getUnexpectedResponseExceptionTypes()
                .entrySet()) {
                String bodyType = errorBodyType(mapping.getKey());
                if ("null".equals(bodyType)) {
                    bodyType = "CoreUtils.createParameterizedType(Object.class)";
                }
                for (Integer code : mapping.getValue()) {
                    block.line("%s.put(%s, %s);", errorTypes, code, bodyType);
                }
            }
        }
        String jsonSerializer = usesJson ? "this.jsonSerializer" : "JsonSerializer.getInstance()";
        String xmlSerializer = xmlErrors ? (usesXml ? "this.xmlSerializer" : "XmlSerializer.getInstance()") : "null";
        block.line("GeneratedCodeUtils.handleUnexpectedResponse(%s, %s, %s, %s, %s, %s, %sImpl.LOGGER);", status,
            response, jsonSerializer, xmlSerializer, errorBodyType(method.getUnexpectedResponseExceptionType()),
            errorTypes, proxy.getName());
    }

    private static String errorBodyType(ClassType exception) {
        ClientModel model = exception == null ? null : ClientModelUtil.getErrorModelFromException(exception);
        return model == null ? "null" : "CoreUtils.createParameterizedType(" + model.getName() + ".class)";
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
                value = response + ".getValue() == null ? null : new Base64Uri(" + response
                    + ".getValue().toBytes()).decodedBytes()";
            }
        } else {
            IType wireType = responseWireType(method);
            String decoded = localName(names, "deserializedResult");
            boolean xml = responseUsesXml(method);
            boolean json = responseUsesJson(method);
            boolean typedJson = json && requiresTypedJsonDeserialization(wireType);
            block.line("%s %s;", typedJson ? wireType.getClientType().asNullable() : wireType.asNullable(), decoded);
            if (xml && json) {
                String format = localName(names, "responseSerializationFormat");
                block.line("SerializationFormat %s = CoreUtils.serializationFormatFromContentType(%s.getHeaders());",
                    format, response);
                block
                    .ifBlock("this.jsonSerializer.supportsFormat(" + format + ")",
                        jsonBlock -> writeResponseDeserialization(jsonBlock, response, decoded, wireType,
                            "this.jsonSerializer", typedJson, typedJson, names))
                    .elseIfBlock("this.xmlSerializer.supportsFormat(" + format + ")",
                        xmlBlock -> writeResponseDeserialization(xmlBlock, response, decoded, wireType,
                            "this.xmlSerializer", false, typedJson, names))
                    .elseBlock(unsupported -> unsupported.line(
                        "throw new UnsupportedOperationException(\"Unsupported response serialization format: \" + %s);",
                        format));
            } else {
                writeResponseDeserialization(block, response, decoded, wireType,
                    xml ? "this.xmlSerializer" : "this.jsonSerializer", typedJson, typedJson, names);
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
        return ClassType.DATE_TIME.equals(type.getClientType());
    }

    private static void writeResponseDeserialization(JavaBlock block, String response, String decoded, IType wireType,
        String serializer, boolean typedJson, boolean clientValue, Set<String> names) {
        if (typedJson) {
            String bytes = localName(names, "responseBodyBytes");
            String reader = localName(names, "jsonReader");
            String exception = localName(names, "exception");
            block.line("byte[] %s = %s.getValue() == null ? null : %s.getValue().toBytes();", bytes, response,
                response);
            block.ifBlock(bytes + " == null || " + bytes + ".length == 0", empty -> empty.line("%s = null;", decoded))
                .elseBlock(body -> body
                    .tryBlock("JsonReader " + reader + " = JsonReader.fromBytes(" + bytes + ")",
                        json -> json.line("%s = %s.nextToken() == null ? null : %s;", decoded, reader,
                            jsonResponseValue(wireType, reader, names)))
                    .catchBlock("IOException " + exception, error -> error
                        .line("throw LOGGER.throwableAtError().log(%s, CoreException::from);", exception)));
            return;
        }
        String target
            = clientValue && !wireType.equals(wireType.getClientType()) ? localName(names, "wireResult") : decoded;
        String responseType = "CoreUtils.createParameterizedType(Response.class, " + typeToken(wireType) + ")";
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

    private static boolean deserializesResponse(ProxyMethod method) {
        IType type = method.getReturnType().getClientType();
        if (type instanceof GenericType && ((GenericType) type).getName().equals(ClassType.RESPONSE.getName())) {
            type = ((GenericType) type).getTypeArguments()[0];
        }
        return !PrimitiveType.VOID.equals(type)
            && !ClassType.VOID.equals(type)
            && !ClassType.BINARY_DATA.equals(type)
            && !ClassType.INPUT_STREAM.equals(type)
            && !ArrayType.BYTE_ARRAY.equals(type)
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

    private static String localName(Set<String> names, String preferred) {
        String name = preferred;
        while (!names.add(name)) {
            name += "_";
        }
        return name;
    }
}
