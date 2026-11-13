// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2021 IBM Corporation and others.
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
 *								bug 395002 - Self bound generic class doesn't resolve bounds properly for wildcards for certain parametrisation.
 *								bug 331649 - [compiler][null] consider null annotations for fields
 *								bug 400761 - [compiler][null] null may be return as boolean without a diagnostic
 *								Bug 427438 - [1.8][compiler] NPE at org.eclipse.jdt.internal.compiler.ast.ConditionalExpression.generateCode(ConditionalExpression.java:280)
 *								Bug 429403 - [1.8][null] null mismatch from type arguments is not reported at field initializer
 *								Bug 453483 - [compiler][null][loop] Improve null analysis for loops
 *								Bug 458396 - NPE in CodeStream.invoke()
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *								Bug 409250 - [1.8][compiler] Various loose ends in 308 code generation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;

public class FieldDeclaration extends AbstractVariableDeclaration {

    public Javadoc javadoc;

    public FieldDeclaration() {
        // for subtypes or conversion
    }

    public FieldDeclaration(char[] name, int sourceStart, int sourceEnd) {
        this.name = name;
        // due to some declaration like
        // int x, y = 3, z , x ;
        // the sourceStart and the sourceEnd is ONLY on the name
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
    }

    /**
     */
    @Override
    public int getKind() {
        return this.type == null ? 3 : 1;
    }

    public boolean isStatic() {

        return (this.modifiers & 8) != 0;
    }

    public boolean isFinal() {

        return (this.modifiers & 16) != 0;
    }

    @Override
    public StringBuilder print(int indent, StringBuilder output) {
        return super.print(indent, output);
    }

    @Override
    public StringBuilder printStatement(int indent, StringBuilder output) {
        if (this.javadoc != null) {
            this.javadoc.print(indent, output);
        }
        return super.printStatement(indent, output);
    }

    public void traverse(ASTVisitor visitor) {
        if (visitor.visit(this)) {
            if (this.javadoc != null) {
                this.javadoc.traverse(visitor,
                    ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
            }
            if (this.annotations != null) {
                int annotationsLength = this.annotations.length;
                for (int i = 0; i < annotationsLength; i++)
                    this.annotations[i].traverse(visitor,
                        ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
            }
            if (this.type != null) {
                this.type.traverse(visitor,
                    ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
            }
            if (this.initialization != null)
                this.initialization.traverse(visitor,
                    ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
