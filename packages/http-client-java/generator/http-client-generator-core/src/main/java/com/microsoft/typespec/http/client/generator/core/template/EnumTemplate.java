// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Annotation;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientEnumValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PrimitiveType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaContext;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaModifier;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

/**
 * Writes a EnumType to a JavaFile.
 */
public class EnumTemplate implements IJavaTemplate<EnumType, JavaFile> {
    private static final EnumTemplate INSTANCE = new EnumTemplate();

    protected EnumTemplate() {
    }

    public static EnumTemplate getInstance() {
        return INSTANCE;
    }

    public final void write(EnumType enumType, JavaFile javaFile) {
        JavaSettings settings = JavaSettings.getInstance();

        if (enumType.getExpandable()) {
            if (settings.isBranded()) {
                writeBrandedExpandableEnum(enumType, javaFile, settings);
            } else {
                writeExpandableEnumInterface(enumType, javaFile, settings);
            }
        } else {
            writeEnum(enumType, javaFile, settings);
        }
    }

    /**
     * Extension point for expandable enum implementation of branded flavor.
     *
     * @param enumType enumType to write implementation
     * @param javaFile javaFile to write into
     * @param settings {@link JavaSettings} instance
     */
    private void writeBrandedExpandableEnum(EnumType enumType, JavaFile javaFile, JavaSettings settings) {
        if (enumType.getElementType() == ClassType.STRING) {
            writeExpandableStringEnum(enumType, javaFile, settings);
        } else {
            writeExpandableEnumInterface(enumType, javaFile, settings);
        }
    }

    private void writeExpandableStringEnum(EnumType enumType, JavaFile javaFile, JavaSettings settings) {
        Set<String> imports = new HashSet<>();
        imports.add("java.util.Collection");
        imports.add(ClassType.EXPANDABLE_STRING_ENUM.getFullName());
        if (!settings.isStreamStyleSerialization()) {
            imports.add("com.fasterxml.jackson.annotation.JsonCreator");
        }

        addGeneratedImport(imports);

        javaFile.declareImport(imports);
        javaFile.javadocComment(comment -> comment.description(enumType.getDescription()));

        String enumName = enumType.getName();
        String declaration = enumName + " extends ExpandableStringEnum<" + enumName + ">";

        javaFile.publicFinalClass(declaration, classBlock -> {
            IType elementType = enumType.getElementType();
            String typeName = elementType.getClientType().toString();
            String pascalTypeName = CodeNamer.toPascalCase(typeName);
            for (ClientEnumValue enumValue : enumType.getValues()) {
                String value = enumValue.getValue();
                classBlock.javadocComment(CoreUtils.isNullOrEmpty(enumValue.getDescription())
                    ? "Static value " + value + " for " + enumName + "."
                    : enumValue.getDescription());
                addGeneratedAnnotation(classBlock);
                classBlock.publicStaticFinalVariable(String.format("%1$s %2$s = from%3$s(%4$s)", enumName,
                    enumValue.getName(), pascalTypeName, elementType.defaultValueExpression(value)));
            }

            // ctor, marked as Deprecated
            classBlock.javadocComment(comment -> {
                comment.description("Creates a new instance of " + enumName + " value.");
                comment.deprecated(
                    String.format("Use the {@link #from%1$s(%2$s)} factory method.", pascalTypeName, typeName));
            });

            addGeneratedAnnotation(classBlock);
            classBlock.annotation("Deprecated");
            classBlock.publicConstructor(enumName + "()", ctor -> {
            });

            // fromString(typeName)
            classBlock.javadocComment(comment -> {
                comment.description("Creates or finds a " + enumName + " from its string representation.");
                comment.param("name", "a name to look for");
                comment.methodReturns("the corresponding " + enumName);
            });

            addGeneratedAnnotation(classBlock);
            if (!settings.isStreamStyleSerialization()) {
                classBlock.annotation("JsonCreator");
            }

            classBlock.publicStaticMethod(String.format("%1$s from%2$s(%3$s name)", enumName, pascalTypeName, typeName),
                function -> {
                    String stringValue = (ClassType.STRING.equals(elementType)) ? "name" : "String.valueOf(name)";
                    function.methodReturn("fromString(" + stringValue + ", " + enumName + ".class)");
                });

            // values()
            classBlock.javadocComment(comment -> {
                comment.description("Gets known " + enumName + " values.");
                comment.methodReturns("known " + enumName + " values");
            });

            addGeneratedAnnotation(classBlock);
            classBlock.publicStaticMethod("Collection<" + enumName + "> values()",
                function -> function.methodReturn("values(" + enumName + ".class)"));
        });
    }

    private void writeEnum(EnumType enumType, JavaFile javaFile, JavaSettings settings) {
        Set<String> imports = new HashSet<>();
        if (!settings.isStreamStyleSerialization()) {
            imports.add("com.fasterxml.jackson.annotation.JsonCreator");
            imports.add("com.fasterxml.jackson.annotation.JsonValue");
        }

        addGeneratedImport(imports);
        IType elementType = enumType.getElementType();
        elementType.getClientType().addImportsTo(imports, false);

        javaFile.declareImport(imports);
        javaFile.javadocComment(comment -> comment.description(enumType.getDescription()));
        String declaration = enumType.getName();

        javaFile.publicEnum(declaration, enumBlock -> {
            for (ClientEnumValue value : enumType.getValues()) {
                enumBlock.value(value.getName(), value.getValue(), value.getDescription(), elementType);
            }

            String enumName = enumType.getName();
            String typeName = elementType.getClientType().toString();

            // This will be 'from*'.
            String converterName = enumType.getFromMethodName();

            enumBlock.javadocComment("The actual serialized value for a " + enumName + " instance.");
            enumBlock.privateFinalMemberVariable(typeName, "value");

            enumBlock.constructor(enumName + "(" + typeName + " value)",
                constructor -> constructor.line("this.value = value;"));

            enumBlock.javadocComment((comment) -> {
                comment.description("Parses a serialized value to a " + enumName + " instance.");
                comment.param("value", "the serialized value to parse.");
                comment.methodReturns("the parsed " + enumName + " object, or null if unable to parse.");
            });

            if (!settings.isStreamStyleSerialization()) {
                enumBlock.annotation("JsonCreator");
            }

            enumBlock.publicStaticMethod(enumName + " " + converterName + "(" + typeName + " value)", function -> {
                if (elementType.isNullable()) {
                    function.ifBlock("value == null", ifAction -> ifAction.methodReturn("null"));
                }
                function.line(enumName + "[] items = " + enumName + ".values();");
                function.block("for (" + enumName + " item : items)", foreachBlock -> foreachBlock
                    .ifBlock(createEnumJsonCreatorIfCheck(enumType), ifBlock -> ifBlock.methodReturn("item")));
                function.methodReturn("null");
            });

            if (elementType == ClassType.STRING) {
                enumBlock.javadocComment(JavaJavadocComment::inheritDoc);
                if (!settings.isStreamStyleSerialization()) {
                    enumBlock.annotation("JsonValue");
                }
                enumBlock.annotation("Override");
            } else {
                enumBlock.javadocComment(comment -> {
                    comment.description("De-serializes the instance to " + elementType + " value.");
                    comment.methodReturns("the " + elementType + " value");
                });

                if (!settings.isStreamStyleSerialization()) {
                    enumBlock.annotation("JsonValue");
                }
            }
            enumBlock.publicMethod(typeName + " " + enumType.getToMethodName() + "()",
                function -> function.methodReturn("this.value"));
        });
    }

    private void writeExpandableEnumInterface(EnumType enumType, JavaFile javaFile, JavaSettings settings) {
        Set<String> imports = new HashSet<>();
        imports.add("java.util.Collection");
        imports.add("java.lang.IllegalArgumentException");
        imports.add("java.util.Map");
        imports.add("java.util.concurrent.ConcurrentHashMap");
        imports.add("java.util.ArrayList");
        imports.add("java.util.Objects");
        imports.add(ClassType.EXPANDABLE_ENUM.getFullName());
        imports.add("java.util.function.Function");
        if (!settings.isStreamStyleSerialization()) {
            imports.add("com.fasterxml.jackson.annotation.JsonCreator");
        } else {
            imports.add(ClassType.JSON_READER.getFullName());
            imports.add(ClassType.JSON_WRITER.getFullName());
            imports.add(ClassType.JSON_SERIALIZABLE.getFullName());
            imports.add(ClassType.JSON_TOKEN.getFullName());
            imports.add(IOException.class.getName());
        }

        addGeneratedImport(imports);

        javaFile.declareImport(imports);
        javaFile.javadocComment(comment -> comment.description(enumType.getDescription()));

        String enumName = enumType.getName();
        IType elementType = enumType.getElementType();
        String typeName = elementType.getClientType().asNullable().toString();
        String pascalTypeName = CodeNamer.toPascalCase(typeName);
        String declaration;
        if (settings.isStreamStyleSerialization()) {
            declaration = String.format("%1$s implements ExpandableEnum<%2$s>, JsonSerializable<%1$s>", enumName,
                pascalTypeName);
        } else {
            declaration = String.format("%1$s implements ExpandableEnum<%2$s>", enumName, pascalTypeName);
        }
        javaFile.publicFinalClass(declaration, classBlock -> {
            classBlock.privateStaticFinalVariable(
                String.format("Map<%1$s, %2$s> VALUES = new ConcurrentHashMap<>()", pascalTypeName, enumName));
            classBlock.privateStaticFinalVariable(
                String.format("Function<%1$s, %2$s> NEW_INSTANCE = %2$s::new", pascalTypeName, enumName));

            for (ClientEnumValue enumValue : enumType.getValues()) {
                String value = enumValue.getValue();
                classBlock.javadocComment(CoreUtils.isNullOrEmpty(enumValue.getDescription())
                    ? "Static value " + value + " for " + enumName + "."
                    : enumValue.getDescription());
                addGeneratedAnnotation(classBlock);
                classBlock.publicStaticFinalVariable(String.format("%1$s %2$s = fromValue(%3$s)", enumName,
                    enumValue.getName(), elementType.defaultValueExpression(value)));
            }

            classBlock.variable(pascalTypeName + " value", JavaVisibility.Private, JavaModifier.Final);
            classBlock.privateConstructor(enumName + "(" + pascalTypeName + " value)", ctor -> {
                ctor.line("this.value = value;");
            });

            // fromValue(typeName)
            classBlock.javadocComment(comment -> {
                comment.description("Creates or finds a " + enumName);
                comment.param("value", "a value to look for");
                comment.methodReturns("the corresponding " + enumName);
                comment.methodThrows("IllegalArgumentException", "if value is null");
            });

            addGeneratedAnnotation(classBlock);
            if (!settings.isStreamStyleSerialization()) {
                classBlock.annotation("JsonCreator");
            }

            classBlock.publicStaticMethod(String.format("%1$s fromValue(%2$s value)", enumName, pascalTypeName),
                function -> {
                    function.ifBlock("value == null",
                        ifBlock -> ifBlock.line("throw new IllegalArgumentException(\"'value' cannot be null.\");"));
                    function.methodReturn("VALUES.computeIfAbsent(value, NEW_INSTANCE)");
                });

            // values
            classBlock.javadocComment(comment -> {
                comment.description("Gets known " + enumName + " values.");
                comment.methodReturns("Known " + enumName + " values.");
            });
            addGeneratedAnnotation(classBlock);
            classBlock.publicStaticMethod(String.format("Collection<%s> values()", enumName),
                function -> function.methodReturn("new ArrayList<>(VALUES.values())"));

            // getValue
            classBlock.javadocComment(comment -> {
                comment.description("Gets the value of the " + enumName + " instance.");
                comment.methodReturns("the value of the " + enumName + " instance.");
            });
            addGeneratedAnnotation(classBlock);
            classBlock.annotation("Override");
            classBlock.publicMethod(pascalTypeName + " getValue()", function -> function.methodReturn("this.value"));

            if (settings.isStreamStyleSerialization()) {
                // toJson
                classBlock.javadocComment(JavaJavadocComment::inheritDoc);
                addGeneratedAnnotation(classBlock);
                classBlock.annotation("Override");
                classBlock.publicMethod("JsonWriter toJson(JsonWriter jsonWriter) throws IOException", methodBlock -> {
                    methodBlock.methodReturn(enumType.getElementType()
                        .jsonSerializationMethodCall("jsonWriter", null, enumType.getToMethodName() + "()", false));
                });

                // fromJson
                classBlock.javadocComment(javadocComment -> {
                    javadocComment.description("Reads an instance of " + enumName + " from the JsonReader.");
                    javadocComment.param("jsonReader", "The JsonReader being read.");
                    javadocComment.methodReturns("An instance of " + enumName + " if the JsonReader was pointing to an "
                        + "instance of it, or null if the JsonReader was pointing to JSON null.");
                    javadocComment.methodThrows("IOException",
                        "If an error occurs while reading the " + enumName + ".");
                    javadocComment.methodThrows("IllegalStateException", "If unexpected JSON token is found.");
                });
                addGeneratedAnnotation(classBlock);
                classBlock.publicStaticMethod(enumName + " fromJson(JsonReader jsonReader) throws IOException",
                    methodBlock -> {
                        methodBlock.line("JsonToken nextToken = jsonReader.nextToken();");
                        methodBlock.ifBlock("nextToken == JsonToken.NULL",
                            ifAction -> methodBlock.methodReturn("null"));
                        methodBlock.ifBlock("nextToken != " + elementType.jsonToken(), ifAction -> ifAction.line(
                            "throw new IllegalStateException(String.format(\"Unexpected JSON token for %s deserialization: %s\", "
                                + elementType.jsonToken() + ", nextToken));"));
                        methodBlock.methodReturn(enumType.jsonDeserializationMethod("jsonReader"));
                    });
            }

            // toString
            addGeneratedAnnotation(classBlock);
            classBlock.annotation("Override");
            classBlock.method(JavaVisibility.Public, null, "String toString()",
                function -> function.methodReturn("Objects.toString(this.value)"));

            // equals
            // checkstyle needs both equals() and hashcode() override, so even if its implementation is identical to
            // Object's equals(), we still need it
            addGeneratedAnnotation(classBlock);
            classBlock.annotation("Override");
            classBlock.method(JavaVisibility.Public, null, "boolean equals(Object obj)",
                function -> function.methodReturn("this == obj"));

            // hashcode
            addGeneratedAnnotation(classBlock);
            classBlock.annotation("Override");
            classBlock.method(JavaVisibility.Public, null, "int hashCode()",
                function -> function.methodReturn("Objects.hashCode(this.value)"));
        });
    }

    /**
     * Creates the if check used by the JsonCreator method used in the Enum type.
     *
     * @param enumType The enum type.
     * @return The JsonCreator if check.
     */
    private String createEnumJsonCreatorIfCheck(EnumType enumType) {
        IType enumElementType = enumType.getElementType();
        String toJsonMethodName = enumType.getToMethodName();

        if (enumElementType == PrimitiveType.FLOAT) {
            return String.format("Float.floatToIntBits(item.%s()) == Float.floatToIntBits(value)", toJsonMethodName);
        } else if (enumElementType == PrimitiveType.DOUBLE) {
            return String.format("Double.doubleToLongBits(item.%s()) == Double.doubleToLongBits(value)",
                toJsonMethodName);
        } else if (enumElementType instanceof PrimitiveType) {
            return String.format("item.%s() == value", toJsonMethodName);
        } else if (enumElementType == ClassType.STRING) {
            return String.format("item.%s().equalsIgnoreCase(value)", toJsonMethodName);
        } else {
            return String.format("item.%s().equals(value)", toJsonMethodName);
        }
    }

    private void addGeneratedImport(Set<String> imports) {
        if (JavaSettings.getInstance().isDataPlaneClient()) {
            if (JavaSettings.getInstance().isBranded()) {
                Annotation.GENERATED.addImportsTo(imports);
            } else {
                Annotation.METADATA.addImportsTo(imports);
            }
        }
    }

    private void addGeneratedAnnotation(JavaContext classBlock) {
        if (JavaSettings.getInstance().isDataPlaneClient()) {
            if (JavaSettings.getInstance().isBranded()) {
                classBlock.annotation(Annotation.GENERATED.getName());
            } else {
                classBlock.annotation(Annotation.METADATA.getName() + "(generated = true)");
            }
        }
    }
}
