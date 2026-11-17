// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2015 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.TypeConstants;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractMethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Argument;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Block;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ForeachStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.LocalDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Statement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration;
import java.util.HashSet;
import java.util.Set;

public class RecoveredBlock extends RecoveredStatement {

    public Block blockDeclaration;
    public RecoveredStatement[] statements;
    public int statementCount;
    public boolean preserveContent;
    public RecoveredLocalVariable pendingArgument;

    int pendingModifiers;
    int pendingModifersSourceStart = -1;
    RecoveredAnnotation[] pendingAnnotations;
    int pendingAnnotationCount;

    public RecoveredBlock(Block block, RecoveredElement parent, int bracketBalance) {
        super(block, parent, bracketBalance);
        this.blockDeclaration = block;
        this.foundOpeningBrace = true;

        this.preserveContent = parser().methodRecoveryActivated || parser().statementRecoveryActivated;
    }

    @Override
    public RecoveredElement add(AbstractMethodDeclaration methodDeclaration, int bracketBalanceValue) {
        if (this.parent != null && this.parent instanceof RecoveredMethod enclosingRecoveredMethod) {
            if (enclosingRecoveredMethod.methodBody == this && enclosingRecoveredMethod.parent == null) {
                resetPendingModifiers();
                // the element cannot be added because we are in the body of a top level method
                return this; // ignore this element
            }
        }
        return super.add(methodDeclaration, bracketBalanceValue);
    }

    /*
     * Record a nested block declaration
     */
    @Override
    public RecoveredElement add(Block nestedBlockDeclaration, int bracketBalanceValue) {
        resetPendingModifiers();

        /*
         * do not consider a nested block starting passed the block end (if set) it must be belonging to an enclosing
         * block
         */
        if (this.blockDeclaration.sourceEnd != 0
            && nestedBlockDeclaration.sourceStart > this.blockDeclaration.sourceEnd) {
            return this.parent.add(nestedBlockDeclaration, bracketBalanceValue);
        }

        RecoveredBlock element = new RecoveredBlock(nestedBlockDeclaration, this, bracketBalanceValue);

        // if we have a pending Argument, promote it into the new block
        if (this.pendingArgument != null) {
            element.attach(this.pendingArgument);
            this.pendingArgument = null;
        }
        if (parser().statementRecoveryActivated) {
            addBlockStatement(element);
        }
        attach(element);
        if (nestedBlockDeclaration.sourceEnd == 0)
            return element;
        return this;
    }

    /*
     * Record a local declaration
     */
    @Override
    public RecoveredElement add(LocalDeclaration localDeclaration, int bracketBalanceValue) {
        return this.add(localDeclaration, bracketBalanceValue, false);
    }

    /*
     * Record a local declaration
     */
    public RecoveredElement add(LocalDeclaration localDeclaration, int bracketBalanceValue, boolean delegatedByParent) {
        /*
         * do not consider a local variable starting passed the block end (if set) it must be belonging to an enclosing
         * block
         */
        if (this.blockDeclaration.sourceEnd != 0
            && localDeclaration.declarationSourceStart > this.blockDeclaration.sourceEnd) {
            resetPendingModifiers();
            if (delegatedByParent)
                return this; // ignore
            return this.parent.add(localDeclaration, bracketBalanceValue);
        }

        RecoveredLocalVariable element = new RecoveredLocalVariable(localDeclaration, this, bracketBalanceValue);

        if (this.pendingAnnotationCount > 0) {
            element.attach(this.pendingAnnotations, this.pendingAnnotationCount, this.pendingModifiers,
                this.pendingModifersSourceStart);
        }
        resetPendingModifiers();

        if (localDeclaration instanceof Argument) {
            this.pendingArgument = element;
            return this;
        }

        attach(element);
        if (localDeclaration.declarationSourceEnd == 0)
            return element;
        return this;
    }

    /*
     * Record a statement declaration
     */
    @Override
    public RecoveredElement add(Statement stmt, int bracketBalanceValue) {
        return this.add(stmt, bracketBalanceValue, false);
    }

    /*
     * Record a statement declaration
     */
    public RecoveredElement add(Statement stmt, int bracketBalanceValue, boolean delegatedByParent) {
        resetPendingModifiers();

        /*
         * do not consider a nested block starting passed the block end (if set) it must be belonging to an enclosing
         * block
         */
        if (this.blockDeclaration.sourceEnd != 0 && stmt.sourceStart > this.blockDeclaration.sourceEnd) {
            if (delegatedByParent)
                return this; // ignore
            return this.parent.add(stmt, bracketBalanceValue);
        }

        RecoveredStatement element = new RecoveredStatement(stmt, this, bracketBalanceValue);
        attach(element);
        if (!isEndKnown(stmt))
            return element;
        return this;
    }

    boolean isEndKnown(Statement stmt) {
        if (stmt instanceof ForeachStatement) {
            if (((ForeachStatement) stmt).action == null)
                return false;
        }
        return stmt.sourceEnd != 0;
    }

    /*
     * Addition of a type to an initializer (act like inside method body)
     */
    @Override
    public RecoveredElement add(TypeDeclaration typeDeclaration, int bracketBalanceValue) {
        return this.add(typeDeclaration, bracketBalanceValue, false);
    }

    /*
     * Addition of a type to an initializer (act like inside method body)
     */
    public RecoveredElement add(TypeDeclaration typeDeclaration, int bracketBalanceValue, boolean delegatedByParent) {

        /*
         * do not consider a type starting passed the block end (if set) it must be belonging to an enclosing block
         */
        if (this.blockDeclaration.sourceEnd != 0
            && typeDeclaration.declarationSourceStart > this.blockDeclaration.sourceEnd) {
            resetPendingModifiers();
            if (delegatedByParent)
                return this; // ignore
            return this.parent.add(typeDeclaration, bracketBalanceValue);
        }

        RecoveredType element = new RecoveredType(typeDeclaration, this, bracketBalanceValue);
        if (this.pendingAnnotationCount > 0) {
            element.attach(this.pendingAnnotations, this.pendingAnnotationCount, this.pendingModifiers,
                this.pendingModifersSourceStart);
        }
        resetPendingModifiers();
        attach(element);
        if (typeDeclaration.declarationSourceEnd == 0)
            return element;
        return this;
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

    /*
     * Attach a recovered statement
     */
    void attach(RecoveredStatement recoveredStatement) {
        if (this.statements == null) {
            this.statements = new RecoveredStatement[5];
            this.statementCount = 0;
        } else {
            if (this.statementCount == this.statements.length) {
                System.arraycopy(this.statements, 0,
                    (this.statements = new RecoveredStatement[2 * this.statementCount]), 0, this.statementCount);
            }
        }
        this.statements[this.statementCount++] = recoveredStatement;
    }

    void attachPendingModifiers(RecoveredAnnotation[] pendingAnnots, int pendingAnnotCount, int pendingMods,
        int pendingModsSourceStart) {
        this.pendingAnnotations = pendingAnnots;
        this.pendingAnnotationCount = pendingAnnotCount;
        this.pendingModifiers = pendingMods;
        this.pendingModifersSourceStart = pendingModsSourceStart;
    }

    /*
     * Answer the associated parsed structure
     */
    @Override
    public ASTNode parseTree() {
        return this.blockDeclaration;
    }

    @Override
    public void resetPendingModifiers() {
        this.pendingAnnotations = null;
        this.pendingAnnotationCount = 0;
        this.pendingModifiers = 0;
        this.pendingModifersSourceStart = -1;
    }

    /*
     * Rebuild a block from the nested structure which is in scope
     */
    public Block updatedBlock(int depth, Set<TypeDeclaration> knownTypes) {

        // if block was not marked to be preserved or empty, then ignore it
        if (!this.preserveContent || this.statementCount == 0)
            return null;

        Statement[] updatedStatements = new Statement[this.statementCount];
        int updatedCount = 0;

        // may need to update the end of the last statement
        RecoveredStatement lastStatement = this.statements[this.statementCount - 1];
        RecoveredMethod enclosingMethod = enclosingMethod();
        RecoveredInitializer enclosingIntializer = enclosingInitializer();
        int bodyEndValue;
        if (enclosingMethod != null) {
            bodyEndValue = enclosingMethod.methodDeclaration.bodyEnd;
            if (enclosingIntializer != null
                && enclosingMethod.methodDeclaration.sourceStart < enclosingIntializer.fieldDeclaration.sourceStart) {
                bodyEndValue = enclosingIntializer.fieldDeclaration.declarationSourceEnd;
            }
        } else if (enclosingIntializer != null) {
            bodyEndValue = enclosingIntializer.fieldDeclaration.declarationSourceEnd;
        } else {
            bodyEndValue = this.blockDeclaration.sourceEnd - 1;
        }

        if (lastStatement instanceof RecoveredLocalVariable lastLocalVariable) {
            if (lastLocalVariable.localDeclaration.declarationSourceEnd == 0) {
                lastLocalVariable.localDeclaration.declarationSourceEnd = bodyEndValue;
                lastLocalVariable.localDeclaration.declarationEnd = bodyEndValue;
            }
        } else if (lastStatement instanceof RecoveredBlock lastBlock) {
            if (lastBlock.blockDeclaration.sourceEnd == 0) {
                lastBlock.blockDeclaration.sourceEnd = bodyEndValue;
            }
        } else if (!(lastStatement instanceof RecoveredType)) {
            if (lastStatement.statement.sourceEnd == 0) {
                lastStatement.statement.sourceEnd = bodyEndValue;
            }
        }

        int lastEnd = this.blockDeclaration.sourceStart;

        // only collect the non-null updated statements
        next: for (int i = 0; i < this.statementCount; i++) {
            Statement updatedStatement = this.statements[i].updatedStatement(depth, knownTypes);
            if (updatedStatement != null) {
                for (int j = 0; j < i; j++) {
                    if (updatedStatements[j]instanceof LocalDeclaration local) {
                        if (local.initialization != null) {
                            if (updatedStatement.sourceStart >= local.initialization.sourceStart
                                && updatedStatement.sourceEnd <= local.initialization.sourceEnd)
                                continue next;
                        }
                    }
                }
                updatedStatements[updatedCount++] = updatedStatement;

                if (updatedStatement instanceof LocalDeclaration localDeclaration) {
                    if (localDeclaration.declarationSourceEnd > lastEnd) {
                        lastEnd = localDeclaration.declarationSourceEnd;
                    }
                } else if (updatedStatement instanceof TypeDeclaration typeDeclaration) {
                    if (typeDeclaration.declarationSourceEnd > lastEnd) {
                        lastEnd = typeDeclaration.declarationSourceEnd;
                    }
                } else {
                    if (updatedStatement.sourceEnd > lastEnd) {
                        lastEnd = updatedStatement.sourceEnd;
                    }
                }
            }
        }
        if (updatedCount == 0)
            return null; // not interesting block

        // resize statement collection if necessary
        if (updatedCount != this.statementCount) {
            this.blockDeclaration.statements = new Statement[updatedCount];
            System.arraycopy(updatedStatements, 0, this.blockDeclaration.statements, 0, updatedCount);
        } else {
            this.blockDeclaration.statements = updatedStatements;
        }

        if (this.blockDeclaration.sourceEnd == 0) {
            this.blockDeclaration.sourceEnd = Math.max(lastEnd, bodyEndValue);
        }

        return this.blockDeclaration;
    }

    /*
     * Rebuild a statement from the nested structure which is in scope
     */
    @Override
    public Statement updatedStatement(int depth, Set<TypeDeclaration> knownTypes) {
        return updatedBlock(depth, knownTypes);
    }

    /*
     * A closing brace got consumed, might have closed the current element, in which case both the currentElement is
     * exited
     */
    @Override
    public RecoveredElement updateOnClosingBrace(int braceStart, int braceEnd) {
        if ((--this.bracketBalance <= 0) && (this.parent != null)) {
            this.updateSourceEndIfNecessary(braceStart, braceEnd);

            /* if the block is the method body, then it closes the method too */
            RecoveredMethod method = enclosingMethod();
            if (method != null && method.methodBody == this) {
                return this.parent.updateOnClosingBrace(braceStart, braceEnd);
            }
            RecoveredInitializer initializer = enclosingInitializer();
            if (initializer != null && initializer.initializerBody == this) {
                return this.parent.updateOnClosingBrace(braceStart, braceEnd);
            }
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

        // create a nested block
        Block block = new Block(0);
        block.sourceStart = parser().scanner.startPosition;
        return this.add(block, 1);
    }

    /*
     * Final update the corresponding parse node
     */
    @Override
    public void updateParseTree() {
        updatedBlock(0, new HashSet<>());
    }

    /*
     * Record a field declaration
     */
    @Override
    public RecoveredElement add(FieldDeclaration fieldDeclaration, int bracketBalanceValue) {
        resetPendingModifiers();

        /* local variables inside method can only be final and non void */
        char[][] fieldTypeName;
        if ((fieldDeclaration.modifiers & ~16) != 0 // local var can only be final
            || (fieldDeclaration.type == null) // initializer
            || ((fieldTypeName = fieldDeclaration.type.getTypeName()).length == 1 // non void
                && CharOperation.equals(fieldTypeName[0], TypeConstants.VOID))) {
            this.updateSourceEndIfNecessary(previousAvailableLineEnd(fieldDeclaration.declarationSourceStart - 1));
            return this.parent.add(fieldDeclaration, bracketBalanceValue);
        }

        /*
         * do not consider a local variable starting passed the block end (if set) it must be belonging to an enclosing
         * block
         */
        if (this.blockDeclaration.sourceEnd != 0
            && fieldDeclaration.declarationSourceStart > this.blockDeclaration.sourceEnd) {
            return this.parent.add(fieldDeclaration, bracketBalanceValue);
        }

        // ignore the added field, since indicates a local variable behind recovery point
        // which thus got parsed as a field reference. This can happen if restarting after
        // having reduced a code assist node to get the following context (see 1GEK7SG)
        return this;
    }
}
