// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2022, 2025 IBM Corporation and others.
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

public class RecordPattern extends Pattern {

    public Pattern[] patterns;
    public TypeReference type;

    public RecordPattern(TypeReference type, int sourceStart, int sourceEnd) {
        this.type = type;
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
    }

    @Override
    public TypeReference getType() {
        return this.type;
    }

    @Override
    public void setIsEitherOrPattern() {
        for (Pattern p : this.patterns) {
            p.setIsEitherOrPattern();
        }
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            this.type.traverse(visitor, scope);
            for (Pattern p : this.patterns) {
                p.traverse(visitor, scope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        output.append(this.type).append('(');
        for (int i = 0; i < this.patterns.length; i++) {
            if (i > 0)
                output.append(", "); //$NON-NLS-1$
            this.patterns[i].print(0, output);
        }
        output.append(')');
        return output;
    }
}
