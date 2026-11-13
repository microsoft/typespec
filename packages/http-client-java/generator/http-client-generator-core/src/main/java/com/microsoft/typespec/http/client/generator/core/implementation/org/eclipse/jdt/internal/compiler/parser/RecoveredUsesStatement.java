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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.UsesStatement;

public class RecoveredUsesStatement extends RecoveredModuleStatement {

    public RecoveredUsesStatement(UsesStatement usesStatement, RecoveredElement parent, int bracketBalance) {
        super(usesStatement, parent, bracketBalance);
    }

    @Override
    public String toString(int tab) {
        return tabString(tab) + "Recovered Uses: " + super.toString(); //$NON-NLS-1$
    }

    public UsesStatement updatedUsesStatement() {
        return (UsesStatement) this.moduleStatement;
    }

    @Override
    public void updateParseTree() {
        updatedUsesStatement();
    }
}
