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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameInvalid;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.Util;
import java.util.ArrayList;
import java.util.List;

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

    // Parse infos
    public Scanner scanner;
    public char[] source;
    protected Parser sourceParser;
    private TerminalToken currentTokenType = TokenNameInvalid;

    // Options
    public boolean checkDocComment = false;

    public boolean reportProblems;
    protected long sourceLevel;

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
    protected boolean lineStarted = false;
    protected boolean inlineTagStarted = false;
    protected boolean inlineReturn = false;
    protected int inlineReturnStart = -1;
    protected int inlineReturnOpenBraces = 0;
    protected boolean abort = false;
    protected int kind;
    protected int tagValue = 0;
    protected int lastBlockTagValue = 0;

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

    protected AbstractCommentParser(Parser sourceParser) {
        this.sourceParser = sourceParser;
        this.scanner = new Scanner(false, 3407872L, null, null, true/* taskCaseSensitive */, false);
        this.identifierStack = new char[20][];
        this.identifierPositionStack = new long[20];
        this.identifierLengthStack = new int[10];
        this.astStack = new Object[30];
        this.astLengthStack = new int[20];
        this.reportProblems = sourceParser != null;
        setSourceComplianceLevel();
    }

    /*
     * Parses the doc comment between javadocStart and javadocEnd, recording whether it has an @deprecated tag. Comment
     * parsers that build DOM tags create them while parsing.
     */
    protected void commentParse() {
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
            this.lastBlockTagValue = 0;
            this.deprecated = false;
            this.lastLinePtr = getLineNumber(this.javadocEnd);
            this.textStart = -1;
            this.abort = false;
            char previousChar;
            int invalidTagLineEnd = -1;
            boolean lineHasStar = true;
            boolean verifText = (this.kind & 512) != 0;
            boolean isDomParser = (this.kind & 2) != 0;
            boolean isFormatterParser = (this.kind & 32) != 0;
            int lastStarPosition = -1;
            boolean annotationAtSymbolHandling = false;

            // Init scanner position
            this.linePtr = getLineNumber(this.firstTagPosition);
            int realStart;
            realStart = this.linePtr == 1 ? this.javadocStart : this.scanner.getLineEnd(this.linePtr - 1) + 1;
            if (realStart < this.javadocStart)
                realStart = this.javadocStart;
            this.scanner.resetTo(realStart, this.javadocEnd);
            this.index = realStart;
            if (realStart == this.javadocStart) {
                readChar(); // starting '/'
                readChar(); // first '*'
            }
            int previousPosition;
            char nextCharacter = 0;
            if (realStart == this.javadocStart) {
                nextCharacter = readChar(); // second '*' or '/'
                while (peekChar() == '*') {
                    nextCharacter = readChar(); // read all contiguous '*'
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
                    nextCharacter = switch (this.currentTokenType) {
                        case TokenNameRBRACE -> '}';
                        case TokenNameMULTIPLY -> '*';
                        default -> this.scanner.currentCharacter;
                    };
                    consumeToken();
                }

                // Consume rules depending on the read character
                switch (nextCharacter) {
                    case '@':
                        // Start tag parsing only if we are on line beginning or at inline tag beginning
                        // https://bugs.eclipse.org/bugs/show_bug.cgi?id=206345: ignore all tags when inside @literal or
                        // @code tags
                        if (considerTagAsPlainText) {
                            // new tag found
                            if (!this.lineStarted && !checkInlineTagForAnnotaion()) {
                                considerTagAsPlainText = false;
                                this.inlineTagStarted = false;
                                openingBraces = 0;
                            }
                        } else if ((!this.lineStarted || previousChar == '{')) {
                            if (this.inlineTagStarted && !this.inlineReturn) {
                                setInlineTagStarted(false);
                                // bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=53279
                                // Cannot have @ inside inline comment
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
                            } else if (this.textStart != -1 && this.textStart < invalidTagLineEnd) {
                                pushText(this.textStart, invalidTagLineEnd);
                            }
                            this.scanner.resetTo(this.index, this.javadocEnd);
                            this.currentTokenType = TokenNameInvalid; // flush token cache at line begin
                            try {
                                if (!parseTag(previousPosition)) {
                                    // bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=51600
                                    // do not stop the inline tag when error is encountered to get text after
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
                        break;

                    case '}':
                        // https://bugs.eclipse.org/bugs/show_bug.cgi?id=206345: when ignoring tags, only decrement the
                        // opening braces counter
                        if (considerTagAsPlainText) {
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
                        }
                        break;

                    case '*':
                        // Store the star position as text start while formatting
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
                        break;

                    //$FALL-THROUGH$
                    case '/':
                        if (previousChar == '*') {
                            // End of javadoc
                            break;
                        }
                        // $FALL-THROUGH$ - fall through default case
                    default:

                        if (isFormatterParser && nextCharacter == '<') {
                            // html tags are meaningful for formatter parser
                            int initialIndex = this.index;
                            this.scanner.resetTo(this.index, this.javadocEnd);

                            if (this.abort)
                                return;
                            // Wrong html syntax continue to process character normally
                            this.scanner.currentPosition = initialIndex;
                            this.index = initialIndex;
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
                if (this.lineStarted && this.textStart != -1 && this.textStart < textEndPosition) {
                    pushText(this.textStart, textEndPosition);
                }
                refreshInlineTagPosition(textEndPosition);
                setInlineTagStarted(false);
            } else if (this.lineStarted
                && this.textStart != -1
                && this.textStart <= textEndPosition
                && (this.textStart < this.starPosition || this.starPosition == lastStarPosition)) {
                pushText(this.textStart, textEndPosition);
            }
            updateDocComment();
        } catch (Exception ignored) {
        }
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

    protected abstract Object createTypeReference(TerminalToken primitiveToken);

    /**
     * Search the line number corresponding to a specific position. Warning: returned position is 1-based index!
     *
     */
    private int getLineNumber(int position) {
        if (this.scanner.linePtr != -1) {
            return Util.getLineNumber(position, this.scanner.lineEnds, this.scanner.linePtr);
        }
        if (this.lineEnds == null)
            return 1;
        return Util.getLineNumber(position, this.lineEnds, this.lineEnds.length - 1);
    }

    /*
     * Parse argument in @see tag method reference
     */
    protected Object parseArguments(Object receiver) throws InvalidInputException {

        // Init
        int modulo = 0; // should be 2 for (Type,Type,...) or 3 for (Type arg,Type arg,...)
        int iToken = 0;
        char[] argName = null;
        List arguments = new ArrayList(10);
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
                    if (!verifySpaceOrEndComment()) {
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
                                            return false;
                                        }
                                        consumeToken();
                                    }
                                    consumeToken();
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
        return switch (token) {
            case TokenNameUNDERSCORE, TokenNameIdentifier -> {
                pushIdentifier(true, false);
                yield true;
            }
            default -> false;
        };

    }

    protected Object parseMember(Object receiver) throws InvalidInputException {
        // Init
        this.identifierPtr = -1;
        this.identifierLengthPtr = -1;
        this.memberStart = this.scanner.getCurrentTokenStartPosition();

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
                TerminalToken token = readToken();
                if (token == TerminalToken.TokenNameLPAREN) {
                    consumeToken();
                    try {
                        return parseArguments(receiver);
                    } catch (InvalidInputException ignored) {
                    }
                    return null;
                }

                // Reset position: we want to rescan last token
                this.index = previousPosition;
                this.scanner.currentPosition = previousPosition;
                this.currentTokenType = TokenNameInvalid;

                // Verify character(s) after identifier (expecting space or end comment)
                if (!verifySpaceOrEndComment()) {
                    return null;
                }
                return createFieldReference(receiver);
            } finally {
                this.scanner.tokenizeWhiteSpace = tokenWhiteSpace;
            }
        }
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
        boolean tokenWhiteSpace = this.scanner.tokenizeWhiteSpace;
        this.scanner.tokenizeWhiteSpace = true;

        try {
            // Verify that there are whitespaces after tag
            boolean isCompletionParser = (this.kind & 8) != 0;
            if (this.scanner.currentCharacter != ' ' && !ScannerHelper.isWhitespace(this.scanner.currentCharacter)) {

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
            boolean valid = true;
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
                            break nextToken;
                        }
                        // $FALL-THROUGH$ - fall through next case to report error
                    case TokenNameLESS:
                        if (valid) {
                            // store '<' in identifiers stack as we need to add it to tag element (bug 79809)
                            pushIdentifier(true, true);
                            start = this.scanner.getCurrentTokenStartPosition();
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
                            break;
                        }
                        // $FALL-THROUGH$ - when several lines, fall through next case to report problem immediately
                    case TokenNameWHITESPACE:
                        if (this.scanner.currentPosition > (this.lineEnd + 1))
                            hasMultiLines = true;
                        if (valid)
                            break;
                        // $FALL-THROUGH$ - if not valid fall through next case to report error
                    case TokenNameEOF:
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

                            if (!isCompletionParser) {
                                this.scanner.currentPosition = start;
                                this.index = start;
                            }
                            this.currentTokenType = TokenNameInvalid;
                            return false;

                        case TokenNameUNDERSCORE:
                        case TokenNameIdentifier:
                            if (valid) {
                                // store param name id
                                pushIdentifier(false, false);
                                break nextToken;
                            }
                            break;

                        default:
                            valid = false;
                            break;
                    }
                }

                // Get last character of type parameter declaration
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
                                valid = false;
                            }
                            if (valid)
                                break;
                            // $FALL-THROUGH$ - if not valid fall through next case to report error
                        case TokenNameEOF:

                            if (!isCompletionParser) {
                                this.scanner.currentPosition = start;
                                this.index = start;
                            }
                            this.currentTokenType = TokenNameInvalid;
                            return false;

                        case TokenNameGREATER:
                            if (valid) {
                                // store '>' in identifiers stack as we need to add it to tag element (bug 79809)
                                pushIdentifier(false, true);
                                break nextToken;
                            }
                            break;

                        default:
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
            } catch (InvalidInputException ignored) {
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
                // Skip the invalid name as upstream does before reporting it; reading tokens updates the line state.
                try {
                    while ((token = readToken()) != TerminalToken.TokenNameWHITESPACE
                        && token != TerminalToken.TokenNameEOF) {
                        this.currentTokenType = TokenNameInvalid;
                    }
                } catch (InvalidInputException ignored) {
                }
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

    /*
     * Parse a qualified name and built a type reference if the syntax is valid.
     */
    protected Object parseQualifiedName(boolean reset) throws InvalidInputException {

        // Reset identifier stack if requested
        if (reset) {
            this.identifierPtr = -1;
            this.identifierLengthPtr = -1;
        }

        // Scan tokens
        TerminalToken primitiveToken = TokenNameInvalid;
        int parserKind = this.kind & 255;

        nextToken: for (int iToken = 0;; iToken++) {
            TerminalToken token = readTokenSafely();
            switch (token) {
                case TokenNameUNDERSCORE:
                case TokenNameIdentifier:
                    if (((iToken & 1) != 0)) { // identifiers must be odd tokens
                        break nextToken;
                    }
                    pushIdentifier(iToken == 0, false);
                    consumeToken();

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
                    // else fall through
                    // Note: Add other cases before this case.
                    // $FALL-THROUGH$
                default:
                    if (iToken == 0) {
                        if (this.identifierPtr >= 0) {
                            this.lastIdentifierEndPosition = (int) this.identifierPositionStack[this.identifierPtr];
                        }
                        return null;
                    }
                    if ((iToken & 1) == 0) { // cannot leave on a dot
                        switch (parserKind) {
                            case 8:
                                if (this.identifierPtr >= 0) {
                                    this.lastIdentifierEndPosition
                                        = (int) this.identifierPositionStack[this.identifierPtr];
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

        return createTypeReference(primitiveToken);
    }

    /*
     * Parse a reference in @see tag
     */
    protected boolean parseReference() {
        boolean tokenWhiteSpace = this.scanner.tokenizeWhiteSpace;
        this.scanner.tokenizeWhiteSpace = false;
        try {
            Object typeRef = null;
            Object reference;
            int previousPosition;

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
                        if (this.tagValue == 10) {
                            // String reference are not allowed for @value tag
                            return false;
                        }

                        // verify end line
                        return verifyEndLine(previousPosition);

                    case TokenNameLESS: // @see <a href="URL#Value">label</a>
                        // If typeRef != null we may raise a warning here to let user know there's an unused
                        // reference...
                        // Currently as javadoc 1.4.2 ignore it, we do the same (see bug 69302)
                        if (typeRef != null)
                            break nextToken;
                        consumeToken();
                        if (parseHref()) {
                            consumeToken();
                            if (this.tagValue == 10) {
                                // String reference are not allowed for @value tag
                                return false;
                            }
                            // verify end line
                            return verifyEndLine(previousPosition);

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
                            return false;
                        }
                        break nextToken;

                    case TokenNameUNDERSCORE:
                    case TokenNameIdentifier:
                        if (typeRef == null) {
                            typeRef = parseQualifiedName(true);
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
                return false;
            }

            int currentIndex = this.index; // store current index
            char ch = readChar();
            switch (ch) {
                // Verify that line end does not start with an open parenthese (which could be a constructor reference
                // wrongly written...)
                // See bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=47215
                case '(':
                    return false;

                // Search for the :// URL pattern
                // See bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=168849
                case ':':
                    ch = readChar();
                    if (ch == '/' && ch == readChar()) {
                        if (this.reportProblems) {
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
                return false;
            }

            // Everything is OK, store reference
            return pushSeeRef(reference);
        } catch (InvalidInputException ignored) {
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
        this.scanner.tokenizeWhiteSpace = true;
        this.scanner.tokenizeComments = true;
        // Snippets need Java 18.
        throw Scanner.invalidInput();
    }

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
            if (typeRef != null) {
                return pushThrowName(typeRef);
            }
        } catch (InvalidInputException ignored) {
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
            do
                idx++;
            while (this.source[idx] == 'u');
            if (!(((c1 = ScannerHelper.getHexadecimalValue(this.source[idx++])) > 15 || c1 < 0)
                || ((c2 = ScannerHelper.getHexadecimalValue(this.source[idx++])) > 15 || c2 < 0)
                || ((c3 = ScannerHelper.getHexadecimalValue(this.source[idx++])) > 15 || c3 < 0)
                || ((c4 = ScannerHelper.getHexadecimalValue(this.source[idx])) > 15 || c4 < 0))) {
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

    /*
     * Push a throws type ref in ast node stack.
     */
    protected abstract boolean pushThrowName(Object typeRef);

    /*
     * Read current character and move index position. Warning: scanner position is unchanged using this method!
     */
    protected char readChar() {
        char c = this.source[this.index++];
        if (c == '\\' && this.source[this.index] == 'u') {
            int c1, c2, c3, c4;
            int pos = this.index;
            do
                this.index++;
            while (this.source[this.index] == 'u');
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
        return readToken() == expectedToken;
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

    /*
     * Refresh start position and length of an inline tag.
     */
    protected abstract void refreshInlineTagPosition(int previousPosition);

    /**
     * @param started the inlineTagStarted to set
     */
    protected void setInlineTagStarted(boolean started) {
        this.inlineTagStarted = started;
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
