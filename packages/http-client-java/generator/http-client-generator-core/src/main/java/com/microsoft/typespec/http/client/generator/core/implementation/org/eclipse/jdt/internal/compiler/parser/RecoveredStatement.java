// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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
 * Internal statement structure for parsing recovery
 */
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Block;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ForeachStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Statement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TypeDeclaration;
import java.util.HashSet;
import java.util.Set;

public class RecoveredStatement extends RecoveredElement {

    public Statement statement;
    RecoveredBlock nestedBlock;

    public RecoveredStatement(Statement statement, RecoveredElement parent, int bracketBalance) {
        super(parent, bracketBalance);
        this.statement = statement;
    }

    /*
     * Answer the associated parsed structure
     */
    @Override
    public ASTNode parseTree() {
        return this.statement;
    }

    /*
     * Answer the very source end of the corresponding parse node
     */
    @Override
    public String toString(int tab) {
        return tabString(tab) + "Recovered statement:\n" + this.statement.print(tab + 1, new StringBuilder(10)); //$NON-NLS-1$
    }

    public Statement updatedStatement(int depth, Set<TypeDeclaration> knownTypes) {
        if (this.nestedBlock != null) {
            this.nestedBlock.updatedStatement(depth, knownTypes);
            // block has already been assigned in its parent statement
        }
        return this.statement;
    }

    @Override
    public void updateParseTree() {
        updatedStatement(0, new HashSet<>());
    }

    /*
     * Update the declarationSourceEnd of the corresponding parse node
     */
    @Override
    public void updateSourceEndIfNecessary(int bodyStart, int bodyEnd) {
        if (this.statement.sourceEnd == 0)
            this.statement.sourceEnd = bodyEnd;
    }

    @Override
    public RecoveredElement updateOnClosingBrace(int braceStart, int braceEnd) {
        if ((--this.bracketBalance <= 0) && (this.parent != null)) {
            this.updateSourceEndIfNecessary(braceStart, braceEnd);
            return this.parent.updateOnClosingBrace(braceStart, braceEnd);
        }
        return this;
    }

    @Override
    public RecoveredElement add(Block nestedBlockDeclaration, int bracketBalanceValue) {
        if (this.statement instanceof ForeachStatement) {
            ForeachStatement foreach = (ForeachStatement) this.statement;

            // see RecoveredBlock.add(Block, int):
            resetPendingModifiers();

            /*
             * do not consider a nested block starting passed the block end (if set) it must be belonging to an
             * enclosing block
             */
            if (foreach.sourceEnd != 0
                && foreach.action != null // if action is unassigned then foreach.sourceEnd is not yet the real end.
                && nestedBlockDeclaration.sourceStart > foreach.sourceEnd) {
                return this.parent.add(nestedBlockDeclaration, bracketBalanceValue);
            }
            foreach.action = nestedBlockDeclaration;

            RecoveredBlock element = new RecoveredBlock(nestedBlockDeclaration, this, bracketBalanceValue);

            if (parser().statementRecoveryActivated) {
                addBlockStatement(element);
            }
            this.nestedBlock = element;

            if (nestedBlockDeclaration.sourceEnd == 0)
                return element;
            return this;
        } else {
            return super.add(nestedBlockDeclaration, bracketBalanceValue);
        }
    }

    @Override
    public RecoveredElement add(Statement stmt, int bracketBalanceValue) {
        if (this.statement instanceof ForeachStatement) {
            ForeachStatement foreach = (ForeachStatement) this.statement;
            if (foreach.action == null) {
                // add the action to a block-less foreach, so that the action can see the for variable
                foreach.action = stmt;
                return this;
            }
        }
        return super.add(stmt, bracketBalanceValue);
    }
}
