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
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.TypeConstants;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Block;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Initializer;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration;
import java.util.Set;

public class RecoveredInitializer extends RecoveredField {

    public RecoveredType[] localTypes;
    public int localTypeCount;

    public RecoveredBlock initializerBody;

    int pendingModifiers;
    int pendingModifersSourceStart = -1;
    RecoveredAnnotation[] pendingAnnotations;
    int pendingAnnotationCount;

    public RecoveredInitializer(FieldDeclaration fieldDeclaration, RecoveredElement parent, int bracketBalance) {
        this(fieldDeclaration, parent, bracketBalance, null);
    }

    public RecoveredInitializer(FieldDeclaration fieldDeclaration, RecoveredElement parent, int bracketBalance,
        Parser parser) {
        super(fieldDeclaration, parent, bracketBalance, parser);
        this.foundOpeningBrace = true;
    }

    /*
     * Record a nested block declaration
     */
    @Override
    public RecoveredElement add(Block nestedBlockDeclaration, int bracketBalanceValue) {

        /*
         * default behavior is to delegate recording to parent if any, do not consider elements passed the known end (if
         * set) it must be belonging to an enclosing element
         */
        if (this.fieldDeclaration.declarationSourceEnd > 0
            && nestedBlockDeclaration.sourceStart > this.fieldDeclaration.declarationSourceEnd) {
            resetPendingModifiers();
            if (this.parent == null)
                return this; // ignore
            return this.parent.add(nestedBlockDeclaration, bracketBalanceValue);
        }
        /* consider that if the opening brace was not found, it is there */
        if (!this.foundOpeningBrace) {
            this.foundOpeningBrace = true;
            this.bracketBalance++;
        }
        if (this.initializerBody == null) {
            return this.initializerBody = new RecoveredBlock(nestedBlockDeclaration, this, bracketBalanceValue);
        }
        this.initializerBody.blockDeclaration.sourceEnd
            = 0; /* needed to allow adding more elements to the existing initializerBody */
        if (nestedBlockDeclaration.sourceEnd == 0)
            return this.initializerBody;
        return this.initializerBody.add(nestedBlockDeclaration, bracketBalanceValue, true);
    }

    /*
     * Record a field declaration (act like inside method body)
     */
    @Override
    public RecoveredElement add(FieldDeclaration newFieldDeclaration, int bracketBalanceValue) {
        resetPendingModifiers();

        /* local variables inside initializer can only be final and non void */
        char[][] fieldTypeName;
        if ((newFieldDeclaration.modifiers & ~16) != 0 /* local var can only be final */
            || (newFieldDeclaration.type == null) // initializer
            || ((fieldTypeName = newFieldDeclaration.type.getTypeName()).length == 1 // non void
                && CharOperation.equals(fieldTypeName[0], TypeConstants.VOID))) {
            if (this.parent == null)
                return this; // ignore
            this.updateSourceEndIfNecessary(previousAvailableLineEnd(newFieldDeclaration.declarationSourceStart - 1));
            return this.parent.add(newFieldDeclaration, bracketBalanceValue);
        }

        /*
         * default behavior is to delegate recording to parent if any, do not consider elements passed the known end (if
         * set) it must be belonging to an enclosing element
         */
        if (this.fieldDeclaration.declarationSourceEnd > 0
            && newFieldDeclaration.declarationSourceStart > this.fieldDeclaration.declarationSourceEnd) {
            if (this.parent == null)
                return this; // ignore
            return this.parent.add(newFieldDeclaration, bracketBalanceValue);
        }
        // still inside initializer, treat as local variable
        return this; // ignore
    }

    /*
     * Record a local declaration - regular method should have been created a block body
     */
    @Override
    public RecoveredElement add(LocalDeclaration localDeclaration, int bracketBalanceValue) {

        /*
         * do not consider a type starting passed the type end (if set) it must be belonging to an enclosing type
         */
        if (this.fieldDeclaration.declarationSourceEnd != 0
            && localDeclaration.declarationSourceStart > this.fieldDeclaration.declarationSourceEnd) {
            resetPendingModifiers();
            if (this.parent == null)
                return this; // ignore
            return this.parent.add(localDeclaration, bracketBalanceValue);
        }
        /* method body should have been created */
        if (this.initializerBody == null) {
            Block block = new Block(0);
            block.sourceStart = this.fieldDeclaration.sourceStart;
            RecoveredElement element = this.add(block, 1);
            if (this.bracketBalance > 0) {
                for (int i = 0; i < this.bracketBalance - 1; i++) {
                    element = element.add(new Block(0), 1);
                }
                this.bracketBalance = 1;
            }
            return element.add(localDeclaration, bracketBalanceValue);
        }
        this.initializerBody.attachPendingModifiers(this.pendingAnnotations, this.pendingAnnotationCount,
            this.pendingModifiers, this.pendingModifersSourceStart);
        resetPendingModifiers();

        return this.initializerBody.add(localDeclaration, bracketBalanceValue, true);
    }

    /*
     * Record a statement - regular method should have been created a block body
     */
    @Override
    public RecoveredElement add(Statement statement, int bracketBalanceValue) {

        /*
         * do not consider a statement starting passed the initializer end (if set) it must be belonging to an enclosing
         * type
         */
        if (this.fieldDeclaration.declarationSourceEnd != 0
            && statement.sourceStart > this.fieldDeclaration.declarationSourceEnd) {
            resetPendingModifiers();
            if (this.parent == null)
                return this; // ignore
            return this.parent.add(statement, bracketBalanceValue);
        }
        /* initializer body should have been created */
        Block block = new Block(0);
        block.sourceStart = this.fieldDeclaration.sourceStart;
        RecoveredElement element = this.add(block, 1);

        if (this.initializerBody != null) {
            this.initializerBody.attachPendingModifiers(this.pendingAnnotations, this.pendingAnnotationCount,
                this.pendingModifiers, this.pendingModifersSourceStart);
        }
        resetPendingModifiers();

        return element.add(statement, bracketBalanceValue);
    }

    @Override
    public RecoveredElement add(TypeDeclaration typeDeclaration, int bracketBalanceValue) {

        /*
         * do not consider a type starting passed the type end (if set) it must be belonging to an enclosing type
         */
        if (this.fieldDeclaration.declarationSourceEnd != 0
            && typeDeclaration.declarationSourceStart > this.fieldDeclaration.declarationSourceEnd) {
            resetPendingModifiers();
            if (this.parent == null)
                return this; // ignore
            return this.parent.add(typeDeclaration, bracketBalanceValue);
        }
        if ((typeDeclaration.bits & 256) != 0
            || parser().methodRecoveryActivated
            || parser().statementRecoveryActivated) {
            /* method body should have been created */
            Block block = new Block(0);
            block.sourceStart = this.fieldDeclaration.sourceStart;
            RecoveredElement element = this.add(block, 1);
            if (this.initializerBody != null) {
                this.initializerBody.attachPendingModifiers(this.pendingAnnotations, this.pendingAnnotationCount,
                    this.pendingModifiers, this.pendingModifersSourceStart);
            }
            resetPendingModifiers();
            return element.add(typeDeclaration, bracketBalanceValue);
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

    @Override
    public RecoveredElement addAnnotationName(int identifierPtr, int identifierLengthPtr, int annotationStart,
        int bracketBalanceValue) {
        if (this.pendingAnnotations == null) {
            this.pendingAnnotations = new RecoveredAnnotation[5];
            this.pendingAnnotationCount = 0;
        } else {
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

    @Override
    public void resetPendingModifiers() {
        this.pendingAnnotations = null;
        this.pendingAnnotationCount = 0;
        this.pendingModifiers = 0;
        this.pendingModifersSourceStart = -1;
    }

    @Override
    public FieldDeclaration updatedFieldDeclaration(int depth, Set<TypeDeclaration> knownTypes) {
        if (this.initializerBody != null) {
            Block block = this.initializerBody.updatedBlock(depth, knownTypes);
            if (block != null) {
                Initializer initializer = (Initializer) this.fieldDeclaration;
                initializer.block = block;

                if (initializer.declarationSourceEnd == 0) {
                    initializer.declarationSourceEnd = block.sourceEnd;
                    initializer.bodyEnd = block.sourceEnd;
                }
            }
            if (this.localTypeCount > 0)
                this.fieldDeclaration.bits |= 2;
        }
        if (this.fieldDeclaration.sourceEnd == 0) {
            this.fieldDeclaration.sourceEnd = this.fieldDeclaration.declarationSourceEnd;
        }
        return this.fieldDeclaration;
    }

    /*
     * A closing brace got consumed, might have closed the current element, in which case both the currentElement is
     * exited
     */
    @Override
    public RecoveredElement updateOnClosingBrace(int braceStart, int braceEnd) {
        if ((--this.bracketBalance <= 0) && (this.parent != null)) {
            this.updateSourceEndIfNecessary(braceStart, braceEnd);
            return this.parent;
        }
        return this;
    }

    /*
     * An opening brace got consumed, might be the expected opening one of the current element, in which case the
     * bodyStart is updated.
     */
    @Override
    public RecoveredElement updateOnOpeningBrace(int braceStart, int braceEnd) {
        this.bracketBalance++;
        return this; // request to restart
    }

    /*
     * Update the declarationSourceEnd of the corresponding parse node
     */
    @Override
    public void updateSourceEndIfNecessary(int braceStart, int braceEnd) {
        if (this.fieldDeclaration.declarationSourceEnd == 0) {
            Initializer initializer = (Initializer) this.fieldDeclaration;
            if (parser().rBraceSuccessorStart >= braceEnd) {
                initializer.declarationSourceEnd = Math.max(initializer.bodyStart, parser().rBraceEnd);
                initializer.bodyEnd = Math.max(initializer.bodyStart, parser().rBraceStart);
            } else {
                if (braceEnd < initializer.declarationSourceStart) {
                    initializer.declarationSourceEnd = initializer.declarationSourceStart;
                    initializer.bodyEnd = initializer.declarationSourceEnd;
                } else {
                    initializer.declarationSourceEnd = braceEnd;
                    initializer.bodyEnd = braceStart - 1;
                }
                if (initializer.bodyStart > initializer.declarationSourceEnd) {
                    initializer.bodyStart = initializer.declarationSourceEnd;
                    if (initializer.block != null) {
                        initializer.block.sourceStart = initializer.declarationSourceStart;
                    }
                }
            }
            if (initializer.block != null) {
                initializer.block.sourceEnd = initializer.declarationSourceEnd;
            }
        }
    }
}
