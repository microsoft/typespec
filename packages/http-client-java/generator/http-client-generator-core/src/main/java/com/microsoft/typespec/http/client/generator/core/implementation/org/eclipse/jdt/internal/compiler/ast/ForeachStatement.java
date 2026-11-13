// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2023 IBM Corporation and others.
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
 *     Stephan Herrmann - Contribution for
 *								bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 370930 - NonNull annotation not considered for enhanced for loops
 *								bug 365859 - [compiler][null] distinguish warnings based on flow analysis vs. null annotations
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								bug 393719 - [compiler] inconsistent warnings on iteration variables
 *								Bug 411964 - [1.8][null] leverage null type annotation in foreach statement
 *								Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 453483 - [compiler][null][loop] Improve null analysis for loops
 *								Bug 415790 - [compiler][resource]Incorrect potential resource leak warning in for loop with close in try/catch
 *     Jesper S Moller -  Contribution for
 *								bug 401853 - Eclipse Java compiler creates invalid bytecode (java.lang.VerifyError)
 *                               bug 527554 - [18.3] Compiler support for JEP 286 Local-Variable Type
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;

public class ForeachStatement extends Statement {

    public LocalDeclaration elementVariable;

    public Expression collection;
    public Statement action;

    public ForeachStatement(LocalDeclaration elementVariable, int start) {
        this.elementVariable = elementVariable;
        this.sourceStart = start;

    }

    @Override
    public StringBuilder printStatement(int indent, StringBuilder output) {
        printIndent(indent, output).append("for ("); //$NON-NLS-1$
        this.elementVariable.printAsExpression(0, output);
        output.append(" : ");//$NON-NLS-1$
        if (this.collection != null) {
            this.collection.print(0, output).append(") "); //$NON-NLS-1$
        } else {
            output.append(')');
        }
        // block
        if (this.action == null) {
            output.append(';');
        } else {
            output.append('\n');
            this.action.printStatement(indent + 1, output);
        }
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        if (visitor.visit(this)) {
            this.elementVariable.traverse(visitor,
                ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope) null));
            if (this.collection != null) {
                this.collection.traverse(visitor,
                    ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope) null));
            }
            if (this.action != null) {
                this.action.traverse(visitor,
                    ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope) null));
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
