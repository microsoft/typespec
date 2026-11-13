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
 *     Stephan Herrmann - Contribution for
 *								bug 382350 - [1.8][compiler] Unable to invoke inherited default method via I.super.m() syntax
 *								bug 404649 - [1.8][compiler] detect illegal reference to indirect or redundant super
 *								bug 404728 - [1.8]NPE on QualifiedSuperReference error
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class QualifiedSuperReference extends QualifiedThisReference {

    public QualifiedSuperReference(TypeReference name, int pos, int sourceEnd) {
        super(name, pos, sourceEnd);
    }

    @Override
    public boolean isSuper() {
        return true;
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        return this.qualification.print(0, output).append(".super"); //$NON-NLS-1$
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope blockScope) {
        {
            java.util.Objects.requireNonNull(visitor);
            this.qualification.traverse(visitor, blockScope);
        }
        java.util.Objects.requireNonNull(visitor);
    }

    @Override
    public void traverse(ASTVisitor visitor) {
        {
            java.util.Objects.requireNonNull(visitor);
            this.qualification.traverse(visitor);
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
