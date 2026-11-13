// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2016 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ImportReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.PackageVisibilityStatement;

public abstract class RecoveredPackageVisibilityStatement extends RecoveredModuleStatement {

    // PackageVisibilityStatement pvs;
    RecoveredImport pkgRef;

    public RecoveredPackageVisibilityStatement(PackageVisibilityStatement pvs, RecoveredElement parent,
        int bracketBalance) {
        super(pvs, parent, bracketBalance);
    }

    @Override
    public RecoveredElement add(ImportReference pkgRef1, int bracketBalance1) {
        this.pkgRef = new RecoveredImport(pkgRef1, this, bracketBalance1);
        return this;
    }

    public PackageVisibilityStatement updatedPackageVisibilityStatement() {
        PackageVisibilityStatement pvs = (PackageVisibilityStatement) this.moduleStatement;
        if (this.pkgRef != null) {
            pvs.pkgRef = this.pkgRef.updatedImportReference();
        }

        return pvs;
    }

    @Override
    public void updateParseTree() {
        updatedPackageVisibilityStatement();
    }
}
