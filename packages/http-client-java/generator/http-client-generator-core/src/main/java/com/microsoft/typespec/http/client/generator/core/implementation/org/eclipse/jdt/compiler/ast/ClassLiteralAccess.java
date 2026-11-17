// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2017 IBM Corporation and others.
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

public class ClassLiteralAccess extends Expression {

    public TypeReference type;

    public ClassLiteralAccess(int sourceEnd, TypeReference type) {
        this.type = type;
        type.bits |= 1073741824; // no need to worry about raw type usage
        this.sourceStart = type.sourceStart;
        this.sourceEnd = sourceEnd;
    }

}
