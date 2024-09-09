// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import java.util.function.Consumer;

public class JavaInterface implements JavaType {
    private final JavaFileContents contents;
    private boolean addNewLine;

    public JavaInterface(JavaFileContents contents) {
        this.contents = contents;
    }

    private void addExpectedNewLine() {
        if (addNewLine) {
            contents.line();
            addNewLine = false;
        }
    }

    public final void publicMethod(String methodSignature) {
        publicMethod(methodSignature, null);
    }

    public final void publicMethod(String methodSignature, Consumer<JavaBlock> functionBlock) {
        addExpectedNewLine();
        contents.line(methodSignature + ";");

        addNewLine = true;
    }

    public final void javadocComment(Consumer<JavaJavadocComment> commentAction) {
        addExpectedNewLine();
        contents.javadocComment(commentAction);
    }

    public final void lineComment(String comment) {
        addExpectedNewLine();
        contents.lineComment(comment);
    }

    public final void annotation(String... annotations) {
        addExpectedNewLine();
        contents.annotation(annotations);
    }

    public final void interfaceBlock(String interfaceName, Consumer<JavaInterface> interfaceAction) {
        contents.interfaceBlock(JavaVisibility.PackagePrivate, interfaceName, interfaceAction);
    }
}
