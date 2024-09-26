// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.template;

import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientEnumValue;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaModifier;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.EnumTemplate;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import java.util.HashSet;
import java.util.Set;

/**
 * TypeSpec implementation for EnumTemplate.
 */
public class TypeSpecEnumTemplate extends EnumTemplate {
    private static final TypeSpecEnumTemplate INSTANCE = new TypeSpecEnumTemplate();

    public static TypeSpecEnumTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void writeBrandedExpandableEnum(EnumType enumType, JavaFile javaFile, JavaSettings settings) {
        if (enumType.getElementType() == ClassType.STRING) {
            // if String, use ExpandableStringEnum implementation
            super.writeBrandedExpandableEnum(enumType, javaFile, settings);
        } else {
            Set<String> imports = new HashSet<>();
            imports.add("java.util.Collection");
            imports.add("java.lang.IllegalArgumentException");
            imports.add("java.util.Map");
            imports.add("java.util.concurrent.ConcurrentHashMap");
            imports.add("java.util.ArrayList");
            imports.add(ClassType.EXPANDABLE_ENUM.getFullName());
            if (!settings.isStreamStyleSerialization()) {
                imports.add("com.fasterxml.jackson.annotation.JsonCreator");
            }

            addGeneratedImport(imports);

            javaFile.declareImport(imports);
            javaFile.javadocComment(comment -> comment.description(enumType.getDescription()));

            String enumName = enumType.getName();
            IType elementType = enumType.getElementType();
            String typeName = elementType.getClientType().asNullable().toString();
            String pascalTypeName = CodeNamer.toPascalCase(typeName);
            String declaration = enumName + " implements ExpandableEnum<" + pascalTypeName + ">";
            javaFile.publicFinalClass(declaration, classBlock -> {
                classBlock.privateStaticFinalVariable(
                    String.format("Map<%1$s, %2$s> VALUES = new ConcurrentHashMap<>()", pascalTypeName, enumName));

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
                });

                addGeneratedAnnotation(classBlock);
                if (!settings.isStreamStyleSerialization()) {
                    classBlock.annotation("JsonCreator");
                }

                classBlock.publicStaticMethod(String.format("%1$s fromValue(%2$s value)", enumName, pascalTypeName),
                    function -> {
                        function.ifBlock("value == null",
                            ifAction -> ifAction.line("throw new IllegalArgumentException(\"value can't be null\");"));
                        function.line(enumName + " member = VALUES.get(value);");
                        function.ifBlock("member != null", ifAction -> {
                            ifAction.line("return member;");
                        });
                        function.methodReturn("VALUES.computeIfAbsent(value, key -> new " + enumName + "(key))");
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
                classBlock.publicMethod(pascalTypeName + " getValue()",
                    function -> function.methodReturn("this.value"));

                // toString
                addGeneratedAnnotation(classBlock);
                classBlock.annotation("Override");
                classBlock.method(JavaVisibility.Public, null, "String toString()",
                    function -> function.methodReturn("getValue().toString()"));

                // equals
                addGeneratedAnnotation(classBlock);
                classBlock.annotation("Override");
                classBlock.method(JavaVisibility.Public, null, "boolean equals(Object obj)",
                    function -> function.methodReturn(String
                        .format("(obj instanceof %1$s) && ((%1$s) obj).getValue().equals(getValue())", enumName)));

                // hashcode
                addGeneratedAnnotation(classBlock);
                classBlock.annotation("Override");
                classBlock.method(JavaVisibility.Public, null, "int hashCode()",
                    function -> function.methodReturn("getValue().hashCode()"));
            });
        }
    }
}
