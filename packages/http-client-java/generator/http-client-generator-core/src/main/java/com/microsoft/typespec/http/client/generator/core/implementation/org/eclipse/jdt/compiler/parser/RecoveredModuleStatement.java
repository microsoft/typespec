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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ModuleStatement;

public abstract class RecoveredModuleStatement extends RecoveredElement {

    public ModuleStatement moduleStatement;

    public RecoveredModuleStatement(ModuleStatement moduleStmt, RecoveredElement parent, int bracketBalance) {
        super(parent, bracketBalance);
        this.moduleStatement = moduleStmt;
    }

    /*
     * Answer the associated parsed structure
     */
    @Override
    public ASTNode parseTree() {
        return this.moduleStatement;
    }

    @Override
    public void updateParseTree() {
    }

    /*
     * Update the declarationSourceEnd of the corresponding parse node
     */
    @Override
    public void updateSourceEndIfNecessary(int bodyStart, int bodyEnd) {
        if (this.moduleStatement.declarationSourceEnd == 0) {
            this.moduleStatement.declarationSourceEnd = bodyEnd;
            this.moduleStatement.declarationEnd = bodyEnd;
        }
    }
}
