// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.xmlmodel;

public class XmlLineComment {
    private final XmlFileContents contents;

    public XmlLineComment(XmlFileContents contents) {
        this.contents = contents;
    }

    public final void line(String text) {
        contents.line(text);
    }
}
