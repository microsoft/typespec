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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;

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
        this.sourceEnd = (int) (sourcePositions[sourcePositions.length - 1] & 0x00000000FFFFFFFF);
        this.sourceStart = (int) (sourcePositions[0] >>> 32);
        this.modifiers = modifiers;
    }

    public boolean isStatic() {
        return (this.modifiers & 8) != 0;
    }

    @Override
    public StringBuilder print(int indent, StringBuilder output) {
        return print(output, true);
    }

    public StringBuilder print(StringBuilder output, boolean withOnDemand) {
        boolean isModule = (this.modifiers & 32768) != 0;
        if (isModule) {
            output.append("module "); //$NON-NLS-1$
        }
        /* when withOnDemand is false, only the name is printed */
        for (int i = 0; i < this.tokens.length; i++) {
            if (i > 0)
                output.append('.');
            output.append(this.tokens[i]);
        }
        if (withOnDemand && !isModule && ((this.bits & 131072) != 0)) {
            output.append(".*"); //$NON-NLS-1$
        }
        return output;
    }

    public void traverse(ASTVisitor visitor) {
        // annotations are traversed during the compilation unit traversal using a class scope
        java.util.Objects.requireNonNull(visitor);
    }
}
