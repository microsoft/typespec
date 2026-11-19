// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *     Stephan Herrmann - Contribution for bug 186342 - [compiler][null] Using annotations for null checking
 *     Jesper S Moller  -. Contribution for bug 400830: [1.8][formatter] Code formatter for Java 8
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.*;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharDeduplication;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ProblemHandler;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.Util;

/**
 * IMPORTANT NOTE: Internal Scanner implementation. It uses TerminalToken which constant values reflect the latest
 * parser generation state.
 */
public class Scanner {

    // flag indicating if processed source contains occurrences of keyword assert
    public boolean containsAssertKeyword = false;

    public boolean recordLineSeparator = false;
    public char currentCharacter;
    public int startPosition;
    public int currentPosition;
    public int initialPosition, eofPosition;

    public boolean skipComments = false;
    public boolean tokenizeComments;
    public boolean tokenizeWhiteSpace;

    // source should be viewed as a window (aka a part)
    // of a entire very large stream
    public char[] source;

    // unicode support
    public char[] withoutUnicodeBuffer;
    public int withoutUnicodePtr; // when == 0 ==> no unicode in the current token
    public boolean unicodeAsBackSlash = false;

    public int[] commentStops = new int[30];
    public int[] commentStarts = new int[30];
    public int[] commentTagStarts = new int[30];
    public int commentPtr = -1; // no comment test with commentPtr value -1
    public int lastCommentLinePosition = -1;

    // diet parsing support - jump over some method body when requested
    public boolean diet = false;

    // support for the poor-line-debuggers ....
    // remember the position of the cr/lf
    public int[] lineEnds = new int[250];
    public int linePtr = -1;
    public boolean wasAcr = false;

    public boolean fakeInModule = false;

    /**
     * The current context of the scanner w.r.t restricted keywords
     */
    public enum ScanContext {
        EXPECTING_KEYWORD, EXPECTING_IDENTIFIER, AFTER_REQUIRES, INACTIVE
    }

    protected ScanContext scanContext = null;
    protected boolean insideModuleInfo = false;

    // generic support
    public boolean returnOnlyGreater = false;

    /**
     * Look back for the two most recent tokens. <ul> <li><code>lookBack[1]</code> is the previous token</li>
     * <li><code>lookBack[0]</code> is the token before <code>lookBack[1]</code></li> </ul> As this look back is
     * intended for resolving ambiguities and conflicts, it ignores whitespace and comments.
     *
     * @see #resetLookBack() Reset the look back and clear all stored tokens
     * @see #addTokenToLookBack(int) Add a token to the look back, removing the oldest entry
     */
    int[] lookBack = new int[2]; // fall back to spring forward.
    protected int nextToken = TerminalToken.TokenNameNotAToken; // allows for one token push back, only the
    private VanguardScanner vanguardScanner;
    private VanguardParser vanguardParser;
    ConflictedParser activeParser = null;
    private boolean consumingEllipsisAnnotations = false;

    private final CharDeduplication deduplication = CharDeduplication.getThreadLocalInstance();

    public Scanner(boolean tokenizeComments, boolean tokenizeWhiteSpace) {
        this.eofPosition = Integer.MAX_VALUE;
        this.tokenizeComments = tokenizeComments;
        this.tokenizeWhiteSpace = tokenizeWhiteSpace;
        this.resetLookBack();
        this.nextToken = TokenNameNotAToken;
        this.consumingEllipsisAnnotations = false;
    }

    public Scanner(boolean tokenizeComments) {
        this(tokenizeComments, false);
    }

    public final boolean atEnd() {
        // This code is not relevant if source is
        // Only a part of the real stream input

        return this.eofPosition <= this.currentPosition;
    }

    public char[] getCurrentIdentifierSource() {
        // return the token REAL source (aka unicodes are precomputed)
        if (this.withoutUnicodePtr != 0) {
//		//0 is used as a fast test flag so the real first char is in position 1
            return getIdentifierIgnoringIgnorable(this.withoutUnicodeBuffer, 1, this.withoutUnicodePtr);
        }
        int length = this.currentPosition - this.startPosition;
        if (length == this.eofPosition)
            return this.source;
        return getIdentifierIgnoringIgnorable(this.source, this.startPosition,
            this.currentPosition - this.startPosition);
    }

    public char[] getIdentifierIgnoringIgnorable(char[] originalSource, int start, int length) {
        if (length <= 0)
            return CharOperation.NO_CHAR;

        int ignorableCount = 0;
        int end = start + length;
        for (int i = start; i < end; i++) {
            if (Character.isIdentifierIgnorable(originalSource[i])) {
                ignorableCount++;
            }
        }

        // If nothing to remove, return a shared copy of the original
        if (ignorableCount == 0) {
            return this.deduplication.sharedCopyOfRange(originalSource, start, end);
        }

        int newLength = length - ignorableCount;
        if (newLength <= 0)
            return CharOperation.NO_CHAR;

        char[] compacted = new char[newLength];
        int newEnd = 0;
        for (int i = start; i < end; i++) {
            char c = originalSource[i];
            if (!Character.isIdentifierIgnorable(c)) {
                compacted[newEnd++] = c;
            }
        }
        // Return a deduplicated/shared copy of the compacted result
        return this.deduplication.sharedCopyOfRange(compacted, 0, newEnd);
    }

    public int getCurrentTokenEndPosition() {
        return this.currentPosition - 1;
    }

    public char[] getCurrentTokenSource() {
        // Return the token REAL source (aka unicodes are precomputed)

        char[] result;
        if (this.withoutUnicodePtr != 0)
            // 0 is used as a fast test flag so the real first char is in position 1
            System.arraycopy(this.withoutUnicodeBuffer, 1, result = new char[this.withoutUnicodePtr], 0,
                this.withoutUnicodePtr);
        else {
            int length;
            System.arraycopy(this.source, this.startPosition,
                result = new char[length = this.currentPosition - this.startPosition], 0, length);
        }
        return result;
    }

    public char[] getCurrentTokenSourceString() {
        // return the token REAL source (aka unicodes are precomputed).
        // REMOVE the two " that are at the beginning and the end.

        char[] result;
        if (this.withoutUnicodePtr != 0)
            // 0 is used as a fast test flag so the real first char is in position 1
            System.arraycopy(this.withoutUnicodeBuffer, 2,
                // 2 is 1 (real start) + 1 (to jump over the ")
                result = new char[this.withoutUnicodePtr - 2], 0, this.withoutUnicodePtr - 2);
        else {
            int length;
            System.arraycopy(this.source, this.startPosition + 1,
                result = new char[length = this.currentPosition - this.startPosition - 2], 0, length);
        }
        return result;
    }

    public int getCurrentTokenStartPosition() {
        return this.startPosition;
    }

    /*
     * Search the source position corresponding to the end of a given line number
     *
     * Line numbers are 1-based, and relative to the scanner initialPosition. Character positions are 0-based.
     *
     * In case the given line number is inconsistent, answers -1.
     */
    public final int getLineEnd(int lineNumber) {
        if (this.lineEnds == null || this.linePtr == -1)
            return -1;
        if (lineNumber > this.lineEnds.length + 1)
            return -1;
        if (lineNumber <= 0)
            return -1;
        if (lineNumber == this.lineEnds.length + 1)
            return this.eofPosition;
        return this.lineEnds[lineNumber - 1]; // next line start one character behind the lineEnd of the previous line
    }

    public final int[] getLineEnds() {
        // return a bounded copy of this.lineEnds
        if (this.linePtr == -1) {
            return Util.EMPTY_INT_ARRAY;
        }
        int[] copy;
        System.arraycopy(this.lineEnds, 0, copy = new int[this.linePtr + 1], 0, this.linePtr + 1);
        return copy;
    }

    public final int getNextChar() {
        try {
            if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                && (this.source[this.currentPosition] == 'u')) {
                getNextUnicodeChar();
            } else {
                this.unicodeAsBackSlash = false;
                if (this.withoutUnicodePtr != 0) {
                    unicodeStore();
                }
            }
            return this.currentCharacter;
        } catch (IndexOutOfBoundsException | InvalidInputException e) {
            return -1;
        }
    }

    public final int getNextCharWithBoundChecks() {
        if (this.currentPosition >= this.eofPosition) {
            return -1;
        }
        this.currentCharacter = this.source[this.currentPosition++];
        if (this.currentPosition >= this.eofPosition) {
            this.unicodeAsBackSlash = false;
            if (this.withoutUnicodePtr != 0) {
                unicodeStore();
            }
            return this.currentCharacter;
        }
        if (this.currentCharacter == '\\' && this.source[this.currentPosition] == 'u') {
            try {
                getNextUnicodeChar();
            } catch (InvalidInputException e) {
                return -1;
            }
        } else {
            this.unicodeAsBackSlash = false;
            if (this.withoutUnicodePtr != 0) {
                unicodeStore();
            }
        }
        return this.currentCharacter;
    }

    public final boolean getNextChar(char testedChar) {
        // BOOLEAN
        // handle the case of unicode.
        // when a unicode appears then we must use a buffer that holds char internal values
        // At the end of this method currentCharacter holds the new visited char
        // and currentPosition points right next after it
        // Both previous lines are true if the currentCharacter is == to the testedChar
        // On false, no side effect has occured.

        // ALL getNextChar.... ARE OPTIMIZED COPIES

        if (this.currentPosition >= this.eofPosition) { // handle the obvious case upfront
            this.unicodeAsBackSlash = false;
            return false;
        }

        int temp = this.currentPosition;
        try {
            if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                && (this.source[this.currentPosition] == 'u')) {
                getNextUnicodeChar();
                if (this.currentCharacter != testedChar) {
                    this.currentPosition = temp;
                    this.withoutUnicodePtr--;
                    return false;
                }
            } // -------------end unicode traitement--------------
            else {
                if (this.currentCharacter != testedChar) {
                    this.currentPosition = temp;
                    return false;
                }
                this.unicodeAsBackSlash = false;
                if (this.withoutUnicodePtr != 0)
                    unicodeStore();
            }
            return true;
        } catch (IndexOutOfBoundsException | InvalidInputException e) {
            this.unicodeAsBackSlash = false;
            this.currentPosition = temp;
            return false;
        }
    }

    public final int getNextChar(char testedChar1, char testedChar2) {
        // INT 0 : testChar1 \\\\///\\\\ 1 : testedChar2 \\\\///\\\\ -1 : others
        // test can be done with (x==0) for the first and (x>0) for the second
        // handle the case of unicode.
        // when a unicode appears then we must use a buffer that holds char internal values
        // At the end of this method currentCharacter holds the new visited char
        // and currentPosition points right next after it
        // Both previous lines are true if the currentCharacter is == to the testedChar1/2
        // On false, no side effect has occured.

        // ALL getNextChar.... ARE OPTIMIZED COPIES
        if (this.currentPosition >= this.eofPosition) // handle the obvious case upfront
            return -1;

        int temp = this.currentPosition;
        try {
            int result;
            if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                && (this.source[this.currentPosition] == 'u')) {
                getNextUnicodeChar();
                if (this.currentCharacter == testedChar1) {
                    result = 0;
                } else if (this.currentCharacter == testedChar2) {
                    result = 1;
                } else {
                    this.currentPosition = temp;
                    this.withoutUnicodePtr--;
                    result = -1;
                }
            } else {
                if (this.currentCharacter == testedChar1) {
                    result = 0;
                } else if (this.currentCharacter == testedChar2) {
                    result = 1;
                } else {
                    this.currentPosition = temp;
                    return -1;
                }

                if (this.withoutUnicodePtr != 0)
                    unicodeStore();
            }
            return result;
        } catch (IndexOutOfBoundsException | InvalidInputException e) {
            this.currentPosition = temp;
            return -1;
        }
    }

    /*
     * This method consumes digits as well as underscores if underscores are located between digits
     *
     * @throws InvalidInputException if underscores are not located between digits or if underscores are used in source
     * < 1.7
     */
    private void consumeDigits() throws InvalidInputException {

        consumeDigits(10, false);
    }

    /*
     * This method consumes digits as well as underscores if underscores are located between digits
     *
     * @throws InvalidInputException if underscores are not located between digits
     */
    private void consumeDigits(int radix, boolean expectingDigitFirst) throws InvalidInputException {

        switch (consumeDigits0(radix, 1, 2, expectingDigitFirst)) {
            case 1:
                break;

            case 2:
                throw invalidUnderscore();
        }
    }

    private int consumeDigits0(int radix, int usingUnderscore, int invalidPosition, boolean expectingDigitFirst) {
        int kind = 0;
        if (getNextChar('_')) {
            if (expectingDigitFirst) {
                return invalidPosition;
            }
            kind = usingUnderscore;
            while (getNextChar('_')) {
                /* empty */}
        }
        if (getNextCharAsDigit(radix)) {
            // continue to read digits or underscore
            while (getNextCharAsDigit(radix)) {
                /* empty */}
            int kind2 = consumeDigits0(radix, usingUnderscore, invalidPosition, false);
            if (kind2 == 0) {
                return kind;
            }
            return kind2;
        }
        if (kind == usingUnderscore)
            return invalidPosition;
        return kind;
    }

    public final boolean getNextCharAsDigit() {
        // BOOLEAN
        // handle the case of unicode.
        // when a unicode appears then we must use a buffer that holds char internal values
        // At the end of this method currentCharacter holds the new visited char
        // and currentPosition points right next after it
        // Both previous lines are true if the currentCharacter is a digit
        // On false, no side effect has occured.

        // ALL getNextChar.... ARE OPTIMIZED COPIES
        if (this.currentPosition >= this.eofPosition) // handle the obvious case upfront
            return false;

        int temp = this.currentPosition;
        try {
            if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                && (this.source[this.currentPosition] == 'u')) {
                getNextUnicodeChar();
                if (!ScannerHelper.isDigit(this.currentCharacter)) {
                    this.currentPosition = temp;
                    this.withoutUnicodePtr--;
                    return false;
                }
            } else {
                if (!ScannerHelper.isDigit(this.currentCharacter)) {
                    this.currentPosition = temp;
                    return false;
                }
                if (this.withoutUnicodePtr != 0)
                    unicodeStore();
            }
            return true;
        } catch (IndexOutOfBoundsException | InvalidInputException e) {
            this.currentPosition = temp;
            return false;
        }
    }

    public final boolean getNextCharAsDigit(int radix) {
        // BOOLEAN
        // handle the case of unicode.
        // when a unicode appears then we must use a buffer that holds char internal values
        // At the end of this method currentCharacter holds the new visited char
        // and currentPosition points right next after it
        // Both previous lines are true if the currentCharacter is a digit base on radix
        // On false, no side effect has occured.

        // ALL getNextChar.... ARE OPTIMIZED COPIES
        if (this.currentPosition >= this.eofPosition) // handle the obvious case upfront
            return false;

        int temp = this.currentPosition;
        try {
            if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                && (this.source[this.currentPosition] == 'u')) {
                getNextUnicodeChar();
                if (ScannerHelper.digit(this.currentCharacter, radix) == -1) {
                    this.currentPosition = temp;
                    this.withoutUnicodePtr--;
                    return false;
                }
            } else {
                if (ScannerHelper.digit(this.currentCharacter, radix) == -1) {
                    this.currentPosition = temp;
                    return false;
                }
                if (this.withoutUnicodePtr != 0)
                    unicodeStore();
            }
            return true;
        } catch (IndexOutOfBoundsException | InvalidInputException e) {
            this.currentPosition = temp;
            return false;
        }
    }

    public boolean getNextCharAsJavaIdentifierPartWithBoundCheck() {
        // BOOLEAN
        // handle the case of unicode.
        // when a unicode appears then we must use a buffer that holds char internal values
        // At the end of this method currentCharacter holds the new visited char
        // and currentPosition points right next after it
        // Both previous lines are true if the currentCharacter is a JavaIdentifierPart
        // On false, no side effect has occured.

        // ALL getNextChar.... ARE OPTIMIZED COPIES
        int pos = this.currentPosition;
        if (pos >= this.eofPosition) // handle the obvious case upfront
            return false;

        int temp2 = this.withoutUnicodePtr;
        try {
            boolean unicode = false;
            this.currentCharacter = this.source[this.currentPosition++];
            if (this.currentPosition < this.eofPosition) {
                if (this.currentCharacter == '\\' && this.source[this.currentPosition] == 'u') {
                    getNextUnicodeChar();
                    unicode = true;
                }
            }
            char c = this.currentCharacter;
            boolean isJavaIdentifierPart;
            if (c >= 55296 && c <= 56319) {
                // Unicode 4 detection
                char low = (char) getNextCharWithBoundChecks();
                if (low < 56320 || low > 57343) {
                    // illegal low surrogate
                    this.currentPosition = pos;
                    this.withoutUnicodePtr = temp2;
                    return false;
                }
                isJavaIdentifierPart = ScannerHelper.isJavaIdentifierPart(c, low);
            } else if (c >= 56320 && c <= 57343) {
                this.currentPosition = pos;
                this.withoutUnicodePtr = temp2;
                return false;
            } else {
                isJavaIdentifierPart = ScannerHelper.isJavaIdentifierPart(c);
            }
            if (unicode) {
                if (!isJavaIdentifierPart) {
                    this.currentPosition = pos;
                    this.withoutUnicodePtr = temp2;
                    return false;
                }
            } else {
                if (!isJavaIdentifierPart) {
                    this.currentPosition = pos;
                    return false;
                }

                if (this.withoutUnicodePtr != 0)
                    unicodeStore();
            }
            return true;
        } catch (InvalidInputException e) {
            this.currentPosition = pos;
            this.withoutUnicodePtr = temp2;
            return false;
        }
    }

    public boolean getNextCharAsJavaIdentifierPart() {
        // BOOLEAN
        // handle the case of unicode.
        // when a unicode appears then we must use a buffer that holds char internal values
        // At the end of this method currentCharacter holds the new visited char
        // and currentPosition points right next after it
        // Both previous lines are true if the currentCharacter is a JavaIdentifierPart
        // On false, no side effect has occured.

        // ALL getNextChar.... ARE OPTIMIZED COPIES
        int pos;
        if ((pos = this.currentPosition) >= this.eofPosition) // handle the obvious case upfront
            return false;

        int temp2 = this.withoutUnicodePtr;
        try {
            boolean unicode = false;
            if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                && (this.source[this.currentPosition] == 'u')) {
                getNextUnicodeChar();
                unicode = true;
            }
            char c = this.currentCharacter;
            boolean isJavaIdentifierPart;
            if (c >= 55296 && c <= 56319) {
                // Unicode 4 detection
                char low = (char) getNextChar();
                if (low < 56320 || low > 57343) {
                    // illegal low surrogate
                    this.currentPosition = pos;
                    this.withoutUnicodePtr = temp2;
                    return false;
                }
                isJavaIdentifierPart = ScannerHelper.isJavaIdentifierPart(c, low);
            } else if (c >= 56320 && c <= 57343) {
                this.currentPosition = pos;
                this.withoutUnicodePtr = temp2;
                return false;
            } else {
                isJavaIdentifierPart = ScannerHelper.isJavaIdentifierPart(c);
            }
            if (unicode) {
                if (!isJavaIdentifierPart) {
                    this.currentPosition = pos;
                    this.withoutUnicodePtr = temp2;
                    return false;
                }
            } else {
                if (!isJavaIdentifierPart) {
                    this.currentPosition = pos;
                    return false;
                }

                if (this.withoutUnicodePtr != 0)
                    unicodeStore();
            }
            return true;
        } catch (IndexOutOfBoundsException | InvalidInputException e) {
            this.currentPosition = pos;
            this.withoutUnicodePtr = temp2;
            return false;
        }
    }

    /*
     * This is used to optimize the case where the scanner is used to scan a single
     * identifier. In this case, the AIOOBE is slower to handle than a bound check
     */
    public int scanIdentifier() throws InvalidInputException {
        int whiteStart;
        while (true) { // loop for jumping over comments
            this.withoutUnicodePtr = 0;
            // start with a new token (even comment written with unicode )
            // ---------Consume white space and handles startPosition---------
            whiteStart = this.currentPosition;
            boolean isWhiteSpace, hasWhiteSpaces = false;
            int offset;
            int unicodePtr;
            boolean checkIfUnicode;
            do {
                unicodePtr = this.withoutUnicodePtr;
                offset = this.currentPosition;
                this.startPosition = this.currentPosition;
                if (this.currentPosition < this.eofPosition) {
                    this.currentCharacter = this.source[this.currentPosition++];
                    checkIfUnicode = this.currentPosition < this.eofPosition
                        && this.currentCharacter == '\\'
                        && this.source[this.currentPosition] == 'u';
                } else if (this.tokenizeWhiteSpace && (whiteStart != this.currentPosition - 1)) {
                    // reposition scanner in case we are interested by spaces as tokens
                    this.currentPosition--;
                    this.startPosition = whiteStart;
                    return TokenNameWHITESPACE;
                } else {
                    return TokenNameEOF;
                }
                if (checkIfUnicode) {
                    isWhiteSpace = jumpOverUnicodeWhiteSpace();
                    offset = this.currentPosition - offset;
                } else {
                    offset = this.currentPosition - offset;
                    // inline version of:
                    isWhiteSpace = switch (this.currentCharacter) { /* \ u000a: LINE FEED */
                        /* \ u000c: FORM FEED */
                        /* \ u000d: CARRIAGE RETURN */
                        /* \ u0020: SPACE */
                        case 10, 12, 13, 32, 9 -> /* \ u0009: HORIZONTAL TABULATION */
                            true;
                        default -> false;
                    };
                }
                if (isWhiteSpace) {
                    hasWhiteSpaces = true;
                }
            } while (isWhiteSpace);
            if (hasWhiteSpaces) {
                if (this.tokenizeWhiteSpace) {
                    // reposition scanner in case we are interested by spaces as tokens
                    this.currentPosition -= offset;
                    this.startPosition = whiteStart;
                    if (checkIfUnicode) {
                        this.withoutUnicodePtr = unicodePtr;
                    }
                    return TokenNameWHITESPACE;
                } else if (checkIfUnicode) {
                    this.withoutUnicodePtr = 0;
                    unicodeStore();
                } else {
                    this.withoutUnicodePtr = 0;
                }
            }
            char c = this.currentCharacter;
            if (c < 128) {
                if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 64) != 0) {
                    return scanIdentifierOrKeywordWithBoundCheck();
                }
                return TokenNameERROR;
            }
            boolean isJavaIdStart;
            if (c >= 55296 && c <= 56319) {
                // Unicode 4 detection
                char low = (char) getNextCharWithBoundChecks();
                if (low < 56320 || low > 57343) {
                    // illegal low surrogate
                    throw invalidLowSurrogate();
                }
                isJavaIdStart = ScannerHelper.isJavaIdentifierStart(c, low);
            } else if (c >= 56320 && c <= 57343) {
                throw invalidHighSurrogate();
            } else {
                // optimized case already checked
                isJavaIdStart = ScannerHelper.isJavaIdentifierStart(c);
            }
            if (isJavaIdStart)
                return scanIdentifierOrKeywordWithBoundCheck();
            return TokenNameERROR;
        }
    }

    public int getNextToken() throws InvalidInputException {
        int token;
        if (this.nextToken != TerminalToken.TokenNameNotAToken) {
            token = this.nextToken;
            this.nextToken = TokenNameNotAToken;
            return token; // presumed to be unambiguous.
        }
        if (this.scanContext == null) { // init lazily, since isInModuleDeclaration needs the parser to be known
            this.scanContext = isInModuleDeclaration() ? ScanContext.EXPECTING_KEYWORD : ScanContext.INACTIVE;
        }
        token = getNextToken0();
        if (areRestrictedModuleKeywordsActive()) {
            if (isRestrictedKeyword(token))
                token = disambiguatedRestrictedKeyword(token);
            updateScanContext(token);
        }
        if (this.activeParser == null) { // anybody interested in the grammatical structure of the program should have
                                         // registered.
            if (token != TokenNameWHITESPACE) {
                addTokenToLookBack(token);
            }
            return token;
        }
        if (token == TokenNameLPAREN || token == TokenNameLESS || token == TokenNameAT) {
            token = disambiguatedToken(token, this);
        } else if (token == TokenNameELLIPSIS) {
            this.consumingEllipsisAnnotations = false;
        }
        addTokenToLookBack(token);
        return token;
    }

    protected int findCommentType() {
        // Markdown documentation comments need Java 23, so /// starts a line comment.
        return getNextChar('/', '*');
    }

    protected int getNextToken0() throws InvalidInputException {
        this.wasAcr = false;
        if (this.diet) {
            jumpOverMethodBody();
            this.diet = false;
            return this.currentPosition > this.eofPosition ? TokenNameEOF : TokenNameRBRACE;
        }
        int whiteStart = 0;
        try {
            while (true) { // loop for jumping over comments
                this.withoutUnicodePtr = 0;
                // start with a new token (even comment written with unicode )

                // ---------Consume white space and handles startPosition---------
                whiteStart = this.currentPosition;
                boolean isWhiteSpace, hasWhiteSpaces = false;
                int offset;
                int unicodePtr;
                boolean checkIfUnicode = false;
                do {
                    unicodePtr = this.withoutUnicodePtr;
                    offset = this.currentPosition;
                    this.startPosition = this.currentPosition;
                    boolean repositionNeeded = false;
                    if (this.currentPosition < this.source.length) {
                        this.currentCharacter = this.source[this.currentPosition];
                        this.currentPosition++;
                        if (this.currentCharacter == '\\') {
                            if (this.currentPosition < this.source.length) {
                                checkIfUnicode = this.source[this.currentPosition] == 'u';
                            } else {
                                repositionNeeded = true;
                            }
                        } else {
                            checkIfUnicode = false;
                        }
                    } else {
                        this.currentPosition++;
                        repositionNeeded = true;
                    }
                    if (repositionNeeded) {
                        if (this.tokenizeWhiteSpace && (whiteStart != this.currentPosition - 1)) {
                            // reposition scanner in case we are interested by spaces as tokens
                            this.currentPosition--;
                            this.startPosition = whiteStart;
                            return TokenNameWHITESPACE;
                        }
                        if (this.currentPosition > this.eofPosition)
                            return TokenNameEOF;
                    }
                    if (this.currentPosition > this.eofPosition) {
                        if (this.tokenizeWhiteSpace && (whiteStart != this.currentPosition - 1)) {
                            this.currentPosition--;
                            // reposition scanner in case we are interested by spaces as tokens
                            this.startPosition = whiteStart;
                            return TokenNameWHITESPACE;
                        }
                        return TokenNameEOF;
                    }
                    if (checkIfUnicode) {
                        isWhiteSpace = jumpOverUnicodeWhiteSpace();
                        offset = this.currentPosition - offset;
                    } else {
                        offset = this.currentPosition - offset;
                        if ((this.currentCharacter == '\r') || (this.currentCharacter == '\n')) {
                            if (this.recordLineSeparator) {
                                pushLineSeparator();
                            }
                        }
                        // inline version of:
                        isWhiteSpace = switch (this.currentCharacter) { /* \ u000a: LINE FEED */
                            /* \ u000c: FORM FEED */
                            /* \ u000d: CARRIAGE RETURN */
                            /* \ u0020: SPACE */
                            case 10, 12, 13, 32, 9 -> /* \ u0009: HORIZONTAL TABULATION */
                                true;
                            default -> false;
                        };
                    }
                    if (isWhiteSpace) {
                        hasWhiteSpaces = true;
                    }
                } while (isWhiteSpace);
                if (hasWhiteSpaces) {
                    if (this.tokenizeWhiteSpace) {
                        // reposition scanner in case we are interested by spaces as tokens
                        this.currentPosition -= offset;
                        this.startPosition = whiteStart;
                        if (checkIfUnicode) {
                            this.withoutUnicodePtr = unicodePtr;
                        }
                        return TokenNameWHITESPACE;
                    } else if (checkIfUnicode) {
                        this.withoutUnicodePtr = 0;
                        unicodeStore();
                    } else {
                        this.withoutUnicodePtr = 0;
                    }
                }
                // ---------Identify the next token-------------
                switch (this.currentCharacter) {
                    case '@':
                        return TokenNameAT;

                    case '(':
                        return TokenNameLPAREN;

                    case ')':
                        return TokenNameRPAREN;

                    case '{':
                        return TokenNameLBRACE;

                    case '}':
                        return TokenNameRBRACE;

                    case '[':
                        return TokenNameLBRACKET;

                    case ']':
                        return TokenNameRBRACKET;

                    case ';':
                        return TokenNameSEMICOLON;

                    case ',':
                        return TokenNameCOMMA;

                    case '.':
                        if (getNextCharAsDigit()) {
                            return scanNumber(true);
                        }
                        int temp = this.currentPosition;
                        if (getNextChar('.')) {
                            if (getNextChar('.')) {
                                return TokenNameELLIPSIS;
                            } else {
                                this.currentPosition = temp;
                                return TokenNameDOT;
                            }
                        } else {
                            this.currentPosition = temp;
                            return TokenNameDOT;
                        }
                    case '+': {
                        int test;
                        if ((test = getNextChar('+', '=')) == 0)
                            return TokenNamePLUS_PLUS;
                        if (test > 0)
                            return TokenNamePLUS_EQUAL;
                        return TokenNamePLUS;
                    }

                    case '-': {
                        int test;
                        if ((test = getNextChar('-', '=')) == 0)
                            return TokenNameMINUS_MINUS;
                        if (test > 0)
                            return TokenNameMINUS_EQUAL;
                        if (getNextChar('>'))
                            return TokenNameARROW;
                        return TokenNameMINUS;
                    }

                    case '~':
                        return TokenNameTWIDDLE;

                    case '!':
                        if (getNextChar('='))
                            return TokenNameNOT_EQUAL;
                        return TokenNameNOT;

                    case '*':
                        if (getNextChar('='))
                            return TokenNameMULTIPLY_EQUAL;
                        return TokenNameMULTIPLY;

                    case '%':
                        if (getNextChar('='))
                            return TokenNameREMAINDER_EQUAL;
                        return TokenNameREMAINDER;

                    case '<': {
                        int test;
                        if ((test = getNextChar('=', '<')) == 0)
                            return TokenNameLESS_EQUAL;
                        if (test > 0) {
                            if (getNextChar('='))
                                return TokenNameLEFT_SHIFT_EQUAL;
                            return TokenNameLEFT_SHIFT;
                        }
                        return TokenNameLESS;
                    }

                    case '>': {
                        int test;
                        if (this.returnOnlyGreater) {
                            return TokenNameGREATER;
                        }
                        if ((test = getNextChar('=', '>')) == 0)
                            return TokenNameGREATER_EQUAL;
                        if (test > 0) {
                            if ((test = getNextChar('=', '>')) == 0)
                                return TokenNameRIGHT_SHIFT_EQUAL;
                            if (test > 0) {
                                if (getNextChar('='))
                                    return TokenNameUNSIGNED_RIGHT_SHIFT_EQUAL;
                                return TokenNameUNSIGNED_RIGHT_SHIFT;
                            }
                            return TokenNameRIGHT_SHIFT;
                        }
                        return TokenNameGREATER;
                    }

                    case '=':
                        if (getNextChar('='))
                            return TokenNameEQUAL_EQUAL;
                        return TokenNameEQUAL;

                    case '&': {
                        int test;
                        if ((test = getNextChar('&', '=')) == 0)
                            return TokenNameAND_AND;
                        if (test > 0)
                            return TokenNameAND_EQUAL;
                        return TokenNameAND;
                    }

                    case '|': {
                        int test;
                        if ((test = getNextChar('|', '=')) == 0)
                            return TokenNameOR_OR;
                        if (test > 0)
                            return TokenNameOR_EQUAL;
                        return TokenNameOR;
                    }

                    case '^':
                        if (getNextChar('='))
                            return TokenNameXOR_EQUAL;
                        return TokenNameXOR;

                    case '?':
                        return TokenNameQUESTION;

                    case ':':
                        if (getNextChar(':'))
                            return TokenNameCOLON_COLON;
                        return TokenNameCOLON;

                    case '\'':
                        return processSingleQuotes();

                    case '"':
                        return scanForStringLiteral();

                    case '/':
                        if (!this.skipComments) {
                            int test = findCommentType();
                            if (test == 0) { // line comment
                                this.lastCommentLinePosition = this.currentPosition;
                                try { // get the next char
                                    if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                        && (this.source[this.currentPosition] == 'u')) {
                                        getNextUnicodeChar();
                                    }

                                    // handle the \\u case manually into comment
                                    if (this.currentCharacter == '\\') {
                                        if (this.source[this.currentPosition] == '\\')
                                            this.currentPosition++;
                                    } // jump over the \\
                                    boolean isUnicode = false;
                                    while (this.currentCharacter != '\r' && this.currentCharacter != '\n') {
                                        if (this.currentPosition >= this.eofPosition) {
                                            this.lastCommentLinePosition = this.currentPosition;
                                            this.currentPosition++;
                                            // this avoids duplicating the code in the catch(IndexOutOfBoundsException
                                            // e)
                                            throw new IndexOutOfBoundsException();
                                        }
                                        this.lastCommentLinePosition = this.currentPosition;
                                        // get the next char
                                        isUnicode = false;
                                        if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                            && (this.source[this.currentPosition] == 'u')) {
                                            getNextUnicodeChar();
                                            isUnicode = true;
                                        }
                                        // handle the \\u case manually into comment
                                        if (this.currentCharacter == '\\') {
                                            if (this.source[this.currentPosition] == '\\')
                                                this.currentPosition++;
                                        } // jump over the \\
                                    }
                                    /*
                                     * We need to completely consume the line break
                                     */
                                    if (this.currentCharacter == '\r' && this.eofPosition > this.currentPosition) {
                                        if (this.source[this.currentPosition] == '\n') {
                                            this.currentPosition++;
                                            this.currentCharacter = '\n';
                                        } else if ((this.source[this.currentPosition] == '\\')
                                            && (this.source[this.currentPosition + 1] == 'u')) {
                                            getNextUnicodeChar();
                                            isUnicode = true;
                                        }
                                    }
                                    recordComment(TokenNameCOMMENT_LINE);
                                    if ((this.currentCharacter == '\r') || (this.currentCharacter == '\n')) {

                                        if (this.recordLineSeparator) {
                                            if (isUnicode) {
                                                pushUnicodeLineSeparator();
                                            } else {
                                                pushLineSeparator();
                                            }
                                        }
                                    }
                                    if (this.tokenizeComments) {
                                        return TokenNameCOMMENT_LINE;
                                    }
                                } catch (IndexOutOfBoundsException e) {
                                    this.currentPosition--;
                                    recordComment(TokenNameCOMMENT_LINE);

                                    if (this.tokenizeComments) {
                                        return TokenNameCOMMENT_LINE;
                                    } else {
                                        this.currentPosition++;
                                    }
                                }
                                break;
                            } else if (test == 1) { // traditional and javadoc comment
                                try { // get the next char
                                    boolean isJavadoc = false, star = false;
                                    boolean isUnicode;
                                    int previous;
                                    // consume next character
                                    this.unicodeAsBackSlash = false;
                                    if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                        && (this.source[this.currentPosition] == 'u')) {
                                        getNextUnicodeChar();
                                        isUnicode = true;
                                    } else {
                                        isUnicode = false;
                                        if (this.withoutUnicodePtr != 0) {
                                            unicodeStore();
                                        }
                                    }

                                    if (this.currentCharacter == '*') {
                                        isJavadoc = true;
                                        star = true;
                                    }
                                    if ((this.currentCharacter == '\r') || (this.currentCharacter == '\n')) {
                                        if (this.recordLineSeparator) {
                                            if (isUnicode) {
                                                pushUnicodeLineSeparator();
                                            } else {
                                                pushLineSeparator();
                                            }
                                        }
                                    }
                                    previous = this.currentPosition;
                                    if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                        && (this.source[this.currentPosition] == 'u')) {
                                        // -------------unicode traitement ------------
                                        getNextUnicodeChar();
                                        isUnicode = true;
                                    } else {
                                        isUnicode = false;
                                    }
                                    // handle the \\u case manually into comment
                                    if (this.currentCharacter == '\\') {
                                        if (this.source[this.currentPosition] == '\\')
                                            this.currentPosition++; // jump over the \\
                                    }
                                    // empty comment is not a javadoc /**/
                                    if (this.currentCharacter == '/') {
                                        isJavadoc = false;
                                    }
                                    // loop until end of comment */
                                    int firstTag = 0;
                                    while ((this.currentCharacter != '/') || (!star)) {
                                        if (this.currentPosition >= this.eofPosition) {
                                            throw unterminatedComment();
                                        }
                                        if ((this.currentCharacter == '\r') || (this.currentCharacter == '\n')) {
                                            if (this.recordLineSeparator) {
                                                if (isUnicode) {
                                                    pushUnicodeLineSeparator();
                                                } else {
                                                    pushLineSeparator();
                                                }
                                            }
                                        }
                                        switch (this.currentCharacter) {
                                            case '*':
                                                star = true;
                                                break;

                                            case '@':
                                                if ((firstTag == 0)) {
                                                    firstTag = previous;
                                                }
                                                //$FALL-THROUGH$ default case to set star to false
                                            default:
                                                star = false;
                                        }
                                        // get next char
                                        previous = this.currentPosition;
                                        if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                            && (this.source[this.currentPosition] == 'u')) {
                                            // -------------unicode treatement ------------
                                            getNextUnicodeChar();
                                            isUnicode = true;
                                        } else {
                                            isUnicode = false;
                                        }
                                        // handle the \\u case manually into comment
                                        if (this.currentCharacter == '\\') {
                                            if (this.source[this.currentPosition] == '\\')
                                                this.currentPosition++;
                                        } // jump over the \\
                                    }
                                    int token = isJavadoc ? TokenNameCOMMENT_JAVADOC : TokenNameCOMMENT_BLOCK;
                                    recordComment(token);
                                    this.commentTagStarts[this.commentPtr] = firstTag;
                                    if (this.tokenizeComments) {
                                        /*
                                         * if (isJavadoc) return TokenNameCOMMENT_JAVADOC; return
                                         * TokenNameCOMMENT_BLOCK;
                                         */
                                        return token;
                                    }
                                } catch (IndexOutOfBoundsException e) {
                                    this.currentPosition--;
                                    throw unterminatedComment();
                                }
                                break;
                            }
                        }
                        if (getNextChar('='))
                            return TokenNameDIVIDE_EQUAL;
                        return TokenNameDIVIDE;

                    case '\u001a':
                        if (atEnd())
                            return TokenNameEOF;
                        // the atEnd may not be <currentPosition == source.length> if source is only some part of a real
                        // (external) stream
                        throw invalidEof();

                    default:
                        char c = this.currentCharacter;
                        if (c < 128) {
                            if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 64) != 0) {
                                return scanIdentifierOrKeyword();
                            } else if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 4) != 0) {
                                return scanNumber(false);
                            } else {
                                return TokenNameERROR;
                            }
                        }
                        boolean isJavaIdStart;
                        if (c >= 55296 && c <= 56319) {
                            // Unicode 4 detection
                            char low = (char) getNextChar();
                            if (low < 56320 || low > 57343) {
                                // illegal low surrogate
                                throw invalidLowSurrogate();
                            }
                            isJavaIdStart = ScannerHelper.isJavaIdentifierStart(c, low);
                        } else if (c >= 56320 && c <= 57343) {
                            throw invalidHighSurrogate();
                        } else {
                            // optimized case already checked
                            isJavaIdStart = ScannerHelper.isJavaIdentifierStart(c);
                        }
                        if (isJavaIdStart)
                            return scanIdentifierOrKeyword();
                        if (ScannerHelper.isDigit(this.currentCharacter)) {
                            return scanNumber(false);
                        }
                        return TokenNameERROR;
                }
            }
        } // -----------------end switch while try--------------------
        catch (IndexOutOfBoundsException e) {
            if (this.tokenizeWhiteSpace && (whiteStart != this.currentPosition - 1)) {
                // reposition scanner in case we are interested by spaces as tokens
                this.currentPosition--;
                this.startPosition = whiteStart;
                return TokenNameWHITESPACE;
            }
        }
        return TokenNameEOF;
    }

    protected int processSingleQuotes() throws InvalidInputException {
        int test;
        if ((test = getNextChar('\n', '\r')) == 0) {
            throw invalidCharacter();
        }
        if (test > 0) {
            // relocate if finding another quote fairly close: thus unicode '/u000D' will be fully consumed
            for (int lookAhead = 0; lookAhead < 3; lookAhead++) {
                if (this.currentPosition + lookAhead == this.eofPosition)
                    break;
                if (this.source[this.currentPosition + lookAhead] == '\n')
                    break;
                if (this.source[this.currentPosition + lookAhead] == '\'') {
                    this.currentPosition += lookAhead + 1;
                    break;
                }
            }
            throw invalidCharacter();
        }
        if (getNextChar('\'')) {
            // relocate if finding another quote fairly close: thus unicode '/u000D' will be fully consumed
            for (int lookAhead = 0; lookAhead < 3; lookAhead++) {
                if (this.currentPosition + lookAhead == this.eofPosition)
                    break;
                if (this.source[this.currentPosition + lookAhead] == '\n')
                    break;
                if (this.source[this.currentPosition + lookAhead] == '\'') {
                    this.currentPosition += lookAhead + 1;
                    break;
                }
            }
            throw invalidCharacter();
        }
        if (getNextChar('\\')) {
            if (this.unicodeAsBackSlash) {
                // consume next character
                this.unicodeAsBackSlash = false;
                if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                    && (this.source[this.currentPosition] == 'u')) {
                    getNextUnicodeChar();
                } else {
                    if (this.withoutUnicodePtr != 0) {
                        unicodeStore();
                    }
                }
            } else {
                this.currentCharacter = this.source[this.currentPosition++];
            }
            scanEscapeCharacter();
        } else { // consume next character
            this.unicodeAsBackSlash = false;
            boolean checkIfUnicode;
            try {
                checkIfUnicode = ((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                    && (this.source[this.currentPosition] == 'u');
            } catch (IndexOutOfBoundsException e) {
                this.currentPosition--;
                throw invalidCharacter();
            }
            if (checkIfUnicode) {
                getNextUnicodeChar();
            } else {
                if (this.withoutUnicodePtr != 0) {
                    unicodeStore();
                }
            }
        }
        if (getNextChar('\''))
            return TokenNameCharacterLiteral;
        // relocate if finding another quote fairly close: thus unicode '/u000D' will be fully consumed
        for (int lookAhead = 0; lookAhead < 20; lookAhead++) {
            if (this.currentPosition + lookAhead == this.eofPosition)
                break;
            if (this.source[this.currentPosition + lookAhead] == '\n')
                break;
            if (this.source[this.currentPosition + lookAhead] == '\'') {
                this.currentPosition += lookAhead + 1;
                break;
            }
        }
        throw invalidCharacter();
    }

    protected int scanForStringLiteral() throws InvalidInputException {
        // A text block's opening delimiter scans as an empty string and an unterminated string, so it is an error.
        boolean isUnicode;
        try {
            // consume next character
            this.unicodeAsBackSlash = false;
            isUnicode = false;
            if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                && (this.source[this.currentPosition] == 'u')) {
                getNextUnicodeChar();
                isUnicode = true;
            } else {
                if (this.withoutUnicodePtr != 0) {
                    unicodeStore();
                }
            }

            while (this.currentCharacter != '"') {
                if (this.currentPosition >= this.eofPosition) {
                    throw unterminatedString();
                }
                /**** \r and \n are not valid in string literals ****/
                if ((this.currentCharacter == '\n') || (this.currentCharacter == '\r')) {
                    // relocate if finding another quote fairly close: thus unicode '/u000D' will be fully consumed
                    if (isUnicode) {
                        int start = this.currentPosition;
                        for (int lookAhead = 0; lookAhead < 50; lookAhead++) {
                            if (this.currentPosition >= this.eofPosition) {
                                this.currentPosition = start;
                                break;
                            }
                            if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                && (this.source[this.currentPosition] == 'u')) {
                                isUnicode = true;
                                getNextUnicodeChar();
                            } else {
                                isUnicode = false;
                            }
                            if (!isUnicode && this.currentCharacter == '\n') {
                                this.currentPosition--; // set current position on new line character
                                break;
                            }
                            if (this.currentCharacter == '\"') {
                                throw invalidCharInString();
                            }
                        }
                    } else {
                        this.currentPosition--; // set current position on new line character
                    }
                    throw invalidCharInString();
                }
                if (this.currentCharacter == '\\') {
                    if (this.unicodeAsBackSlash) {
                        this.withoutUnicodePtr--;
                        // consume next character
                        this.unicodeAsBackSlash = false;
                        if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                            && (this.source[this.currentPosition] == 'u')) {
                            getNextUnicodeChar();
                            this.withoutUnicodePtr--;
                        }
                    } else {
                        if (this.withoutUnicodePtr == 0) {
                            unicodeInitializeBuffer(this.currentPosition - this.startPosition);
                        }
                        this.withoutUnicodePtr--;
                        this.currentCharacter = this.source[this.currentPosition++];
                    }
                    // we need to compute the escape character in a separate buffer
                    scanEscapeCharacter();
                    if (this.withoutUnicodePtr != 0) {
                        unicodeStore();
                    }
                }
                // consume next character
                this.unicodeAsBackSlash = false;
                if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                    && (this.source[this.currentPosition] == 'u')) {
                    getNextUnicodeChar();
                    isUnicode = true;
                } else {
                    isUnicode = false;
                    if (this.withoutUnicodePtr != 0) {
                        unicodeStore();
                    }
                }
            }
        } catch (IndexOutOfBoundsException e) {
            this.currentPosition--;
            throw unterminatedString();
        } catch (InvalidInputException e) {
            if (e.getMessage().equals("Invalid_Escape")) {
                // relocate if finding another quote fairly close: thus unicode '/u000D' will be fully consumed
                for (int lookAhead = 0; lookAhead < 50; lookAhead++) {
                    if (this.currentPosition + lookAhead == this.eofPosition)
                        break;
                    if (this.source[this.currentPosition + lookAhead] == '\n')
                        break;
                    if (this.source[this.currentPosition + lookAhead] == '\"') {
                        this.currentPosition += lookAhead + 1;
                        break;
                    }
                }
            }
            throw e; // rethrow
        }
        return TokenNameStringLiteral;
    }

    public void getNextUnicodeChar() throws InvalidInputException {
        // VOID
        // handle the case of unicode.
        // when a unicode appears then we must use a buffer that holds char internal values
        // At the end of this method currentCharacter holds the new visited char
        // and currentPosition points right next after it

        // ALL getNextChar.... ARE OPTIMIZED COPIES
        int c1, c2, c3, c4, unicodeSize = 6;
        this.currentPosition++;
        if (this.currentPosition < this.eofPosition) {
            while (this.source[this.currentPosition] == 'u') {
                this.currentPosition++;
                if (this.currentPosition >= this.eofPosition) {
                    this.currentPosition--;
                    throw invalidUnicodeEscape();
                }
                unicodeSize++;
            }
        } else {
            this.currentPosition--;
            throw invalidUnicodeEscape();
        }

        if ((this.currentPosition + 4) > this.eofPosition) {
            this.currentPosition += (this.eofPosition - this.currentPosition);
            throw invalidUnicodeEscape();
        }
        if ((c1 = ScannerHelper.getHexadecimalValue(this.source[this.currentPosition++])) > 15
            || c1 < 0
            || (c2 = ScannerHelper.getHexadecimalValue(this.source[this.currentPosition++])) > 15
            || c2 < 0
            || (c3 = ScannerHelper.getHexadecimalValue(this.source[this.currentPosition++])) > 15
            || c3 < 0
            || (c4 = ScannerHelper.getHexadecimalValue(this.source[this.currentPosition++])) > 15
            || c4 < 0) {
            throw invalidUnicodeEscape();
        }
        this.currentCharacter = (char) (((c1 * 16 + c2) * 16 + c3) * 16 + c4);
        // need the unicode buffer
        if (this.withoutUnicodePtr == 0) {
            // buffer all the entries that have been left aside....
            unicodeInitializeBuffer(this.currentPosition - unicodeSize - this.startPosition);
        }
        // fill the buffer with the char
        unicodeStore();
        this.unicodeAsBackSlash = this.currentCharacter == '\\';
    }

    public char[] getSource() {
        return this.source;
    }

    public final void jumpOverMethodBody() {
        this.wasAcr = false;
        int found = 1;
        try {
            while (true) { // loop for jumping over comments
                this.withoutUnicodePtr = 0;
                // ---------Consume white space and handles startPosition---------
                boolean isWhiteSpace;
                do {
                    this.startPosition = this.currentPosition;
                    if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                        && (this.source[this.currentPosition] == 'u')) {
                        isWhiteSpace = jumpOverUnicodeWhiteSpace();
                    } else {
                        if (this.recordLineSeparator
                            && ((this.currentCharacter == '\r') || (this.currentCharacter == '\n'))) {
                            pushLineSeparator();
                        }
                        isWhiteSpace = CharOperation.isWhitespace(this.currentCharacter);
                    }
                } while (isWhiteSpace);

                // -------consume token until } is found---------
                NextToken: switch (this.currentCharacter) {
                    case '{':
                        found++;
                        break;

                    case '}':
                        found--;
                        if (found == 0)
                            return;
                        break;

                    case '\'': {
                        boolean test;
                        test = getNextChar('\\');
                        if (test) {
                            try {
                                if (this.unicodeAsBackSlash) {
                                    // consume next character
                                    this.unicodeAsBackSlash = false;
                                    if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                        && (this.source[this.currentPosition] == 'u')) {
                                        getNextUnicodeChar();
                                    } else {
                                        if (this.withoutUnicodePtr != 0) {
                                            unicodeStore();
                                        }
                                    }
                                } else {
                                    this.currentCharacter = this.source[this.currentPosition++];
                                }
                                scanEscapeCharacter();
                            } catch (InvalidInputException ex) {
                                // ignore
                            }
                        } else {
                            try { // consume next character
                                this.unicodeAsBackSlash = false;
                                if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                    && (this.source[this.currentPosition] == 'u')) {
                                    getNextUnicodeChar();
                                } else {
                                    if (this.withoutUnicodePtr != 0) {
                                        unicodeStore();
                                    }
                                }
                            } catch (InvalidInputException ex) {
                                // ignore
                            }
                        }
                        getNextChar('\'');
                        break;
                    }

                    case '"':
                        try {
                            try { // consume next character
                                this.unicodeAsBackSlash = false;
                                if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                    && (this.source[this.currentPosition] == 'u')) {
                                    getNextUnicodeChar();
                                } else {
                                    if (this.withoutUnicodePtr != 0) {
                                        unicodeStore();
                                    }
                                }
                            } catch (InvalidInputException ex) {
                                // ignore
                            }

                            while (this.currentPosition <= this.eofPosition) {
                                if (this.currentCharacter == '"') {
                                    break;
                                }
                                if (this.currentCharacter == '\r') {
                                    if (this.source[this.currentPosition] == '\n')
                                        this.currentPosition++;
                                    break NextToken; // the string cannot go further that the line
                                }
                                if (this.currentCharacter == '\n') {
                                    break; // the string cannot go further that the line
                                }
                                if (this.currentCharacter == '\\') {
                                    try {
                                        if (this.unicodeAsBackSlash) {
                                            // consume next character
                                            this.unicodeAsBackSlash = false;
                                            if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                                && (this.source[this.currentPosition] == 'u')) {
                                                getNextUnicodeChar();
                                            } else {
                                                if (this.withoutUnicodePtr != 0) {
                                                    unicodeStore();
                                                }
                                            }
                                        } else {
                                            this.currentCharacter = this.source[this.currentPosition++];
                                        }
                                        scanEscapeCharacter();
                                    } catch (InvalidInputException ex) {
                                        // ignore
                                    }
                                }
                                try { // consume next character
                                    this.unicodeAsBackSlash = false;
                                    if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                        && (this.source[this.currentPosition] == 'u')) {
                                        getNextUnicodeChar();
                                    } else {
                                        if (this.withoutUnicodePtr != 0) {
                                            unicodeStore();
                                        }
                                    }
                                } catch (InvalidInputException ex) {
                                    // ignore
                                }
                            }
                        } catch (IndexOutOfBoundsException e) {
                            // ignore
                        }
                        break;

                    case '/': {
                        int test = findCommentType();
                        if (test == 0) { // line comment
                            try {
                                this.lastCommentLinePosition = this.currentPosition;
                                // get the next char
                                if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                    && (this.source[this.currentPosition] == 'u')) {
                                    getNextUnicodeChar();
                                }
                                // handle the \\u case manually into comment
                                if (this.currentCharacter == '\\') {
                                    if (this.source[this.currentPosition] == '\\')
                                        this.currentPosition++;
                                } // jump over the \\
                                boolean isUnicode = false;
                                while (this.currentCharacter != '\r' && this.currentCharacter != '\n') {
                                    if (this.currentPosition >= this.eofPosition) {
                                        this.lastCommentLinePosition = this.currentPosition;
                                        this.currentPosition++;
                                        // this avoids duplicating the code inside the catch(IndexOutOfBoundsException
                                        // e) below
                                        throw new IndexOutOfBoundsException();
                                    }
                                    this.lastCommentLinePosition = this.currentPosition;
                                    // get the next char
                                    isUnicode = false;
                                    if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                        && (this.source[this.currentPosition] == 'u')) {
                                        isUnicode = true;
                                        getNextUnicodeChar();
                                    }
                                    // handle the \\u case manually into comment
                                    if (this.currentCharacter == '\\') {
                                        if (this.source[this.currentPosition] == '\\')
                                            this.currentPosition++;
                                    } // jump over the \\
                                }
                                /*
                                 * We need to completely consume the line break
                                 */
                                if (this.currentCharacter == '\r' && this.eofPosition > this.currentPosition) {
                                    if (this.source[this.currentPosition] == '\n') {
                                        this.currentPosition++;
                                        this.currentCharacter = '\n';
                                    } else if ((this.source[this.currentPosition] == '\\')
                                        && (this.source[this.currentPosition + 1] == 'u')) {
                                        isUnicode = true;
                                        getNextUnicodeChar();
                                    }
                                }
                                recordComment(TokenNameCOMMENT_LINE);
                                if (this.recordLineSeparator
                                    && ((this.currentCharacter == '\r') || (this.currentCharacter == '\n'))) {
                                    if (isUnicode) {
                                        pushUnicodeLineSeparator();
                                    } else {
                                        pushLineSeparator();
                                    }
                                }
                            } catch (IndexOutOfBoundsException e) {
                                // an eof will then be generated
                                this.currentPosition--;
                                recordComment(TokenNameCOMMENT_LINE);

                                if (!this.tokenizeComments) {
                                    this.currentPosition++;
                                }
                            }
                            break;
                        } else if (test == 1) { // traditional and javadoc comment
                            boolean isJavadoc = false;
                            try { // get the next char
                                boolean star = false;
                                int previous;
                                boolean isUnicode;
                                // consume next character
                                this.unicodeAsBackSlash = false;
                                if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                    && (this.source[this.currentPosition] == 'u')) {
                                    getNextUnicodeChar();
                                    isUnicode = true;
                                } else {
                                    isUnicode = false;
                                    if (this.withoutUnicodePtr != 0) {
                                        unicodeStore();
                                    }
                                }

                                if (this.currentCharacter == '*') {
                                    isJavadoc = true;
                                    star = true;
                                }
                                if ((this.currentCharacter == '\r') || (this.currentCharacter == '\n')) {
                                    if (this.recordLineSeparator) {
                                        if (isUnicode) {
                                            pushUnicodeLineSeparator();
                                        } else {
                                            pushLineSeparator();
                                        }
                                    }
                                }
                                previous = this.currentPosition;
                                if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                    && (this.source[this.currentPosition] == 'u')) {
                                    getNextUnicodeChar();
                                    isUnicode = true;
                                } else {
                                    isUnicode = false;
                                }
                                // handle the \\u case manually into comment
                                if (this.currentCharacter == '\\') {
                                    if (this.source[this.currentPosition] == '\\')
                                        this.currentPosition++; // jump over the \\
                                }
                                // empty comment is not a javadoc /**/
                                if (this.currentCharacter == '/') {
                                    isJavadoc = false;
                                }
                                // loop until end of comment */
                                int firstTag = 0;
                                while ((this.currentCharacter != '/') || (!star)) {
                                    if (this.currentPosition >= this.eofPosition) {
                                        return;
                                    }
                                    if ((this.currentCharacter == '\r') || (this.currentCharacter == '\n')) {
                                        if (this.recordLineSeparator) {
                                            if (isUnicode) {
                                                pushUnicodeLineSeparator();
                                            } else {
                                                pushLineSeparator();
                                            }
                                        }
                                    }
                                    switch (this.currentCharacter) {
                                        case '*':
                                            star = true;
                                            break;

                                        case '@':
                                            if ((firstTag == 0)) {
                                                firstTag = previous;
                                            }
                                            //$FALL-THROUGH$ default case to set star to false
                                        default:
                                            star = false;
                                    }
                                    // get next char
                                    previous = this.currentPosition;
                                    if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                        && (this.source[this.currentPosition] == 'u')) {
                                        getNextUnicodeChar();
                                        isUnicode = true;
                                    } else {
                                        isUnicode = false;
                                    }
                                    // handle the \\u case manually into comment
                                    if (this.currentCharacter == '\\') {
                                        if (this.source[this.currentPosition] == '\\')
                                            this.currentPosition++;
                                    } // jump over the \\
                                }
                                recordComment(isJavadoc ? TokenNameCOMMENT_JAVADOC : TokenNameCOMMENT_BLOCK);
                                this.commentTagStarts[this.commentPtr] = firstTag;
                            } catch (IndexOutOfBoundsException e) {
                                return;
                            }
                            break;
                        }
                        break;
                    }

                    default:
                        try {
                            char c = this.currentCharacter;
                            if (c < 128) {
                                if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 64) != 0) {
                                    scanIdentifierOrKeyword();
                                    break;
                                } else if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 4) != 0) {
                                    scanNumber(false);
                                    break;
                                } else {
                                    break;
                                }
                            }
                            boolean isJavaIdStart;
                            if (c >= 55296 && c <= 56319) {
                                // Unicode 4 detection
                                char low = (char) getNextChar();
                                if (low < 56320 || low > 57343) {
                                    // illegal low surrogate
                                    break;
                                }
                                isJavaIdStart = ScannerHelper.isJavaIdentifierStart(c, low);
                            } else if (c >= 56320 && c <= 57343) {
                                break;
                            } else {
                                // optimized case already checked
                                isJavaIdStart = ScannerHelper.isJavaIdentifierStart(c);
                            }
                            if (isJavaIdStart) {
                                scanIdentifierOrKeyword();
                                break;
                            }
                        } catch (InvalidInputException ex) {
                            // ignore
                        }
                }
            }
            // -----------------end switch while try--------------------
        } catch (IndexOutOfBoundsException | InvalidInputException e) {
            // ignore
        }
    }

    public final boolean jumpOverUnicodeWhiteSpace() throws InvalidInputException {
        // BOOLEAN
        // handle the case of unicode. Jump over the next whiteSpace
        // making startPosition pointing on the next available char
        // On false, the currentCharacter is filled up with a potential
        // correct char

        this.wasAcr = false;
        getNextUnicodeChar();
        return CharOperation.isWhitespace(this.currentCharacter);
    }

    public boolean isInModuleDeclaration() {
        return this.fakeInModule || this.insideModuleInfo;
    }

    protected boolean areRestrictedModuleKeywordsActive() {
        return this.scanContext != null && this.scanContext != ScanContext.INACTIVE;
    }

    void updateScanContext(int token) {
        switch (token) {
            case TokenNameSEMICOLON:	// next could be a KEYWORD
            case TokenNameRBRACE:
            case TokenNameRPAREN:
                this.scanContext = ScanContext.EXPECTING_KEYWORD;
                break;

            case TokenNameopen:
                this.scanContext = ScanContext.EXPECTING_KEYWORD;
                break;

            case TokenNamerequires:
                this.scanContext = ScanContext.AFTER_REQUIRES;
                break;

            case TokenNamemodule:
            case TokenNameexports:
            case TokenNameopens:
            case TokenNameuses:
            case TokenNameprovides:
            case TokenNameto:
            case TokenNamewith:
            case TokenNametransitive:
            case TokenNameDOT:
            case TokenNameimport:
            case TokenNameAT:
            case TokenNameAT308:
            case TokenNameCOMMA:
                this.scanContext = ScanContext.EXPECTING_IDENTIFIER;
                break;

            case TokenNameIdentifier:
                this.scanContext = ScanContext.EXPECTING_KEYWORD;
                break;

            case TokenNameLBRACE:
                this.scanContext = ScanContext.EXPECTING_KEYWORD;
                break;

            default: // anything else is unexpected and should not alter the context
                break;
        }
    }

    public final void pushLineSeparator() {
        // currentCharacter is at position currentPosition-1
        // cr 000D
        if (this.currentCharacter == '\r') {
            int separatorPos = this.currentPosition - 1;
            if ((this.linePtr >= 0) && (this.lineEnds[this.linePtr] >= separatorPos))
                return;
            int length = this.lineEnds.length;
            if (++this.linePtr >= length)
                System.arraycopy(this.lineEnds, 0, this.lineEnds = new int[2 * length + 250], 0, length);
            this.lineEnds[this.linePtr] = separatorPos;
            // look-ahead for merged cr+lf
            try {
                if (this.source[this.currentPosition] == '\n') {
                    this.lineEnds[this.linePtr] = this.currentPosition;
                    this.currentPosition++;
                    this.wasAcr = false;
                } else {
                    this.wasAcr = true;
                }
            } catch (IndexOutOfBoundsException e) {
                this.wasAcr = true;
            }
        } else {
            // lf 000A
            if (this.currentCharacter == '\n') { // must merge eventual cr followed by lf
                if (this.wasAcr && (this.lineEnds[this.linePtr] == (this.currentPosition - 2))) {
                    this.lineEnds[this.linePtr] = this.currentPosition - 1;
                } else {
                    int separatorPos = this.currentPosition - 1;
                    if ((this.linePtr >= 0) && (this.lineEnds[this.linePtr] >= separatorPos))
                        return;
                    int length = this.lineEnds.length;
                    if (++this.linePtr >= length)
                        System.arraycopy(this.lineEnds, 0, this.lineEnds = new int[2 * length + 250], 0, length);
                    this.lineEnds[this.linePtr] = separatorPos;
                }
                this.wasAcr = false;
            }
        }
    }

    public final void pushUnicodeLineSeparator() {
        // cr 000D
        if (this.currentCharacter == '\r') {
            this.wasAcr = this.source[this.currentPosition] != '\n';
        } else {
            // lf 000A
            if (this.currentCharacter == '\n') { // must merge eventual cr followed by lf
                this.wasAcr = false;
            }
        }
    }

    public void recordComment(int token) {
        // compute position
        int commentStart = this.startPosition;
        int stopPosition = this.currentPosition;
        switch (token) {
            case TokenNameCOMMENT_LINE:
                // both positions are negative
                commentStart = -this.startPosition;
                stopPosition = -this.lastCommentLinePosition;
                break;

            case TokenNameCOMMENT_BLOCK:
                // only end position is negative
                stopPosition = -this.currentPosition;
                break;

            default:
                break;
        }

        // a new comment is recorded
        int length = this.commentStops.length;
        if (++this.commentPtr >= length) {
            int newLength = length + 30 * 10;
            growCommentInfoArrays(length, newLength);
        }
        this.commentStops[this.commentPtr] = stopPosition;
        this.commentStarts[this.commentPtr] = commentStart;
    }

    /**
     * Reposition the scanner on some portion of the original source. The given endPosition is the last valid position.
     * Beyond this position, the scanner will answer EOF tokens (<code>TerminalToken.TokenNameEOF</code>).
     *
     * @param begin the given start position
     * @param end the given end position
     */
    public void resetTo(int begin, int end) {
        resetTo(begin, end, isInModuleDeclaration());
    }

    public void resetTo(int begin, int end, boolean isModuleInfo) {
        resetTo(begin, end, isModuleInfo, null);
    }

    /**
     * Reposition the scanner on some portion of the original source. The given endPosition is the last valid position.
     * Beyond this position, the scanner will answer EOF tokens (<code>TerminalToken.TokenNameEOF</code>).
     *
     * @param begin the given start position
     * @param end the given end position
     * @param isModuleInfo if true apply rules for restricted keywords even without a connection to a properly
     * configured parser
     * @param context The scan context to use for restricted keyword support, use null to compute
     */
    public void resetTo(int begin, int end, boolean isModuleInfo, ScanContext context) {
        // reset the scanner to a given position where it may rescan again

        this.diet = false;
        this.initialPosition = this.startPosition = this.currentPosition = begin;
        if (this.source != null && this.source.length < end) {
            this.eofPosition = this.source.length;
        } else {
            this.eofPosition = end < Integer.MAX_VALUE ? end + 1 : end;
        }
        this.commentPtr = -1; // reset comment stack
        resetLookBack();
        this.nextToken = TokenNameNotAToken;
        this.consumingEllipsisAnnotations = false;
        this.insideModuleInfo = isModuleInfo;
        this.scanContext = context == null ? getScanContext(begin) : context;
    }

    /**
     * @see #lookBack
     */
    final void resetLookBack() {
        this.lookBack[0] = this.lookBack[1] = TokenNameNotAToken;
    }

    /**
     * @see #lookBack
     */
    final void addTokenToLookBack(int newToken) {
        switch (newToken) {
            case TokenNameWHITESPACE:
            case TokenNameCOMMENT_LINE:
            case TokenNameCOMMENT_BLOCK:
            case TokenNameCOMMENT_JAVADOC:
                return;

            default:
                break;
        }
        this.lookBack[0] = this.lookBack[1];
        this.lookBack[1] = newToken;
    }

    private ScanContext getScanContext(int begin) {
        if (!isInModuleDeclaration())
            return ScanContext.INACTIVE;
        if (begin == 0)
            return ScanContext.EXPECTING_KEYWORD;
        ModuleScanContextDetector parser = new ModuleScanContextDetector();
        return parser.getScanContext(this.source, begin - 1);
    }

    protected final void scanEscapeCharacter() throws InvalidInputException {
        // the string with "\\u" is a legal string of two chars \ and u
        // thus we use a direct access to the source (for regular cases).
        switch (this.currentCharacter) {
            case 'b':
                this.currentCharacter = '\b';
                break;

            case 't':
                this.currentCharacter = '\t';
                break;

            case 'n':
                this.currentCharacter = '\n';
                break;

            case 'f':
                this.currentCharacter = '\f';
                break;

            case 'r':
                this.currentCharacter = '\r';
                break;

            case '\"', '\'', '\\':
                break;

            case 's':
                // The \s escape needs Java 15.
                throw invalidEscape();

            default:
                // -----------octal escape--------------
                // OctalDigit
                // OctalDigit OctalDigit
                // ZeroToThree OctalDigit OctalDigit

                int number = ScannerHelper.getHexadecimalValue(this.currentCharacter);
                if (number >= 0 && number <= 7) {
                    boolean zeroToThreeNot = number > 3;
                    if (ScannerHelper.isDigit(this.currentCharacter = this.source[this.currentPosition++])) {
                        int digit = ScannerHelper.getHexadecimalValue(this.currentCharacter);
                        if (digit >= 0 && digit <= 7) {
                            number = (number * 8) + digit;
                            if (ScannerHelper.isDigit(this.currentCharacter = this.source[this.currentPosition++])) {
                                if (zeroToThreeNot) {// has read \NotZeroToThree OctalDigit Digit --> ignore last
                                                     // character
                                    this.currentPosition--;
                                } else {
                                    digit = ScannerHelper.getHexadecimalValue(this.currentCharacter);
                                    if (digit >= 0 && digit <= 7) { // has read \ZeroToThree OctalDigit OctalDigit
                                        number = (number * 8) + digit;
                                    } else {// has read \ZeroToThree OctalDigit NonOctalDigit --> ignore last character
                                        this.currentPosition--;
                                    }
                                }
                            } else { // has read \OctalDigit NonDigit--> ignore last character
                                this.currentPosition--;
                            }
                        } else { // has read \OctalDigit NonOctalDigit--> ignore last character
                            this.currentPosition--;
                        }
                    } else { // has read \OctalDigit --> ignore last character
                        this.currentPosition--;
                    }
                    this.currentCharacter = (char) number;
                } else
                    throw invalidEscape();
        }
    }

    public int scanIdentifierOrKeywordWithBoundCheck() {
        // test keywords

        char[] src = this.source;
        identLoop: {
            int pos;
            int srcLength = this.eofPosition;
            while (true) {
                if ((pos = this.currentPosition) >= srcLength) // handle the obvious case upfront
                    break identLoop;
                char c = src[pos];
                if (c < 128) {
                    if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & (32 | 16 | 8 | 4)) != 0) {
                        if (this.withoutUnicodePtr != 0) {
                            this.currentCharacter = c;
                            unicodeStore();
                        }
                        this.currentPosition++;
                    } else if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & (2 | 256)) != 0) {
                        this.currentCharacter = c;
                        break identLoop;
                    } else {
                        while (getNextCharAsJavaIdentifierPartWithBoundCheck()) {
                            /* empty */}
                        break identLoop;
                    }
                } else {
                    while (getNextCharAsJavaIdentifierPartWithBoundCheck()) {
                        /* empty */}
                    break identLoop;
                }
            }
        }

        int index, length;
        char[] data;
        if (this.withoutUnicodePtr == 0) {
            // quick test on length == 1 but not on length > 12 while most identifier
            // have a length which is <= 12...but there are lots of identifier with
            // only one char....
            if ((length = this.currentPosition - this.startPosition) == 1) {
                return TokenNameIdentifier;
            }
            data = this.source;
            index = this.startPosition;
        } else {
            if ((length = this.withoutUnicodePtr) == 1)
                return TokenNameIdentifier;
            data = this.withoutUnicodeBuffer;
            index = 1;
        }

        return internalScanIdentifierOrKeyword(index, length, data);
    }

    public int scanIdentifierOrKeyword() {
        // test keywords

        char[] src = this.source;
        identLoop: {
            int pos;
            int srcLength = this.eofPosition;
            while (true) {
                if ((pos = this.currentPosition) >= srcLength) // handle the obvious case upfront
                    break identLoop;
                char c = src[pos];
                if (c < 128) {
                    if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & (32 | 16 | 8 | 4)) != 0) {
                        if (this.withoutUnicodePtr != 0) {
                            this.currentCharacter = c;
                            unicodeStore();
                        }
                        this.currentPosition++;
                    } else if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & (2 | 256)) != 0) {
                        this.currentCharacter = c;
                        break identLoop;
                    } else {
                        while (getNextCharAsJavaIdentifierPart()) {
                            /* empty */}
                        break identLoop;
                    }
                } else {
                    while (getNextCharAsJavaIdentifierPart()) {
                        /* empty */}
                    break identLoop;
                }
            }
        }

        int index, length;
        char[] data;
        if (this.withoutUnicodePtr == 0) {
            // quick test on length == 1 but not on length > 12 while most identifier
            // have a length which is <= 12...but there are lots of identifier with
            // only one char....
            if ((length = this.currentPosition - this.startPosition) == 1) {
                return TokenNameIdentifier;
            }
            data = this.source;
            index = this.startPosition;
        } else {
            if ((length = this.withoutUnicodePtr) == 1) {
                return TokenNameIdentifier;
            }
            data = this.withoutUnicodeBuffer;
            index = 1;
        }

        return internalScanIdentifierOrKeyword(index, length, data);
    }

    private int internalScanIdentifierOrKeyword(int index, int length, char[] data) {
        switch (data[index]) {
            case 'a':
                switch (length) {
                    case 8: // abstract
                        if ((data[++index] == 'b')
                            && (data[++index] == 's')
                            && (data[++index] == 't')
                            && (data[++index] == 'r')
                            && (data[++index] == 'a')
                            && (data[++index] == 'c')
                            && (data[++index] == 't')) {
                            return TokenNameabstract;
                        } else {
                            return TokenNameIdentifier;
                        }
                    case 6: // assert
                        if ((data[++index] == 's')
                            && (data[++index] == 's')
                            && (data[++index] == 'e')
                            && (data[++index] == 'r')
                            && (data[++index] == 't')) {
                            this.containsAssertKeyword = true;
                            return TokenNameassert;
                        } else {
                            return TokenNameIdentifier;
                        }
                    default:
                        return TokenNameIdentifier;
                }
            case 'b': // boolean break byte
                switch (length) {
                    case 4:
                        if ((data[++index] == 'y') && (data[++index] == 't') && (data[++index] == 'e'))
                            return TokenNamebyte;
                        else
                            return TokenNameIdentifier;
                    case 5:
                        if ((data[++index] == 'r')
                            && (data[++index] == 'e')
                            && (data[++index] == 'a')
                            && (data[++index] == 'k'))
                            return TokenNamebreak;
                        else
                            return TokenNameIdentifier;
                    case 7:
                        if ((data[++index] == 'o')
                            && (data[++index] == 'o')
                            && (data[++index] == 'l')
                            && (data[++index] == 'e')
                            && (data[++index] == 'a')
                            && (data[++index] == 'n'))
                            return TokenNameboolean;
                        else
                            return TokenNameIdentifier;
                    default:
                        return TokenNameIdentifier;
                }

            case 'c': // case char catch const class continue
                switch (length) {
                    case 4:
                        if (data[++index] == 'a')
                            if ((data[++index] == 's') && (data[++index] == 'e'))
                                return TokenNamecase;
                            else
                                return TokenNameIdentifier;
                        else if ((data[index] == 'h') && (data[++index] == 'a') && (data[++index] == 'r'))
                            return TokenNamechar;
                        else
                            return TokenNameIdentifier;
                    case 5:
                        if (data[++index] == 'a')
                            if ((data[++index] == 't') && (data[++index] == 'c') && (data[++index] == 'h'))
                                return TokenNamecatch;
                            else
                                return TokenNameIdentifier;
                        else if (data[index] == 'l')
                            if ((data[++index] == 'a') && (data[++index] == 's') && (data[++index] == 's'))
                                return TokenNameclass;
                            else
                                return TokenNameIdentifier;
                        else if ((data[index] == 'o')
                            && (data[++index] == 'n')
                            && (data[++index] == 's')
                            && (data[++index] == 't'))
                            return TokenNameconst; // const is not used in java ???????
                        else
                            return TokenNameIdentifier;
                    case 8:
                        if ((data[++index] == 'o')
                            && (data[++index] == 'n')
                            && (data[++index] == 't')
                            && (data[++index] == 'i')
                            && (data[++index] == 'n')
                            && (data[++index] == 'u')
                            && (data[++index] == 'e'))
                            return TokenNamecontinue;
                        else
                            return TokenNameIdentifier;
                    default:
                        return TokenNameIdentifier;
                }

            case 'd': // default do double
                switch (length) {
                    case 2:
                        if ((data[++index] == 'o'))
                            return TokenNamedo;
                        else
                            return TokenNameIdentifier;
                    case 6:
                        if ((data[++index] == 'o')
                            && (data[++index] == 'u')
                            && (data[++index] == 'b')
                            && (data[++index] == 'l')
                            && (data[++index] == 'e'))
                            return TokenNamedouble;
                        else
                            return TokenNameIdentifier;
                    case 7:
                        if ((data[++index] == 'e')
                            && (data[++index] == 'f')
                            && (data[++index] == 'a')
                            && (data[++index] == 'u')
                            && (data[++index] == 'l')
                            && (data[++index] == 't'))
                            return TokenNamedefault;
                        else
                            return TokenNameIdentifier;
                    default:
                        return TokenNameIdentifier;
                }
            case 'e': // else extends exports
                switch (length) {
                    case 4:
                        if (data[++index] == 'l') {
                            if ((data[++index] == 's') && (data[++index] == 'e')) {
                                return TokenNameelse;
                            } else {
                                return TokenNameIdentifier;
                            }
                        } else if ((data[index] == 'n') && (data[++index] == 'u') && (data[++index] == 'm')) {
                            return TokenNameenum;
                        }
                        return TokenNameIdentifier;

                    case 7:
                        if ((data[++index] == 'x')) {
                            if ((data[++index] == 't')
                                && (data[++index] == 'e')
                                && (data[++index] == 'n')
                                && (data[++index] == 'd')
                                && (data[++index] == 's')) {
                                return TokenNameextends;
                            } else if (areRestrictedModuleKeywordsActive()
                                && (data[index] == 'p')
                                && (data[++index] == 'o')
                                && (data[++index] == 'r')
                                && (data[++index] == 't')
                                && (data[++index] == 's')) {
                                return TokenNameexports;
                            } else
                                return TokenNameIdentifier;
                        } else
                            return TokenNameIdentifier;
                    default:
                        return TokenNameIdentifier;
                }

            case 'f': // final finally float for false
                switch (length) {
                    case 3:
                        if ((data[++index] == 'o') && (data[++index] == 'r'))
                            return TokenNamefor;
                        else
                            return TokenNameIdentifier;
                    case 5:
                        if (data[++index] == 'i')
                            if ((data[++index] == 'n') && (data[++index] == 'a') && (data[++index] == 'l')) {
                                return TokenNamefinal;
                            } else
                                return TokenNameIdentifier;
                        else if (data[index] == 'l')
                            if ((data[++index] == 'o') && (data[++index] == 'a') && (data[++index] == 't'))
                                return TokenNamefloat;
                            else
                                return TokenNameIdentifier;
                        else if ((data[index] == 'a')
                            && (data[++index] == 'l')
                            && (data[++index] == 's')
                            && (data[++index] == 'e'))
                            return TokenNamefalse;
                        else
                            return TokenNameIdentifier;
                    case 7:
                        if ((data[++index] == 'i')
                            && (data[++index] == 'n')
                            && (data[++index] == 'a')
                            && (data[++index] == 'l')
                            && (data[++index] == 'l')
                            && (data[++index] == 'y'))
                            return TokenNamefinally;
                        else
                            return TokenNameIdentifier;

                    default:
                        return TokenNameIdentifier;
                }
            case 'g': // goto
                if (length == 4) {
                    if ((data[++index] == 'o') && (data[++index] == 't') && (data[++index] == 'o')) {
                        return TokenNamegoto;
                    }
                } // no goto in java are allowed, so why java removes this keyword ???
                return TokenNameIdentifier;

            case 'i': // if implements import instanceof int interface
                switch (length) {
                    case 2:
                        if (data[++index] == 'f')
                            return TokenNameif;
                        else
                            return TokenNameIdentifier;
                    case 3:
                        if ((data[++index] == 'n') && (data[++index] == 't'))
                            return TokenNameint;
                        else
                            return TokenNameIdentifier;
                    case 6:
                        if ((data[++index] == 'm')
                            && (data[++index] == 'p')
                            && (data[++index] == 'o')
                            && (data[++index] == 'r')
                            && (data[++index] == 't')) {
                            return TokenNameimport;
                        } else {
                            return TokenNameIdentifier;
                        }
                    case 9:
                        if ((data[++index] == 'n')
                            && (data[++index] == 't')
                            && (data[++index] == 'e')
                            && (data[++index] == 'r')
                            && (data[++index] == 'f')
                            && (data[++index] == 'a')
                            && (data[++index] == 'c')
                            && (data[++index] == 'e'))
                            return TokenNameinterface;
                        else
                            return TokenNameIdentifier;
                    case 10:
                        if (data[++index] == 'm')
                            if ((data[++index] == 'p')
                                && (data[++index] == 'l')
                                && (data[++index] == 'e')
                                && (data[++index] == 'm')
                                && (data[++index] == 'e')
                                && (data[++index] == 'n')
                                && (data[++index] == 't')
                                && (data[++index] == 's'))
                                return TokenNameimplements;
                            else
                                return TokenNameIdentifier;
                        else if ((data[index] == 'n')
                            && (data[++index] == 's')
                            && (data[++index] == 't')
                            && (data[++index] == 'a')
                            && (data[++index] == 'n')
                            && (data[++index] == 'c')
                            && (data[++index] == 'e')
                            && (data[++index] == 'o')
                            && (data[++index] == 'f'))
                            return TokenNameinstanceof;
                        else
                            return TokenNameIdentifier;

                    default:
                        return TokenNameIdentifier;
                }

            case 'l': // long
                if (length == 4) {
                    if ((data[++index] == 'o') && (data[++index] == 'n') && (data[++index] == 'g')) {
                        return TokenNamelong;
                    }
                }
                return TokenNameIdentifier;

            case 'm': // module
                if (length == 6) {
                    if (areRestrictedModuleKeywordsActive()
                        && (data[++index] == 'o')
                        && (data[++index] == 'd')
                        && (data[++index] == 'u')
                        && (data[++index] == 'l')
                        && (data[++index] == 'e'))
                        return TokenNamemodule;
                    else
                        return TokenNameIdentifier;
                }
                return TokenNameIdentifier;

            case 'n': // native new null
                switch (length) {
                    case 3:
                        if ((data[++index] == 'e') && (data[++index] == 'w'))
                            return TokenNamenew;
                        else
                            return TokenNameIdentifier;
                    case 4:
                        if ((data[++index] == 'u') && (data[++index] == 'l') && (data[++index] == 'l'))
                            return TokenNamenull;
                        else
                            return TokenNameIdentifier;
                    case 6:
                        if ((data[++index] == 'a')
                            && (data[++index] == 't')
                            && (data[++index] == 'i')
                            && (data[++index] == 'v')
                            && (data[++index] == 'e')) {
                            return TokenNamenative;
                        } else
                            return TokenNameIdentifier;
                    default:
                        return TokenNameIdentifier;
                }

            case 'o':
                switch (length) {
                    case 4:
                        if (areRestrictedModuleKeywordsActive()
                            && (data[++index] == 'p')
                            && (data[++index] == 'e')
                            && (data[++index] == 'n'))
                            return TokenNameopen;
                        else
                            return TokenNameIdentifier;
                    case 5:
                        if (areRestrictedModuleKeywordsActive()
                            && (data[++index] == 'p')
                            && (data[++index] == 'e')
                            && (data[++index] == 'n')
                            && (data[++index] == 's'))
                            return TokenNameopens;
                        else
                            return TokenNameIdentifier;
                    default:
                        return TokenNameIdentifier;
                }
            case 'p': // package private protected public provides
                switch (length) {
                    case 6:
                        if ((data[++index] == 'u')
                            && (data[++index] == 'b')
                            && (data[++index] == 'l')
                            && (data[++index] == 'i')
                            && (data[++index] == 'c')) {
                            return TokenNamepublic;
                        } else
                            return TokenNameIdentifier;
                    case 7:
                        if (data[++index] == 'a') {
                            if ((data[++index] == 'c')
                                && (data[++index] == 'k')
                                && (data[++index] == 'a')
                                && (data[++index] == 'g')
                                && (data[++index] == 'e'))
                                return TokenNamepackage;
                            else
                                return TokenNameIdentifier;
                        } else {
                            if ((data[index] == 'r')
                                && (data[++index] == 'i')
                                && (data[++index] == 'v')
                                && (data[++index] == 'a')
                                && (data[++index] == 't')
                                && (data[++index] == 'e')) {
                                return TokenNameprivate;
                            } else if ((data[index] == 'e')
                                && (data[++index] == 'r')
                                && (data[++index] == 'm')
                                && (data[++index] == 'i')
                                && (data[++index] == 't')
                                && (data[++index] == 's')) {
                                return TerminalToken.TokenNameIdentifier;
                            } else
                                return TokenNameIdentifier;
                        }
                    case 8:
                        if (areRestrictedModuleKeywordsActive()
                            && (data[++index] == 'r')
                            && (data[++index] == 'o')
                            && (data[++index] == 'v')
                            && (data[++index] == 'i')
                            && (data[++index] == 'd')
                            && (data[++index] == 'e')
                            && (data[++index] == 's')) {
                            return TokenNameprovides;
                        } else
                            return TokenNameIdentifier;
                    case 9:
                        if ((data[++index] == 'r')
                            && (data[++index] == 'o')
                            && (data[++index] == 't')
                            && (data[++index] == 'e')
                            && (data[++index] == 'c')
                            && (data[++index] == 't')
                            && (data[++index] == 'e')
                            && (data[++index] == 'd')) {
                            return TokenNameprotected;
                        } else
                            return TokenNameIdentifier;

                    default:
                        return TokenNameIdentifier;
                }

            case 'r': // return requires
                switch (length) {
                    case 6:
                        if (data[++index] == 'e') {
                            if ((data[++index] == 't')
                                && (data[++index] == 'u')
                                && (data[++index] == 'r')
                                && (data[++index] == 'n'))
                                return TokenNamereturn;
                            else if ((data[index] == 'c')
                                && (data[++index] == 'o')
                                && (data[++index] == 'r')
                                && (data[++index] == 'd'))
                                return TerminalToken.TokenNameIdentifier;
                        }
                        return TokenNameIdentifier;

                    case 8:
                        if (areRestrictedModuleKeywordsActive()
                            && (data[++index] == 'e')
                            && (data[++index] == 'q')
                            && (data[++index] == 'u')
                            && (data[++index] == 'i')
                            && (data[++index] == 'r')
                            && (data[++index] == 'e')
                            && (data[++index] == 's')) {
                            return TokenNamerequires;
                        } else
                            return TokenNameIdentifier;
                }
                return TokenNameIdentifier;

            case 's': // short static super switch synchronized strictfp
                switch (length) {
                    case 5:
                        if (data[++index] == 'h')
                            if ((data[++index] == 'o') && (data[++index] == 'r') && (data[++index] == 't'))
                                return TokenNameshort;
                            else
                                return TokenNameIdentifier;
                        else if ((data[index] == 'u')
                            && (data[++index] == 'p')
                            && (data[++index] == 'e')
                            && (data[++index] == 'r'))
                            return TokenNamesuper;
                        else
                            return TokenNameIdentifier;

                    case 6:
                        if (data[++index] == 't')
                            if ((data[++index] == 'a')
                                && (data[++index] == 't')
                                && (data[++index] == 'i')
                                && (data[++index] == 'c')) {
                                return TokenNamestatic;
                            } else
                                return TokenNameIdentifier;
                        else if ((data[index] == 'w')
                            && (data[++index] == 'i')
                            && (data[++index] == 't')
                            && (data[++index] == 'c')
                            && (data[++index] == 'h')) {
                            return TokenNameswitch;
                        } else if ((data[index] == 'e')
                            && (data[++index] == 'a')
                            && (data[++index] == 'l')
                            && (data[++index] == 'e')
                            && (data[++index] == 'd')) {
                            return TerminalToken.TokenNameIdentifier;
                        } else
                            return TokenNameIdentifier;
                    case 8:
                        if ((data[++index] == 't')
                            && (data[++index] == 'r')
                            && (data[++index] == 'i')
                            && (data[++index] == 'c')
                            && (data[++index] == 't')
                            && (data[++index] == 'f')
                            && (data[++index] == 'p'))
                            return TokenNamestrictfp;
                        else
                            return TokenNameIdentifier;
                    case 12:
                        if ((data[++index] == 'y')
                            && (data[++index] == 'n')
                            && (data[++index] == 'c')
                            && (data[++index] == 'h')
                            && (data[++index] == 'r')
                            && (data[++index] == 'o')
                            && (data[++index] == 'n')
                            && (data[++index] == 'i')
                            && (data[++index] == 'z')
                            && (data[++index] == 'e')
                            && (data[++index] == 'd')) {
                            return TokenNamesynchronized;
                        } else
                            return TokenNameIdentifier;
                    default:
                        return TokenNameIdentifier;
                }

            case 't': // try throw throws transient this true
                switch (length) {
                    case 2:
                        if (areRestrictedModuleKeywordsActive() && data[++index] == 'o')
                            return TokenNameto;
                        else
                            return TokenNameIdentifier;
                    case 3:
                        if ((data[++index] == 'r') && (data[++index] == 'y'))
                            return TokenNametry;
                        else
                            return TokenNameIdentifier;
                    case 4:
                        if (data[++index] == 'h')
                            if ((data[++index] == 'i') && (data[++index] == 's'))
                                return TokenNamethis;
                            else
                                return TokenNameIdentifier;
                        else if ((data[index] == 'r') && (data[++index] == 'u') && (data[++index] == 'e'))
                            return TokenNametrue;
                        else
                            return TokenNameIdentifier;
                    case 5:
                        if ((data[++index] == 'h')
                            && (data[++index] == 'r')
                            && (data[++index] == 'o')
                            && (data[++index] == 'w'))
                            return TokenNamethrow;
                        else
                            return TokenNameIdentifier;
                    case 6:
                        if ((data[++index] == 'h')
                            && (data[++index] == 'r')
                            && (data[++index] == 'o')
                            && (data[++index] == 'w')
                            && (data[++index] == 's'))
                            return TokenNamethrows;
                        else
                            return TokenNameIdentifier;
                    case 9:
                        if ((data[++index] == 'r')
                            && (data[++index] == 'a')
                            && (data[++index] == 'n')
                            && (data[++index] == 's')
                            && (data[++index] == 'i')
                            && (data[++index] == 'e')
                            && (data[++index] == 'n')
                            && (data[++index] == 't')) {
                            return TokenNametransient;
                        } else
                            return TokenNameIdentifier;
                    case 10:
                        if (areRestrictedModuleKeywordsActive()
                            && (data[++index] == 'r')
                            && (data[++index] == 'a')
                            && (data[++index] == 'n')
                            && (data[++index] == 's')
                            && (data[++index] == 'i')
                            && (data[++index] == 't')
                            && (data[++index] == 'i')
                            && (data[++index] == 'v')
                            && (data[++index] == 'e')) {
                            return TokenNametransitive;
                        } else
                            return TokenNameIdentifier;
                    default:
                        return TokenNameIdentifier;
                }
            case 'u': // uses
                if (length == 4) {
                    if (areRestrictedModuleKeywordsActive()
                        && (data[++index] == 's')
                        && (data[++index] == 'e')
                        && (data[++index] == 's'))
                        return TokenNameuses;
                    else
                        return TokenNameIdentifier;
                }
                return TokenNameIdentifier;

            case 'v': // void volatile
                switch (length) {
                    case 4:
                        if ((data[++index] == 'o') && (data[++index] == 'i') && (data[++index] == 'd'))
                            return TokenNamevoid;
                        else
                            return TokenNameIdentifier;
                    case 8:
                        if ((data[++index] == 'o')
                            && (data[++index] == 'l')
                            && (data[++index] == 'a')
                            && (data[++index] == 't')
                            && (data[++index] == 'i')
                            && (data[++index] == 'l')
                            && (data[++index] == 'e')) {
                            return TokenNamevolatile;
                        } else
                            return TokenNameIdentifier;

                    default:
                        return TokenNameIdentifier;
                }

            case 'w': // while widefp with
                switch (length) {
                    case 4:
                        if (areRestrictedModuleKeywordsActive()
                            && (data[++index] == 'i')
                            && (data[++index] == 't')
                            && (data[++index] == 'h'))
                            return TokenNamewith;
                        else
                            return TokenNameIdentifier;
                    case 5:
                        if ((data[++index] == 'h')
                            && (data[++index] == 'i')
                            && (data[++index] == 'l')
                            && (data[++index] == 'e'))
                            return TokenNamewhile;
                        else
                            return TokenNameIdentifier;
                    default:
                        return TokenNameIdentifier;
                }

            case 'y':
                if (length == 5) {
                    if ((data[++index] == 'i')
                        && (data[++index] == 'e')
                        && (data[++index] == 'l')
                        && (data[++index] == 'd'))
                        return TerminalToken.TokenNameIdentifier;
                    //$FALL-THROUGH$
                }
                return TokenNameIdentifier;

            default:
                return TokenNameIdentifier;
        }
    }

    public int scanNumber(boolean dotPrefix) throws InvalidInputException {

        // when entering this method the currentCharacter is the first
        // digit of the number. It may be preceeded by a '.' when
        // dotPrefix is true

        boolean floating = dotPrefix;
        if (!dotPrefix && (this.currentCharacter == '0')) {
            if (getNextChar('x', 'X') >= 0) { // ----------hexa-----------------
                int start = this.currentPosition;
                consumeDigits(16, true);
                int end = this.currentPosition;
                if (getNextChar('l', 'L') >= 0) {
                    if (end == start) {
                        throw invalidHexa();
                    }
                    return TokenNameLongLiteral;
                } else if (getNextChar('.')) {
                    // hexadecimal floating point literal
                    // read decimal part
                    boolean hasNoDigitsBeforeDot = end == start;
                    start = this.currentPosition;
                    consumeDigits(16, true);
                    end = this.currentPosition;
                    if (hasNoDigitsBeforeDot && end == start) {
                        throw invalidHexa();
                    }

                    if (getNextChar('p', 'P') >= 0) { // consume next character
                        this.unicodeAsBackSlash = false;
                        if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                            && (this.source[this.currentPosition] == 'u')) {
                            getNextUnicodeChar();
                        } else {
                            if (this.withoutUnicodePtr != 0) {
                                unicodeStore();
                            }
                        }

                        if ((this.currentCharacter == '-') || (this.currentCharacter == '+')) { // consume next
                                                                                                // character
                            this.unicodeAsBackSlash = false;
                            if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                && (this.source[this.currentPosition] == 'u')) {
                                getNextUnicodeChar();
                            } else {
                                if (this.withoutUnicodePtr != 0) {
                                    unicodeStore();
                                }
                            }
                        }
                        if (!ScannerHelper.isDigit(this.currentCharacter)) {
                            if (this.currentCharacter == '_') {
                                // wrongly place '_'
                                consumeDigits();
                                throw invalidUnderscore();
                            }
                            throw invalidHexa();
                        }
                        consumeDigits();
                        if (getNextChar('f', 'F') >= 0) {
                            return TokenNameFloatingPointLiteral;
                        }
                        if (getNextChar('d', 'D') >= 0) {
                            return TokenNameDoubleLiteral;
                        }
                        if (getNextChar('l', 'L') >= 0) {
                            throw invalidHexa();
                        }
                        return TokenNameDoubleLiteral;
                    } else {
                        throw invalidHexa();
                    }
                } else if (getNextChar('p', 'P') >= 0) { // consume next character
                    if (end == start) { // Has no digits before exponent
                        throw invalidHexa();
                    }
                    this.unicodeAsBackSlash = false;
                    if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                        && (this.source[this.currentPosition] == 'u')) {
                        getNextUnicodeChar();
                    } else {
                        if (this.withoutUnicodePtr != 0) {
                            unicodeStore();
                        }
                    }

                    if ((this.currentCharacter == '-') || (this.currentCharacter == '+')) { // consume next character
                        this.unicodeAsBackSlash = false;
                        if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                            && (this.source[this.currentPosition] == 'u')) {
                            getNextUnicodeChar();
                        } else {
                            if (this.withoutUnicodePtr != 0) {
                                unicodeStore();
                            }
                        }
                    }
                    if (!ScannerHelper.isDigit(this.currentCharacter)) {
                        if (this.currentCharacter == '_') {
                            // wrongly place '_'
                            consumeDigits();
                            throw invalidUnderscore();
                        }
                        throw invalidFloat();
                    }
                    consumeDigits();
                    if (getNextChar('f', 'F') >= 0) {
                        return TokenNameFloatingPointLiteral;
                    }
                    if (getNextChar('d', 'D') >= 0) {
                        return TokenNameDoubleLiteral;
                    }
                    if (getNextChar('l', 'L') >= 0) {
                        throw invalidHexa();
                    }
                    return TokenNameDoubleLiteral;
                } else {
                    if (end == start)
                        throw invalidHexa();
                    return TokenNameIntegerLiteral;
                }
            } else if (getNextChar('b', 'B') >= 0) { // ----------binary-----------------
                int start = this.currentPosition;
                consumeDigits(2, true);
                int end = this.currentPosition;
                if (end == start) {
                    throw invalidBinary();
                }
                if (getNextChar('l', 'L') >= 0) {
                    return TokenNameLongLiteral;
                }
                return TokenNameIntegerLiteral;
            }

            // there is no x or X nor b or B in the number
            // potential octal
            if (getNextCharAsDigit()) { // -------------potential octal-----------------
                consumeDigits();

                if (getNextChar('l', 'L') >= 0) {
                    return TokenNameLongLiteral;
                }

                if (getNextChar('f', 'F') >= 0) {
                    return TokenNameFloatingPointLiteral;
                }

                if (getNextChar('d', 'D') >= 0) {
                    return TokenNameDoubleLiteral;
                } else { // make the distinction between octal and float ....
                    boolean isInteger = true;
                    if (getNextChar('.')) {
                        isInteger = false;
                        consumeDigits();
                    }
                    if (getNextChar('e', 'E') >= 0) { // consume next character
                        isInteger = false;
                        this.unicodeAsBackSlash = false;
                        if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                            && (this.source[this.currentPosition] == 'u')) {
                            getNextUnicodeChar();
                        } else {
                            if (this.withoutUnicodePtr != 0) {
                                unicodeStore();
                            }
                        }

                        if ((this.currentCharacter == '-') || (this.currentCharacter == '+')) { // consume next
                                                                                                // character
                            this.unicodeAsBackSlash = false;
                            if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                                && (this.source[this.currentPosition] == 'u')) {
                                getNextUnicodeChar();
                            } else {
                                if (this.withoutUnicodePtr != 0) {
                                    unicodeStore();
                                }
                            }
                        }
                        if (!ScannerHelper.isDigit(this.currentCharacter)) {
                            if (this.currentCharacter == '_') {
                                // wrongly place '_'
                                consumeDigits();
                                throw invalidUnderscore();
                            }
                            throw invalidFloat();
                        }
                        consumeDigits();
                    }
                    if (getNextChar('f', 'F') >= 0)
                        return TokenNameFloatingPointLiteral;
                    if (getNextChar('d', 'D') >= 0 || !isInteger)
                        return TokenNameDoubleLiteral;
                    return TokenNameIntegerLiteral;
                }
            }
        }

        consumeDigits();

        if ((!dotPrefix) && (getNextChar('l', 'L') >= 0))
            return TokenNameLongLiteral;

        if ((!dotPrefix) && (getNextChar('.'))) { // decimal part that can be empty
            consumeDigits(10, true);
            floating = true;
        }

        // if floating is true both exponant and suffix may be optional

        if (getNextChar('e', 'E') >= 0) {
            floating = true;
            // consume next character
            this.unicodeAsBackSlash = false;
            if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                && (this.source[this.currentPosition] == 'u')) {
                getNextUnicodeChar();
            } else {
                if (this.withoutUnicodePtr != 0) {
                    unicodeStore();
                }
            }

            if ((this.currentCharacter == '-') || (this.currentCharacter == '+')) { // consume next character
                this.unicodeAsBackSlash = false;
                if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                    && (this.source[this.currentPosition] == 'u')) {
                    getNextUnicodeChar();
                } else {
                    if (this.withoutUnicodePtr != 0) {
                        unicodeStore();
                    }
                }
            }
            if (!ScannerHelper.isDigit(this.currentCharacter)) {
                if (this.currentCharacter == '_') {
                    // wrongly place '_'
                    consumeDigits();
                    throw invalidUnderscore();
                }
                throw invalidFloat();
            }
            // current character is a digit so we expect no digit first (the next character could be an underscore)
            consumeDigits();
        }

        if (getNextChar('d', 'D') >= 0)
            return TokenNameDoubleLiteral;
        if (getNextChar('f', 'F') >= 0)
            return TokenNameFloatingPointLiteral;

        // the long flag has been tested before

        return floating ? TokenNameDoubleLiteral : TokenNameIntegerLiteral;
    }

    public final void setSource(char[] sourceString) {
        // the source-buffer is set to sourceString

        int sourceLength;
        if (sourceString == null) {
            this.source = CharOperation.NO_CHAR;
            sourceLength = 0;
        } else {
            this.source = sourceString;
            sourceLength = sourceString.length;
        }
        this.startPosition = -1;
        this.eofPosition = sourceLength;
        this.initialPosition = this.currentPosition = 0;
        this.containsAssertKeyword = false;
        this.linePtr = -1;
        this.scanContext = null;
        this.insideModuleInfo = false;
    }

    /*
     * Should be used if a parse (usually a diet parse) has already been performed on the unit, so as to get the already
     * computed line end positions.
     */
    public final void setSource(char[] contents, CompilationResult compilationResult) {
        if (contents == null) {
            char[] cuContents = compilationResult.compilationUnit.getContents();
            setSource(cuContents);
        } else {
            setSource(contents);
        }
        int[] lineSeparatorPositions = compilationResult.lineSeparatorPositions;
        if (lineSeparatorPositions != null) {
            this.lineEnds = lineSeparatorPositions;
            this.linePtr = lineSeparatorPositions.length - 1;
        }
    }

    /*
     * Should be used if a parse (usually a diet parse) has already been performed on the unit, so as to get the already
     * computed line end positions.
     */
    public final void setSource(CompilationResult compilationResult) {
        setSource(null, compilationResult);
    }

    public void unicodeInitializeBuffer(int length) {
        this.withoutUnicodePtr = length;
        if (this.withoutUnicodeBuffer == null)
            this.withoutUnicodeBuffer = new char[length + (1 + 10)];
        int bLength = this.withoutUnicodeBuffer.length;
        if (1 + length >= bLength) {
            System.arraycopy(this.withoutUnicodeBuffer, 0, this.withoutUnicodeBuffer = new char[length + (1 + 10)], 0,
                bLength);
        }
        System.arraycopy(this.source, this.startPosition, this.withoutUnicodeBuffer, 1, length);
    }

    public void unicodeStore() {
        int pos = ++this.withoutUnicodePtr;
        if (this.withoutUnicodeBuffer == null)
            this.withoutUnicodeBuffer = new char[10];
        int length = this.withoutUnicodeBuffer.length;
        if (pos == length) {
            System.arraycopy(this.withoutUnicodeBuffer, 0, this.withoutUnicodeBuffer = new char[length * 2], 0, length);
        }
        this.withoutUnicodeBuffer[pos] = this.currentCharacter;
    }

// Vanguard Scanner - A Private utility helper class for the scanner.
    private static final class VanguardScanner extends Scanner {

        public VanguardScanner() {
            super(false /* comment */, false /* whitespace */);
        }

        @Override
        public int getNextToken() throws InvalidInputException {
            int token;
            if (this.nextToken != TokenNameNotAToken) {
                token = this.nextToken;
                this.nextToken = TokenNameNotAToken;
                return token; // presumed to be unambiguous.
            }
            if (this.scanContext == null) { // init lazily, since isInModuleDeclaration may need the parser to be known
                this.scanContext = isInModuleDeclaration() ? ScanContext.EXPECTING_KEYWORD : ScanContext.INACTIVE;
            }
            token = getNextToken0();
            if (areRestrictedModuleKeywordsActive()) {
                if (isRestrictedKeyword(token))
                    token = disambiguatedRestrictedKeyword(token);
                updateScanContext(token);
            } else if (token == TokenNameAT && atTypeAnnotation()) {
                if (((VanguardParser) this.activeParser).currentGoal == Goal.LambdaParameterListGoal) {
                    token = disambiguatedToken(token, this);
                } else {
                    token = TokenNameAT308;
                }
            }
            this.addTokenToLookBack(token);
            return token == TokenNameEOF ? TokenNameNotAToken : token;
        }
    }

    private static class Goal {

        final int first;      // steer the parser towards a single minded pursuit.
        final int[] follow;  // the definite terminal symbols that signal the successful reduction to goal.
        final int[] rules;

        static int LambdaParameterListRule = 0;
        static int IntersectionCastRule = 0;
        static int ReferenceExpressionRule = 0;
        static int VarargTypeAnnotationsRule = 0;

        static Goal LambdaParameterListGoal;
        static Goal IntersectionCastGoal;
        static Goal VarargTypeAnnotationGoal;
        static Goal ReferenceExpressionGoal;

        static {
            for (int i = 1; i <= 936; i++) {  // 0 == $acc
                // TODO: Change to switch
                if ("ParenthesizedLambdaParameterList".equals(Parser.name[Parser.non_terminal_index[Parser.lhs[i]]])) //$NON-NLS-1$
                    LambdaParameterListRule = i;
                else if ("ParenthesizedCastNameAndBounds".equals(Parser.name[Parser.non_terminal_index[Parser.lhs[i]]])) //$NON-NLS-1$
                    IntersectionCastRule = i;
                else if ("ReferenceExpressionTypeArgumentsAndTrunk" //$NON-NLS-1$
                    .equals(Parser.name[Parser.non_terminal_index[Parser.lhs[i]]]))
                    ReferenceExpressionRule = i;
                else if ("TypeAnnotations".equals(Parser.name[Parser.non_terminal_index[Parser.lhs[i]]])) //$NON-NLS-1$
                    VarargTypeAnnotationsRule = i;
            }
            LambdaParameterListGoal = new Goal(TokenNameARROW, new int[] { TokenNameARROW }, LambdaParameterListRule);
            IntersectionCastGoal = new Goal(TokenNameLPAREN, followSetOfCast(), IntersectionCastRule);
            VarargTypeAnnotationGoal
                = new Goal(TokenNameAT, new int[] { TokenNameELLIPSIS }, VarargTypeAnnotationsRule);
            ReferenceExpressionGoal
                = new Goal(TokenNameLESS, new int[] { TokenNameCOLON_COLON }, ReferenceExpressionRule);
        }

        Goal(int first, int[] follow, int rule) {
            this.first = first;
            this.follow = follow;
            this.rules = new int[] { rule };
        }

        boolean hasBeenReached(int act, int token) {
            boolean foundRule = false;
            for (int i : this.rules) {
                if (act == i) {
                    foundRule = true;
                    break;
                }
            }
            if (foundRule) {
                final int length = this.follow.length;
                if (length == 0)
                    return true;
                for (int terminalToken : this.follow)
                    if (terminalToken == token)
                        return true;
            }
            return false;
        }

        private static int[] followSetOfCast() {
            return new int[] {
                TokenNameIdentifier,
                TokenNamenew,
                TokenNamesuper,
                TokenNamethis,
                TokenNamefalse,
                TokenNametrue,
                TokenNamenull,
                TokenNameIntegerLiteral,
                TokenNameLongLiteral,
                TokenNameFloatingPointLiteral,
                TokenNameDoubleLiteral,
                TokenNameCharacterLiteral,
                TokenNameStringLiteral,
                TokenNameNOT,
                TokenNameTWIDDLE,
                TokenNameLPAREN };
        }
    }

// Vanguard Parser - A Private utility helper class for the scanner.
    private static class VanguardParser extends Parser {

        Goal currentGoal;

        public VanguardParser(VanguardScanner scanner) {
            this.scanner = scanner;
        }

        public VanguardParser(ProblemHandler reporter) {
            super(reporter);
        }

        // Canonical LALR pushdown automaton identical to Parser.parse() minus side effects of any kind, returns the
        // rule reduced.
        protected boolean parse(Goal goal) {
            this.currentGoal = goal;
            try {
                int act = 991;
                this.stateStackTop = -1;
                this.currentToken = goal.first;
                for (;;) {
                    int stackLength = this.stack.length;
                    if (++this.stateStackTop >= stackLength) {
                        System.arraycopy(this.stack, 0, this.stack = new int[stackLength + 255], 0, stackLength);
                    }
                    this.stack[this.stateStackTop] = act;

                    act = Parser.tAction(act, this.currentToken);
                    if (act == 17981) {
                        return false;
                    }
                    if (act <= 936) {
                        this.stateStackTop--;
                    } else if (act > 17981) { /* shift-reduce */
                        this.unstackedAct = act;
                        try {
                            this.currentToken = this.scanner.getNextToken();
                        } finally {
                            this.unstackedAct = 17981;
                        }
                        act -= 17981;
                    } else {
                        if (act < 17980) { /* shift */
                            this.unstackedAct = act;
                            try {
                                this.currentToken = this.scanner.getNextToken();
                            } finally {
                                this.unstackedAct = 17981;
                            }
                            continue;
                        }
                        return false; // accept - we should never reach this state, we accept at reduce with a right
                        // member of follow set below.
                    }

                    // ProcessNonTerminals :
                    do { /* reduce */
                        if (goal.hasBeenReached(act, this.currentToken))
                            return true;
                        this.stateStackTop -= (Parser.rhs[act] - 1);
                        act = Parser.ntAction(this.stack[this.stateStackTop], Parser.lhs[act]);
                    } while (act <= 936);
                }
            } catch (Exception e) {
                return false;
            }
        }

    }

    private static class ModuleScanContextDetector extends VanguardParser {
        ModuleScanContextDetector() {
            super(new ProblemHandler());
        }

        @Override
        public void initializeScanner() {
            this.scanner = new Scanner(false /* comment */, false /* whitespace */) {
                @Override
                void updateScanContext(int token) {
                    if (token != TokenNameEOF)
                        super.updateScanContext(token);
                }
            };
            this.scanner.recordLineSeparator = false;
            this.scanner.setActiveParser(this);
        }

        @Override
        public boolean isParsingModuleDeclaration() {
            return true; // for Modules only
        }

        public ScanContext getScanContext(char[] src, int begin) {
            this.scanner.setSource(src);
            this.scanner.resetTo(0, begin, true);
            goForCompilationUnit();
            Goal goal = new Goal(TokenNamePLUS_PLUS, null, 0) {
                @Override
                boolean hasBeenReached(int act, int token) {
                    return token == TokenNameEOF;
                }
            };
            parse(goal);
            return this.scanner.scanContext;
        }
    }

    private VanguardParser getVanguardParser() {
        if (this.vanguardParser == null) {
            this.vanguardScanner = new VanguardScanner();
            this.vanguardParser = new VanguardParser(this.vanguardScanner);
            this.vanguardScanner.setActiveParser(this.vanguardParser);
        }
        this.vanguardScanner.setSource(this.source);
        this.vanguardScanner.resetTo(this.startPosition, this.eofPosition - 1, isInModuleDeclaration(),
            this.scanContext);
        return this.vanguardParser;
    }

    protected final boolean maybeAtLambdaOrCast() { // Could the '(' we saw just now herald a lambda parameter list or a
                                                    // cast expression ? (the possible locations for both are
                                                    // identical.)

        if (isInModuleDeclaration())
            return false;
        return switch (this.lookBack[1]) {
            case TokenNameIdentifier, TokenNamecatch, TokenNamethis, TokenNamesuper, TokenNameif, TokenNameswitch, TokenNamewhile, TokenNamefor, TokenNamecase, TokenNamesynchronized, TokenNametry -> false; // not
                                                                                                                                                                                                              // a
                                                                                                                                                                                                              // viable
                                                                                                                                                                                                              // prefix
                                                                                                                                                                                                              // for
                                                                                                                                                                                                              // cast
                                                                                                                                                                                                              // or
                                                                                                                                                                                                              // lambda.

            default -> this.activeParser.atConflictScenario(TokenNameLPAREN);
        };
    }

    protected final boolean maybeAtReferenceExpression() { // Did the '<' we saw just now herald a reference
                                                           // expression's type arguments and trunk ?
        if (isInModuleDeclaration())
            return false;
        switch (this.lookBack[1]) {
            case TokenNameIdentifier:
                switch (this.lookBack[0]) {
                    case TokenNameSEMICOLON:  // for (int i = 0; i < 10; i++);
                    case TokenNameRBRACE:     // class X { void foo() {} X<String> x = null; }
                    case TokenNameclass:      // class X<T> {}
                    case TokenNameinterface:  // interface I<T> {}
                    case TokenNameenum:       // enum E<T> {}
                    case TokenNamefinal:      // final Collection<String>
                    case TokenNameLESS:       // Collection<IScalarData<AbstractData>>
                    case TokenNameGREATER:    // public <T> List<T> foo() { /* */ }
                    case TokenNameRIGHT_SHIFT:// static <T extends SelfType<T>> List<T> makeSingletonList(T t) { /* */ }
                    case TokenNamenew:        // new ArrayList<String>();
                    case TokenNamepublic:     // public List<String> foo() {}
                    case TokenNameabstract:   // abstract List<String> foo() {}
                    case TokenNameprivate:    // private List<String> foo() {}
                    case TokenNameprotected:  // protected List<String> foo() {}
                    case TokenNamestatic:     // public static List<String> foo() {}
                    case TokenNameextends:    // <T extends Y<Z>>
                    case TokenNamesuper:      // ? super Context<N>
                    case TokenNameAND:        // T extends Object & Comparable<? super T>
                    case TokenNameimplements: // class A implements I<Z>
                    case TokenNamethrows:     // throws Y<Z>
                    case TokenNameAT:         // @Deprecated <T> void foo() {}
                    case TokenNameinstanceof: // if (o instanceof List<E>[])
                    case TokenNamedefault:
                        return false;

                    default:
                        break;
                }
                break;

            case TokenNameNotAToken: // Not kosher, don't touch.
                break;

            default:
                return false;
        }
        return this.activeParser.atConflictScenario(TokenNameLESS);
    }

    private boolean maybeAtEllipsisAnnotationsStart() { // Did the '@' we saw just now herald a type annotation on
                                                        // a ... ? Presumed to be at type annotation already.
        if (this.consumingEllipsisAnnotations)
            return false;
        return switch (this.lookBack[1]) {
            case TokenNamenew, TokenNameCOMMA, TokenNameextends, TokenNamesuper, TokenNameimplements, TokenNameDOT, TokenNameLBRACE, TokenNameinstanceof, TokenNameLESS, TokenNameAND, TokenNamethrows -> false;
            default -> true;
        };
    }

    protected final boolean atTypeAnnotation() { // Did the '@' we saw just now herald a type annotation ? We should not
                                                 // ask the parser whether it would shift @308 !
        return !this.activeParser.atConflictScenario(TokenNameAT);
    }

    public void setActiveParser(ConflictedParser parser) {
        this.activeParser = parser;
        this.resetLookBack();  // no hand me downs please.
        if (parser != null) {
            this.insideModuleInfo = parser.isParsingModuleDeclaration();
        }
    }

    public static boolean isRestrictedKeyword(int token) {
        return switch (token) {
            case TokenNameopen, TokenNamemodule, TokenNamerequires, TokenNametransitive, TokenNameexports, TokenNameto, TokenNameopens, TokenNameuses, TokenNameprovides, TokenNamewith -> true;
            default -> false;
        };
    }

    int disambiguatedRestrictedKeyword(int restrictedKeywordToken) {
        int token = restrictedKeywordToken;
        if (this.scanContext == ScanContext.EXPECTING_IDENTIFIER)
            return TokenNameIdentifier;

        switch (restrictedKeywordToken) {
            case TokenNametransitive:
                if (this.scanContext != ScanContext.AFTER_REQUIRES) {
                    token = TokenNameIdentifier;
                } else {
                    if (lookAhead() == TokenNameSEMICOLON)
                        token = TokenNameIdentifier;
                }
                break;

            case TokenNamemodule:
            case TokenNameopen:
            case TokenNameexports:
            case TokenNameopens:
            case TokenNamerequires:
            case TokenNameprovides:
            case TokenNameuses:
            case TokenNameto:
            case TokenNamewith:
                if (this.scanContext != ScanContext.EXPECTING_KEYWORD) {
                    token = TokenNameIdentifier;
                }
                break;

            default:
                break;
        }
        return token;
    }

    int lookAhead() {

        getVanguardParser();
        this.vanguardScanner.resetTo(this.currentPosition, this.eofPosition - 1, true,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Scanner.ScanContext.EXPECTING_IDENTIFIER);
        try {
            return this.vanguardScanner.getNextToken();
        } catch (InvalidInputException e) {
            return TokenNameNotAToken;
        }
    }

    int disambiguatedToken(int token, Scanner scanner) {
        final VanguardParser parser = getVanguardParser();
        if (token == TokenNameLPAREN && maybeAtLambdaOrCast()) {
            if (parser.parse(Goal.LambdaParameterListGoal)) {
                scanner.nextToken = TokenNameLPAREN;
                return TokenNameBeginLambda;
            }
            scanner.vanguardScanner.resetTo(scanner.startPosition, scanner.eofPosition - 1);
            if (parser.parse(Goal.IntersectionCastGoal)) {
                scanner.nextToken = TokenNameLPAREN;
                return TokenNameBeginIntersectionCast;
            }
        } else if (token == TokenNameLESS && maybeAtReferenceExpression()) {
            if (parser.parse(Goal.ReferenceExpressionGoal)) {
                scanner.nextToken = TokenNameLESS;
                return TokenNameBeginTypeArguments;
            }
        } else if (token == TokenNameAT && atTypeAnnotation()) {
            token = TokenNameAT308;
            if (maybeAtEllipsisAnnotationsStart()) {
                if (parser.parse(Goal.VarargTypeAnnotationGoal)) {
                    scanner.consumingEllipsisAnnotations = true;
                    scanner.nextToken = TokenNameAT308;
                    return TokenNameAT308DOTDOTDOT;
                }
            }
        }
        return token;
    }

    protected static InvalidInputException invalidCharacter() {
        return new InvalidInputException("Invalid_Character_Constant");
    }

    protected static InvalidInputException invalidCharInString() {
        return new InvalidInputException("Invalid_Char_In_String");
    }

    protected static InvalidInputException unterminatedString() {
        return new InvalidInputException("Unterminated_String");
    }

    protected static InvalidInputException invalidUnicodeEscape() {
        return new InvalidInputException("Invalid_Unicode_Escape");
    }

    protected static InvalidInputException invalidLowSurrogate() {
        return new InvalidInputException("Invalid_Low_Surrogate");
    }

    protected static InvalidInputException invalidHighSurrogate() {
        return new InvalidInputException("Invalid_High_Surrogate");
    }

    protected static InvalidInputException unterminatedComment() {
        return new InvalidInputException("Unterminated_Comment");
    }

    protected static InvalidInputException invalidEof() {
        return new InvalidInputException("Ctrl-Z"); //$NON-NLS-1$
    }

    protected static InvalidInputException invalidUnderscore() {
        return new InvalidInputException("Invalid_Underscore");
    }

    protected static InvalidInputException invalidEscape() {
        return new InvalidInputException("Invalid_Escape");
    }

    protected static InvalidInputException invalidHexa() {
        return new InvalidInputException("Invalid_Hexa_Literal");
    }

    protected static InvalidInputException invalidFloat() {
        return new InvalidInputException("Invalid_Float_Literal");
    }

    protected static InvalidInputException invalidBinary() {
        return new InvalidInputException("Invalid_Binary_Literal");
    }

    public static InvalidInputException invalidInput() {
        return new InvalidInputException();
    }

    public void copyCommentInfo(int to, int from) {
        this.commentStarts[to] = this.commentStarts[from];
        this.commentStops[to] = this.commentStops[from];
        this.commentTagStarts[to] = this.commentTagStarts[from];
    }

    public void copyAllCommentInfo(int from, int length) {

        System.arraycopy(this.commentStarts, from, this.commentStarts, 0, length);
        System.arraycopy(this.commentStops, from, this.commentStops, 0, length);
        System.arraycopy(this.commentTagStarts, from, this.commentTagStarts, 0, length);
    }

    protected void growCommentInfoArrays(int length, int newLength) {
        System.arraycopy(this.commentStops, 0, this.commentStops = new int[newLength], 0, length);
        System.arraycopy(this.commentStarts, 0, this.commentStarts = new int[newLength], 0, length);
        System.arraycopy(this.commentTagStarts, 0, this.commentTagStarts = new int[newLength], 0, length);
    }
}
