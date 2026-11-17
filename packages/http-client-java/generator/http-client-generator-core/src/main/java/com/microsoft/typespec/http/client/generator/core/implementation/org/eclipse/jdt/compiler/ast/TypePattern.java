// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2021, 2024 IBM Corporation and others.
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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.*;

public class TypePattern extends Pattern {

    public LocalDeclaration local;

    public TypePattern(LocalDeclaration local) {
        this.local = local;
    }

    public static TypePattern createTypePattern(LocalDeclaration lokal) {
        if (lokal.name.length == 1 && lokal.name[0] == '_') {
            return new TypePattern(lokal) {

            };
        }
        return new TypePattern(lokal);
    }

    @Override
    public TypeReference getType() {
        return this.local.type;
    }

    @Override
    public void setIsEitherOrPattern() {

    }

}
