// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2013 IBM Corporation and others.
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

public class Receiver extends Argument {
    public NameReference qualifyingName;

    public Receiver(char[] name, long posNom, TypeReference typeReference, NameReference qualifyingName,
        int modifiers) {
        super(name, posNom, typeReference, modifiers);
        this.qualifyingName = qualifyingName;
    }

    @Override
    public boolean isReceiver() {
        return true;
    }
}
