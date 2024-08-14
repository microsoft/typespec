// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

import java.util.regex.Pattern;

public class JavaJavadocComment {
    private final JavaFileContents contents;
    private boolean expectsLineSeparator;

    // escape the "@" in Javadoc description, if it is not used in inline tag like {@link }
    private static final Pattern ESCAPE_AT = Pattern.compile("(?<!\\{)@");

    public JavaJavadocComment(JavaFileContents contents) {
        this.contents = contents;
    }

    private static String trim(String value) {
        return value == null || value.isEmpty() ? value : value.trim();
    }

    private static String ensurePeriod(String value) {
        return value == null || value.isEmpty() || value.endsWith(".") ? value : value + '.';
    }

    private static String processText(String value) {
        String text = CodeNamer.escapeXmlComment(ensurePeriod(trim(value)));
        if (text != null) {
            // escape the "@"
            text = ESCAPE_AT.matcher(text).replaceAll("&#064;");
            // escape tab
            text = text.replace("\t", " ");
        }
        return CodeNamer.escapeComment(text);
    }

    private void addExpectedLineSeparator() {
        if (expectsLineSeparator) {
            expectsLineSeparator = false;
            contents.line();
        }
    }

    /**
     * Adds Javadoc description.
     * <p>The {@literal &, <, >} characters would be encoded.
     * The {@literal @} would also be encoded if not used in inline tags.</p>
     *
     * @param description the Javadoc description.
     */
    public final void description(String description) {
        String processedText = processText(description);
        line(processedText);
    }

    /**
     * Adds a line to Javadoc.
     * <p>The characters in the line is not encoded.
     * This API should not be used to write text from external source, e.g. Swagger or TypeSpec.</p>
     *
     * @param text the line to be written to Javadoc.
     */
    public final void line(String text) {
        if (text != null && !text.isEmpty()) {
            contents.line(text);
            expectsLineSeparator = true;
        }
    }

    public final void param(String parameterName, String parameterDescription) {
        addExpectedLineSeparator();
        contents.line("@param " + parameterName + " " + processText(parameterDescription));
    }

    public final void methodReturns(String returnValueDescription) {
        if (returnValueDescription != null && !returnValueDescription.isEmpty()) {
            addExpectedLineSeparator();
            contents.line("@return " + processText(returnValueDescription));
        }
    }

    public final void methodThrows(String exceptionTypeName, String description) {
        addExpectedLineSeparator();
        contents.line("@throws " + exceptionTypeName + " " + processText(description));
    }

    public final void inheritDoc() {
        addExpectedLineSeparator();
        contents.line("{@inheritDoc}");
    }

    public final void deprecated(String description) {
        addExpectedLineSeparator();
        contents.line("@deprecated " + description);
    }
}
