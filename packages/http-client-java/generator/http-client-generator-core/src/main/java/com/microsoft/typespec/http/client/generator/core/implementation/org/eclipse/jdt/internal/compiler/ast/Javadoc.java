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
 *     Stephan Herrmann - Contribution for
 *								Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *								Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;

/**
 * Node representing a structured Javadoc comment
 */
public class Javadoc extends ASTNode {

    public JavadocSingleNameReference[] paramReferences; // @param
    public JavadocSingleTypeReference[] paramTypeParameters; // @param
    public TypeReference[] exceptionReferences; // @throws, @exception
    public JavadocReturnStatement returnStatement; // @return
    public Expression[] seeReferences; // @see
    public IJavadocTypeReference[] usesReferences; // @uses
    public IJavadocTypeReference[] providesReferences; // @provides

    // bug https://bugs.eclipse.org/bugs/show_bug.cgi?id=51600
    // Store param references for tag with invalid syntax
    public JavadocSingleNameReference[] invalidParameters; // @param

    public Javadoc(int sourceStart, int sourceEnd) {
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
        this.bits |= 65536;
    }

    @Override
    public StringBuilder print(int indent, StringBuilder output) {
        printIndent(indent, output).append("/**\n"); //$NON-NLS-1$
        if (this.paramReferences != null) {
            for (JavadocSingleNameReference reference : this.paramReferences) {
                printIndent(indent + 1, output).append(" * @param "); //$NON-NLS-1$
                reference.print(indent, output).append('\n');
            }
        }
        if (this.paramTypeParameters != null) {
            for (JavadocSingleTypeReference paramTypeParameter : this.paramTypeParameters) {
                printIndent(indent + 1, output).append(" * @param <"); //$NON-NLS-1$
                paramTypeParameter.print(indent, output).append(">\n"); //$NON-NLS-1$
            }
        }
        if (this.returnStatement != null) {
            printIndent(indent + 1, output).append(" * @"); //$NON-NLS-1$
            this.returnStatement.print(indent, output).append('\n');
        }
        if (this.exceptionReferences != null) {
            for (TypeReference reference : this.exceptionReferences) {
                printIndent(indent + 1, output).append(" * @throws "); //$NON-NLS-1$
                reference.print(indent, output).append('\n');
            }
        }
        if (this.seeReferences != null) {
            for (Expression reference : this.seeReferences) {
                printIndent(indent + 1, output).append(" * @see "); //$NON-NLS-1$
                reference.print(indent, output).append('\n');
            }
        }
        printIndent(indent, output).append(" */\n"); //$NON-NLS-1$
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.paramReferences != null) {
                for (JavadocSingleNameReference paramReference : this.paramReferences) {
                    paramReference.traverse(visitor, scope);
                }
            }
            if (this.paramTypeParameters != null) {
                for (JavadocSingleTypeReference paramTypeParameter : this.paramTypeParameters) {
                    paramTypeParameter.traverse(visitor, scope);
                }
            }
            if (this.returnStatement != null) {
                this.returnStatement.traverse(visitor, scope);
            }
            if (this.exceptionReferences != null) {
                for (TypeReference exceptionReference : this.exceptionReferences) {
                    exceptionReference.traverse(visitor, scope);
                }
            }
            if (this.seeReferences != null) {
                for (Expression seeReference : this.seeReferences) {
                    seeReference.traverse(visitor, scope);
                }
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.paramReferences != null) {
                for (JavadocSingleNameReference paramReference : this.paramReferences) {
                    paramReference.traverse(visitor);
                }
            }
            if (this.paramTypeParameters != null) {
                for (JavadocSingleTypeReference paramTypeParameter : this.paramTypeParameters) {
                    paramTypeParameter.traverse(visitor);
                }
            }
            if (this.returnStatement != null) {
                this.returnStatement.traverse(visitor);
            }
            if (this.exceptionReferences != null) {
                for (TypeReference exceptionReference : this.exceptionReferences) {
                    exceptionReference.traverse(visitor);
                }
            }
            if (this.seeReferences != null) {
                for (Expression seeReference : this.seeReferences) {
                    seeReference.traverse(visitor);
                }
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
