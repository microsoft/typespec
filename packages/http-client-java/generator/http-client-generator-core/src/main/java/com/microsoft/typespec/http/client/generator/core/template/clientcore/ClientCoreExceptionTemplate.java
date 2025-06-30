// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientException;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaJavadocComment;
import com.microsoft.typespec.http.client.generator.core.template.ExceptionTemplate;
import java.util.HashSet;
import java.util.Set;

public class ClientCoreExceptionTemplate extends ExceptionTemplate {

    private static final ClientCoreExceptionTemplate INSTANCE = new ClientCoreExceptionTemplate();

    private ClientCoreExceptionTemplate() {

    }

    public static ClientCoreExceptionTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(ClientException exception, JavaFile javaFile) {
        Set<String> imports = new HashSet<>();
        imports.add(getHttpResponseImport());
        ClassType.BINARY_DATA.addImportsTo(imports, false);
        exception.getParentType().addImportsTo(imports, false);
        javaFile.declareImport(imports);
        javaFile.javadocComment((comment) -> {
            comment.description(String.format("Exception thrown for an invalid response with %1$s information.",
                exception.getErrorName()));
        });
        javaFile.publicFinalClass(
            String.format("%1$s extends %2$s", exception.getName(), exception.getParentType().toString()),
            (classBlock) -> {
                classBlock.javadocComment((comment) -> {
                    comment.description(
                        String.format("Initializes a new instance of the %1$s class.", exception.getName()));
                    comment.param("message",
                        "the exception message or the response content if a message is not available");
                    comment.param("response", "the HTTP response");
                });
                classBlock.publicConstructor(
                    String.format("%1$s(String message, Response<BinaryData> response)", exception.getName()),
                    (constructorBlock) -> {
                        constructorBlock.line("super(message, response, null);");
                    });

                classBlock.javadocComment((comment) -> {
                    comment.description(
                        String.format("Initializes a new instance of the %1$s class.", exception.getName()));
                    comment.param("message",
                        "the exception message or the response content if a message is not available");
                    comment.param("response", "the HTTP response");
                    comment.param("value", "the deserialized response value");
                });
                classBlock
                    .publicConstructor(String.format("%1$s(String message, Response<BinaryData> response, %2$s value)",
                        exception.getName(), exception.getErrorName()), (constructorBlock) -> {
                            constructorBlock.line("super(message, response, value);");
                        });

                classBlock.javadocComment(JavaJavadocComment::inheritDoc);
                classBlock.annotation("Override");
                classBlock.publicMethod(String.format("%1$s getValue()", exception.getErrorName()), (methodBlock) -> {
                    methodBlock.methodReturn(String.format("(%1$s) super.getValue()", exception.getErrorName()));
                });
            });
    }

    protected String getHttpResponseImport() {
        return ClassType.RESPONSE.getFullName();
    }
}
