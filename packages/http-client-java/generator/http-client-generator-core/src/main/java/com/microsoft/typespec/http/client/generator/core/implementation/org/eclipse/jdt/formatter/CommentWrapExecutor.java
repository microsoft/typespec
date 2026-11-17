// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2014, 2025 Mateusz Matela and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     Mateusz Matela <mateusz.matela@gmail.com> - [formatter] Formatter does not format Java code correctly, especially when max line width is set - https://bugs.eclipse.org/303519
 *     Lars Vogel <Lars.Vogel@vogella.com> - Contributions for
 *     						Bug 473178
 *     IBM Corporation - Markdown support
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameCOMMENT_JAVADOC;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameCOMMENT_LINE;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameNotAToken;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameWHITESPACE;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter.Token.WrapMode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter.Token.WrapPolicy;
import java.util.ArrayList;
import java.util.List;

public class CommentWrapExecutor extends TokenTraverser {

    private final TokenManager tm;
    private final DefaultCodeFormatterOptions options;

    private final ArrayList<Token> nlsTags = new ArrayList<>();

    private int lineStartPosition;
    private int lineLimit;
    private boolean simulation;
    private boolean wrapDisabled;
    private boolean newLinesAtBoundries;

    private Token potentialWrapToken, potentialWrapTokenSubstitute;
    private int counterIfWrapped, counterIfWrappedSubstitute;
    private int lineCounter;

    public CommentWrapExecutor(TokenManager tokenManager, DefaultCodeFormatterOptions options) {
        this.tm = tokenManager;
        this.options = options;
    }

    /**
     * @param commentToken token to wrap
     * @param startPosition position in line of the beginning of the comment
     * @param simulate if {@code true}, the properties of internal tokens will not really change. This mode is useful
     * for checking how much space the comment takes.
     * @param noWrap if {@code true}, it means that wrapping is disabled for this comment (for example because there's a
     * NON-NLS tag after it). This method is still useful for checking comment length in that case.
     * @return position in line at the end of comment
     */
    public int wrapMultiLineComment(Token commentToken, int startPosition, boolean simulate, boolean noWrap) {
        this.lineCounter = 1;
        this.counter = startPosition;
        commentToken.setIndent(this.tm.toIndent(startPosition, true));
        this.lineStartPosition = commentToken.getIndent();
        this.lineLimit = getLineLimit(startPosition);
        this.simulation = simulate;
        this.wrapDisabled = noWrap;
        this.potentialWrapToken = this.potentialWrapTokenSubstitute = null;

        this.newLinesAtBoundries = commentToken.tokenType == TokenNameCOMMENT_JAVADOC
            ? this.options.comment_new_lines_at_javadoc_boundaries
            : this.options.comment_new_lines_at_block_boundaries;

        List<Token> structure = commentToken.getInternalStructure();
        if (structure == null || structure.isEmpty())
            return startPosition + this.tm.getLength(commentToken, startPosition);

        int position = tryToFitInOneLine(structure, startPosition, noWrap);
        if (position > 0)
            return position;

        traverse(structure, 0);
        cleanupIndent(structure);

        if (this.newLinesAtBoundries)
            return this.lineStartPosition + 1 + this.tm.getLength(structure.get(structure.size() - 1), 0);
        return this.counter;
    }

    public int getLinesCount() {
        return this.lineCounter;
    }

    private int tryToFitInOneLine(List<Token> structure, int startPosition, boolean noWrap) {
        int position = startPosition;
        boolean hasWrapPotential = false;
        boolean wasSpaceAfter = false;
        for (int i = 0; i < structure.size(); i++) {
            Token token = structure.get(i);
            if (token.getLineBreaksBefore() > 0 || token.getLineBreaksAfter() > 0) {
                assert !noWrap; // comment already wrapped
                return -1;
            }
            if (!wasSpaceAfter && token.isSpaceBefore())
                position++;
            position += this.tm.getLength(token, position);
            wasSpaceAfter = token.isSpaceAfter();
            if (wasSpaceAfter)
                position++;

            WrapPolicy policy = token.getWrapPolicy();
            if (i > 1 && (policy == null || policy == WrapPolicy.SUBSTITUTE_ONLY))
                hasWrapPotential = true;
        }
        if (position <= this.lineLimit || noWrap || !hasWrapPotential)
            return position;
        return -1;
    }

    private int getStartingPosition(Token token, boolean isNewLine) {
        int position = this.lineStartPosition + token.getAlign() + (isNewLine ? token.getIndent() : 0);
        if (token.tokenType != TokenNameNotAToken)
            position += 3;
        return position;
    }

    @Override
    protected boolean token(Token token, int index) {
        final int positionIfNewLine = getStartingPosition(token, true);

        int lineBreaksBefore = getLineBreaksBefore();
        if ((index == 1 || getNext() == null) && this.newLinesAtBoundries && lineBreaksBefore == 0) {
            if (!this.simulation)
                token.breakBefore();
            lineBreaksBefore = 1;
        }

        if (lineBreaksBefore > 0) {
            this.lineCounter += lineBreaksBefore;
            this.counter = positionIfNewLine;
            this.potentialWrapToken = this.potentialWrapTokenSubstitute = null;
            this.lineLimit = getLineLimit(this.lineStartPosition);
        }

        boolean canWrap = getNext() != null && lineBreaksBefore == 0 && index > 1 && positionIfNewLine < this.counter;
        if (canWrap) {
            if (token.getWrapPolicy() == null) {
                this.potentialWrapToken = token;
                this.counterIfWrapped = positionIfNewLine;
            } else if (token.getWrapPolicy() == WrapPolicy.SUBSTITUTE_ONLY) {
                this.potentialWrapTokenSubstitute = token;
                this.counterIfWrappedSubstitute = positionIfNewLine;
            }
        }

        if (index > 1 && getNext() != null && (token.getAlign() + token.getIndent()) > 0)
            this.counter = Math.max(this.counter, getStartingPosition(token, getLineBreaksBefore() > 0));
        this.counter += this.tm.getLength(token, this.counter);
        this.counterIfWrapped += this.tm.getLength(token, this.counterIfWrapped);
        this.counterIfWrappedSubstitute += this.tm.getLength(token, this.counterIfWrappedSubstitute);
        if (shouldWrap()) {
            if (this.potentialWrapToken == null) {
                assert this.potentialWrapTokenSubstitute != null;
                this.potentialWrapToken = this.potentialWrapTokenSubstitute;
                this.counterIfWrapped = this.counterIfWrappedSubstitute;
            }
            if (!this.simulation) {
                this.potentialWrapToken.breakBefore();
            }
            this.counter = this.counterIfWrapped;
            this.lineCounter++;
            this.potentialWrapToken = this.potentialWrapTokenSubstitute = null;
            this.lineLimit = getLineLimit(this.lineStartPosition);
        }

        if (isSpaceAfter()) {
            this.counter++;
            this.counterIfWrapped++;
        }

        return true;
    }

    private boolean shouldWrap() {
        if (this.wrapDisabled || this.counter <= this.lineLimit)
            return false;
        if (getLineBreaksAfter() == 0 && getNext() != null && getNext().getWrapPolicy() == WrapPolicy.DISABLE_WRAP) {
            // The next token cannot be wrapped, so there's no need to wrap now.
            // Let's wait and decide when there's more information available.
            return false;
        }
        if (this.potentialWrapToken != null
            && this.potentialWrapTokenSubstitute != null
            && this.counterIfWrapped > this.lineLimit
            && this.counterIfWrappedSubstitute < this.counterIfWrapped) {
            // there is a normal token to wrap, but the line would overflow anyway - better use substitute
            this.potentialWrapToken = null;
        }
        return this.potentialWrapToken != null || this.potentialWrapTokenSubstitute != null;
    }

    private void cleanupIndent(List<Token> structure) {
        if (this.simulation)
            return;
        new TokenTraverser() {
            @Override
            protected boolean token(Token token, int index) {
                if (token.tokenType == TokenNameCOMMENT_JAVADOC && token.getInternalStructure() == null) {
                    if (getLineBreaksBefore() > 0)
                        token.setAlign(token.getAlign() + token.getIndent());
                    token.setIndent(0);
                }
                return true;
            }
        }.traverse(structure, 0);
    }

    public void wrapLineComment(Token commentToken, int startPosition) {
        List<Token> structure = commentToken.getInternalStructure();
        if (structure == null || structure.isEmpty())
            return;
        int commentIndex = this.tm.indexOf(commentToken);
        boolean isHeader = this.tm.isInHeader(commentIndex);
        boolean formattingEnabled
            = (isHeader ? this.options.comment_format_header : this.options.comment_format_line_comment);
        if (!formattingEnabled)
            return;

        int position = startPosition;
        startPosition = this.tm.toIndent(startPosition, true);
        int indent = startPosition;
        int limit = getLineLimit(position);

        for (Token token : structure) {
            if (token.hasNLSTag()) {
                this.nlsTags.add(token);
                position += token.countChars() + (token.isSpaceBefore() ? 1 : 0);
            }
        }

        Token whitespace = null;
        Token prefix = structure.get(0);
        if (prefix.tokenType == TokenNameWHITESPACE) {
            whitespace = new Token(prefix);
            whitespace.breakBefore();
            whitespace.setIndent(indent);
            whitespace.setWrapPolicy(new WrapPolicy(WrapMode.WHERE_NECESSARY, commentIndex, 0));
            prefix = structure.get(1);
            assert prefix.tokenType == TokenNameCOMMENT_LINE;
        }
        int prefixEnd = commentToken.originalStart + 1;
        if (!prefix.hasNLSTag())
            prefixEnd = Math.max(prefixEnd, prefix.originalEnd); // comments can start with more than 2 slashes
        prefix = new Token(commentToken.originalStart, prefixEnd, TokenNameCOMMENT_LINE);
        if (whitespace == null) {
            prefix.breakBefore();
            prefix.setWrapPolicy(new WrapPolicy(WrapMode.WHERE_NECESSARY, commentIndex, 0));
        }

        int lineStartIndex = whitespace == null ? 0 : 1;
        for (int i = 0; i < structure.size(); i++) {
            Token token = structure.get(i);
            token.setIndent(indent);
            if (token.hasNLSTag()) {
                this.nlsTags.remove(token);
                continue;
            }
            if (token.isSpaceBefore())
                position++;
            if (token.getLineBreaksBefore() > 0) {
                position = startPosition;
                limit = getLineLimit(position);
                lineStartIndex = whitespace == null ? i : i + 1;
                if (whitespace != null && token != whitespace) {
                    token.clearLineBreaksBefore();
                    structure.add(i, whitespace);
                    token = whitespace;
                }
            }
            position += this.tm.getLength(token, position);
            if (token.tokenType == TokenNameWHITESPACE)
                limit = getLineLimit(position);
            if (position > limit && i > lineStartIndex + 1) {
                structure.add(i, prefix);
                if (whitespace != null)
                    structure.add(i, whitespace);

                structure.removeAll(this.nlsTags);
                structure.addAll(i, this.nlsTags);
                i = i + this.nlsTags.size() - 1;
                this.nlsTags.clear();
            }
        }
        this.nlsTags.clear();
    }

    private int getLineLimit(int startPosition) {
        final int commentLength = this.options.comment_line_length;
        if (!this.options.comment_count_line_length_from_starting_position)
            return commentLength;
        final int pageWidth = this.options.page_width;
        int lineLength = startPosition + commentLength;
        if (lineLength > pageWidth && commentLength <= pageWidth)
            lineLength = pageWidth;
        return lineLength;
    }
}
