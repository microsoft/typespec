// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2022, 2023 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class GuardedPattern extends Pattern {

    public Pattern primaryPattern;
    public Expression condition;
    public int whenSourceStart = -1;

    public GuardedPattern(Pattern primaryPattern, Expression condition) {
        this.primaryPattern = primaryPattern;
        this.condition = condition;
        this.sourceStart = primaryPattern.sourceStart;
        this.sourceEnd = condition.sourceEnd;
    }

    @Override
    public void setIsEitherOrPattern() {
        this.primaryPattern.setIsEitherOrPattern();
    }

    @Override
    public Pattern[] getAlternatives() {
        return this.primaryPattern.getAlternatives();
    }

}
