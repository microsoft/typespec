// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2020 IBM Corporation and others.
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

public class RecordComponent extends AbstractVariableDeclaration {

    public RecordComponent(char[] name, int sourceStart, int sourceEnd) {
        this.name = name;
        this.sourceStart = sourceStart;
        this.sourceEnd = sourceEnd;
        this.declarationEnd = sourceEnd;
    }

    public RecordComponent(char[] name, long posNom, TypeReference tr, int modifiers) {
        this(name, (int) (posNom >>> 32), (int) posNom);
        this.declarationSourceEnd = (int) posNom;
        this.modifiers = modifiers;
        this.type = tr;
        if (tr != null) {
            this.bits |= (tr.bits & 1048576);
        }
    }

}
