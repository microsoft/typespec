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
            // escape "@" that isn't prefixed with "{"
            text = ESCAPE_AT.matcher(text).replaceAll("&#064;");
            // escape tab
            text = text.replace("\t", " ");
            text = CodeNamer.escapeComment(text);
            // replace "*&#47;" with "&#42;/" so that it doesn't contain "*" which might be matched by markdown
            text = text.replace("*&#47;", "&#42;/");
            text = processMarkdown(text);
            text = text.replace("&#42;/", "*&#47;");
        }
        return CodeNamer.escapeIllegalUnicodeEscape(text);
    }

    /**
     * Process simple Markdown style formatting in the text.
     * <p>
     * It supports:<br>
     * 1. Bullet list: line starting with "- " or "* "<br>
     * 2. Numbered list: line starting with "1. "<br>
     * 3. Bold: text wrapped with "**" or "__"<br>
     * 4. Italic: text wrapped with "*" or "_"
     * </p>
     *
     * @param text the text to process.
     * @return the text with Markdown style formatting converted to HTML.
     */
    private static String processMarkdown(String text) {
        if (text == null) {
            return null;
        }

        // Handle Lists
        StringBuilder sb = new StringBuilder();
        String[] lines = text.split("\\R");

        boolean inUl = false;
        boolean inOl = false;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            String trimmed = line.trim();

            if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                if (inOl) {
                    sb.append("</ol>");
                    inOl = false;
                }
                if (!inUl) {
                    sb.append("<ul>");
                    inUl = true;
                }
                sb.append("<li>").append(trimmed.substring(2)).append("</li>");
            } else if (trimmed.matches("^\\d+\\.\\s.*")) {
                if (inUl) {
                    sb.append("</ul>");
                    inUl = false;
                }
                if (!inOl) {
                    sb.append("<ol>");
                    inOl = true;
                }
                int dotIndex = trimmed.indexOf('.');
                sb.append("<li>").append(trimmed.substring(dotIndex + 1).trim()).append("</li>");
            } else {
                if (inUl) {
                    sb.append("</ul>");
                    inUl = false;
                }
                if (inOl) {
                    sb.append("</ol>");
                    inOl = false;
                }
                sb.append(line);
            }

            if (i < lines.length - 1) {
                sb.append("\n");
            }
        }

        if (inUl) {
            sb.append("</ul>");
        }
        if (inOl) {
            sb.append("</ol>");
        }

        text = sb.toString();

        // Bold
        text = text.replaceAll("\\*\\*(.+?)\\*\\*", "<b>$1</b>");
        text = text.replaceAll("__(.+?)__", "<b>$1</b>");

        // Italic
        text = text.replaceAll("\\*(.+?)\\*", "<i>$1</i>");
        text = text.replaceAll("_(.+?)_", "<i>$1</i>");

        return text;
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
