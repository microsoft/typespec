// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import java.util.function.Consumer;

public class JavaBlock implements JavaContext {
    private final JavaFileContents contents;

    public JavaBlock(JavaFileContents contents) {
        this.contents = contents;
    }

    public final void indent(Runnable indentAction) {
        contents.indent(indentAction);
    }

    public final void increaseIndent() {
        contents.increaseIndent();
    }

    public final void decreaseIndent() {
        contents.decreaseIndent();
    }

    public final void text(String text) {
        contents.text(text);
    }

    public final void line(String text) {
        contents.line(text);
    }

    public final void line(String text, Object... formattedArguments) {
        contents.line(text, formattedArguments);
    }

    public final void line() {
        contents.line();
    }

    public final void block(String text, Consumer<JavaBlock> bodyAction) {
        contents.block(text, bodyAction);
    }

    public final void javadocComment(String text) {
        contents.javadocComment(text);
    }

    public final void javadocComment(Consumer<JavaJavadocComment> commentAction) {
        contents.javadocComment(commentAction);
    }

    public final void methodReturn(String text) {
        contents.methodReturn(text);
    }

    public final void annotation(String... annotations) {
        contents.annotation(annotations);
    }

    public final void returnAnonymousClass(String anonymousClassDeclaration, Consumer<JavaClass> anonymousClassBlock) {
        contents.returnAnonymousClass(anonymousClassDeclaration, anonymousClassBlock);
    }

    public final void anonymousClass(String anonymousClassDeclaration, String instanceName, Consumer<JavaClass> anonymousClassBlock) {
        contents.anonymousClass(anonymousClassDeclaration, instanceName, anonymousClassBlock);
    }

    public final JavaIfBlock ifBlock(String condition, Consumer<JavaBlock> ifAction) {
        contents.ifBlock(condition, ifAction);
        return new JavaIfBlock(contents);
    }

    public final JavaTryBlock tryBlock(Consumer<JavaBlock> ifAction) {
        contents.tryBlock(ifAction);
        return new JavaTryBlock(contents);
    }

    public final JavaTryBlock tryBlock(String resource, Consumer<JavaBlock> ifAction) {
        contents.tryBlock(resource, ifAction);
        return new JavaTryBlock(contents);
    }

    public final void lambda(String parameterType, String parameterName, Consumer<JavaLambda> body) {
        contents.lambda(parameterType, parameterName, body);
    }

    public final void lambda(String parameterType, String parameterName, String returnExpression) {
        contents.lambda(parameterType, parameterName, returnExpression);
    }
}
