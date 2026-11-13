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

public class StringConstant extends Constant {

    private final String value;

    public static Constant fromValue(String value) {
        return new StringConstant(value);
    }

    private StringConstant(String value) {
        this.value = value;
    }

    @Override
    public String stringValue() {
        // spec 15.17.11

        // the next line do not go into the toString() send....!
        return this.value;
        /*
         * String s = value.toString() ; if (s == null) return "null"; else return s;
         */
    }

    @Override
    public String toString() {
        return "(String)\"" + this.value + "\""; //$NON-NLS-2$ //$NON-NLS-1$
    }

    @Override
    public int hashCode() {

        int result = 1;
        result = 31 * result + ((this.value == null) ? 0 : this.value.hashCode());
        return result;
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
        StringConstant other = (StringConstant) obj;
        if (this.value == null) {
            return other.value == null;
        } else {
            return this.value.equals(other.value);
        }
    }
}
