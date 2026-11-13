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

public class IntConstant extends Constant {

    int value;

    private static final IntConstant MIN_VALUE = new IntConstant(Integer.MIN_VALUE);
    private static final IntConstant MINUS_FOUR = new IntConstant(-4);
    private static final IntConstant MINUS_THREE = new IntConstant(-3);
    private static final IntConstant MINUS_TWO = new IntConstant(-2);
    private static final IntConstant MINUS_ONE = new IntConstant(-1);
    private static final IntConstant ZERO = new IntConstant(0);
    private static final IntConstant ONE = new IntConstant(1);
    private static final IntConstant TWO = new IntConstant(2);
    private static final IntConstant THREE = new IntConstant(3);
    private static final IntConstant FOUR = new IntConstant(4);
    private static final IntConstant FIVE = new IntConstant(5);
    private static final IntConstant SIX = new IntConstant(6);
    private static final IntConstant SEVEN = new IntConstant(7);
    private static final IntConstant EIGHT = new IntConstant(8);
    private static final IntConstant NINE = new IntConstant(9);
    private static final IntConstant TEN = new IntConstant(10);

    public static Constant fromValue(int value) {
        switch (value) {
            case Integer.MIN_VALUE:
                return IntConstant.MIN_VALUE;

            case -4:
                return IntConstant.MINUS_FOUR;

            case -3:
                return IntConstant.MINUS_THREE;

            case -2:
                return IntConstant.MINUS_TWO;

            case -1:
                return IntConstant.MINUS_ONE;

            case 0:
                return IntConstant.ZERO;

            case 1:
                return IntConstant.ONE;

            case 2:
                return IntConstant.TWO;

            case 3:
                return IntConstant.THREE;

            case 4:
                return IntConstant.FOUR;

            case 5:
                return IntConstant.FIVE;

            case 6:
                return IntConstant.SIX;

            case 7:
                return IntConstant.SEVEN;

            case 8:
                return IntConstant.EIGHT;

            case 9:
                return IntConstant.NINE;

            case 10:
                return IntConstant.TEN;
        }
        return new IntConstant(value);
    }

    private IntConstant(int value) {
        this.value = value;
    }

    @Override
    public String stringValue() {
        // spec 15.17.11
        return String.valueOf(this.value);
    }

    @Override
    public String toString() {
        return "(int)" + this.value; //$NON-NLS-1$
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
        IntConstant other = (IntConstant) obj;
        return this.value == other.value;
    }
}
