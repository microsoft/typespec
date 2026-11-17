// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2008, 2024 IBM Corporation and others.
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

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameNotAToken;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.*;

public class RecoveredAnnotation extends RecoveredElement {

    /**
     * Name used for the value of an incomplete member-value pair.
     */
    private static final char[] FAKE_IDENTIFIER = "$missing$".toCharArray(); //$NON-NLS-1$

    private int kind;
    final int identifierPtr;
    private final int identifierLengthPtr;
    private final int sourceStart;
    public boolean hasPendingMemberValueName;
    public int memberValuPairEqualEnd = -1;
    public Annotation annotation;
    public TerminalToken errorToken = TokenNameNotAToken;

    public RecoveredAnnotation(int identifierPtr, int identifierLengthPtr, int sourceStart, RecoveredElement parent,
        int bracketBalance) {
        super(parent, bracketBalance);
        this.kind = 0;
        this.identifierPtr = identifierPtr;
        this.identifierLengthPtr = identifierLengthPtr;
        this.sourceStart = sourceStart;
    }

    @Override
    public RecoveredElement add(TypeDeclaration typeDeclaration, int bracketBalanceValue) {
        if (this.annotation == null && (typeDeclaration.bits & 512) != 0) {
            // ignore anonymous type in annotations when annotation isn't fully recovered
            return this;
        }
        return super.add(typeDeclaration, bracketBalanceValue);
    }

    @Override
    public RecoveredElement addAnnotationName(int identPtr, int identLengthPtr, int annotationStart,
        int bracketBalanceValue) {
        return new RecoveredAnnotation(identPtr, identLengthPtr, annotationStart, this, bracketBalanceValue);
    }

    public RecoveredElement addAnnotation(Annotation annot) {
        this.annotation = annot;

        if (this.parent != null)
            return this.parent;
        return this;
    }

    @Override
    public void updateFromParserState() {
        Parser parser = parser();

        if (this.annotation == null && this.identifierPtr <= parser.identifierPtr) {
            Annotation annot = null;

            boolean needUpdateRParenPos = false;

            MemberValuePair pendingMemberValueName = null;
            Expression singleValue = null;
            if (this.hasPendingMemberValueName && this.identifierPtr < parser.identifierPtr) {
                char[] memberValueName = parser.identifierStack[this.identifierPtr + 1];

                long pos = parser.identifierPositionStack[this.identifierPtr + 1];
                int start = (int) (pos >>> 32);
                int end = (int) pos;

                if (this.errorToken == TerminalToken.TokenNameDOT) {
                    // do we need to consult identifierLengthStack to pull more than one name segment?
                    char[][] qname = new char[][] { memberValueName, FAKE_IDENTIFIER };
                    singleValue = new QualifiedNameReference(qname, new long[] { pos, pos }, start, end);
                    this.kind = 2;
                } else {
                    int valueEnd = this.memberValuPairEqualEnd > -1 ? this.memberValuPairEqualEnd : end;
                    SingleNameReference fakeExpression
                        = new SingleNameReference(FAKE_IDENTIFIER, (((long) valueEnd + 1) << 32) + (valueEnd));
                    pendingMemberValueName = new MemberValuePair(memberValueName, start, end, fakeExpression);
                }
            }
            parser.identifierPtr = this.identifierPtr;
            parser.identifierLengthPtr = this.identifierLengthPtr;
            TypeReference typeReference = parser.getAnnotationType();

            switch (this.kind) {
                case 1:
                    if (parser.astPtr > -1 && parser.astStack[parser.astPtr] instanceof MemberValuePair) {
                        MemberValuePair[] memberValuePairs;

                        int argLength = parser.astLengthStack[parser.astLengthPtr];
                        int argStart = parser.astPtr - argLength + 1;

                        if (argLength > 0) {
                            int annotationEnd;
                            if (pendingMemberValueName != null) {
                                memberValuePairs = new MemberValuePair[argLength + 1];

                                System.arraycopy(parser.astStack, argStart, memberValuePairs, 0, argLength);
                                parser.astLengthPtr--;
                                parser.astPtr -= argLength;

                                memberValuePairs[argLength] = pendingMemberValueName;

                                annotationEnd = pendingMemberValueName.sourceEnd;
                            } else {
                                memberValuePairs = new MemberValuePair[argLength];

                                System.arraycopy(parser.astStack, argStart, memberValuePairs, 0, argLength);
                                parser.astLengthPtr--;
                                parser.astPtr -= argLength;

                                MemberValuePair lastMemberValuePair = memberValuePairs[memberValuePairs.length - 1];

                                annotationEnd = lastMemberValuePair.value != null
                                    ? lastMemberValuePair.value instanceof Annotation
                                        ? ((Annotation) lastMemberValuePair.value).declarationSourceEnd
                                        : lastMemberValuePair.value.sourceEnd
                                    : lastMemberValuePair.sourceEnd;
                            }

                            NormalAnnotation normalAnnotation = new NormalAnnotation(typeReference, this.sourceStart);
                            normalAnnotation.memberValuePairs = memberValuePairs;
                            normalAnnotation.declarationSourceEnd = annotationEnd;
                            normalAnnotation.bits |= 32;

                            annot = normalAnnotation;

                            needUpdateRParenPos = true;
                        }
                    }

                    break;

                case 2:
                    Expression memberValue = singleValue != null
                        ? singleValue
                        : parser.expressionPtr > -1 ? parser.expressionStack[parser.expressionPtr--] : null;
                    if (memberValue != null) {
                        SingleMemberAnnotation singleMemberAnnotation
                            = new SingleMemberAnnotation(typeReference, this.sourceStart);
                        singleMemberAnnotation.memberValue = memberValue;
                        singleMemberAnnotation.declarationSourceEnd = memberValue.sourceEnd;
                        singleMemberAnnotation.bits |= 32;

                        annot = singleMemberAnnotation;

                        needUpdateRParenPos = true;
                    }
                    break;
            }

            if (!needUpdateRParenPos) {
                if (pendingMemberValueName != null) {
                    NormalAnnotation normalAnnotation = new NormalAnnotation(typeReference, this.sourceStart);
                    normalAnnotation.memberValuePairs = new MemberValuePair[] { pendingMemberValueName };
                    normalAnnotation.declarationSourceEnd = pendingMemberValueName.value.sourceEnd;
                    normalAnnotation.bits |= 32;

                    annot = normalAnnotation;
                } else {
                    MarkerAnnotation markerAnnotation = new MarkerAnnotation(typeReference, this.sourceStart);
                    markerAnnotation.declarationSourceEnd = markerAnnotation.sourceEnd;
                    markerAnnotation.bits |= 32;

                    annot = markerAnnotation;
                }
            }

            parser.currentElement = addAnnotation(annot);
            parser.annotationRecoveryCheckPoint(annot.declarationSourceEnd);
            if (this.parent != null) {
                this.parent.updateFromParserState();
            }
        }
    }

    @Override
    public ASTNode parseTree() {
        return this.annotation;
    }

    @Override
    public void resetPendingModifiers() {
        if (this.parent != null)
            this.parent.resetPendingModifiers();
    }

    public void setKind(int kind) {
        this.kind = kind;
    }

    public int sourceStart() {
        return this.sourceStart;
    }

    public Annotation updatedAnnotationReference() {
        return this.annotation;
    }

    @Override
    public RecoveredElement updateOnClosingBrace(int braceStart, int braceEnd) {
        if (this.bracketBalance > 0) { // was an member value array initializer
            this.bracketBalance--;
            return this;
        }
        if (this.parent != null) {
            return this.parent.updateOnClosingBrace(braceStart, braceEnd);
        }
        return this;
    }

    @Override
    public void updateParseTree() {
    }
}
