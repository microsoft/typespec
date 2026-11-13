// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
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
 *								bug 392384 - [1.8][compiler][null] Restore nullness info from type annotations in class files
 *								Bug 415043 - [1.8][null] Follow-up re null type annotations after bug 392099
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 415543 - [1.8][compiler] Incorrect bound index in RuntimeInvisibleTypeAnnotations attribute
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class TypeParameter extends AbstractVariableDeclaration {

    public TypeReference[] bounds;

    /**
     */
    @Override
    public int getKind() {
        return 6;
    }

    @Override
    public StringBuilder printStatement(int indent, StringBuilder output) {
        if (this.annotations != null) {
            printAnnotations(this.annotations, output);
            output.append(' ');
        }
        output.append(this.name);
        if (this.type != null) {
            output.append(" extends "); //$NON-NLS-1$
            this.type.print(0, output);
        }
        if (this.bounds != null) {
            for (TypeReference bound : this.bounds) {
                output.append(" & "); //$NON-NLS-1$
                bound.print(0, output);
            }
        }
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        if (visitor.visit(this)) {
            if (this.annotations != null) {
                int annotationsLength = this.annotations.length;
                for (int i = 0; i < annotationsLength; i++)
                    this.annotations[i].traverse(visitor, scope);
            }
            if (this.type != null) {
                this.type.traverse(visitor, scope);
            }
            if (this.bounds != null) {
                int boundsLength = this.bounds.length;
                for (int i = 0; i < boundsLength; i++) {
                    this.bounds[i].traverse(visitor, scope);
                }
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.annotations != null) {
                int annotationsLength = this.annotations.length;
                for (int i = 0; i < annotationsLength; i++)
                    this.annotations[i].traverse(visitor);
            }
            if (this.type != null) {
                this.type.traverse(visitor);
            }
            if (this.bounds != null) {
                int boundsLength = this.bounds.length;
                for (int i = 0; i < boundsLength; i++) {
                    this.bounds[i].traverse(visitor);
                }
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

}
