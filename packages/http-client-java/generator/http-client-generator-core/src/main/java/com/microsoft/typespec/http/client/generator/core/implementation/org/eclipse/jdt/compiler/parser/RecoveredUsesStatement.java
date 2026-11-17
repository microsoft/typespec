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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.UsesStatement;

public class RecoveredUsesStatement extends RecoveredModuleStatement {

    public RecoveredUsesStatement(UsesStatement usesStatement, RecoveredElement parent, int bracketBalance) {
        super(usesStatement, parent, bracketBalance);
    }

    public UsesStatement updatedUsesStatement() {
        return (UsesStatement) this.moduleStatement;
    }

}
