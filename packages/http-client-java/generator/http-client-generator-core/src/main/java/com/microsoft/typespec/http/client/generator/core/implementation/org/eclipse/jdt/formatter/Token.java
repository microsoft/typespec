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
 *     Till Brychcy - Java Code Formatter breaks code if single line comments contain unicode escape - https://bugs.eclipse.org/471090
 *     IBM Corporation - Markdown support
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.formatter;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.*;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken;
import java.util.List;

/**
 * Stores a token's type, position and all its properties like surrounding whitespace, wrapping behavior and so on.
 */
public class Token {

    public enum WrapMode {
        /**
         * Wrap mode for the "Do not wrap" policy. Tokens still should be indented as if wrapped when a preceding line
         * break cannot be removed due to a line comment or formatting region restriction.
         */
        DISABLED,
        /** Wrap mode for the "Wrap where necessary" policies. */
        WHERE_NECESSARY,
        /** Wrap mode for the "Wrap all elements" policies. */
        TOP_PRIORITY,
        /** Wrap mode for tokens that must be wrapped due to "Force wrap" setting. */
        FORCE,
        /**
         * Wrap mode used for lines in anonymous class and lambda body. Means that tokens that are already in new line
         * before wrapping, but their indentation should be adjusted in similar way to wrapping.
         */
        BLOCK_INDENT
    }

    public record WrapPolicy(WrapMode wrapMode, int wrapParentIndex, int groupEndIndex, int extraIndent,
        int structureDepth, float penaltyMultiplier, boolean isFirstInGroup, boolean indentOnColumn) {

        /** Policy used to mark tokens that should never be wrapped */
        public final static WrapPolicy DISABLE_WRAP = new WrapPolicy(WrapMode.DISABLED, 0, 0);

        /**
         * Policy used for internal structure of multiline comments to mark tokens that can be wrapped only in lines
         * that have no other tokens to wrap.
         */
        public final static WrapPolicy SUBSTITUTE_ONLY = new WrapPolicy(WrapMode.DISABLED, 0, 0);

        public WrapPolicy {
            assert wrapMode != null && (wrapParentIndex < groupEndIndex || groupEndIndex == -1);
        }

        public WrapPolicy(WrapMode wrapMode, int wrapParentIndex, int extraIndent) {
            this(wrapMode, wrapParentIndex, -1, extraIndent, 0, 1, false, false);
        }
    }

    /** Position in source of the first character. */
    public final int originalStart;
    /** Position in source of the last character (this position is included in the token). */
    public final int originalEnd;
    /** Type of this token. See {@link TerminalToken} for constants definition. */
    public final int tokenType;
    private boolean spaceBefore, spaceAfter;
    private int lineBreaksBefore, lineBreaksAfter;
    private boolean preserveLineBreaksBefore = true, preserveLineBreaksAfter = true;
    private boolean wrapped;
    private int indent;

    private int align;
    private boolean toEscape;

    private boolean nextLineOnWrap;
    private WrapPolicy wrapPolicy;

    private Token nlsTagToken;

    private List<Token> internalStructure;

    public Token(int sourceStart, int sourceEnd, int tokenType) {
        assert sourceStart <= sourceEnd;
        this.originalStart = sourceStart;
        this.originalEnd = sourceEnd;
        this.tokenType = tokenType;
    }

    public Token(Token tokenToCopy) {
        this(tokenToCopy, tokenToCopy.originalStart, tokenToCopy.originalEnd, tokenToCopy.tokenType);
    }

    public Token(Token tokenToCopy, int newOriginalStart, int newOriginalEnd, int newTokenType) {
        this.originalStart = newOriginalStart;
        this.originalEnd = newOriginalEnd;
        this.tokenType = newTokenType;
        this.spaceBefore = tokenToCopy.spaceBefore;
        this.spaceAfter = tokenToCopy.spaceAfter;
        this.lineBreaksBefore = tokenToCopy.lineBreaksBefore;
        this.lineBreaksAfter = tokenToCopy.lineBreaksAfter;
        this.preserveLineBreaksBefore = tokenToCopy.preserveLineBreaksBefore;
        this.preserveLineBreaksAfter = tokenToCopy.preserveLineBreaksAfter;
        this.indent = tokenToCopy.indent;
        this.nextLineOnWrap = tokenToCopy.nextLineOnWrap;
        this.wrapPolicy = tokenToCopy.wrapPolicy;
        this.nlsTagToken = tokenToCopy.nlsTagToken;
        this.internalStructure = tokenToCopy.internalStructure;
    }

    public static Token fromCurrent(Scanner scanner, int currentToken) {
        int start = scanner.getCurrentTokenStartPosition();
        int end = scanner.getCurrentTokenEndPosition();
        if (currentToken == TerminalToken.TokenNameCOMMENT_LINE) {
            // don't include line separator, but set break-after
            while (end > start) {
                char c = scanner.source[end];
                if (c != '\r' && c != '\n')
                    break;
                end--;
            }
            Token token = new Token(start, end, currentToken);
            token.breakAfter();
            return token;
        } else {
            return new Token(start, end, currentToken);
        }
    }

    /** Adds space before this token */
    public void spaceBefore() {
        this.spaceBefore = true;
    }

    /** Removes space before this token */
    public void clearSpaceBefore() {
        this.spaceBefore = false;
    }

    public boolean isSpaceBefore() {
        return this.spaceBefore;
    }

    /** Adds space after this token */
    public void spaceAfter() {
        this.spaceAfter = true;
    }

    /** Removes space after this token */
    public void clearSpaceAfter() {
        this.spaceAfter = false;
    }

    public boolean isSpaceAfter() {
        return this.spaceAfter;
    }

    public void breakBefore() {
        putLineBreaksBefore(1);
    }

    public void putLineBreaksBefore(int lineBreaks) {
        this.lineBreaksBefore = Math.max(this.lineBreaksBefore, lineBreaks);
    }

    public int getLineBreaksBefore() {
        return this.wrapped ? 1 : this.lineBreaksBefore;
    }

    /** Can be used to temporarily force preceding line break without losing the original number of line breaks. */
    public void setWrapped(boolean wrapped) {
        this.wrapped = wrapped;
    }

    public void clearLineBreaksBefore() {
        this.lineBreaksBefore = 0;
    }

    public void breakAfter() {
        putLineBreaksAfter(1);
    }

    public void putLineBreaksAfter(int lineBreaks) {
        this.lineBreaksAfter = Math.max(this.lineBreaksAfter, lineBreaks);
    }

    public int getLineBreaksAfter() {
        return this.lineBreaksAfter;
    }

    public void clearLineBreaksAfter() {
        this.lineBreaksAfter = 0;
    }

    public void setPreserveLineBreaksBefore(boolean preserveLineBreaksBefore) {
        this.preserveLineBreaksBefore = preserveLineBreaksBefore;
    }

    public boolean isPreserveLineBreaksBefore() {
        return this.preserveLineBreaksBefore;
    }

    public void setPreserveLineBreaksAfter(boolean preserveLineBreaksAfter) {
        this.preserveLineBreaksAfter = preserveLineBreaksAfter;
    }

    public boolean isPreserveLineBreaksAfter() {
        return this.preserveLineBreaksAfter;
    }

    /** Increases this token's indentation by one position */
    public void indent() {
        this.indent++;
    }

    /** Decreses this token's indentation by one position */
    public void unindent() {
        this.indent--;
    }

    public void setIndent(int indent) {
        assert indent >= 0;
        this.indent = indent;
    }

    public int getIndent() {
        return this.indent;
    }

    public int getEmptyLineIndentAdjustment() {
        return 0;
    }

    public void setAlign(int align) {
        this.align = align;
    }

    public int getAlign() {
        return this.align;
    }

    public void setToEscape(boolean shouldEscape) {
        this.toEscape = shouldEscape;
    }

    public boolean isToEscape() {
        return this.toEscape;
    }

    public boolean isNextLineOnWrap() {
        return this.nextLineOnWrap;
    }

    public void setWrapPolicy(WrapPolicy wrapPolicy) {
        this.wrapPolicy = wrapPolicy;
    }

    public WrapPolicy getWrapPolicy() {
        return this.wrapPolicy;
    }

    public boolean isWrappable() {
        WrapPolicy wp = this.wrapPolicy;
        return wp != null && wp.wrapMode != WrapMode.DISABLED && wp.wrapMode != WrapMode.BLOCK_INDENT;
    }

    public void setNLSTag(Token nlsTagToken) {
        this.nlsTagToken = nlsTagToken;
    }

    public boolean hasNLSTag() {
        return this.nlsTagToken != null;
    }

    public Token getNLSTag() {
        return this.nlsTagToken;
    }

    public void setInternalStructure(List<Token> internalStructure) {
        this.internalStructure = internalStructure;
    }

    public List<Token> getInternalStructure() {
        return this.internalStructure;
    }

    public boolean isComment() {
        return switch (this.tokenType) {
            case TokenNameCOMMENT_BLOCK, TokenNameCOMMENT_JAVADOC, TokenNameCOMMENT_LINE -> true;
            default -> false;
        };
    }

    public String toString(String source) {
        return source.substring(this.originalStart, this.originalEnd + 1);
    }

    public int countChars() {
        return this.originalEnd - this.originalStart + 1;
    }

}
