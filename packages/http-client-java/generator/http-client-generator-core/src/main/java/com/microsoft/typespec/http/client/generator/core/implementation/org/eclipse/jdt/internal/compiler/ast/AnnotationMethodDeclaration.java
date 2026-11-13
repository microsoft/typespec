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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Parser;

public class AnnotationMethodDeclaration extends MethodDeclaration {

    public Expression defaultValue;

    /**
     * MethodDeclaration constructor comment.
     */
    public AnnotationMethodDeclaration(CompilationResult compilationResult) {
        super(compilationResult);
    }

    @Override
    public boolean isAnnotationMethod() {
        return true;
    }

    @Override
    public void parseStatements(Parser parser, CompilationUnitDeclaration unit) {
        // nothing to do
        // annotation type member declaration don't have any body
    }

    @Override
    public StringBuilder print(int tab, StringBuilder output) {
        printIndent(tab, output);
        printModifiers(this.modifiers, output);
        if (this.annotations != null) {
            printAnnotations(this.annotations, output);
            output.append(' ');
        }

        TypeParameter[] typeParams = typeParameters();
        if (typeParams != null) {
            output.append('<');
            int max = typeParams.length - 1;
            for (int j = 0; j < max; j++) {
                typeParams[j].print(0, output);
                output.append(", ");//$NON-NLS-1$
            }
            typeParams[max].print(0, output);
            output.append('>');
        }

        printReturnType(output).append(this.selector).append('(');
        if (this.arguments != null) {
            for (int i = 0; i < this.arguments.length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.arguments[i].print(0, output);
            }
        }
        output.append(')');
        if (this.thrownExceptions != null) {
            output.append(" throws "); //$NON-NLS-1$
            for (int i = 0; i < this.thrownExceptions.length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.thrownExceptions[i].print(0, output);
            }
        }

        if (this.defaultValue != null) {
            output.append(" default "); //$NON-NLS-1$
            this.defaultValue.print(0, output);
        }

        printBody(tab + 1, output);
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            if (this.annotations != null) {
                int annotationsLength = this.annotations.length;
                for (int i = 0; i < annotationsLength; i++)
                    this.annotations[i].traverse(visitor,
                        ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
            }
            if (this.returnType != null) {
                this.returnType.traverse(visitor,
                    ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
            }
            if (this.defaultValue != null) {
                this.defaultValue.traverse(visitor,
                    ((com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope) null));
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
