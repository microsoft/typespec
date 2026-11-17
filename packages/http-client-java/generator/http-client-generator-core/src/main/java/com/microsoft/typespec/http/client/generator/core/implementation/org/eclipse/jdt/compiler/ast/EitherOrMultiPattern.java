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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class EitherOrMultiPattern extends Pattern {

    private final Pattern[] patterns;
    private final int patternsCount;

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

}
