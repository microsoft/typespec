// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2017 IBM Corporation and others.
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

/**
 * Internal field structure for parsing recovery
 */
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.*;
import java.util.HashSet;
import java.util.Set;

public class RecoveredField extends RecoveredElement {

    public FieldDeclaration fieldDeclaration;
    boolean alreadyCompletedFieldInitialization;

    public RecoveredAnnotation[] annotations;
    public int annotationCount;

    public int modifiers;
    public int modifiersStart;

    public RecoveredType[] anonymousTypes;
    public int anonymousTypeCount;

    public RecoveredField(FieldDeclaration fieldDeclaration, RecoveredElement parent, int bracketBalance) {
        this(fieldDeclaration, parent, bracketBalance, null);
    }

    public RecoveredField(FieldDeclaration fieldDeclaration, RecoveredElement parent, int bracketBalance,
        Parser parser) {
        super(parent, bracketBalance, parser);
        this.fieldDeclaration = fieldDeclaration;
        this.alreadyCompletedFieldInitialization = fieldDeclaration.initialization != null;
    }

    /*
     * Record a local declaration
     */
    @Override
    public RecoveredElement add(LocalDeclaration localDeclaration, int bracketBalanceValue) {
        if (this.lambdaNestLevel > 0) // current element is really the lambda which is recovered in full elsewhere.
            return this;
        return super.add(localDeclaration, bracketBalanceValue);
    }

    /*
     * Record a field declaration
     */
    @Override
    public RecoveredElement add(FieldDeclaration addedfieldDeclaration, int bracketBalanceValue) {

        /* default behavior is to delegate recording to parent if any */
        resetPendingModifiers();
        if (this.parent == null)
            return this; // ignore

        if (this.fieldDeclaration.declarationSourceStart == addedfieldDeclaration.declarationSourceStart) {
            if (this.fieldDeclaration.initialization != null) {
                this.updateSourceEndIfNecessary(this.fieldDeclaration.initialization.sourceEnd);
            } else {
                this.updateSourceEndIfNecessary(this.fieldDeclaration.sourceEnd);
            }
        } else {
            this.updateSourceEndIfNecessary(previousAvailableLineEnd(addedfieldDeclaration.declarationSourceStart - 1));
        }
        return this.parent.add(addedfieldDeclaration, bracketBalanceValue);
    }

    /*
     * Record an expression statement if field is expecting an initialization expression, used for completion inside
     * field initializers.
     */
    @Override
    public RecoveredElement add(Statement statement, int bracketBalanceValue) {
        if (this.alreadyCompletedFieldInitialization
            || !(statement instanceof Expression && ((Expression) statement).isTrulyExpression())) {
            return super.add(statement, bracketBalanceValue);
        } else {
            if (statement.sourceEnd > 0)
                this.alreadyCompletedFieldInitialization = true;
            // else we may still be inside the initialization, having parsed only a part of it yet
            if (!(statement instanceof AllocationExpression) && this.fieldDeclaration.getKind() == 3) {
                AllocationExpression alloc = new AllocationExpression();
                alloc.arguments = new Expression[] { (Expression) statement };
                this.fieldDeclaration.initialization = alloc;
            } else {
                this.fieldDeclaration.initialization = (Expression) statement;
                this.fieldDeclaration.declarationSourceEnd = statement.sourceEnd;
                this.fieldDeclaration.declarationEnd = statement.sourceEnd;
            }
            return this;
        }
    }

    /*
     * Record a type declaration if this field is expecting an initialization expression and the type is an anonymous
     * type. Used for completion inside field initializers.
     */
    @Override
    public RecoveredElement add(TypeDeclaration typeDeclaration, int bracketBalanceValue) {
        if (this.alreadyCompletedFieldInitialization
            || ((typeDeclaration.bits & 512) == 0)
            || (this.fieldDeclaration.declarationSourceEnd != 0
                && typeDeclaration.sourceStart > this.fieldDeclaration.declarationSourceEnd)) {
            return super.add(typeDeclaration, bracketBalanceValue);
        } else {
            // Prepare anonymous type list
            if (this.anonymousTypes == null) {
                this.anonymousTypes = new RecoveredType[5];
                this.anonymousTypeCount = 0;
            } else {
                if (this.anonymousTypeCount == this.anonymousTypes.length) {
                    System.arraycopy(this.anonymousTypes, 0,
                        (this.anonymousTypes = new RecoveredType[2 * this.anonymousTypeCount]), 0,
                        this.anonymousTypeCount);
                }
            }
            // Store type declaration as an anonymous type
            RecoveredType element = new RecoveredType(typeDeclaration, this, bracketBalanceValue);
            this.anonymousTypes[this.anonymousTypeCount++] = element;
            return element;
        }
    }

    public void attach(RecoveredAnnotation[] annots, int annotCount, int mods, int modsSourceStart) {
        if (annotCount > 0) {
            Annotation[] existingAnnotations = this.fieldDeclaration.annotations;
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
        return this.fieldDeclaration;
    }

    /*
     * Answer the very source end of the corresponding parse node
     */
    @Override
    public String toString(int tab) {
        StringBuilder buffer = new StringBuilder(tabString(tab));
        buffer.append("Recovered field:\n"); //$NON-NLS-1$
        this.fieldDeclaration.print(tab + 1, buffer);
        if (this.annotations != null) {
            for (int i = 0; i < this.annotationCount; i++) {
                buffer.append("\n"); //$NON-NLS-1$
                buffer.append(this.annotations[i].toString(tab + 1));
            }
        }
        if (this.anonymousTypes != null) {
            for (int i = 0; i < this.anonymousTypeCount; i++) {
                buffer.append("\n"); //$NON-NLS-1$
                buffer.append(this.anonymousTypes[i].toString(tab + 1));
            }
        }
        return buffer.toString();
    }

    public FieldDeclaration updatedFieldDeclaration(int depth, Set<TypeDeclaration> knownTypes) {
        /* update annotations */
        if (this.modifiers != 0) {
            this.fieldDeclaration.modifiers |= this.modifiers;
            if (this.modifiersStart < this.fieldDeclaration.declarationSourceStart) {
                this.fieldDeclaration.declarationSourceStart = this.modifiersStart;
            }
        }
        /* update annotations */
        if (this.annotationCount > 0) {
            int existingCount
                = this.fieldDeclaration.annotations == null ? 0 : this.fieldDeclaration.annotations.length;
            Annotation[] annotationReferences = new Annotation[existingCount + this.annotationCount];
            if (existingCount > 0) {
                System.arraycopy(this.fieldDeclaration.annotations, 0, annotationReferences, this.annotationCount,
                    existingCount);
            }
            for (int i = 0; i < this.annotationCount; i++) {
                annotationReferences[i] = this.annotations[i].updatedAnnotationReference();
            }
            this.fieldDeclaration.annotations = annotationReferences;

            int start = this.annotations[0].annotation.sourceStart;
            if (start < this.fieldDeclaration.declarationSourceStart) {
                this.fieldDeclaration.declarationSourceStart = start;
            }
        }

        if (this.anonymousTypes != null) {
            if (this.fieldDeclaration.initialization == null) {
                ArrayInitializer recoveredInitializers = null;
                int recoveredInitializersCount = 0;
                if (this.anonymousTypeCount > 1) {
                    recoveredInitializers = new ArrayInitializer();
                    recoveredInitializers.expressions = new Expression[this.anonymousTypeCount];
                }
                for (int i = 0; i < this.anonymousTypeCount; i++) {
                    RecoveredType recoveredType = this.anonymousTypes[i];
                    TypeDeclaration typeDeclaration = recoveredType.typeDeclaration;
                    if (typeDeclaration.declarationSourceEnd == 0) {
                        typeDeclaration.declarationSourceEnd = this.fieldDeclaration.declarationSourceEnd;
                        typeDeclaration.bodyEnd = this.fieldDeclaration.declarationSourceEnd;
                    }
                    if (recoveredType.preserveContent) {
                        TypeDeclaration anonymousType = recoveredType.updatedTypeDeclaration(depth + 1, knownTypes);
                        if (anonymousType != null) {
                            if (this.anonymousTypeCount > 1) {
                                if (recoveredInitializersCount == 0) {
                                    this.fieldDeclaration.initialization = recoveredInitializers;
                                }
                                recoveredInitializers.expressions[recoveredInitializersCount++]
                                    = anonymousType.allocation;
                            } else {
                                this.fieldDeclaration.initialization = anonymousType.allocation;
                            }
                            int end = anonymousType.declarationSourceEnd;
                            if (end > this.fieldDeclaration.declarationSourceEnd) { // https://bugs.eclipse.org/bugs/show_bug.cgi?id=307337
                                this.fieldDeclaration.declarationSourceEnd = end;
                                this.fieldDeclaration.declarationEnd = end;
                            }
                        }
                    }
                }
                if (this.anonymousTypeCount > 0) {
                    this.fieldDeclaration.bits |= 2;
                    if (recoveredInitializers != null) {
                        recoveredInitializers.sourceStart = this.anonymousTypes[0].typeDeclaration.sourceStart;
                        recoveredInitializers.sourceEnd
                            = this.anonymousTypes[this.anonymousTypeCount - 1].typeDeclaration.sourceEnd;
                    }
                }
            } else if (this.fieldDeclaration.getKind() == 3) {
                // fieldDeclaration is an enum constant
                for (int i = 0; i < this.anonymousTypeCount; i++) {
                    RecoveredType recoveredType = this.anonymousTypes[i];
                    TypeDeclaration typeDeclaration = recoveredType.typeDeclaration;
                    if (typeDeclaration.declarationSourceEnd == 0) {
                        typeDeclaration.declarationSourceEnd = this.fieldDeclaration.declarationSourceEnd;
                        typeDeclaration.bodyEnd = this.fieldDeclaration.declarationSourceEnd;
                    }
                    // if the enum is recovered then enum constants must be recovered too.
                    // depth is considered as the same as the depth of the enum
                    recoveredType.updatedTypeDeclaration(depth, knownTypes);
                }
            }
        }
        return this.fieldDeclaration;
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
            if (this.bracketBalance == 0) {
                if (this.fieldDeclaration.getKind() == 3) {
                    updateSourceEndIfNecessary(braceEnd);
                    return this.parent;
                } else {
                    if (this.fieldDeclaration.declarationSourceEnd > 0)
                        this.alreadyCompletedFieldInitialization = true;
                }
            }
            return this;
        } else if (this.bracketBalance == 0) {
            this.alreadyCompletedFieldInitialization = true;
            updateSourceEndIfNecessary(braceEnd - 1);
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
        if (this.fieldDeclaration.declarationSourceEnd == 0) {
            if (this.fieldDeclaration.type instanceof ArrayTypeReference
                || this.fieldDeclaration.type instanceof ArrayQualifiedTypeReference) {
                if (!this.alreadyCompletedFieldInitialization) {
                    this.bracketBalance++;
                    return null; // no update is necessary (array initializer)
                }
            } else {  // https://bugs.eclipse.org/bugs/show_bug.cgi?id=308980
                // in case an initializer bracket is opened in a non-array field
                // e.g. int field = {..
                this.bracketBalance++;
                return null; // no update is necessary (array initializer)
            }
        }
        if (this.fieldDeclaration.declarationSourceEnd == 0 && this.fieldDeclaration.getKind() == 3) {
            this.bracketBalance++;
            return null; // no update is necessary (enum constant)
        }
        // might be an array initializer
        this.updateSourceEndIfNecessary(braceStart - 1, braceEnd - 1);
        return this.parent.updateOnOpeningBrace(braceStart, braceEnd);
    }

    @Override
    public void updateParseTree() {
        updatedFieldDeclaration(0, new HashSet<>());
    }

    /*
     * Update the declarationSourceEnd of the corresponding parse node
     */
    @Override
    public void updateSourceEndIfNecessary(int bodyStart, int bodyEnd) {
        if (this.fieldDeclaration.declarationSourceEnd == 0) {
            this.fieldDeclaration.declarationSourceEnd = bodyEnd;
            this.fieldDeclaration.declarationEnd = bodyEnd;
        }
    }
}
