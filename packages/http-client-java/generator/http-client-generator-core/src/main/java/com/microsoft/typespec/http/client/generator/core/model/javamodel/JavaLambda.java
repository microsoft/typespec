// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import java.io.Closeable;
import java.util.function.Consumer;

public class JavaLambda implements Closeable {
    private final JavaFileContents contents;
    private boolean isFirstStatement;
    private boolean needsClosingCurlyBracket;

    public JavaLambda(JavaFileContents contents) {
        this.contents = contents;
        isFirstStatement = true;
        needsClosingCurlyBracket = false;
    }

    private void nonReturnStatement() {
        if (isFirstStatement) {
            isFirstStatement = false;

            contents.line("{");
            contents.increaseIndent();
            needsClosingCurlyBracket = true;
        }
    }

    public final void close() {
        if (needsClosingCurlyBracket) {
            contents.decreaseIndent();
            contents.text("}");
        }
    }

    public final void line(String text) {
        nonReturnStatement();
        contents.line(text);
    }

    public final void line(String format, Object... args) {
        line(String.format(format, args));
    }

    public final void increaseIndent() {
        contents.increaseIndent();
    }

    public final void decreaseIndent() {
        contents.decreaseIndent();
    }

    public final JavaIfBlock ifBlock(String condition, Consumer<JavaBlock> ifAction) {
        nonReturnStatement();
        contents.ifBlock(condition, ifAction);
        return new JavaIfBlock(contents);
    }

    public final void lambdaReturn(String text) {
        if (isFirstStatement) {
            contents.text(text);
        } else {
            contents.methodReturn(text);
        }
    }
}
