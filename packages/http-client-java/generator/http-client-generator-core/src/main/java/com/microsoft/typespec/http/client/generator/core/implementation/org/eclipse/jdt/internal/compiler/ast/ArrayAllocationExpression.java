// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2020 IBM Corporation and others.
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
 *								bug 319201 - [null] no warning when unboxing SingleNameReference causes NPE
 *								bug 345305 - [compiler][null] Compiler misidentifies a case of "variable can only be null"
 *								bug 403147 - [compiler][null] FUP of bug 400761: consolidate interaction between unboxing, NPE, and deferred checking
 *								Bug 417758 - [1.8][null] Null safety compromise during array creation.
 *								Bug 427163 - [1.8][null] bogus error "Contradictory null specification" on varags
 *     Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *                          Bug 409247 - [1.8][compiler] Verify error with code allocating multidimensional array
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class ArrayAllocationExpression extends Expression {

    public TypeReference type;

    // dimensions.length gives the number of dimensions, but the
    // last ones may be nulled as in new int[4][5][][]
    public Expression[] dimensions;
    public Annotation[][] annotationsOnDimensions; // jsr308 style annotations.
    public ArrayInitializer initializer;

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        output.append("new "); //$NON-NLS-1$
        this.type.print(0, output);
        for (int i = 0; i < this.dimensions.length; i++) {
            if (this.annotationsOnDimensions != null && this.annotationsOnDimensions[i] != null) {
                output.append(' ');
                printAnnotations(this.annotationsOnDimensions[i], output);
                output.append(' ');
            }
            if (this.dimensions[i] == null)
                output.append("[]"); //$NON-NLS-1$
            else {
                output.append('[');
                this.dimensions[i].printExpression(0, output);
                output.append(']');
            }
        }
        if (this.initializer != null)
            this.initializer.printExpression(0, output);
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        if (visitor.visit(this)) {
            int dimensionsLength = this.dimensions.length;
            this.type.traverse(visitor, scope);
            for (int i = 0; i < dimensionsLength; i++) {
                Annotation[] annotations
                    = this.annotationsOnDimensions == null ? null : this.annotationsOnDimensions[i];
                int annotationsLength = annotations == null ? 0 : annotations.length;
                for (int j = 0; j < annotationsLength; j++) {
                    annotations[j].traverse(visitor, scope);
                }
                if (this.dimensions[i] != null)
                    this.dimensions[i].traverse(visitor, scope);
            }
            if (this.initializer != null)
                this.initializer.traverse(visitor, scope);
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
