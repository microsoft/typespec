// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2026 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.AbstractCommentParser;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.ScannerHelper;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Internal parser used for decoding doc comments.
 *
 * @since 3.0
 */
@SuppressWarnings({ "rawtypes", "unchecked" })
class DocCommentParser extends AbstractCommentParser {

    private Javadoc docComment;
    private final AST ast;

    DocCommentParser(AST ast, Scanner scanner, boolean check) {
        super(null);
        this.ast = ast;
        this.scanner = scanner;
        this.sourceLevel = 3407872L;
        this.checkDocComment = check;
        this.kind = 2 | 256;
    }

    /*
     * (non-Javadoc) Returns true if tag @deprecated is present in annotation.
     *
     * If annotation checking is enabled, will also construct an Annotation node, which will be stored into
     * Parser.annotation slot for being consumed later on.
     */
    public Javadoc parse(int[] positions) {
        return parse(positions[0], positions[1] - positions[0]);
    }

    public Javadoc parse(int start, int length) {

        // Init
        this.source = this.scanner.source;
        this.lineEnds = this.scanner.lineEnds;
        this.docComment = new Javadoc(this.ast);

        // Parse
        if (this.checkDocComment) {
            this.javadocStart = start;
            this.javadocEnd = start + length - 1;
            this.firstTagPosition = this.javadocStart;
            commentParse();
        }
        this.docComment.setSourceRange(start, length);
        if (this.ast.apiLevel >= 23) {
            this.docComment.setMarkdown(this.markdown);
        }
        if (this.ast.apiLevel == 2) {
            setComment(start, length);  // backward compatibility
        }
        return this.docComment;
    }

    /**
     * Sets the comment starting at the given position and with the given length. <p> Note the only purpose of this
     * method is to hide deprecated warnings.
     *
     * @deprecated mark deprecated to hide deprecated usage
     */
    private void setComment(int start, int length) {
        this.docComment.setComment(new String(this.source, start, length));
    }

    @Override
    public String toString() {
        return "javadoc: " + this.docComment + "\n" + super.toString();
    }

    @Override
    protected Object createArgumentReference(char[] name, int dim, boolean isVarargs, Object typeRef,
        long[] dimPositions, long argNamePos) throws InvalidInputException {
        try {
            MethodRefParameter argument = this.ast.newMethodRefParameter();
            ASTNode node = (ASTNode) typeRef;
            int argStart = node.getStartPosition();
            int argEnd = node.getStartPosition() + node.getLength() - 1;
            if (dim > 0)
                argEnd = (int) dimPositions[dim - 1];
            if (argNamePos >= 0)
                argEnd = (int) argNamePos;
            if (name.length != 0) {
                final SimpleName argName = new SimpleName(this.ast);
                argName.internalSetIdentifier(new String(name));
                argument.setName(argName);
                int argNameStart = (int) (argNamePos >>> 32);
                argName.setSourceRange(argNameStart, argEnd - argNameStart + 1);
            }
            Type argType;
            if (node.getNodeType() == 39) {
                argType = (PrimitiveType) node;
            } else {
                Name argTypeName = (Name) node;
                argType = this.ast.newSimpleType(argTypeName);
                argType.setSourceRange(argStart, node.getLength());
            }
            if (dim > 0 && !isVarargs) {
                if (this.ast.apiLevel <= 4) {
                    for (int i = 0; i < dim; i++) {
                        argType = this.ast.newArrayType(argType);
                        argType.setSourceRange(argStart, ((int) dimPositions[i]) - argStart + 1);
                    }
                } else {
                    ArrayType argArrayType = this.ast.newArrayType(argType, 0);
                    argType = argArrayType;
                    argType.setSourceRange(argStart, ((int) dimPositions[dim - 1]) - argStart + 1);
                    for (int i = 0; i < dim; i++) {
                        Dimension dimension = this.ast.newDimension();
                        int dimStart = (int) (dimPositions[i] >>> 32);
                        int dimEnd = (int) dimPositions[i];
                        dimension.setSourceRange(dimStart, dimEnd - dimStart + 1);
                        argArrayType.dimensions().add(dimension);
                    }
                }
            }
            argument.setType(argType);
            if (this.ast.apiLevel > 8) {
                argument.setVarargs(isVarargs);
            }
            argument.setSourceRange(argStart, argEnd - argStart + 1);
            return argument;
        } catch (ClassCastException ex) {
            throw Scanner.invalidInput();
        }
    }

    @Override
    protected Object createFieldReference(Object receiver) throws InvalidInputException {
        try {
            MemberRef fieldRef = this.ast.newMemberRef();
            SimpleName fieldName = new SimpleName(this.ast);
            fieldName.internalSetIdentifier(new String(this.identifierStack[0]));
            fieldRef.setName(fieldName);
            int start = (int) (this.identifierPositionStack[0] >>> 32);
            int end = (int) this.identifierPositionStack[0];
            fieldName.setSourceRange(start, end - start + 1);
            if (receiver == null) {
                start = this.memberStart;
                fieldRef.setSourceRange(start, end - start + 1);
            } else {
                Name typeRef = (Name) receiver;
                fieldRef.setQualifier(typeRef);
                start = typeRef.getStartPosition();
                end = fieldName.getStartPosition() + fieldName.getLength() - 1;
                fieldRef.setSourceRange(start, end - start + 1);
            }
            return fieldRef;
        } catch (ClassCastException ex) {
            throw Scanner.invalidInput();
        }
    }

    @Override
    protected Object createMethodReference(Object receiver, List arguments) throws InvalidInputException {
        try {
            // Create method ref
            MethodRef methodRef = this.ast.newMethodRef();
            SimpleName methodName = new SimpleName(this.ast);
            int length = this.identifierLengthStack[0] - 1; // may be > 0 for member class constructor reference
            methodName.internalSetIdentifier(new String(this.identifierStack[length]));
            methodRef.setName(methodName);
            int start = (int) (this.identifierPositionStack[length] >>> 32);
            int end = (int) this.identifierPositionStack[length];
            methodName.setSourceRange(start, end - start + 1);
            // Set qualifier
            if (receiver == null) {
                start = this.memberStart;
                methodRef.setSourceRange(start, end - start + 1);
            } else {
                Name typeRef = (Name) receiver;
                methodRef.setQualifier(typeRef);
                start = typeRef.getStartPosition();
            }
            // Add arguments
            if (arguments != null) {
                for (Object argument : arguments) {
                    MethodRefParameter param = (MethodRefParameter) argument;
                    methodRef.parameters().add(param);
                }
            }
            methodRef.setSourceRange(start, this.scanner.getCurrentTokenEndPosition() - start + 1);
            return methodRef;
        } catch (ClassCastException ex) {
            throw Scanner.invalidInput();
        }
    }

    @Override
    protected void createTag() {
        int position = this.scanner.currentPosition;
        this.scanner.resetTo(this.tagSourceStart, this.tagSourceEnd);
        StringBuilder tagName = new StringBuilder();
        int start = this.tagSourceStart;
        this.scanner.getNextChar();
        while (this.scanner.currentPosition <= (this.tagSourceEnd + 1)) {
            tagName.append(this.scanner.currentCharacter);
            this.scanner.getNextChar();
        }
        if ("@snippet".contentEquals(tagName)) {
            this.tagSourceEnd = this.index;
            // need to use createSnippetTag to create @snippet
            return;
        }
        TagElement tagElement = this.ast.newTagElement();
        tagElement.setTagName(tagName.toString());
        if (this.inlineTagStarted) {
            start = this.inlineTagStart;
            TagElement previousTag;
            if (this.astPtr == -1) {
                previousTag = this.ast.newTagElement();
                previousTag.setSourceRange(start, this.tagSourceEnd - start + 1);
                pushOnAstStack(previousTag, true);
            } else {
                previousTag = (TagElement) this.astStack[this.astPtr];
            }
            int previousStart = previousTag.getStartPosition();
            previousTag.fragments().add(tagElement);
            previousTag.setSourceRange(previousStart, this.tagSourceEnd - previousStart + 1);
        } else {
            pushOnAstStack(tagElement, true);
        }
        tagElement.setSourceRange(start, this.tagSourceEnd - start + 1);
        this.scanner.resetTo(position, this.javadocEnd);
        this.markdownHelper.resetLineStart();
    }

    @Override
    protected Object createSnippetTag() {
        TagElement tagElement = this.ast.newTagElement();
        int position = this.scanner.currentPosition;
        this.scanner.resetTo(this.tagSourceStart, this.tagSourceEnd);
        StringBuilder tagName = new StringBuilder();
        int start = this.tagSourceStart;
        this.scanner.getNextChar();
        while (this.scanner.currentPosition <= (this.tagSourceEnd + 1)) {
            tagName.append(this.scanner.currentCharacter);
            this.scanner.getNextChar();
        }
        tagElement.setTagName(tagName.toString());
        if (this.inlineTagStarted) {
            start = this.inlineTagStart;
            TagElement previousTag;
            if (this.astPtr == -1) {
                previousTag = this.ast.newTagElement();
                previousTag.setSourceRange(start, this.tagSourceEnd - start + 1);
                pushOnAstStack(previousTag, true);
            } else {
                previousTag = (TagElement) this.astStack[this.astPtr];
            }
            int previousStart = previousTag.getStartPosition();
            previousTag.fragments().add(tagElement);
            previousTag.setSourceRange(previousStart, this.tagSourceEnd - previousStart + 1);
        } else {
            pushOnAstStack(tagElement, true);
        }
        tagElement.setSourceRange(start, this.tagSourceEnd - start + 1);
        this.scanner.resetTo(position, this.javadocEnd);
        return tagElement;
    }

    @Override
    protected void setSnippetIsValid(Object tag, boolean value) {
        if (tag instanceof TagElement) {
            ((TagElement) tag).setProperty("IsSnippetValid", value);
        }
    }

    @Override
    protected void setSnippetError(Object tag, String value) {
        if (tag instanceof TagElement) {
            ((TagElement) tag).setProperty("SnippetError", value);
        }
    }

    @Override
    protected void setSnippetID(Object tag, String value) {
        if (tag instanceof TagElement) {
            ((TagElement) tag).setProperty("SnippetID", value);
        }
    }

    @Override
    protected Object createSnippetRegion(String name, List<Object> tags, Object snippetTag, boolean isDummyRegion,
        boolean considerPrevTag) {
        if (!isDummyRegion) {
            return createSnippetOriginalRegion(name, tags);
        }
        List<TagElement> tagsToBeProcessed = new ArrayList<>();
        Object toBeReturned = null;
        if (tags != null && !tags.isEmpty()) {
            int start = -1;
            int end = -1;
            for (Object tag : tags) {
                if (tag instanceof TagElement tagElem) {
                    tagsToBeProcessed.add(tagElem);
                    int tagStart = tagElem.getStartPosition();
                    int tagEnd = tagStart + tagElem.getLength();
                    if (start == -1 || start > tagStart) {
                        start = tagStart;
                    }
                    if (end == -1 || end < tagEnd) {
                        end = tagEnd;
                    }
                } else if (tag instanceof JavaDocRegion reg && snippetTag instanceof TagElement snippet) {
                    if (!reg.isDummyRegion()) {
                        snippet.fragments().add(reg);
                    }
                    toBeReturned = reg;
                }
            }
            if (!tagsToBeProcessed.isEmpty()) {
                boolean process = true;
                if (considerPrevTag && snippetTag instanceof TagElement snippetTagElem) {
                    Object prevTag = snippetTagElem.fragments().get(snippetTagElem.fragments().size() - 1);
                    if (prevTag instanceof TagElement) {
                        tagsToBeProcessed.add(0, (TagElement) prevTag);
                        snippetTagElem.fragments().remove(prevTag);
                    } else if (prevTag instanceof JavaDocRegion region) {
                        region.tags().addAll(tagsToBeProcessed);
                        toBeReturned = snippetTag;
                        process = false;
                    }
                }
                if (process) {
                    if (tagsToBeProcessed.size() == 1) {
                        return tagsToBeProcessed.get(0);
                    } else {
                        JavaDocRegion region = this.ast.newJavaDocRegion();
                        region.tags().addAll(tagsToBeProcessed);
                        region.setSourceRange(start, end);
                        toBeReturned = region;
                    }
                }
            } else {
                toBeReturned = snippetTag;
            }
        }
        return toBeReturned;
    }

    private Object createSnippetOriginalRegion(String name, List<Object> tags) {
        JavaDocRegion region = this.ast.newJavaDocRegion();
        if (tags != null && !tags.isEmpty()) {
            int start = -1;
            int end = -1;
            for (Object tag : tags) {
                if (tag instanceof TagElement tagElem) {
                    region.tags().add(tagElem);
                    int tagStart = tagElem.getStartPosition();
                    int tagEnd = tagStart + tagElem.getLength();
                    if (start == -1 || start > tagStart) {
                        start = tagStart;
                    }
                    if (end == -1 || end < tagEnd) {
                        end = tagEnd;
                    }
                }
            }
            region.setSourceRange(start, end - start);
            region.setDummyRegion();
        }
        if (name != null) {
            region.setTagName(name);
        }
        return region;
    }

    @Override
    protected Object createSnippetInnerTag(String tagName, int start, int end) {
        if (tagName != null) {
            TagElement tagElement = this.ast.newTagElement();
            tagElement.setTagName(tagName.toString());
            if (this.astPtr == -1) {
                return null;
            }
            tagElement.setSourceRange(start, end - start);
            return tagElement;
        }
        return null;
    }

    @Override
    protected void closeJavaDocRegion(String name, Object snippetTag, int end) {
        if (snippetTag instanceof TagElement snippet) {
            List<JavaDocRegion> regions = snippet.tagRegions();
            JavaDocRegion regionToClose = null;
            if (name != null) {
                for (JavaDocRegion region : regions) {
                    if (name.equals(region.getTagName())) {
                        if (!this.isRegionToBeEnded(region) && !this.hasRegionEnded(region)) {
                            regionToClose = region;
                            break;
                        }
                    }
                }
            } else {
                for (int i = regions.size() - 1; i > -1; i--) {
                    JavaDocRegion region = regions.get(i);
                    if (!this.isRegionToBeEnded(region) && !this.hasRegionEnded(region)) {
                        regionToClose = region;
                        break;
                    }
                }
            }
            if (regionToClose != null) {
                setRegionToBeEnded(regionToClose, true);
                int start = regionToClose.getStartPosition();
                int curEnd = start + regionToClose.getLength();
                if (end > curEnd) {
                    regionToClose.setSourceRange(start, end - start);
                }
            }
        }
    }

    @Override
    protected void addTagProperties(Object tag, Map<String, Object> map, int tagCount) {
        if (tag instanceof TagElement tagElement) {
            map.forEach((k, v) -> {
                TagProperty tagProperty = this.ast.newTagProperty();
                tagProperty.setName(k);
                if (v instanceof String) {
                    tagProperty.setStringValue((String) v);
                } else if (v instanceof ASTNode) {
                    tagProperty.setNodeValue((ASTNode) v);
                }
                tagElement.tagProperties().add(tagProperty);
            });
            tagElement.setProperty("SnippetInlineTagCount", tagCount);
        }
    }

    @Override
    protected void addSnippetInnerTag(Object obj, Object snippetTag) {
        boolean isNotDummyRegion = false;
        if (obj instanceof JavaDocRegion region) {
            if (snippetTag instanceof TagElement snippetTagElem) {
                if (!region.isDummyRegion()) {
                    snippetTagElem.fragments().add(region);
                    isNotDummyRegion = true;
                } else {
                    for (Object tag : region.tags()) {
                        if (tag instanceof JavaDocRegion reg) {
                            if (!reg.isDummyRegion()) {
                                region.tags().remove(reg);
                                snippetTagElem.fragments().add(reg);
                            }
                        }
                    }
                }
            }
        }
        if (obj instanceof AbstractTagElement tagElement && !isNotDummyRegion) {
            AbstractTagElement previousTag;
            if (this.astPtr == -1) {
                return;
            } else {
                previousTag = (AbstractTagElement) this.astStack[this.astPtr];
                List fragments = previousTag.fragments();
                if (this.inlineTagStarted) {
                    int size = fragments.size();
                    if (size == 0) {
                        // do nothing
                    } else {
                        // If last fragment is a tag, then use it as previous tag
                        ASTNode lastFragment = (ASTNode) fragments.get(size - 1);
                        if (lastFragment instanceof AbstractTagElement) {
                            previousTag = (AbstractTagElement) lastFragment;
                        }
                    }
                }
            }
            previousTag.fragments().add(tagElement);
        }
    }

    @Override
    protected Object createTypeReference(TerminalToken primitiveToken, boolean canBeModule) {
        return createTypeReference(primitiveToken);
    }

    protected Object createTypeReference(TerminalToken primitiveToken) {
        int size = this.identifierLengthStack[this.identifierLengthPtr];
        String[] identifiers = new String[size];
        int pos = this.identifierPtr - size + 1;
        for (int i = 0; i < size; i++) {
            identifiers[i] = new String(this.identifierStack[pos + i]);
        }
        ASTNode typeRef;
        if (primitiveToken == TerminalToken.TokenNameInvalid) {
            typeRef = this.ast.internalNewName(identifiers);
        } else {
            switch (primitiveToken) {
                case TokenNamevoid:
                    typeRef = this.ast.newPrimitiveType(PrimitiveType.VOID);
                    break;

                case TokenNameboolean:
                    typeRef = this.ast.newPrimitiveType(PrimitiveType.BOOLEAN);
                    break;

                case TokenNamebyte:
                    typeRef = this.ast.newPrimitiveType(PrimitiveType.BYTE);
                    break;

                case TokenNamechar:
                    typeRef = this.ast.newPrimitiveType(PrimitiveType.CHAR);
                    break;

                case TokenNamedouble:
                    typeRef = this.ast.newPrimitiveType(PrimitiveType.DOUBLE);
                    break;

                case TokenNamefloat:
                    typeRef = this.ast.newPrimitiveType(PrimitiveType.FLOAT);
                    break;

                case TokenNameint:
                    typeRef = this.ast.newPrimitiveType(PrimitiveType.INT);
                    break;

                case TokenNamelong:
                    typeRef = this.ast.newPrimitiveType(PrimitiveType.LONG);
                    break;

                case TokenNameshort:
                    typeRef = this.ast.newPrimitiveType(PrimitiveType.SHORT);
                    break;

                default:
                    // should not happen
                    return null;
            }
        }
        // Update ref for whole name
        int start = (int) (this.identifierPositionStack[pos] >>> 32);
//		int end = (int) this.identifierPositionStack[this.identifierPtr];
//		typeRef.setSourceRange(start, end-start+1);
        // Update references of each simple name
        if (size > 1) {
            Name name = (Name) typeRef;
            int nameIndex = size;
            for (int i = this.identifierPtr; i > pos; i--, nameIndex--) {
                int s = (int) (this.identifierPositionStack[i] >>> 32);
                int e = (int) this.identifierPositionStack[i];
                name.index = nameIndex;
                SimpleName simpleName = ((QualifiedName) name).getName();
                simpleName.index = nameIndex;
                simpleName.setSourceRange(s, e - s + 1);
                name.setSourceRange(start, e - start + 1);
                name = ((QualifiedName) name).getQualifier();
            }
            int end = (int) this.identifierPositionStack[pos];
            name.setSourceRange(start, end - start + 1);
            name.index = nameIndex;
        } else {
            int end = (int) this.identifierPositionStack[pos];
            typeRef.setSourceRange(start, end - start + 1);
        }
        return typeRef;
    }

    private ModuleQualifiedName createModuleReference(int moduleRefTokenCount) {
        String[] identifiers = new String[moduleRefTokenCount];
        for (int i = 0; i < moduleRefTokenCount; i++) {
            identifiers[i] = new String(this.identifierStack[i]);
        }
        ModuleQualifiedName moduleRef = new ModuleQualifiedName(this.ast);

        Name typeRef;
        typeRef = this.ast.internalNewName(identifiers);
        int start = (int) (this.identifierPositionStack[0] >>> 32);
        if (moduleRefTokenCount > 1) {
            Name name = typeRef;
            int nameIndex = moduleRefTokenCount;
            for (int i = moduleRefTokenCount - 1; i > 0; i--, nameIndex--) {
                int s = (int) (this.identifierPositionStack[i] >>> 32);
                int e = (int) this.identifierPositionStack[i];
                name.index = nameIndex;
                SimpleName simpleName = ((QualifiedName) name).getName();
                simpleName.index = nameIndex;
                simpleName.setSourceRange(s, e - s + 1);
                name.setSourceRange(start, e - start + 1);
                name = ((QualifiedName) name).getQualifier();
            }
            int end = (int) this.identifierPositionStack[0];
            name.setSourceRange(start, end - start + 1);
            name.index = nameIndex;
        } else {
            int end = (int) this.identifierPositionStack[0];
            typeRef.setSourceRange(start, end - start + 1);
        }
        moduleRef.setModuleQualifier(typeRef);
        moduleRef.setName(null);
        moduleRef.setSourceRange(typeRef.getStartPosition(), typeRef.getLength() + 1);
        return moduleRef;
    }

    @Override
    protected Object createModuleTypeReference(TerminalToken primitiveToken, int moduleRefTokenCount) {
        int size = this.identifierLengthStack[this.identifierLengthPtr];
        ModuleQualifiedName moduleRef;
        Name typeRef;
        if (size == moduleRefTokenCount) {
            moduleRef = createModuleReference(moduleRefTokenCount);
            this.lastIdentifierEndPosition++;
        } else {
            String[] moduleIdentifiers = new String[moduleRefTokenCount];
            String[] identifiers = new String[size - moduleRefTokenCount];
            int pos = this.identifierPtr - size + 1;
            for (int i = 0; i < size; i++) {
                if (i < moduleRefTokenCount) {
                    moduleIdentifiers[i] = new String(this.identifierStack[pos + i]);
                } else {
                    identifiers[i - moduleRefTokenCount] = new String(this.identifierStack[pos + i]);
                }
            }
            moduleRef = createModuleReference(moduleRefTokenCount);
            pos = this.identifierPtr + moduleRefTokenCount - size + 1;

            if (primitiveToken == TerminalToken.TokenNameInvalid) {
                typeRef = this.ast.internalNewName(identifiers);
                // Update ref for whole name
                int start = (int) (this.identifierPositionStack[pos] >>> 32);
//				int end = (int) this.identifierPositionStack[this.identifierPtr];
//				typeRef.setSourceRange(start, end-start+1);
                // Update references of each simple name
                if (size - moduleRefTokenCount > 1) {
                    Name name = typeRef;
                    int nameIndex = size - moduleRefTokenCount;
                    for (int i = this.identifierPtr; i > pos; i--, nameIndex--) {
                        int s = (int) (this.identifierPositionStack[i] >>> 32);
                        int e = (int) this.identifierPositionStack[i];
                        name.index = nameIndex;
                        SimpleName simpleName = ((QualifiedName) name).getName();
                        simpleName.index = nameIndex;
                        simpleName.setSourceRange(s, e - s + 1);
                        name.setSourceRange(start, e - start + 1);
                        name = ((QualifiedName) name).getQualifier();
                    }
                    int end = (int) this.identifierPositionStack[pos];
                    name.setSourceRange(start, end - start + 1);
                    name.index = nameIndex;
                } else {
                    int end = (int) this.identifierPositionStack[pos];
                    typeRef.setSourceRange(start, end - start + 1);
                }
                moduleRef.setName(typeRef);
                moduleRef.setSourceRange(moduleRef.getStartPosition(), moduleRef.getLength() + typeRef.getLength());
            }
        }
        return moduleRef;
    }

    @Override
    protected boolean parseIdentifierTag(boolean report) {
        if (super.parseIdentifierTag(report)) {
            createTag();
            this.index = this.tagSourceEnd + 1;
            this.scanner.resetTo(this.index, this.javadocEnd);
            return true;
        }
        return false;
    }

    /*
     * Parse @return tag declaration
     */
    protected boolean parseReturn() {
        createTag();
        return true;
    }

    @Override
    protected boolean parseMarkdownLinks(int previousPosition) {
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
        int tStart = previousPosition;
        int tEnd = -1;
        loop: while (this.index < this.scanner.eofPosition) {
            switch (currentChar) {
                case '\\':
                    char c = peekChar();
                    if (c == '[' || c == ']') {
                        readChar();
                    }
                    break;

                case ')':
                    if (peekChar() == '\n' || peekChar() == ' ') {
                        valid = parseMarkdownLinkTags(true, start, previousPosition, tStart, tEnd);
                        break loop;
                    }
                    break;

                case ']':
                    if ((peekChar() == '[') || peekChar() == '(') {
                        tStart = start;
                        tEnd = this.index - 1;
                        currentChar = readChar();
                        start = this.index;
                    } else if (peekChar() != ']') {
                        valid = parseMarkdownLinkTags(false, start, previousPosition, tStart, tEnd);
                        break loop;
                    }
                    break;

                case '\r':
                case '\n':
                    return false;

                default:
                    break;
            }
            currentChar = readChar();
        }
        this.markdownHelper.resetLineStart();
        return valid;
    }

    private boolean parseMarkdownLinkTags(boolean refFlag, int start, int previousPosition, int tStart, int tEnd) {
        boolean valid;
        int eofBkup = this.scanner.eofPosition;
        this.scanner.eofPosition = this.index - 1;
        this.scanner.resetTo(start, this.javadocEnd);
        boolean oldInlineTagStarted = this.inlineTagStarted;
        int oldInlineTagStart = this.inlineTagStart;
        this.inlineTagStarted = true;
        this.inlineTagStart = previousPosition;
        this.tagValue = 7;
        int indexBkup = this.index;
        if (refFlag)
            valid = parseURLReference(this.scanner.startPosition - 1, false);
        else
            valid = parseReference(true);
        this.index = indexBkup;
        // This creates a two level structure. The @link tag is added to
        // another tag element, which gets added to the astStack
        // Both tag elements must get the same source range.
        TagElement previousTag = (TagElement) this.astStack[this.astPtr];
        int parentStart = previousTag.getStartPosition();
        previousTag.setSourceRange(parentStart, this.index - parentStart);
        List fragments = previousTag.fragments();
        int size = fragments.size();
        if (size == 0) {
            // no existing fragment => just add the element
            TagElement inlineTag = this.ast.newTagElement();
            fragments.add(inlineTag);
            previousTag = inlineTag;
        } else {
            // If last fragment is a tag, then use it as previous tag
            ASTNode lastFragment = (ASTNode) fragments.get(size - 1);
            if (lastFragment.getNodeType() == 65) {
                lastFragment.setSourceRange(lastFragment.getStartPosition(), this.index - previousPosition);
                previousTag = (TagElement) lastFragment;
            }
        }
        if (tEnd != -1) {
            TextElement text = this.ast.newTextElement();
            text.setText(new String(this.source, tStart, tEnd - tStart));
            text.setSourceRange(tStart, tEnd - tStart);
            previousTag.fragments().add(0, text);
        }
        this.tagValue = 0;
        this.inlineTagStarted = oldInlineTagStarted;
        this.inlineTagStart = oldInlineTagStarted ? oldInlineTagStart : -1;
        this.scanner.eofPosition = eofBkup;
        return valid;
    }

    @Override
    protected boolean parseTag(int previousPosition) throws InvalidInputException {
        this.markdownHelper.resetLineStart();

        // Read tag name
        int currentPosition = this.index;
        TerminalToken token = readTokenAndConsume();
        char[] tagName = CharOperation.NO_CHAR;
        if (currentPosition == this.scanner.startPosition) {
            this.tagSourceStart = this.scanner.getCurrentTokenStartPosition();
            this.tagSourceEnd = this.scanner.getCurrentTokenEndPosition();
            tagName = this.scanner.getCurrentIdentifierSource();
        } else {
            this.tagSourceEnd = currentPosition - 1;
        }

        // Try to get tag name other than java identifier
        // (see bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=51660)
        if (this.scanner.currentCharacter != ' ' && !ScannerHelper.isWhitespace(this.scanner.currentCharacter)) {
            tagNameToken: while (token != TerminalToken.TokenNameEOF && this.index < this.scanner.eofPosition) {
                int length = tagName.length;
                // !, ", #, %, &, ', -, :, <, >, * chars and spaces are not allowed in tag names
                switch (this.scanner.currentCharacter) {
                    case '}':
                    case '*': // break for '*' as this is perhaps the end of comment (bug 65288)
                    case '!':
                    case '#':
                    case '%':
                    case '&':
                    case '\'':
                    case '"':
                    case ':':
                    case '<':
                    case '>':
                        break tagNameToken;

                    case '-': // allowed in tag names as this character is often used in doclets (bug 68087)
                        System.arraycopy(tagName, 0, tagName = new char[length + 1], 0, length);
                        tagName[length] = this.scanner.currentCharacter;
                        break;

                    default:
                        if (this.scanner.currentCharacter == ' '
                            || ScannerHelper.isWhitespace(this.scanner.currentCharacter)) {
                            break tagNameToken;
                        }
                        token = readTokenAndConsume();
                        char[] ident = this.scanner.getCurrentIdentifierSource();
                        System.arraycopy(tagName, 0, tagName = new char[length + ident.length], 0, length);
                        System.arraycopy(ident, 0, tagName, length, ident.length);
                        break;
                }
                this.tagSourceEnd = this.scanner.getCurrentTokenEndPosition();
                this.scanner.getNextChar();
                this.index = this.scanner.currentPosition;
            }
        }
        int length = tagName.length;
        this.index = this.tagSourceEnd + 1;
        this.scanner.currentPosition = this.tagSourceEnd + 1;
        this.tagSourceStart = previousPosition;

        // tage name may be empty (see bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=125903)
        if (tagName.length == 0) {
            return false;
        }

        // Decide which parse to perform depending on tag name
        this.tagValue = 0;
        boolean valid = true;
        switch (token) {
            case TokenNameIdentifier:
                switch (tagName[0]) {
                    case 'c':
                        if (length == 8 && CharOperation.equals(TAG_CATEGORY, tagName)) {
                            this.tagValue = 11;
                            valid = parseIdentifierTag(false); // TODO (frederic) reconsider parameter value when
                                                               // @category will be significant in spec
                        } else if (length == 4 && CharOperation.equals(TAG_CODE, tagName)) {
                            this.tagValue = 18;
                            createTag();
                        } else {
                            this.tagValue = 100;
                            createTag();
                        }
                        break;

                    case 'd':
                        if (length == 10 && CharOperation.equals(TAG_DEPRECATED, tagName)) {
                            this.deprecated = true;
                            this.tagValue = 1;
                        } else {
                            this.tagValue = 100;
                        }
                        createTag();
                        break;

                    case 'i':
                        if (length == 10 && CharOperation.equals(TAG_INHERITDOC, tagName)) {
                            if (this.reportProblems) {
                                recordInheritedPosition((((long) this.tagSourceStart) << 32) + this.tagSourceEnd);
                            }
                            this.tagValue = 9;
                        } else {
                            this.tagValue = 100;
                        }
                        createTag();
                        break;

                    case 'p':
                        if (length == 5 && CharOperation.equals(TAG_PARAM, tagName)) {
                            this.tagValue = 2;
                            valid = parseParam();
                        } else {
                            this.tagValue = 100;
                            createTag();
                        }
                        break;

                    case 'e':
                        if (length == 9 && CharOperation.equals(TAG_EXCEPTION, tagName)) {
                            this.tagValue = 5;
                            valid = parseThrows();
                        } else {
                            this.tagValue = 100;
                            createTag();
                        }
                        break;

                    case 's':
                        if (length == 3 && CharOperation.equals(TAG_SEE, tagName)) {
                            this.tagValue = 6;
                            if (this.inlineTagStarted) {
                                // bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=53290
                                // Cannot have @see inside inline comment
                                valid = false;
                            } else {
                                valid = parseReference(true);
                            }
                        } else if (length == 7 && CharOperation.equals(TAG_SNIPPET, tagName)) {
                            this.tagValue = 7;
                            if (!this.inlineTagStarted) {
                                // @snippet is an inline comment
                                valid = false;
                            } else {
                                this.tagValue = 30;
                                valid = parseSnippet();
                            }
                        } else {
                            this.tagValue = 100;
                            createTag();
                        }
                        break;

                    case 'l':
                        if (length == 4 && CharOperation.equals(TAG_LINK, tagName)) {
                            this.tagValue = 7;
                        } else if (length == 9 && CharOperation.equals(TAG_LINKPLAIN, tagName)) {
                            this.tagValue = 8;
                        } else if (length == 7 && CharOperation.equals(TAG_LITERAL, tagName)) {
                            this.tagValue = 19;
                        }

                        if (this.tagValue != 0 && this.tagValue != 19) {
                            if (this.inlineTagStarted) {
                                valid = parseReference(true);
                            } else {
                                // bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=53290
                                // Cannot have @link outside inline comment
                                valid = false;
                            }
                        } else {
                            if (this.tagValue == 0)
                                this.tagValue = 100;
                            createTag();
                        }
                        break;

                    case 'v':
                        if (length == 5 && CharOperation.equals(TAG_VALUE, tagName)) {
                            this.tagValue = 10;
                            if (this.inlineTagStarted) {
                                valid = parseReference();
                            } else {
                                valid = false;
                            }
                        } else {
                            this.tagValue = 100;
                            createTag();
                        }
                        break;

                    default:
                        this.tagValue = 100;
                        createTag();
                }
                break;

            case TokenNamereturn:
                this.tagValue = 3;
                valid = parseReturn();
                break;

            case TokenNamethrows:
                this.tagValue = 4;
                valid = parseThrows();
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
            case TokenNamenull:
            case TokenNamepackage:
            case TokenNameprivate:
            case TokenNameprotected:
            case TokenNamepublic:
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
            case TokenNameenum:
            case TokenNameconst:
            case TokenNamegoto:
                this.tagValue = 100;
                createTag();
                break;

            default:
                break;
        }
        this.textStart = this.index;
        return valid;
    }

    @Override
    protected boolean pushParamName(boolean isTypeParam) {
        int idIndex = isTypeParam ? 1 : 0;
        final SimpleName name = new SimpleName(this.ast);
        name.internalSetIdentifier(new String(this.identifierStack[idIndex]));
        int nameStart = (int) (this.identifierPositionStack[idIndex] >>> 32);
        int nameEnd = (int) (this.identifierPositionStack[idIndex] & 0x00000000FFFFFFFFL);
        name.setSourceRange(nameStart, nameEnd - nameStart + 1);
        TagElement paramTag = this.ast.newTagElement();
        paramTag.setTagName("@param");
        if (isTypeParam) { // specific storage for @param <E> (see bug 79809)
            // '<' was stored in identifiers stack
            TextElement text = this.ast.newTextElement();
            text.setText(new String(this.identifierStack[0]));
            int txtStart = (int) (this.identifierPositionStack[0] >>> 32);
            int txtEnd = (int) (this.identifierPositionStack[0] & 0x00000000FFFFFFFFL);
            text.setSourceRange(txtStart, txtEnd - txtStart + 1);
            paramTag.fragments().add(text);
            // add simple name
            paramTag.fragments().add(name);
            // '>' was stored in identifiers stack
            text = this.ast.newTextElement();
            text.setText(new String(this.identifierStack[2]));
            txtStart = (int) (this.identifierPositionStack[2] >>> 32);
            txtEnd = (int) (this.identifierPositionStack[2] & 0x00000000FFFFFFFFL);
            text.setSourceRange(txtStart, txtEnd - txtStart + 1);
            paramTag.fragments().add(text);
            // set param tag source range
            paramTag.setSourceRange(this.tagSourceStart, txtEnd - this.tagSourceStart + 1);
        } else {
            paramTag.setSourceRange(this.tagSourceStart, nameEnd - this.tagSourceStart + 1);
            paramTag.fragments().add(name);
        }
        pushOnAstStack(paramTag, true);
        return true;
    }

    @Override
    protected boolean pushSeeRef(Object statement) {
        TagElement seeTag = this.ast.newTagElement();
        ASTNode node = (ASTNode) statement;
        seeTag.fragments().add(node);
        int end = node.getStartPosition() + node.getLength();
        if (this.inlineTagStarted) {
            seeTag.setSourceRange(this.inlineTagStart, end - this.inlineTagStart + 1);
            switch (this.tagValue) {
                case 7:
                    seeTag.setTagName("@link");
                    break;

                case 8:
                    seeTag.setTagName("@linkplain");
                    break;

                case 10:
                    seeTag.setTagName("@value");
                    break;
            }
            TagElement previousTag;
            int previousStart = this.inlineTagStart;
            if (this.astPtr == -1) {
                previousTag = this.ast.newTagElement();
                pushOnAstStack(previousTag, true);
            } else {
                previousTag = (TagElement) this.astStack[this.astPtr];
                previousStart = previousTag.getStartPosition();
            }
            if (!previousTag.fragments.isEmpty() && this.tagValue == 7) {
                ASTNode lastNode = (ASTNode) previousTag.fragments.get(previousTag.fragments.size() - 1);
                if (lastNode instanceof TagElement lastTag && lastTag.getTagName().equals("@return")) {
                    previousTag = lastTag;
                    previousStart = lastTag.getStartPosition();
                }
            }
            previousTag.fragments().add(seeTag);
            previousTag.setSourceRange(previousStart, end - previousStart + 1);
        } else {
            seeTag.setTagName("@see");
            seeTag.setSourceRange(this.tagSourceStart, end - this.tagSourceStart);
            pushOnAstStack(seeTag, true);
        }
        return true;
    }

    @Override
    protected void pushText(int start, int end) {
        start = this.markdownHelper.getTextStart(start);

        // Create text element
        TextElement text = this.ast.newTextElement();
        text.setText(new String(this.source, start, end - start));
        text.setSourceRange(start, end - start);

        // Search previous tag on which to add the text element
        TagElement previousTag;
        int previousStart = start;
        if (this.astPtr == -1) {
            previousTag = this.ast.newTagElement();
            previousTag.setSourceRange(start, end - start);
            pushOnAstStack(previousTag, true);
        } else {
            previousTag = (TagElement) this.astStack[this.astPtr];
            previousStart = previousTag.getStartPosition();
        }

        // If we're in a inline tag, then retrieve previous tag in its fragments
        List fragments = previousTag.fragments();
        if (this.inlineTagStarted) {
            int size = fragments.size();
            if (size == 0) {
                // no existing fragment => just add the element
                TagElement inlineTag = this.ast.newTagElement();
                fragments.add(inlineTag);
                previousTag = inlineTag;
            } else {
                // If last fragment is a tag, then use it as previous tag
                ASTNode lastFragment = (ASTNode) fragments.get(size - 1);
                if (lastFragment.getNodeType() == 65) {
                    previousTag = (TagElement) lastFragment;
                    previousStart = previousTag.getStartPosition();
                }
            }
        }

        // Add the text
        previousTag.fragments().add(text);
        previousTag.setSourceRange(previousStart, end - previousStart);
        this.textStart = -1;
    }

    @Override
    protected void pushSnippetText(char[] text, int start, int end, boolean addNewLine, Object snippetTag) {
        pushSnippetText(text, start, end, addNewLine, snippetTag, false);
    }

    private void pushSnippetText(char[] text, int start, int end, boolean addNewLine, Object snippetTag,
        boolean isExternalSnippet) {
        // Create text element
        String textToBeAdded = new String(text, start, end - start).stripTrailing();
        AbstractTextElement textElem;
        if (isExternalSnippet && textToBeAdded.indexOf("*/") > 0) { //$NON-NLS-1$
            textElem = this.ast.newJavaDocTextElement();
        } else {
            textElem = this.ast.newTextElement();
        }

        int iindex = textToBeAdded.indexOf('*');
        if (iindex > -1 && textToBeAdded.substring(0, iindex + 1).trim().equals("*")) { //$NON-NLS-1$
            textToBeAdded = textToBeAdded.substring(iindex + 1);
            if (addNewLine) {
                textToBeAdded += System.lineSeparator();
            }
        } else if (isExternalSnippet) {
            if (addNewLine) {
                textToBeAdded += System.lineSeparator();
            }
        }
        textElem.setText(textToBeAdded);
        textElem.setSourceRange(start, end - start);

        // Search previous tag on which to add the text element
        AbstractTagElement previousTag;
        int previousStart = start;
        if (this.astPtr == -1) {
            previousTag = this.ast.newTagElement();
            previousTag.setSourceRange(start, end - start);
            pushOnAstStack(previousTag, true);
        } else {
            previousTag = (AbstractTagElement) this.astStack[this.astPtr];
            previousStart = previousTag.getStartPosition();
        }

        AbstractTagElement prevTag = null;
        // If we're in a inline tag, then retrieve previous tag in its fragments
        List fragments = previousTag.fragments();
        if (this.inlineTagStarted) {
            int size = fragments.size();
            if (size == 0) {
                // do nothing
            } else {
                // If last fragment is a tag, then use it as previous tag
                ASTNode lastFragment = (ASTNode) fragments.get(size - 1);
                if (lastFragment instanceof AbstractTagElement) {
                    previousTag = (AbstractTagElement) lastFragment;
                    previousStart = previousTag.getStartPosition();
                    if (this.snippetInlineTagStarted) {
                        fragments = previousTag.fragments();
                        size = fragments.size();
                        if (size == 0) {
                            // do nothing
                        } else {
                            lastFragment = (ASTNode) fragments.get(size - 1);
                            if (lastFragment instanceof AbstractTagElement) {
                                prevTag = (AbstractTagElement) lastFragment;
                            }
                        }
                        this.snippetInlineTagStarted = false;
                    }
                }
            }
        }

        int finEnd = end;
        boolean isNotDummyJavaDocRegion
            = prevTag instanceof JavaDocRegion && !((JavaDocRegion) prevTag).isDummyRegion();
        // Add the text
        if (prevTag != null && !isNotDummyJavaDocRegion) {
            prevTag.fragments().add(textElem);
            int curStart = prevTag.getStartPosition();
            int curEnd = curStart + prevTag.getLength();
            int finStart = Math.min(curStart, start);
            if (curEnd > end) {
                finEnd = curEnd;
            }
            prevTag.setSourceRange(finStart, finEnd - finStart);
        } else {
            previousTag.fragments().add(textElem);
        }
        if (!isExternalSnippet)
            previousTag.setSourceRange(previousStart, finEnd - previousStart);
        this.textStart = -1;

        if (snippetTag instanceof TagElement) {
            fragments = ((TagElement) snippetTag).fragments();
            for (Object frag : fragments) {
                if (frag instanceof JavaDocRegion region) {
                    if (!region.isDummyRegion() && !hasRegionEnded(region)) {
                        int startPos = region.getStartPosition();
                        int endPos = startPos + region.getLength();
                        if (startPos > start) {
                            startPos = start;
                        }
                        if (endPos < end) {
                            endPos = end;
                        }
                        Object textVal = region.getProperty("SnippetRegionTextElement");
                        if (!(textVal instanceof AbstractTextElement)) {
                            region.setProperty("SnippetRegionTextElement", textElem);
                        }
                        region.setSourceRange(startPos, endPos - startPos);
                        if (isRegionToBeEnded(region)) {
                            setRegionEnded(region);
                        }
                    }
                }
            }
        }
    }

    private boolean hasRegionEnded(JavaDocRegion region) {
        boolean ended = false;
        if (region != null) {
            Object value = region.getProperty("Region Ended");
            if (value instanceof Boolean && (Boolean) value) {
                ended = true;
            }
        }
        return ended;
    }

    private boolean isRegionToBeEnded(JavaDocRegion region) {
        boolean toBeEnded = false;
        if (region != null) {
            Object value = region.getProperty("Region To Be Ended");
            if (value instanceof Boolean && (Boolean) value) {
                toBeEnded = true;
            }
        }
        return toBeEnded;
    }

    private void setRegionToBeEnded(JavaDocRegion region, boolean value) {
        if (region != null) {
            region.setProperty("Region To Be Ended", value);
        }
    }

    private void setRegionEnded(JavaDocRegion region) {
        if (region != null) {
            region.setProperty("Region Ended", true);
            setRegionToBeEnded(region, false);
        }
    }

    @Override
    protected boolean pushThrowName(Object typeRef) {
        TagElement throwsTag = this.ast.newTagElement();
        switch (this.tagValue) {
            case 4:
                throwsTag.setTagName("@throws");
                break;

            case 5:
                throwsTag.setTagName("@exception");
                break;
        }
        throwsTag.setSourceRange(this.tagSourceStart,
            this.scanner.getCurrentTokenEndPosition() - this.tagSourceStart + 1);
        throwsTag.fragments().add(typeRef);
        pushOnAstStack(throwsTag, true);
        return true;
    }

    @Override
    protected void refreshInlineTagPosition(int previousPosition) {
        if (this.astPtr != -1) {
            TagElement previousTag = (TagElement) this.astStack[this.astPtr];
            if (this.inlineTagStarted) {
                int previousStart = previousTag.getStartPosition();
                previousTag.setSourceRange(previousStart, previousPosition - previousStart + 1);
                if (!previousTag.fragments().isEmpty()) {
                    ASTNode inlineTag = (ASTNode) previousTag.fragments().get(previousTag.fragments().size() - 1);
                    if (inlineTag.getNodeType() == 65) {
                        int inlineStart = inlineTag.getStartPosition();
                        inlineTag.setSourceRange(inlineStart, previousPosition - inlineStart + 1);
                    }
                }
            }
        }
    }

    /*
     * Add stored tag elements to associated comment.
     */
    @Override
    protected void updateDocComment() {
        for (int idx = 0; idx <= this.astPtr; idx++) {
            this.docComment.tags().add(this.astStack[idx]);
        }
    }

    @Override
    protected boolean areRegionsClosed() {
        // do nothing
        return true;
    }

    @Override
    protected void setRegionPosition(int currentPosition) {
        // do nothing
    }
}
