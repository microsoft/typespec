// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2024 IBM Corporation and others.
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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Parser specialized for decoding javadoc comments
 */
public class JavadocParser extends AbstractCommentParser {
    private static final JavadocSingleNameReference[] NO_SINGLE_NAME_REFERENCE = new JavadocSingleNameReference[0];
    private static final JavadocSingleTypeReference[] NO_SINGLE_TYPE_REFERENCE = new JavadocSingleTypeReference[0];
    private static final JavadocQualifiedTypeReference[] NO_QUALIFIED_TYPE_REFERENCE
        = new JavadocQualifiedTypeReference[0];
    private static final TypeReference[] NO_TYPE_REFERENCE = new TypeReference[0];
    private static final Expression[] NO_EXPRESSION = new Expression[0];

    // Public fields
    public Javadoc docComment;

    // bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=51600
    // Store param references for tag with invalid syntax
    private int invalidParamReferencesPtr = -1;
    private ASTNode[] invalidParamReferencesStack;

    // returns whether this JavadocParser should report errors or not (overrides reportProblems)
    // see "https://bugs.eclipse.org/bugs/show_bug.cgi?id=192449"
    public boolean shouldReportProblems = true;

    // flag to let the parser know that the current tag is waiting for a description
    // see "https://bugs.eclipse.org/bugs/show_bug.cgi?id=222900"
    private int tagWaitingForDescription;

    private final ArrayList<String> regionNames = new ArrayList<>();
    private int regionPosition = -1;

    public JavadocParser(Parser sourceParser) {
        super(sourceParser);
        this.kind = 1 | 512;
        if (sourceParser != null && sourceParser.options != null) {
            this.setJavadocPositions = sourceParser.options.processAnnotations;
        }
    }

    /*
     * (non-Javadoc) Returns true if tag @deprecated is present in javadoc comment.
     *
     * If javadoc checking is enabled, will also construct an Javadoc node, which will be stored into Parser.javadoc
     * slot for being consumed later on.
     */
    public boolean checkDeprecation(int commentPtr) {

        // Store javadoc positions
        this.javadocStart = this.sourceParser.scanner.commentStarts[commentPtr];
        this.javadocEnd = this.sourceParser.scanner.commentStops[commentPtr] - 1;
        this.firstTagPosition = this.sourceParser.scanner.commentTagStarts[commentPtr];
        this.markdown = this.sourceParser.scanner.commentIsMarkdown[commentPtr];
        this.tagWaitingForDescription = 0;

        // Init javadoc if necessary
        if (this.checkDocComment) {
            this.docComment = new Javadoc(this.javadocStart, this.javadocEnd);
        } else if (this.setJavadocPositions) {
            // https://bugs.eclipse.org/bugs/show_bug.cgi?id=189459
            // if annotation processors are there, javadoc object is required but
            // they need not be resolved
            this.docComment = new Javadoc(this.javadocStart, this.javadocEnd);
            this.docComment.bits &= ~65536;
        } else {
            this.docComment = null;
        }

        // If there's no tag in javadoc, return without parsing it
        if (this.firstTagPosition == 0) {
            switch (this.kind & 255) {
                case 1:
                case 16:
                    return false;
            }
        }

        // Parse
        try {
            this.source = this.sourceParser.scanner.source;
            this.scanner.setSource(this.source); // updating source in scanner
            this.markdown = this.source[this.javadocStart + 1] == '/';
            if (this.checkDocComment) {
                // Initialization
                this.scanner.lineEnds = this.sourceParser.scanner.lineEnds;
                this.scanner.linePtr = this.sourceParser.scanner.linePtr;
                this.lineEnds = this.scanner.lineEnds;
                commentParse();
            } else {

                // Parse comment
                Scanner sourceScanner = this.sourceParser.scanner;
                int firstLineNumber
                    = Util.getLineNumber(this.javadocStart, sourceScanner.lineEnds, 0, sourceScanner.linePtr);
                int lastLineNumber
                    = Util.getLineNumber(this.javadocEnd, sourceScanner.lineEnds, 0, sourceScanner.linePtr);
                this.index = this.javadocStart + 3;

                // scan line per line, since tags must be at beginning of lines only
                this.deprecated = false;
                nextLine: for (int line = firstLineNumber; line <= lastLineNumber; line++) {
                    int lineStart = line == firstLineNumber
                        ? this.javadocStart + 3 // skip leading /**
                        : this.sourceParser.scanner.getLineStart(line);
                    this.index = lineStart;
                    this.lineEnd = line == lastLineNumber
                        ? this.javadocEnd - 2 // remove trailing * /
                        : this.sourceParser.scanner.getLineEnd(line);
                    nextCharacter: while (this.index < this.lineEnd) {
                        char c = readChar(); // consider unicodes
                        switch (c) {
                            case '/':
                                if (!this.markdown) {
                                    break;
                                }
                                //$FALL-THROUGH$
                            case '*':
                            case '\u000c': /* FORM FEED */
                            case ' ': /* SPACE */
                            case '\t': /* HORIZONTAL TABULATION */
                            case '\n': /* LINE FEED */
                            case '\r': /* CR */
                                // do nothing for space or '*' characters
                                continue nextCharacter;

                            case '@':
                                parseSimpleTag();
                                if (this.tagValue == 1) {
                                    if (this.abort)
                                        break nextCharacter;
                                }
                        }
                        continue nextLine;
                    }
                }
                return this.deprecated;
            }
        } finally {
            this.source = null; // release source as soon as finished
            this.scanner.setSource((char[]) null); // release source in scanner
        }
        return this.deprecated;
    }

    @Override
    protected Object createArgumentReference(char[] name, int dim, boolean isVarargs, Object typeRef,
        long[] dimPositions, long argNamePos) throws InvalidInputException {
        try {
            TypeReference argTypeRef = (TypeReference) typeRef;
            if (dim > 0) {
                long pos = (((long) argTypeRef.sourceStart) << 32) + argTypeRef.sourceEnd;
                if (typeRef instanceof JavadocSingleTypeReference) {
                    JavadocSingleTypeReference singleRef = (JavadocSingleTypeReference) typeRef;
                    argTypeRef = new JavadocArraySingleTypeReference(singleRef.token, dim, pos);
                } else {
                    JavadocQualifiedTypeReference qualifRef = (JavadocQualifiedTypeReference) typeRef;
                    argTypeRef = new JavadocArrayQualifiedTypeReference(qualifRef, dim);
                }
            }
            int argEnd = argTypeRef.sourceEnd;
            if (dim > 0) {
                argEnd = (int) dimPositions[dim - 1];
                if (isVarargs) {
                    argTypeRef.bits |= 16384; // set isVarArgs
                }
            }
            if (argNamePos >= 0)
                argEnd = (int) argNamePos;
            return new JavadocArgumentExpression(name, argTypeRef.sourceStart, argEnd, argTypeRef);
        } catch (ClassCastException ex) {
            throw Scanner.invalidInput();
        }
    }

    @Override
    protected Object createFieldReference(Object receiver) throws InvalidInputException {
        try {
            // Get receiver type
            TypeReference typeRef = null;
            boolean useReceiver = false;
            if (receiver instanceof JavadocModuleReference) {
                JavadocModuleReference jRef = (JavadocModuleReference) receiver;
                if (jRef.typeReference != null) {
                    typeRef = jRef.typeReference;
                    useReceiver = true;
                }
            } else {
                typeRef = (TypeReference) receiver;
            }
            if (typeRef == null) {
                char[] name = this.sourceParser.compilationUnit.getMainTypeName();
                typeRef = new JavadocImplicitTypeReference(name, this.memberStart);
            }
            // Create field
            JavadocFieldReference field
                = new JavadocFieldReference(this.identifierStack[0], this.identifierPositionStack[0]);
            field.receiver = useReceiver ? (Expression) receiver : typeRef;

            return field;
        } catch (ClassCastException ex) {
            throw Scanner.invalidInput();
        }
    }

    @Override
    protected Object createMethodReference(Object receiver, List arguments) throws InvalidInputException {
        try {
            // Get receiver type
            TypeReference typeRef = null;
            if (receiver instanceof JavadocModuleReference) {
                JavadocModuleReference jRef = (JavadocModuleReference) receiver;
                if (jRef.typeReference != null) {
                    typeRef = jRef.typeReference;
                }
            } else {
                typeRef = (TypeReference) receiver;
            }
            // Decide whether we have a constructor or not
            boolean isConstructor;
            int length = this.identifierLengthStack[0];	// may be > 1 for member class constructor reference
            if (typeRef == null) {
                char[] name = this.sourceParser.compilationUnit.getMainTypeName();
                TypeDeclaration typeDecl = getParsedTypeDeclaration();
                if (typeDecl != null) {
                    name = typeDecl.name;
                }
                isConstructor = CharOperation.equals(this.identifierStack[length - 1], name);
                typeRef = new JavadocImplicitTypeReference(name, this.memberStart);
            } else {
                if (typeRef instanceof JavadocSingleTypeReference) {
                    char[] name = ((JavadocSingleTypeReference) typeRef).token;
                    isConstructor = CharOperation.equals(this.identifierStack[length - 1], name);
                } else if (typeRef instanceof JavadocQualifiedTypeReference) {
                    char[][] tokens = ((JavadocQualifiedTypeReference) typeRef).tokens;
                    int last = tokens.length - 1;
                    isConstructor = CharOperation.equals(this.identifierStack[length - 1], tokens[last]);
                    if (isConstructor) {
                        boolean valid = true;
                        if (valid) {
                            for (int i = 0; i < length - 1 && valid; i++) {
                                valid = CharOperation.equals(this.identifierStack[i], tokens[i]);
                            }
                        }
                        if (!valid) {
                            if (this.reportProblems) {
                                this.sourceParser.problemReporter()
                                    .javadocInvalidMemberTypeQualification(
                                        (int) (this.identifierPositionStack[0] >>> 32),
                                        (int) this.identifierPositionStack[length - 1]);
                            }
                            return null;
                        }
                    }
                } else {
                    throw Scanner.invalidInput();
                }
            }
            // Create node
            if (arguments == null) {
                if (isConstructor) {
                    JavadocAllocationExpression allocation
                        = new JavadocAllocationExpression(this.identifierPositionStack[length - 1]);
                    allocation.type = typeRef;

                    allocation.sourceEnd = this.scanner.getCurrentTokenEndPosition();
                    if (length != 1) {
                        allocation.sourceStart = (int) (this.identifierPositionStack[0] >>> 32);
                    }

                    return allocation;
                } else {
                    JavadocMessageSend msg = new JavadocMessageSend(this.identifierStack[length - 1],
                        this.identifierPositionStack[length - 1]);
                    msg.receiver = typeRef;

                    msg.sourceEnd = this.scanner.getCurrentTokenEndPosition();
                    return msg;
                }
            } else {
                JavadocArgumentExpression[] expressions = new JavadocArgumentExpression[arguments.size()];
                arguments.toArray(expressions);
                if (isConstructor) {
                    JavadocAllocationExpression allocation
                        = new JavadocAllocationExpression(this.identifierPositionStack[length - 1]);
                    allocation.arguments = expressions;
                    allocation.type = typeRef;

                    allocation.sourceEnd = this.scanner.getCurrentTokenEndPosition();
                    if (length != 1) {
                        allocation.sourceStart = (int) (this.identifierPositionStack[0] >>> 32);
                    }

                    return allocation;
                } else {
                    JavadocMessageSend msg = new JavadocMessageSend(this.identifierStack[length - 1],
                        this.identifierPositionStack[length - 1], expressions);
                    msg.receiver = typeRef;

                    msg.sourceEnd = this.scanner.getCurrentTokenEndPosition();
                    return msg;
                }
            }
        } catch (ClassCastException ex) {
            throw Scanner.invalidInput();
        }
    }

    protected Object createReturnStatement() {
        return new JavadocReturnStatement(this.scanner.getCurrentTokenStartPosition(),
            this.scanner.getCurrentTokenEndPosition());
    }

    @Override
    protected void createTag() {
        this.tagValue = 100;
        this.markdownHelper.resetLineStart();
    }

    @Override
    protected Object createSnippetTag() {
        this.tagValue = 30;
        return this.tagValue;
    }

    @Override
    protected Object createSnippetRegion(String name, List<Object> tags, Object snippetTag, boolean isDummyRegion,
        boolean considerPrevTag) {
        if (this.regionNames.contains(name)) {
            if (this.reportProblems) {
                int startPos = this.lineEnd - this.scanner.getCurrentTokenString().length() + 2;
                if (this.regionPosition > 0)
                    startPos = startPos + this.regionPosition;
                this.sourceParser.problemReporter().javadocInvalidSnippetDuplicateRegions(startPos - 4, startPos + 1);
            }
            this.setSnippetIsValid(snippetTag, false);
            this.setSnippetError(snippetTag, "Duplicate regions"); //$NON-NLS-1$
        } else {
            if (name != null)
                this.regionNames.add(name);
        }

        if (tags != null && tags.size() > 0) {
            return tags.get(0);
        }
        return name;
    }

    @Override
    protected void setSnippetIsValid(Object obj, boolean value) {
        // do nothing;
    }

    @Override
    protected void setSnippetError(Object obj, String value) {
        // do nothing;
    }

    @Override
    protected void setSnippetID(Object tag, String value) {
        // do nothing

    }

    @Override
    protected Object createSnippetInnerTag(String tagName, int start, int end) {
        return tagName;
    }

    @Override
    protected void addTagProperties(Object Tag, Map<String, Object> map, int tagCount) {
        return;
    }

    @Override
    protected void addSnippetInnerTag(Object tag, Object snippetTag) {
        this.tagValue = 100;
    }

    @Override
    protected Object createTypeReference(TerminalToken primitiveToken, boolean canBeModule) {
        TypeReference typeRef = null;
        int size = this.identifierLengthStack[this.identifierLengthPtr];
        if (size == 1) { // Single Type ref
            typeRef = new JavadocSingleTypeReference(this.identifierStack[this.identifierPtr],
                this.identifierPositionStack[this.identifierPtr]);
        } else if (size > 1) { // Qualified Type ref
            char[][] tokens = new char[size][];
            System.arraycopy(this.identifierStack, this.identifierPtr - size + 1, tokens, 0, size);
            long[] positions = new long[size];
            System.arraycopy(this.identifierPositionStack, this.identifierPtr - size + 1, positions, 0, size);
            typeRef = new JavadocQualifiedTypeReference(tokens, positions);
        }
        return typeRef;
    }

    protected JavadocModuleReference createModuleReference(int moduleRefTokenCount) {
        JavadocModuleReference moduleRef;
        char[][] tokens = new char[moduleRefTokenCount][];
        System.arraycopy(this.identifierStack, 0, tokens, 0, moduleRefTokenCount);
        long[] positions = new long[moduleRefTokenCount];
        System.arraycopy(this.identifierPositionStack, 0, positions, 0, moduleRefTokenCount);
        moduleRef = new JavadocModuleReference(tokens, positions);
        return moduleRef;
    }

    @Override
    protected Object createModuleTypeReference(TerminalToken primitiveToken, int moduleRefTokenCount) {
        JavadocModuleReference moduleRef = createModuleReference(moduleRefTokenCount);

        TypeReference typeRef = null;
        int size = this.identifierLengthStack[this.identifierLengthPtr];
        int newSize = size - moduleRefTokenCount;
        if (newSize == 1) { // Single Type ref
            typeRef = new JavadocSingleTypeReference(this.identifierStack[this.identifierPtr],
                this.identifierPositionStack[this.identifierPtr]);
        } else if (newSize > 1) { // Qualified Type ref
            char[][] tokens = new char[newSize][];
            System.arraycopy(this.identifierStack, this.identifierPtr - newSize + 1, tokens, 0, newSize);
            long[] positions = new long[newSize];
            System.arraycopy(this.identifierPositionStack, this.identifierPtr - newSize + 1, positions, 0, newSize);
            typeRef = new JavadocQualifiedTypeReference(tokens, positions);
        } else {
            this.lastIdentifierEndPosition++;
        }

        moduleRef.setTypeReference(typeRef);
        return moduleRef;
    }

    /*
     * Get current parsed type declaration.
     */
    protected TypeDeclaration getParsedTypeDeclaration() {
        int ptr = this.sourceParser.astPtr;
        while (ptr >= 0) {
            Object node = this.sourceParser.astStack[ptr];
            if (node instanceof TypeDeclaration) {
                TypeDeclaration typeDecl = (TypeDeclaration) node;
                if (typeDecl.bodyEnd == 0) { // type declaration currenly parsed
                    return typeDecl;
                }
            }
            ptr--;
        }
        return null;
    }

    /*
     * Parse @throws tag declaration and flag missing description if corresponding option is enabled
     */
    @Override
    protected boolean parseThrows() {
        boolean valid = super.parseThrows();
        this.tagWaitingForDescription = valid && this.reportProblems ? 4 : 0;
        return valid;
    }

    /*
     * Parse @return tag declaration
     */
    protected boolean parseReturn() {
        if (this.returnStatement == null) {
            this.returnStatement = createReturnStatement();
            return true;
        }
        if (this.reportProblems) {
            this.sourceParser.problemReporter()
                .javadocDuplicatedReturnTag(this.scanner.getCurrentTokenStartPosition(),
                    this.scanner.getCurrentTokenEndPosition());
        }
        return false;
    }

    protected void parseSimpleTag() {

        // Read first char
        // readChar() code is inlined to balance additional method call in checkDeprectation(int)
        char first = this.source[this.index++];
        if (first == '\\' && this.source[this.index] == 'u') {
            int c1, c2, c3, c4;
            int pos = this.index;
            this.index++;
            while (this.source[this.index] == 'u')
                this.index++;
            if (!(((c1 = ScannerHelper.getHexadecimalValue(this.source[this.index++])) > 15 || c1 < 0)
                || ((c2 = ScannerHelper.getHexadecimalValue(this.source[this.index++])) > 15 || c2 < 0)
                || ((c3 = ScannerHelper.getHexadecimalValue(this.source[this.index++])) > 15 || c3 < 0)
                || ((c4 = ScannerHelper.getHexadecimalValue(this.source[this.index++])) > 15 || c4 < 0))) {
                first = (char) (((c1 * 16 + c2) * 16 + c3) * 16 + c4);
            } else {
                this.index = pos;
            }
        }

        // switch on first tag char
        switch (first) {
            case 'd':
                if ((readChar() == 'e')
                    && (readChar() == 'p')
                    && (readChar() == 'r')
                    && (readChar() == 'e')
                    && (readChar() == 'c')
                    && (readChar() == 'a')
                    && (readChar() == 't')
                    && (readChar() == 'e')
                    && (readChar() == 'd')) {
                    // ensure the tag is properly ended: either followed by a space, a tab, line end or asterisk.
                    char c = readChar();
                    if (ScannerHelper.isWhitespace(c) || c == '*') {
                        this.abort = true;
                        this.deprecated = true;
                        this.tagValue = 1;
                    }
                }
                break;
        }
    }

    @Override
    protected boolean parseMarkdownLinks(int previousPosition) throws InvalidInputException {
        boolean valid = false;
        // The markdown links can come in single [] or pair of [] with no space between them
        // We are here after we have seen [
        // Look for closing ] and then an option [
        // immediately without any other characters, including whitespace
        // If there are two [], then the first one becomes the link text
        // and the second one is the reference
        // in case of just one [], then that is the reference
        int start = this.index;
        char currentChar = readChar();
        loop: while (this.index < this.scanner.eofPosition) {
            switch (currentChar) {
                case '\\':
                    char c = peekChar();
                    if (c == '[' || c == ']') {
                        readChar();
                    }
                    break;

                case ']':
                    if (peekChar() == '[') {
                        // We might want to store the description in case of DOM parser
                        // but the compiler does not need it
                        // int length = this.index - start - 1;
                        // System.arraycopy(this.scanner.source, start, desc = new char[length], 0, length);
                        // move it past '['
                        currentChar = readChar();
                        start = this.index;
                    } else if (peekChar() == '(') {
                        valid = parseURLReference(this.index, true);
                    } else {
                        break loop;
                    }
                    break;

                case '\r':
                case '\n':
                    if ((this.kind & 255) == 8) {
                        // TODO would like to trigger parseReference() with more tokens,
                        // but in "[some text][#theLink]" arbitrary chars are allowed which do not imply end of link
                        // identifier.
                        // To resolve this we would need to scan for detection of a second pair of brackets ...
                        break loop;
                    }
                    return false;

                default:
                    break;
            }
            currentChar = readChar();
        }
        int eofBkup = this.scanner.eofPosition;
        this.scanner.resetTo(start, Math.max(this.javadocEnd, this.index));
        this.tagValue = 7;
        if (!valid)
            valid = parseReference(true);
        this.tagValue = 0;
        this.scanner.eofPosition = eofBkup;
        this.markdownHelper.resetLineStart();
        return valid;
    }

    @Override
    protected boolean parseTag(int previousPosition) throws InvalidInputException {
        this.markdownHelper.resetLineStart();

        // Complain when tag is missing a description
        // Note that if the parse of an inline tag has already started, consider it
        // as the expected description, hence do not report any warning
        switch (this.tagWaitingForDescription) {
            case 2:
            case 4:
                if (!this.inlineTagStarted) {
                    int start = (int) (this.identifierPositionStack[0] >>> 32);
                    int end = (int) this.identifierPositionStack[this.identifierPtr];
                    this.sourceParser.problemReporter()
                        .javadocMissingTagDescriptionAfterReference(start, end, this.sourceParser.modifiers);
                }
                break;

            case 0:
                break;

            default:
                if (!this.inlineTagStarted) {
                    this.sourceParser.problemReporter()
                        .javadocMissingTagDescription(TAG_NAMES[this.tagWaitingForDescription], this.tagSourceStart,
                            this.tagSourceEnd, this.sourceParser.modifiers);
                }
                break;
        }
        this.tagWaitingForDescription = 0;

        // Verify first character
        this.tagSourceStart = this.index;
        this.tagSourceEnd = previousPosition;
        this.scanner.startPosition = this.index;
        int currentPosition = this.index;
        char firstChar = readChar();
        switch (firstChar) {
            case ' ':
            case '*':
            case '}':
            case '#':
                // the first character is not valid, hence report invalid empty tag
                if (this.reportProblems)
                    this.sourceParser.problemReporter().javadocInvalidTag(previousPosition, currentPosition);
                if (this.textStart == -1)
                    this.textStart = currentPosition;
                this.scanner.currentCharacter = firstChar;
                return false;

            default:
                if (ScannerHelper.isWhitespace(firstChar)) {
                    // the first character is not valid, hence report invalid empty tag
                    if (this.reportProblems)
                        this.sourceParser.problemReporter().javadocInvalidTag(previousPosition, currentPosition);
                    if (this.textStart == -1)
                        this.textStart = currentPosition;
                    this.scanner.currentCharacter = firstChar;
                    return false;
                }
                break;
        }

        // Read tag name
        char[] tagName = new char[32];
        int length = 0;
        char currentChar = firstChar;
        int tagNameLength = tagName.length;
        boolean validTag = true;
        tagLoop: while (true) {
            if (length == tagNameLength) {
                System.arraycopy(tagName, 0, tagName = new char[tagNameLength + 32], 0, tagNameLength);
                tagNameLength = tagName.length;
            }
            tagName[length++] = currentChar;
            currentPosition = this.index;
            currentChar = readChar();
            switch (currentChar) {
                case ' ':
                case '*':
                case '}':
                    // these characters mark the end of the tag reading
                    break tagLoop;

                case '#':
                    // invalid tag character, mark the tag as invalid but continue until the end of the tag
                    validTag = false;
                    break;

                default:
                    if (ScannerHelper.isWhitespace(currentChar)) {
                        // whitespace characters mark the end of the tag reading
                        break tagLoop;
                    }
                    break;
            }
        }

        // Init positions
        this.tagSourceEnd = currentPosition - 1;
        this.scanner.currentCharacter = currentChar;
        this.scanner.currentPosition = currentPosition;
        this.index = this.tagSourceEnd + 1;

        // Return if the tag is not valid
        if (!validTag) {
            if (this.reportProblems)
                this.sourceParser.problemReporter().javadocInvalidTag(this.tagSourceStart, this.tagSourceEnd);
            if (this.textStart == -1)
                this.textStart = this.index;
            this.scanner.currentCharacter = currentChar;
            return false;
        }

        // Decide which parse to perform depending on tag name
        this.tagValue = 100;
        boolean valid = false;
        switch (firstChar) {
            case 'a':
                if (length == 6 && CharOperation.equals(TAG_AUTHOR, tagName, length)) {
                    this.tagValue = 12;
                    this.tagWaitingForDescription = this.tagValue;
                } else if (length == 7 && CharOperation.equals(TAG_API_NOTE, tagName, length)) {
                    this.tagValue = 27;
                    this.tagWaitingForDescription = this.tagValue;
                }
                break;

            case 'c':
                if (length == 8 && CharOperation.equals(TAG_CATEGORY, tagName, length)) {
                    this.tagValue = 11;
                    if (!this.inlineTagStarted) {
                        valid = parseIdentifierTag(false); // TODO (frederic) reconsider parameter value when @category
                                                           // will be significant in spec
                    }
                } else if (length == 4 && this.inlineTagStarted && CharOperation.equals(TAG_CODE, tagName, length)) {
                    this.tagValue = 18;
                    this.tagWaitingForDescription = this.tagValue;
                }
                break;

            case 'd':
                if (length == 10 && CharOperation.equals(TAG_DEPRECATED, tagName, length)) {
                    this.deprecated = true;
                    valid = true;
                    this.tagValue = 1;
                    this.tagWaitingForDescription = this.tagValue;
                } else if (length == 7 && CharOperation.equals(TAG_DOC_ROOT, tagName, length)) {
                    // https://bugs.eclipse.org/bugs/show_bug.cgi?id=227730
                    // identify @docRoot tag as a base tag that does not expect any argument
                    valid = true;
                    this.tagValue = 20;
                }
                break;

            case 'e':
                if (length == 9 && CharOperation.equals(TAG_EXCEPTION, tagName, length)) {
                    this.tagValue = 5;
                    if (!this.inlineTagStarted) {
                        valid = parseThrows();
                    }
                }
                break;

            case 'h':
                if (length == 6 && CharOperation.equals(TAG_HIDDEN, tagName, length)) {
                    valid = true;
                    this.tagValue = 24;
                }
                break;

            case 'i':
                if (length == 5 && CharOperation.equals(TAG_INDEX, tagName, length)) {
                    valid = true;
                    this.tagValue = 25;
                    this.tagWaitingForDescription = this.tagValue;
                } else if (length == 10 && CharOperation.equals(TAG_INHERITDOC, tagName, length)) {
                    // https://bugs.eclipse.org/bugs/show_bug.cgi?id=247037, @inheritDoc usage is illegal
                    // outside of few block tags and the main description.
                    switch (this.lastBlockTagValue) {
                        case 3:
                        case 4:
                        case 5:
                        case 2:
                        case 0:     // Still in main description
                            valid = true;
                            if (this.reportProblems) {
                                recordInheritedPosition((((long) this.tagSourceStart) << 32) + this.tagSourceEnd);
                            }
                            if (this.inlineTagStarted) {
                                // parse a 'valid' inheritDoc tag

                            }
                            break;

                        default:
                            valid = false;
                            if (this.reportProblems) {
                                this.sourceParser.problemReporter()
                                    .javadocUnexpectedTag(this.tagSourceStart, this.tagSourceEnd);
                            }
                    }
                    this.tagValue = 9;
                } else if (length == 8 && CharOperation.equals(TAG_IMPL_SPEC, tagName, length)) {
                    this.tagValue = 28;
                    this.tagWaitingForDescription = this.tagValue;
                } else if (length == 8 && CharOperation.equals(TAG_IMPL_NOTE, tagName, length)) {
                    this.tagValue = 29;
                    this.tagWaitingForDescription = this.tagValue;
                }
                break;

            case 'l':
                if (length == 4 && CharOperation.equals(TAG_LINK, tagName, length)) {
                    this.tagValue = 7;
                    if (this.inlineTagStarted || (this.kind & 8) != 0) {
                        valid = parseReference(true);
                    }
                } else if (length == 9 && CharOperation.equals(TAG_LINKPLAIN, tagName, length)) {
                    this.tagValue = 8;
                    if (this.inlineTagStarted) {
                        valid = parseReference(true);
                    }
                } else if (length == 7 && this.inlineTagStarted && CharOperation.equals(TAG_LITERAL, tagName, length)) {
                    this.tagValue = 19;
                    this.tagWaitingForDescription = this.tagValue;
                }
                break;

            case 'p':
                if (length == 5 && CharOperation.equals(TAG_PARAM, tagName, length)) {
                    this.tagValue = 2;
                    if (!this.inlineTagStarted) {
                        valid = parseParam();
                    }
                } else if (length == 8 && CharOperation.equals(TAG_PROVIDES, tagName, length)) {
                    this.tagValue = 23;
                    if (!this.inlineTagStarted) {
                        valid = parseProvidesReference();
                    }
                }
                break;

            case 'r':
                if (length == 6 && CharOperation.equals(TAG_RETURN, tagName, length)) {
                    this.tagValue = 3;
                    if (this.sourceLevel >= 3932160L || !this.inlineTagStarted) {
                        valid = parseReturn();
                    }
                }
                break;

            case 's':
                if (length == 3 && CharOperation.equals(TAG_SEE, tagName, length)) {
                    this.tagValue = 6;
                    if (!this.inlineTagStarted) {
                        valid = parseReference(true);
                    }
                } else if (length == 6 && CharOperation.equals(TAG_SERIAL, tagName, length)) {
                    this.tagValue = 13;
                    this.tagWaitingForDescription = this.tagValue;
                } else if (length == 10 && CharOperation.equals(TAG_SERIAL_DATA, tagName, length)) {
                    this.tagValue = 14;
                    this.tagWaitingForDescription = this.tagValue;
                } else if (length == 11 && CharOperation.equals(TAG_SERIAL_FIELD, tagName, length)) {
                    this.tagValue = 15;
                    this.tagWaitingForDescription = this.tagValue;
                } else if (length == 5 && CharOperation.equals(TAG_SINCE, tagName, length)) {
                    this.tagValue = 16;
                    this.tagWaitingForDescription = this.tagValue;
                } else if (length == 14 && CharOperation.equals(TAG_SYSTEM_PROPERTY, tagName, length)) {
                    this.tagValue = 21;
                    this.tagWaitingForDescription = this.tagValue;
                } else if (length == 7 && CharOperation.equals(TAG_SUMMARY, tagName, length)) {
                    this.tagValue = 26;
                    this.tagWaitingForDescription = this.tagValue;
                } else if (length == 7 && CharOperation.equals(TAG_SNIPPET, tagName, length)) {
                    this.tagValue = 30;
                    this.tagWaitingForDescription = this.tagValue;
                    if (this.inlineTagStarted) {
                        valid = parseSnippet();
                    }
                } else if (length > 7 && CharOperation.prefixEquals(tagName)) {
                    if (this.reportProblems) {
                        this.sourceParser.problemReporter()
                            .javadocInvalidSnippet(this.tagSourceStart, this.tagSourceEnd);
                    }
                }
                break;

            case 't':
                if (length == 6 && CharOperation.equals(TAG_THROWS, tagName, length)) {
                    this.tagValue = 4;
                    if (!this.inlineTagStarted) {
                        valid = parseThrows();
                    }
                }
                break;

            case 'u':
                if (length == 4 && CharOperation.equals(TAG_USES, tagName, length)) {
                    this.tagValue = 22;
                    if (!this.inlineTagStarted) {
                        valid = parseUsesReference();
                    }
                }
                break;

            case 'v':
                if (length == 5 && CharOperation.equals(TAG_VALUE, tagName, length)) {
                    this.tagValue = 10;
                    if (this.inlineTagStarted) {
                        valid = parseReference();
                    }
                } else if (length == 7 && CharOperation.equals(TAG_VERSION, tagName, length)) {
                    this.tagValue = 17;
                    this.tagWaitingForDescription = this.tagValue;
                } else {
                    createTag();
                }
                break;

            default:
                createTag();
                break;
        }
        this.textStart = this.index;
        if (this.tagValue != 100) {
            if (!this.inlineTagStarted) {
                this.lastBlockTagValue = this.tagValue;
            }
            // see bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=267833
            // Report a problem if a block tag is being used in the context of an inline tag and vice versa.
            if (this.sourceLevel >= 3932160L) {
                int acceptedTag = this.inlineTagStarted ? (short) 1 : (short) 2;
                valid = (JAVADOC_TAG_TYPE_16PLUS[this.tagValue] & acceptedTag) != 0;
            } else {
                valid = (this.inlineTagStarted
                    ? JAVADOC_TAG_TYPE[this.tagValue] == (short) 1
                    : JAVADOC_TAG_TYPE[this.tagValue] == (short) 2);
            }
            if (!valid) {
                if (this.reportProblems) {
                    this.sourceParser.problemReporter().javadocUnexpectedTag(this.tagSourceStart, this.tagSourceEnd);
                }
                this.tagValue = 100;
                this.tagWaitingForDescription = 0;
            }
        }
        return valid;
    }

    /*
     * Parse @param tag declaration and flag missing description if corresponding option is enabled
     */
    @Override
    protected boolean parseParam() throws InvalidInputException {
        boolean valid = super.parseParam();
        this.tagWaitingForDescription = valid && this.reportProblems ? 2 : 0;
        return valid;
    }

    /*
     * Push a param name in ast node stack.
     */
    @Override
    protected boolean pushParamName(boolean isTypeParam) {
        // Create param reference
        ASTNode nameRef;
        if (isTypeParam) {
            JavadocSingleTypeReference ref = new JavadocSingleTypeReference(this.identifierStack[1],
                this.identifierPositionStack[1], this.tagSourceStart, this.tagSourceEnd);
            nameRef = ref;
        } else {
            JavadocSingleNameReference ref
                = new JavadocSingleNameReference(this.identifierStack[0], this.identifierPositionStack[0]);
            nameRef = ref;
        }
        // Push ref on stack
        if (this.astLengthPtr == -1) { // First push
            pushOnAstStack(nameRef, true);
        } else {
            // Verify that no @throws has been declared before
            if (!isTypeParam) { // do not verify for type parameters as @throws may be invalid tag (when declared in
                                // class)
                for (int i = 1; i <= this.astLengthPtr; i += 3) {
                    if (this.astLengthStack[i] != 0) {
                        if (this.reportProblems)
                            this.sourceParser.problemReporter()
                                .javadocUnexpectedTag(this.tagSourceStart, this.tagSourceEnd);
                        // bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=51600
                        // store invalid param references in specific array
                        if (this.invalidParamReferencesPtr == -1l) {
                            this.invalidParamReferencesStack = new JavadocSingleNameReference[10];
                        }
                        int stackLength = this.invalidParamReferencesStack.length;
                        if (++this.invalidParamReferencesPtr >= stackLength) {
                            System.arraycopy(this.invalidParamReferencesStack, 0,
                                this.invalidParamReferencesStack = new JavadocSingleNameReference[stackLength + 10], 0,
                                stackLength);
                        }
                        this.invalidParamReferencesStack[this.invalidParamReferencesPtr] = nameRef;
                        return false;
                    }
                }
            }
            switch (this.astLengthPtr % 3) {
                case 0:
                    // previous push was a @param tag => push another param name
                    pushOnAstStack(nameRef, false);
                    break;

                case 2:
                    // previous push was a @see tag => push new param name
                    pushOnAstStack(nameRef, true);
                    break;

                default:
                    return false;
            }
        }
        return true;
    }

    /*
     * Push a reference statement in ast node stack.
     */
    @Override
    protected boolean pushSeeRef(Object statement) {
        if (this.astLengthPtr == -1) { // First push
            pushOnAstStack(null, true);
            pushOnAstStack(null, true);
            pushOnAstStack(statement, true);
        } else {
            switch (this.astLengthPtr % 3) {
                case 0:
                    // previous push was a @param tag => push empty @throws tag and new @see tag
                    pushOnAstStack(null, true);
                    pushOnAstStack(statement, true);
                    break;

                case 1:
                    // previous push was a @throws tag => push new @see tag
                    pushOnAstStack(statement, true);
                    break;

                case 2:
                    // previous push was a @see tag => push another @see tag
                    pushOnAstStack(statement, false);
                    break;

                default:
                    return false;
            }
        }
        return true;
    }

    @Override
    protected void pushText(int start, int end) {
        // The tag gets its description => clear the flag
        this.tagWaitingForDescription = 0;
    }

    @Override
    protected void pushSnippetText(char[] text, int start, int end, boolean addNewLine, Object snippetTag) {
        // The tag gets its description => clear the flag
        this.tagWaitingForDescription = 30;
    }

    @Override
    protected void closeJavaDocRegion(String name, Object snippetTag, int end) {
        this.regionNames.remove(name);
        // do nothing
    }

    /*
     * Push a throws type ref in ast node stack.
     */
    @Override
    protected boolean pushThrowName(Object typeRef) {
        if (this.astLengthPtr == -1) { // First push
            pushOnAstStack(null, true);
            pushOnAstStack(typeRef, true);
        } else {
            switch (this.astLengthPtr % 3) {
                case 0:
                    // previous push was a @param tag => push new @throws tag
                    pushOnAstStack(typeRef, true);
                    break;

                case 1:
                    // previous push was a @throws tag => push another @throws tag
                    pushOnAstStack(typeRef, false);
                    break;

                case 2:
                    // previous push was a @see tag => push empty @param and new @throws tags
                    pushOnAstStack(null, true);
                    pushOnAstStack(typeRef, true);
                    break;

                default:
                    return false;
            }
        }
        return true;
    }

    @Override
    protected void refreshInlineTagPosition(int previousPosition) {

        // Signal tag missing description if necessary
        if (this.tagWaitingForDescription != 0) {
            this.sourceParser.problemReporter()
                .javadocMissingTagDescription(TAG_NAMES[this.tagWaitingForDescription], this.tagSourceStart,
                    this.tagSourceEnd, this.sourceParser.modifiers);
            this.tagWaitingForDescription = 0;
        }
    }

    /*
     * Refresh return statement
     */
    @Override
    protected void refreshReturnStatement() {
        ((JavadocReturnStatement) this.returnStatement).bits &= ~262144;
    }

    @Override
    public String toString() {
        StringBuilder buffer = new StringBuilder();
        buffer.append("check javadoc: ").append(this.checkDocComment).append("\n");	//$NON-NLS-1$ //$NON-NLS-2$
        buffer.append("javadoc: ").append(this.docComment).append("\n");	//$NON-NLS-1$ //$NON-NLS-2$
        buffer.append(super.toString());
        return buffer.toString();
    }

    /*
     * Fill associated comment fields with ast nodes information stored in stack.
     */
    @Override
    protected void updateDocComment() {

        // Complain when tag is missing a description
        // Note that if the parse of an inline tag has already started, consider it
        // as the expected description, hence do not report any warning
        switch (this.tagWaitingForDescription) {
            case 2:
            case 4:
                if (!this.inlineTagStarted) {
                    int start = (int) (this.identifierPositionStack[0] >>> 32);
                    int end = (int) this.identifierPositionStack[this.identifierPtr];
                    this.sourceParser.problemReporter()
                        .javadocMissingTagDescriptionAfterReference(start, end, this.sourceParser.modifiers);
                }
                break;

            case 0:
                break;

            default:
                if (!this.inlineTagStarted) {
                    this.sourceParser.problemReporter()
                        .javadocMissingTagDescription(TAG_NAMES[this.tagWaitingForDescription], this.tagSourceStart,
                            this.tagSourceEnd, this.sourceParser.modifiers);
                }
                break;
        }
        this.tagWaitingForDescription = 0;

        // Set positions
        if (this.inheritedPositions != null && this.inheritedPositionsPtr != this.inheritedPositions.length) {
            // Compact array by shrinking.
            System.arraycopy(this.inheritedPositions, 0, this.inheritedPositions = new long[this.inheritedPositionsPtr],
                0, this.inheritedPositionsPtr);
        }

        // Set return node if present
        if (this.returnStatement != null) {
            this.docComment.returnStatement = (JavadocReturnStatement) this.returnStatement;
        }

        // Copy array of invalid syntax param tags
        if (this.invalidParamReferencesPtr >= 0) {
            this.docComment.invalidParameters = new JavadocSingleNameReference[this.invalidParamReferencesPtr + 1];
            System.arraycopy(this.invalidParamReferencesStack, 0, this.docComment.invalidParameters, 0,
                this.invalidParamReferencesPtr + 1);
        }

        this.docComment.usesReferences = this.usesReferencesPtr >= 0
            ? new IJavadocTypeReference[this.usesReferencesPtr + 1]
            : NO_QUALIFIED_TYPE_REFERENCE;
        for (int i = 0; i <= this.usesReferencesPtr; ++i) {
            TypeReference ref = this.usesReferencesStack[i];
            this.docComment.usesReferences[i] = (IJavadocTypeReference) ref;
        }

        this.docComment.providesReferences = this.providesReferencesPtr >= 0
            ? new IJavadocTypeReference[this.providesReferencesPtr + 1]
            : NO_QUALIFIED_TYPE_REFERENCE;
        for (int i = 0; i <= this.providesReferencesPtr; ++i) {
            TypeReference ref = this.providesReferencesStack[i];
            this.docComment.providesReferences[i] = (IJavadocTypeReference) ref;
        }

        // If no nodes stored return
        if (this.astLengthPtr == -1) {
            return;
        }

        // Initialize arrays
        int[] sizes = new int[3];
        for (int i = 0; i <= this.astLengthPtr; i++) {
            sizes[i % 3] += this.astLengthStack[i];
        }
        this.docComment.seeReferences = sizes[2] > 0 ? new Expression[sizes[2]] : NO_EXPRESSION;
        this.docComment.exceptionReferences = sizes[1] > 0 ? new TypeReference[sizes[1]] : NO_TYPE_REFERENCE;
        int paramRefPtr = sizes[0];
        this.docComment.paramReferences
            = paramRefPtr > 0 ? new JavadocSingleNameReference[paramRefPtr] : NO_SINGLE_NAME_REFERENCE;
        int paramTypeParamPtr = sizes[0];
        this.docComment.paramTypeParameters
            = paramTypeParamPtr > 0 ? new JavadocSingleTypeReference[paramTypeParamPtr] : NO_SINGLE_TYPE_REFERENCE;

        // Store nodes in arrays
        while (this.astLengthPtr >= 0) {
            int ptr = this.astLengthPtr % 3;
            // Starting with the stack top, so get references (Expression) coming from @see declarations
            switch (ptr) {
                case 2:
                    int size = this.astLengthStack[this.astLengthPtr--];
                    for (int i = 0; i < size; i++) {
                        this.docComment.seeReferences[--sizes[ptr]] = (Expression) this.astStack[this.astPtr--];
                    }
                    break;

                // Then continuing with class names (TypeReference) coming from @throw/@exception declarations
                case 1:
                    size = this.astLengthStack[this.astLengthPtr--];
                    for (int i = 0; i < size; i++) {
                        this.docComment.exceptionReferences[--sizes[ptr]]
                            = (TypeReference) this.astStack[this.astPtr--];
                    }
                    break;

                // Finally, finishing with parameters names (Argument) coming from @param declaration
                case 0:
                    size = this.astLengthStack[this.astLengthPtr--];
                    for (int i = 0; i < size; i++) {
                        Expression reference = (Expression) this.astStack[this.astPtr--];
                        if (reference instanceof JavadocSingleNameReference)
                            this.docComment.paramReferences[--paramRefPtr] = (JavadocSingleNameReference) reference;
                        else if (reference instanceof JavadocSingleTypeReference)
                            this.docComment.paramTypeParameters[--paramTypeParamPtr]
                                = (JavadocSingleTypeReference) reference;
                    }
                    break;
            }
        }

        // Resize param tag references arrays
        if (paramRefPtr == 0) { // there's no type parameters references
            this.docComment.paramTypeParameters = null;
        } else if (paramTypeParamPtr == 0) { // there's no names references
            this.docComment.paramReferences = null;
        } else { // there both of references => resize arrays
            int size = sizes[0];
            System.arraycopy(this.docComment.paramReferences, paramRefPtr,
                this.docComment.paramReferences = new JavadocSingleNameReference[size - paramRefPtr], 0,
                size - paramRefPtr);
            System.arraycopy(this.docComment.paramTypeParameters, paramTypeParamPtr,
                this.docComment.paramTypeParameters = new JavadocSingleTypeReference[size - paramTypeParamPtr], 0,
                size - paramTypeParamPtr);
        }
    }

    /*
     * Parse @uses tag declaration
     */
    protected boolean parseUsesReference() {
        int start = this.scanner.currentPosition;
        try {
            Object typeRef = parseQualifiedName(true);
            if (this.abort)
                return false; // May be aborted by specialized parser
            if (typeRef == null) {
                if (this.reportProblems)
                    this.sourceParser.problemReporter()
                        .javadocMissingUsesClassName(this.tagSourceStart, this.tagSourceEnd,
                            this.sourceParser.modifiers);
            } else {
                return pushUsesReference(typeRef);
            }
        } catch (InvalidInputException ex) {
            if (this.reportProblems)
                this.sourceParser.problemReporter().javadocInvalidUsesClass(start, getTokenEndPosition());
        }
        return false;
    }

    protected boolean pushUsesReference(Object typeRef) {
        if (this.usesReferencesPtr == -1l) {
            this.usesReferencesStack = new TypeReference[10];
        }
        int stackLength = this.usesReferencesStack.length;
        if (++this.usesReferencesPtr >= stackLength) {
            System.arraycopy(this.usesReferencesStack, 0,
                this.usesReferencesStack = new TypeReference[stackLength + 10], 0, stackLength);
        }
        this.usesReferencesStack[this.usesReferencesPtr] = (TypeReference) typeRef;
        return true;
    }

    /*
     * Parse @uses tag declaration
     */
    protected boolean parseProvidesReference() {
        int start = this.scanner.currentPosition;
        try {
            Object typeRef = parseQualifiedName(true);
            if (this.abort)
                return false; // May be aborted by specialized parser
            if (typeRef == null) {
                if (this.reportProblems)
                    this.sourceParser.problemReporter()
                        .javadocMissingProvidesClassName(this.tagSourceStart, this.tagSourceEnd,
                            this.sourceParser.modifiers);
            } else {
                return pushProvidesReference(typeRef);
            }
        } catch (InvalidInputException ex) {
            if (this.reportProblems)
                this.sourceParser.problemReporter().javadocInvalidProvidesClass(start, getTokenEndPosition());
        }
        return false;
    }

    protected boolean pushProvidesReference(Object typeRef) {
        if (this.providesReferencesPtr == -1l) {
            this.providesReferencesStack = new TypeReference[10];
        }
        int stackLength = this.providesReferencesStack.length;
        if (++this.providesReferencesPtr >= stackLength) {
            System.arraycopy(this.providesReferencesStack, 0,
                this.providesReferencesStack = new TypeReference[stackLength + 10], 0, stackLength);
        }
        this.providesReferencesStack[this.providesReferencesPtr] = (TypeReference) typeRef;
        return true;
    }

    @Override
    /**
     * * call at the end of snippet, so clear regionNames
     */
    protected boolean areRegionsClosed() {
        int size = this.regionNames.size();
        this.regionNames.clear();
        return size == 0;
    }

    @Override
    protected void setRegionPosition(int currentPosition) {
        this.regionPosition = currentPosition;
    }
}
