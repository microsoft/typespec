// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
* Copyright (c) 2024 Advantest Europe GmbH and others.
*
* This program and the accompanying materials
* are made available under the terms of the Eclipse Public License 2.0
* which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-2.0/
*
* SPDX-License-Identifier: EPL-2.0
*
* Contributors:
*     Srikanth Sankaran - initial implementation
*******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;

public class EitherOrMultiPattern extends Pattern {

    private Pattern[] patterns;
    private int patternsCount;

    public EitherOrMultiPattern(Pattern[] patterns) {
        this.patterns = patterns;
        this.patternsCount = patterns.length;
        this.sourceStart = patterns[0].sourceStart;
        this.sourceEnd = patterns[this.patternsCount - 1].sourceEnd;
        setIsEitherOrPattern();
    }

    @Override
    public Pattern[] getAlternatives() {
        return this.patterns;
    }

    @Override
    public void setIsEitherOrPattern() {
        for (int i = 0; i < this.patternsCount; i++)
            this.patterns[i].setIsEitherOrPattern();
    }

    @Override
    public StringBuilder printExpression(int indent, StringBuilder output) {
        for (int i = 0; i < this.patternsCount; i++) {
            if (i > 0)
                output.append(", "); //$NON-NLS-1$
            this.patterns[i].print(0, output);
        }
        return output;
    }

    @Override
    public void traverse(ASTVisitor visitor, BlockScope scope) {
        {
            java.util.Objects.requireNonNull(visitor);
            for (Pattern p : this.patterns) {
                p.traverse(visitor, scope);
            }
        }
        java.util.Objects.requireNonNull(visitor);
    }
}
