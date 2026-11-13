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
 *
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;

public abstract class PackageVisibilityStatement extends ModuleStatement {
    public ImportReference pkgRef;
    public ModuleReference[] targets;

    public PackageVisibilityStatement(ImportReference pkgRef) {
        this.pkgRef = pkgRef;
        CharOperation.concatWith(this.pkgRef.tokens, '.');
        this.targets = null;
    }

    public boolean isQualified() {
        return this.targets != null && this.targets.length > 0;
    }

    public ModuleReference[] getTargetedModules() {
        return this.targets;
    }

    @Override
    public StringBuilder print(int indent, StringBuilder output) {
        this.pkgRef.print(indent, output);
        if (this.isQualified()) {
            output.append(" to "); //$NON-NLS-1$
            for (int i = 0; i < this.targets.length; i++) {
                if (i > 0)
                    output.append(", "); //$NON-NLS-1$
                this.targets[i].print(0, output);
            }
        }
        return output;
    }
}
