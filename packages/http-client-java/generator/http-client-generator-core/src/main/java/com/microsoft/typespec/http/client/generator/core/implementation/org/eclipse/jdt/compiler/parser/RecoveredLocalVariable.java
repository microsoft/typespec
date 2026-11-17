// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2013 IBM Corporation and others.
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

/**
 * Internal local variable structure for parsing recovery
 */
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ArrayQualifiedTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ArrayTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement;
import java.util.HashSet;
import java.util.Set;

@SuppressWarnings("rawtypes")
public class RecoveredLocalVariable extends RecoveredStatement {

    public RecoveredAnnotation[] annotations;
    public int annotationCount;
    public int modifiers;
    public int modifiersStart;

    public LocalDeclaration localDeclaration;
    public boolean alreadyCompletedLocalInitialization;

    public RecoveredLocalVariable(LocalDeclaration localDeclaration, RecoveredElement parent, int bracketBalance) {
        super(localDeclaration, parent, bracketBalance);
        this.localDeclaration = localDeclaration;
        this.alreadyCompletedLocalInitialization = localDeclaration.initialization != null;
    }

    /*
     * Record an expression statement if local variable is expecting an initialization expression.
     */
    @Override
    public RecoveredElement add(Statement stmt, int bracketBalanceValue) {
        if (this.alreadyCompletedLocalInitialization || !(stmt instanceof Expression && stmt.isTrulyExpression())) {
            return super.add(stmt, bracketBalanceValue);
        } else {
            this.alreadyCompletedLocalInitialization = true;
            this.localDeclaration.initialization = (Expression) stmt;
            this.localDeclaration.declarationSourceEnd = stmt.sourceEnd;
            this.localDeclaration.declarationEnd = stmt.sourceEnd;
            return this;
        }
    }

    public void attach(RecoveredAnnotation[] annots, int annotCount, int mods, int modsSourceStart) {
        if (annotCount > 0) {
            Annotation[] existingAnnotations = this.localDeclaration.annotations;
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

    /*
     * Answer the associated parsed structure
     */
    @Override
    public ASTNode parseTree() {
        return this.localDeclaration;
    }

    @Override
    public Statement updatedStatement(int depth, Set knownTypes) {
        /* update annotations */
        if (this.modifiers != 0) {
            this.localDeclaration.modifiers |= this.modifiers;
            if (this.modifiersStart < this.localDeclaration.declarationSourceStart) {
                this.localDeclaration.declarationSourceStart = this.modifiersStart;
            }
        }
        /* update annotations */
        if (this.annotationCount > 0) {
            int existingCount
                = this.localDeclaration.annotations == null ? 0 : this.localDeclaration.annotations.length;
            Annotation[] annotationReferences = new Annotation[existingCount + this.annotationCount];
            if (existingCount > 0) {
                System.arraycopy(this.localDeclaration.annotations, 0, annotationReferences, this.annotationCount,
                    existingCount);
            }
            for (int i = 0; i < this.annotationCount; i++) {
                annotationReferences[i] = this.annotations[i].updatedAnnotationReference();
            }
            this.localDeclaration.annotations = annotationReferences;

            int start = this.annotations[0].annotation.sourceStart;
            if (start < this.localDeclaration.declarationSourceStart) {
                this.localDeclaration.declarationSourceStart = start;
            }
        }
        return this.localDeclaration;
    }

    /*
     * A closing brace got consumed, might have closed the current element, in which case both the currentElement is
     * exited.
     *
     * Fields have no associated braces, thus if matches, then update parent.
     */
    @Override
    public RecoveredElement updateOnClosingBrace(int braceStart, int braceEnd) {
        if (this.bracketBalance > 0) { // was an array initializer
            this.bracketBalance--;
            if (this.bracketBalance == 0)
                this.alreadyCompletedLocalInitialization = true;
            return this;
        }
        if (this.parent != null) {
            return this.parent.updateOnClosingBrace(braceStart, braceEnd);
        }
        return this;
    }

    /*
     * An opening brace got consumed, might be the expected opening one of the current element, in which case the
     * bodyStart is updated.
     */
    @Override
    public RecoveredElement updateOnOpeningBrace(int braceStart, int braceEnd) {
        if (this.localDeclaration.declarationSourceEnd == 0
            && (this.localDeclaration.type instanceof ArrayTypeReference
                || this.localDeclaration.type instanceof ArrayQualifiedTypeReference)
            && !this.alreadyCompletedLocalInitialization) {
            this.bracketBalance++;
            return null; // no update is necessary (array initializer)
        }
        // might be an array initializer
        this.updateSourceEndIfNecessary(braceStart - 1, braceEnd - 1);
        return this.parent.updateOnOpeningBrace(braceStart, braceEnd);
    }

    @Override
    public void updateParseTree() {
        updatedStatement(0, new HashSet());
    }

    /*
     * Update the declarationSourceEnd of the corresponding parse node
     */
    @Override
    public void updateSourceEndIfNecessary(int bodyStart, int bodyEnd) {
        if (this.localDeclaration.declarationSourceEnd == 0) {
            this.localDeclaration.declarationSourceEnd = bodyEnd;
            this.localDeclaration.declarationEnd = bodyEnd;
        }
    }
}
