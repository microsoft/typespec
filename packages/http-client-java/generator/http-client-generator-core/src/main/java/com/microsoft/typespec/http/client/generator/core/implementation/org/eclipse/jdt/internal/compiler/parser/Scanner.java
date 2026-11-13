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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.*;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.DefaultErrorHandlingPolicies;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.IProblemFactory;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.CompilerOptions;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.JavaFeature;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.ProblemHandler;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.CharDeduplication;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;
import java.util.ArrayList;
import java.util.List;

/**
 * IMPORTANT NOTE: Internal Scanner implementation. It uses TerminalToken which constant values reflect the latest
 * parser generation state.
 */
public class Scanner {

    /*
     * APIs ares - getNextToken() which return the current type of the token (this value is not memorized by the
     * scanner) - getCurrentTokenSource() which provides with the token "REAL" source (aka all unicode have been
     * transformed into a correct char) - sourceStart gives the position into the stream - currentPosition-1 gives the
     * sourceEnd position into the stream
     */
    public long sourceLevel;
    public long complianceLevel;

    // 1.4 feature
    public boolean useAssertAsAnIndentifier = false;
    // flag indicating if processed source contains occurrences of keyword assert
    public boolean containsAssertKeyword = false;
    public boolean previewEnabled;

    // 1.5 feature
    public boolean useEnumAsAnIndentifier = false;

    public boolean recordLineSeparator = false;
    public char currentCharacter;
    public int startPosition;
    public int currentPosition;
    public int initialPosition, eofPosition;

    public boolean skipComments = false;
    public boolean tokenizeComments = false;
    public boolean tokenizeWhiteSpace = false;

    // source should be viewed as a window (aka a part)
    // of a entire very large stream
    public char source[];

    // unicode support
    public char[] withoutUnicodeBuffer;
    public int withoutUnicodePtr; // when == 0 ==> no unicode in the current token
    public boolean unicodeAsBackSlash = false;

    public int[] commentStops = new int[30];
    public int[] commentStarts = new int[30];
    public boolean[] commentIsMarkdown = new boolean[30];
    public int[] commentTagStarts = new int[30];
    public int commentPtr = -1; // no comment test with commentPtr value -1
    public int lastCommentLinePosition = -1;

    // task tag support
    public char[][] foundTaskTags = null;
    public char[][] foundTaskMessages;
    public char[][] foundTaskPriorities = null;
    public int[][] foundTaskPositions;
    public int foundTaskCount = 0;
    public char[][] taskTags = null;
    public char[][] taskPriorities = null;
    public boolean isTaskCaseSensitive = true;

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
    enum ScanContext {
        EXPECTING_KEYWORD, EXPECTING_IDENTIFIER, AFTER_REQUIRES, AFTER_IMPORT, INACTIVE
    }

    protected ScanContext scanContext = null;
    protected boolean insideModuleInfo = false;

    // support for detecting non-externalized string literals
    public static final char[] TAG_PREFIX = "//$NON-NLS-".toCharArray(); //$NON-NLS-1$

    // support for complaining on uninterned type comparisons.
    public static final char[] IDENTITY_COMPARISON_TAG = "//$IDENTITY-COMPARISON$".toCharArray(); //$NON-NLS-1$
    public boolean[] validIdentityComparisonLines;
    public boolean checkUninternedIdentityComparison;

    private NLSTag[] nlsTags = null;
    protected int nlsTagsPtr;
    public boolean checkNonExternalizedStringLiterals;

    protected int lastPosition;

    // generic support
    public boolean returnOnlyGreater = false;

    /**
     * Look back for the two most recent tokens. <ul> <li><code>lookBack[1]</code> is the previous token</li>
     * <li><code>lookBack[0]</code> is the token before <code>lookBack[1]</code></li> </ul> As this look back is
     * intended for resolving ambiguities and conflicts, it ignores whitespace and comments.
     *
     * @see #resetLookBack() Reset the look back and clear all stored tokens
     * @see #addTokenToLookBack(TerminalToken) Add a token to the look back, removing the oldest entry
     */
    TerminalToken lookBack[] = new TerminalToken[2]; // fall back to spring forward.
    protected TerminalToken nextToken = TerminalToken.TokenNameNotAToken; // allows for one token push back, only the
    private VanguardScanner vanguardScanner;
    private VanguardParser vanguardParser;
    ConflictedParser activeParser = null;
    private boolean consumingEllipsisAnnotations = false;
    public boolean scanningSwitchLabel = false;

    // Text block support - Java 15
    private StringBuilder normalizedTextBlock = new StringBuilder();

    private final CharDeduplication deduplication = CharDeduplication.getThreadLocalInstance();

    public Scanner(boolean tokenizeComments, boolean tokenizeWhiteSpace, boolean checkNonExternalizedStringLiterals,
        long sourceLevel, long complianceLevel, char[][] taskTags, char[][] taskPriorities, boolean isTaskCaseSensitive,
        boolean isPreviewEnabled) {
        this.eofPosition = Integer.MAX_VALUE;
        this.tokenizeComments = tokenizeComments;
        this.tokenizeWhiteSpace = tokenizeWhiteSpace;
        this.sourceLevel = sourceLevel;
        this.resetLookBack();
        this.nextToken = TokenNameNotAToken;
        this.consumingEllipsisAnnotations = false;
        this.complianceLevel = complianceLevel;
        this.checkNonExternalizedStringLiterals = checkNonExternalizedStringLiterals;
        this.previewEnabled = isPreviewEnabled;
        this.scanningSwitchLabel = false;
        if (taskTags != null) {
            int taskTagsLength = taskTags.length;
            int length = taskTagsLength;
            if (taskPriorities != null) {
                int taskPrioritiesLength = taskPriorities.length;
                if (taskPrioritiesLength != taskTagsLength) {
                    if (taskPrioritiesLength > taskTagsLength) {
                        System.arraycopy(taskPriorities, 0, (taskPriorities = new char[taskTagsLength][]), 0,
                            taskTagsLength);
                    } else {
                        System.arraycopy(taskTags, 0, (taskTags = new char[taskPrioritiesLength][]), 0,
                            taskPrioritiesLength);
                        length = taskPrioritiesLength;
                    }
                }
                int[] initialIndexes = new int[length];
                for (int i = 0; i < length; i++) {
                    initialIndexes[i] = i;
                }
                Util.reverseQuickSort(taskTags, 0, length - 1, initialIndexes);
                char[][] temp = new char[length][];
                for (int i = 0; i < length; i++) {
                    temp[i] = taskPriorities[initialIndexes[i]];
                }
                this.taskPriorities = temp;
            } else {
                Util.reverseQuickSort(taskTags, 0, length - 1);
            }
            this.taskTags = taskTags;
            this.isTaskCaseSensitive = isTaskCaseSensitive;
        }
    }

    public Scanner(boolean tokenizeComments, boolean checkNonExternalizedStringLiterals, long sourceLevel,
        char[][] taskTags, char[][] taskPriorities, boolean isTaskCaseSensitive, boolean isPreviewEnabled) {
        this(tokenizeComments, false, checkNonExternalizedStringLiterals, sourceLevel, sourceLevel, taskTags,
            taskPriorities, isTaskCaseSensitive, isPreviewEnabled);
    }

    public final boolean atEnd() {
        // This code is not relevant if source is
        // Only a part of the real stream input

        return this.eofPosition <= this.currentPosition;
    }

// chech presence of task: tags
// TODO (frederic) see if we need to take unicode characters into account...
    public void checkTaskTag(int commentStart, int commentEnd) throws InvalidInputException {
        char[] src = this.source;

        // only look for newer task: tags
        if (this.foundTaskCount > 0 && this.foundTaskPositions[this.foundTaskCount - 1][0] >= commentStart) {
            return;
        }
        int foundTaskIndex = this.foundTaskCount;
        char previous = src[commentStart + 1]; // should be '*' or '/'
        for (int i = commentStart + 2; i < commentEnd && i < this.eofPosition; i++) {
            char[] tag = null;
            char[] priority = null;
            // check for tag occurrence only if not ambiguous with javadoc tag
            if (previous != '@') {
                nextTag: for (int itag = 0; itag < this.taskTags.length; itag++) {
                    tag = this.taskTags[itag];
                    int tagLength = tag.length;
                    if (tagLength == 0)
                        continue nextTag;

                    // ensure tag is not leaded with letter if tag starts with a letter
                    if (ScannerHelper.isJavaIdentifierStart(this.complianceLevel, tag[0])) {
                        if (ScannerHelper.isJavaIdentifierPart(this.complianceLevel, previous)) {
                            continue nextTag;
                        }
                    }

                    for (int t = 0; t < tagLength; t++) {
                        char sc, tc;
                        int x = i + t;
                        if (x >= this.eofPosition || x >= commentEnd)
                            continue nextTag;
                        // case sensitive check
                        if ((sc = src[i + t]) != (tc = tag[t])) {
                            // case insensitive check
                            if (this.isTaskCaseSensitive
                                || (ScannerHelper.toLowerCase(sc) != ScannerHelper.toLowerCase(tc))) {
                                continue nextTag;
                            }
                        }
                    }
                    // ensure tag is not followed with letter if tag finishes with a letter
                    if (i + tagLength < commentEnd
                        && ScannerHelper.isJavaIdentifierPart(this.complianceLevel, src[i + tagLength - 1])) {
                        if (ScannerHelper.isJavaIdentifierPart(this.complianceLevel, src[i + tagLength]))
                            continue nextTag;
                    }
                    if (this.foundTaskTags == null) {
                        this.foundTaskTags = new char[5][];
                        this.foundTaskMessages = new char[5][];
                        this.foundTaskPriorities = new char[5][];
                        this.foundTaskPositions = new int[5][];
                    } else if (this.foundTaskCount == this.foundTaskTags.length) {
                        System.arraycopy(this.foundTaskTags, 0,
                            this.foundTaskTags = new char[this.foundTaskCount * 2][], 0, this.foundTaskCount);
                        System.arraycopy(this.foundTaskMessages, 0,
                            this.foundTaskMessages = new char[this.foundTaskCount * 2][], 0, this.foundTaskCount);
                        System.arraycopy(this.foundTaskPriorities, 0,
                            this.foundTaskPriorities = new char[this.foundTaskCount * 2][], 0, this.foundTaskCount);
                        System.arraycopy(this.foundTaskPositions, 0,
                            this.foundTaskPositions = new int[this.foundTaskCount * 2][], 0, this.foundTaskCount);
                    }

                    priority = this.taskPriorities != null && itag < this.taskPriorities.length
                        ? this.taskPriorities[itag]
                        : null;

                    this.foundTaskTags[this.foundTaskCount] = tag;
                    this.foundTaskPriorities[this.foundTaskCount] = priority;
                    this.foundTaskPositions[this.foundTaskCount] = new int[] { i, i + tagLength - 1 };
                    this.foundTaskMessages[this.foundTaskCount] = CharOperation.NO_CHAR;
                    this.foundTaskCount++;
                    i += tagLength - 1; // will be incremented when looping
                    break nextTag;
                }
            }
            previous = src[i];
        }
        boolean containsEmptyTask = false;
        for (int i = foundTaskIndex; i < this.foundTaskCount; i++) {
            // retrieve message start and end positions
            int msgStart = this.foundTaskPositions[i][0] + this.foundTaskTags[i].length;
            int max_value = i + 1 < this.foundTaskCount ? this.foundTaskPositions[i + 1][0] - 1 : commentEnd - 1;
            // at most beginning of next task
            if (max_value < msgStart) {
                max_value = msgStart; // would only occur if tag is before EOF.
            }
            int end = -1;
            char c;
            for (int j = msgStart; j < max_value; j++) {
                if ((c = src[j]) == '\n' || c == '\r') {
                    end = j - 1;
                    break;
                }
            }
            if (end == -1) {
                for (int j = max_value; j > msgStart; j--) {
                    if ((c = src[j]) == '*') {
                        end = j - 1;
                        break;
                    }
                }
                if (end == -1)
                    end = max_value;
            }
            if (msgStart == end) {
                // if the description is empty, we might want to see if two tags are not sharing the same message
                // see https://bugs.eclipse.org/bugs/show_bug.cgi?id=110797
                containsEmptyTask = true;
                continue;
            }
            // trim the message
            // we don't trim the beginning of the message to be able to show it after the task tag
            while (CharOperation.isWhitespace(src[end]) && msgStart <= end)
                end--;
            // update the end position of the task
            this.foundTaskPositions[i][1] = end;
            // get the message source
            final int messageLength = end - msgStart + 1;
            char[] message = new char[messageLength];
            System.arraycopy(src, msgStart, message, 0, messageLength);
            this.foundTaskMessages[i] = message;
        }
        if (containsEmptyTask) {
            for (int i = foundTaskIndex, max = this.foundTaskCount; i < max; i++) {
                if (this.foundTaskMessages[i].length == 0) {
                    loop: for (int j = i + 1; j < max; j++) {
                        if (this.foundTaskMessages[j].length != 0) {
                            this.foundTaskMessages[i] = this.foundTaskMessages[j];
                            this.foundTaskPositions[i][1] = this.foundTaskPositions[j][1];
                            break loop;
                        }
                    }
                }
            }
        }
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

        if (this.lookBack[1] == TokenNameTextBlock)
            return getCurrentTextBlock();

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

    public final String getCurrentTokenString() {
        // Return current token as a string
        if (this.lookBack[1] == TokenNameTextBlock)
            return new String(getCurrentTextBlock());

        if (this.withoutUnicodePtr != 0) {
            // 0 is used as a fast test flag so the real first char is in position 1
            return new String(this.withoutUnicodeBuffer, 1, this.withoutUnicodePtr);
        }
        return new String(this.source, this.startPosition, this.currentPosition - this.startPosition);
    }

    public char[] getCurrentTokenSourceString() {
        // return the token REAL source (aka unicodes are precomputed).
        // REMOVE the two " that are at the beginning and the end.

        if (this.lookBack[1] == TokenNameTextBlock)
            return getCurrentTextBlock();

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

    protected boolean atTextBlockDelimiter(boolean checkingEnd) {
        int savedCurrentPosition = this.currentPosition;
        int savedWithoutUnicodePtr = this.withoutUnicodePtr;
        boolean validDelimiter = false;
        try {
            if (getNextChar() == '\"' && getNextChar() == '\"') {
                if (checkingEnd) {
                    validDelimiter = true;
                } else {
                    int c;
                    while (ScannerHelper.isWhitespace((char) (c = getNextChar()))) {
                        if (c == '\n') {
                            validDelimiter = true;
                            break;
                        }
                    }
                }
            }
        } catch (IndexOutOfBoundsException e) {
            validDelimiter = false;
        } finally {
            if (!validDelimiter) { // roll back all side effects.
                this.currentPosition = savedCurrentPosition;
                this.unicodeAsBackSlash = false;
                this.withoutUnicodePtr = savedWithoutUnicodePtr;
                this.currentCharacter = '"';
            }
        }
        return validDelimiter;
    }

    private final boolean atTextBlockStart() {
        return atTextBlockDelimiter(false);
    }

    private final boolean atTextBlockEnd() {
        return atTextBlockDelimiter(true);
    }

    protected final boolean lineBeginsWithMarkdown() throws InvalidInputException {
        try {
            int temp = this.currentPosition;
            int count = 0;
            // The scanner is already at \r, look for matching \n
            if (this.currentCharacter == '\r') {
                char c = this.source[temp];
                if (c == '\\') {
                    if (this.source[temp + 1] == 'u') {
                        getNextUnicodeChar();
                        if (this.currentCharacter == '\n') {
                            pushUnicodeLineSeparator();
                        }
                        temp = this.currentPosition;
                    }
                } else if (c == '\n') {
                    temp++;
                }
            }
            while (true) {
                char c = this.source[temp++];
                switch (c) {
                    case '/':
                        if (++count > 2) {
                            this.currentPosition = temp;
                            return true;
                        }
                        break;

                    case '\n':
                        return false;

                    default:
                        if (ScannerHelper.isWhitespace(c)) {
                            if (count == 0)
                                break;
                        } else {
                            return false;
                        }
                }
            }
        } catch (IndexOutOfBoundsException e) {
            // let it return false;
        }
        return false;
    }

    public char[] getCurrentTextBlock() {
        String normalizedBlock = this.normalizedTextBlock.toString();
        try {
            return normalizedBlock.stripIndent().translateEscapes().toCharArray();
        } catch (Exception e) {
            return normalizedBlock.toCharArray(); // errors are reported already, just return original.
        }
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

    /**
     * Search the source position corresponding to the beginning of a given line number
     *
     * Line numbers are 1-based, and relative to the scanner initialPosition. Character positions are 0-based.
     *
     * e.g. getLineStart(1) --> 0 indicates that the first line starts at character 0.
     *
     * In case the given line number is inconsistent, answers -1.
     *
     * @param lineNumber int
     * @return int
     */
    public final int getLineStart(int lineNumber) {
        if (this.lineEnds == null || this.linePtr == -1)
            return -1;
        if (lineNumber > this.lineEnds.length + 1)
            return -1;
        if (lineNumber <= 0)
            return -1;

        if (lineNumber == 1)
            return this.initialPosition;
        return this.lineEnds[lineNumber - 2] + 1; // next line start one character behind the lineEnd of the previous
                                                  // line
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
                return true;
            } // -------------end unicode traitement--------------
            else {
                if (this.currentCharacter != testedChar) {
                    this.currentPosition = temp;
                    return false;
                }
                this.unicodeAsBackSlash = false;
                if (this.withoutUnicodePtr != 0)
                    unicodeStore();
                return true;
            }
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
                return result;
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
                return result;
            }
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
    private final void consumeDigits() throws InvalidInputException {

        consumeDigits(10, false);
    }

    /*
     * This method consumes digits as well as underscores if underscores are located between digits
     *
     * @throws InvalidInputException if underscores are not located between digits
     */
    private final void consumeDigits(int radix, boolean expectingDigitFirst) throws InvalidInputException {

        switch (consumeDigits0(radix, 1, 2, expectingDigitFirst)) {
            case 1:
                break;

            case 2:
                throw invalidUnderscore();
        }
    }

    private final int consumeDigits0(int radix, int usingUnderscore, int invalidPosition, boolean expectingDigitFirst)
        throws InvalidInputException {
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

    public final boolean getNextCharAsDigit() throws InvalidInputException {
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
                return true;
            } else {
                if (!ScannerHelper.isDigit(this.currentCharacter)) {
                    this.currentPosition = temp;
                    return false;
                }
                if (this.withoutUnicodePtr != 0)
                    unicodeStore();
                return true;
            }
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
                return true;
            } else {
                if (ScannerHelper.digit(this.currentCharacter, radix) == -1) {
                    this.currentPosition = temp;
                    return false;
                }
                if (this.withoutUnicodePtr != 0)
                    unicodeStore();
                return true;
            }
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
            boolean isJavaIdentifierPart = false;
            if (c >= 55296 && c <= 56319) {
                // Unicode 4 detection
                char low = (char) getNextCharWithBoundChecks();
                if (low < 56320 || low > 57343) {
                    // illegal low surrogate
                    this.currentPosition = pos;
                    this.withoutUnicodePtr = temp2;
                    return false;
                }
                isJavaIdentifierPart = ScannerHelper.isJavaIdentifierPart(this.complianceLevel, c, low);
            } else if (c >= 56320 && c <= 57343) {
                this.currentPosition = pos;
                this.withoutUnicodePtr = temp2;
                return false;
            } else {
                isJavaIdentifierPart = ScannerHelper.isJavaIdentifierPart(this.complianceLevel, c);
            }
            if (unicode) {
                if (!isJavaIdentifierPart) {
                    this.currentPosition = pos;
                    this.withoutUnicodePtr = temp2;
                    return false;
                }
                return true;
            } else {
                if (!isJavaIdentifierPart) {
                    this.currentPosition = pos;
                    return false;
                }

                if (this.withoutUnicodePtr != 0)
                    unicodeStore();
                return true;
            }
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
            boolean isJavaIdentifierPart = false;
            if (c >= 55296 && c <= 56319) {
                // Unicode 4 detection
                char low = (char) getNextChar();
                if (low < 56320 || low > 57343) {
                    // illegal low surrogate
                    this.currentPosition = pos;
                    this.withoutUnicodePtr = temp2;
                    return false;
                }
                isJavaIdentifierPart = ScannerHelper.isJavaIdentifierPart(this.complianceLevel, c, low);
            } else if (c >= 56320 && c <= 57343) {
                this.currentPosition = pos;
                this.withoutUnicodePtr = temp2;
                return false;
            } else {
                isJavaIdentifierPart = ScannerHelper.isJavaIdentifierPart(this.complianceLevel, c);
            }
            if (unicode) {
                if (!isJavaIdentifierPart) {
                    this.currentPosition = pos;
                    this.withoutUnicodePtr = temp2;
                    return false;
                }
                return true;
            } else {
                if (!isJavaIdentifierPart) {
                    this.currentPosition = pos;
                    return false;
                }

                if (this.withoutUnicodePtr != 0)
                    unicodeStore();
                return true;
            }
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
    public TerminalToken scanIdentifier() throws InvalidInputException {
        int whiteStart = 0;
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
                    // isWhiteSpace =
                    // (this.currentCharacter == ' ') || ScannerHelper.isWhitespace(this.currentCharacter);
                    switch (this.currentCharacter) {
                        case 10: /* \ u000a: LINE FEED */
                        case 12: /* \ u000c: FORM FEED */
                        case 13: /* \ u000d: CARRIAGE RETURN */
                        case 32: /* \ u0020: SPACE */
                        case 9: /* \ u0009: HORIZONTAL TABULATION */
                            isWhiteSpace = true;
                            break;

                        default:
                            isWhiteSpace = false;
                    }
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
                isJavaIdStart = ScannerHelper.isJavaIdentifierStart(this.complianceLevel, c, low);
            } else if (c >= 56320 && c <= 57343) {
                throw invalidHighSurrogate();
            } else {
                // optimized case already checked
                isJavaIdStart = ScannerHelper.isJavaIdentifierStart(this.complianceLevel, c);
            }
            if (isJavaIdStart)
                return scanIdentifierOrKeywordWithBoundCheck();
            return TokenNameERROR;
        }
    }

    public TerminalToken getNextToken() throws InvalidInputException {
        TerminalToken token;
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
        if (token == TokenNameLPAREN || token == TokenNameLESS || token == TokenNameAT || token == TokenNameARROW) {
            token = disambiguatedToken(token, this);
        } else if (token == TokenNameELLIPSIS) {
            this.consumingEllipsisAnnotations = false;
        } else if (mayBeAtCasePattern(token)) {
            token = disambiguateCasePattern(token);
        }
        addTokenToLookBack(token);
        return token;
    }

    protected int findCommentType() {
        int test = getNextChar('/', '*');
        if (test == 0) { // line comment or markdown
            if (JavaFeature.MARKDOWN_COMMENTS.isSupported(this.complianceLevel, this.previewEnabled)
                && getNextChar('/')) {
                return 2;
            }
        }
        return test;
    }

    protected TerminalToken getNextToken0() throws InvalidInputException {
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
                        // isWhiteSpace =
                        // (this.currentCharacter == ' ') || ScannerHelper.isWhitespace(this.currentCharacter);
                        switch (this.currentCharacter) {
                            case 10: /* \ u000a: LINE FEED */
                            case 12: /* \ u000c: FORM FEED */
                            case 13: /* \ u000d: CARRIAGE RETURN */
                            case 32: /* \ u0020: SPACE */
                            case 9: /* \ u0009: HORIZONTAL TABULATION */
                                isWhiteSpace = true;
                                break;

                            default:
                                isWhiteSpace = false;
                        }
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
                        return processSingleQuotes(checkIfUnicode);

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
                                    if (this.taskTags != null)
                                        checkTaskTag(this.startPosition, this.currentPosition);
                                    if ((this.currentCharacter == '\r') || (this.currentCharacter == '\n')) {
                                        if ((this.checkNonExternalizedStringLiterals
                                            || this.checkUninternedIdentityComparison)
                                            && this.lastPosition < this.currentPosition) {
                                            parseTags();
                                        }
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
                                    if (this.taskTags != null)
                                        checkTaskTag(this.startPosition, this.currentPosition);
                                    if ((this.checkNonExternalizedStringLiterals
                                        || this.checkUninternedIdentityComparison)
                                        && this.lastPosition < this.currentPosition) {
                                        parseTags();
                                    }
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
                                    boolean isUnicode = false;
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
                                    isUnicode = false;
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
                                    TerminalToken token = isJavadoc ? TokenNameCOMMENT_JAVADOC : TokenNameCOMMENT_BLOCK;
                                    recordComment(token);
                                    this.commentTagStarts[this.commentPtr] = firstTag;
                                    if (this.taskTags != null)
                                        checkTaskTag(this.startPosition, this.currentPosition);
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
                            } else if (test == 2) { // markdown commments
                                // this block is mostly copied from the block (test == 1)
                                try {
                                    boolean isUnicode = false;
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

                                    if ((this.currentCharacter == '\r') || (this.currentCharacter == '\n')) {
                                        if (this.recordLineSeparator) {
                                            if (isUnicode) {
                                                pushUnicodeLineSeparator();
                                            } else {
                                                pushLineSeparator();
                                            }
                                        }
                                        if (!lineBeginsWithMarkdown()) {
                                            this.currentPosition--;
                                        }
                                    }
                                    isUnicode = false;
                                    previous = this.currentPosition;
                                    if ((this.currentPosition < this.eofPosition
                                        && (this.currentCharacter = this.source[this.currentPosition++]) == '\\')
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
                                    // loop as long as lines start with ///
                                    int firstTag = 0;
                                    while (true) {
                                        if (this.currentPosition == this.eofPosition) {
                                            break;
                                        }
                                        if ((this.currentCharacter == '\r') || (this.currentCharacter == '\n')) {
                                            if (this.recordLineSeparator) {
                                                if (isUnicode) {
                                                    pushUnicodeLineSeparator();
                                                } else {
                                                    pushLineSeparator();
                                                }
                                            }
                                            if (!lineBeginsWithMarkdown()) {
                                                break;
                                            }
                                        }
                                        switch (this.currentCharacter) {
                                            case '*':
                                                break;

                                            case '[':
                                            case '@':
                                                if ((firstTag == 0)) {
                                                    firstTag = previous;
                                                }
                                                break;
                                        }
                                        // get next char
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
                                                this.currentPosition++;
                                        } // jump over the \\
                                    }

                                    recordComment(TerminalToken.TokenNameCOMMENT_MARKDOWN);
                                    this.commentTagStarts[this.commentPtr] = firstTag;
                                    if (this.taskTags != null)
                                        checkTaskTag(this.startPosition, this.currentPosition);
                                    if (this.tokenizeComments) {
                                        return TerminalToken.TokenNameCOMMENT_MARKDOWN;
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
                            isJavaIdStart = ScannerHelper.isJavaIdentifierStart(this.complianceLevel, c, low);
                        } else if (c >= 56320 && c <= 57343) {
                            throw invalidHighSurrogate();
                        } else {
                            // optimized case already checked
                            isJavaIdStart = ScannerHelper.isJavaIdentifierStart(this.complianceLevel, c);
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

    protected TerminalToken processSingleQuotes(boolean checkIfUnicode) throws InvalidInputException {
        {
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
            checkIfUnicode = false;
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

    protected TerminalToken scanForStringLiteral() throws InvalidInputException {
        boolean isTextBlock = false;

        // consume next character
        this.unicodeAsBackSlash = false;
        boolean isUnicode = false;
        isTextBlock = atTextBlockStart();
        if (isTextBlock) {
            return scanForTextBlock();
        } else {
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
                                isUnicode = true;
                                this.withoutUnicodePtr--;
                            } else {
                                isUnicode = false;
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
    }

    protected TerminalToken scanForTextBlock() throws InvalidInputException {
        int doubleQuotes = 0;
        int lastQuotePos = 0;
        boolean sawCR = false;

        this.normalizedTextBlock.setLength(0); // normalized, unicode processed, escape sequences validated but
                                               // unprocessed contents
        if (this.recordLineSeparator)
            pushLineSeparator(); // we are at the \n post the opening """
        int rawStart = this.currentPosition - this.startPosition;
        try {
            while (true) {
                // consume next character
                this.unicodeAsBackSlash = false;
                if (((this.currentCharacter = this.source[this.currentPosition++]) == '\\')
                    && (this.source[this.currentPosition] == 'u')) {
                    getNextUnicodeChar();
                }
                switch (this.currentCharacter) {
                    case '\r':
                        if (this.recordLineSeparator)
                            pushLineSeparator();
                        this.normalizedTextBlock.append('\n');
                        sawCR = true;
                        doubleQuotes = 0;
                        break;

                    case '\n':
                        if (this.recordLineSeparator)
                            pushLineSeparator();
                        if (!sawCR) {
                            this.normalizedTextBlock.append('\n');
                        }
                        sawCR = false;
                        doubleQuotes = 0;
                        break;

                    case '"':
                        this.normalizedTextBlock.append(this.currentCharacter);
                        lastQuotePos = this.currentPosition;
                        if (++doubleQuotes == 3) {
                            this.normalizedTextBlock.setLength(this.normalizedTextBlock.length() - 3);
                            return TerminalToken.TokenNameTextBlock;
                        }
                        sawCR = false;
                        break;

                    case '\\':
                        this.normalizedTextBlock.append(this.currentCharacter);
                        int thenPosition = this.currentPosition;
                        this.currentCharacter = this.source[this.currentPosition++];
                        if (this.currentCharacter == '\r' || this.currentCharacter == '\n') {
                            if (this.recordLineSeparator)
                                pushLineSeparator();
                        } else {
                            scanEscapeCharacter();
                        }
                        for (int i = thenPosition; i < this.currentPosition; i++)
                            this.normalizedTextBlock.append(this.source[i]);
                        sawCR = false;
                        doubleQuotes = 0;
                        break;

                    default:
                        this.normalizedTextBlock.append(this.currentCharacter);
                        sawCR = false;
                        doubleQuotes = 0;
                        break;
                }
            }
        } catch (IndexOutOfBoundsException e) {
            this.currentPosition = (lastQuotePos > 0) ? lastQuotePos : this.startPosition + rawStart;
            throw unterminatedTextBlock();
        }
    }

    public void getNextUnicodeChar() throws InvalidInputException {
        // VOID
        // handle the case of unicode.
        // when a unicode appears then we must use a buffer that holds char internal values
        // At the end of this method currentCharacter holds the new visited char
        // and currentPosition points right next after it

        // ALL getNextChar.... ARE OPTIMIZED COPIES
        int c1 = 0, c2 = 0, c3 = 0, c4 = 0, unicodeSize = 6;
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

    public NLSTag[] getNLSTags() {
        final int length = this.nlsTagsPtr;
        if (length != 0) {
            NLSTag[] result = new NLSTag[length];
            System.arraycopy(this.nlsTags, 0, result, 0, length);
            this.nlsTagsPtr = 0;
            return result;
        }
        return null;
    }

    public boolean[] getIdentityComparisonLines() {
        boolean[] retVal = this.validIdentityComparisonLines;
        this.validIdentityComparisonLines = null;
        return retVal;
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
                        break NextToken;

                    case '}':
                        found--;
                        if (found == 0)
                            return;
                        break NextToken;

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
                        break NextToken;
                    }

                    case '"':
                        boolean isTextBlock = false;
                        int firstClosingBrace = 0;
                        try {
                            try { // consume next character
                                isTextBlock = atTextBlockStart();
                                if (!isTextBlock) {
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
                            } catch (InvalidInputException ex) {
                                // ignore
                            }

                            Inner: while (this.currentPosition <= this.eofPosition) {
                                if (isTextBlock) {
                                    switch (this.currentCharacter) {
                                        case '"':
                                            // look for text block delimiter
                                            if (atTextBlockEnd()) {
                                                this.currentCharacter = this.source[this.currentPosition];
                                                isTextBlock = false;
                                                break Inner;
                                            }
                                            break;

                                        case '}':
                                            if (firstClosingBrace == 0)
                                                firstClosingBrace = this.currentPosition;
                                            break;

                                        case '\r':
                                            if (this.source[this.currentPosition] == '\n')
                                                this.currentPosition++;
                                            //$FALL-THROUGH$
                                        case '\n':
                                            pushLineSeparator();
                                            //$FALL-THROUGH$
                                        default:
                                            if (this.currentCharacter == '\\'
                                                && this.source[this.currentPosition] == '"') {
                                                this.currentPosition++;
                                            }
                                            this.currentCharacter = this.source[this.currentPosition++];
                                            continue Inner;
                                    }
                                } else if (this.currentCharacter == '"') {
                                    break Inner;
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
                            if (isTextBlock) {
                                // Pull it back to the first closing brace after the beginning
                                // of the unclosed text block and let recovery take over.
                                if (firstClosingBrace > 0) {
                                    this.currentPosition = firstClosingBrace - 1;
                                }
                            }
                        }
                        break NextToken;

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
                                    if ((this.checkNonExternalizedStringLiterals
                                        || this.checkUninternedIdentityComparison)
                                        && this.lastPosition < this.currentPosition) {
                                        parseTags();
                                    }
                                    if (this.recordLineSeparator) {
                                        if (isUnicode) {
                                            pushUnicodeLineSeparator();
                                        } else {
                                            pushLineSeparator();
                                        }
                                    }
                                }
                            } catch (IndexOutOfBoundsException e) {
                                // an eof will then be generated
                                this.currentPosition--;
                                recordComment(TokenNameCOMMENT_LINE);
                                if ((this.checkNonExternalizedStringLiterals || this.checkUninternedIdentityComparison)
                                    && this.lastPosition < this.currentPosition) {
                                    parseTags();
                                }
                                if (!this.tokenizeComments) {
                                    this.currentPosition++;
                                }
                            }
                            break NextToken;
                        } else if (test == 1) { // traditional and javadoc comment
                            boolean isJavadoc = false;
                            try { // get the next char
                                boolean star = false;
                                int previous;
                                boolean isUnicode = false;
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
                                isUnicode = false;
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
                            break NextToken;
                        } else if (test == 2) { // markdown commments
                            // this block is mostly copied from the block (test == 1)
                            try {
                                boolean isUnicode = false;
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

                                if ((this.currentCharacter == '\r') || (this.currentCharacter == '\n')) {
                                    if (this.recordLineSeparator) {
                                        if (isUnicode) {
                                            pushUnicodeLineSeparator();
                                        } else {
                                            pushLineSeparator();
                                        }
                                    }
                                    if (!lineBeginsWithMarkdown()) {
                                        this.currentPosition--;
                                    }
                                }
                                isUnicode = false;
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
                                // loop as long as lines start with ///
                                int firstTag = 0;
                                while (true) {
                                    if (this.currentPosition > this.eofPosition) {
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
                                        if (!lineBeginsWithMarkdown()) {
                                            this.currentPosition--;
                                            break;
                                        }
                                    }
                                    switch (this.currentCharacter) {
                                        case '*':
                                            break;

                                        case '[':
                                        case '@':
                                            if ((firstTag == 0)) {
                                                firstTag = previous;
                                            }
                                            break;
                                    }
                                    // get next char
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
                                            this.currentPosition++;
                                    } // jump over the \\
                                }
                                recordComment(TokenNameCOMMENT_MARKDOWN);
                                this.commentTagStarts[this.commentPtr] = firstTag;
                            } catch (IndexOutOfBoundsException e) {
                                return;
                            }
                            break NextToken;
                        }
                        break NextToken;
                    }

                    default:
                        try {
                            char c = this.currentCharacter;
                            if (c < 128) {
                                if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 64) != 0) {
                                    scanIdentifierOrKeyword();
                                    break NextToken;
                                } else if ((ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 4) != 0) {
                                    scanNumber(false);
                                    break NextToken;
                                } else {
                                    break NextToken;
                                }
                            }
                            boolean isJavaIdStart;
                            if (c >= 55296 && c <= 56319) {
                                // Unicode 4 detection
                                char low = (char) getNextChar();
                                if (low < 56320 || low > 57343) {
                                    // illegal low surrogate
                                    break NextToken;
                                }
                                isJavaIdStart = ScannerHelper.isJavaIdentifierStart(this.complianceLevel, c, low);
                            } else if (c >= 56320 && c <= 57343) {
                                break NextToken;
                            } else {
                                // optimized case already checked
                                isJavaIdStart = ScannerHelper.isJavaIdentifierStart(this.complianceLevel, c);
                            }
                            if (isJavaIdStart) {
                                scanIdentifierOrKeyword();
                                break NextToken;
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
        return;
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

    void updateScanContext(TerminalToken token) {
        if (this.scanContext == ScanContext.AFTER_IMPORT && !isInModuleDeclaration()) {
            this.scanContext = ScanContext.INACTIVE; // end temporary use of scanContext to disambiguate module imports
            return;
        }

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
            case TokenNameAT:
            case TokenNameAT308:
            case TokenNameCOMMA:
                this.scanContext = ScanContext.EXPECTING_IDENTIFIER;
                break;

            case TokenNameimport:
                this.scanContext = ScanContext.AFTER_IMPORT;
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

    private void parseTags() {
        int position = 0;
        final int currentStartPosition = this.startPosition;
        final int currentLinePtr = this.linePtr;
        if (currentLinePtr >= 0) {
            position = this.lineEnds[currentLinePtr] + 1;
        }
        while (ScannerHelper.isWhitespace(this.source[position])) {
            position++;
        }
        if (currentStartPosition == position) {
            // the whole line is commented out
            return;
        }
        char[] s = null;
        int sourceEnd = this.currentPosition;
        int sourceStart = currentStartPosition;
        int sourceDelta = 0;
        if (this.withoutUnicodePtr != 0) {
            // 0 is used as a fast test flag so the real first char is in position 1
            System.arraycopy(this.withoutUnicodeBuffer, 1, s = new char[this.withoutUnicodePtr], 0,
                this.withoutUnicodePtr);
            sourceEnd = this.withoutUnicodePtr;
            sourceStart = 1;
            sourceDelta = currentStartPosition;
        } else {
            s = this.source;
        }
        int pos;
        if (this.checkNonExternalizedStringLiterals
            && (pos = CharOperation.indexOf(TAG_PREFIX, s, sourceStart, sourceEnd)) != -1) {
            if (this.nlsTags == null) {
                this.nlsTags = new NLSTag[10];
                this.nlsTagsPtr = 0;
            }
            while (pos != -1) {
                int start = pos + 11;
                int end = CharOperation.indexOf(s, start, sourceEnd);
                if (end != -1) {
                    NLSTag currentTag = null;
                    final int currentLine = currentLinePtr + 1;
                    try {
                        currentTag
                            = new NLSTag(pos + sourceDelta, end + sourceDelta, currentLine, extractInt(s, start, end));
                    } catch (NumberFormatException e) {
                        currentTag = new NLSTag(pos + sourceDelta, end + sourceDelta, currentLine, -1);
                    }
                    if (this.nlsTagsPtr == this.nlsTags.length) {
                        // resize
                        System.arraycopy(this.nlsTags, 0, (this.nlsTags = new NLSTag[this.nlsTagsPtr + 10]), 0,
                            this.nlsTagsPtr);
                    }
                    this.nlsTags[this.nlsTagsPtr++] = currentTag;
                } else {
                    end = start;
                }
                pos = CharOperation.indexOf(TAG_PREFIX, s, end, sourceEnd);
            }
        }

        if (this.checkUninternedIdentityComparison
            && (pos = CharOperation.indexOf(IDENTITY_COMPARISON_TAG, s, sourceStart, sourceEnd)) != -1) {
            if (this.validIdentityComparisonLines == null) {
                this.validIdentityComparisonLines = new boolean[0];
            }
            int currentLine = currentLinePtr + 1;
            int length = this.validIdentityComparisonLines.length;
            System.arraycopy(this.validIdentityComparisonLines, 0,
                this.validIdentityComparisonLines = new boolean[currentLine + 1], 0, length);
            this.validIdentityComparisonLines[currentLine] = true;
        }
    }

    private int extractInt(char[] array, int start, int end) {
        int value = 0;
        for (int i = start; i < end; i++) {
            final char currentChar = array[i];
            int digit = 0;
            switch (currentChar) {
                case '0':
                    digit = 0;
                    break;

                case '1':
                    digit = 1;
                    break;

                case '2':
                    digit = 2;
                    break;

                case '3':
                    digit = 3;
                    break;

                case '4':
                    digit = 4;
                    break;

                case '5':
                    digit = 5;
                    break;

                case '6':
                    digit = 6;
                    break;

                case '7':
                    digit = 7;
                    break;

                case '8':
                    digit = 8;
                    break;

                case '9':
                    digit = 9;
                    break;

                default:
                    throw new NumberFormatException();
            }
            value *= 10;
            if (digit < 0)
                throw new NumberFormatException();
            value += digit;
        }
        return value;
    }

    public final void pushLineSeparator() {
        // see comment on isLineDelimiter(char) for the use of '\n' and '\r'

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
                    // System.out.println("look-ahead LF-" + this.currentPosition);
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
                    // System.out.println("merge LF-" + (this.currentPosition - 1));
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
            if (this.source[this.currentPosition] == '\n') {
                this.wasAcr = false;
            } else {
                this.wasAcr = true;
            }
        } else {
            // lf 000A
            if (this.currentCharacter == '\n') { // must merge eventual cr followed by lf
                this.wasAcr = false;
            }
        }
    }

    public void recordComment(TerminalToken token) {
        // compute position
        int commentStart = this.startPosition;
        int stopPosition = this.currentPosition;
        boolean isMarkdown = false;
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

            case TokenNameCOMMENT_MARKDOWN:
                isMarkdown = true;
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
        this.commentIsMarkdown[this.commentPtr] = isMarkdown;
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
        this.foundTaskCount = 0;
        resetLookBack();
        this.nextToken = TokenNameNotAToken;
        this.consumingEllipsisAnnotations = false;
        this.insideModuleInfo = isModuleInfo;
        this.scanContext = context == null ? getScanContext(begin) : context;
        this.scanningSwitchLabel = false;
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
    final void addTokenToLookBack(TerminalToken newToken) {
        switch (newToken) {
            case TokenNameWHITESPACE:
            case TokenNameCOMMENT_LINE:
            case TokenNameCOMMENT_BLOCK:
            case TokenNameCOMMENT_JAVADOC:
                return;

            default:
                break;
        }
        if (newToken == TokenNamecase)
            this.scanningSwitchLabel = true;
        else if (newToken == TokenNameCaseArrow)
            this.scanningSwitchLabel = false;
        else if (this.scanningSwitchLabel && this.lookBack[1] == TokenNameCOLON) {
            if (this.activeParser == null || this.activeParser.automatonWillShift(TokenNamecase))
                this.scanningSwitchLabel = false;
        }
        this.lookBack[0] = this.lookBack[1];
        this.lookBack[1] = newToken;
    }

    private ScanContext getScanContext(int begin) {
        if (!isInModuleDeclaration())
            return ScanContext.INACTIVE;
        if (begin == 0)
            return ScanContext.EXPECTING_KEYWORD;
        CompilerOptions options = new CompilerOptions();
        options.complianceLevel = this.complianceLevel;
        options.sourceLevel = this.sourceLevel;
        ModuleScanContextDetector parser = new ModuleScanContextDetector(options);
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

            case '\"':
                this.currentCharacter = '\"';
                break;

            case '\'':
                this.currentCharacter = '\'';
                break;

            case 's':
                if (this.sourceLevel < 3866624L) {
                    throw invalidEscape();
                }
                this.currentCharacter = ' ';
                break;

            case '\\':
                this.currentCharacter = '\\';
                break;

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
                    if (number > 255)
                        throw invalidEscape();
                    this.currentCharacter = (char) number;
                } else
                    throw invalidEscape();
        }
    }

    public TerminalToken scanIdentifierOrKeywordWithBoundCheck() {
        // test keywords

        // first dispatch on the first char.
        // then the length. If there are several
        // keywors with the same length AND the same first char, then do another
        // dispatch on the second char
        this.useAssertAsAnIndentifier = false;
        this.useEnumAsAnIndentifier = false;

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
                        // System.out.println("slow<=128: "+ c);
                        while (getNextCharAsJavaIdentifierPartWithBoundCheck()) {
                            /* empty */}
                        break identLoop;
                    }
                } else {
                    // System.out.println("slow>>128: "+ c);
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

    public TerminalToken scanIdentifierOrKeyword() {
        // test keywords

        // first dispatch on the first char.
        // then the length. If there are several
        // keywords with the same length AND the same first char, then do another
        // dispatch on the second char
        this.useAssertAsAnIndentifier = false;
        this.useEnumAsAnIndentifier = false;

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
                        // System.out.println("slow<=128: "+ c);
                        while (getNextCharAsJavaIdentifierPart()) {
                            /* empty */}
                        break identLoop;
                    }
                } else {
                    // System.out.println("slow>>128: "+ c);
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
                if (this.source[this.startPosition] == '_') {
                    return JavaFeature.UNNAMMED_PATTERNS_AND_VARS.isSupported(this.sourceLevel, this.previewEnabled)
                        ? TokenNameUNDERSCORE
                        : TokenNameIdentifier;
                }
                return TokenNameIdentifier;
            }
            data = this.source;
            index = this.startPosition;
        } else {
            if ((length = this.withoutUnicodePtr) == 1) {
                if (this.withoutUnicodeBuffer[0] == '_') {
                    return JavaFeature.UNNAMMED_PATTERNS_AND_VARS.isSupported(this.sourceLevel, this.previewEnabled)
                        ? TokenNameUNDERSCORE
                        : TokenNameIdentifier;
                }
                return TokenNameIdentifier;
            }
            data = this.withoutUnicodeBuffer;
            index = 1;
        }

        return internalScanIdentifierOrKeyword(index, length, data);
    }

    private TerminalToken internalScanIdentifierOrKeyword(int index, int length, char[] data) {
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
                            // initialize scanContext, because we need disambiguation when the next token is 'module':
                            if (this.scanContext == null || this.scanContext == ScanContext.INACTIVE)
                                this.scanContext = ScanContext.EXPECTING_IDENTIFIER;
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
                switch (length) {
                    case 6:
                        if ((areRestrictedModuleKeywordsActive()) // JEP 467: import module
                            && (data[++index] == 'o')
                            && (data[++index] == 'd')
                            && (data[++index] == 'u')
                            && (data[++index] == 'l')
                            && (data[++index] == 'e'))
                            return TokenNamemodule;
                        else
                            return TokenNameIdentifier;
                    default:
                        return TokenNameIdentifier;
                }

            case 'n': // native new null
                switch (length) {
                    case 3:
                        if ((data[++index] == 'e') && (data[++index] == 'w'))
                            return TokenNamenew;
                        else if (data == this.source
                            && (data.length >= index + 10) // "non-sealed".length(); not handling unicode as of now in
                                                           // non-sealed
                            && (data[index] == 'o')
                            && (data[++index] == 'n')
                            && (data[++index] == '-')
                            && (data[++index] == 's')
                            && (data[++index] == 'e')
                            && (data[++index] == 'a')
                            && (data[++index] == 'l')
                            && (data[++index] == 'e')
                            && (data[++index] == 'd')
                            && !ScannerHelper.isJavaIdentifierPart(data[++index])) {
                            this.currentPosition += 7;
                            TerminalToken t = disambiguatesRestrictedIdentifierWithLookAhead(TokenNamenon_sealed);
                            if (t == TokenNamenon_sealed) {
                                return TokenNamenon_sealed;
                            } else {
                                this.currentPosition -= 7;
                                return TokenNameIdentifier;
                            }
                        } else
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
                                return disambiguatesRestrictedIdentifierWithLookAhead(
                                    TokenNameRestrictedIdentifierpermits);
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
                                return disambiguateRecord();
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
                            return disambiguatesRestrictedIdentifierWithLookAhead(TokenNameRestrictedIdentifiersealed);
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
                switch (length) {
                    case 4:
                        if (areRestrictedModuleKeywordsActive()
                            && (data[++index] == 's')
                            && (data[++index] == 'e')
                            && (data[++index] == 's'))
                            return TokenNameuses;
                        else
                            return TokenNameIdentifier;
                    default:
                        return TokenNameIdentifier;
                }
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
                        else if ((data[++index] == 'h') && (data[++index] == 'e') && (data[++index] == 'n'))
                            return disambiguateWhen();
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
                switch (length) {
                    case 5:
                        if ((data[++index] == 'i')
                            && (data[++index] == 'e')
                            && (data[++index] == 'l')
                            && (data[++index] == 'd'))
                            return disambiguateYield();
                        //$FALL-THROUGH$
                    default:
                        return TokenNameIdentifier;
                }

            default:
                return TokenNameIdentifier;
        }
    }

    public TerminalToken scanNumber(boolean dotPrefix) throws InvalidInputException {

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
            } else {
                /* carry on */
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

    @Override
    public String toString() {
        if (this.startPosition == this.eofPosition)
            return "EOF\n\n" + new String(this.source); //$NON-NLS-1$
        if (this.currentPosition > this.eofPosition)
            return "behind the EOF\n\n" + new String(this.source); //$NON-NLS-1$
        if (this.currentPosition <= 0)
            return "NOT started!\n\n" + (this.source != null ? new String(this.source) : ""); //$NON-NLS-1$ //$NON-NLS-2$

        StringBuilder buffer = new StringBuilder();
        if (this.startPosition < 1000) {
            buffer.append(this.source, 0, this.startPosition);
        } else {
            buffer.append("<source beginning>\n...\n"); //$NON-NLS-1$
            int line = Util.getLineNumber(this.startPosition - 1000, this.lineEnds, 0, this.linePtr);
            int lineStart = getLineStart(line);
            buffer.append(this.source, lineStart, this.startPosition - lineStart);
        }

        buffer.append("\n===============================\nStarts here -->"); //$NON-NLS-1$
        int middleLength = (this.currentPosition - 1) - this.startPosition + 1;
        if (middleLength > -1) {
            buffer.append(this.source, this.startPosition, middleLength);
        }
        if (this.nextToken != TerminalToken.TokenNameNotAToken) {
            buffer.append("<-- Ends here [in pipeline " + toStringAction(this.nextToken) //$NON-NLS-1$
                + "]\n===============================\n");  //$NON-NLS-1$
        } else {
            buffer.append("<-- Ends here\n===============================\n"); //$NON-NLS-1$
        }

        buffer.append(this.source, (this.currentPosition - 1) + 1, this.eofPosition - (this.currentPosition - 1) - 1);

        return buffer.toString();
    }

    public String toStringAction(TerminalToken act) {
        switch (act) {
            case TokenNameIdentifier:
                return "Identifier(" + new String(getCurrentTokenSource()) + ")"; //$NON-NLS-1$ //$NON-NLS-2$

            case TokenNameRestrictedIdentifierWhen:
                return "when"; //$NON-NLS-1$

            case TokenNameRestrictedIdentifierYield:
                return "yield"; //$NON-NLS-1$

            case TokenNameRestrictedIdentifierrecord:
                return "record"; //$NON-NLS-1$

            case TokenNameabstract:
                return "abstract"; //$NON-NLS-1$

            case TokenNameboolean:
                return "boolean"; //$NON-NLS-1$

            case TokenNamebreak:
                return "break"; //$NON-NLS-1$

            case TokenNamebyte:
                return "byte"; //$NON-NLS-1$

            case TokenNamecase:
                return "case"; //$NON-NLS-1$

            case TokenNamecatch:
                return "catch"; //$NON-NLS-1$

            case TokenNamechar:
                return "char"; //$NON-NLS-1$

            case TokenNameclass:
                return "class"; //$NON-NLS-1$

            case TokenNamecontinue:
                return "continue"; //$NON-NLS-1$

            case TokenNamedefault:
                return "default"; //$NON-NLS-1$

            case TokenNamedo:
                return "do"; //$NON-NLS-1$

            case TokenNamedouble:
                return "double"; //$NON-NLS-1$

            case TokenNameelse:
                return "else"; //$NON-NLS-1$

            case TokenNameextends:
                return "extends"; //$NON-NLS-1$

            case TokenNamefalse:
                return "false"; //$NON-NLS-1$

            case TokenNamefinal:
                return "final"; //$NON-NLS-1$

            case TokenNamefinally:
                return "finally"; //$NON-NLS-1$

            case TokenNamefloat:
                return "float"; //$NON-NLS-1$

            case TokenNamefor:
                return "for"; //$NON-NLS-1$

            case TokenNameif:
                return "if"; //$NON-NLS-1$

            case TokenNameimplements:
                return "implements"; //$NON-NLS-1$

            case TokenNameimport:
                return "import"; //$NON-NLS-1$

            case TokenNameinstanceof:
                return "instanceof"; //$NON-NLS-1$

            case TokenNameint:
                return "int"; //$NON-NLS-1$

            case TokenNameinterface:
                return "interface"; //$NON-NLS-1$

            case TokenNamelong:
                return "long"; //$NON-NLS-1$

            case TokenNamenative:
                return "native"; //$NON-NLS-1$

            case TokenNamenew:
                return "new"; //$NON-NLS-1$

            case TokenNamenon_sealed:
                return "non-sealed"; //$NON-NLS-1$

            case TokenNamenull:
                return "null"; //$NON-NLS-1$

            case TokenNamepackage:
                return "package"; //$NON-NLS-1$

            case TokenNameRestrictedIdentifierpermits:
                return "permits"; //$NON-NLS-1$

            case TokenNameprivate:
                return "private"; //$NON-NLS-1$

            case TokenNameprotected:
                return "protected"; //$NON-NLS-1$

            case TokenNamepublic:
                return "public"; //$NON-NLS-1$

            case TokenNamereturn:
                return "return"; //$NON-NLS-1$

            case TokenNameRestrictedIdentifiersealed:
                return "sealed"; //$NON-NLS-1$

            case TokenNameshort:
                return "short"; //$NON-NLS-1$

            case TokenNamestatic:
                return "static"; //$NON-NLS-1$

            case TokenNamesuper:
                return "super"; //$NON-NLS-1$

            case TokenNameswitch:
                return "switch"; //$NON-NLS-1$

            case TokenNamesynchronized:
                return "synchronized"; //$NON-NLS-1$

            case TokenNamethis:
                return "this"; //$NON-NLS-1$

            case TokenNamethrow:
                return "throw"; //$NON-NLS-1$

            case TokenNamethrows:
                return "throws"; //$NON-NLS-1$

            case TokenNametransient:
                return "transient"; //$NON-NLS-1$

            case TokenNametrue:
                return "true"; //$NON-NLS-1$

            case TokenNametry:
                return "try"; //$NON-NLS-1$

            case TokenNamevoid:
                return "void"; //$NON-NLS-1$

            case TokenNamevolatile:
                return "volatile"; //$NON-NLS-1$

            case TokenNamewhile:
                return "while"; //$NON-NLS-1$

            case TokenNamemodule:
                return "module"; //$NON-NLS-1$

            case TokenNamerequires:
                return "requires"; //$NON-NLS-1$

            case TokenNameexports:
                return "exports"; //$NON-NLS-1$

            case TokenNameIntegerLiteral:
                return "Integer(" + new String(getCurrentTokenSource()) + ")"; //$NON-NLS-1$ //$NON-NLS-2$

            case TokenNameLongLiteral:
                return "Long(" + new String(getCurrentTokenSource()) + ")"; //$NON-NLS-1$ //$NON-NLS-2$

            case TokenNameFloatingPointLiteral:
                return "Float(" + new String(getCurrentTokenSource()) + ")"; //$NON-NLS-1$ //$NON-NLS-2$

            case TokenNameDoubleLiteral:
                return "Double(" + new String(getCurrentTokenSource()) + ")"; //$NON-NLS-1$ //$NON-NLS-2$

            case TokenNameCharacterLiteral:
                return "Char(" + new String(getCurrentTokenSource()) + ")"; //$NON-NLS-1$ //$NON-NLS-2$

            case TokenNameStringLiteral:
                return "String(" + new String(getCurrentTokenSource()) + ")"; //$NON-NLS-1$ //$NON-NLS-2$

            case TokenNameTextBlock:
                return "String(" + new String(getCurrentTokenSource()) + ")"; //$NON-NLS-1$ //$NON-NLS-2$

            case TokenNamePLUS_PLUS:
                return "++"; //$NON-NLS-1$

            case TokenNameMINUS_MINUS:
                return "--"; //$NON-NLS-1$

            case TokenNameEQUAL_EQUAL:
                return "=="; //$NON-NLS-1$

            case TokenNameLESS_EQUAL:
                return "<="; //$NON-NLS-1$

            case TokenNameGREATER_EQUAL:
                return ">="; //$NON-NLS-1$

            case TokenNameNOT_EQUAL:
                return "!="; //$NON-NLS-1$

            case TokenNameLEFT_SHIFT:
                return "<<"; //$NON-NLS-1$

            case TokenNameRIGHT_SHIFT:
                return ">>"; //$NON-NLS-1$

            case TokenNameUNSIGNED_RIGHT_SHIFT:
                return ">>>"; //$NON-NLS-1$

            case TokenNamePLUS_EQUAL:
                return "+="; //$NON-NLS-1$

            case TokenNameMINUS_EQUAL:
                return "-="; //$NON-NLS-1$

            case TokenNameARROW:
                return "->"; //$NON-NLS-1$

            case TokenNameMULTIPLY_EQUAL:
                return "*="; //$NON-NLS-1$

            case TokenNameDIVIDE_EQUAL:
                return "/="; //$NON-NLS-1$

            case TokenNameAND_EQUAL:
                return "&="; //$NON-NLS-1$

            case TokenNameOR_EQUAL:
                return "|="; //$NON-NLS-1$

            case TokenNameXOR_EQUAL:
                return "^="; //$NON-NLS-1$

            case TokenNameREMAINDER_EQUAL:
                return "%="; //$NON-NLS-1$

            case TokenNameLEFT_SHIFT_EQUAL:
                return "<<="; //$NON-NLS-1$

            case TokenNameRIGHT_SHIFT_EQUAL:
                return ">>="; //$NON-NLS-1$

            case TokenNameUNSIGNED_RIGHT_SHIFT_EQUAL:
                return ">>>="; //$NON-NLS-1$

            case TokenNameOR_OR:
                return "||"; //$NON-NLS-1$

            case TokenNameAND_AND:
                return "&&"; //$NON-NLS-1$

            case TokenNamePLUS:
                return "+"; //$NON-NLS-1$

            case TokenNameMINUS:
                return "-"; //$NON-NLS-1$

            case TokenNameNOT:
                return "!"; //$NON-NLS-1$

            case TokenNameREMAINDER:
                return "%"; //$NON-NLS-1$

            case TokenNameXOR:
                return "^"; //$NON-NLS-1$

            case TokenNameAND:
                return "&"; //$NON-NLS-1$

            case TokenNameMULTIPLY:
                return "*"; //$NON-NLS-1$

            case TokenNameOR:
                return "|"; //$NON-NLS-1$

            case TokenNameTWIDDLE:
                return "~"; //$NON-NLS-1$

            case TokenNameDIVIDE:
                return "/"; //$NON-NLS-1$

            case TokenNameGREATER:
                return ">"; //$NON-NLS-1$

            case TokenNameLESS:
                return "<"; //$NON-NLS-1$

            case TokenNameLPAREN:
                return "("; //$NON-NLS-1$

            case TokenNameRPAREN:
                return ")"; //$NON-NLS-1$

            case TokenNameLBRACE:
                return "{"; //$NON-NLS-1$

            case TokenNameRBRACE:
                return "}"; //$NON-NLS-1$

            case TokenNameLBRACKET:
                return "["; //$NON-NLS-1$

            case TokenNameRBRACKET:
                return "]"; //$NON-NLS-1$

            case TokenNameSEMICOLON:
                return ";"; //$NON-NLS-1$

            case TokenNameQUESTION:
                return "?"; //$NON-NLS-1$

            case TokenNameCOLON:
                return ":"; //$NON-NLS-1$

            case TokenNameCOLON_COLON:
                return "::"; //$NON-NLS-1$

            case TokenNameCOMMA:
                return ","; //$NON-NLS-1$

            case TokenNameDOT:
                return "."; //$NON-NLS-1$

            case TokenNameEQUAL:
                return "="; //$NON-NLS-1$

            case TokenNameEOF:
                return "EOF"; //$NON-NLS-1$

            case TokenNameWHITESPACE:
                return "white_space(" + new String(getCurrentTokenSource()) + ")"; //$NON-NLS-1$ //$NON-NLS-2$

            default:
                return "not-a-token"; //$NON-NLS-1$
        }
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

    public static boolean isLiteral(TerminalToken token) {
        switch (token) {
            case TokenNameIntegerLiteral:
            case TokenNameLongLiteral:
            case TokenNameFloatingPointLiteral:
            case TokenNameDoubleLiteral:
            case TokenNameStringLiteral:
            case TokenNameTextBlock:
            case TokenNameCharacterLiteral:
                return true;

            default:
                return false;
        }
    }

    public static boolean isKeyword(TerminalToken token) {
        switch (token) {
            case TokenNameabstract:
            case TokenNameassert:
            case TokenNamebyte:
            case TokenNamebreak:
            case TokenNameboolean:
            case TokenNamecase:
            case TokenNamechar:
            case TokenNamecatch:
            case TokenNameclass:
            case TokenNamecontinue:
            case TokenNamedo:
            case TokenNamedouble:
            case TokenNamedefault:
            case TokenNameelse:
            case TokenNameextends:
            case TokenNamefor:
            case TokenNamefinal:
            case TokenNamefloat:
            case TokenNamefalse:
            case TokenNamefinally:
            case TokenNameif:
            case TokenNameint:
            case TokenNameimport:
            case TokenNameinterface:
            case TokenNameimplements:
            case TokenNameinstanceof:
            case TokenNamelong:
            case TokenNamenew:
            case TokenNamenull:
            case TokenNamenative:
            case TokenNamepublic:
            case TokenNamepackage:
            case TokenNameprivate:
            case TokenNameprotected:
            case TokenNamereturn:
            case TokenNameshort:
            case TokenNamesuper:
            case TokenNamestatic:
            case TokenNameswitch:
            case TokenNamestrictfp:
            case TokenNamesynchronized:
            case TokenNametry:
            case TokenNamethis:
            case TokenNametrue:
            case TokenNamethrow:
            case TokenNamethrows:
            case TokenNametransient:
            case TokenNamevoid:
            case TokenNamevolatile:
            case TokenNamewhile:
                return true;

            case TokenNameRestrictedIdentifierYield:
            case TokenNameRestrictedIdentifierrecord:
            case TokenNameRestrictedIdentifiersealed:
            case TokenNameRestrictedIdentifierpermits:
            case TokenNameRestrictedIdentifierWhen:
            case TokenNamenon_sealed:
                // making explicit - not a (restricted) keyword but restricted identifier.
                // $FALL-THROUGH$
            default:
                return false;
        }
    }

// Vanguard Scanner - A Private utility helper class for the scanner.
    private static final class VanguardScanner extends Scanner {

        public VanguardScanner(long sourceLevel, long complianceLevel, boolean previewEnabled) {
            super(false /* comment */, false /* whitespace */, false /* nls */, sourceLevel, complianceLevel,
                null/* taskTag */, null/* taskPriorities */, false /* taskCaseSensitive */, previewEnabled);
        }

        @Override
        public TerminalToken getNextToken() throws InvalidInputException {
            TerminalToken token;
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
            } else if (mayBeAtCasePattern(token)) {
                token = disambiguateCasePattern(token);
            } else if (token == TokenNameARROW) {
                token = disambiguatedToken(token, this);
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

        final TerminalToken first;      // steer the parser towards a single minded pursuit.
        final TerminalToken[] follow;  // the definite terminal symbols that signal the successful reduction to goal.
        final int[] rules;

        static int LambdaParameterListRule = 0;
        static int IntersectionCastRule = 0;
        static int ReferenceExpressionRule = 0;
        static int VarargTypeAnnotationsRule = 0;
        static int BlockStatementoptRule = 0;
        static int[] ModifiersoptRules;
        static int PermittedTypesRule;
        static int[] PatternRules;

        static Goal LambdaParameterListGoal;
        static Goal IntersectionCastGoal;
        static Goal VarargTypeAnnotationGoal;
        static Goal ReferenceExpressionGoal;
        static Goal SealedModifierGoal;
        static Goal PermittedTypesGoal;
        static Goal PatternGoal;

        static TerminalToken[] SealedModifierFollow
            = { TokenNameclass, TokenNameinterface, TokenNameenum, TokenNameRestrictedIdentifierrecord };// Note:
        static TerminalToken[] PermittedTypesFollow = { TokenNameLBRACE };
        static TerminalToken[] PatternCaseLabelFollow
            = { TokenNameCOLON, TokenNameARROW, TokenNameCOMMA, TokenNameCaseArrow, TokenNameRestrictedIdentifierWhen };

        static {
            List<Integer> modifiersOptStates = new ArrayList<>(2);
            List<Integer> patternStates = new ArrayList<>();
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
                else if ("BlockStatementopt".equals(Parser.name[Parser.non_terminal_index[Parser.lhs[i]]])) //$NON-NLS-1$
                    BlockStatementoptRule = i;
                else if ("Modifiersopt".equals(Parser.name[Parser.non_terminal_index[Parser.lhs[i]]])) //$NON-NLS-1$
                    modifiersOptStates.add(i);
                else if ("PermittedTypes".equals(Parser.name[Parser.non_terminal_index[Parser.lhs[i]]])) //$NON-NLS-1$
                    PermittedTypesRule = i;
                else if ("TypePattern".equals(Parser.name[Parser.non_terminal_index[Parser.lhs[i]]])) //$NON-NLS-1$
                    patternStates.add(i);
                else if ("Pattern".equals(Parser.name[Parser.non_terminal_index[Parser.lhs[i]]])) //$NON-NLS-1$
                    patternStates.add(i);
                else if ("RecordPattern".equals(Parser.name[Parser.non_terminal_index[Parser.lhs[i]]])) //$NON-NLS-1$
                    patternStates.add(i);
            }
            ModifiersoptRules = modifiersOptStates.stream().mapToInt(Integer::intValue).toArray(); // overkill but
                                                                                                   // future-proof
            PatternRules = patternStates.stream().mapToInt(Integer::intValue).toArray();

            LambdaParameterListGoal
                = new Goal(TokenNameARROW, new TerminalToken[] { TokenNameARROW }, LambdaParameterListRule);
            IntersectionCastGoal = new Goal(TokenNameLPAREN, followSetOfCast(), IntersectionCastRule);
            VarargTypeAnnotationGoal
                = new Goal(TokenNameAT, new TerminalToken[] { TokenNameELLIPSIS }, VarargTypeAnnotationsRule);
            ReferenceExpressionGoal
                = new Goal(TokenNameLESS, new TerminalToken[] { TokenNameCOLON_COLON }, ReferenceExpressionRule);
            new Goal(TokenNameLBRACE, new TerminalToken[0], BlockStatementoptRule);
            SealedModifierGoal = new Goal(TokenNameRestrictedIdentifiersealed, SealedModifierFollow, ModifiersoptRules);
            PermittedTypesGoal
                = new Goal(TokenNameRestrictedIdentifierpermits, PermittedTypesFollow, PermittedTypesRule);
            PatternGoal = new Goal(TokenNameBeginCasePattern, PatternCaseLabelFollow, PatternRules);
        }

        Goal(TerminalToken first, TerminalToken[] follow, int rule) {
            this.first = first;
            this.follow = follow;
            this.rules = new int[] { rule };
        }

        Goal(TerminalToken first, TerminalToken[] follow, int[] rules) {
            this.first = first;
            this.follow = follow;
            this.rules = rules;
        }

        boolean hasBeenReached(int act, TerminalToken token) {
            /*
             * System.out.println("[Goal = " + Parser.name[Parser.non_terminal_index[Parser.lhs[act]]] + "]  " + "Saw: "
             * + Parser.name[Parser.non_terminal_index[Parser.lhs[act]]] + "::" + //$NON-NLS-1$//$NON-NLS-2$
             * //$NON-NLS-3$ //$NON-NLS-4$ Parser.name[Parser.terminal_index[token]]);
             */
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
                for (int i = 0; i < length; i++)
                    if (this.follow[i] == token)
                        return true;
            }
            return false;
        }

        private static TerminalToken[] followSetOfCast() {
            return new TerminalToken[] {
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
                TokenNameTextBlock,
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
                ProcessTerminals: for (;;) {
                    int stackLength = this.stack.length;
                    if (++this.stateStackTop >= stackLength) {
                        System.arraycopy(this.stack, 0, this.stack = new int[stackLength + 255], 0, stackLength);
                    }
                    this.stack[this.stateStackTop] = act;

                    act = Parser.tAction(act, this.currentToken.tokenNumber());
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
                            continue ProcessTerminals;
                        }
                        return false; // accept - we should never reach this state, we accept at reduce with a right
                                      // member of follow set below.
                    }

                    // ProcessNonTerminals :
                    do { /* reduce */
                        if (goal.hasBeenReached(act, this.currentToken))
                            return true;
                        if (this.currentToken == TokenNameIdentifier) {
                            TerminalToken reskw
                                = TerminalToken.getRestrictedKeyword(this.scanner.getCurrentIdentifierSource());
                            if (reskw != TokenNameNotAToken && goal.hasBeenReached(act, reskw))
                                return true;
                        }
                        this.stateStackTop -= (Parser.rhs[act] - 1);
                        act = Parser.ntAction(this.stack[this.stateStackTop], Parser.lhs[act]);
                    } while (act <= 936);
                }
            } catch (Exception e) {
                return false;
            }
        }

        @Override
        public String toString() {
            return "\n\n\n----------------Scanner--------------\n" + this.scanner.toString(); //$NON-NLS-1$ ;
        }
    }

    private class ModuleScanContextDetector extends VanguardParser {
        ModuleScanContextDetector(CompilerOptions options) {
            super(new ProblemHandler(DefaultErrorHandlingPolicies.ignoreAllProblems(), options, new IProblemFactory()));
            this.problemReporter.options.performStatementsRecovery = false;
            this.reportSyntaxErrorIsRequired = false;
            this.reportOnlyOneSyntaxError = false;
        }

        @Override
        public void initializeScanner() {
            this.scanner = new Scanner(false /* comment */, false /* whitespace */, false, /*
                                                                                            * will be set in
                                                                                            * initialize(boolean)
                                                                                            */
                this.options.sourceLevel /* sourceLevel */, this.options.complianceLevel /* complianceLevel */,
                this.options.taskTags/* taskTags */, this.options.taskPriorities/* taskPriorities */,
                this.options.isTaskCaseSensitive/* taskCaseSensitive */,
                this.options.enablePreviewFeatures /* isPreviewEnabled */) {
                @Override
                void updateScanContext(TerminalToken token) {
                    if (token != TokenNameEOF)
                        super.updateScanContext(token);
                }
            };
            this.scanner.recordLineSeparator = false;
            this.scanner.setActiveParser(this);
            this.scanner.previewEnabled = this.options.enablePreviewFeatures;
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
                boolean hasBeenReached(int act, TerminalToken token) {
                    return token == TokenNameEOF;
                }
            };
            parse(goal);
            return this.scanner.scanContext;
        }
    }

    private VanguardParser getVanguardParser() {
        if (this.vanguardParser == null) {
            this.vanguardScanner = new VanguardScanner(this.sourceLevel, this.complianceLevel, this.previewEnabled);
            this.vanguardParser = new VanguardParser(this.vanguardScanner);
            this.vanguardScanner.setActiveParser(this.vanguardParser);
        }
        this.vanguardScanner.setSource(this.source);
        this.vanguardScanner.resetTo(this.startPosition, this.eofPosition - 1, isInModuleDeclaration(),
            this.scanContext);
        return this.vanguardParser;
    }

    private VanguardParser getNewVanguardParser() {
        VanguardScanner vs = getNewVanguardScanner();
        VanguardParser vp = new VanguardParser(vs);
        vs.setActiveParser(vp);
        return vp;
    }

    private VanguardScanner getNewVanguardScanner() {
        VanguardScanner vs = new VanguardScanner(this.sourceLevel, this.complianceLevel, this.previewEnabled);
        vs.setSource(this.source);
        vs.resetTo(this.startPosition, this.eofPosition - 1, isInModuleDeclaration(), this.scanContext);
        return vs;
    }

    protected final boolean maybeAtLambdaOrCast() { // Could the '(' we saw just now herald a lambda parameter list or a
                                                    // cast expression ? (the possible locations for both are
                                                    // identical.)

        if (isInModuleDeclaration())
            return false;
        switch (this.lookBack[1]) {
            case TokenNameIdentifier:
            case TokenNamecatch:
            case TokenNamethis:
            case TokenNamesuper:
            case TokenNameif:
            case TokenNameswitch:
            case TokenNamewhile:
            case TokenNamefor:
            case TokenNamecase:
            case TokenNamesynchronized:
            case TokenNametry:
                return false; // not a viable prefix for cast or lambda.

            default:
                return this.activeParser.atConflictScenario(TokenNameLPAREN);
        }
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
                    case TokenNamenon_sealed: // non-sealed X<T>
                    case TokenNameRestrictedIdentifiersealed: // sealed X<T>
                    case TokenNamepublic:     // public List<String> foo() {}
                    case TokenNameabstract:   // abstract List<String> foo() {}
                    case TokenNameprivate:    // private List<String> foo() {}
                    case TokenNameprotected:  // protected List<String> foo() {}
                    case TokenNamestatic:     // public static List<String> foo() {}
                    case TokenNameextends:    // <T extends Y<Z>>
                    case TokenNamesuper:      // ? super Context<N>
                    case TokenNameAND:        // T extends Object & Comparable<? super T>
                    case TokenNameimplements: // class A implements I<Z>
                    case TokenNameRestrictedIdentifierpermits: // class A permits I<Z>
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

    private final boolean maybeAtEllipsisAnnotationsStart() { // Did the '@' we saw just now herald a type annotation on
                                                              // a ... ? Presumed to be at type annotation already.
        if (this.consumingEllipsisAnnotations)
            return false;
        switch (this.lookBack[1]) {
            case TokenNamenew:
            case TokenNameCOMMA:
            case TokenNameextends:
            case TokenNamesuper:
            case TokenNameimplements:
            case TokenNameRestrictedIdentifierpermits:
            case TokenNameDOT:
            case TokenNameLBRACE:
            case TokenNameinstanceof:
            case TokenNameLESS:
            case TokenNameAND:
            case TokenNamethrows:
                return false;

            default:
                return true;
        }
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
        this.scanningSwitchLabel = false;
    }

    public static boolean isRestrictedKeyword(TerminalToken token) {
        switch (token) {
            case TokenNameopen:
            case TokenNamemodule:
            case TokenNamerequires:
            case TokenNametransitive:
            case TokenNameexports:
            case TokenNameto:
            case TokenNameopens:
            case TokenNameuses:
            case TokenNameprovides:
            case TokenNamewith:
                return true;

            default:
                return false;
        }
    }

    private boolean mayBeAtAnYieldStatement() {
        if (isInModuleDeclaration())
            return false;
        // preceded by ;, {, }, ), or -> [Ref:
        // http://mail.openjdk.java.net/pipermail/amber-spec-experts/2019-May/001401.html]
        // above comment is super-seded by
        // http://mail.openjdk.java.net/pipermail/amber-spec-experts/2019-May/001414.html
        switch (this.lookBack[1]) {
            case TokenNameLBRACE:
            case TokenNameRBRACE:
            case TokenNameRPAREN:
            case TokenNameSEMICOLON:
            case TokenNameelse:
            case TokenNamedo:
                return true;

            case TokenNameCOLON:
                return this.lookBack[0] == TokenNamedefault
                    || (this.scanningSwitchLabel
                        && (this.activeParser == null || this.activeParser.automatonWillShift(TokenNamecase)));

            case TokenNameDOT:
            case TokenNameARROW:
            default:
                return false;
        }
    }

    TerminalToken disambiguateRecord() {
        if (JavaFeature.RECORDS.isSupported(this.sourceLevel, this.previewEnabled) && !isInModuleDeclaration()) {
            getVanguardParser();
            this.vanguardScanner.resetTo(this.currentPosition, this.eofPosition - 1);
            try {
                if (this.vanguardScanner.getNextToken() == TokenNameIdentifier) {
                    TerminalToken lookAhead = this.vanguardScanner.getNextToken();
                    lookAhead = lookAhead == TokenNameLESS ? getNextTokenAfterTypeParameterHeader() : lookAhead;
                    if (lookAhead == TokenNameLPAREN || lookAhead == TokenNameLBRACE) // tolerate record X {} or record
                                                                                      // X<T> {} at this level, will be
                                                                                      // complained elsewhere.
                        return TokenNameRestrictedIdentifierrecord;
                }
            } catch (InvalidInputException e) {
                if (e.getMessage().equals("Invalid_Char_In_String")) {
                    // Ignore
                } else {
                    e.printStackTrace(); // Shouldn't happen, but log the error
                }
            }
        }
        return TokenNameIdentifier;
    }

    private TerminalToken getNextTokenAfterTypeParameterHeader() {
        int count = 1;
        try {
            TerminalToken token;
            while ((token = this.vanguardScanner.getNextToken()) != TokenNameNotAToken) {
                if (token == TokenNameEOF)
                    break;
                if (token == TokenNameLESS)
                    ++count;
                if (token == TokenNameGREATER)
                    --count;
                if (token == TokenNameRIGHT_SHIFT)
                    count = count - 2;
                if (token == TokenNameUNSIGNED_RIGHT_SHIFT)
                    count = count - 3;
                if (count <= 0)
                    return this.vanguardScanner.getNextToken();
            }
        } catch (InvalidInputException e) {
            if (e.getMessage().equals("Invalid_Char_In_String")) {
                // Ignore
            } else {
                // Shouldn't happen, but log the error
                e.printStackTrace();
            }
        }
        return TokenNameEOF;
    }

    TerminalToken disambiguateWhen() {
        return this.activeParser == null || !this.activeParser.automatonWillShift(TokenNameRestrictedIdentifierWhen)
            ? TokenNameIdentifier
            : TokenNameRestrictedIdentifierWhen;
    }

    TerminalToken disambiguateYield() {
        if (this.sourceLevel < 3801088L || !mayBeAtAnYieldStatement())
            return TokenNameIdentifier;

        getVanguardParser();
        this.vanguardScanner.resetTo(this.currentPosition, this.eofPosition - 1);
        try {
            switch (this.vanguardScanner.getNextToken()) {
                case TokenNameEQUAL_EQUAL:
                case TokenNameLESS_EQUAL:
                case TokenNameGREATER_EQUAL:
                case TokenNameNOT_EQUAL:
                case TokenNameLEFT_SHIFT:
                case TokenNameRIGHT_SHIFT:
                case TokenNameUNSIGNED_RIGHT_SHIFT:
                case TokenNamePLUS_EQUAL:
                case TokenNameMINUS_EQUAL:
                case TokenNameMULTIPLY_EQUAL:
                case TokenNameDIVIDE_EQUAL:
                case TokenNameAND_EQUAL:
                case TokenNameOR_EQUAL:
                case TokenNameXOR_EQUAL:
                case TokenNameREMAINDER_EQUAL:
                case TokenNameLEFT_SHIFT_EQUAL:
                case TokenNameRIGHT_SHIFT_EQUAL:
                case TokenNameUNSIGNED_RIGHT_SHIFT_EQUAL:
                case TokenNameOR_OR:
                case TokenNameAND_AND:
                case TokenNameREMAINDER:
                case TokenNameXOR:
                case TokenNameAND:
                case TokenNameMULTIPLY:
                case TokenNameOR:
                case TokenNameDIVIDE:
                case TokenNameGREATER:
                case TokenNameLESS:
                case TokenNameLBRACE:
                case TokenNameRBRACE:
                case TokenNameLBRACKET:
                case TokenNameRBRACKET:
                case TokenNameSEMICOLON:
                case TokenNameQUESTION:
                case TokenNameCOLON:
                case TokenNameCOMMA:
                case TokenNameDOT:
                case TokenNameEQUAL:
                case TokenNameAT:
                case TokenNameELLIPSIS:
                case TokenNameARROW:
                case TokenNameCOLON_COLON:
                    return TokenNameIdentifier;

                case TokenNameMINUS_MINUS:
                case TokenNamePLUS_PLUS:
                    return this.vanguardScanner.getNextToken() == TokenNameIdentifier
                        ? TokenNameRestrictedIdentifierYield
                        : TokenNameIdentifier;

                default:
                    return TokenNameRestrictedIdentifierYield;
            }
        } catch (InvalidInputException e) {
            if (e.getMessage().equals("Invalid_Char_In_String")) {
                // Ignore
            } else {
                // Shouldn't happen, but log the error
                e.printStackTrace();
            }
        }
        return TokenNameIdentifier; // IIE event;
    }

    TerminalToken disambiguatedRestrictedKeyword(TerminalToken restrictedKeywordToken) {
        TerminalToken token = restrictedKeywordToken;
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
                switch (this.scanContext) {
                    case EXPECTING_KEYWORD:
                        break;

                    case AFTER_IMPORT:
                        if (lookAhead() == TokenNameDOT)
                            token = TokenNameIdentifier;
                        break;

                    default:
                        token = TokenNameIdentifier;
                }
                break;

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

    TerminalToken lookAhead() {

        getVanguardParser();
        this.vanguardScanner.resetTo(this.currentPosition, this.eofPosition - 1, true,
            com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Scanner.ScanContext.EXPECTING_IDENTIFIER);
        try {
            return this.vanguardScanner.getNextToken();
        } catch (InvalidInputException e) {
            return TokenNameNotAToken;
        }
    }

// TODO: Centralize all non-module contextual keyword recognition here. ATM, we handle sealed type related tokens.
    TerminalToken disambiguatesRestrictedIdentifierWithLookAhead(TerminalToken restrictedIdentifierToken) {
        if (isInModuleDeclaration())
            return TokenNameIdentifier;

        Goal goal;
        switch (restrictedIdentifierToken) {
            case TokenNameRestrictedIdentifiersealed:
            case TokenNamenon_sealed:
                if (this.sourceLevel < 3997696L)
                    return TokenNameIdentifier;
                goal = Goal.SealedModifierGoal;
                break;

            case TokenNameRestrictedIdentifierpermits:
                if (this.sourceLevel < 3997696L)
                    return TokenNameIdentifier;
                goal = Goal.PermittedTypesGoal;
                break;

            default:
                throw new UnsupportedOperationException("Unhandled contextual keyword"); //$NON-NLS-1$
        }

        VanguardParser vp = getNewVanguardParser();
        VanguardScanner vs = (VanguardScanner) vp.scanner;
        vs.resetTo(this.currentPosition, this.eofPosition - 1);
        if (vp.parse(goal) == true)
            return restrictedIdentifierToken;

        return TokenNameIdentifier;
    }

    TerminalToken disambiguatedToken(TerminalToken token, Scanner scanner) {
        final VanguardParser parser = getVanguardParser();
        if (token == TokenNameARROW) {
            if (this.lookBack[1] == TokenNamedefault)
                return TokenNameCaseArrow;
            if (this.activeParser == null || !this.activeParser.automatonWillShift(TokenNameCaseArrow))
                return TokenNameARROW;
            return TokenNameCaseArrow;
        } else if (token == TokenNameLPAREN && maybeAtLambdaOrCast()) {
            if (parser.parse(Goal.LambdaParameterListGoal) == true) {
                scanner.nextToken = TokenNameLPAREN;
                return TokenNameBeginLambda;
            }
            scanner.vanguardScanner.resetTo(scanner.startPosition, scanner.eofPosition - 1);
            if (parser.parse(Goal.IntersectionCastGoal) == true) {
                scanner.nextToken = TokenNameLPAREN;
                return TokenNameBeginIntersectionCast;
            }
        } else if (token == TokenNameLESS && maybeAtReferenceExpression()) {
            if (parser.parse(Goal.ReferenceExpressionGoal) == true) {
                scanner.nextToken = TokenNameLESS;
                return TokenNameBeginTypeArguments;
            }
        } else if (token == TokenNameAT && atTypeAnnotation()) {
            token = TokenNameAT308;
            if (maybeAtEllipsisAnnotationsStart()) {
                if (parser.parse(Goal.VarargTypeAnnotationGoal) == true) {
                    scanner.consumingEllipsisAnnotations = true;
                    scanner.nextToken = TokenNameAT308;
                    return TokenNameAT308DOTDOTDOT;
                }
            }
        }
        return token;
    }

    public boolean atMultiCaseComma() {
        return this.scanningSwitchLabel
            && this.lookBack[1] == TokenNameCOMMA
            && (this.activeParser == null || this.activeParser.automatonWillShift(TokenNameBeginCasePattern));
    }

    protected final boolean mayBeAtCasePattern(TerminalToken token) {
        return token == TokenNamecase || atMultiCaseComma();
    }

    TerminalToken disambiguateCasePattern(TerminalToken token) {
        int delta = token == TokenNamecase ? 4 : 0; // 4 for case.
        final VanguardParser parser = getNewVanguardParser();
        parser.scanner.resetTo(parser.scanner.currentPosition + delta, parser.scanner.eofPosition);
        if (parser.parse(Goal.PatternGoal) == true) {
            if (token == TokenNamecase) {
                this.nextToken = TokenNameBeginCasePattern;
            } else {
                this.nextToken = token;
                token = TokenNameBeginCasePattern;
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

    protected static InvalidInputException unterminatedTextBlock() {
        return new InvalidInputException("Unterminated_Text_Block");
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
        this.commentIsMarkdown[to] = this.commentIsMarkdown[from];
    }

    public void copyAllCommentInfo(int from, int length) {

        System.arraycopy(this.commentStarts, from, this.commentStarts, 0, length);
        System.arraycopy(this.commentStops, from, this.commentStops, 0, length);
        System.arraycopy(this.commentTagStarts, from, this.commentTagStarts, 0, length);
        System.arraycopy(this.commentIsMarkdown, from, this.commentIsMarkdown, 0, length);
    }

    protected void growCommentInfoArrays(int length, int newLength) {
        System.arraycopy(this.commentStops, 0, this.commentStops = new int[newLength], 0, length);
        System.arraycopy(this.commentStarts, 0, this.commentStarts = new int[newLength], 0, length);
        System.arraycopy(this.commentIsMarkdown, 0, this.commentIsMarkdown = new boolean[newLength], 0, length);
        System.arraycopy(this.commentTagStarts, 0, this.commentTagStarts = new int[newLength], 0, length);
    }
}
