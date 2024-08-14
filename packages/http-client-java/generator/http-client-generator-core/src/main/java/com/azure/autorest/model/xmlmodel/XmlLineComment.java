// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.model.xmlmodel;

public class XmlLineComment {
    private final XmlFileContents contents;

    public XmlLineComment(XmlFileContents contents) {
        this.contents = contents;
    }

    public final void line(String text) {
        contents.line(text);
    }
}
