// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModelProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.UnionModel;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaModifier;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.azure.core.annotation.Immutable;
import com.azure.core.util.CoreUtils;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;

public class UnionModelTemplate implements IJavaTemplate<UnionModel, JavaFile> {

    private static final UnionModelTemplate INSTANCE = new UnionModelTemplate();

    protected UnionModelTemplate() {
    }

    public static UnionModelTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(UnionModel model, JavaFile javaFile) {
        // presently, subclass would only contain one "value" property.

        final boolean isAbstractClass = CoreUtils.isNullOrEmpty(model.getParentModelName());
        final String superClassName = model.getParentModelName();

        Set<String> imports = new HashSet<>();
        model.addImportsTo(imports);

        imports.add(Immutable.class.getName());
        imports.add("com.fasterxml.jackson.annotation.JsonValue");

        javaFile.declareImport(imports);

        List<JavaModifier> modifiers = Collections.singletonList(isAbstractClass ? JavaModifier.Abstract : JavaModifier.Final);
        String classDeclaration = isAbstractClass ? model.getName() : (model.getName() + " extends " + superClassName);
        javaFile.javadocComment(comment -> comment.description(model.getDescription()));
        if (!isAbstractClass) {
            javaFile.annotation("Immutable");
        }
        javaFile.publicClass(modifiers, classDeclaration, classBlock -> {
            // properties as member variables
            for (ClientModelProperty property : model.getProperties()) {
                classBlock.privateFinalMemberVariable(property.getClientType() + " " + property.getName());
            }

            // constructor
            if (isAbstractClass) {
                classBlock.javadocComment(comment ->
                        comment.description("Creates an instance of " + model.getName() + " class."));
                classBlock.constructor(JavaVisibility.Protected, model.getName() + "()", constructor -> {
                });
            } else {
                StringBuilder constructorProperties = new StringBuilder();

                Consumer<JavaJavadocComment> javadocCommentConsumer = comment ->
                        comment.description("Creates an instance of " + model.getName() + " class.");

                for (ClientModelProperty property : model.getProperties()) {
                    javadocCommentConsumer = javadocCommentConsumer.andThen(comment -> {
                        comment.param(property.getName(), "the value");
                    });

                    if (constructorProperties.length() > 0) {
                        constructorProperties.append(", ");
                    }
                    constructorProperties.append(property.getClientType()).append(" ").append(property.getName());
                }

                classBlock.javadocComment(javadocCommentConsumer);
                classBlock.publicConstructor(String.format("%1$s(%2$s)", model.getName(), constructorProperties), constructor -> {
                    for (ClientModelProperty property : model.getProperties()) {
                        constructor.line("this." + property.getName() + " = " +
                                property.getWireType().convertFromClientType(property.getName()) + ";");
                    }
                });
            }

            // getter/setters
            for (ClientModelProperty property : model.getProperties()) {
                String propertyName = property.getName();
                IType clientType = property.getClientType();

                // getter
                classBlock.javadocComment(comment -> {
                    comment.description("Gets the value");
                    comment.methodReturns("the value");
                });
                classBlock.annotation("JsonValue");
                classBlock.publicMethod(clientType + " " + property.getGetterName() + "()", methodBlock -> {
                    methodBlock.methodReturn("this." + propertyName);
                });
            }
        });
    }
}
