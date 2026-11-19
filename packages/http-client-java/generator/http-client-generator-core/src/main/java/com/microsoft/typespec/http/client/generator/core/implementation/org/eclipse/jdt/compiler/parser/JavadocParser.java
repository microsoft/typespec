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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.*;
import java.util.List;

/**
 * Parser specialized for decoding javadoc comments
 */
public class JavadocParser extends AbstractCommentParser {

    // Public fields
    public Javadoc docComment;

    public JavadocParser(Parser sourceParser) {
        super(sourceParser);
        this.kind = 1 | 512;
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

        // Init javadoc
        this.docComment = new Javadoc(this.javadocStart, this.javadocEnd);

        // If there's no tag in javadoc, return without parsing it
        if (this.firstTagPosition == 0) {
            return false;
        }

        // Parse
        try {
            this.source = this.sourceParser.scanner.source;
            this.scanner.setSource(this.source); // updating source in scanner
            // Initialization
            this.scanner.lineEnds = this.sourceParser.scanner.lineEnds;
            this.scanner.linePtr = this.sourceParser.scanner.linePtr;
            this.lineEnds = this.scanner.lineEnds;
            commentParse();

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
                if (typeRef instanceof JavadocSingleTypeReference singleRef) {
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

            if (!(receiver instanceof JavadocModuleReference)) {
                typeRef = (TypeReference) receiver;
            }
            if (typeRef == null) {
                char[] name = this.sourceParser.compilationUnit.getMainTypeName();
                typeRef = new JavadocImplicitTypeReference(name, this.memberStart);
            }
            // Create field
            JavadocFieldReference field
                = new JavadocFieldReference(this.identifierStack[0], this.identifierPositionStack[0]);
            field.receiver = typeRef;

            return field;
        } catch (ClassCastException ex) {
            throw Scanner.invalidInput();
        }
    }

    @Override
    protected Object createMethodReference(Object receiver, List<Object> arguments) throws InvalidInputException {
        try {
            // Get receiver type
            TypeReference typeRef = null;
            if (!(receiver instanceof JavadocModuleReference)) {
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
                        for (int i = 0; i < length - 1 && valid; i++) {
                            valid = CharOperation.equals(this.identifierStack[i], tokens[i]);
                        }
                        if (!valid) {

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
    }

    @Override
    protected Object createTypeReference(int primitiveToken) {
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

    /*
     * Get current parsed type declaration.
     */
    protected TypeDeclaration getParsedTypeDeclaration() {
        int ptr = this.sourceParser.astPtr;
        while (ptr >= 0) {
            Object node = this.sourceParser.astStack[ptr];
            if (node instanceof TypeDeclaration typeDecl) {
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
        return super.parseThrows();
    }

    /*
     * Parse @return tag declaration
     */
    protected boolean parseReturn() {
        if (this.returnStatement == null) {
            this.returnStatement = createReturnStatement();
            return true;
        }

        return false;
    }

    @Override
    protected boolean parseTag(int previousPosition) throws InvalidInputException {

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
                // the first character is not valid, hence the tag is invalid

                if (this.textStart == -1)
                    this.textStart = currentPosition;
                this.scanner.currentCharacter = firstChar;
                return false;

            default:
                if (ScannerHelper.isWhitespace(firstChar)) {
                    // the first character is not valid, hence the tag is invalid

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

            if (this.textStart == -1)
                this.textStart = this.index;
            return false;
        }

        // Decide which parse to perform depending on tag name
        this.tagValue = 100;
        boolean valid = false;
        switch (firstChar) {
            case 'a':
                if (length == 6 && CharOperation.equals(TAG_AUTHOR, tagName, length)) {
                    this.tagValue = 12;
                } else if (length == 7 && CharOperation.equals(TAG_API_NOTE, tagName, length)) {
                    this.tagValue = 27;
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
                }
                break;

            case 'd':
                if (length == 10 && CharOperation.equals(TAG_DEPRECATED, tagName, length)) {
                    this.deprecated = true;
                    valid = true;
                    this.tagValue = 1;
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
                            // parse a 'valid' inheritDoc tag
                            break;

                        default:

                    }
                    this.tagValue = 9;
                } else if (length == 8 && CharOperation.equals(TAG_IMPL_SPEC, tagName, length)) {
                    this.tagValue = 28;
                } else if (length == 8 && CharOperation.equals(TAG_IMPL_NOTE, tagName, length)) {
                    this.tagValue = 29;
                }
                break;

            case 'l':
                if (length == 4 && CharOperation.equals(TAG_LINK, tagName, length)) {
                    this.tagValue = 7;
                    if (this.inlineTagStarted) {
                        valid = parseReference();
                    }
                } else if (length == 9 && CharOperation.equals(TAG_LINKPLAIN, tagName, length)) {
                    this.tagValue = 8;
                    if (this.inlineTagStarted) {
                        valid = parseReference();
                    }
                } else if (length == 7 && this.inlineTagStarted && CharOperation.equals(TAG_LITERAL, tagName, length)) {
                    this.tagValue = 19;
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
                    if (!this.inlineTagStarted) {
                        valid = parseReturn();
                    }
                }
                break;

            case 's':
                if (length == 3 && CharOperation.equals(TAG_SEE, tagName, length)) {
                    this.tagValue = 6;
                    if (!this.inlineTagStarted) {
                        valid = parseReference();
                    }
                } else if (length == 6 && CharOperation.equals(TAG_SERIAL, tagName, length)) {
                    this.tagValue = 13;
                } else if (length == 10 && CharOperation.equals(TAG_SERIAL_DATA, tagName, length)) {
                    this.tagValue = 14;
                } else if (length == 11 && CharOperation.equals(TAG_SERIAL_FIELD, tagName, length)) {
                    this.tagValue = 15;
                } else if (length == 5 && CharOperation.equals(TAG_SINCE, tagName, length)) {
                    this.tagValue = 16;
                } else if (length == 14 && CharOperation.equals(TAG_SYSTEM_PROPERTY, tagName, length)) {
                    this.tagValue = 21;
                } else if (length == 7 && CharOperation.equals(TAG_SUMMARY, tagName, length)) {
                    this.tagValue = 26;
                } else if (length == 7 && CharOperation.equals(TAG_SNIPPET, tagName, length)) {
                    this.tagValue = 30;
                    if (this.inlineTagStarted) {
                        rejectSnippet();
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
            valid = (this.inlineTagStarted
                ? JAVADOC_TAG_TYPE[this.tagValue] == (short) 1
                : JAVADOC_TAG_TYPE[this.tagValue] == (short) 2);
            if (!valid) {

                this.tagValue = 100;
            }
        }
        return valid;
    }

    /*
     * Parse @param tag declaration and flag missing description if corresponding option is enabled
     */
    @Override
    protected boolean parseParam() throws InvalidInputException {
        return super.parseParam();
    }

    /*
     * Push a param name in ast node stack.
     */
    @Override
    protected boolean pushParamName(boolean isTypeParam) {
        // Create param reference
        ASTNode nameRef;
        if (isTypeParam) {
            nameRef = new JavadocSingleTypeReference(this.identifierStack[1], this.identifierPositionStack[1]);
        } else {
            nameRef = new JavadocSingleNameReference(this.identifierStack[0], this.identifierPositionStack[0]);
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

    }

    /*
     * Fill associated comment fields with ast nodes information stored in stack.
     */
    @Override
    protected void updateDocComment() {
        // The compiler AST does not keep Javadoc references.
    }

    /*
     * Parse @uses tag declaration
     */
    protected boolean parseUsesReference() {
        try {
            Object typeRef = parseQualifiedName(true);
            if (typeRef != null) {
                return true;
            }
        } catch (InvalidInputException ignored) {
        }
        return false;
    }

    /*
     * Parse @uses tag declaration
     */
    protected boolean parseProvidesReference() {
        try {
            Object typeRef = parseQualifiedName(true);
            if (typeRef != null) {
                return true;
            }
        } catch (InvalidInputException ignored) {
        }
        return false;
    }

}
