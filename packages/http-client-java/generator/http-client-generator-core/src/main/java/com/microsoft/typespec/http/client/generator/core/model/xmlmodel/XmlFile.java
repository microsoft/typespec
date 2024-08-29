// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.xmlmodel;

import java.util.Map;
import java.util.function.Consumer;

public class XmlFile {
    private final String filePath;
    private final XmlFileContents contents;

    public static class Options {
        private int indent = 4;

        public int getIndent() {
            return indent;
        }

        public Options setIndent(int indent) {
            this.indent = indent;
            return this;
        }
    }

    public XmlFile(String filePath) {
        this(filePath, null, null);
    }

    public XmlFile(String filePath, Options options) {
        this(filePath, null, options);
    }

    public XmlFile(String filePath, String fileContents) {
        this(filePath, fileContents, null);
    }

    public XmlFile(String filePath, String fileContents, Options options) {
        this.filePath = filePath;
        contents = new XmlFileContents(fileContents, options);
    }

    public final String getFilePath() {
        return filePath;
    }

    public final XmlFileContents getContents() {
        return contents;
    }

    public final void text(String text) {
        getContents().text(text);
    }

    public final void line(String text) {
        getContents().line(text);
    }

    public final void line() {
        getContents().line();
    }

    public final void tag(String tag, String value) {
        getContents().tag(tag, value);
    }

    public final void indent(Runnable indentAction) {
        getContents().indent(indentAction);
    }

    public void block(String text, Consumer<XmlBlock> bodyAction) {
        getContents().block(text, bodyAction);
    }

    public void block(String text, Map<String, String> annotations, Consumer<XmlBlock> bodyAction) {
        getContents().block(text, annotations, bodyAction);
    }

    public void blockComment(String text) {
        getContents().blockComment(text);
    }

    public void blockComment(Consumer<XmlLineComment> commentAction) {
        getContents().blockComment(commentAction);
    }
}
