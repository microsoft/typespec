// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2010 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl;

public class CharConstant extends Constant {

    private final char value;

    public static Constant fromValue(char value) {
        return new CharConstant(value);
    }

    private CharConstant(char value) {
        this.value = value;
    }

    @Override
    public String stringValue() {
        // spec 15.17.11
        return String.valueOf(this.value);
    }

    @Override
    public String toString() {
        return "(char)" + this.value; //$NON-NLS-1$
    }

    @Override
    public int hashCode() {
        return this.value;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        CharConstant other = (CharConstant) obj;
        return this.value == other.value;
    }
}
