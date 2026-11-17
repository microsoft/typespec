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
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public class ImportReference extends ASTNode {

    public char[][] tokens;
    public long[] sourcePositions; // each entry is using the code : (start<<32) + end
    public int declarationEnd; // doesn't include an potential trailing comment
    public int declarationSourceStart;
    public int declarationSourceEnd;
    public int modifiers; // 1.5 addition for static imports
    public int modifiersSourceStart;
    public Annotation[] annotations;

    public ImportReference(char[][] tokens, long[] sourcePositions, boolean onDemand, int modifiers) {
        this.tokens = tokens;
        this.sourcePositions = sourcePositions;
        if (onDemand) {
            this.bits |= 131072;
        }
        this.sourceEnd = (int) (sourcePositions[sourcePositions.length - 1]);
        this.sourceStart = (int) (sourcePositions[0] >>> 32);
        this.modifiers = modifiers;
    }

}
