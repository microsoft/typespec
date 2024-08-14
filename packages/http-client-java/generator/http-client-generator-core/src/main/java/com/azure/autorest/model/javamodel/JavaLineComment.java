// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.model.javamodel;

import com.azure.autorest.util.CodeNamer;

public class JavaLineComment {
    private final JavaFileContents contents;

    public JavaLineComment(JavaFileContents contents) {
        this.contents = contents;
    }

    public final void line(String text) {
        contents.line(CodeNamer.escapeComment(text));
    }
}
