// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2024, 2026 GK Software SE and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     Stephan Herrmann - Initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser;

/**
 * Companion class for AbstractCommentParser to decide significance of whitespace within a markdown comment, and to
 * detect code blocks (either by indentation or fenced with {@code ```}).
 */
public interface IMarkdownCommentHelper {

    void recordSlash(int nextIndex);

    void recordFenceChar(char previous, char next, boolean lineStarted);

    /**
     * When at the beginning of a comment line, record that a whitespace was seen.
     *
     * @return {@code true} if this whitespace is significant, i.e., beyond the common indent of all lines of this
     * commonmark comment.
     */
    boolean recordSignificantLeadingSpace();

    void recordText();

    boolean isInCode();

    /** Retrieve the start of the current text, possibly including significant leading whitespace. */
    int getTextStart(int textStart);

    /** Call me when we are past the first element of a line. */
    void resetLineStart();

    void resetAtLineEnd();

    static IMarkdownCommentHelper create(AbstractCommentParser parser) {
        boolean markdown = parser.source[parser.javadocStart + 1] == '/';
        if (markdown) {
            int lineStart = parser.javadocStart + 3;
            int commonIndent = parser.peekMarkdownCommonIndent(lineStart);
            return new MarkdownCommentHelper(lineStart, commonIndent);
        } else {
            return new NullMarkdownHelper();
        }
    }
}

class NullMarkdownHelper implements IMarkdownCommentHelper {
    public NullMarkdownHelper() {
    }

    @Override
    public void recordSlash(int nextIndex) {
        // nop
    }

    @Override
    public void recordFenceChar(char previous, char next, boolean lineStarted) {
        // nop
    }

    @Override
    public boolean recordSignificantLeadingSpace() {
        return false;
    }

    @Override
    public void recordText() {
        // nop
    }

    @Override
    public boolean isInCode() {
        return false;
    }

    @Override
    public int getTextStart(int textStart) {
        return textStart;
    }

    @Override
    public void resetLineStart() {
        // nop
    }

    @Override
    public void resetAtLineEnd() {
        // nop
    }
}

class MarkdownCommentHelper implements IMarkdownCommentHelper {

    int commonIndent;
    int slashCount = 0;
    int leadingSpaces = 0;
    int markdownLineStart = -1;
    boolean insideIndentedCodeBlock = false;
    boolean insideFencedCodeBlock = false;
    char fenceChar;
    int fenceCharCount;
    int fenceLength;
    boolean isBlankLine = true;
    boolean previousIsBlankLine = true;
    boolean inInlineCode = false;

    public MarkdownCommentHelper(int lineStart, int commonIndent) {
        this.markdownLineStart = lineStart;
        this.commonIndent = commonIndent;
    }

    @Override
    public void recordSlash(int nextIndex) {
        if (this.slashCount < 3) {
            if (++this.slashCount == 3) {
                this.markdownLineStart = nextIndex;
                this.leadingSpaces = 0;
            }
        }
    }

    @Override
    public void recordFenceChar(char previous, char next, boolean lineStarted) {
        if (this.insideIndentedCodeBlock) {
            return;
        }
        if (this.fenceCharCount == 0) {
            if (lineStarted) {
                if (next == '`')
                    this.inInlineCode ^= true;
                return;
            }
            this.fenceChar = next;
            this.fenceCharCount = 1;
            return;
        }
        if (next != this.fenceChar)
            return;
        if (previous != next) {
            if (this.insideFencedCodeBlock) {
                this.fenceCharCount = 1;
            }
            return;
        }
        int required = this.insideFencedCodeBlock ? this.fenceLength : 3;
        if (++this.fenceCharCount == required) {
            this.insideFencedCodeBlock ^= true;
        }
        if (this.insideFencedCodeBlock && this.fenceCharCount >= this.fenceLength)
            this.fenceLength = this.fenceCharCount;
    }

    @Override
    public boolean recordSignificantLeadingSpace() {
        if (this.markdownLineStart != -1) {
            if (++this.leadingSpaces > this.commonIndent) {
                if (!this.insideFencedCodeBlock
                    && this.previousIsBlankLine
                    && this.leadingSpaces - this.commonIndent >= 4)
                    this.insideIndentedCodeBlock = true;
                return true;
            }
        }
        return false;
    }

    @Override
    public void recordText() {
        this.isBlankLine = false;
        if (this.leadingSpaces - this.commonIndent < 4)
            this.insideIndentedCodeBlock = false;
    }

    @Override
    public boolean isInCode() {
        return this.insideIndentedCodeBlock || this.insideFencedCodeBlock || this.inInlineCode;
    }

    @Override
    public int getTextStart(int textStart) {
        if (this.markdownLineStart > -1) {
            return this.markdownLineStart + this.commonIndent;
        }
        return textStart;
    }

    @Override
    public void resetLineStart() {
        this.markdownLineStart = -1;
    }

    @Override
    public void resetAtLineEnd() {
        this.previousIsBlankLine = this.isBlankLine;
        this.isBlankLine = true;
        this.slashCount = 0;
        this.leadingSpaces = 0;
        this.markdownLineStart = -1;
        this.fenceCharCount = 0;
        this.inInlineCode = false;
        // do not reset `insideFence`
    }
}
