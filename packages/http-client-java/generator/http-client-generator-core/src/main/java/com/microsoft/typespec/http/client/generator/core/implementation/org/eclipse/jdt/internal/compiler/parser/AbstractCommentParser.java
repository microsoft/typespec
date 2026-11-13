// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2026 IBM Corporation and others.
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
 *******************************************************************************/
/*******************************************************************************
 * Copyright (c) 2000, 2023 IBM Corporation and others.
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
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameEOF;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameInvalid;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.TokenNameNotAToken;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Parser specialized for decoding javadoc comments
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
public abstract class AbstractCommentParser {

    // recognized tags
    public static final char[] TAG_DEPRECATED = "deprecated".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_PARAM = "param".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_RETURN = "return".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_THROWS = "throws".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_EXCEPTION = "exception".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_SEE = "see".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_LINK = "link".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_LINKPLAIN = "linkplain".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_INHERITDOC = "inheritDoc".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_VALUE = "value".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_AUTHOR = "author".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_CODE = "code".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_DOC_ROOT = "docRoot".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_LITERAL = "literal".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_SERIAL = "serial".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_SERIAL_DATA = "serialData".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_SERIAL_FIELD = "serialField".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_SINCE = "since".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_VERSION = "version".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_CATEGORY = "category".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_SYSTEM_PROPERTY = "systemProperty".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_USES = "uses".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_PROVIDES = "provides".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_HIDDEN = "hidden".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_INDEX = "index".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_SUMMARY = "summary".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_API_NOTE = "apiNote".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_IMPL_SPEC = "implSpec".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_IMPL_NOTE = "implNote".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_SNIPPET = "snippet".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_HIGHLIGHT = "highlight".toCharArray(); //$NON-NLS-1$
    public static final char[] TAG_REPLACE = "replace".toCharArray(); //$NON-NLS-1$

    // Tag names array
    public static final char[][] TAG_NAMES = {
        CharOperation.NO_CHAR,
        TAG_DEPRECATED, /* 1 */
        TAG_PARAM, /* 2 */
        TAG_RETURN, /* 3 */
        TAG_THROWS, /* 4 */
        TAG_EXCEPTION, /* 5 */
        TAG_SEE, /* 6 */
        TAG_LINK, /* 7 */
        TAG_LINKPLAIN, /* 8 */
        TAG_INHERITDOC, /* 9 */
        TAG_VALUE, /* 10 */
        TAG_CATEGORY, /* 11 */
        TAG_AUTHOR, /* 12 */
        TAG_SERIAL, /* 13 */
        TAG_SERIAL_DATA, /* 14 */
        TAG_SERIAL_FIELD, /* 15 */
        TAG_SINCE, /* 16 */
        TAG_VERSION, /* 17 */
        TAG_CODE, /* 18 */
        TAG_LITERAL, /* 19 */
        TAG_DOC_ROOT, /* 20 */
        TAG_SYSTEM_PROPERTY, /* 21 */
        TAG_USES, /* 22 */
        TAG_PROVIDES, /* 23 */
        TAG_HIDDEN, /* 24 */
        TAG_INDEX, /* 25 */
        TAG_SUMMARY, /* 26 */
        TAG_API_NOTE, /* 27 */
        TAG_IMPL_SPEC, /* 28 */
        TAG_IMPL_NOTE, /* 29 */
        TAG_SNIPPET, /* 30 */
        TAG_HIGHLIGHT, /* 31 */
        TAG_REPLACE, /* 32 */
    };

    // href tag
    public static final char[] HREF_TAG = { 'h', 'r', 'e', 'f' };

    // Kind of each Javadoc tag, indexed by tag value: 0 none, 1 inline, 2 block, 3 inline or block, 4 in snippet.
    public static final short[] JAVADOC_TAG_TYPE = {
        (short) 0, // 0: no tag
        (short) 2, // 1: @deprecated
        (short) 2, // 2: @param
        (short) 2, // 3: @return
        (short) 2, // 4: @throws
        (short) 2, // 5: @exception
        (short) 2, // 6: @see
        (short) 1, // 7: {@link}
        (short) 1, // 8: {@linkplain}
        (short) 1, // 9: {@inheritDoc}
        (short) 1, // 10: {@value}
        (short) 2, // 11: @category
        (short) 2, // 12: @author
        (short) 2, // 13: @serial
        (short) 2, // 14: @serialData
        (short) 2, // 15: @serialField
        (short) 2, // 16: @since
        (short) 2, // 17: @version
        (short) 1, // 18: {@code}
        (short) 1, // 19: {@literal}
        (short) 1, // 20: {@docRoot}
        (short) 1, // 21: {@systemProperty}
        (short) 2, // 22: @uses
        (short) 2, // 23: @provides
        (short) 2, // 24: @hidden
        (short) 1, // 25: {@index}
        (short) 1, // 26: {@summary}
        (short) 2, // 27: @apiNote
        (short) 2, // 28: @implSpec
        (short) 2, // 29: @implNote
        (short) 1, // 30: {@snippet}
        (short) 4, // 31: @highlight
        (short) 4, // 32: @highlight
    };
    // Same as above with a single difference for @return (3)
    // which can now be both block (2) and inline (1) => inline or block (3)
    // Should this become complex, meaning multiple JLS levels requiring different support,
    // we will need a better model to capture that. For now, this should be enough.
    public static final short[] JAVADOC_TAG_TYPE_16PLUS = {
        (short) 0, // 0: no tag
        (short) 2, // 1: @deprecated
        (short) 2, // 2: @param
        (short) 3, // 3: @return
        (short) 2, // 4: @throws
        (short) 2, // 5: @exception
        (short) 2, // 6: @see
        (short) 1, // 7: {@link}
        (short) 1, // 8: {@linkplain}
        (short) 1, // 9: {@inheritDoc}
        (short) 1, // 10: {@value}
        (short) 2, // 11: @category
        (short) 2, // 12: @author
        (short) 2, // 13: @serial
        (short) 2, // 14: @serialData
        (short) 2, // 15: @serialField
        (short) 2, // 16: @since
        (short) 2, // 17: @version
        (short) 1, // 18: {@code}
        (short) 1, // 19: {@literal}
        (short) 1, // 20: {@docRoot}
        (short) 1, // 21: {@systemProperty}
        (short) 2, // 22: @uses
        (short) 2, // 23: @provides
        (short) 2, // 24: @hidden
        (short) 1, // 25: {@index}
        (short) 1, // 26: {@summary}
        (short) 2, // 27: @apiNote
        (short) 2, // 28: @implSpec
        (short) 2, // 29: @implNote
        (short) 1, // 30: {@snippet}
        (short) 4, // 31: @highlight
        (short) 4, // 32: @highlight
    };

    // Parse infos
    public Scanner scanner;
    public char[] source;
    protected Parser sourceParser;
    private TerminalToken currentTokenType = TokenNameInvalid;

    // Options
    public boolean checkDocComment = false;
    public boolean setJavadocPositions = false;
    public boolean reportProblems;
    protected long sourceLevel;

    // Support for {@inheritDoc}
    protected long[] inheritedPositions;
    protected int inheritedPositionsPtr;

    // Results
    protected boolean deprecated;
    protected Object returnStatement;

    // Positions
    protected int javadocStart, javadocEnd;
    protected int javadocTextEnd = -1;
    protected int firstTagPosition;
    protected int index, lineEnd;
    protected int tokenPreviousPosition, lastIdentifierEndPosition, starPosition;
    protected int textStart;
    protected int memberStart;
    protected int tagSourceStart, tagSourceEnd;
    protected int inlineTagStart;
    protected int[] lineEnds;

    // Flags
    protected boolean markdown = false;
    protected boolean lineStarted = false;
    protected boolean inlineTagStarted = false;
    protected boolean inlineReturn = false;
    protected int inlineReturnStart = -1;
    protected int inlineReturnOpenBraces = 0;
    protected boolean abort = false;
    protected int kind;
    protected int tagValue = 0;
    protected int lastBlockTagValue = 0;
    protected boolean snippetInlineTagStarted = false;
    private int nonRegionTagCount, inlineTagCount;

    protected IMarkdownCommentHelper markdownHelper;

    // Line pointers
    private int linePtr, lastLinePtr;

    // Identifier stack
    protected int identifierPtr;
    protected char[][] identifierStack;
    protected int identifierLengthPtr;
    protected int[] identifierLengthStack;
    protected long[] identifierPositionStack;

    protected int astPtr;
    protected Object[] astStack;
    protected int astLengthPtr;
    protected int[] astLengthStack;

    // Uses stack
    protected int usesReferencesPtr = -1;
    protected TypeReference[] usesReferencesStack;

    // Provides stack
    protected int providesReferencesPtr = -1;
    protected TypeReference[] providesReferencesStack;

    protected AbstractCommentParser(Parser sourceParser) {
        this.sourceParser = sourceParser;
        this.scanner = new Scanner(false, false, 3407872L, null, null, true/* taskCaseSensitive */,
            sourceParser != null && this.sourceParser.options.enablePreviewFeatures);
        this.identifierStack = new char[20][];
        this.identifierPositionStack = new long[20];
        this.identifierLengthStack = new int[10];
        this.astStack = new Object[30];
        this.astLengthStack = new int[20];
        this.reportProblems = sourceParser != null;
        setSourceComplianceLevel();
    }

    /*
     * (non-Javadoc) Returns true if tag @deprecated is present in javadoc comment.
     *
     * If javadoc checking is enabled, will also construct an Javadoc node, which will be stored into Parser.javadoc
     * slot for being consumed later on.
     */
    protected boolean commentParse() {
        boolean validComment = true;
        try {
            // Init local variables
            this.astLengthPtr = -1;
            this.astPtr = -1;
            this.identifierPtr = -1;
            this.currentTokenType = TokenNameInvalid;
            setInlineTagStarted(false);
            this.inlineTagStart = -1;
            this.lineStarted = false;
            this.returnStatement = null;
            this.inheritedPositions = null;
            this.lastBlockTagValue = 0;
            this.deprecated = false;
            this.lastLinePtr = getLineNumber(this.javadocEnd);
            this.textStart = -1;
            this.abort = false;
            char previousChar;
            int invalidTagLineEnd = -1;
            int invalidInlineTagLineEnd = -1;
            boolean lineHasStar = true;
            boolean verifText = (this.kind & 512) != 0;
            boolean isDomParser = (this.kind & 2) != 0;
            boolean isFormatterParser = (this.kind & 32) != 0;
            int lastStarPosition = -1;
            boolean annotationAtSymbolHandling = false;

            // Init scanner position
            this.markdown = this.source[this.javadocStart + 1] == '/';
            this.linePtr = getLineNumber(this.firstTagPosition);
            int realStart = this.javadocStart;
            if (!this.markdown) {
                realStart = this.linePtr == 1 ? this.javadocStart : this.scanner.getLineEnd(this.linePtr - 1) + 1;
                if (realStart < this.javadocStart)
                    realStart = this.javadocStart;
            } else {
                this.linePtr = getLineNumber(realStart);
            }
            this.scanner.resetTo(realStart, this.javadocEnd);
            this.index = realStart;
            if (realStart == this.javadocStart) {
                readChar(); // starting '/'
                readChar(); // first '*'
            }
            int previousPosition;
            char nextCharacter = 0;
            this.markdownHelper = IMarkdownCommentHelper.create(this);
            if (realStart == this.javadocStart) {
                nextCharacter = readChar(); // second '*' or '/'
                if (!this.markdown) {
                    while (peekChar() == '*') {
                        nextCharacter = readChar(); // read all contiguous '*'
                    }
                }
            }
            this.lineEnd
                = (this.linePtr == this.lastLinePtr) ? this.javadocEnd : this.scanner.getLineEnd(this.linePtr) - 1;
            this.javadocTextEnd = this.javadocEnd - 2; // supposed text end, it will be refined later...
            // https://bugs.eclipse.org/bugs/show_bug.cgi?id=206345
            // when parsing tags such as @code and @literal,
            // any tag should be discarded and considered as plain text until
            // properly closed with closing brace
            boolean considerTagAsPlainText = false;
            // internal counter for opening braces
            int openingBraces = 0;
            // Loop on each comment character
            int textEndPosition = -1;
            while (!this.abort && this.index < this.javadocEnd) {

                // Store previous position and char
                previousPosition = this.index;
                previousChar = nextCharacter;

                // Calculate line end (cannot use this.scanner.linePtr as scanner does not parse line ends again)
                if (this.index > (this.lineEnd + 1)) {
                    updateLineEnd();
                }

                // Read next char only if token was consumed
                if (this.currentTokenType == TokenNameInvalid) {
                    nextCharacter = readChar(); // consider unicodes
                } else {
                    previousPosition = this.scanner.getCurrentTokenStartPosition();
                    switch (this.currentTokenType) {
                        case TokenNameRBRACE:
                            nextCharacter = '}';
                            break;

                        case TokenNameMULTIPLY:
                            nextCharacter = '*';
                            break;

                        default:
                            nextCharacter = this.scanner.currentCharacter;
                    }
                    consumeToken();
                }

                if (this.markdown
                    && !Character.isWhitespace(nextCharacter)
                    && nextCharacter != '/'
                    && nextCharacter != '`') {
                    this.markdownHelper.recordText();
                }
                // Consume rules depending on the read character
                switch (nextCharacter) {
                    case '@':
                        // Start tag parsing only if we are on line beginning or at inline tag beginning
                        // https://bugs.eclipse.org/bugs/show_bug.cgi?id=206345: ignore all tags when inside @literal or
                        // @code tags
                        if (considerTagAsPlainText || this.markdownHelper.isInCode()) {
                            // new tag found
                            if (!this.lineStarted && !checkInlineTagForAnnotaion()) {
                                // we may want to report invalid syntax when no closing brace found,
                                // or when incoherent number of closing braces found
                                if (openingBraces > 0 && this.reportProblems) {
                                    this.sourceParser.problemReporter()
                                        .javadocUnterminatedInlineTag(this.inlineTagStart, invalidInlineTagLineEnd);
                                }
                                considerTagAsPlainText = false;
                                this.inlineTagStarted = false;
                                openingBraces = 0;
                            }
                        } else if ((!this.lineStarted || previousChar == '{')) {
                            if (this.inlineTagStarted && !this.inlineReturn) {
                                setInlineTagStarted(false);
                                // bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=53279
                                // Cannot have @ inside inline comment
                                if (this.reportProblems) {
                                    int end = Math.min(previousPosition, invalidInlineTagLineEnd);
                                    this.sourceParser.problemReporter()
                                        .javadocUnterminatedInlineTag(this.inlineTagStart, end);
                                }
                                validComment = false;
                                if (this.textStart != -1 && this.textStart < textEndPosition) {
                                    pushText(this.textStart, textEndPosition);
                                }
                                if (isDomParser || isFormatterParser) {
                                    refreshInlineTagPosition(textEndPosition);
                                }
                            }
                            if (previousChar == '{') {
                                if (this.textStart != -1) {
                                    if (this.textStart < textEndPosition) {
                                        pushText(this.textStart, textEndPosition);
                                    }
                                }
                                setInlineTagStarted(true);
                                invalidInlineTagLineEnd = this.lineEnd;
                            } else if (this.textStart != -1 && this.textStart < invalidTagLineEnd) {
                                pushText(this.textStart, invalidTagLineEnd);
                            }
                            this.scanner.resetTo(this.index, this.javadocEnd);
                            this.currentTokenType = TokenNameInvalid; // flush token cache at line begin
                            try {
                                if (!parseTag(previousPosition)) {
                                    // bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=51600
                                    // do not stop the inline tag when error is encountered to get text after
                                    validComment = false;
                                    // bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=51600
                                    // for DOM AST node, store tag as text in case of invalid syntax
                                    if (isDomParser) {
                                        createTag();
                                    }
                                    this.textStart = this.tagSourceEnd + 1;
                                    invalidTagLineEnd = this.lineEnd;
                                    textEndPosition = this.index;
                                }
                                // https://bugs.eclipse.org/bugs/show_bug.cgi?id=206345
                                // dealing with @literal or @code tags: ignore next tags
                                if (!isFormatterParser && (this.tagValue == 19 || this.tagValue == 18)) {
                                    considerTagAsPlainText = true;
                                    openingBraces++;
                                }
                            } catch (InvalidInputException e) {
                                consumeToken();
                            }
                        } else {
                            textEndPosition = this.index;
                            if (verifText && this.tagValue == 3 && this.returnStatement != null) {
                                refreshReturnStatement();
                            } else if (isFormatterParser) {
                                if (this.textStart == -1)
                                    this.textStart = previousPosition;
                            }
                        }
                        this.lineStarted = true;
                        break;

                    case '\r':
                    case '\n':
                        if (this.lineStarted) {
                            if (isFormatterParser && !ScannerHelper.isWhitespace(previousChar)) {
                                textEndPosition = previousPosition;
                            }
                            if (this.textStart != -1 && this.textStart < textEndPosition) {
                                pushText(annotationAtSymbolHandling ? this.textStart - 1 : this.textStart,
                                    textEndPosition);
                            }
                        }
                        annotationAtSymbolHandling = false;
                        this.lineStarted = false;
                        lineHasStar = false;
                        // Fix bug 51650
                        this.textStart = -1;
                        this.markdownHelper.resetAtLineEnd();
                        break;

                    case '}':
                        if (verifText && this.tagValue == 3 && this.returnStatement != null) {
                            refreshReturnStatement();
                        }
                        // https://bugs.eclipse.org/bugs/show_bug.cgi?id=206345: when ignoring tags, only decrement the
                        // opening braces counter
                        if (considerTagAsPlainText) {
                            invalidInlineTagLineEnd = this.lineEnd;
                            if (--openingBraces == 0) {
                                considerTagAsPlainText = false; // re-enable tag validation
                            }
                        }
                        boolean isLiteralOrCode = this.tagValue == 19 || this.tagValue == 18;
                        boolean shouldCloseInlineTag = this.inlineTagStarted
                            && !considerTagAsPlainText
                            && !(isLiteralOrCode && openingBraces != 0);
                        if (this.inlineTagStarted) {
                            textEndPosition = this.index - 1;
                            boolean treatAsText
                                = considerTagAsPlainText || (this.inlineReturn && this.inlineReturnOpenBraces > 0);
                            // https://bugs.eclipse.org/bugs/show_bug.cgi?id=206345: do not push text yet if ignoring
                            // tags
                            if (!treatAsText) {
                                if (this.lineStarted && this.textStart != -1 && this.textStart < textEndPosition) {
                                    pushText(this.textStart, textEndPosition);
                                }
                                refreshInlineTagPosition(previousPosition);
                            } else if ((this.source[this.index] == '\n' || this.source[this.index] == '\r')
                                && !shouldAbortDueToJavadocTag(previousPosition)) {
                                pushText(previousPosition, this.index); // Enables adding closing curly brackets to node
                                                                        // elements in Javadoc when the TagElement spans
                                                                        // multiple lines
                            }
                            if (!isFormatterParser
                                && !treatAsText
                                && (!this.inlineReturn || this.inlineReturnOpenBraces <= 0))
                                this.textStart = this.index;
                            if (shouldCloseInlineTag) {
                                setInlineTagStarted(false);
                                annotationAtSymbolHandling = false;
                            }
                            if (this.inlineReturn) {
                                if (this.inlineReturnOpenBraces > 0) {
                                    --this.inlineReturnOpenBraces;
                                    setInlineTagStarted(true);
                                } else if (this.inlineTagStart > this.inlineReturnStart) {
                                    setInlineTagStarted(true);
                                    this.inlineTagStart = this.inlineReturnStart;
                                } else {
                                    this.inlineReturn = false;
                                    this.inlineReturnStart = -1;
                                }
                            }
                        } else {
                            if (!this.lineStarted) {
                                this.textStart = previousPosition;
                            }
                        }
                        this.lineStarted = true;
                        textEndPosition = this.index;
                        break;

                    case '{':
                        if (verifText && this.tagValue == 3 && this.returnStatement != null) {
                            refreshReturnStatement();
                        }
                        boolean doNotResetInlineTagStart = considerTagAsPlainText;
                        // https://bugs.eclipse.org/bugs/show_bug.cgi?id=206345: count opening braces when ignoring tags
                        if (considerTagAsPlainText) {
                            openingBraces++;
                            if (this.source[this.index] == '\n' || this.source[this.index] == '\r') {
                                pushText(this.textStart, this.index); // Enables adding opening curly brackets to node
                                                                      // elements in Javadoc when the TagElement spans
                                                                      // multiple lines
                            }
                        } else if (this.inlineTagStarted) {
                            if (this.tagValue == 3) {
                                this.inlineReturn = true;
                                this.inlineReturnStart = this.inlineTagStart;
                            }
                            if (this.inlineReturn && peekChar() != '@') {
                                ++this.inlineReturnOpenBraces;
                                doNotResetInlineTagStart = true;
                            } else {
                                if (this.lineStarted && this.textStart != -1 && this.textStart < textEndPosition) {
                                    pushText(this.textStart, textEndPosition);
                                }
                                setInlineTagStarted(false);
                                // bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=53279
                                // Cannot have opening brace in inline comment
                                if (this.reportProblems && !this.inlineReturn) {
                                    int end = Math.min(previousPosition, invalidInlineTagLineEnd);
                                    this.sourceParser.problemReporter()
                                        .javadocUnterminatedInlineTag(this.inlineTagStart, end);
                                }
                                refreshInlineTagPosition(textEndPosition);
                                textEndPosition = this.index;
                            }
                        } else if (peekChar() != '@') {
                            if (this.textStart == -1)
                                this.textStart = previousPosition;
                            textEndPosition = this.index;
                        }
                        if (!this.lineStarted && !this.inlineReturn) {
                            this.textStart = previousPosition;
                        }
                        this.lineStarted = true;
                        // https://bugs.eclipse.org/bugs/show_bug.cgi?id=206345: do not update tag start position when
                        // ignoring tags
                        if (!doNotResetInlineTagStart)
                            this.inlineTagStart = previousPosition;
                        break;

                    case '\u000c': /* FORM FEED */
                    case ' ': /* SPACE */
                    case '\t': /* HORIZONTAL TABULATION */
                        // Do not include trailing spaces in text while formatting
                        if (isFormatterParser) {
                            if (!ScannerHelper.isWhitespace(previousChar)) {
                                textEndPosition = previousPosition;
                            }
                        } else if (this.lineStarted && isDomParser) {
                            textEndPosition = this.index;
                        } else if (!this.lineStarted && this.markdownHelper.recordSignificantLeadingSpace()) {
                            if (this.textStart == -1)
                                this.textStart = this.index; // first relevant whitespace is start of text
                        }
                        break;

                    case '*':
                        // Store the star position as text start while formatting
                        if (!this.markdown) {
                            lastStarPosition = previousPosition;
                            if (previousChar != '*') {
                                this.starPosition = previousPosition;
                                if (isDomParser || isFormatterParser) {
                                    if (lineHasStar) {
                                        this.lineStarted = true;
                                        if (this.textStart == -1) {
                                            this.textStart = previousPosition;
                                            if (this.index <= this.javadocTextEnd)
                                                textEndPosition = this.index;
                                        }
                                    }
                                    if (!this.lineStarted) {
                                        lineHasStar = true;
                                    }
                                }
                            }
                        } else {
                            if (this.index == this.javadocEnd) {
                                pushText(this.textStart, this.javadocEnd);
                            }
                        }
                        break;

                    //$FALL-THROUGH$
                    case '/':
                        if (this.markdown) {
                            this.markdownHelper.recordSlash(this.index);
                            break;
                        } else if (previousChar == '*') {
                            // End of javadoc
                            break;
                        }
                        // $FALL-THROUGH$ - fall through default case
                    default:
                        if (this.markdown) {
                            if (nextCharacter == '[' && !this.markdownHelper.isInCode()) {
                                if (this.textStart != -1) {
                                    if (this.textStart < textEndPosition) {
                                        pushText(this.textStart, textEndPosition);
                                    }
                                }
                                if (parseMarkdownLinks(previousPosition)) {
                                    this.textStart = this.index;
                                    break;
                                }
                            } else if (nextCharacter == '`' || nextCharacter == '~') {
                                this.markdownHelper.recordFenceChar(previousChar, nextCharacter, this.lineStarted);
                            }
                        }
                        if (isFormatterParser && nextCharacter == '<') {
                            // html tags are meaningful for formatter parser
                            int initialIndex = this.index;
                            this.scanner.resetTo(this.index, this.javadocEnd);
                            if (!ScannerHelper.isWhitespace(previousChar)) {
                                textEndPosition = previousPosition;
                            }

                            if (this.abort)
                                return false;
                            // Wrong html syntax continue to process character normally
                            this.scanner.currentPosition = initialIndex;
                            this.index = initialIndex;
                        }
                        if (verifText && this.tagValue == 3 && this.returnStatement != null) {
                            refreshReturnStatement();
                        }
                        if (!this.lineStarted || this.textStart == -1) {
                            this.textStart = previousPosition;
                        }
                        if (previousChar == '@' && checkInlineTagForAnnotaion()) {
                            annotationAtSymbolHandling = true;
                        }
                        this.lineStarted = true;
                        textEndPosition = this.index;
                        break;
                }
            }
            this.javadocTextEnd = this.starPosition - 1;

            // bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=53279
            // Cannot leave comment inside inline comment
            // https://bugs.eclipse.org/bugs/show_bug.cgi?id=206345: handle unterminated @code or @literal tag
            if (this.inlineTagStarted || considerTagAsPlainText) {
                if (this.reportProblems) {
                    int end = Math.min(this.javadocTextEnd, invalidInlineTagLineEnd);
                    if (this.index >= this.javadocEnd)
                        end = invalidInlineTagLineEnd;
                    this.sourceParser.problemReporter().javadocUnterminatedInlineTag(this.inlineTagStart, end);
                }
                if (this.lineStarted && this.textStart != -1 && this.textStart < textEndPosition) {
                    pushText(this.textStart, textEndPosition);
                }
                refreshInlineTagPosition(
                    (this.markdown && this.tagValue == 30) ? textEndPosition - 2 : textEndPosition);
                setInlineTagStarted(false);
            } else if (this.lineStarted
                && this.textStart != -1
                && this.textStart <= textEndPosition
                && (this.textStart < this.starPosition || this.starPosition == lastStarPosition || this.markdown)) {
                if (!(invalidInlineTagLineEnd > 0
                    && nextCharacter == '}'
                    && this.markdown
                    && this.index == this.javadocEnd))
                    pushText(this.textStart, textEndPosition);
            }
            updateDocComment();
        } catch (Exception ex) {
            validComment = false;
        }
        return validComment;
    }

    /**
     * Scans backwards from current position to find if `{ @` pattern exists before a newline. Returns true immediately
     * when pattern is found.
     */
    protected boolean shouldAbortDueToJavadocTag(int currPos) {
        int pos = currPos - 1;
        if (this.source == null || pos < 0 || pos >= this.source.length) {
            return false;
        }

        while (pos >= 0) {
            char currentChar = this.source[pos];

            // If encounter a newline, stop scanning
            if (currentChar == '\n' || currentChar == '\r') {
                pos--;
                break;
            }

            // Check for pattern
            if (currentChar == '@' && pos > 0 && this.source[pos - 1] == '{') {
                return true;
            }

            pos--;
        }
        return false;
    }

    protected boolean checkInlineTagForAnnotaion() {
        return (this.tagValue == 30 || this.tagValue == 18 || this.tagValue == 19);
    }

    protected void consumeToken() {
        this.currentTokenType = TokenNameInvalid; // flush token cache
        updateLineEnd();
    }

    protected abstract Object createArgumentReference(char[] name, int dim, boolean isVarargs, Object typeRef,
        long[] dimPos, long argNamePos) throws InvalidInputException;

    protected abstract Object createFieldReference(Object receiver) throws InvalidInputException;

    protected abstract Object createMethodReference(Object receiver, List arguments) throws InvalidInputException;

    protected abstract void createTag();

    protected abstract Object createTypeReference(TerminalToken primitiveToken, boolean canBeModule);

    protected abstract Object createModuleTypeReference(TerminalToken primitiveToken, int moduleRefTokenCount);

    private int getIndexPosition() {
        if (this.index > this.lineEnd) {
            return this.lineEnd;
        } else {
            return this.index - 1;
        }
    }

    /**
     * Search the line number corresponding to a specific position. Warning: returned position is 1-based index!
     *
     */
    private int getLineNumber(int position) {
        if (this.scanner.linePtr != -1) {
            return Util.getLineNumber(position, this.scanner.lineEnds, 0, this.scanner.linePtr);
        }
        if (this.lineEnds == null)
            return 1;
        return Util.getLineNumber(position, this.lineEnds, 0, this.lineEnds.length - 1);
    }

    protected int getTokenEndPosition() {
        return Math.min(this.scanner.getCurrentTokenEndPosition(), this.lineEnd);
    }

    /*
     * Parse argument in @see tag method reference
     */
    protected Object parseArguments(Object receiver, boolean checkVerifySpaceOrEndComment)
        throws InvalidInputException {

        // Init
        int modulo = 0; // should be 2 for (Type,Type,...) or 3 for (Type arg,Type arg,...)
        int iToken = 0;
        char[] argName = null;
        List arguments = new ArrayList(10);
        int start = this.scanner.getCurrentTokenStartPosition();
        Object typeRef;
        int dim;
        boolean isVarargs;
        long[] dimPositions = new long[20]; // assume that there won't be more than 20 dimensions...
        char[] name;
        long argNamePos;
        boolean tokenWhiteSpace = this.scanner.tokenizeWhiteSpace;
        this.scanner.tokenizeWhiteSpace = false;

        try {
            // Parse arguments declaration if method reference
            nextArg: while (this.index < this.scanner.eofPosition) {

                // Read argument type reference
                try {
                    typeRef = parseQualifiedName(false);
                    if (this.abort)
                        return null; // May be aborted by specialized parser
                } catch (InvalidInputException e) {
                    break;
                }
                boolean firstArg = modulo == 0;
                if (firstArg) { // verify position
                    if (iToken != 0)
                        break;
                } else if ((iToken % modulo) != 0) {
                    break;
                }
                if (typeRef == null) {
                    if (firstArg && this.currentTokenType == TerminalToken.TokenNameRPAREN) {
                        // verify characters after arguments declaration (expecting white space or end comment)
                        if (!verifySpaceOrEndComment()) {
                            int end = this.starPosition == -1 ? this.lineEnd : this.starPosition;
                            if (this.source[end] == '\n')
                                end--;
                            if (this.reportProblems)
                                this.sourceParser.problemReporter().javadocMalformedSeeReference(start, end);
                            return null;
                        }
                        this.lineStarted = true;
                        return createMethodReference(receiver, null);
                    }
                    break;
                }
                iToken++;

                // Read possible additional type info
                dim = 0;
                isVarargs = false;
                if (readMarkdownEscapedToken(TerminalToken.TokenNameLBRACKET)) {
                    // array declaration
                    while (readMarkdownEscapedToken(TerminalToken.TokenNameLBRACKET)) {
                        int dimStart = this.scanner.getCurrentTokenStartPosition();
                        consumeToken();
                        if (!readMarkdownEscapedToken(TerminalToken.TokenNameRBRACKET)) {
                            break nextArg;
                        }
                        consumeToken();
                        dimPositions[dim++] = (((long) dimStart) << 32) + this.scanner.getCurrentTokenEndPosition();
                    }
                } else if (readToken() == TerminalToken.TokenNameELLIPSIS) {
                    // ellipsis declaration
                    int dimStart = this.scanner.getCurrentTokenStartPosition();
                    dimPositions[dim++] = (((long) dimStart) << 32) + this.scanner.getCurrentTokenEndPosition();
                    consumeToken();
                    isVarargs = true;
                }

                // Read argument name
                argNamePos = -1;
                TerminalToken argumentName = readToken();
                if (argumentName == TerminalToken.TokenNameIdentifier
                    || argumentName == TerminalToken.TokenNameUNDERSCORE) {
                    consumeToken();
                    if (firstArg) { // verify position
                        if (iToken != 1)
                            break;
                    } else if ((iToken % modulo) != 1) {
                        break;
                    }
                    if (argName == null) { // verify that all arguments name are declared
                        if (!firstArg) {
                            break;
                        }
                    }
                    argName = this.scanner.getCurrentIdentifierSource();
                    argNamePos = (((long) this.scanner.getCurrentTokenStartPosition()) << 32)
                        + this.scanner.getCurrentTokenEndPosition();
                    iToken++;
                } else if (argName != null) { // verify that no argument name is declared
                    break;
                }

                // Verify token position
                if (firstArg) {
                    modulo = iToken + 1;
                } else {
                    if ((iToken % modulo) != (modulo - 1)) {
                        break;
                    }
                }

                // Read separator or end arguments declaration
                TerminalToken token = readToken();
                name = argName == null ? CharOperation.NO_CHAR : argName;
                if (token == TerminalToken.TokenNameCOMMA) {
                    // Create new argument
                    Object argument = createArgumentReference(name, dim, isVarargs, typeRef, dimPositions, argNamePos);
                    if (this.abort)
                        return null; // May be aborted by specialized parser
                    arguments.add(argument);
                    consumeToken();
                    iToken++;
                } else if (token == TerminalToken.TokenNameRPAREN) {
                    // verify characters after arguments declaration (expecting white space or end comment)
                    if (checkVerifySpaceOrEndComment && !verifySpaceOrEndComment()) {
                        int end = this.starPosition == -1 ? this.lineEnd : this.starPosition;
                        if (this.source[end] == '\n')
                            end--;
                        if (this.reportProblems)
                            this.sourceParser.problemReporter().javadocMalformedSeeReference(start, end);
                        return null;
                    }
                    // Create new argument
                    Object argument = createArgumentReference(name, dim, isVarargs, typeRef, dimPositions, argNamePos);
                    if (this.abort)
                        return null; // May be aborted by specialized parser
                    arguments.add(argument);
                    consumeToken();
                    return createMethodReference(receiver, arguments);
                } else {
                    break;
                }
            }

            // Something wrong happened => Invalid input
            if (this.markdown) {
                // skip over bogus token
                this.currentTokenType = TokenNameInvalid;
            }
            throw Scanner.invalidInput();
        } finally {
            // we have to make sure that this is reset to the previous value even if an exception occurs
            this.scanner.tokenizeWhiteSpace = tokenWhiteSpace;
        }
    }

    /*
     * Parse an URL link reference in @see tag
     */
    protected boolean parseHref() throws InvalidInputException {
        boolean skipComments = this.scanner.skipComments;
        this.scanner.skipComments = true;
        boolean tokenWhiteSpace = this.scanner.tokenizeWhiteSpace;
        this.scanner.tokenizeWhiteSpace = false;
        try {
            int start = this.scanner.getCurrentTokenStartPosition();
            char currentChar = readChar();
            if (currentChar == 'a' || currentChar == 'A') {
                this.scanner.currentPosition = this.index;
                TerminalToken token = readToken();
                if (token == TerminalToken.TokenNameIdentifier || token == TerminalToken.TokenNameUNDERSCORE) {
                    consumeToken();
                    try {
                        if (CharOperation.equals(this.scanner.getCurrentIdentifierSource(), HREF_TAG, false)
                            && readToken() == TerminalToken.TokenNameEQUAL) {
                            consumeToken();
                            if (readToken() == TerminalToken.TokenNameStringLiteral) {
                                consumeToken();
                                while (this.index < this.javadocEnd) { // main loop to search for the </a> pattern
                                    // Skip all characters after string literal until closing '>' (see bug 68726)
                                    while (readToken() != TerminalToken.TokenNameGREATER) {
                                        if (this.scanner.currentPosition >= this.scanner.eofPosition
                                            || this.scanner.currentCharacter == '@'
                                            || (this.inlineTagStarted && this.scanner.currentCharacter == '}')) {
                                            // Reset position: we want to rescan last token
                                            this.index = this.tokenPreviousPosition;
                                            this.scanner.currentPosition = this.tokenPreviousPosition;
                                            this.currentTokenType = TokenNameInvalid;
                                            // Signal syntax error
                                            if (this.tagValue != 10) { // do not report error for @value
                                                                       // tag, this will be done after...
                                                if (this.reportProblems)
                                                    this.sourceParser.problemReporter()
                                                        .javadocInvalidSeeHref(start, this.lineEnd);
                                            }
                                            return false;
                                        }
                                        this.currentTokenType = TokenNameInvalid; // consume token without updating line
                                                                                  // end
                                    }
                                    consumeToken(); // update line end as new lines are allowed in URL description
                                    while (readToken() != TerminalToken.TokenNameLESS) {
                                        if (this.scanner.currentPosition >= this.scanner.eofPosition
                                            || this.scanner.currentCharacter == '@'
                                            || (this.inlineTagStarted && this.scanner.currentCharacter == '}')) {
                                            // Reset position: we want to rescan last token
                                            this.index = this.tokenPreviousPosition;
                                            this.scanner.currentPosition = this.tokenPreviousPosition;
                                            this.currentTokenType = TokenNameInvalid;
                                            // Signal syntax error
                                            if (this.tagValue != 10) { // do not report error for @value
                                                                       // tag, this will be done after...
                                                if (this.reportProblems)
                                                    this.sourceParser.problemReporter()
                                                        .javadocInvalidSeeHref(start, this.lineEnd);
                                            }
                                            return false;
                                        }
                                        consumeToken();
                                    }
                                    consumeToken();
                                    start = this.scanner.getCurrentTokenStartPosition();
                                    currentChar = readChar();
                                    // search for the </a> pattern and store last char read
                                    if (currentChar == '/') {
                                        currentChar = readChar();
                                        if (currentChar == 'a' || currentChar == 'A') {
                                            currentChar = readChar();
                                            if (currentChar == '>') {
                                                return true; // valid href
                                            }
                                        }
                                    }
                                    // search for invalid char in tags
                                    if (currentChar == '\r'
                                        || currentChar == '\n'
                                        || currentChar == '\t'
                                        || currentChar == ' ') {
                                        break;
                                    }
                                }
                            }
                        }
                    } catch (InvalidInputException ex) {
                        // Do nothing as we want to keep positions for error message
                    }
                }
            }
            // Reset position: we want to rescan last token
            this.index = this.tokenPreviousPosition;
            this.scanner.currentPosition = this.tokenPreviousPosition;
            this.currentTokenType = TokenNameInvalid;
            // Signal syntax error
            if (this.tagValue != 10) { // do not report error for @value tag, this will be done after...
                if (this.reportProblems)
                    this.sourceParser.problemReporter().javadocInvalidSeeHref(start, this.lineEnd);
            }
        } finally {
            this.scanner.skipComments = skipComments;
            this.scanner.tokenizeWhiteSpace = tokenWhiteSpace;
        }
        return false;
    }

    /*
     * Parse tag followed by an identifier
     */
    protected boolean parseIdentifierTag(boolean report) {
        TerminalToken token = readTokenSafely();
        switch (token) {
            case TokenNameUNDERSCORE:
            case TokenNameIdentifier:
                pushIdentifier(true, false);
                return true;

            default:
                break;
        }
        if (report) {
            this.sourceParser.problemReporter()
                .javadocMissingIdentifier(this.tagSourceStart, this.tagSourceEnd, this.sourceParser.modifiers);
        }
        return false;
    }

    protected Object parseMember(Object receiver) throws InvalidInputException {
        return parseMember(receiver, false);
    }

    /*
     * Parse a method reference in @see tag
     */
    protected Object parseMember(Object receiver, boolean refInStringLiteral) throws InvalidInputException {
        // Init
        this.identifierPtr = -1;
        this.identifierLengthPtr = -1;
        int start = this.scanner.getCurrentTokenStartPosition();
        this.memberStart = start;

        // Get member identifier
        TerminalToken memberIdentifier = readToken();
        if (memberIdentifier == TerminalToken.TokenNameIdentifier
            || memberIdentifier == TerminalToken.TokenNameUNDERSCORE) {
            if (this.scanner.currentCharacter == '.') { // member name may be qualified (inner class constructor
                                                        // reference)
                parseQualifiedName(true);
            } else {
                consumeToken();
                pushIdentifier(true, false);
            }
            boolean tokenWhiteSpace = this.scanner.tokenizeWhiteSpace;
            this.scanner.tokenizeWhiteSpace = false;
            try {
                // Look for next token to know whether it's a field or method reference
                int previousPosition = this.index;
                try {
                    TerminalToken token = readToken();
                    if (token == TerminalToken.TokenNameLPAREN) {
                        consumeToken();
                        start = this.scanner.getCurrentTokenStartPosition();
                        try {
                            return parseArguments(receiver, !refInStringLiteral);
                        } catch (InvalidInputException e) {
                            int end = this.scanner.getCurrentTokenEndPosition() < this.lineEnd
                                ? this.scanner.getCurrentTokenEndPosition()
                                : this.scanner.getCurrentTokenStartPosition();
                            end = Math.min(end, this.lineEnd);
                            if (this.reportProblems)
                                this.sourceParser.problemReporter().javadocInvalidSeeReferenceArgs(start, end);
                        }
                        return null;
                    }
                } catch (InvalidInputException e) {
                    if (!refInStringLiteral
                        || (!"Invalid_Char_In_String".equals(e.getMessage())
                            && !"Invalid_Character_Constant".equals(e.getMessage()))) {
                        throw e;
                    }
                }

                // Reset position: we want to rescan last token
                this.index = previousPosition;
                this.scanner.currentPosition = previousPosition;
                this.currentTokenType = TokenNameInvalid;

                // Verify character(s) after identifier (expecting space or end comment)
                if (!refInStringLiteral && !verifySpaceOrEndComment()) {
                    int end = this.starPosition == -1 ? this.lineEnd : this.starPosition;
                    if (this.source[end] == '\n')
                        end--;
                    if (this.reportProblems)
                        this.sourceParser.problemReporter().javadocMalformedSeeReference(start, end);
                    return null;
                }
                return createFieldReference(receiver);
            } finally {
                this.scanner.tokenizeWhiteSpace = tokenWhiteSpace;
            }
        }
        int end = getTokenEndPosition() - 1;
        end = Math.max(start, end);
        if (this.reportProblems)
            this.sourceParser.problemReporter().javadocInvalidReference(start, end);
        // Reset position: we want to rescan last token
        this.index = this.tokenPreviousPosition;
        this.scanner.currentPosition = this.tokenPreviousPosition;
        this.currentTokenType = TokenNameInvalid;
        return null;
    }

    /*
     * Parse @param tag declaration
     */
    protected boolean parseParam() throws InvalidInputException {

        // Store current state
        int start = this.tagSourceStart;
        int end = this.tagSourceEnd;
        boolean tokenWhiteSpace = this.scanner.tokenizeWhiteSpace;
        this.scanner.tokenizeWhiteSpace = true;

        try {
            // Verify that there are whitespaces after tag
            boolean isCompletionParser = (this.kind & 8) != 0;
            if (this.scanner.currentCharacter != ' ' && !ScannerHelper.isWhitespace(this.scanner.currentCharacter)) {
                if (this.reportProblems)
                    this.sourceParser.problemReporter()
                        .javadocInvalidTag(start, this.scanner.getCurrentTokenEndPosition());
                if (!isCompletionParser) {
                    this.scanner.currentPosition = start;
                    this.index = start;
                }
                this.currentTokenType = TokenNameInvalid;
                return false;
            }

            // Get first non whitespace token
            this.identifierPtr = -1;
            this.identifierLengthPtr = -1;
            boolean hasMultiLines = this.scanner.currentPosition > (this.lineEnd + 1);
            boolean isTypeParam = false;
            boolean valid = true, empty = true;
            TerminalToken token = TokenNameInvalid;
            nextToken: while (true) {
                this.currentTokenType = TokenNameInvalid;
                try {
                    token = readToken();
                } catch (InvalidInputException e) {
                    valid = false;
                }
                switch (token) {
                    case TokenNameUNDERSCORE:
                    case TokenNameIdentifier:
                        if (valid) {
                            // store param name id
                            pushIdentifier(true, false);
                            start = this.scanner.getCurrentTokenStartPosition();
                            end = hasMultiLines ? this.lineEnd : this.scanner.getCurrentTokenEndPosition();
                            break nextToken;
                        }
                        // $FALL-THROUGH$ - fall through next case to report error
                    case TokenNameLESS:
                        if (valid) {
                            // store '<' in identifiers stack as we need to add it to tag element (bug 79809)
                            pushIdentifier(true, true);
                            start = this.scanner.getCurrentTokenStartPosition();
                            end = hasMultiLines ? this.lineEnd : this.scanner.getCurrentTokenEndPosition();
                            isTypeParam = true;
                            break nextToken;
                        }
                        // $FALL-THROUGH$ - fall through next case to report error
                    default:
                        if (token == TerminalToken.TokenNameLEFT_SHIFT)
                            isTypeParam = true;
                        if (valid && !hasMultiLines)
                            start = this.scanner.getCurrentTokenStartPosition();
                        valid = false;
                        if (!hasMultiLines) {
                            empty = false;
                            end = this.scanner.getCurrentTokenEndPosition();
                            break;
                        }
                        end = this.lineEnd;
                        // $FALL-THROUGH$ - when several lines, fall through next case to report problem immediately
                    case TokenNameWHITESPACE:
                        if (this.scanner.currentPosition > (this.lineEnd + 1))
                            hasMultiLines = true;
                        if (valid)
                            break;
                        // $FALL-THROUGH$ - if not valid fall through next case to report error
                    case TokenNameEOF:
                        if (this.reportProblems)
                            if (empty)
                                this.sourceParser.problemReporter()
                                    .javadocMissingParamName(start, end, this.sourceParser.modifiers);
                            else if (isTypeParam)
                                this.sourceParser.problemReporter().javadocInvalidParamTypeParameter(start, end);
                            else
                                this.sourceParser.problemReporter().javadocInvalidParamTagName(start, end);
                        if (!isCompletionParser) {
                            this.scanner.currentPosition = start;
                            this.index = start;
                        }
                        this.currentTokenType = TokenNameInvalid;
                        return false;
                }
            }

            // Scan more tokens for type parameter declaration
            if (isTypeParam) {
                // Get type parameter name
                nextToken: while (true) {
                    this.currentTokenType = TokenNameInvalid;
                    try {
                        token = readToken();
                    } catch (InvalidInputException e) {
                        valid = false;
                    }
                    switch (token) {
                        case TokenNameWHITESPACE:
                            if (valid && this.scanner.currentPosition <= (this.lineEnd + 1)) {
                                break;
                            }
                            // $FALL-THROUGH$ - if not valid fall through next case to report error
                        case TokenNameEOF:
                            if (this.reportProblems)
                                this.sourceParser.problemReporter().javadocInvalidParamTypeParameter(start, end);
                            if (!isCompletionParser) {
                                this.scanner.currentPosition = start;
                                this.index = start;
                            }
                            this.currentTokenType = TokenNameInvalid;
                            return false;

                        case TokenNameUNDERSCORE:
                        case TokenNameIdentifier:
                            end = hasMultiLines ? this.lineEnd : this.scanner.getCurrentTokenEndPosition();
                            if (valid) {
                                // store param name id
                                pushIdentifier(false, false);
                                break nextToken;
                            }
                            break;

                        default:
                            end = hasMultiLines ? this.lineEnd : this.scanner.getCurrentTokenEndPosition();
                            valid = false;
                            break;
                    }
                }

                // Get last character of type parameter declaration
                boolean spaces = false;
                nextToken: while (true) {
                    this.currentTokenType = TokenNameInvalid;
                    try {
                        token = readToken();
                    } catch (InvalidInputException e) {
                        valid = false;
                    }
                    switch (token) {
                        case TokenNameWHITESPACE:
                            if (this.scanner.currentPosition > (this.lineEnd + 1)) {
                                // do not accept type parameter declaration on several lines
                                hasMultiLines = true;
                                valid = false;
                            }
                            spaces = true;
                            if (valid)
                                break;
                            // $FALL-THROUGH$ - if not valid fall through next case to report error
                        case TokenNameEOF:
                            if (this.reportProblems)
                                this.sourceParser.problemReporter().javadocInvalidParamTypeParameter(start, end);
                            if (!isCompletionParser) {
                                this.scanner.currentPosition = start;
                                this.index = start;
                            }
                            this.currentTokenType = TokenNameInvalid;
                            return false;

                        case TokenNameGREATER:
                            end = hasMultiLines ? this.lineEnd : this.scanner.getCurrentTokenEndPosition();
                            if (valid) {
                                // store '>' in identifiers stack as we need to add it to tag element (bug 79809)
                                pushIdentifier(false, true);
                                break nextToken;
                            }
                            break;

                        default:
                            if (!spaces)
                                end = hasMultiLines ? this.lineEnd : this.scanner.getCurrentTokenEndPosition();
                            valid = false;
                            break;
                    }
                }
            }

            // Verify that tag name is well followed by white spaces
            this.currentTokenType = TokenNameInvalid;
            int restart = this.scanner.currentPosition;
            try {
                token = readTokenAndConsume();
            } catch (InvalidInputException e) {
                valid = false;
            }
            if (token == TerminalToken.TokenNameWHITESPACE) {
                this.scanner.resetTo(restart, this.javadocEnd);
                this.index = restart;
                return pushParamName(isTypeParam);
            }
            // Report problem
            this.currentTokenType = TokenNameInvalid;
            if (isCompletionParser)
                return false;
            if (this.reportProblems) {
                // we only need end if we report problems
                end = hasMultiLines ? this.lineEnd : this.scanner.getCurrentTokenEndPosition();
                try {
                    while ((token = readToken()) != TerminalToken.TokenNameWHITESPACE
                        && token != TerminalToken.TokenNameEOF) {
                        this.currentTokenType = TokenNameInvalid;
                        end = hasMultiLines ? this.lineEnd : this.scanner.getCurrentTokenEndPosition();
                    }
                } catch (InvalidInputException e) {
                    end = this.lineEnd;
                }
                if (isTypeParam)
                    this.sourceParser.problemReporter().javadocInvalidParamTypeParameter(start, end);
                else
                    this.sourceParser.problemReporter().javadocInvalidParamTagName(start, end);
            }
            this.scanner.currentPosition = start;
            this.index = start;
            this.currentTokenType = TokenNameInvalid;
            return false;
        } finally {
            // we have to make sure that this is reset to the previous value even if an exception occurs
            this.scanner.tokenizeWhiteSpace = tokenWhiteSpace;
        }
    }

    private boolean isTokenModule(TerminalToken token, int moduleRefTokenCount) {
        return ((token == TerminalToken.TokenNameDIVIDE) && (moduleRefTokenCount > 0));
    }

    protected Object parseQualifiedName(boolean reset) throws InvalidInputException {
        return parseQualifiedName(reset, false);
    }

    /*
     * Parse a qualified name and built a type reference if the syntax is valid.
     */
    protected Object parseQualifiedName(boolean reset, boolean allowModule) throws InvalidInputException {

        // Reset identifier stack if requested
        if (reset) {
            this.identifierPtr = -1;
            this.identifierLengthPtr = -1;
        }

        // Scan tokens
        TerminalToken primitiveToken = TokenNameInvalid;
        int parserKind = this.kind & 255;
        TerminalToken prevToken;
        TerminalToken curToken = TokenNameNotAToken;
        int moduleRefTokenCount = 0;
        boolean lookForModule = false;
        boolean parsingJava15Plus = this.scanner != null && this.scanner.sourceLevel >= 3866624L;
        boolean stop = false;
        nextToken: for (int iToken = 0;; iToken++) {
            if (iToken == 0) {
                lookForModule = false;
                prevToken = TokenNameNotAToken;
            } else {
                prevToken = curToken;
            }
            if (stop) {
                if (parserKind != 8) {
                    break;
                }
            }
            TerminalToken token = readTokenSafely();
            curToken = token;
            switch (token) {
                case TokenNameUNDERSCORE:
                case TokenNameIdentifier:
                    if (((iToken & 1) != 0)) { // identifiers must be odd tokens
                        break nextToken;
                    }
                    pushIdentifier(iToken == 0, false);
                    consumeToken();
                    if (allowModule && parsingJava15Plus && getChar() == '/') {
                        lookForModule = true;
                    }
                    break;

                case TokenNameRestrictedIdentifierYield:
                    throw Scanner.invalidInput(); // unexpected.

                case TokenNameDOT:
                    if ((iToken & 1) == 0) { // dots must be even tokens
                        throw Scanner.invalidInput();
                    }
                    consumeToken();
                    break;

                case TokenNameabstract:
                case TokenNameassert:
                case TokenNameboolean:
                case TokenNamebreak:
                case TokenNamebyte:
                case TokenNamecase:
                case TokenNamecatch:
                case TokenNamechar:
                case TokenNameclass:
                case TokenNamecontinue:
                case TokenNamedefault:
                case TokenNamedo:
                case TokenNamedouble:
                case TokenNameelse:
                case TokenNameextends:
                case TokenNamefalse:
                case TokenNamefinal:
                case TokenNamefinally:
                case TokenNamefloat:
                case TokenNamefor:
                case TokenNameif:
                case TokenNameimplements:
                case TokenNameimport:
                case TokenNameinstanceof:
                case TokenNameint:
                case TokenNameinterface:
                case TokenNamelong:
                case TokenNamenative:
                case TokenNamenew:
                case TokenNamenon_sealed:
                case TokenNamenull:
                case TokenNamepackage:
                case TokenNameRestrictedIdentifierpermits:
                case TokenNameprivate:
                case TokenNameprotected:
                case TokenNamepublic:
                case TokenNameRestrictedIdentifiersealed:
                case TokenNameshort:
                case TokenNamestatic:
                case TokenNamestrictfp:
                case TokenNamesuper:
                case TokenNameswitch:
                case TokenNamesynchronized:
                case TokenNamethis:
                case TokenNamethrow:
                case TokenNametransient:
                case TokenNametrue:
                case TokenNametry:
                case TokenNamevoid:
                case TokenNamevolatile:
                case TokenNamewhile:
                    if (iToken == 0) {
                        pushIdentifier(true, true);
                        primitiveToken = token;
                        consumeToken();
                        break nextToken;
                    }
                    // Fall through default case to verify that we do not leave on a dot
                    // $FALL-THROUGH$
                case TokenNameDIVIDE:
                    if (parsingJava15Plus && lookForModule) {
                        if (((iToken & 1) == 0) || (moduleRefTokenCount > 0)) { // '/' must be even token
                            throw Scanner.invalidInput();
                        }
                        moduleRefTokenCount = (iToken + 1) / 2;
                        consumeToken();
                        lookForModule = false;
                        if (!considerNextChar()) {
                            stop = true;
                        }
                        break;
                    } // else fall through
                      // Note: Add other cases before this case.
                      // $FALL-THROUGH$
                default:
                    if (iToken == 0) {
                        if (this.identifierPtr >= 0) {
                            this.lastIdentifierEndPosition = (int) this.identifierPositionStack[this.identifierPtr];
                        }
                        return null;
                    }
                    if ((iToken & 1) == 0 && !isTokenModule(prevToken, moduleRefTokenCount)) { // cannot leave on a dot
                        switch (parserKind) {
                            case 8:
                                if (this.identifierPtr >= 0) {
                                    this.lastIdentifierEndPosition
                                        = (int) this.identifierPositionStack[this.identifierPtr];
                                }
                                if (moduleRefTokenCount > 0) {
                                    return null;
                                }
                                return null;

                            case 2:
                                if (this.currentTokenType != TokenNameInvalid) {
                                    // Reset position: we want to rescan last token
                                    this.index = this.tokenPreviousPosition;
                                    this.scanner.currentPosition = this.tokenPreviousPosition;
                                    this.currentTokenType = TokenNameInvalid;
                                }
                                // $FALL-THROUGH$ - fall through default case to raise exception
                            default:
                                throw Scanner.invalidInput();
                        }
                    }
                    break nextToken;
            }
        }
        // Reset position: we want to rescan last token
        if (parserKind != 8 && this.currentTokenType != TokenNameInvalid) {
            this.index = this.tokenPreviousPosition;
            this.scanner.currentPosition = this.tokenPreviousPosition;
            this.currentTokenType = TokenNameInvalid;
        }
        if (this.identifierPtr >= 0) {
            this.lastIdentifierEndPosition = (int) this.identifierPositionStack[this.identifierPtr];
        }
        if (moduleRefTokenCount > 0) {
            return createModuleTypeReference(primitiveToken, moduleRefTokenCount);
        }
        return createTypeReference(primitiveToken, (allowModule && parsingJava15Plus));
    }

    protected boolean parseReference() {
        return parseReference(false);
    }

    // Parses a complete URL reference starting from current position
    protected boolean parseURLReference(int pos, boolean advanceEndPos) {
        char[] fullURL;
        int firstTokenStartPos;
        StringBuilder urlBuilder = new StringBuilder();
        char c;
        firstTokenStartPos = pos;
        while (pos < this.source.length) {
            c = this.source[pos];
            if (c == '[') // invalid syntax for url
                return false;
            if (c == '(' || c == ' ') {
                pos++;
                continue;
            }
            if (c == '\n' || c == '\r' || c == ')') {
                break;
            }
            urlBuilder.append(c);
            pos++;
        }
        if (advanceEndPos)
            this.index = pos;
        fullURL = urlBuilder.toString().toCharArray();

        this.identifierPtr = 0;
        this.identifierStack[this.identifierPtr] = fullURL;
        this.identifierPositionStack[this.identifierPtr] = (((long) firstTokenStartPos) << 32) + (pos - 1);
        this.identifierLengthStack[this.identifierLengthPtr] = 1;
        Object typeRef = createTypeReference(TerminalToken.TokenNameInvalid, true);
        pushSeeRef(typeRef);
        return true;
    }

    /*
     * Parse a reference in @see tag
     */
    protected boolean parseReference(boolean allowModule) {
        int currentPosition = this.scanner.currentPosition;
        boolean tokenWhiteSpace = this.scanner.tokenizeWhiteSpace;
        this.scanner.tokenizeWhiteSpace = false;
        try {
            Object typeRef = null;
            Object reference;
            int previousPosition;
            int typeRefStartPosition = -1;

            // Get reference tokens
            nextToken: while (this.index < this.scanner.eofPosition) {
                previousPosition = this.index;
                TerminalToken token = readTokenSafely();
                this.scanner.tokenizeWhiteSpace = true;
                switch (token) {
                    case TokenNameStringLiteral: // @see "string"
                        // If typeRef != null we may raise a warning here to let user know there's an unused
                        // reference...
                        // Currently as javadoc 1.4.2 ignore it, we do the same (see bug 69302)
                        if (typeRef != null)
                            break nextToken;
                        consumeToken();
                        int start = this.scanner.getCurrentTokenStartPosition();
                        if (this.tagValue == 10) {
                            // String reference are not allowed for @value tag
                            if (this.reportProblems)
                                this.sourceParser.problemReporter()
                                    .javadocInvalidValueReference(start, getTokenEndPosition(),
                                        this.sourceParser.modifiers);
                            return false;
                        }

                        // verify end line
                        if (verifyEndLine(previousPosition)) {
                            return true;
                        }
                        if (this.reportProblems)
                            this.sourceParser.problemReporter()
                                .javadocUnexpectedText(this.scanner.currentPosition, this.lineEnd);
                        return false;

                    case TokenNameLESS: // @see <a href="URL#Value">label</a>
                        // If typeRef != null we may raise a warning here to let user know there's an unused
                        // reference...
                        // Currently as javadoc 1.4.2 ignore it, we do the same (see bug 69302)
                        if (typeRef != null)
                            break nextToken;
                        consumeToken();
                        start = this.scanner.getCurrentTokenStartPosition();
                        if (parseHref()) {
                            consumeToken();
                            if (this.tagValue == 10) {
                                // String reference are not allowed for @value tag
                                if (this.reportProblems)
                                    this.sourceParser.problemReporter()
                                        .javadocInvalidValueReference(start, getIndexPosition(),
                                            this.sourceParser.modifiers);
                                return false;
                            }
                            // verify end line
                            if (verifyEndLine(previousPosition)) {
                                return true;
                            }
                            if (this.reportProblems)
                                this.sourceParser.problemReporter()
                                    .javadocUnexpectedText(this.scanner.currentPosition, this.lineEnd);
                        } else if (this.tagValue == 10) {
                            if (this.reportProblems)
                                this.sourceParser.problemReporter()
                                    .javadocInvalidValueReference(start, getIndexPosition(),
                                        this.sourceParser.modifiers);
                        }
                        return false;

                    case TokenNameERROR:
                        consumeToken();
                        if (this.scanner.currentCharacter == '#') { // @see ...#member
                            reference = parseMember(typeRef);
                            if (reference != null) {
                                return pushSeeRef(reference);
                            }
                            return false;
                        }
                        char[] currentError = this.scanner.getCurrentIdentifierSource();
                        if (currentError.length > 0 && currentError[0] == '"') {
                            if (this.reportProblems) {
                                boolean isUrlRef = false;
                                if (this.tagValue == 6) {
                                    int length = currentError.length, i = 1 /* first char is " */;
                                    while (i < length && ScannerHelper.isLetter(currentError[i])) {
                                        i++;
                                    }
                                    if (i < (length - 2)
                                        && currentError[i] == ':'
                                        && currentError[i + 1] == '/'
                                        && currentError[i + 2] == '/') {
                                        isUrlRef = true;
                                    }
                                }
                                if (isUrlRef) {
                                    // https://bugs.eclipse.org/bugs/show_bug.cgi?id=207765
                                    // handle invalid URL references in javadoc with dedicated message
                                    this.sourceParser.problemReporter()
                                        .javadocInvalidSeeUrlReference(this.scanner.getCurrentTokenStartPosition(),
                                            getTokenEndPosition());
                                } else {
                                    this.sourceParser.problemReporter()
                                        .javadocInvalidReference(this.scanner.getCurrentTokenStartPosition(),
                                            getTokenEndPosition());
                                }
                            }
                            return false;
                        }
                        break nextToken;

                    case TokenNameUNDERSCORE:
                    case TokenNameIdentifier:
                        if (typeRef == null) {
                            typeRefStartPosition = this.scanner.getCurrentTokenStartPosition();
                            typeRef = parseQualifiedName(true, allowModule);
                            if (this.abort)
                                return false; // May be aborted by specialized parser
                            break;
                        }
                        break nextToken;

                    default:
                        break nextToken;
                }
            }

            // Verify that we got a reference
            reference = typeRef;
            if (reference == null) {
                this.index = this.tokenPreviousPosition;
                this.scanner.currentPosition = this.tokenPreviousPosition;
                this.currentTokenType = TokenNameInvalid;
                if (this.tagValue == 10) {
                    if ((this.kind & 2) != 0)
                        createTag();
                    return true;
                }
                if (this.reportProblems) {
                    this.sourceParser.problemReporter()
                        .javadocMissingReference(this.tagSourceStart, this.tagSourceEnd, this.sourceParser.modifiers);
                }
                return false;
            }

            // Reset position at the end of type reference
            if (this.lastIdentifierEndPosition > this.javadocStart) {
                this.index = this.lastIdentifierEndPosition + 1;
                this.scanner.currentPosition = this.index;
            }
            this.currentTokenType = TokenNameInvalid;

            // In case of @value, we have an invalid reference (only static field refs are valid for this tag)
            if (this.tagValue == 10) {
                if (this.reportProblems)
                    this.sourceParser.problemReporter().javadocInvalidReference(typeRefStartPosition, this.lineEnd);
                return false;
            }

            int currentIndex = this.index; // store current index
            char ch = readChar();
            switch (ch) {
                // Verify that line end does not start with an open parenthese (which could be a constructor reference
                // wrongly written...)
                // See bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=47215
                case '(':
                    if (this.reportProblems)
                        this.sourceParser.problemReporter()
                            .javadocMissingHashCharacter(typeRefStartPosition, this.lineEnd, String.valueOf(this.source,
                                typeRefStartPosition, this.lineEnd - typeRefStartPosition + 1));
                    return false;

                // Search for the :// URL pattern
                // See bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=168849
                case ':':
                    ch = readChar();
                    if (ch == '/' && ch == readChar()) {
                        if (this.reportProblems) {
                            this.sourceParser.problemReporter()
                                .javadocInvalidSeeUrlReference(typeRefStartPosition, this.lineEnd);
                            return false;
                        }
                    }
            }
            // revert to last stored index
            this.index = currentIndex;

            // Verify that we get white space after reference
            if (!verifySpaceOrEndComment()) {
                this.index = this.tokenPreviousPosition;
                this.scanner.currentPosition = this.tokenPreviousPosition;
                this.currentTokenType = TokenNameInvalid;
                int end = this.starPosition == -1 ? this.lineEnd : this.starPosition;
                if (this.source[end] == '\n')
                    end--;
                if (this.reportProblems)
                    this.sourceParser.problemReporter().javadocMalformedSeeReference(typeRefStartPosition, end);
                return false;
            }

            // Everything is OK, store reference
            return pushSeeRef(reference);
        } catch (InvalidInputException ex) {
            if (this.reportProblems)
                this.sourceParser.problemReporter().javadocInvalidReference(currentPosition, getTokenEndPosition());
        } finally {
            // we have to make sure that this is reset to the previous value even if an exception occurs
            this.scanner.tokenizeWhiteSpace = tokenWhiteSpace;
        }
        // Reset position to avoid missing tokens when new line was encountered
        this.index = this.tokenPreviousPosition;
        this.scanner.currentPosition = this.tokenPreviousPosition;
        this.currentTokenType = TokenNameInvalid;
        return false;
    }

    protected boolean parseSnippet() throws InvalidInputException {
        boolean tokenWhiteSpace = this.scanner.tokenizeWhiteSpace;
        boolean tokenizeComments = this.scanner.tokenizeComments;
        this.scanner.tokenizeWhiteSpace = true;
        this.scanner.tokenizeComments = true;
        int previousPosition;
        int lastRBracePosition = -1;
        int openBraces = 1;
        boolean parsingJava18Plus = this.scanner != null && this.scanner.sourceLevel >= 4063232L;
        boolean valid = true;
        boolean markdownSnippetIsValid = false;
        if (!parsingJava18Plus) {
            throw Scanner.invalidInput();
        }
        Object snippetTag = null;
        this.nonRegionTagCount = 0;
        this.inlineTagCount = 0;
        try {
            snippetTag = createSnippetTag();
            Map<String, String> snippetAttributes = new HashMap();
            if (!parseTillColon(snippetAttributes)) {
                TerminalToken token = readTokenSafely();
                boolean eitherNameorClass = token == TerminalToken.TokenNameIdentifier
                    || token == TerminalToken.TokenNameclass
                    || token == TerminalToken.TokenNameUNDERSCORE;
                if (!eitherNameorClass) {
                    this.setSnippetError(snippetTag, "Missing colon"); //$NON-NLS-1$
                    this.setSnippetIsValid(snippetTag, false);
                    if (this.reportProblems)
                        this.sourceParser.problemReporter().javadocInvalidSnippetMissingColon(this.index, this.lineEnd);
                    valid = false;
                } else {
                    consumeToken();
                    valid = false;
                    String snippetType = this.scanner.getCurrentTokenString();
                    switch (snippetType) {
                        case "file":
                            consumeToken();
                            int start = this.scanner.getCurrentTokenStartPosition();
                            token = readTokenSafely();
                            if (token == TerminalToken.TokenNameEQUAL) {
                                consumeToken();
                                token = readTokenSafely();
                                if (token == TerminalToken.TokenNameERROR
                                    || token == TerminalToken.TokenNameStringLiteral) {
                                    String fileName = this.scanner.getCurrentTokenString();
                                    int lastIndex = fileName.length() - 1;
                                    if ((fileName.charAt(0) == '"' && fileName.charAt(lastIndex) == '"')
                                        || (fileName.charAt(0) == '\'' && fileName.charAt(lastIndex) == '\'')) {
                                        fileName = fileName.substring(1, lastIndex); // strip out quotes

                                        valid = false;
                                    }
                                }
                            }
                            if (snippetTag != null) {
                                this.setSnippetIsValid(snippetTag, valid);
                            }
                            break;

                        case "class":
                            consumeToken();
                            start = this.scanner.getCurrentTokenStartPosition();
                            token = readTokenSafely();
                            if (token == TerminalToken.TokenNameEQUAL) {
                                consumeToken();
                                token = readTokenSafely();
                                if (token == TerminalToken.TokenNameERROR
                                    || token == TerminalToken.TokenNameStringLiteral) {
                                    String className = this.scanner.getCurrentTokenString();
                                    int lastIndex = className.length() - 1;
                                    if ((className.charAt(0) == '"' && className.charAt(lastIndex) == '"')
                                        || (className.charAt(0) == '\'' && className.charAt(lastIndex) == '\'')) {
                                        className = className.substring(1, lastIndex); // strip out quotes
                                        if (className.contains(".")) { //$NON-NLS-1$
                                            className = className.replace('.', '/');
                                        }
                                        String fileName = className + ".java";//$NON-NLS-1$

                                        valid = false;
                                    }
                                }
                            }
                            if (snippetTag != null) {
                                this.setSnippetIsValid(snippetTag, valid);
                            }
                            break;

                        default:
                    }
                }
            } else {
                if (this.index < this.scanner.eofPosition) {
                    TerminalToken token = readTokenSafely();
                    if (token == TerminalToken.TokenNameWHITESPACE) {
                        if (containsNewLine(this.scanner.getCurrentTokenString())) {
                            consumeToken();
                        } else {
                            valid = false;
                            if (this.reportProblems) {
                                // after colon new line required
                                this.sourceParser.problemReporter()
                                    .javadocInvalidSnippetContentNewLine(this.index, this.lineEnd);
                            }
                            this.setSnippetIsValid(snippetTag, false);
                            this.setSnippetError(snippetTag, "Snippet content should be in a new line"); //$NON-NLS-1$

                        }
                    }
                } else {
                    // when will this happen?? never?
                    valid = false;
                }
            }
            if (hasID(snippetAttributes)) {
                this.setSnippetID(snippetTag, getID(snippetAttributes));
            }
            int textEndPosition = this.index;
            this.textStart = this.index;
            TerminalToken token;
            while (this.index < this.scanner.eofPosition) {
                this.index = this.scanner.currentPosition;
                if (openBraces == 0) {
                    break;
                }
                previousPosition = this.index;
                token = readTokenSafely();
                if (token == TerminalToken.TokenNameEOF) {
                    break;
                }
                switch (token) {
                    case TokenNameLBRACE:
                        openBraces++;
                        textEndPosition = this.index;
                        break;

                    case TokenNameRBRACE:
                        openBraces--;
                        textEndPosition = this.index;
                        lastRBracePosition = this.scanner.currentPosition;
                        if (openBraces == 0) {
                            if (this.lineStarted) {
                                if (this.textStart == -1) {
                                    this.textStart = previousPosition;
                                }
                                if (this.textStart != -1 && this.textStart < this.index) {
                                    String textToBeAdded
                                        = new String(this.source, this.textStart, this.index - this.textStart);
                                    int iindex = textToBeAdded.indexOf('*');
                                    if (iindex > -1 && textToBeAdded.substring(0, iindex + 1).trim().equals("*")) { //$NON-NLS-1$
                                        textToBeAdded = textToBeAdded.substring(iindex + 1);
                                    }
                                    if (!textToBeAdded.isBlank()) {
                                        pushSnippetText(this.source, this.textStart, this.index - 1, false, snippetTag);
                                        this.nonRegionTagCount = 0;
                                        this.inlineTagCount = 0;
                                    }
                                }
                            }
                        }
                        break;

                    case TokenNameWHITESPACE:
                        if (containsNewLine(this.scanner.getCurrentTokenString())) {
                            if (this.lineStarted) {
                                if (this.textStart != -1 && this.textStart < textEndPosition) {
                                    if (isProperties(snippetAttributes)) { // single quotes
                                        String str
                                            = new String(this.source, this.textStart, textEndPosition - this.textStart);
                                        if (!str.isEmpty() && (str.charAt(0) == '*' || str.charAt(0) == '#')) {
                                            if (str.charAt(0) == '*')
                                                str = str.substring(1);
                                            str = str.stripLeading().stripTrailing();
                                            if (!str.isEmpty()
                                                && str.charAt(0) == '#'
                                                && str.charAt(str.length() - 1) == ':') {
                                                str = "//" + str.substring(1, str.length() - 1);
                                                Object innerTag = parseSnippetInlineTags(str, snippetTag, this.scanner);
                                                if (innerTag != null) {
                                                    addSnippetInnerTag(innerTag, snippetTag);
                                                    this.snippetInlineTagStarted = true;
                                                    this.lineStarted = false;
                                                    this.textStart = -1;
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    pushSnippetText(this.source, this.textStart, textEndPosition, true, snippetTag);
                                    this.nonRegionTagCount = 0;
                                    this.inlineTagCount = 0;
                                }
                            }
                            this.lineStarted = false;
                            // Fix bug 51650
                            this.textStart = -1;
                        }
                        break;

                    case TokenNameCOMMENT_MARKDOWN:
                        if (this.markdown) {
                            String markdownTokenString = this.scanner.getCurrentTokenString();
                            String[] elements = markdownTokenString.split("\\r?\\n", -1); //$NON-NLS-1$
                            int elmentStart = this.scanner.getCurrentTokenStartPosition();
                            int elementEnd = 0;
                            try {
                                for (String s : elements) {
                                    if (elementEnd != 0) {
                                        elmentStart = elementEnd + 1; // +1 because of new line
                                    }
                                    int pos = s.indexOf("///"); //$NON-NLS-1$
                                    if (pos != -1) {
                                        elmentStart = elmentStart + 3 + pos;
                                        String element = s.substring(3 + pos);
                                        elementEnd = elmentStart + element.length();
                                        if (element.stripLeading().startsWith("}")) { //$NON-NLS-1$
                                            break;
                                        }
                                    }
                                    pushText(elmentStart, elementEnd);
                                }
                                if (elements.length > 0)
                                    markdownSnippetIsValid = true;
                            } catch (Exception e) {
                                markdownSnippetIsValid = false;
                            }
                        }
                        break;

                    case TokenNameCOMMENT_LINE:
                        String tokenString = this.scanner.getCurrentTokenString();
                        boolean handleNow = handleCommentLineForCurrentLine(tokenString);
                        boolean lvalid = false;
                        int indexOfLastComment = -1;
                        int noSingleLineComm = getNumberOfSingleLineCommentInSnippetTag(tokenString.substring(2));
                        if (noSingleLineComm > 0)
                            indexOfLastComment = indexOfLastSingleComment(tokenString.substring(2), noSingleLineComm);
                        if (!handleNow) {
                            this.nonRegionTagCount = 0;
                            this.inlineTagCount = 0;
                        }
                        if (this.markdown) {
                            markdownSnippetIsValid = true;
                        }
                        Object innerTag = parseSnippetInlineTags(
                            indexOfLastComment == -1 ? tokenString : tokenString.substring(indexOfLastComment + 2),
                            snippetTag, this.scanner);
                        if (innerTag != null) {
                            lvalid = true;
                        }
                        if (lvalid && handleNow && innerTag != snippetTag) {
                            addSnippetInnerTag(innerTag, snippetTag);
                            this.snippetInlineTagStarted = true;
                        }
                        textEndPosition = this.index;
                        int textPos = previousPosition;
                        if (!lvalid) {
                            textPos = textEndPosition;
                        }
                        if (this.lineStarted) {
                            if (this.textStart == -1) {
                                this.textStart = previousPosition;
                            }
                            if (this.textStart != -1 && this.textStart < this.index) {
                                pushSnippetText(this.source, this.textStart,
                                    (innerTag != null && indexOfLastComment >= 0)
                                        ? textPos + indexOfLastComment + 2
                                        : textPos,
                                    lvalid, snippetTag);
                                if (handleNow) {
                                    this.nonRegionTagCount = 0;
                                    this.inlineTagCount = 0;
                                }
                            }
                        }
                        if (lvalid && !handleNow) {
                            if (innerTag != snippetTag)
                                addSnippetInnerTag(innerTag, snippetTag);
                            this.snippetInlineTagStarted = true;
                        }
                        break;

                    default:
                        if (!this.lineStarted || this.textStart == -1) {
                            this.textStart = previousPosition;
                        }
                        this.lineStarted = true;
                        textEndPosition = this.index;
                        break;
                }
                consumeToken();
            }
        } finally {
            if (!areRegionsClosed()) {
                if (this.reportProblems) {
                    this.sourceParser.problemReporter().javadocInvalidSnippetRegionNotClosed(this.index, this.lineEnd);
                }
                this.setSnippetError(snippetTag, "Region not closed"); //$NON-NLS-1$
                this.setSnippetIsValid(snippetTag, false);
            }
            // we have to make sure that this is reset to the previous value even if an exception occurs
            this.scanner.tokenizeWhiteSpace = tokenWhiteSpace;
            this.scanner.tokenizeComments = tokenizeComments;
        }
        boolean retVal = false;
        if (!valid) {
        } else if (openBraces == 0) {
            this.scanner.currentPosition = lastRBracePosition - 1;
            this.index = lastRBracePosition - 1;
            retVal = true;
        }
        if (!retVal && openBraces == 0) {
            this.scanner.currentPosition = lastRBracePosition - 1;
            this.index = lastRBracePosition - 1;
        }
        if (snippetTag != null) {
            if (this.markdown) {
                this.setSnippetIsValid(snippetTag, markdownSnippetIsValid);
            } else {
                this.setSnippetIsValid(snippetTag, retVal);
            }
        }
        return retVal;
    }

    private boolean isProperties(Map<String, String> snippetAttributes) {
        if (snippetAttributes.isEmpty())
            return false;
        for (Map.Entry<String, String> entry : snippetAttributes.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key.equals("lang") && value.equals("properties")) { //$NON-NLS-1$ //$NON-NLS-2$
                return true;
            }
        }
        return false;
    }

    private boolean hasID(Map<String, String> snippetAttributes) {
        if (snippetAttributes.isEmpty())
            return false;
        for (String key : snippetAttributes.keySet()) {
            if (key.equals("id")) { //$NON-NLS-1$
                return true;
            }
        }
        return false;
    }

    private String getID(Map<String, String> snippetAttributes) {
        for (Map.Entry<String, String> entry : snippetAttributes.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (key.equals("id")) { //$NON-NLS-1$
                return value;
            }
        }
        return ""; //$NON-NLS-1$
    }

    private boolean parseTillColon(Map<String, String> snippetAttributes) {
        boolean isValid = true;
        boolean colonTokenFound = false;
        TerminalToken token;
        String key = null;
        boolean lookForValue = false;
        while (this.index < this.scanner.eofPosition) {
            token = readTokenSafely();
            switch (token) {
                case TokenNameWHITESPACE:
                    if (containsNewLine(this.scanner.getCurrentTokenString())) {
                        consumeToken();
                        if (this.index < this.scanner.eofPosition) {
                            token = readTokenSafely();
                            if (token == TerminalToken.TokenNameMULTIPLY) {
                                consumeToken();
                            } else {
                                isValid = false;
                            }
                        } else {
                            isValid = false;
                        }
                    } else {
                        consumeToken();
                    }
                    break;

                case TokenNameCOLON:
                    consumeToken();
                    colonTokenFound = true;
                    break;

                case TokenNameclass:
                    if (!lookForValue) {
                        isValid = false;
                    }
                    break;

                case TokenNameUNDERSCORE:
                case TokenNameStringLiteral:
                case TokenNameIdentifier: // name and equal can come for attribute
                    String isFile = this.scanner.getCurrentTokenString();
                    if (isFile.equals("file") && !lookForValue) { //$NON-NLS-1$
                        isValid = false;
                        break;
                    }
                    consumeToken();
                    if (key == null)
                        key = this.scanner.getCurrentTokenString();
                    if (lookForValue) {
                        String value = this.scanner.getCurrentTokenString();
                        snippetAttributes.put(key,
                            token == TerminalToken.TokenNameStringLiteral
                                ? value.substring(1, value.length() - 1)
                                : value);
                        lookForValue = false;
                        key = null;
                    }

                    break;

                case TokenNameEQUAL:
                    consumeToken();
                    lookForValue = true;
                    break;

                case TokenNameERROR:
                    String currentTokenString = this.scanner.getCurrentTokenString();
                    if (currentTokenString.length() > 1
                        && currentTokenString.charAt(0) == '\''
                        && currentTokenString.charAt(currentTokenString.length() - 1) == '\'') {
                        if (lookForValue && key != null) {
                            String value = this.scanner.getCurrentTokenString();
                            snippetAttributes.put(key, value.substring(1, value.length() - 1));
                            lookForValue = false;
                            key = null;
                            break;
                        }
                    }
                    if (this.scanner.currentCharacter == '"') {
                        if (!lookForValue)
                            isValid = false;
                    }
                    consumeToken();

                    break;

                default:
                    isValid = false;
                    break;
            }
            if (colonTokenFound || !isValid) {
                break;
            }
        }

        return isValid;
    }

    public int indexOfLastSingleComment(String tokenString, int last) {
        int indexOfLastCom = 0;
        int temp;
        String tempString = tokenString;
        for (int i = 0; i < last; ++i) {
            temp = tempString.indexOf("//");
            if (temp == -1) {
                indexOfLastCom = 0;
                break;
            }
            tempString = tempString.substring(++temp);
            indexOfLastCom += temp;
        }
        return --indexOfLastCom;
    }

    private boolean handleCommentLineForCurrentLine(String tokenString) {
        boolean handle = true;
        if (tokenString != null) {
            String processed = tokenString.trim();
            if (processed.endsWith(":")) { //$NON-NLS-1$
                handle = false;
            }
        }
        return handle;
    }

    protected int getNumberOfSingleLineCommentInSnippetTag(String tokenString) {
        if (tokenString != null) {
            String tokenStringStripped = tokenString.stripLeading();
            Scanner slScanner
                = new JavadocScanner(true, true/* nls */, this.scanner.sourceLevel, this.scanner.complianceLevel);
            slScanner.setSource(tokenStringStripped.toCharArray());
            while (true) {
                try {
                    TerminalToken tokenType = slScanner.getNextToken();
                    if (tokenType == TokenNameEOF)
                        break;
                    switch (tokenType) {
                        case TokenNameCOMMENT_LINE:
                            return 1 + getNumberOfSingleLineCommentInSnippetTag(
                                tokenStringStripped.substring(2 + tokenStringStripped.indexOf("//")));

                        default:
                            break;
                    }
                } catch (InvalidInputException e) {
                    // do nothing
                }
            }
        }
        return 0;
    }

    protected Object parseSnippetInlineTags(String tokenString, Object snippetTag, Scanner sScanner) {
        int commentStart = sScanner.getCurrentTokenStartPosition();
        Object inlineTag = null;
        boolean regionClosed = false;
        int initialTagCount = this.nonRegionTagCount;
        List<Object> inlineTags = new ArrayList<>();
        boolean ignoreLink = sScanner != this.scanner;
        try {
            if (tokenString != null && tokenString.length() > 2 && tokenString.startsWith("//")) {
                String tobeTokenized = tokenString.substring(2);
                Scanner slScanner
                    = new JavadocScanner(false, false/* nls */, sScanner.sourceLevel, sScanner.complianceLevel);
                slScanner.setSource(tobeTokenized.toCharArray());
                boolean atTokenStarted = false;
                int atTokenPos = -1;
                boolean firstTagProcessed = false;
                while (true) {
                    try {
                        TerminalToken tokenType = slScanner.getNextToken();
                        if (tokenType == TokenNameEOF)
                            break;
                        mainSwitch: switch (tokenType) {
                            case TokenNameAT:
                                atTokenStarted = true;
                                atTokenPos = slScanner.getCurrentTokenStartPosition();
                                break;

                            case TokenNameUNDERSCORE:
                            case TokenNameIdentifier:
                                if (!atTokenStarted) // invalid snippet inline, treat it like text
                                    return null;
                                if (atTokenStarted) {
                                    int curPos = slScanner.getCurrentTokenStartPosition();
                                    if (curPos != atTokenPos + 1 && !firstTagProcessed) {
                                        return inlineTag;
                                    }
                                    String snippetDecorator = slScanner.getCurrentTokenString();
                                    int tokenStart;
                                    slScanner.getCurrentTokenEndPosition();
                                    int tokenEnd;
                                    String newTagName;
                                    switch (snippetDecorator) {
                                        case "highlight":
                                            tokenStart = commentStart + 1 + slScanner.getCurrentTokenStartPosition();
                                            tokenEnd = tokenStart + 10;
                                            newTagName = '@' + "highlight";
                                            Map<String, Object> map = new HashMap<>();
                                            boolean breakToMainSwitch = false;
                                            boolean createTag = false;
                                            String attribute = null;
                                            String value;
                                            boolean processValue = false;
                                            boolean createRegion = false;
                                            String regionName = null;
                                            while (true) {
                                                tokenType = slScanner.getNextToken();
                                                switch (tokenType) {
                                                    case TokenNameEOF:
                                                        createTag = true;
                                                        break;

                                                    case TokenNameAT:
                                                        if (!processValue) {
                                                            breakToMainSwitch = true;
                                                            createTag = true;
                                                        }
                                                        processValue = false;
                                                        break;

                                                    case TokenNameCOLON:
                                                        tokenType = slScanner.getNextToken();
                                                        if (tokenType == TokenNameEOF) {
                                                            break;
                                                        } else {
                                                            return inlineTag;
                                                        }
                                                    case TokenNameUNDERSCORE:
                                                    case TokenNameIdentifier:
                                                        if (processValue) {
                                                            value = slScanner.getCurrentTokenString();
                                                            if ("region".equals(attribute)) {
                                                                regionName = value;
                                                            } else if (map.get(attribute) == null) {
                                                                map.put(attribute, value);
                                                                if ((attribute.equals("substring")
                                                                    && (map.get("regex") != null))
                                                                    || (attribute.equals("regex")
                                                                        && (map.get("substring") != null))) {
                                                                    reportRegexSubstringTogether(snippetTag);
                                                                    return inlineTag;
                                                                }
                                                            }
                                                            processValue = false;
                                                            attribute = null;
                                                        } else {
                                                            attribute = slScanner.getCurrentTokenString();
                                                            switch (attribute) {
                                                                case "substring":
                                                                case "regex":
                                                                case "type":
                                                                    break;

                                                                case "region":
                                                                    createRegion = true;
                                                                    setRegionPosition(slScanner.currentPosition);
                                                                    break;

                                                                default:
                                                                    break;
                                                            }
                                                        }
                                                        break;

                                                    case TokenNameEQUAL:
                                                        if (attribute != null) {
                                                            processValue = true;
                                                        }
                                                        break;

                                                    case TokenNameStringLiteral:
                                                    case TokenNameSingleQuoteStringLiteral:
                                                        if (processValue) {
                                                            value = slScanner.getCurrentTokenString();
                                                            value = stripQuotes(value);
                                                            if ("region".equals(attribute)) {
                                                                regionName = value;
                                                            } else if (map.get(attribute) == null) {
                                                                map.put(attribute, value);
                                                                if ((attribute.equals("substring")
                                                                    && (map.get("regex") != null))
                                                                    || (attribute.equals("regex")
                                                                        && (map.get("substring") != null))) {
                                                                    reportRegexSubstringTogether(snippetTag);
                                                                    return inlineTag;
                                                                }
                                                            }
                                                            processValue = false;
                                                            attribute = null;
                                                        }
                                                        break;

                                                    default:
//														break;
                                                }
                                                if (createTag) {
                                                    break;
                                                }
                                                if (breakToMainSwitch)
                                                    break mainSwitch;
                                            }
                                            tokenEnd = commentStart + 1 + slScanner.getCurrentTokenEndPosition();
                                            inlineTag = createSnippetInnerTag(newTagName, tokenStart, tokenEnd);
                                            addTagProperties(inlineTag, map, ++this.inlineTagCount);
                                            if (createRegion) {
                                                List<Object> tags = new ArrayList<>();
                                                tags.add(inlineTag);
                                                inlineTag
                                                    = createSnippetRegion(regionName, tags, snippetTag, false, false);
                                            } else {
                                                this.nonRegionTagCount++;
                                            }
                                            inlineTags.add(inlineTag);
                                            if (!firstTagProcessed) {
                                                firstTagProcessed = true;
                                            }
                                            break;

                                        case "replace":
                                            tokenStart = commentStart + 1 + slScanner.getCurrentTokenStartPosition();
                                            tokenEnd = tokenStart + 8;
                                            newTagName = '@' + "replace";
                                            map = new HashMap<>();
                                            breakToMainSwitch = false;
                                            createTag = false;
                                            attribute = null;
                                            value = null;
                                            processValue = false;
                                            boolean hasReplacementStr = false;
                                            createRegion = false;
                                            regionName = null;
                                            while (true) {
                                                tokenType = slScanner.getNextToken();
                                                switch (tokenType) {
                                                    case TokenNameEOF:
                                                        createTag = true;
                                                        break;

                                                    case TokenNameAT:
                                                        if (!processValue) {
                                                            breakToMainSwitch = true;
                                                            createTag = true;
                                                        }
                                                        processValue = false;
                                                        break;

                                                    case TokenNameCOLON:
                                                        tokenType = slScanner.getNextToken();
                                                        if (tokenType == TokenNameEOF) {
                                                            break;
                                                        } else {
                                                            return inlineTag;
                                                        }
                                                    case TokenNameUNDERSCORE:
                                                    case TokenNameIdentifier:
                                                        if (processValue) {
                                                            value = slScanner.getCurrentTokenString();
                                                            if ("region".equals(attribute)) {
                                                                regionName = value;
                                                            } else if (map.get(attribute) == null) {
                                                                if (attribute.equals("replacement")) {
                                                                    hasReplacementStr = true;
                                                                }
                                                                map.put(attribute, value);
                                                                if ((attribute.equals("substring")
                                                                    && (map.get("regex") != null))
                                                                    || (attribute.equals("regex")
                                                                        && (map.get("substring") != null))) {
                                                                    reportRegexSubstringTogether(snippetTag);
                                                                    return inlineTag;
                                                                }
                                                            }
                                                            processValue = false;
                                                            attribute = null;
                                                        } else {
                                                            attribute = slScanner.getCurrentTokenString();
                                                            switch (attribute) {
                                                                case "substring":
                                                                case "regex":
                                                                case "replacement":
                                                                    break;

                                                                case "region":
                                                                    createRegion = true;
                                                                    setRegionPosition(slScanner.currentPosition);
                                                                    break;

                                                                default:
                                                                    break;
                                                            }
                                                        }
                                                        break;

                                                    case TokenNameEQUAL:
                                                        if (attribute != null) {
                                                            processValue = true;
                                                        }
                                                        break;

                                                    case TokenNameStringLiteral:
                                                    case TokenNameSingleQuoteStringLiteral:
                                                        if (processValue) {
                                                            value = slScanner.getCurrentTokenString();
                                                            value = stripQuotes(value);
                                                            if ("region".equals(attribute)) {
                                                                regionName = value;
                                                            } else if (map.get(attribute) == null) {
                                                                if (attribute.equals("replacement")) {
                                                                    hasReplacementStr = true;
                                                                }
                                                                map.put(attribute, value);
                                                                if ((attribute.equals("substring")
                                                                    && (map.get("regex") != null))
                                                                    || (attribute.equals("regex")
                                                                        && (map.get("substring") != null))) {
                                                                    reportRegexSubstringTogether(snippetTag);
                                                                    return inlineTag;
                                                                }
                                                            }
                                                            processValue = false;
                                                            attribute = null;
                                                        }
                                                        break;

                                                    default:
                                                        break;
                                                }
                                                if (createTag) {
                                                    break;
                                                }
                                                if (breakToMainSwitch)
                                                    break mainSwitch;
                                            }
                                            if (!hasReplacementStr) {
                                                return inlineTag;
                                            }
                                            tokenEnd = commentStart + 1 + slScanner.getCurrentTokenEndPosition();
                                            inlineTag = createSnippetInnerTag(newTagName, tokenStart, tokenEnd);
                                            addTagProperties(inlineTag, map, ++this.inlineTagCount);
                                            if (createRegion) {
                                                List<Object> tags = new ArrayList<>();
                                                tags.add(inlineTag);
                                                inlineTag
                                                    = createSnippetRegion(regionName, tags, snippetTag, false, false);
                                            } else {
                                                this.nonRegionTagCount++;
                                            }
                                            inlineTags.add(inlineTag);
                                            if (!firstTagProcessed) {
                                                firstTagProcessed = true;
                                            }
                                            break;

                                        case "link":
                                            tokenStart = commentStart + 1 + slScanner.getCurrentTokenStartPosition();
                                            tokenEnd = tokenStart + 4;
                                            newTagName = '@' + "link";
                                            map = new HashMap<>();
                                            breakToMainSwitch = false;
                                            createTag = false;
                                            attribute = null;
                                            value = null;
                                            processValue = false;
                                            boolean hasTarget = false;
                                            Object type = null;
                                            createRegion = false;
                                            regionName = null;
                                            while (true) {
                                                tokenType = slScanner.getNextToken();
                                                switch (tokenType) {
                                                    case TokenNameEOF:
                                                        createTag = true;
                                                        break;

                                                    case TokenNameAT:
                                                        if (!processValue) {
                                                            breakToMainSwitch = true;
                                                            createTag = true;
                                                        }
                                                        processValue = false;
                                                        break;

                                                    case TokenNameCOLON:
                                                        tokenType = slScanner.getNextToken();
                                                        if (tokenType == TokenNameEOF) {
                                                            break;
                                                        } else {
                                                            return inlineTag;
                                                        }
                                                    case TokenNameUNDERSCORE:
                                                    case TokenNameIdentifier:
                                                        if (processValue) {
                                                            value = slScanner.getCurrentTokenString();
                                                            if (map.get(attribute) == null) {
                                                                if ("region".equals(attribute)) {
                                                                    regionName = value;
                                                                } else if ("target".equals(attribute)) {
                                                                    String originalTokenString
                                                                        = sScanner.getCurrentTokenString();
                                                                    int offset
                                                                        = originalTokenString.lastIndexOf(tokenString);
                                                                    if (offset == -1) {
                                                                        offset = 1 - tokenString.length(); // for #
                                                                                                           // converted
                                                                                                           // to //
                                                                                                           // current
                                                                                                           // position
                                                                                                           // at end
                                                                    }
                                                                    if (!ignoreLink) {
                                                                        type = parseLinkReference(
                                                                            slScanner.getCurrentTokenStartPosition()
                                                                                + offset,
                                                                            value, sScanner);
                                                                    }
                                                                    if (type != null) {
                                                                        map.put(attribute, type);
                                                                        hasTarget = true;
                                                                    }
                                                                } else {
                                                                    map.put(attribute, value);
                                                                    if ((attribute.equals("substring")
                                                                        && (map.get("regex") != null))
                                                                        || (attribute.equals("regex")
                                                                            && (map.get("substring") != null))) {
                                                                        reportRegexSubstringTogether(snippetTag);
                                                                        return inlineTag;
                                                                    }
                                                                }
                                                            }
                                                            processValue = false;
                                                            attribute = null;
                                                        } else {
                                                            attribute = slScanner.getCurrentTokenString();
                                                            switch (attribute) {
                                                                case "substring":
                                                                case "regex":
                                                                case "type":
                                                                case "target":
                                                                    break;

                                                                case "region":
                                                                    createRegion = true;
                                                                    setRegionPosition(slScanner.currentPosition);
                                                                    break;

                                                                default:
                                                                    break;
                                                            }
                                                        }
                                                        break;

                                                    case TokenNameEQUAL:
                                                        if (attribute != null) {
                                                            processValue = true;
                                                        }
                                                        break;

                                                    case TokenNameStringLiteral:
                                                    case TokenNameSingleQuoteStringLiteral:
                                                        if (processValue) {
                                                            value = slScanner.getCurrentTokenString();
                                                            if (map.get(attribute) == null) {
                                                                if ("region".equals(attribute)) {
                                                                    value = stripQuotes(value);
                                                                    regionName = value;
                                                                } else if ("target".equals(attribute)) {
                                                                    String originalTokenString
                                                                        = sScanner.getCurrentTokenString();
                                                                    int offset
                                                                        = originalTokenString.lastIndexOf(tokenString);
                                                                    if (offset == -1) {
                                                                        offset = 1 - tokenString.length(); // for #
                                                                                                           // converted
                                                                                                           // to //
                                                                                                           // current
                                                                                                           // position
                                                                                                           // at end
                                                                    }
                                                                    if (!ignoreLink) {
                                                                        type = parseLinkReference(
                                                                            slScanner.getCurrentTokenStartPosition()
                                                                                + offset,
                                                                            value, sScanner);
                                                                    }
                                                                    if (type != null) {
                                                                        map.put(attribute, type);
                                                                        hasTarget = true;
                                                                    }
                                                                } else {
                                                                    value = stripQuotes(value);
                                                                    map.put(attribute, value);
                                                                    if ((attribute.equals("substring")
                                                                        && (map.get("regex") != null))
                                                                        || (attribute.equals("regex")
                                                                            && (map.get("substring") != null))) {
                                                                        reportRegexSubstringTogether(snippetTag);
                                                                        return inlineTag;
                                                                    }
                                                                }
                                                            }
                                                            processValue = false;
                                                            attribute = null;
                                                        }
                                                        break;

                                                    default:
                                                        break;
                                                }
                                                if (createTag) {
                                                    break;
                                                }
                                                if (breakToMainSwitch)
                                                    break mainSwitch;
                                            }
                                            tokenEnd = commentStart + 1 + slScanner.getCurrentTokenEndPosition();
                                            if (hasTarget) {
                                                inlineTag = createSnippetInnerTag(newTagName, tokenStart, tokenEnd);
                                                addTagProperties(inlineTag, map, ++this.inlineTagCount);
                                                if (createRegion) {
                                                    List<Object> tags = new ArrayList<>();
                                                    tags.add(inlineTag);
                                                    inlineTag = createSnippetRegion(regionName, tags, snippetTag, false,
                                                        false);
                                                } else {
                                                    this.nonRegionTagCount++;
                                                }
                                                inlineTags.add(inlineTag);
                                                if (!firstTagProcessed) {
                                                    firstTagProcessed = true;
                                                }
                                            }
                                            break;

                                        case "end":
                                            boolean closeRegion = false;
                                            regionName = null;
                                            processValue = false;
                                            attribute = null;
                                            breakToMainSwitch = false;
                                            while (true) {
                                                tokenType = slScanner.getNextToken();
                                                switch (tokenType) {
                                                    case TokenNameEOF:
                                                        closeRegion = true;
                                                        break;

                                                    case TokenNameAT:
                                                        if (!processValue) {
                                                            breakToMainSwitch = true;
                                                            closeRegion = true;
                                                        }
                                                        processValue = false;
                                                        break;

                                                    case TokenNameCOLON:
                                                        tokenType = slScanner.getNextToken();
                                                        if (tokenType == TokenNameEOF) {
                                                            break;
                                                        } else {
                                                            return inlineTag;
                                                        }
                                                    case TokenNameUNDERSCORE:
                                                    case TokenNameIdentifier:
                                                        if (processValue && "region".equals(attribute)) {
                                                            regionName = slScanner.getCurrentTokenString();
                                                            processValue = false;
                                                            attribute = null;
                                                        } else {
                                                            attribute = slScanner.getCurrentTokenString();
                                                            switch (attribute) {
                                                                case "region":
                                                                    setRegionPosition(slScanner.currentPosition);
                                                                    break;

                                                                default:
                                                                    break;
                                                            }
                                                        }
                                                        break;

                                                    case TokenNameEQUAL:
                                                        if (attribute != null) {
                                                            processValue = true;
                                                        }
                                                        break;

                                                    case TokenNameStringLiteral:
                                                    case TokenNameSingleQuoteStringLiteral:
                                                        if (processValue && "region".equals(attribute)) {
                                                            regionName = slScanner.getCurrentTokenString();
                                                            regionName = stripQuotes(regionName);
                                                        }
                                                        processValue = false;
                                                        attribute = null;
                                                        break;

                                                    default:
                                                        break;
                                                }
                                                if (closeRegion) {
                                                    break;
                                                }
                                            }
                                            if (closeRegion) {
                                                tokenEnd = commentStart + 1 + slScanner.getCurrentTokenEndPosition();
                                                this.closeJavaDocRegion(regionName, snippetTag, tokenEnd);
                                                regionClosed = true;
                                                if (!firstTagProcessed) {
                                                    firstTagProcessed = true;
                                                }
                                            }
                                            if (breakToMainSwitch) {
                                                break mainSwitch;
                                            }
                                            break;

                                        default:
                                            return inlineTag;
                                    }
                                }
                                break;

                            default:
                                return inlineTag;// if at token not started then invalid
                        }
                    } catch (InvalidInputException e) {
                        // do nothing
                    }
                }
            }
        } finally {
            if (inlineTags.size() > 1 || (initialTagCount > 0 && !inlineTags.isEmpty())) {
                inlineTag = createSnippetRegion(null, inlineTags, snippetTag, true, initialTagCount > 0);
            } else if (inlineTags.size() == 1) {
                inlineTag = inlineTags.get(0);
            }
        }
        if (regionClosed && inlineTag == null) {
            return snippetTag;
        }
        if (inlineTags.isEmpty() && inlineTag == null && ignoreLink) {
            return snippetTag;
        }
        return inlineTag;
    }

    private String stripQuotes(String str) {
        if (str == null || str.length() <= 2) {
            return str;
        }
        String finalStr = str;
        int lastIndex = finalStr.length() - 1;
        if ((finalStr.charAt(0) == '"' && finalStr.charAt(lastIndex) == '"')
            || (finalStr.charAt(0) == '\'' && finalStr.charAt(lastIndex) == '\'')) {
            finalStr = finalStr.substring(1, finalStr.length() - 1);
        }
        return finalStr;
    }

    private Object parseLinkReference(int curPosition, String value, Scanner sScanner) {
        Object typeRef = null;
        Object reference = null;
        int indexx = this.index;
        int oldCurrentPosition = sScanner.currentPosition;
        int oldStartPosition = sScanner.startPosition;
        char c = value.charAt(0);
        int additionalIndex = 2;
        if (c == '"' || c == '\'') {
            additionalIndex += 1;
        }
        sScanner.currentPosition = sScanner.getCurrentTokenStartPosition() + curPosition + additionalIndex;
        int allowedLength = sScanner.getCurrentTokenStartPosition() + curPosition + value.length();
        this.index = sScanner.startPosition;
        TerminalToken oldToken = this.currentTokenType;
        this.currentTokenType = TokenNameInvalid;
        boolean tokenizeWhiteSpaces = this.scanner.tokenizeWhiteSpace;
        this.scanner.tokenizeWhiteSpace = false;
        try {
            while (this.scanner.currentPosition < allowedLength) {
                TerminalToken token = readTokenSafely();
                this.scanner.tokenizeWhiteSpace = true;
                switch (token) {
                    case TokenNameERROR:
                        consumeToken();
                        if (this.scanner.currentCharacter == '#') { // @see ...#member
                            reference = parseMember(typeRef, true);
                        }
                        break;

                    case TokenNameUNDERSCORE:
                    case TokenNameIdentifier:
                        typeRef = parseQualifiedName(true, true);
                        break;

                    default:
                        return null;
                }
            }
        } catch (InvalidInputException ex) {
            typeRef = null;
        } finally {
            sScanner.currentPosition = oldCurrentPosition;
            sScanner.startPosition = oldStartPosition;
            this.index = indexx;
            this.currentTokenType = oldToken;
            sScanner.tokenizeWhiteSpace = tokenizeWhiteSpaces;
        }
        if (reference != null) {
            typeRef = reference;
        }
        return typeRef;
    }

    private boolean containsNewLine(String str) {
        boolean consider = false;
        if (str != null && (str.contains(System.lineSeparator()) || str.indexOf('\n') != -1)) {
            consider = true;
        }
        return consider;
    }

    /*
     * Parse markdown links that are replacing @link and @linkplain
     */
    protected abstract boolean parseMarkdownLinks(int previousPosition) throws InvalidInputException;

    /*
     * Parse tag declaration
     */
    protected abstract boolean parseTag(int previousPosition) throws InvalidInputException;

    /*
     * Parse @throws tag declaration
     */
    protected boolean parseThrows() {
        int start = this.scanner.currentPosition;
        boolean isCompletionParser = (this.kind & 8) != 0;
        try {
            Object typeRef = parseQualifiedName(true);
            if (this.abort)
                return false; // May be aborted by specialized parser
            if (typeRef == null) {
                if (this.reportProblems)
                    this.sourceParser.problemReporter()
                        .javadocMissingThrowsClassName(this.tagSourceStart, this.tagSourceEnd,
                            this.sourceParser.modifiers);
            } else {
                return pushThrowName(typeRef);
            }
        } catch (InvalidInputException ex) {
            if (this.reportProblems)
                this.sourceParser.problemReporter().javadocInvalidThrowsClass(start, getTokenEndPosition());
        }
        if (!isCompletionParser) {
            this.scanner.currentPosition = start;
            this.index = start;
        }
        this.currentTokenType = TokenNameInvalid;
        return false;
    }

    /*
     * Return current character without move index position.
     */
    protected char peekChar() {
        int idx = this.index;
        char c = this.source[idx++];
        if (c == '\\' && this.source[idx] == 'u') {
            int c1, c2, c3, c4;
            idx++;
            while (this.source[idx] == 'u')
                idx++;
            if (!(((c1 = ScannerHelper.getHexadecimalValue(this.source[idx++])) > 15 || c1 < 0)
                || ((c2 = ScannerHelper.getHexadecimalValue(this.source[idx++])) > 15 || c2 < 0)
                || ((c3 = ScannerHelper.getHexadecimalValue(this.source[idx++])) > 15 || c3 < 0)
                || ((c4 = ScannerHelper.getHexadecimalValue(this.source[idx++])) > 15 || c4 < 0))) {
                c = (char) (((c1 * 16 + c2) * 16 + c3) * 16 + c4);
            }
        }
        return c;
    }

    /*
     * push the consumeToken on the identifier stack. Increase the total number of identifier in the stack.
     */
    protected void pushIdentifier(boolean newLength, boolean isToken) {
        int stackLength = this.identifierStack.length;
        if (++this.identifierPtr >= stackLength) {
            System.arraycopy(this.identifierStack, 0, this.identifierStack = new char[stackLength + 10][], 0,
                stackLength);
            System.arraycopy(this.identifierPositionStack, 0, this.identifierPositionStack = new long[stackLength + 10],
                0, stackLength);
        }
        this.identifierStack[this.identifierPtr]
            = isToken ? this.scanner.getCurrentTokenSource() : this.scanner.getCurrentIdentifierSource();
        this.identifierPositionStack[this.identifierPtr]
            = (((long) this.scanner.startPosition) << 32) + (this.scanner.currentPosition - 1);

        if (newLength) {
            stackLength = this.identifierLengthStack.length;
            if (++this.identifierLengthPtr >= stackLength) {
                System.arraycopy(this.identifierLengthStack, 0, this.identifierLengthStack = new int[stackLength + 10],
                    0, stackLength);
            }
            this.identifierLengthStack[this.identifierLengthPtr] = 1;
        } else {
            this.identifierLengthStack[this.identifierLengthPtr]++;
        }
    }

    /*
     * Add a new obj on top of the ast stack. If new length is required, then add also a new length in length stack.
     */
    protected void pushOnAstStack(Object node, boolean newLength) {
        if (node == null) {
            int stackLength = this.astLengthStack.length;
            if (++this.astLengthPtr >= stackLength) {
                System.arraycopy(this.astLengthStack, 0, this.astLengthStack = new int[stackLength + 10], 0,
                    stackLength);
            }
            this.astLengthStack[this.astLengthPtr] = 0;
            return;
        }

        int stackLength = this.astStack.length;
        if (++this.astPtr >= stackLength) {
            System.arraycopy(this.astStack, 0, this.astStack = new Object[stackLength + 10], 0, stackLength);
            this.astPtr = stackLength;
        }
        this.astStack[this.astPtr] = node;

        if (newLength) {
            stackLength = this.astLengthStack.length;
            if (++this.astLengthPtr >= stackLength) {
                System.arraycopy(this.astLengthStack, 0, this.astLengthStack = new int[stackLength + 10], 0,
                    stackLength);
            }
            this.astLengthStack[this.astLengthPtr] = 1;
        } else {
            this.astLengthStack[this.astLengthPtr]++;
        }
    }

    /*
     * Push a param name in ast node stack.
     */
    protected abstract boolean pushParamName(boolean isTypeParam);

    /*
     * Push a reference statement in ast node stack.
     */
    protected abstract boolean pushSeeRef(Object statement);

    /*
     * Push a text element in ast node stack
     */
    protected abstract void pushText(int start, int end);

    protected abstract void pushSnippetText(char[] text, int start, int end, boolean addNewLine, Object snippetTag);

    protected abstract void closeJavaDocRegion(String name, Object snippetTag, int end);

    protected abstract boolean areRegionsClosed();

    protected abstract Object createSnippetTag();

    protected abstract Object createSnippetInnerTag(String tagName, int start, int end);

    protected abstract Object createSnippetRegion(String name, List<Object> tags, Object snippetTag,
        boolean isDummyRegion, boolean considerPrevTag);

    protected abstract void addTagProperties(Object Tag, Map<String, Object> map, int tagCount);

    protected abstract void addSnippetInnerTag(Object tag, Object snippetTag);

    protected abstract void setSnippetError(Object tag, String value);

    protected abstract void setSnippetIsValid(Object tag, boolean value);

    protected abstract void setSnippetID(Object tag, String value);

    /*
     * Push a throws type ref in ast node stack.
     */
    protected abstract boolean pushThrowName(Object typeRef);

    protected abstract void setRegionPosition(int currentPosition);

    private void reportRegexSubstringTogether(Object snippetTag) {
        if (this.reportProblems) {
            this.sourceParser.problemReporter()
                .javadocInvalidSnippetRegexSubstringTogether(
                    this.lineEnd - this.scanner.getCurrentTokenString().length() + 2, this.lineEnd);
        }
        this.setSnippetIsValid(snippetTag, false);
        this.setSnippetError(snippetTag, "Regex and substring together"); //$NON-NLS-1$
    }

    /*
     * Read current character and move index position. Warning: scanner position is unchanged using this method!
     */
    protected char readChar() {
        char c = this.source[this.index++];
        if (c == '\\' && this.source[this.index] == 'u') {
            int c1, c2, c3, c4;
            int pos = this.index;
            this.index++;
            while (this.source[this.index] == 'u')
                this.index++;
            if (!(((c1 = ScannerHelper.getHexadecimalValue(this.source[this.index++])) > 15 || c1 < 0)
                || ((c2 = ScannerHelper.getHexadecimalValue(this.source[this.index++])) > 15 || c2 < 0)
                || ((c3 = ScannerHelper.getHexadecimalValue(this.source[this.index++])) > 15 || c3 < 0)
                || ((c4 = ScannerHelper.getHexadecimalValue(this.source[this.index++])) > 15 || c4 < 0))) {
                c = (char) (((c1 * 16 + c2) * 16 + c3) * 16 + c4);
            } else {
                // TODO (frederic) currently reset to previous position, perhaps signal a syntax error would be more
                // appropriate
                this.index = pos;
            }
        }
        return c;
    }

    /*
     * get current character. Warning: scanner position is unchanged using this method!
     */
    private char getChar() {
        int indexVal = this.index;
        char c = this.source[indexVal++];
        if (c == '\\' && this.source[indexVal] == 'u') {
            int c1, c2, c3, c4;
            int pos = indexVal;
            indexVal++;
            while (this.source[indexVal] == 'u')
                indexVal++;
            if (!(((c1 = ScannerHelper.getHexadecimalValue(this.source[indexVal++])) > 15 || c1 < 0)
                || ((c2 = ScannerHelper.getHexadecimalValue(this.source[indexVal++])) > 15 || c2 < 0)
                || ((c3 = ScannerHelper.getHexadecimalValue(this.source[indexVal++])) > 15 || c3 < 0)
                || ((c4 = ScannerHelper.getHexadecimalValue(this.source[indexVal++])) > 15 || c4 < 0))) {
                c = (char) (((c1 * 16 + c2) * 16 + c3) * 16 + c4);
            } else {
                // TODO (frederic) currently reset to previous position, perhaps signal a syntax error would be more
                // appropriate
                indexVal = pos;
            }
        }
        return c;
    }

    private boolean considerNextChar() {
        boolean consider = true;
        char ch = getChar();
        if (ch == ' ' || (System.lineSeparator().indexOf(ch) == 0)) {
            consider = false;
        }
        return consider;
    }

    /** compute the amount of indentation common to all non-blank lines of this markdown comment. */
    int peekMarkdownCommonIndent(int start) {

        int slashesSeen = 3;
        int min = Integer.MAX_VALUE;
        int textLineStart = start;
        int state = 0;
        int idxSave = this.index;
        this.index = start;
        char nlChar = '\0';
        try {
            while (true) {
                if (this.index >= this.scanner.eofPosition)
                    return min;
                char c = readChar();
                switch (state) {
                    case 0 -> {
                        if (c != ' ') {
                            if (c == '\r' || c == '\n') {
                                // "blank" line, i.e., no text after "///"
                                state = 2;
                                nlChar = c;
                                slashesSeen = 0;
                            } else {
                                min = Math.min(min, this.index - 1 - textLineStart);
                                state = 1;
                            }
                        }
                    }
                    case 1 -> {
                        if (c == '\r' || c == '\n') {
                            state = 2;
                            nlChar = c;
                            slashesSeen = 0;
                        }
                    }
                    case 2 -> {
                        switch (c) {
                            case '\n' -> {
                                if (nlChar == '\r') {
                                    // saw "\r\n" -> no change
                                } else {
                                    return min; // blank line seen
                                }
                            }
                            case ' ', '\t' -> {
                                nlChar = '\0';
                            }
                            case '/' -> {
                                if (++slashesSeen == 3) {
                                    textLineStart = this.index;
                                    state = 0;
                                    slashesSeen = 0;
                                }
                            }
                            default -> {
                                return min; // not a markdown line
                            }
                        }
                    }
                }
            }
        } finally {
            this.index = idxSave;
        }
    }

    /*
     * Read token only if previous was consumed
     */
    protected TerminalToken readToken() throws InvalidInputException {
        if (this.currentTokenType == TokenNameInvalid) {
            this.tokenPreviousPosition = this.scanner.currentPosition;
            this.currentTokenType = this.scanner.getNextToken();
            if (this.scanner.currentPosition > (this.lineEnd + 1)) { // be sure to be on next line (lineEnd is still on
                                                                     // the same line)
                this.lineStarted = false;
                while (this.currentTokenType == TerminalToken.TokenNameMULTIPLY) {
                    this.currentTokenType = this.scanner.getNextToken();
                }
            }
            this.index = this.scanner.currentPosition;
            this.lineStarted = true; // after having read a token, line is obviously started...
        }
        return this.currentTokenType;
    }

    protected boolean readMarkdownEscapedToken(TerminalToken expectedToken) throws InvalidInputException {
        if (!this.markdown || (this.tagValue != 7 && this.tagValue != 8))
            return readToken() == expectedToken;
        if (this.currentTokenType == TokenNameInvalid) {
            this.tokenPreviousPosition = this.scanner.currentPosition;
            if (peekChar() != '\\')
                return false;
            this.scanner.currentPosition++;
            this.currentTokenType = this.scanner.getNextToken();
            if (this.currentTokenType != expectedToken) {
                this.scanner.currentPosition = this.tokenPreviousPosition;
                this.currentTokenType = TokenNameInvalid;
                return false;
            }
            this.index = this.scanner.currentPosition;
            this.lineStarted = true; // after having read a token, line is obviously started...
        }
        return this.currentTokenType == expectedToken;
    }

    protected TerminalToken readTokenAndConsume() throws InvalidInputException {
        TerminalToken token = readToken();
        consumeToken();
        return token;
    }

    /*
     * Read token without throwing any InvalidInputException exception. Returns TerminalToken.TokenNameERROR instead.
     */
    protected TerminalToken readTokenSafely() {
        TerminalToken token = TerminalToken.TokenNameERROR;
        try {
            token = readToken();
        } catch (InvalidInputException iie) {
            // token is already set to error
        }
        return token;
    }

    protected void recordInheritedPosition(long position) {
        if (this.inheritedPositions == null) {
            this.inheritedPositions = new long[4];
            this.inheritedPositionsPtr = 0;
        } else {
            if (this.inheritedPositionsPtr == this.inheritedPositions.length) {
                System.arraycopy(this.inheritedPositions, 0,
                    this.inheritedPositions = new long[this.inheritedPositionsPtr + 4], 0, this.inheritedPositionsPtr);
            }
        }
        this.inheritedPositions[this.inheritedPositionsPtr++] = position;
    }

    /*
     * Refresh start position and length of an inline tag.
     */
    protected abstract void refreshInlineTagPosition(int previousPosition);

    /*
     * Refresh return statement
     */
    protected void refreshReturnStatement() {
        // do nothing by default
    }

    /**
     * @param started the inlineTagStarted to set
     */
    protected void setInlineTagStarted(boolean started) {
        this.inlineTagStarted = started;
    }

    @Override
    public String toString() {
        StringBuilder buffer = new StringBuilder();
        int startPos = Math.min(this.scanner.currentPosition, this.index);
        int endPos = Math.max(this.scanner.currentPosition, this.index);
        if (startPos == this.source.length)
            return "EOF\n\n" + new String(this.source); //$NON-NLS-1$
        if (endPos > this.source.length)
            return "behind the EOF\n\n" + new String(this.source); //$NON-NLS-1$

        char[] front = new char[startPos];
        System.arraycopy(this.source, 0, front, 0, startPos);

        int middleLength = (endPos - 1) - startPos + 1;
        char[] middle;
        if (middleLength > -1) {
            middle = new char[middleLength];
            System.arraycopy(this.source, startPos, middle, 0, middleLength);
        } else {
            middle = CharOperation.NO_CHAR;
        }

        char[] end = new char[this.source.length - (endPos - 1)];
        System.arraycopy(this.source, (endPos - 1) + 1, end, 0, this.source.length - (endPos - 1) - 1);

        buffer.append(front);
        if (this.scanner.currentPosition < this.index) {
            buffer.append("\n===============================\nScanner current position here -->"); //$NON-NLS-1$
        } else {
            buffer.append("\n===============================\nParser index here -->"); //$NON-NLS-1$
        }
        buffer.append(middle);
        if (this.scanner.currentPosition < this.index) {
            buffer.append("<-- Parser index here\n===============================\n"); //$NON-NLS-1$
        } else {
            buffer.append("<-- Scanner current position here\n===============================\n"); //$NON-NLS-1$
        }
        buffer.append(end);

        return buffer.toString();
    }

    /*
     * Update
     */
    protected abstract void updateDocComment();

    /*
     * Update line end
     */
    protected void updateLineEnd() {
        while (this.index > (this.lineEnd + 1)) { // be sure to be on next line (lineEnd is still on the same line)
            if (this.linePtr < this.lastLinePtr) {
                this.lineEnd = this.scanner.getLineEnd(++this.linePtr) - 1;
            } else {
                this.lineEnd = this.javadocEnd;
                return;
            }
        }
    }

    /*
     * Verify that end of the line only contains space characters or end of comment. Note that end of comment may be
     * preceding by several contiguous '*' chars.
     */
    protected boolean verifyEndLine(int textPosition) {
        boolean domParser = (this.kind & 2) != 0;
        // Special case for inline tag
        if (this.inlineTagStarted) {
            // expecting closing brace
            if (peekChar() == '}') {
                if (domParser) {
                    createTag();
                    pushText(textPosition, this.index);
                }
                return true;
            }
            return false;
        }

        int startPosition = this.index;
        int previousPosition = this.index;
        this.starPosition = -1;
        char ch = readChar();
        nextChar: while (true) {
            switch (ch) {
                case '\r':
                case '\n':
                    if (domParser) {
                        createTag();
                        pushText(textPosition, previousPosition);
                    }
                    this.index = previousPosition;
                    return true;

                case '\u000c': /* FORM FEED */
                case ' ': /* SPACE */
                case '\t': /* HORIZONTAL TABULATION */
                    if (this.starPosition >= 0)
                        break nextChar;
                    break;

                case '*':
                    this.starPosition = previousPosition;
                    break;

                case '/':
                    if (this.starPosition >= textPosition) { // valid only if a star was the previous character
                        if (domParser) {
                            createTag();
                            pushText(textPosition, this.starPosition);
                        }
                        return true;
                    }
                    break nextChar;

                default:
                    // leave loop
                    break nextChar;

            }
            previousPosition = this.index;
            ch = readChar();
        }
        this.index = startPosition;
        return false;
    }

    /*
     * Verify characters after a name matches one of following conditions: 1- first character is a white space 2- first
     * character is a closing brace *and* we're currently parsing an inline tag 3- are the end of comment (several
     * contiguous star ('*') characters may be found before the last slash ('/') character).
     */
    protected boolean verifySpaceOrEndComment() {
        this.starPosition = -1;
        int startPosition = this.index;
        // Whitespace or inline tag closing brace
        char ch = peekChar();
        switch (ch) {
            case ')':
            case ']':
                // TODO: Check if we need to exclude escaped ]
                if (this.markdown)
                    return true;
                break;

            case '}':
                return this.inlineTagStarted;

            default:
                if (ScannerHelper.isWhitespace(ch)) {
                    return true;
                }
        }
        // End of comment
        int previousPosition = this.index;
        ch = readChar();
        while (this.index < this.source.length) {
            switch (ch) {
                case '*':
                    // valid whatever the number of star before last '/'
                    this.starPosition = previousPosition;
                    break;

                case '/':
                    if (this.starPosition >= startPosition) { // valid only if a star was the previous character
                        return true;
                    }
                    // $FALL-THROUGH$ - fall through to invalid case
                default:
                    // invalid whatever other character, even white spaces
                    this.index = startPosition;
                    return false;

            }
            previousPosition = this.index;
            ch = readChar();
        }
        this.index = startPosition;
        return false;
    }

    protected void setSourceComplianceLevel() {
        if (this.sourceParser != null) {
            this.checkDocComment = this.sourceParser.options.docCommentSupport;
            this.sourceLevel = this.sourceParser.options.sourceLevel;
            this.scanner.sourceLevel = this.sourceLevel;
        }
    }

}
