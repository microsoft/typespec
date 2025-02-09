package com.microsoft.provisioning.http.client.generator.provisioning.utils;

import java.io.StringWriter;
import java.util.Arrays;

/**
 * A writer that supports indentation.
 */
public class IndentWriter {
    /**
     * The buffer where text is written. It is obtained by the user via
     * IndentWriter.toString().
     */
    private final StringWriter writer = new StringWriter();

    /**
     * Whether the last character written was a newline character
     * (which means the next line written should automatically add the
     * current indent depth).
     */
    private boolean isNewline = true;

    /**
     * Gets or sets the text used as each indent character (i.e., could be
     * a single tab character or four space characters). The default value
     * is four space characters.
     */
    private String indentText = "    ";

    /**
     * Gets the depth of the current indent level.
     */
    private int indent = 0;

    /**
     * Initializes a new instance of the IndentWriter class.
     */
    public IndentWriter() {
    }

    /**
     * Gets the text that has been written thus far.
     *
     * @return The text written thus far.
     */
    @Override
    public String toString() {
        return writer.toString();
    }

    /**
     * Pushes the scope a level deeper.
     */
    public void pushScope() {
        indent++;
    }

    /**
     * Pops the scope a level.
     */
    public void popScope() {
        if (indent == 0) {
            throw new IllegalStateException("Cannot pop scope any further!");
        }
        indent--;
    }

    /**
     * Writes an indent if needed. This is used before each write
     * operation to ensure we're always indenting. We don't need to indent
     * for a series of calls like write("Foo"); write("Bar"); but would
     * indent between a series like writeLine("Foo"); write("Bar");
     */
    private void writeIndentIfNeeded() {
        // If we had just written a full line
        if (isNewline) {
            // Then we'll write out the current indent depth before anything
            // else is written
            isNewline = false;
            for (int i = 0; i < indent; i++) {
                writer.write(indentText);
            }
        }
    }

    /**
     * Write the text representation of the given values with indentation
     * as appropriate.
     *
     * @param format Format string.
     * @param args   Optional arguments to the format string.
     */
    public void write(String format, Object... args) {
        writeIndentIfNeeded();

        // Only use String.format if we have args so that we don't have to
        // escape curly brace literals used on their own.
        if (args != null && args.length > 0) {
            writer.write(String.format(format, args));
        } else if (format != null) {
            writer.write(format);
        }
    }

    /**
     * Write the text representation of the given values followed by a
     * newline, with indentation as appropriate. This will force the next
     * write call to indent before anything else is written.
     *
     * @param format Format string.
     * @param args   Optional arguments to the format string.
     */
    public void writeLine(String format, Object... args) {
        if (format != null) {
            write(format, args);
        }
        writer.write(System.lineSeparator());

        // Track that we just wrote a line so the next write operation will
        // indent first
        isNewline = true;
    }

    /**
     * Write a newline (which will force the next write operation to indent
     * before anything else is written).
     */
    public void writeLine() {
        writeLine(null);
    }


    public void writeWrapped(String text) {
        writeWrapped(text, "/*", 80, true);
    }

    /**
     * Write one or more lines of text with word wrapping.
     *
     * @param text      The text to wrap.
     * @param prefix    A prefix to use for each line.
     * @param width     The maximum width available.
     * @param escapeXml Whether to escape any XML in the text.
     */
    public void writeWrapped(String text, String prefix, int width, boolean escapeXml) {
        if (escapeXml) {
            text = escapeXml(text);
        }

        int available = width - indent * indentText.length() - prefix.length();
        for (String line : wordWrap(text, available)) {
            write(prefix);
            writeLine(line);
        }
    }

    /**
     * Increase the indent level after writing the text representation of
     * the given values to the current line. This would be used like:
     * myIndentWriter.pushScope("{");
     * // Write indented lines here
     * myIndentWriter.popScope("}");
     *
     * @param format Format string.
     * @param args   Optional arguments to the format string.
     */
    public void pushScope(String format, Object... args) {
        writeLine(format, args);
        pushScope();
    }

    /**
     * Decrease the indent level after writing the text representation of
     * the given values to the current line. This would be used like:
     * myIndentWriter.pushScope("{");
     * // Write indented lines here
     * myIndentWriter.popScope("}");
     *
     * @param format Format string.
     * @param args   Optional arguments to the format string.
     */
    public void popScope(String format, Object... args) {
        popScope();

        // Force the format string to be written on a new line, but don't
        // add an extra one if we just wrote a newline.
        if (!isNewline) {
            writeLine();
        }

        writeLine(format, args);
    }

    /**
     * Create a writer scope that will indent until the scope is disposed.
     * This is used like:
     * try (IndentWriter.WriterScope scope = myIndentWriter.scope()) {
     * // Write indented lines here
     * }
     * // Back to normal here
     *
     * @return A new WriterScope.
     */
    public WriterScope scope() {
        return new WriterScope(this);
    }

    /**
     * Create a writer scope that will indent until the scope is disposed
     * and starts/ends the scope with the given text. This is used like:
     * try (IndentWriter.WriterScope scope = myIndentWriter.scope("{", "}")) {
     * // Write indented lines here
     * }
     * // Back to normal here
     *
     * @param start Text starting the scope.
     * @param end   Text ending the scope.
     * @return A new WriterScope.
     */
    public WriterScope scope(String start, String end) {
        return new WriterScope(this, start, end);
    }

    public void indent() {
        indent++;
    }

    public void unindent() {
        if (indent > 0) {
            indent--;
        }
    }

    /**
     * The WriterScope class allows us to create an indentation block via a
     * try-with-resources statement. It will typically be used via something like
     * try (IndentWriter.WriterScope scope = myIndentWriter.scope("{", "}")) {
     * // Indented writing here
     * }
     * // No longer indented from here on...
     */
    public static class WriterScope implements AutoCloseable {
        /**
         * The IndentWriter that contains this scope.
         */
        private IndentWriter writer;

        /**
         * An optional string to write upon closing the scope.
         */
        private final String scopeEnd;

        /**
         * Initializes a new instance of the WriterScope class.
         *
         * @param writer The IndentWriter containing the scope.
         */
        public WriterScope(IndentWriter writer) {
            this.writer = writer;
            this.writer.pushScope();
            this.scopeEnd = null;
        }

        /**
         * Initializes a new instance of the WriterScope class.
         *
         * @param writer     The IndentWriter containing the scope.
         * @param scopeStart Text starting the scope.
         * @param scopeEnd   Text ending the scope.
         */
        public WriterScope(IndentWriter writer, String scopeStart, String scopeEnd) {
            this.writer = writer;
            this.writer.pushScope(scopeStart);
            this.scopeEnd = scopeEnd;
        }

        /**
         * Close the scope.
         */
        @Override
        public void close() {
            if (writer != null) {
                // Close the scope with the desired text if given
                if (scopeEnd != null) {
                    writer.popScope(scopeEnd);
                } else {
                    writer.popScope();
                }

                // Prevent multiple disposals
                writer = null;
            }
        }
    }

    // Helper methods for word wrapping and XML escaping
    private String escapeXml(String text) {
        // Implement XML escaping logic here
        return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private Iterable<String> wordWrap(String text, int width) {
        // Implement word wrapping logic here
        return Arrays.asList(text.split("(?<=\\G.{" + width + "})"));
    }

    public static class Fenceposter {
        private boolean first = true;

        public boolean requiresSeparator() {
            if (first) {
                first = false;
                return false;
            }
            return true;
        }
    }
}
