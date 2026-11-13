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
 *     Stephan Herrmann - Contributions for
 *     							bug 332637 - Dead Code detection removing code that isn't dead
 *     							bug 358827 - [1.7] exception analysis for t-w-r spoils null analysis
 *     							bug 349326 - [1.7] new warning for missing try-with-resources
 *     							bug 359334 - Analysis for resource leak warnings does not consider exceptions as method exit points
 *								bug 358903 - Filter practically unimportant resource leak warnings
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								bug 388996 - [compiler][resource] Incorrect 'potential resource leak'
 *								bug 401088 - [compiler][null] Wrong warning "Redundant null check" inside nested try statement
 *								bug 401092 - [compiler][null] Wrong warning "Redundant null check" in outer catch of nested try
 *								bug 402993 - [null] Follow up of bug 401088: Missing warning about redundant null check
 *								bug 384380 - False positive on a ?? Potential null pointer access ?? after a continue
 *								Bug 415790 - [compiler][resource]Incorrect potential resource leak warning in for loop with close in try/catch
 *								Bug 371614 - [compiler][resource] Wrong "resource leak" problem on return/throw inside while loop
 *								Bug 444964 - [1.7+][resource] False resource leak warning (try-with-resources for ByteArrayOutputStream - return inside for loop)
 *     Jesper Steen Moller - Contributions for
 *								bug 404146 - [1.7][compiler] nested try-catch-finally-blocks leads to unrunnable Java byte code
 *     Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class TryStatement extends Statement {

    public Statement[] resources = new Statement[0];
    public Block tryBlock;
    public Block[] catchBlocks;

    public Argument[] catchArguments;

    public Block finallyBlock;

    @Override
    public StringBuilder printStatement(int indent, StringBuilder output) {
        int length = this.resources.length;
        printIndent(indent, output).append("try" + (length == 0 ? "\n" : " (")); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
        for (int i = 0; i < length; i++) {
            Statement stmt = this.resources[i];
            if (stmt instanceof LocalDeclaration) {
                ((LocalDeclaration) stmt).printAsExpression(0, output);
            } else if (stmt instanceof Reference) {
                ((Reference) stmt).printExpression(0, output);
            } else
                continue;
            if (i != length - 1) {
                output.append(";\n"); //$NON-NLS-1$
                printIndent(indent + 2, output);
            }
        }
        if (length > 0) {
            output.append(")\n"); //$NON-NLS-1$
        }
        this.tryBlock.printStatement(indent + 1, output);

        // catches
        if (this.catchBlocks != null)
            for (int i = 0; i < this.catchBlocks.length; i++) {
                output.append('\n');
                printIndent(indent, output).append("catch ("); //$NON-NLS-1$
                this.catchArguments[i].print(0, output).append(")\n"); //$NON-NLS-1$
                this.catchBlocks[i].printStatement(indent + 1, output);
            }
        // finally
        if (this.finallyBlock != null) {
            output.append('\n');
            printIndent(indent, output).append("finally\n"); //$NON-NLS-1$
            this.finallyBlock.printStatement(indent + 1, output);
        }
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        {
            java.util.Objects.requireNonNull(visitor);
            Statement[] statements = this.resources;
            for (Statement statement : statements) {
                statement.traverse(visitor, ((BlockScope) null));
            }
            this.tryBlock.traverse(visitor, ((BlockScope) null));
            if (this.catchArguments != null) {
                for (int i = 0, max = this.catchBlocks.length; i < max; i++) {
                    this.catchArguments[i].traverse(visitor, ((BlockScope) null));
                    this.catchBlocks[i].traverse(visitor, ((BlockScope) null));
                }
            }
            if (this.finallyBlock != null)
                this.finallyBlock.traverse(visitor, ((BlockScope) null));
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
