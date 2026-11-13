// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2009 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser;

/**
 * Internal import structure for parsing recovery
 */
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ImportReference;

public class RecoveredImport extends RecoveredElement {

    public ImportReference importReference;

    public RecoveredImport(ImportReference importReference, RecoveredElement parent, int bracketBalance) {
        super(parent, bracketBalance);
        this.importReference = importReference;
    }

    /*
     * Answer the associated parsed structure
     */
    @Override
    public ASTNode parseTree() {
        return this.importReference;
    }

    /*
     * Answer the very source end of the corresponding parse node
     */
    @Override
    public String toString(int tab) {
        return tabString(tab) + "Recovered import: " + this.importReference.toString(); //$NON-NLS-1$
    }

    public ImportReference updatedImportReference() {
        return this.importReference;
    }

    @Override
    public void updateParseTree() {
        updatedImportReference();
    }

    /*
     * Update the declarationSourceEnd of the corresponding parse node
     */
    @Override
    public void updateSourceEndIfNecessary(int bodyStart, int bodyEnd) {
        if (this.importReference.declarationSourceEnd == 0) {
            this.importReference.declarationSourceEnd = bodyEnd;
            this.importReference.declarationEnd = bodyEnd;
        }
    }
}
