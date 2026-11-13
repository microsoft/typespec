// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2020, 2022 IBM Corporation and others.
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
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class JavadocModuleReference extends Expression implements IJavadocTypeReference {

    public TypeReference typeReference;
    public ModuleReference moduleReference;

    public JavadocModuleReference(char[][] sources, long[] pos) {
        super();
        this.moduleReference = new ModuleReference(sources, pos);

        this.sourceStart = this.moduleReference.sourceStart;
        this.sourceEnd = this.moduleReference.sourceEnd;
        this.bits |= 32768;
    }

    /* Redefine to capture javadoc specific signatures */
    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        java.util.Objects.requireNonNull(visitor);
    }

    public void setTypeReference(TypeReference typeReference) {
        this.typeReference = typeReference;
        if (this.typeReference != null) {
            this.sourceEnd = this.typeReference.sourceEnd;
        }
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        if (this.moduleReference != null) {
            output.append(this.moduleReference.moduleName);
        }
        output.append('/');
        if (this.typeReference != null) {
            this.typeReference.printExpression(indent, output);
        }
        return output;
    }

}
