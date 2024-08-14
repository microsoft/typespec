// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.util;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ArrayType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MapType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaModifier;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.ModelTemplate;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.azure.core.http.HttpHeaderName;
import com.azure.core.http.HttpHeaders;
import com.azure.core.util.CoreUtils;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Utility class for {@link ModelTemplate} that handles generating {@link HttpHeaders} deserialization to POJOs.
 */
public final class ModelTemplateHeaderHelper {
    private static final Map<String, String> HEADER_TO_KNOWN_HTTPHEADERNAME;

    static {
        Map<String, String> headerToKnownHttpHeaderName = new TreeMap<>(String::compareToIgnoreCase);
        for (Field httpHeaderNameConstant : HttpHeaderName.class.getDeclaredFields()) {
            if (httpHeaderNameConstant.getType() != HttpHeaderName.class
                || !isPublicConstant(httpHeaderNameConstant.getModifiers())) {
                continue;
            }

            try {
                HttpHeaderName httpHeaderName = (HttpHeaderName) httpHeaderNameConstant.get(null);
                String constantName = httpHeaderNameConstant.getName();
                headerToKnownHttpHeaderName.put(httpHeaderName.getCaseInsensitiveName(), constantName);
            } catch (IllegalAccessException ignored) {
                // Do nothing.
            }
        }

        HEADER_TO_KNOWN_HTTPHEADERNAME = Collections.unmodifiableMap(headerToKnownHttpHeaderName);
    }

    /**
     * Adds an {@link HttpHeaders}-based constructor to a model.
     *
     * @param classBlock The class block for the model.
     * @param model The model itself.
     * @param settings Autorest generation settings.
     */
    public static void addCustomStronglyTypedHeadersConstructor(JavaClass classBlock, ClientModel model,
        JavaSettings settings) {
        addHttpHeaderNameConstants(classBlock, model);

        classBlock.lineComment("HttpHeaders containing the raw property values.");
        classBlock.javadocComment(comment -> {
            comment.description(String.format("Creates an instance of %1$s class.", model.getName()));
            comment.param("rawHeaders", "The raw HttpHeaders that will be used to create the property values.");
        });
        classBlock.publicConstructor(String.format("%s(HttpHeaders rawHeaders)", model.getName()), constructor -> {
            // HeaderCollections need special handling as they may have multiple values that need to be retrieved from
            // the raw headers.
            List<ClientModelProperty> collectionProperties = new ArrayList<>();
            for (ClientModelProperty property : model.getProperties()) {
                if (CoreUtils.isNullOrEmpty(property.getHeaderCollectionPrefix())) {
                    generateHeaderDeserializationFunction(property, constructor);
                } else {
                    collectionProperties.add(property);
                }
            }

            if (!CoreUtils.isNullOrEmpty(collectionProperties)) {
                // Bundle all collection properties into one iteration over the HttpHeaders.
                generateHeaderCollectionDeserialization(collectionProperties, constructor);
            }
        });
    }

    /**
     * Gets an expression of HttpHeaderName instance.
     * <p>
     * For known name, it would be {@code HttpHeaderName.IF_MATCH}. For unknown name, it would be {@code HttpHeaderName.fromString("foo")}.
     *
     * @param headerName the header name
     * @return the expression of HttpHeaderName instance.
     */
    public static String getHttpHeaderNameInstanceExpression(String headerName) {
        // match the init logic of HEADER_TO_KNOWN_HTTPHEADERNAME
        String caseInsensitiveName = HttpHeaderName.fromString(headerName).getCaseInsensitiveName();

        if (HEADER_TO_KNOWN_HTTPHEADERNAME.containsKey(caseInsensitiveName)) {
            // known name
            return String.format("HttpHeaderName.%s", HEADER_TO_KNOWN_HTTPHEADERNAME.get(caseInsensitiveName));
        } else {
            return String.format("HttpHeaderName.fromString(%s)", ClassType.STRING.defaultValueExpression(headerName));
        }
    }

    /**
     * Adds {@code private static final} {@link HttpHeaderName} constants representing the headers that are used by the
     * {@link ClientModel}.
     *
     * @param classBlock The class block for the model.
     * @param model The model itself.
     */
    private static void addHttpHeaderNameConstants(JavaClass classBlock, ClientModel model) {
        for (ClientModelProperty property : model.getProperties()) {
            if (!CoreUtils.isNullOrEmpty(property.getHeaderCollectionPrefix())) {
                // Header collections aren't able to use HttpHeaderName.
                continue;
            }

            if (HEADER_TO_KNOWN_HTTPHEADERNAME.containsKey(property.getSerializedName())) {
                // Header is a well-known HttpHeaderName, don't need to create a private constant.
                continue;
            }

            String headerName = property.getSerializedName();
            String constantName = CodeNamer.getEnumMemberName(headerName);
            classBlock.variable(
                String.format("HttpHeaderName %s = HttpHeaderName.fromString(\"%s\")", constantName, headerName),
                JavaVisibility.Private, JavaModifier.Static, JavaModifier.Final);
        }
    }

    private static void generateHeaderDeserializationFunction(ClientModelProperty property, JavaBlock javaBlock) {
        IType wireType = property.getWireType();
        boolean needsNullGuarding = wireType != ClassType.STRING &&
            (wireType instanceof ArrayType || wireType instanceof ClassType
                || wireType instanceof EnumType || wireType instanceof GenericType);

        // No matter the wire type the rawHeaders will need to be accessed.
        String knownHttpHeaderNameConstant = HEADER_TO_KNOWN_HTTPHEADERNAME.get(property.getSerializedName());
        String httpHeaderName = knownHttpHeaderNameConstant != null ? "HttpHeaderName." + knownHttpHeaderNameConstant
            : CodeNamer.getEnumMemberName(property.getSerializedName());

        String rawHeaderAccess = String.format("rawHeaders.getValue(%s)", httpHeaderName);
        if (needsNullGuarding) {
            javaBlock.line("String %s = %s;", property.getName(), rawHeaderAccess);
            rawHeaderAccess = property.getName();
        }

        boolean needsTryCatch = false;
        String setter;
        if (wireType == PrimitiveType.BOOLEAN || wireType == ClassType.BOOLEAN) {
            setter = String.format("Boolean.parseBoolean(%s)", rawHeaderAccess);
        } else if (wireType == PrimitiveType.DOUBLE || wireType == ClassType.DOUBLE) {
            setter = String.format("Double.parseDouble(%s)", rawHeaderAccess);
        } else if (wireType == PrimitiveType.FLOAT || wireType == ClassType.FLOAT) {
            setter = String.format("Float.parseFloat(%s)", rawHeaderAccess);
        } else if (wireType == PrimitiveType.INT || wireType == ClassType.INTEGER) {
            setter = String.format("Integer.parseInt(%s)", rawHeaderAccess);
        } else if (wireType == PrimitiveType.LONG || wireType == ClassType.LONG) {
            setter = String.format("Long.parseLong(%s)", rawHeaderAccess);
        } else if (wireType == ArrayType.BYTE_ARRAY) {
            setter = String.format("Base64.getDecoder().decode(%s)", rawHeaderAccess);
        } else if (wireType == ClassType.STRING) {
            setter = rawHeaderAccess;
        } else if (wireType == ClassType.DATE_TIME_RFC_1123) {
            setter = String.format("new DateTimeRfc1123(%s)", rawHeaderAccess);
        } else if (wireType == ClassType.DATE_TIME) {
            setter = String.format("OffsetDateTime.parse(%s)", rawHeaderAccess);
        } else if (wireType == ClassType.LOCAL_DATE) {
            setter = String.format("LocalDate.parse(%s)", rawHeaderAccess);
        } else if (wireType == ClassType.DURATION) {
            setter = String.format("Duration.parse(%s)", rawHeaderAccess);
        } else if (wireType == ClassType.UUID) {
            setter = "UUID.fromString(" + rawHeaderAccess + ")";
        } else if (wireType == ClassType.URL) {
            needsTryCatch = true;
            setter = "new URL(" + rawHeaderAccess + ")";
        } else if (wireType instanceof EnumType) {
            EnumType enumType = (EnumType) wireType;
            setter = String.format("%s.%s(%s)", enumType.getName(), enumType.getFromMethodName(), rawHeaderAccess);
        } else {
            // TODO (alzimmer): Check if the wire type is a Swagger type that could use stream-style serialization.
            needsTryCatch = true;
            setter = String.format(
                "JacksonAdapter.createDefaultSerializerAdapter().deserializeHeader(rawHeaders.get(\"%s\"), %s)",
                property.getSerializedName(), getWireTypeJavaType(wireType));
        }

        if (needsTryCatch) {
            javaBlock.line("try {");
            javaBlock.increaseIndent();
        }

        // String is special as the setter is null safe for it, unlike other nullable types.
        if (needsNullGuarding) {
            javaBlock.ifBlock(String.format("%s != null", property.getName()),
                ifBlock -> ifBlock.line("this.%s = %s;", property.getName(), setter));
        } else {
            javaBlock.line("this.%s = %s;", property.getName(), setter);
        }

        if (needsTryCatch) {
            // At this time all try-catching is for IOExceptions.
            javaBlock.decreaseIndent();
            javaBlock.line("} catch (IOException ex) {");
            javaBlock.indent(() -> javaBlock.line("throw LOGGER.atError().log(new UncheckedIOException(ex));"));
            javaBlock.line("}");
        }
    }

    private static String getWireTypeJavaType(IType iType) {
        if (iType instanceof ArrayType || iType instanceof ClassType) {
            // Both ArrayType and ClassType have toString methods that return the text representation of the type,
            // for example "int[]" or "HttpHeaders". These support adding ".class" to get the Java runtime Class.
            return iType + ".class";
        } else {
            // All other types are GenericTypes. GenericType's toString returns the Java code generic representation,
            // such as "List<Integer>" or "Map<String, Object>".
            //
            // Use a new TypeReference to get the representing Type for the wire type.
            return "new TypeReference<" + iType + ">() {}.getJavaType()";
        }
    }

    private static void generateHeaderCollectionDeserialization(List<ClientModelProperty> properties, JavaBlock block) {
        for (ClientModelProperty property : properties) {
            // HeaderCollections are always Maps that use String as the key.
            MapType wireType = (MapType) property.getWireType();

            // Prefix the map with the property name for the cases where multiple header collections exist.
            block.line("%s %sHeaderCollection = new HashMap<>();", wireType, property.getName());
        }

        block.line();

        block.block("for (HttpHeader header : rawHeaders)", body -> {
            body.line("String headerName = header.getName();");
            int propertiesSize = properties.size();
            for (int i = 0; i < propertiesSize; i++) {
                ClientModelProperty property = properties.get(i);
                boolean needsContinue = i < propertiesSize - 1;
                body.ifBlock(String.format("headerName.startsWith(\"%s\")", property.getHeaderCollectionPrefix()),
                    ifBlock -> {
                        ifBlock.line("%sHeaderCollection.put(headerName.substring(%d), header.getValue());",
                            property.getName(), property.getHeaderCollectionPrefix().length());
                        if (needsContinue) {
                            ifBlock.line("continue;");
                        }
                    });
            }
        });

        block.line();

        for (ClientModelProperty property : properties) {
            block.line("this.%s = %sHeaderCollection;", property.getName(), property.getName());
        }
    }

    private static boolean isPublicConstant(int modifiers) {
        return Modifier.isPublic(modifiers) && Modifier.isStatic(modifiers) && Modifier.isFinal(modifiers);
    }

    private ModelTemplateHeaderHelper() {
    }
}
