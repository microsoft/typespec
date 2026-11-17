// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2016 IBM Corporation and others.
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
 *     Jesper S Moller - Bug 392671
 *          NPE with a method with explicit this and a following incomplete parameter
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameLPAREN;
import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken.TokenNameSEMICOLON;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.TypeConstants;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.Util;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.*;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Internal method structure for parsing recovery
 */
public class RecoveredMethod extends RecoveredElement {

    public AbstractMethodDeclaration methodDeclaration;

    public RecoveredAnnotation[] annotations;
    public int annotationCount;

    public int modifiers;
    public int modifiersStart;

    public RecoveredType[] localTypes;
    public int localTypeCount;

    public RecoveredBlock methodBody;

    int pendingModifiers;
    int pendingModifersSourceStart = -1;
    RecoveredAnnotation[] pendingAnnotations;
    int pendingAnnotationCount;

    public boolean incompleteParameterAnnotationSeen = false;

    public RecoveredMethod(AbstractMethodDeclaration methodDeclaration, RecoveredElement parent, int bracketBalance,
        Parser parser) {
        super(parent, bracketBalance, parser);
        this.methodDeclaration = methodDeclaration;
        this.foundOpeningBrace = !bodyStartsAtHeaderEnd();
        if (this.foundOpeningBrace) {
            this.bracketBalance++;
        }
    }

    /*
     * Record a nested block declaration
     */
    @Override
    public RecoveredElement add(Block nestedBlockDeclaration, int bracketBalanceValue) {
        return this.add(nestedBlockDeclaration, bracketBalanceValue, false);
    }

    public RecoveredElement add(Block nestedBlockDeclaration, int bracketBalanceValue, boolean isArgument) {
        /*
         * default behavior is to delegate recording to parent if any, do not consider elements passed the known end (if
         * set) it must be belonging to an enclosing element
         */
        if (this.methodDeclaration.declarationSourceEnd > 0
            && nestedBlockDeclaration.sourceStart > this.methodDeclaration.declarationSourceEnd) {
            resetPendingModifiers();
            if (this.parent == null) {
                return this; // ignore
            } else {
                return this.parent.add(nestedBlockDeclaration, bracketBalanceValue);
            }
        }
        /* consider that if the opening brace was not found, it is there */
        if (!this.foundOpeningBrace && !isArgument) {
            this.foundOpeningBrace = true;
            this.bracketBalance++;
        }

        if (this.methodBody != null) {
            this.methodBody.addBlockStatement(new RecoveredBlock(nestedBlockDeclaration, this, bracketBalanceValue));
        } else {
            this.methodBody = new RecoveredBlock(nestedBlockDeclaration, this, bracketBalanceValue);
        }
        if (nestedBlockDeclaration.sourceEnd == 0)
            return this.methodBody;
        return this;
    }

    /*
     * Record a field declaration
     */
    @Override
    public RecoveredElement add(FieldDeclaration fieldDeclaration, int bracketBalanceValue) {
        if (recoverAsArgument(fieldDeclaration)) {
            resetPendingModifiers();
            return this;
        }
        resetPendingModifiers();

        /* local variables inside method can only be final and non void */
        char[][] fieldTypeName;
        if ((fieldDeclaration.modifiers & ~16) != 0 // local var can only be final
            || (fieldDeclaration.type == null) // initializer
            || ((fieldTypeName = fieldDeclaration.type.getTypeName()).length == 1 // non void
                && CharOperation.equals(fieldTypeName[0], TypeConstants.VOID))) {
            if (this.parent == null) {
                return this; // ignore
            } else {
                this.updateSourceEndIfNecessary(previousAvailableLineEnd(fieldDeclaration.declarationSourceStart - 1));
                return this.parent.add(fieldDeclaration, bracketBalanceValue);
            }
        }
        /*
         * default behavior is to delegate recording to parent if any, do not consider elements passed the known end (if
         * set) it must be belonging to an enclosing element
         */
        if (this.methodDeclaration.declarationSourceEnd > 0
            && fieldDeclaration.declarationSourceStart > this.methodDeclaration.declarationSourceEnd) {
            if (this.parent == null) {
                return this; // ignore
            } else {
                return this.parent.add(fieldDeclaration, bracketBalanceValue);
            }
        }
        /* consider that if the opening brace was not found, it is there */
        if (!this.foundOpeningBrace) {
            this.foundOpeningBrace = true;
            this.bracketBalance++;
        }
        // still inside method, treat as local variable
        return this; // ignore
    }

    private boolean recoverAsArgument(FieldDeclaration fieldDeclaration) {
        if (!this.foundOpeningBrace
            && this.methodDeclaration.declarationSourceEnd == 0
            && this.incompleteParameterAnnotationSeen) { // misparsed parameter?
            long position = ((long) fieldDeclaration.sourceStart << 32) + fieldDeclaration.sourceEnd;
            Argument arg
                = new Argument(fieldDeclaration.name, position, fieldDeclaration.type, fieldDeclaration.modifiers);
            if (this.methodDeclaration.arguments == null) {
                this.methodDeclaration.arguments = new Argument[] { arg };
            } else {
                int len = this.methodDeclaration.arguments.length;
                this.methodDeclaration.arguments = Arrays.copyOf(this.methodDeclaration.arguments, len + 1);
                this.methodDeclaration.arguments[len] = arg;
            }
            int annotCount = this.pendingAnnotationCount;
            if (this.pendingAnnotations != null) {
                int end = 0;
                arg.annotations = new Annotation[annotCount];
                for (int i = 0; i < this.pendingAnnotationCount; i++) {
                    arg.annotations[i] = this.pendingAnnotations[i].annotation;
                    if (i == 0)
                        arg.declarationSourceStart = arg.annotations[i].sourceStart;
                    end = arg.sourceEnd;
                }
                if (end > 0)
                    this.methodDeclaration.bodyStart = end + 1;
            }
            return true;
        }
        return false;
    }

    /*
     * Record a local declaration - regular method should have been created a block body
     */
    @Override
    public RecoveredElement add(LocalDeclaration localDeclaration, int bracketBalanceValue) {
        resetPendingModifiers();

        /*
         * do not consider a type starting passed the type end (if set) it must be belonging to an enclosing type
         */
        if (this.methodDeclaration.declarationSourceEnd != 0
            && localDeclaration.declarationSourceStart > this.methodDeclaration.declarationSourceEnd) {
            if (this.parent == null) {
                return this; // ignore
            } else {
                return this.parent.add(localDeclaration, bracketBalanceValue);
            }
        }
        if (this.methodBody == null) {
            Block block = new Block(0);
            block.sourceStart = this.methodDeclaration.bodyStart;
            RecoveredElement currentBlock = this.add(block, 1, localDeclaration.isArgument());
            if (this.bracketBalance > 0) {
                for (int i = 0; i < this.bracketBalance - 1; i++) {
                    currentBlock = currentBlock.add(new Block(0), 1);
                }
                this.bracketBalance = 1;
            }
            return currentBlock.add(localDeclaration, bracketBalanceValue);
        }
        return this.methodBody.add(localDeclaration, bracketBalanceValue, true);
    }

    /*
     * Record a statement - regular method should have been created a block body
     */
    @Override
    public RecoveredElement add(Statement statement, int bracketBalanceValue) {
        resetPendingModifiers();

        /*
         * do not consider a type starting passed the type end (if set) it must be belonging to an enclosing type
         */
        if (this.methodDeclaration.declarationSourceEnd != 0
            && statement.sourceStart > this.methodDeclaration.declarationSourceEnd) {
            if (this.parent == null) {
                return this; // ignore
            } else {
                return this.parent.add(statement, bracketBalanceValue);
            }
        }
        if (this.methodBody == null) {
            Block block = new Block(0);
            block.sourceStart = this.methodDeclaration.bodyStart;
            RecoveredElement currentBlock = this.add(block, 1);
            if (this.bracketBalance > 0) {
                for (int i = 0; i < this.bracketBalance - 1; i++) {
                    currentBlock = currentBlock.add(new Block(0), 1);
                }
                this.bracketBalance = 1;
            }
            return currentBlock.add(statement, bracketBalanceValue);
        }
        return this.methodBody.add(statement, bracketBalanceValue, true);
    }

    @Override
    public RecoveredElement add(TypeDeclaration typeDeclaration, int bracketBalanceValue) {

        /*
         * do not consider a type starting passed the type end (if set) it must be belonging to an enclosing type
         */
        if (this.methodDeclaration.declarationSourceEnd != 0
            && typeDeclaration.declarationSourceStart > this.methodDeclaration.declarationSourceEnd) {
            if (this.parent == null) {
                return this; // ignore
            }
            return this.parent.add(typeDeclaration, bracketBalanceValue);
        }
        if ((typeDeclaration.bits & 256) != 0
            || parser().methodRecoveryActivated
            || parser().statementRecoveryActivated) {
            if (this.methodBody == null) {
                Block block = new Block(0);
                block.sourceStart = this.methodDeclaration.bodyStart;
                this.add(block, 1);
            }
            this.methodBody.attachPendingModifiers(this.pendingAnnotations, this.pendingAnnotationCount,
                this.pendingModifiers, this.pendingModifersSourceStart);
            resetPendingModifiers();
            return this.methodBody.add(typeDeclaration, bracketBalanceValue, true);
        }
        switch (TypeDeclaration.kind(typeDeclaration.modifiers)) {
            case 2:
            case 4:
                resetPendingModifiers();
                this.updateSourceEndIfNecessary(previousAvailableLineEnd(typeDeclaration.declarationSourceStart - 1));
                if (this.parent == null) {
                    return this; // ignore
                }
                // close the constructor
                return this.parent.add(typeDeclaration, bracketBalanceValue);
        }
        if (this.localTypes == null) {
            this.localTypes = new RecoveredType[5];
            this.localTypeCount = 0;
        } else {
            if (this.localTypeCount == this.localTypes.length) {
                System.arraycopy(this.localTypes, 0, (this.localTypes = new RecoveredType[2 * this.localTypeCount]), 0,
                    this.localTypeCount);
            }
        }
        RecoveredType element = new RecoveredType(typeDeclaration, this, bracketBalanceValue);
        this.localTypes[this.localTypeCount++] = element;

        if (this.pendingAnnotationCount > 0) {
            element.attach(this.pendingAnnotations, this.pendingAnnotationCount, this.pendingModifiers,
                this.pendingModifersSourceStart);
        }
        resetPendingModifiers();

        /* consider that if the opening brace was not found, it is there */
        if (!this.foundOpeningBrace) {
            this.foundOpeningBrace = true;
            this.bracketBalance++;
        }
        return element;
    }

    public boolean bodyStartsAtHeaderEnd() {
        return this.methodDeclaration.bodyStart == this.methodDeclaration.sourceEnd + 1;
    }

    /*
     * Answer the associated parsed structure
     */
    @Override
    public ASTNode parseTree() {
        return this.methodDeclaration;
    }

    @Override
    public void resetPendingModifiers() {
        this.pendingAnnotations = null;
        this.pendingAnnotationCount = 0;
        this.pendingModifiers = 0;
        this.pendingModifersSourceStart = -1;
    }

    /*
     * Update the bodyStart of the corresponding parse node
     */
    @Override
    public void updateBodyStart(int bodyStart) {
        this.foundOpeningBrace = true;
        this.methodDeclaration.bodyStart = bodyStart;
    }

    public AbstractMethodDeclaration updatedMethodDeclaration(int depth, Set<TypeDeclaration> knownTypes) {
        /* update annotations */
        if (this.modifiers != 0) {
            this.methodDeclaration.modifiers |= this.modifiers;
            if (this.modifiersStart < this.methodDeclaration.declarationSourceStart) {
                this.methodDeclaration.declarationSourceStart = this.modifiersStart;
            }
        }
        /* update annotations */
        if (this.annotationCount > 0) {
            int existingCount
                = this.methodDeclaration.annotations == null ? 0 : this.methodDeclaration.annotations.length;
            Annotation[] annotationReferences = new Annotation[existingCount + this.annotationCount];
            if (existingCount > 0) {
                System.arraycopy(this.methodDeclaration.annotations, 0, annotationReferences, this.annotationCount,
                    existingCount);
            }
            for (int i = 0; i < this.annotationCount; i++) {
                annotationReferences[i] = this.annotations[i].updatedAnnotationReference();
            }
            this.methodDeclaration.annotations = annotationReferences;

            int start = this.annotations[0].annotation.sourceStart;
            if (start < this.methodDeclaration.declarationSourceStart) {
                this.methodDeclaration.declarationSourceStart = start;
            }
        }

        if (this.methodBody != null) {
            Block block = this.methodBody.updatedBlock(depth, knownTypes);
            if (block != null) {
                this.methodDeclaration.statements = block.statements;

                if (this.methodDeclaration.declarationSourceEnd == 0) {
                    this.methodDeclaration.declarationSourceEnd = block.sourceEnd;
                    this.methodDeclaration.bodyEnd = block.sourceEnd;
                }

                /* first statement might be an explict constructor call destinated to a special slot */
                if (this.methodDeclaration.isConstructor()) {
                    ConstructorDeclaration constructor = (ConstructorDeclaration) this.methodDeclaration;
                    if (this.methodDeclaration.statements != null
                        && this.methodDeclaration.statements[0] instanceof ExplicitConstructorCall) {
                        constructor.constructorCall = (ExplicitConstructorCall) this.methodDeclaration.statements[0];
                        int length = this.methodDeclaration.statements.length;
                        System.arraycopy(this.methodDeclaration.statements, 1,
                            (this.methodDeclaration.statements = new Statement[length - 1]), 0, length - 1);
                    }
                    if (constructor.constructorCall == null) { // add implicit constructor call
                        constructor.constructorCall = SuperReference.implicitSuperConstructorCall();
                    }
                }
            }
        } else {
            if (this.methodDeclaration.declarationSourceEnd == 0) {
                if (this.methodDeclaration.sourceEnd + 1 == this.methodDeclaration.bodyStart) {
                    // right brace is missing
                    this.methodDeclaration.declarationSourceEnd = this.methodDeclaration.sourceEnd;
                    this.methodDeclaration.bodyStart = this.methodDeclaration.sourceEnd;
                    this.methodDeclaration.bodyEnd = this.methodDeclaration.sourceEnd;
                } else {
                    this.methodDeclaration.declarationSourceEnd = this.methodDeclaration.bodyStart;
                    this.methodDeclaration.bodyEnd = this.methodDeclaration.bodyStart;
                }
            }
        }
        if (this.localTypeCount > 0)
            this.methodDeclaration.bits |= 2;
        return this.methodDeclaration;
    }

    /*
     * Update the corresponding parse node from parser state which is about to disappear because of restarting recovery
     */
    @Override
    public void updateFromParserState() {
        // if parent is null then recovery already occured in diet parser.
        if (bodyStartsAtHeaderEnd() && this.parent != null) {
            Parser parser = parser();
            /* might want to recover arguments or thrown exceptions */
            if (parser.listLength > 0 && parser.astLengthPtr > 0) { // awaiting interface type references
                /* has consumed the arguments - listed elements must be thrown exceptions */
                if (this.methodDeclaration.sourceEnd == parser.rParenPos) {

                    // protection for bugs 15142
                    int length = parser.astLengthStack[parser.astLengthPtr];
                    int astPtr = parser.astPtr - length;
                    boolean canConsume = astPtr >= 0;
                    if (canConsume) {
                        if ((!(parser.astStack[astPtr] instanceof AbstractMethodDeclaration))) {
                            canConsume = false;
                        }
                        for (int i = 1, max = length + 1; i < max; i++) {
                            if (!(parser.astStack[astPtr + i] instanceof TypeReference)) {
                                canConsume = false;
                                break;
                            }
                        }
                    }
                    if (canConsume) {
                        parser.consumeMethodHeaderThrowsClause();
                        // will reset typeListLength to zero
                        // thus this check will only be performed on first errorCheck after void foo() throws X, Y,
                    } else {
                        parser.listLength = 0;
                    }
                } else {
                    /* has not consumed arguments yet, listed elements must be arguments */
                    if (parser.currentToken == TokenNameLPAREN || parser.currentToken == TokenNameSEMICOLON) {
                        /* if currentToken is parenthesis this last argument is a method/field signature */
                        parser.astLengthStack[parser.astLengthPtr]--;
                        parser.astPtr--;
                        parser.listLength--;
                        parser.currentToken = TerminalToken.TokenNameNotAToken;
                    }
                    int argLength = parser.astLengthStack[parser.astLengthPtr];
                    int argStart = parser.astPtr - argLength + 1;
                    boolean needUpdateRParenPos = parser.rParenPos < parser.lParenPos; // 12387 : rParenPos will be used

                    // remove unfinished annotation nodes
                    MemberValuePair[] memberValuePairs = null;
                    while (argLength > 0 && parser.astStack[parser.astPtr] instanceof MemberValuePair) {
                        System.arraycopy(parser.astStack, argStart, memberValuePairs = new MemberValuePair[argLength],
                            0, argLength);
                        parser.astLengthPtr--;
                        parser.astPtr -= argLength;

                        argLength = parser.astLengthStack[parser.astLengthPtr];
                        argStart = parser.astPtr - argLength + 1;
                        needUpdateRParenPos = true;
                    }

                    // to compute bodyStart, and thus used to set next checkpoint.
                    int count;
                    for (count = 0; count < argLength; count++) {
                        ASTNode aNode = parser.astStack[argStart + count];
                        if (aNode instanceof Argument argument) {
                            /* cannot be an argument if non final */
                            char[][] argTypeName = argument.type.getTypeName();
                            if ((argument.modifiers & ~16) != 0
                                || (argTypeName.length == 1
                                    && CharOperation.equals(argTypeName[0], TypeConstants.VOID))) {
                                parser.astLengthStack[parser.astLengthPtr] = count;
                                parser.astPtr = argStart + count - 1;
                                parser.listLength = count;
                                parser.currentToken = TerminalToken.TokenNameNotAToken;
                                break;
                            }
                            if (needUpdateRParenPos)
                                parser.rParenPos = argument.sourceEnd + 1;
                        } else {
                            parser.astLengthStack[parser.astLengthPtr] = count;
                            parser.astPtr = argStart + count - 1;
                            parser.listLength = count;
                            parser.currentToken = TerminalToken.TokenNameNotAToken;
                            break;
                        }
                    }
                    if (parser.listLength > 0 && parser.astLengthPtr > 0) {

                        // protection for bugs 15142
                        int length = parser.astLengthStack[parser.astLengthPtr];
                        int astPtr = parser.astPtr - length;
                        boolean canConsume = astPtr >= 0;
                        if (canConsume) {
                            if ((!(parser.astStack[astPtr] instanceof AbstractMethodDeclaration))) {
                                canConsume = false;
                            }
                            for (int i = 1, max = length + 1; i < max; i++) {
                                if (!(parser.astStack[astPtr + i] instanceof Argument)) {
                                    canConsume = false;
                                    break;
                                }
                            }
                        }
                        if (canConsume) {
                            parser.consumeMethodHeaderRightParen();
                            /* fix-up positions, given they were updated against rParenPos, which did not get set */
                            if (parser.currentElement == this) { // parameter addition might have added an awaiting (no
                                                                 // return type) method - see 1FVXQZ4 */
                                if (this.methodDeclaration.arguments != null) {
                                    this.methodDeclaration.sourceEnd
                                        = this.methodDeclaration.arguments[this.methodDeclaration.arguments.length
                                            - 1].sourceEnd;
                                } else {
                                    this.methodDeclaration.sourceEnd = this.methodDeclaration.receiver.sourceEnd;
                                }
                                this.methodDeclaration.bodyStart = this.methodDeclaration.sourceEnd + 1;
                                parser.lastCheckPoint = this.methodDeclaration.bodyStart;
                            }
                        }
                    }

                    if (memberValuePairs != null) {
                        System.arraycopy(memberValuePairs, 0, parser.astStack, parser.astPtr + 1,
                            memberValuePairs.length);
                        parser.astPtr += memberValuePairs.length;
                        parser.astLengthStack[++parser.astLengthPtr] = memberValuePairs.length;
                    }
                }
            }
        }
    }

    @Override
    public RecoveredElement updateOnClosingBrace(int braceStart, int braceEnd) {
        if (this.methodDeclaration.isAnnotationMethod()) {
            this.updateSourceEndIfNecessary(braceStart, braceEnd);
            if (!this.foundOpeningBrace && this.parent != null) {
                return this.parent.updateOnClosingBrace(braceStart, braceEnd);
            }
            return this;
        }
        if (this.parent != null && this.parent instanceof RecoveredType) {
            int mods = ((RecoveredType) this.parent).typeDeclaration.modifiers;
            if (TypeDeclaration.kind(mods) == 2) {
                if (!this.foundOpeningBrace) {
                    this.updateSourceEndIfNecessary(braceStart - 1, braceStart - 1);
                    return this.parent.updateOnClosingBrace(braceStart, braceEnd);
                }
            }
        }
        return super.updateOnClosingBrace(braceStart, braceEnd);
    }

    /*
     * An opening brace got consumed, might be the expected opening one of the current element, in which case the
     * bodyStart is updated.
     */
    @Override
    public RecoveredElement updateOnOpeningBrace(int braceStart, int braceEnd) {

        /* in case the opening brace is close enough to the signature */
        if (this.bracketBalance == 0) {
            /*
             * if (parser.scanner.searchLineNumber(methodDeclaration.sourceEnd) !=
             * parser.scanner.searchLineNumber(braceEnd)){
             */
            switch (parser().lastIgnoredToken) {
                case TokenNameInvalid:
                case TokenNamethrows:
                    break;

                default:
                    this.foundOpeningBrace = true;
                    this.bracketBalance = 1; // pretend the brace was already there
            }
        }
        return super.updateOnOpeningBrace(braceStart, braceEnd);
    }

    @Override
    public void updateParseTree() {
        updatedMethodDeclaration(0, new HashSet<>());
    }

    /*
     * Update the declarationSourceEnd of the corresponding parse node
     */
    @Override
    public void updateSourceEndIfNecessary(int braceStart, int braceEnd) {
        if (this.methodDeclaration.declarationSourceEnd == 0) {
            if (parser().rBraceSuccessorStart >= braceEnd) {
                this.methodDeclaration.declarationSourceEnd = parser().rBraceEnd;
                this.methodDeclaration.bodyEnd = parser().rBraceStart;
            } else {
                this.methodDeclaration.declarationSourceEnd = braceEnd;
                this.methodDeclaration.bodyEnd = braceStart - 1;
            }
        }
    }

    @Override
    public RecoveredElement addAnnotationName(int identifierPtr, int identifierLengthPtr, int annotationStart,
        int bracketBalanceValue) {
        if (this.pendingAnnotations == null) {
            this.pendingAnnotations = new RecoveredAnnotation[5];
            this.pendingAnnotationCount = 0;
        } else {
            if (this.pendingAnnotationCount > 0) {
                RecoveredAnnotation lastAnnot = this.pendingAnnotations[this.pendingAnnotationCount - 1];
                if (lastAnnot.sourceStart() == annotationStart)
                    return this;
            }
            if (this.pendingAnnotationCount == this.pendingAnnotations.length) {
                System.arraycopy(this.pendingAnnotations, 0,
                    (this.pendingAnnotations = new RecoveredAnnotation[2 * this.pendingAnnotationCount]), 0,
                    this.pendingAnnotationCount);
            }
        }

        RecoveredAnnotation element
            = new RecoveredAnnotation(identifierPtr, identifierLengthPtr, annotationStart, this, bracketBalanceValue);

        this.pendingAnnotations[this.pendingAnnotationCount++] = element;

        return element;
    }

    @Override
    public void addModifier(int flag, int modifiersSourceStart) {
        this.pendingModifiers |= flag;

        if (this.pendingModifersSourceStart < 0) {
            this.pendingModifersSourceStart = modifiersSourceStart;
        }
    }

    void attach(TypeParameter[] parameters, int startPos) {
        if (this.methodDeclaration.modifiers != 0)
            return;

        int lastParameterEnd = parameters[parameters.length - 1].sourceEnd;

        Parser parser = parser();
        Scanner scanner = parser.scanner;
        if (Util.getLineNumber(this.methodDeclaration.declarationSourceStart, scanner.lineEnds, scanner.linePtr)
            != Util.getLineNumber(lastParameterEnd, scanner.lineEnds, scanner.linePtr))
            return;

        if (parser.modifiersSourceStart > lastParameterEnd
            && parser.modifiersSourceStart < this.methodDeclaration.declarationSourceStart)
            return;

        if (this.methodDeclaration instanceof MethodDeclaration) {
            ((MethodDeclaration) this.methodDeclaration).typeParameters = parameters;
            this.methodDeclaration.declarationSourceStart = startPos;
        } else if (this.methodDeclaration instanceof ConstructorDeclaration) {
            ((ConstructorDeclaration) this.methodDeclaration).typeParameters = parameters;
            this.methodDeclaration.declarationSourceStart = startPos;
        }
    }

    public void attach(RecoveredAnnotation[] annots, int annotCount, int mods, int modsSourceStart) {
        if (annotCount > 0) {
            Annotation[] existingAnnotations = this.methodDeclaration.annotations;
            if (existingAnnotations != null) {
                this.annotations = new RecoveredAnnotation[annotCount];
                this.annotationCount = 0;
                next: for (int i = 0; i < annotCount; i++) {
                    for (Annotation existingAnnotation : existingAnnotations) {
                        if (annots[i].annotation == existingAnnotation)
                            continue next;
                    }
                    this.annotations[this.annotationCount++] = annots[i];
                }
            } else {
                this.annotations = annots;
                this.annotationCount = annotCount;
            }
        }

        if (mods != 0) {
            this.modifiers = mods;
            this.modifiersStart = modsSourceStart;
        }
    }
}
