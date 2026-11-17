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
 *     Perry James - nullStatus method improvement (165346)
 *     Stephan Herrmann - Contribution for
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast;

public abstract class OperatorExpression extends Expression {

    public static int[][] OperatorSignatures = new int[19 + 1][];

    static {
        classInitialize();
    }

    /**
     * OperatorExpression constructor comment.
     */
    public OperatorExpression() {
        super();
    }

    public static void classInitialize() {
        OperatorSignatures[2] = get_AND();
        OperatorSignatures[0] = get_AND_AND();
        OperatorSignatures[9] = get_DIVIDE();
        OperatorSignatures[18] = get_EQUAL_EQUAL();
        OperatorSignatures[6] = get_GREATER();
        OperatorSignatures[7] = get_GREATER_EQUAL();
        OperatorSignatures[10] = get_LEFT_SHIFT();
        OperatorSignatures[4] = get_LESS();
        OperatorSignatures[5] = get_LESS_EQUAL();
        OperatorSignatures[13] = get_MINUS();
        OperatorSignatures[15] = get_MULTIPLY();
        OperatorSignatures[3] = get_OR();
        OperatorSignatures[1] = get_OR_OR();
        OperatorSignatures[14] = get_PLUS();
        OperatorSignatures[16] = get_REMAINDER();
        OperatorSignatures[17] = get_RIGHT_SHIFT();
        OperatorSignatures[19] = get_UNSIGNED_RIGHT_SHIFT();
        OperatorSignatures[8] = get_XOR();
    }

    public static int[] get_AND() {

        // the code is an int, only 20 bits are used, see below.
        // (cast) left Op (cast) right --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        int[] table = new int[16 * 16];

        table[(3 << 4) + 3] = (163 << 12) + (163 << 4) + 10;
        table[(3 << 4) + 7] = (115 << 12) + (119 << 4) + 7;
        table[(3 << 4) + 4] = (163 << 12) + (164 << 4) + 10;
        table[(3 << 4) + 2] = (163 << 12) + (162 << 4) + 10;
        table[(3 << 4) + 10] = (163 << 12) + (170 << 4) + 10;

        table[(7 << 4) + 3] = (119 << 12) + (115 << 4) + 7;
        table[(7 << 4) + 7] = (119 << 12) + (119 << 4) + 7;
        table[(7 << 4) + 4] = (119 << 12) + (116 << 4) + 7;
        table[(7 << 4) + 2] = (119 << 12) + (114 << 4) + 7;
        table[(7 << 4) + 10] = (119 << 12) + (122 << 4) + 7;

        table[(4 << 4) + 3] = (164 << 12) + (163 << 4) + 10;
        table[(4 << 4) + 7] = (116 << 12) + (119 << 4) + 7;
        table[(4 << 4) + 4] = (164 << 12) + (164 << 4) + 10;
        table[(4 << 4) + 2] = (164 << 12) + (162 << 4) + 10;
        table[(4 << 4) + 10] = (164 << 12) + (170 << 4) + 10;

        table[(5 << 4) + 5] = (85 << 12) + (85 << 4) + 5;

        table[(2 << 4) + 3] = (162 << 12) + (163 << 4) + 10;
        table[(2 << 4) + 7] = (114 << 12) + (119 << 4) + 7;
        table[(2 << 4) + 4] = (162 << 12) + (164 << 4) + 10;
        table[(2 << 4) + 2] = (162 << 12) + (162 << 4) + 10;
        table[(2 << 4) + 10] = (162 << 12) + (170 << 4) + 10;

        table[(10 << 4) + 3] = (170 << 12) + (163 << 4) + 10;
        table[(10 << 4) + 7] = (122 << 12) + (119 << 4) + 7;
        table[(10 << 4) + 4] = (170 << 12) + (164 << 4) + 10;
        table[(10 << 4) + 2] = (170 << 12) + (162 << 4) + 10;
        table[(10 << 4) + 10] = (170 << 12) + (170 << 4) + 10;

        return table;
    }

    public static int[] get_AND_AND() {

        // the code is an int
        // (cast) left Op (cast) right --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        int[] table = new int[16 * 16];

        table[(5 << 4) + 5] = (85 << 12) + (85 << 4) + 5;

        return table;
    }

    public static int[] get_DIVIDE() {

        // the code is an int
        // (cast) left Op (cast) right --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        return get_MINUS();
    }

    public static int[] get_EQUAL_EQUAL() {

        // the code is an int
        // (cast) left Op (cast) right --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        int[] table = new int[16 * 16];

        table[(3 << 4) + 3] = (163 << 12) + (163 << 4) + 5;
        table[(3 << 4) + 7] = (115 << 12) + (119 << 4) + 5;
        table[(3 << 4) + 4] = (163 << 12) + (164 << 4) + 5;
        table[(3 << 4) + 8] = (131 << 12) + (136 << 4) + 5;
        table[(3 << 4) + 9] = (147 << 12) + (153 << 4) + 5;
        table[(3 << 4) + 2] = (163 << 12) + (162 << 4) + 5;
        table[(3 << 4) + 10] = (163 << 12) + (170 << 4) + 5;

        table[(7 << 4) + 3] = (119 << 12) + (115 << 4) + 5;
        table[(7 << 4) + 7] = (119 << 12) + (119 << 4) + 5;
        table[(7 << 4) + 4] = (119 << 12) + (116 << 4) + 5;
        table[(7 << 4) + 8] = (135 << 12) + (136 << 4) + 5;
        table[(7 << 4) + 9] = (151 << 12) + (153 << 4) + 5;
        table[(7 << 4) + 2] = (119 << 12) + (114 << 4) + 5;
        table[(7 << 4) + 10] = (119 << 12) + (122 << 4) + 5;

        table[(4 << 4) + 3] = (164 << 12) + (163 << 4) + 5;
        table[(4 << 4) + 7] = (116 << 12) + (119 << 4) + 5;
        table[(4 << 4) + 4] = (164 << 12) + (164 << 4) + 5;
        table[(4 << 4) + 8] = (132 << 12) + (136 << 4) + 5;
        table[(4 << 4) + 9] = (148 << 12) + (153 << 4) + 5;
        table[(4 << 4) + 2] = (164 << 12) + (162 << 4) + 5;
        table[(4 << 4) + 10] = (164 << 12) + (170 << 4) + 5;

        table[(11 << 4) + 11] = /* String2Object String2Object */
            (1 << 16) + (11 << 12) + (1 << 8) + (11 << 4) + 5;
        table[(11 << 4) + 1] = /* String2Object Object2Object */
            (1 << 16) + (11 << 12) + (1 << 8) + (1 << 4) + 5;
        table[(11 << 4) + 12] = /* Object2String null2Object */
            (1 << 16) + (11 << 12) + (1 << 8) + (12 << 4) + 5;

        table[(1 << 4) + 11] = /* Object2Object String2Object */
            (1 << 16) + (1 << 12) + (1 << 8) + (11 << 4) + 5;
        table[(1 << 4) + 1] = /* Object2Object Object2Object */
            (1 << 16) + (1 << 12) + (1 << 8) + (1 << 4) + 5;
        table[(1 << 4) + 12] = /* Object2Object null2Object */
            (1 << 16) + (1 << 12) + (1 << 8) + (12 << 4) + 5;

        table[(8 << 4) + 3] = (136 << 12) + (131 << 4) + 5;
        table[(8 << 4) + 7] = (136 << 12) + (135 << 4) + 5;
        table[(8 << 4) + 4] = (136 << 12) + (132 << 4) + 5;
        table[(8 << 4) + 8] = (136 << 12) + (136 << 4) + 5;
        table[(8 << 4) + 9] = (136 << 12) + (137 << 4) + 5;
        table[(8 << 4) + 2] = (136 << 12) + (130 << 4) + 5;
        table[(8 << 4) + 10] = (136 << 12) + (138 << 4) + 5;

        table[(9 << 4) + 3] = (153 << 12) + (147 << 4) + 5;
        table[(9 << 4) + 7] = (153 << 12) + (151 << 4) + 5;
        table[(9 << 4) + 4] = (153 << 12) + (148 << 4) + 5;
        table[(9 << 4) + 8] = (137 << 12) + (136 << 4) + 5;
        table[(9 << 4) + 9] = (153 << 12) + (153 << 4) + 5;
        table[(9 << 4) + 2] = (153 << 12) + (146 << 4) + 5;
        table[(9 << 4) + 10] = (153 << 12) + (154 << 4) + 5;

        table[(5 << 4) + 5] = (85 << 12) + (85 << 4) + 5;

        table[(2 << 4) + 3] = (162 << 12) + (163 << 4) + 5;
        table[(2 << 4) + 7] = (114 << 12) + (119 << 4) + 5;
        table[(2 << 4) + 4] = (162 << 12) + (164 << 4) + 5;
        table[(2 << 4) + 8] = (130 << 12) + (136 << 4) + 5;
        table[(2 << 4) + 9] = (146 << 12) + (153 << 4) + 5;
        table[(2 << 4) + 2] = (162 << 12) + (162 << 4) + 5;
        table[(2 << 4) + 10] = (162 << 12) + (170 << 4) + 5;

        table[(10 << 4) + 3] = (170 << 12) + (163 << 4) + 5;
        table[(10 << 4) + 7] = (122 << 12) + (119 << 4) + 5;
        table[(10 << 4) + 4] = (170 << 12) + (164 << 4) + 5;
        table[(10 << 4) + 8] = (138 << 12) + (136 << 4) + 5;
        table[(10 << 4) + 9] = (154 << 12) + (153 << 4) + 5;
        table[(10 << 4) + 2] = (170 << 12) + (162 << 4) + 5;
        table[(10 << 4) + 10] = (170 << 12) + (170 << 4) + 5;

        table[(12 << 4) + 11] = /* null2Object String2Object */
            (1 << 16) + (12 << 12) + (1 << 8) + (11 << 4) + 5;
        table[(12 << 4) + 1] = /* null2Object Object2Object */
            (1 << 16) + (12 << 12) + (1 << 8) + (1 << 4) + 5;
        table[(12 << 4) + 12] = /* null2Object null2Object */
            (1 << 16) + (12 << 12) + (1 << 8) + (12 << 4) + 5;
        return table;
    }

    public static int[] get_GREATER() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        return get_LESS();
    }

    public static int[] get_GREATER_EQUAL() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        return get_LESS();
    }

    public static int[] get_LEFT_SHIFT() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        int[] table = new int[16 * 16];

        table[(3 << 4) + 3] = (163 << 12) + (163 << 4) + 10;
        table[(3 << 4) + 7] = (163 << 12) + (167 << 4) + 10;
        table[(3 << 4) + 4] = (163 << 12) + (164 << 4) + 10;
        table[(3 << 4) + 2] = (163 << 12) + (162 << 4) + 10;
        table[(3 << 4) + 10] = (163 << 12) + (170 << 4) + 10;

        table[(7 << 4) + 3] = (119 << 12) + (163 << 4) + 7;
        table[(7 << 4) + 7] = (119 << 12) + (167 << 4) + 7;
        table[(7 << 4) + 4] = (119 << 12) + (164 << 4) + 7;
        table[(7 << 4) + 2] = (119 << 12) + (162 << 4) + 7;
        table[(7 << 4) + 10] = (119 << 12) + (170 << 4) + 7;

        table[(4 << 4) + 3] = (164 << 12) + (163 << 4) + 10;
        table[(4 << 4) + 7] = (164 << 12) + (167 << 4) + 10;
        table[(4 << 4) + 4] = (164 << 12) + (164 << 4) + 10;
        table[(4 << 4) + 2] = (164 << 12) + (162 << 4) + 10;
        table[(4 << 4) + 10] = (164 << 12) + (170 << 4) + 10;

        table[(2 << 4) + 3] = (162 << 12) + (163 << 4) + 10;
        table[(2 << 4) + 7] = (162 << 12) + (167 << 4) + 10;
        table[(2 << 4) + 4] = (162 << 12) + (164 << 4) + 10;
        table[(2 << 4) + 2] = (162 << 12) + (162 << 4) + 10;
        table[(2 << 4) + 10] = (162 << 12) + (170 << 4) + 10;

        table[(10 << 4) + 3] = (170 << 12) + (163 << 4) + 10;
        table[(10 << 4) + 7] = (170 << 12) + (167 << 4) + 10;
        table[(10 << 4) + 4] = (170 << 12) + (164 << 4) + 10;
        table[(10 << 4) + 2] = (170 << 12) + (162 << 4) + 10;
        table[(10 << 4) + 10] = (170 << 12) + (170 << 4) + 10;

        return table;
    }

    public static int[] get_LESS() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        int[] table = new int[16 * 16];

        table[(3 << 4) + 3] = (163 << 12) + (163 << 4) + 5;
        table[(3 << 4) + 7] = (115 << 12) + (119 << 4) + 5;
        table[(3 << 4) + 4] = (163 << 12) + (164 << 4) + 5;
        table[(3 << 4) + 8] = (131 << 12) + (136 << 4) + 5;
        table[(3 << 4) + 9] = (147 << 12) + (153 << 4) + 5;
        table[(3 << 4) + 2] = (163 << 12) + (162 << 4) + 5;
        table[(3 << 4) + 10] = (163 << 12) + (170 << 4) + 5;

        table[(7 << 4) + 3] = (119 << 12) + (115 << 4) + 5;
        table[(7 << 4) + 7] = (119 << 12) + (119 << 4) + 5;
        table[(7 << 4) + 4] = (119 << 12) + (116 << 4) + 5;
        table[(7 << 4) + 8] = (135 << 12) + (136 << 4) + 5;
        table[(7 << 4) + 9] = (151 << 12) + (153 << 4) + 5;
        table[(7 << 4) + 2] = (119 << 12) + (114 << 4) + 5;
        table[(7 << 4) + 10] = (119 << 12) + (122 << 4) + 5;

        table[(4 << 4) + 3] = (164 << 12) + (163 << 4) + 5;
        table[(4 << 4) + 7] = (116 << 12) + (119 << 4) + 5;
        table[(4 << 4) + 4] = (164 << 12) + (164 << 4) + 5;
        table[(4 << 4) + 8] = (132 << 12) + (136 << 4) + 5;
        table[(4 << 4) + 9] = (148 << 12) + (153 << 4) + 5;
        table[(4 << 4) + 2] = (164 << 12) + (162 << 4) + 5;
        table[(4 << 4) + 10] = (164 << 12) + (170 << 4) + 5;

        table[(8 << 4) + 3] = (136 << 12) + (131 << 4) + 5;
        table[(8 << 4) + 7] = (136 << 12) + (135 << 4) + 5;
        table[(8 << 4) + 4] = (136 << 12) + (132 << 4) + 5;
        table[(8 << 4) + 8] = (136 << 12) + (136 << 4) + 5;
        table[(8 << 4) + 9] = (136 << 12) + (137 << 4) + 5;
        table[(8 << 4) + 2] = (136 << 12) + (130 << 4) + 5;
        table[(8 << 4) + 10] = (136 << 12) + (138 << 4) + 5;

        table[(9 << 4) + 3] = (153 << 12) + (147 << 4) + 5;
        table[(9 << 4) + 7] = (153 << 12) + (151 << 4) + 5;
        table[(9 << 4) + 4] = (153 << 12) + (148 << 4) + 5;
        table[(9 << 4) + 8] = (137 << 12) + (136 << 4) + 5;
        table[(9 << 4) + 9] = (153 << 12) + (153 << 4) + 5;
        table[(9 << 4) + 2] = (153 << 12) + (146 << 4) + 5;
        table[(9 << 4) + 10] = (153 << 12) + (154 << 4) + 5;

        table[(2 << 4) + 3] = (162 << 12) + (163 << 4) + 5;
        table[(2 << 4) + 7] = (114 << 12) + (119 << 4) + 5;
        table[(2 << 4) + 4] = (162 << 12) + (164 << 4) + 5;
        table[(2 << 4) + 8] = (130 << 12) + (136 << 4) + 5;
        table[(2 << 4) + 9] = (146 << 12) + (153 << 4) + 5;
        table[(2 << 4) + 2] = (162 << 12) + (162 << 4) + 5;
        table[(2 << 4) + 10] = (162 << 12) + (170 << 4) + 5;

        table[(10 << 4) + 3] = (170 << 12) + (163 << 4) + 5;
        table[(10 << 4) + 7] = (122 << 12) + (119 << 4) + 5;
        table[(10 << 4) + 4] = (170 << 12) + (164 << 4) + 5;
        table[(10 << 4) + 8] = (138 << 12) + (136 << 4) + 5;
        table[(10 << 4) + 9] = (154 << 12) + (153 << 4) + 5;
        table[(10 << 4) + 2] = (170 << 12) + (162 << 4) + 5;
        table[(10 << 4) + 10] = (170 << 12) + (170 << 4) + 5;

        return table;
    }

    public static int[] get_LESS_EQUAL() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        return get_LESS();
    }

    public static int[] get_MINUS() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        int[] table = get_PLUS().clone();

        // customization
        table[(11 << 4) + 3] = 0;
        table[(11 << 4) + 7] = 0;
        table[(11 << 4) + 4] = 0;
        table[(11 << 4) + 6] = 0;
        table[(11 << 4) + 11] = 0;
        table[(11 << 4) + 1] = 0;
        table[(11 << 4) + 8] = 0;
        table[(11 << 4) + 9] = 0;
        table[(11 << 4) + 5] = 0;
        table[(11 << 4) + 2] = 0;
        table[(11 << 4) + 10] = 0;
        table[(11 << 4) + 12] = 0;

        table[(3 << 4) + 11] = 0;
        table[(7 << 4) + 11] = 0;
        table[(4 << 4) + 11] = 0;
        table[(6 << 4) + 11] = 0;
        table[(1 << 4) + 11] = 0;
        table[(8 << 4) + 11] = 0;
        table[(9 << 4) + 11] = 0;
        table[(5 << 4) + 11] = 0;
        table[(2 << 4) + 11] = 0;
        table[(10 << 4) + 11] = 0;
        table[(12 << 4) + 11] = 0;

        table[(12 << 4) + 12] = 0;

        return table;
    }

    public static int[] get_MULTIPLY() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        return get_MINUS();
    }

    public static int[] get_OR() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        return get_AND();
    }

    public static int[] get_OR_OR() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        return get_AND_AND();
    }

    public static int[] get_PLUS() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        int[] table = new int[16 * 16];

        table[(3 << 4) + 3] = (163 << 12) + (163 << 4) + 10;
        table[(3 << 4) + 7] = (115 << 12) + (119 << 4) + 7;
        table[(3 << 4) + 4] = (163 << 12) + (164 << 4) + 10;
        table[(3 << 4) + 11] = (51 << 12) + (187 << 4) + 11;
        table[(3 << 4) + 8] = (131 << 12) + (136 << 4) + 8;
        table[(3 << 4) + 9] = (147 << 12) + (153 << 4) + 9;
        table[(3 << 4) + 2] = (163 << 12) + (162 << 4) + 10;
        table[(3 << 4) + 10] = (163 << 12) + (170 << 4) + 10;

        table[(7 << 4) + 3] = (119 << 12) + (115 << 4) + 7;
        table[(7 << 4) + 7] = (119 << 12) + (119 << 4) + 7;
        table[(7 << 4) + 4] = (119 << 12) + (116 << 4) + 7;
        table[(7 << 4) + 11] = (119 << 12) + (187 << 4) + 11;
        table[(7 << 4) + 8] = (135 << 12) + (136 << 4) + 8;
        table[(7 << 4) + 9] = (151 << 12) + (153 << 4) + 9;
        table[(7 << 4) + 2] = (119 << 12) + (114 << 4) + 7;
        table[(7 << 4) + 10] = (119 << 12) + (122 << 4) + 7;

        table[(4 << 4) + 3] = (164 << 12) + (163 << 4) + 10;
        table[(4 << 4) + 7] = (116 << 12) + (119 << 4) + 7;
        table[(4 << 4) + 4] = (164 << 12) + (164 << 4) + 10;
        table[(4 << 4) + 11] = (68 << 12) + (187 << 4) + 11;
        table[(4 << 4) + 8] = (132 << 12) + (136 << 4) + 8;
        table[(4 << 4) + 9] = (148 << 12) + (153 << 4) + 9;
        table[(4 << 4) + 2] = (164 << 12) + (162 << 4) + 10;
        table[(4 << 4) + 10] = (164 << 12) + (170 << 4) + 10;

        table[(11 << 4) + 3] = (187 << 12) + (51 << 4) + 11;
        table[(11 << 4) + 7] = (187 << 12) + (119 << 4) + 11;
        table[(11 << 4) + 4] = (187 << 12) + (68 << 4) + 11;
        table[(11 << 4) + 11] = (187 << 12) + (187 << 4) + 11;
        table[(11 << 4) + 1] = (187 << 12) + (17 << 4) + 11;
        table[(11 << 4) + 8] = (187 << 12) + (136 << 4) + 11;
        table[(11 << 4) + 9] = (187 << 12) + (153 << 4) + 11;
        table[(11 << 4) + 5] = (187 << 12) + (85 << 4) + 11;
        table[(11 << 4) + 2] = (187 << 12) + (34 << 4) + 11;
        table[(11 << 4) + 10] = (187 << 12) + (170 << 4) + 11;
        table[(11 << 4) + 12] = (187 << 12) + (12 << 8) + (12 << 4) + 11;

        table[(1 << 4) + 11] = (17 << 12) + (187 << 4) + 11;

        table[(8 << 4) + 3] = (136 << 12) + (131 << 4) + 8;
        table[(8 << 4) + 7] = (136 << 12) + (135 << 4) + 8;
        table[(8 << 4) + 4] = (136 << 12) + (132 << 4) + 8;
        table[(8 << 4) + 11] = (136 << 12) + (187 << 4) + 11;
        table[(8 << 4) + 8] = (136 << 12) + (136 << 4) + 8;
        table[(8 << 4) + 9] = (136 << 12) + (137 << 4) + 8;
        table[(8 << 4) + 2] = (136 << 12) + (130 << 4) + 8;
        table[(8 << 4) + 10] = (136 << 12) + (138 << 4) + 8;

        table[(9 << 4) + 3] = (153 << 12) + (147 << 4) + 9;
        table[(9 << 4) + 7] = (153 << 12) + (151 << 4) + 9;
        table[(9 << 4) + 4] = (153 << 12) + (148 << 4) + 9;
        table[(9 << 4) + 11] = (153 << 12) + (187 << 4) + 11;
        table[(9 << 4) + 8] = (137 << 12) + (136 << 4) + 8;
        table[(9 << 4) + 9] = (153 << 12) + (153 << 4) + 9;
        table[(9 << 4) + 2] = (153 << 12) + (146 << 4) + 9;
        table[(9 << 4) + 10] = (153 << 12) + (154 << 4) + 9;

        table[(5 << 4) + 11] = (85 << 12) + (187 << 4) + 11;

        table[(2 << 4) + 3] = (162 << 12) + (163 << 4) + 10;
        table[(2 << 4) + 7] = (114 << 12) + (119 << 4) + 7;
        table[(2 << 4) + 4] = (162 << 12) + (164 << 4) + 10;
        table[(2 << 4) + 11] = (34 << 12) + (187 << 4) + 11;
        table[(2 << 4) + 8] = (130 << 12) + (136 << 4) + 8;
        table[(2 << 4) + 9] = (146 << 12) + (153 << 4) + 9;
        table[(2 << 4) + 2] = (162 << 12) + (162 << 4) + 10;
        table[(2 << 4) + 10] = (162 << 12) + (170 << 4) + 10;

        table[(10 << 4) + 3] = (170 << 12) + (163 << 4) + 10;
        table[(10 << 4) + 7] = (122 << 12) + (119 << 4) + 7;
        table[(10 << 4) + 4] = (170 << 12) + (164 << 4) + 10;
        table[(10 << 4) + 11] = (170 << 12) + (187 << 4) + 11;
        table[(10 << 4) + 8] = (138 << 12) + (136 << 4) + 8;
        table[(10 << 4) + 9] = (154 << 12) + (153 << 4) + 9;
        table[(10 << 4) + 2] = (170 << 12) + (162 << 4) + 10;
        table[(10 << 4) + 10] = (170 << 12) + (170 << 4) + 10;

        table[(12 << 4) + 11] = (12 << 16) + (12 << 12) + (187 << 4) + 11;

        return table;
    }

    public static int[] get_REMAINDER() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        return get_MINUS();
    }

    public static int[] get_RIGHT_SHIFT() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        return get_LEFT_SHIFT();
    }

    public static int[] get_UNSIGNED_RIGHT_SHIFT() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        return get_LEFT_SHIFT();
    }

    public static int[] get_XOR() {

        // the code is an int
        // (cast) left Op (cast) rigth --> result
        // 0000 0000 0000 0000 0000
        // <<16 <<12 <<8 <<4

        return get_AND();
    }

}
