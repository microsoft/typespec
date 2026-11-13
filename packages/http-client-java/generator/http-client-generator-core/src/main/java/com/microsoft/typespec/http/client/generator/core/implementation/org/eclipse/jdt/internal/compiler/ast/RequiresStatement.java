// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2016, 2025 IBM Corporation and others.
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
 *
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

public class RequiresStatement extends ModuleStatement {

    public ModuleReference module;

    public int modifiers = 0;

    public RequiresStatement(ModuleReference module) {
        this.module = module;
    }

    public boolean isTransitive() {
        return (this.modifiers & 32) != 0;
    }

    public boolean isStatic() {
        return (this.modifiers & 64) != 0;
    }

    @Override
    public StringBuilder print(int indent, StringBuilder output) {
        output.append("requires "); //$NON-NLS-1$
        if (isTransitive())
            output.append("transitive "); //$NON-NLS-1$
        if (isStatic())
            output.append("static "); //$NON-NLS-1$
        this.module.print(indent, output);
        output.append(";"); //$NON-NLS-1$
        return output;
    }

}
