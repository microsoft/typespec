// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2016, 2017 IBM Corporation and others.
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

public class ProvidesStatement extends ModuleStatement {

    public TypeReference serviceInterface;
    public TypeReference[] implementations;

    @Override
    public StringBuilder print(int indent, StringBuilder output) {
        printIndent(indent, output);
        output.append("provides "); //$NON-NLS-1$
        this.serviceInterface.print(0, output);
        // output.append(" "); //$NON-NLS-1$
        // printIndent(indent + 1, output);
        output.append(" with "); //$NON-NLS-1$
        for (int i = 0; i < this.implementations.length; i++) {
            this.implementations[i].print(0, output);
            if (i < this.implementations.length - 1)
                output.append(", "); //$NON-NLS-1$
        }
        output.append(";"); //$NON-NLS-1$
        return output;
    }
}
