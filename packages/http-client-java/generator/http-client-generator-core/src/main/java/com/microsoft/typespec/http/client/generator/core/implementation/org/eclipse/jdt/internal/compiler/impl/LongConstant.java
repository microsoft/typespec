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

public class LongConstant extends Constant {

    private static final LongConstant MIN_VALUE = new LongConstant();

    private final long value;

    public static Constant fromValue() {
        return MIN_VALUE;
    }

    private LongConstant() {
        this.value = (-9223372036854775808L);
    }

    @Override
    public String stringValue() {
        // spec 15.17.11
        return String.valueOf(this.value);
    }

    @Override
    public String toString() {
        return "(long)" + this.value; //$NON-NLS-1$
    }

    @Override
    public int hashCode() {
        return (int) (this.value ^ (this.value >>> 32));
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
        LongConstant other = (LongConstant) obj;
        return this.value == other.value;
    }
}
