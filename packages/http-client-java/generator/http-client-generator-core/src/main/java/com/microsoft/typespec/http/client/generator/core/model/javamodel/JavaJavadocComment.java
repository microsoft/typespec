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

    // Markdown formatting patterns
    // Match ***text*** (bold italic), **text** (bold), or *text* (italic)
    // Uses non-greedy matching and requires the closing marker to not be followed by the same marker
    private static final Pattern BOLD_ITALIC_PATTERN = Pattern.compile("\\*\\*\\*(.+?)\\*\\*\\*");
    private static final Pattern BOLD_PATTERN = Pattern.compile("\\*\\*(.+?)\\*\\*");
    private static final Pattern ITALIC_PATTERN = Pattern.compile("(?<!\\*)\\*(?!\\*)(.+?)\\*(?!\\*)");

    public JavaJavadocComment(JavaFileContents contents) {
        this.contents = contents;
    }

    private static String trim(String value) {
        return value == null || value.isEmpty() ? value : value.trim();
    }

    private static String ensurePeriod(String value) {
        return value == null || value.isEmpty() || value.endsWith(".") ? value : value + '.';
    }

    /**
     * Converts Markdown formatting to JavaDoc HTML tags.
     * Converts:
     * - ***text*** to &lt;b&gt;&lt;i&gt;text&lt;/i&gt;&lt;/b&gt; (bold italic)
     * - **text** to &lt;b&gt;text&lt;/b&gt; (bold)
     * - *text* to &lt;i&gt;text&lt;/i&gt; (italic)
     * - Lines starting with "- " to &lt;ul&gt;&lt;li&gt; (bullet points)
     * - Lines starting with "N. " to &lt;ol&gt;&lt;li&gt; (numbered lists)
     *
     * @param text the text with Markdown formatting
     * @return the text with JavaDoc HTML formatting
     */
    private static String convertMarkdownToJavadoc(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }

        // Process line by line to handle bullet points and numbered lists
        String[] lines = text.split("\n");
        StringBuilder result = new StringBuilder();
        boolean inUnorderedList = false;
        boolean inOrderedList = false;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            String trimmedLine = line.trim();

            // Check for bullet points (lines starting with "- ")
            if (trimmedLine.startsWith("- ")) {
                if (!inUnorderedList) {
                    if (inOrderedList) {
                        result.append("</ol>\n");
                        inOrderedList = false;
                    }
                    result.append("<ul>\n");
                    inUnorderedList = true;
                }
                // Extract the content after "- " and convert inline formatting
                String content = convertInlineFormatting(trimmedLine.substring(2).trim());
                result.append("<li>").append(content).append("</li>\n");
            }
            // Check for numbered lists (lines starting with "N. " where N is a digit)
            else if (trimmedLine.matches("^\\d+\\.\\s+.*")) {
                if (!inOrderedList) {
                    if (inUnorderedList) {
                        result.append("</ul>\n");
                        inUnorderedList = false;
                    }
                    result.append("<ol>\n");
                    inOrderedList = true;
                }
                // Extract the content after "N. " and convert inline formatting
                String content = convertInlineFormatting(trimmedLine.replaceFirst("^\\d+\\.\\s+", ""));
                result.append("<li>").append(content).append("</li>\n");
            }
            // Regular line
            else {
                // Close any open lists
                if (inUnorderedList) {
                    result.append("</ul>\n");
                    inUnorderedList = false;
                }
                if (inOrderedList) {
                    result.append("</ol>\n");
                    inOrderedList = false;
                }

                if (!trimmedLine.isEmpty()) {
                    result.append(convertInlineFormatting(line));
                }

                // Add newline if not the last line
                if (i < lines.length - 1) {
                    result.append("\n");
                }
            }
        }

        // Close any remaining open lists
        if (inUnorderedList) {
            result.append("</ul>");
        }
        if (inOrderedList) {
            result.append("</ol>");
        }

        return result.toString();
    }

    /**
     * Converts inline Markdown formatting (bold, italic) to JavaDoc HTML tags.
     *
     * @param text the text with inline Markdown formatting
     * @return the text with JavaDoc HTML formatting
     */
    private static String convertInlineFormatting(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }

        // Convert ***bold italic*** first (must come before ** and *)
        text = BOLD_ITALIC_PATTERN.matcher(text).replaceAll("<b><i>$1</i></b>");

        // Convert **bold**
        text = BOLD_PATTERN.matcher(text).replaceAll("<b>$1</b>");

        // Convert *italic*
        text = ITALIC_PATTERN.matcher(text).replaceAll("<i>$1</i>");

        return text;
    }

    private static String processText(String value) {
        String text = trim(value);
        if (text != null && !text.isEmpty()) {
            // Ensure period at the end before any processing
            text = ensurePeriod(text);
            // Escape XML special characters FIRST (before markdown conversion)
            text = CodeNamer.escapeXmlComment(text);
            // escape "@" that isn't prefixed with "{"
            text = ESCAPE_AT.matcher(text).replaceAll("&#064;");
            // escape tab
            text = text.replace("\t", " ");
            // Convert Markdown formatting to JavaDoc HTML tags AFTER escaping
            text = convertMarkdownToJavadoc(text);
        }
        return CodeNamer.escapeIllegalUnicodeEscape(CodeNamer.escapeComment(text));
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
