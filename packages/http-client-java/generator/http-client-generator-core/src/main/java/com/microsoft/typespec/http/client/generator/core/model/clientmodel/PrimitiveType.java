// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Set;
import java.util.function.Function;

/**
 * A basic type used by a client.
 */
public class PrimitiveType implements IType {
    public static final PrimitiveType VOID = new Builder()
        .name("void")
        .nullableType(ClassType.VOID)
        .build();

    public static final PrimitiveType BOOLEAN = new Builder()
        .name("boolean")
        .nullableType(ClassType.BOOLEAN)
        .defaultValueExpressionConverter(String::toLowerCase)
        .defaultValue("false")
        .jsonToken("JsonToken.BOOLEAN")
        .serializationMethodBase("writeBoolean")
        .jsonDeserializationMethod("getBoolean()")
        .xmlAttributeDeserializationTemplate("%s.getBooleanAttribute(%s, %s)")
        .xmlElementDeserializationMethod("getBooleanElement()")
        .build();

    public static final PrimitiveType BYTE = new Builder()
        .name("byte")
        .nullableType(ClassType.BYTE)
        .defaultValueExpressionConverter(Function.identity())
        .defaultValue("0")
        .jsonToken("JsonToken.NUMBER")
        .serializationMethodBase("writeInt")
        .jsonDeserializationMethod("getInt()")
        .xmlAttributeDeserializationTemplate("%s.getIntAttribute(%s, %s)")
        .xmlElementDeserializationMethod("getIntElement()")
        .build();

    public static final PrimitiveType INT = new Builder()
        .name("int")
        .nullableType(ClassType.INTEGER)
        .defaultValueExpressionConverter(Function.identity())
        .defaultValue("0")
        .jsonToken("JsonToken.NUMBER")
        .serializationMethodBase("writeInt")
        .jsonDeserializationMethod("getInt()")
        .xmlAttributeDeserializationTemplate("%s.getIntAttribute(%s, %s)")
        .xmlElementDeserializationMethod("getIntElement()")
        .build();

    public static final PrimitiveType LONG = new Builder()
        .prototypeAsLong()
        .build();

    public static final PrimitiveType FLOAT = new Builder()
        .name("float")
        .nullableType(ClassType.FLOAT)
        .defaultValueExpressionConverter(defaultValueExpression -> defaultValueExpression + "f")
        .defaultValue("0.0")
        .jsonToken("JsonToken.NUMBER")
        .serializationMethodBase("writeFloat")
        .jsonDeserializationMethod("getFloat()")
        .xmlAttributeDeserializationTemplate("%s.getFloatAttribute(%s, %s)")
        .xmlElementDeserializationMethod("getFloatElement()")
        .build();

    public static final PrimitiveType DOUBLE = new Builder()
        .prototypeAsDouble()
        .build();

    public static final PrimitiveType CHAR = new Builder()
        .name("char")
        .nullableType(ClassType.CHARACTER)
        .defaultValueExpressionConverter(defaultValueExpression -> Integer.toString(defaultValueExpression.charAt(0)))
        .defaultValue("\u0000")
        .jsonToken("JsonToken.STRING")
        .serializationMethodBase("writeString")
        .wrapSerializationWithObjectsToString(true)
        .jsonDeserializationMethod("getString().charAt(0)")
        .xmlAttributeDeserializationTemplate("%s.getStringAttribute(%s, %s).charAt(0)")
        .xmlElementDeserializationMethod("getStringElement().charAt(0)")
        .build();

    public static final PrimitiveType UNIX_TIME_LONG = new Builder()
        .prototypeAsLong()
        .nullableType(ClassType.UNIX_TIME_LONG)
        .build();

    public static final PrimitiveType DURATION_LONG = new Builder()
        .prototypeAsLong()
        .nullableType(ClassType.DURATION_LONG)
        .build();

    public static final PrimitiveType DURATION_DOUBLE = new Builder()
        .prototypeAsDouble()
        .nullableType(ClassType.DURATION_DOUBLE)
        .build();

    /**
     * The name of this type.
     */
    private final String name;
    /**
     * The nullable version of this primitive type.
     */
    private final ClassType nullableType;
    private final Function<String, String> defaultValueExpressionConverter;
    private final String defaultValue;
    private final String jsonToken;
    private final String serializationMethodBase;
    private final boolean wrapSerializationWithObjectsToString;
    private final String jsonDeserializationMethod;
    private final String xmlAttributeDeserializationTemplate;
    private final String xmlElementDeserializationMethod;

    private PrimitiveType(String name, ClassType nullableType, Function<String, String> defaultValueExpressionConverter,
        String defaultValue, String jsonToken, String serializationMethodBase,
        boolean wrapSerializationWithObjectsToString, String jsonDeserializationMethod,
        String xmlAttributeDeserializationTemplate, String xmlElementDeserializationMethod) {
        this.name = name;
        this.nullableType = nullableType;
        this.defaultValueExpressionConverter = defaultValueExpressionConverter;
        this.defaultValue = defaultValue;
        this.jsonToken = jsonToken;
        this.serializationMethodBase = serializationMethodBase;
        this.wrapSerializationWithObjectsToString = wrapSerializationWithObjectsToString;
        this.jsonDeserializationMethod = jsonDeserializationMethod;
        this.xmlAttributeDeserializationTemplate = xmlAttributeDeserializationTemplate;
        this.xmlElementDeserializationMethod = xmlElementDeserializationMethod;
    }

//    public static PrimitiveType fromNullableType(ClassType nullableType) {
//        if (nullableType == ClassType.Void) {
//            return PrimitiveType.Void;
//        } else if (nullableType == ClassType.Boolean) {
//            return PrimitiveType.Boolean;
//        } else if (nullableType == ClassType.Byte) {
//            return PrimitiveType.Byte;
//        } else if (nullableType == ClassType.Integer) {
//            return PrimitiveType.Int;
//        } else if (nullableType == ClassType.Long) {
//            return PrimitiveType.Long;
//        } else if (nullableType == ClassType.Double) {
//            return PrimitiveType.Double;
//        } else if (nullableType == ClassType.Float) {
//            return PrimitiveType.Float;
//        } else {
//            throw new IllegalArgumentException("Class type " + nullableType + " is not a boxed type");
//        }
//    }

    public final String getName() {
        return name;
    }

    private ClassType getNullableType() {
        return nullableType;
    }

    @Override
    public final void addImportsTo(Set<String> imports, boolean includeImplementationImports) {
        if (this == PrimitiveType.UNIX_TIME_LONG) {
            imports.add(Instant.class.getName());
            imports.add(ZoneOffset.class.getName());
        }
    }

    @Override
    public final boolean isNullable() {
        return false;
    }

    @Override
    public final IType asNullable() {
        return getNullableType();
    }

    @Override
    public final boolean contains(IType type) {
        return this == type;
    }

    private Function<String, String> getDefaultValueExpressionConverter() {
        return defaultValueExpressionConverter;
    }

    @Override
    public final String defaultValueExpression(String sourceExpression) {
        String result = sourceExpression;
        if (result != null && getDefaultValueExpressionConverter() != null) {
            result = defaultValueExpressionConverter.apply(sourceExpression);
        }
        return result;
    }

    @Override
    public final String defaultValueExpression() {
        return defaultValueExpression(defaultValue);
    }

    @Override
    public final IType getClientType() {
        IType clientType = this;
        if (this == PrimitiveType.UNIX_TIME_LONG) {
            clientType = ClassType.UNIX_TIME_DATE_TIME;
        } else if (this == PrimitiveType.DURATION_LONG) {
            clientType = ClassType.DURATION;
        } else if (this == PrimitiveType.DURATION_DOUBLE) {
            clientType = ClassType.DURATION;
        }
        return clientType;
    }

    @Override
    public final String convertToClientType(String expression) {
        if (getClientType() == this) {
            return expression;
        }

        if (this == PrimitiveType.UNIX_TIME_LONG) {
            expression = String.format("OffsetDateTime.ofInstant(Instant.ofEpochSecond(%1$s), ZoneOffset.UTC)", expression);
        } else if (this == PrimitiveType.DURATION_LONG) {
            expression = String.format("Duration.ofSeconds(%s)", expression);
        } else if (this == PrimitiveType.DURATION_DOUBLE) {
            expression = String.format("Duration.ofNanos((long) (%s * 1000_000_000L))", expression);
        }
        return expression;
    }

    @Override
    public final String convertFromClientType(String expression) {
        if (getClientType() == this) {
            return expression;
        }

        if (this == PrimitiveType.UNIX_TIME_LONG) {
            expression = String.format("%1$s.toEpochSecond()", expression);
        } else if (this == PrimitiveType.DURATION_LONG) {
            expression = String.format("%s.getSeconds()", expression);
        } else if (this == PrimitiveType.DURATION_DOUBLE) {
            expression = String.format("(double) %s.toNanos() / 1000_000_000L", expression);
        }
        return expression;
    }

    @Override
    public final String validate(String expression) {
        return null;
    }

    @Override
    public String jsonToken() {
        return jsonToken;
    }

    @Override
    public String jsonDeserializationMethod(String jsonReaderName) {
        if (jsonDeserializationMethod == null) {
            return null;
        }

        return jsonReaderName + "." + jsonDeserializationMethod;
    }

    @Override
    public String jsonSerializationMethodCall(String jsonWriterName, String fieldName, String valueGetter,
        boolean jsonMergePatch) {
        if (wrapSerializationWithObjectsToString) {
            return fieldName == null
                ? String.format("%s.%s(Objects.toString(%s, null))", jsonWriterName, serializationMethodBase, valueGetter)
                : String.format("%s.%sField(\"%s\", Objects.toString(%s, null))", jsonWriterName,
                    serializationMethodBase, fieldName, valueGetter);
        }

        return fieldName == null
            ? String.format("%s.%s(%s)", jsonWriterName, serializationMethodBase, valueGetter)
            : String.format("%s.%sField(\"%s\", %s)", jsonWriterName, serializationMethodBase, fieldName, valueGetter);
    }

    @Override
    public String xmlDeserializationMethod(String xmlReaderName, String attributeName, String attributeNamespace,
        boolean namespaceIsConstant) {
        if (attributeName == null) {
            return xmlReaderName + "." + xmlElementDeserializationMethod;
        } else if (attributeNamespace == null) {
            return String.format(xmlAttributeDeserializationTemplate, xmlReaderName, "null",
                "\"" + attributeName + "\"");
        } else {
            String namespace = namespaceIsConstant ? attributeNamespace : "\"" + attributeNamespace + "\"";
            return String.format(xmlAttributeDeserializationTemplate, xmlReaderName, namespace,
                "\"" + attributeName + "\"");
        }
    }

    @Override
    public String xmlSerializationMethodCall(String xmlWriterName, String attributeOrElementName, String namespaceUri,
        String valueGetter, boolean isAttribute, boolean nameIsVariable, boolean namespaceIsConstant) {
        String value = wrapSerializationWithObjectsToString
            ? "Objects.toString(" + valueGetter + ", null)" : valueGetter;

        return ClassType.xmlSerializationCallHelper(xmlWriterName, serializationMethodBase, attributeOrElementName,
            namespaceUri, value, isAttribute, nameIsVariable, namespaceIsConstant);
    }

    @Override
    public boolean isUsedInXml() {
        return false;
    }

    @Override
    public String toString() {
        return getName();
    }

    private static class Builder {

        private String name;
        private ClassType nullableType;
        private Function<String, String> defaultValueExpressionConverter;
        private String defaultValue;
        private String jsonToken;
        private String serializationMethodBase;
        private boolean wrapSerializationWithObjectsToString = false;
        private String jsonDeserializationMethod;
        private String xmlAttributeDeserializationTemplate;
        private String xmlElementDeserializationMethod;

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder prototypeAsLong() {
            return this.name("long")
                .nullableType(ClassType.LONG)
                .defaultValueExpressionConverter(defaultValueExpression -> defaultValueExpression + 'L')
                .defaultValue("0")
                .jsonToken("JsonToken.NUMBER")
                .serializationMethodBase("writeLong")
                .wrapSerializationWithObjectsToString(false)
                .jsonDeserializationMethod("getLong()")
                .xmlAttributeDeserializationTemplate("%s.getLongAttribute(%s, %s)")
                .xmlElementDeserializationMethod("getLongElement()");
        }

        public Builder prototypeAsDouble() {
            return this.name("double")
                .nullableType(ClassType.DOUBLE)
                .defaultValueExpressionConverter(defaultValueExpression -> java.lang.Double.toString(java.lang.Double.parseDouble(defaultValueExpression)))
                .defaultValue("0.0")
                .jsonToken("JsonToken.NUMBER")
                .serializationMethodBase("writeDouble")
                .wrapSerializationWithObjectsToString(false)
                .jsonDeserializationMethod("getDouble()")
                .xmlAttributeDeserializationTemplate("%s.getDoubleAttribute(%s, %s)")
                .xmlElementDeserializationMethod("getDoubleElement()");
        }

        public Builder nullableType(ClassType nullableType) {
            this.nullableType = nullableType;
            return this;
        }

        public Builder defaultValue(String defaultValue) {
            this.defaultValue = defaultValue;
            return this;
        }

        public Builder defaultValueExpressionConverter(java.util.function.Function<String, String> defaultValueExpressionConverter) {
            this.defaultValueExpressionConverter = defaultValueExpressionConverter;
            return this;
        }

        public Builder wrapSerializationWithObjectsToString(boolean wrapSerializationWithObjectsToString) {
            this.wrapSerializationWithObjectsToString = wrapSerializationWithObjectsToString;
            return this;
        }

        public Builder jsonToken(String jsonToken) {
            this.jsonToken = jsonToken;
            return this;
        }

        public Builder jsonDeserializationMethod(String jsonDeserializationMethod) {
            this.jsonDeserializationMethod = jsonDeserializationMethod;
            return this;
        }

        public Builder serializationMethodBase(String serializationMethodBase) {
            this.serializationMethodBase = serializationMethodBase;
            return this;
        }

        public Builder xmlAttributeDeserializationTemplate(String xmlAttributeDeserializationTemplate) {
            this.xmlAttributeDeserializationTemplate = xmlAttributeDeserializationTemplate;
            return this;
        }

        public Builder xmlElementDeserializationMethod(String xmlElementDeserializationMethod) {
            this.xmlElementDeserializationMethod = xmlElementDeserializationMethod;
            return this;
        }

        public PrimitiveType build() {
            return new PrimitiveType(name, nullableType, defaultValueExpressionConverter, defaultValue, jsonToken,
                serializationMethodBase, wrapSerializationWithObjectsToString, jsonDeserializationMethod,
                xmlAttributeDeserializationTemplate, xmlElementDeserializationMethod);
        }
    }
}
