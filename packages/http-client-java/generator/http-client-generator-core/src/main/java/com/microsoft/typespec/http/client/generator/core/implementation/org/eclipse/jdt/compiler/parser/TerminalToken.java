// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2022 IBM Corporation and others.
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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser;

/**
 * Token types returned by the {@link Scanner}. Terminal symbols of the Java grammar use the numbers that the parser
 * tables use; the other token types use numbers outside that range.
 */
public abstract class TerminalToken {

    public static final int TokenNameInvalid = -1;
    public static final int TokenNameNotAToken = 0;
    public static final int TokenNameWHITESPACE = 1000;
    public static final int TokenNameCOMMENT_LINE = 1001;
    public static final int TokenNameCOMMENT_BLOCK = 1002;
    public static final int TokenNameCOMMENT_JAVADOC = 1003;

    public static final int TokenNameIdentifier = 27;
    public static final int TokenNameabstract = 51;
    public static final int TokenNameassert = 90;
    public static final int TokenNameboolean = 103;
    public static final int TokenNamebreak = 91;
    public static final int TokenNamebyte = 104;
    public static final int TokenNamecase = 105;
    public static final int TokenNamecatch = 106;
    public static final int TokenNamechar = 107;
    public static final int TokenNameclass = 69;
    public static final int TokenNamecontinue = 92;
    public static final int TokenNameconst = 135;
    public static final int TokenNamedefault = 86;
    public static final int TokenNamedo = 93;
    public static final int TokenNamedouble = 108;
    public static final int TokenNameelse = 117;
    public static final int TokenNameenum = 83;
    public static final int TokenNameextends = 102;
    public static final int TokenNamefalse = 40;
    public static final int TokenNamefinal = 52;
    public static final int TokenNamefinally = 116;
    public static final int TokenNamefloat = 109;
    public static final int TokenNamefor = 94;
    public static final int TokenNamegoto = 136;
    public static final int TokenNameif = 95;
    public static final int TokenNameimplements = 131;
    public static final int TokenNameimport = 110;
    public static final int TokenNameinstanceof = 14;
    public static final int TokenNameint = 111;
    public static final int TokenNameinterface = 82;
    public static final int TokenNamelong = 112;
    public static final int TokenNamenative = 53;
    public static final int TokenNamenew = 36;

    public static final int TokenNamenull = 41;
    public static final int TokenNamepackage = 101;
    public static final int TokenNameprivate = 55;
    public static final int TokenNameprotected = 56;
    public static final int TokenNamepublic = 57;
    public static final int TokenNamereturn = 96;
    public static final int TokenNameshort = 113;
    public static final int TokenNamestatic = 38;
    public static final int TokenNamestrictfp = 58;
    public static final int TokenNamesuper = 34;
    public static final int TokenNameswitch = 62;
    public static final int TokenNamesynchronized = 39;
    public static final int TokenNamethis = 35;
    public static final int TokenNamethrow = 87;
    public static final int TokenNamethrows = 118;
    public static final int TokenNametransient = 59;
    public static final int TokenNametrue = 42;
    public static final int TokenNametry = 97;
    public static final int TokenNamevoid = 114;
    public static final int TokenNamevolatile = 60;
    public static final int TokenNamewhile = 88;
    public static final int TokenNamemodule = 115;
    public static final int TokenNameopen = 119;
    public static final int TokenNamerequires = 120;
    public static final int TokenNametransitive = 126;
    public static final int TokenNameexports = 121;
    public static final int TokenNameopens = 122;
    public static final int TokenNameto = 132;
    public static final int TokenNameuses = 123;
    public static final int TokenNameprovides = 124;
    public static final int TokenNamewith = 133;
    public static final int TokenNameIntegerLiteral = 43;
    public static final int TokenNameLongLiteral = 44;
    public static final int TokenNameFloatingPointLiteral = 45;
    public static final int TokenNameDoubleLiteral = 46;
    public static final int TokenNameCharacterLiteral = 47;
    public static final int TokenNameStringLiteral = 48;

    public static final int TokenNamePLUS_PLUS = 8;
    public static final int TokenNameMINUS_MINUS = 9;
    public static final int TokenNameEQUAL_EQUAL = 19;
    public static final int TokenNameLESS_EQUAL = 15;
    public static final int TokenNameGREATER_EQUAL = 16;
    public static final int TokenNameNOT_EQUAL = 20;
    public static final int TokenNameLEFT_SHIFT = 18;
    public static final int TokenNameRIGHT_SHIFT = 12;
    public static final int TokenNameUNSIGNED_RIGHT_SHIFT = 13;
    public static final int TokenNamePLUS_EQUAL = 70;
    public static final int TokenNameMINUS_EQUAL = 71;
    public static final int TokenNameMULTIPLY_EQUAL = 72;
    public static final int TokenNameDIVIDE_EQUAL = 73;
    public static final int TokenNameAND_EQUAL = 74;
    public static final int TokenNameOR_EQUAL = 75;
    public static final int TokenNameXOR_EQUAL = 76;
    public static final int TokenNameREMAINDER_EQUAL = 77;
    public static final int TokenNameLEFT_SHIFT_EQUAL = 78;
    public static final int TokenNameRIGHT_SHIFT_EQUAL = 79;
    public static final int TokenNameUNSIGNED_RIGHT_SHIFT_EQUAL = 80;
    public static final int TokenNameOR_OR = 26;
    public static final int TokenNameAND_AND = 25;
    public static final int TokenNamePLUS = 1;
    public static final int TokenNameMINUS = 2;
    public static final int TokenNameNOT = 63;
    public static final int TokenNameREMAINDER = 5;
    public static final int TokenNameXOR = 22;
    public static final int TokenNameAND = 21;
    public static final int TokenNameMULTIPLY = 4;
    public static final int TokenNameOR = 23;
    public static final int TokenNameTWIDDLE = 64;
    public static final int TokenNameDIVIDE = 6;
    public static final int TokenNameGREATER = 17;
    public static final int TokenNameLESS = 7;
    public static final int TokenNameLPAREN = 28;
    public static final int TokenNameRPAREN = 29;
    public static final int TokenNameLBRACE = 61;
    public static final int TokenNameRBRACE = 33;
    public static final int TokenNameLBRACKET = 11;
    public static final int TokenNameRBRACKET = 100;
    public static final int TokenNameSEMICOLON = 31;
    public static final int TokenNameQUESTION = 24;
    public static final int TokenNameCOLON = 81;
    public static final int TokenNameCOMMA = 32;
    public static final int TokenNameDOT = 3;
    public static final int TokenNameEQUAL = 67;
    public static final int TokenNameAT = 37;
    public static final int TokenNameELLIPSIS = 127;
    public static final int TokenNameARROW = 125;
    public static final int TokenNameCOLON_COLON = 10;
    public static final int TokenNameBeginLambda = 85;
    public static final int TokenNameBeginIntersectionCast = 66;
    public static final int TokenNameBeginTypeArguments = 98;
    public static final int TokenNameAT308 = 30;
    public static final int TokenNameAT308DOTDOTDOT = 134;

    public static final int TokenNameEOF = 68;
    public static final int TokenNameERROR = 137;

}
