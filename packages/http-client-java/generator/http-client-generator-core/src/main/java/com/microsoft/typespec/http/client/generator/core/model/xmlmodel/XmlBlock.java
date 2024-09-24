// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.xmlmodel;

import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import java.util.function.Consumer;

public class XmlBlock {
    private final XmlFileContents contents;

    public XmlBlock(XmlFileContents contents) {
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

    public final void line(String text, Object... formattedArguments) {
        contents.line(text, formattedArguments);
    }

    public final void line() {
        contents.line();
    }

    public final void tag(String tag, String value) {
        contents.tag(tag, CodeNamer.escapeXmlComment(value));
    }

    public final void block(String text, Consumer<XmlBlock> bodyAction) {
        contents.block(text, bodyAction);
    }

    public final void tagWithInlineComment(String tag, String value, String comment) {
        String escapedValue = CodeNamer.escapeXmlComment(value);
        String escapedComment = CodeNamer.escapeXmlComment(comment);
        contents.line("<" + tag + ">" + escapedValue + "</" + tag + "> <!-- " + escapedComment + " -->");
    }

    public final void tagCData(String tag, String value) {
        contents.line("<" + tag + "><![CDATA[" + value + "]]></" + tag + ">");
    }
}
