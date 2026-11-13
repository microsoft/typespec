// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
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
 *     Tom Tromey - patch for readTable(String) as described in http://bugs.eclipse.org/bugs/show_bug.cgi?id=32196
 *     Stephan Herrmann - Contributions for
 *								bug 366003 - CCE in ASTNode.resolveAnnotations(ASTNode.java:639)
 *								bug 374605 - Unreasonable warning for enum-based switch statements
 *								bug 393719 - [compiler] inconsistent warnings on iteration variables
 *								bug 382353 - [1.8][compiler] Implementation property modifiers should be accepted on default methods.
 *								bug 383973 - [1.8][compiler] syntax recovery in the presence of default methods
 *								bug 401035 - [1.8] A few tests have started failing recently
 *     Jesper S Moller - Contributions for
 *							bug 382701 - [1.8][compiler] Implement semantic analysis of Lambda expressions & Reference expression
 *							bug 399695 - [1.8][compiler] [1.8][compiler] migrate parser to other syntax for default methods
 *							bug 384567 - [1.5][compiler] Compiler accepts illegal modifiers on package declaration
 *							bug 393192 - Incomplete type hierarchy with > 10 annotations
 *							bug 527554 - [18.3] Compiler support for JEP 286 Local-Variable Type
 *        Andy Clement - Contributions for
 *                          Bug 383624 - [1.8][compiler] Revive code generation support for type annotations (from Olivier's work)
 *                          Bug 409250 - [1.8][compiler] Various loose ends in 308 code generation
 *                          Bug 415821 - [1.8][compiler] CLASS_EXTENDS target type annotation missing for anonymous classes
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser;

import static com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken.*;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.InvalidInputException;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.AND_AND_Expression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.AbstractMethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.AbstractVariableDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.AllocationExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Annotation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.AnnotationMethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Argument;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ArrayAllocationExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ArrayInitializer;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ArrayQualifiedTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ArrayReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ArrayTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.AssertStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Assignment;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.BinaryExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Block;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.BreakStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.CaseStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.CastExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.CharLiteral;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ClassLiteralAccess;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.CombinedBinaryExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.CompilationUnitDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.CompoundAssignment;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ConditionalExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ConstructorDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ContinueStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.DoStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.DoubleLiteral;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.EitherOrMultiPattern;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.EmptyStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.EqualExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ExplicitConstructorCall;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ExportsStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Expression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.FakeDefaultLiteral;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.FalseLiteral;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.FieldDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.FieldReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.FloatLiteral;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ForStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ForeachStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.GuardedPattern;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.IfStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ImplicitTypeDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ImportReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Initializer;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.InstanceOfExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.IntLiteral;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.IntersectionCastTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Javadoc;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.LabeledStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.LambdaExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.LocalDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.LongLiteral;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.MarkerAnnotation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.MemberValuePair;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.MessageSend;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.MethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ModuleDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ModuleReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.NameReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.NormalAnnotation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.NullLiteral;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.OR_OR_Expression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.OpensStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.PackageVisibilityStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ParameterizedQualifiedTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ParameterizedSingleTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Pattern;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.PostfixExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.PrefixExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ProvidesStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.QualifiedAllocationExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.QualifiedNameReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.QualifiedSuperReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.QualifiedThisReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.QualifiedTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Receiver;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.RecordComponent;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.RecordPattern;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Reference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ReferenceExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.RequiresStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ReturnStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.SingleMemberAnnotation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.SingleNameReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.SingleTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Statement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.StringLiteral;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.SuperReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.SwitchExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.SwitchStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.SynchronizedStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TextBlock;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ThisReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ThrowStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TrueLiteral;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TryStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TypeDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TypeParameter;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TypePattern;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.UnaryExpression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.UnionTypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.UsesStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.WhileStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Wildcard;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.YieldStatement;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.classfmt.ClassFileConstants;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.env.ICompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.CompilerOptions;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.JavaFeature;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.ReferenceContext;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.ClassScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.MethodScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.TypeConstants;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.diagnose.DiagnoseParser;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortCompilation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.AbortCompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem.ProblemHandler;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Messages;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.Runtime.Version;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import java.util.Properties;
import java.util.stream.Stream;

@SuppressWarnings({ "rawtypes", "unchecked" })
public abstract class Parser implements ConflictedParser {

    public static final char[] FALL_THROUGH_TAG = "$FALL-THROUGH$".toCharArray(); //$NON-NLS-1$
    public static final char[] CASES_OMITTED_TAG = "$CASES-OMITTED$".toCharArray(); //$NON-NLS-1$

    public static char[] asb = null;
    public static char[] asr = null;

    public static char[] base_action = null;

    public static short[] check_table = null;

    public static char[] in_symb = null;
    // $NON-NLS-1$
    public static char[] lhs = null;

    public static String[] name = null;
    public static char[] nasb = null;
    public static char[] nasr = null;
    public static char[] non_terminal_index = null;

    public static String[] readableName = null;

    public static byte[] rhs = null;

    public static int[] reverse_index = null;
    public static char[] recovery_templates_index = null;
    public static char[] recovery_templates = null;
    public static char[] statements_recovery_filter = null;

    public static long[] rules_compliance = null;

    public static char[] scope_la = null;
    public static char[] scope_lhs = null;

    public static char[] scope_prefix = null;
    public static char[] scope_rhs = null;
    public static char[] scope_state = null;

    public static char[] scope_state_set = null;
    public static char[] scope_suffix = null;

    public static char[] term_action = null;
    public static char[] term_check = null;

    public static char[] terminal_index = null;

    private enum LocalTypeKind {
        LOCAL, METHOD_REFERENCE, LAMBDA,
    }

    protected enum CaseLabelKind {
        CASE_EXPRESSION,  // case null is subsumed by CASE_EXPRESSION
        CASE_DEFAULT,
        CASE_PATTERN
    }

    protected enum SwitchRuleKind {
        EXPRESSION, BLOCK, THROW,
    }

    public Scanner scanner;
    public TerminalToken currentToken = TokenNameNotAToken;

    static {
        try {
            initTables();
        } catch (java.io.IOException ex) {
            throw new ExceptionInInitializerError(ex.getMessage());
        }
    }

    public static int asi(int state) {
        return asb[original_state(state)];
    }

    public static short base_check(int i) {
        return check_table[i - (936 + 1)];
    }

    protected static int[] computeReverseTable(char[] newTerminalIndex, char[] newNonTerminalIndex, String[] newName) {
        int[] newReverseTable = new int[newName.length];
        for (int j = 0; j < newName.length; j++) {
            found: {
                for (int k = 0; k < newTerminalIndex.length; k++) {
                    if (newTerminalIndex[k] == j) {
                        newReverseTable[j] = k;
                        break found;
                    }
                }
                for (int k = 0; k < newNonTerminalIndex.length; k++) {
                    if (newNonTerminalIndex[k] == j) {
                        newReverseTable[j] = -k;
                        break found;
                    }
                }
            }
        }
        return newReverseTable;
    }

    public static int in_symbol(int state) {
        return in_symb[original_state(state)];
    }

    public static void initTables() throws java.io.IOException {

        int i = 0;
        lhs = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        char[] chars = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        check_table = new short[chars.length];
        for (int c = chars.length; c-- > 0;) {
            check_table[c] = (short) (chars[c] - 32768);
        }
        asb = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        asr = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        nasb = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        nasr = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        terminal_index = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        non_terminal_index = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        term_action = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$

        scope_prefix = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        scope_suffix = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        scope_lhs = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        scope_state_set = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        scope_rhs = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        scope_state = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        in_symb = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$

        rhs = readByteTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        term_check = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        scope_la = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$

        name = readNameTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$

        rules_compliance = readLongTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$

        readableName = readReadableNameTable(); // $NON-NLS-1$

        reverse_index = computeReverseTable(terminal_index, non_terminal_index, name);

        recovery_templates_index = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$
        recovery_templates = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$

        statements_recovery_filter = readTable("parser" + (++i) + ".rsc"); //$NON-NLS-1$

        base_action = lhs;
    }

    public static int nasi(int state) {
        return nasb[original_state(state)];
    }

    public static int ntAction(int state, int sym) {
        return base_action[state + sym];
    }

    protected static int original_state(int state) {
        return -base_check(state);
    }

    protected static byte[] readByteTable(String filename) throws java.io.IOException {

        // files are located at Parser.class directory

        byte[] bytes;
        try (InputStream stream = Parser.class.getResourceAsStream(filename)) {
            if (stream == null) {
                throw new java.io.IOException(Messages.bind("missing file {0}", filename));
            }
            bytes = Util.getInputStreamAsByteArray(new BufferedInputStream(stream));
        }
        return bytes;
    }

    protected static long[] readLongTable(String filename) throws java.io.IOException {

        // files are located at Parser.class directory

        byte[] bytes;
        try (InputStream stream = Parser.class.getResourceAsStream(filename)) {
            if (stream == null) {
                throw new java.io.IOException(Messages.bind("missing file {0}", filename));
            }
            bytes = Util.getInputStreamAsByteArray(new BufferedInputStream(stream));
        }

        // minimal integrity check (even size expected)
        int length = bytes.length;
        if (length % 8 != 0)
            throw new java.io.IOException(Messages.bind("corrupted file {0}", filename));

        // convert bytes into longs
        long[] longs = new long[length / 8];
        int i = 0;
        int longIndex = 0;

        while (true) {
            longs[longIndex++] = (((long) (bytes[i++] & 0xFF)) << 56) + (((long) (bytes[i++] & 0xFF)) << 48)
                + (((long) (bytes[i++] & 0xFF)) << 40) + (((long) (bytes[i++] & 0xFF)) << 32)
                + (((long) (bytes[i++] & 0xFF)) << 24) + (((long) (bytes[i++] & 0xFF)) << 16)
                + (((long) (bytes[i++] & 0xFF)) << 8) + (bytes[i++] & 0xFF);

            if (i == length)
                break;
        }
        return longs;
    }

    protected static String[] readNameTable(String filename) throws java.io.IOException {
        char[] contents = readTable(filename);
        char[][] nameAsChar = CharOperation.splitOn('\n', contents);

        String[] result = new String[nameAsChar.length + 1];
        result[0] = null;
        for (int i = 0; i < nameAsChar.length; i++) {
            result[i + 1] = new String(nameAsChar[i]);
        }

        return result;
    }

    protected static String[] readReadableNameTable() {
        String[] result = new String[name.length];

        Properties props = new Properties();
        try (InputStream is = Parser.class.getResourceAsStream("readableNames.props")) {
            props.load(is);
        } catch (IOException e) {
            result = name;
            return result;
        }
        System.arraycopy(name, 0, result, 0, 137 + 1);
        for (int i = 137; i < name.length; i++) {
            String n = props.getProperty(name[i]);
            if (n != null && n.length() > 0) {
                result[i] = n;
            } else {
                result[i] = name[i];
            }
        }
        return result;
    }

    protected static char[] readTable(String filename) throws java.io.IOException {

        // files are located at Parser.class directory

        byte[] bytes;
        try (InputStream stream = Parser.class.getResourceAsStream(filename)) {
            if (stream == null) {
                throw new java.io.IOException(Messages.bind("missing file {0}", filename));
            }
            bytes = Util.getInputStreamAsByteArray(new BufferedInputStream(stream));
        }

        // minimal integrity check (even size expected)
        int length = bytes.length;
        if ((length & 1) != 0)
            throw new java.io.IOException(Messages.bind("corrupted file {0}", filename));

        // convert bytes into chars
        char[] chars = new char[length / 2];
        int i = 0;
        int charIndex = 0;

        while (true) {
            chars[charIndex++] = (char) (((bytes[i++] & 0xFF) << 8) + (bytes[i++] & 0xFF));
            if (i == length)
                break;
        }
        return chars;
    }

    public static int tAction(int state, int sym) {
        return term_action[term_check[base_action[state] + sym] == sym ? base_action[state] + sym : base_action[state]];
    }

    protected int astLengthPtr;

    protected int[] astLengthStack;
    protected int astPtr;
    protected ASTNode[] astStack = new ASTNode[100];

    public CompilationUnitDeclaration compilationUnit; /* the result from parse() */

    protected RecoveredElement currentElement;

    protected boolean diet = false; // tells the scanner to jump over some parts of the code/expressions like method
    protected int dietInt = 0; // if > 0 force the none-diet-parsing mode (even if diet if requested) [field parsing
    protected int endPosition; // accurate only when used ! (the start position is pushed into intStack while the end
    protected int endStatementPosition;
    protected int expressionLengthPtr;
    protected int[] expressionLengthStack;
    protected int expressionPtr;
    protected Expression[] expressionStack = new Expression[100];
    protected int rBracketPosition;
    public TerminalToken firstToken = TokenNameNotAToken; // handle for multiple parsing goals

    /*
     * jsr308 -- Type annotation management, we now maintain type annotations in a separate stack as otherwise they get
     * interspersed with other expressions and some of the code is not prepared to handle such interleaving and will
     * look ugly if changed.
     *
     * See consumeArrayCreationExpressionWithoutInitializer for example.
     *
     * Where SE8 annotations occur in a place SE5 annotations are legal, the SE8 annotations end up in the expression
     * stack as we have no way of distinguishing between the two.
     */
    protected int typeAnnotationPtr;
    protected int typeAnnotationLengthPtr;
    protected Annotation[] typeAnnotationStack = new Annotation[100];
    protected int[] typeAnnotationLengthStack;

    // generics management
    protected int genericsIdentifiersLengthPtr;
    protected int[] genericsIdentifiersLengthStack = new int[10];
    protected int genericsLengthPtr;
    protected int[] genericsLengthStack = new int[10];
    protected int genericsPtr;
    protected ASTNode[] genericsStack = new ASTNode[10];
    protected boolean hasError;
    protected boolean hasReportedError;
    // identifiers stacks
    protected int identifierLengthPtr;
    protected int[] identifierLengthStack;
    protected long[] identifierPositionStack;
    protected int identifierPtr;
    protected char[][] identifierStack;
    protected boolean ignoreNextOpeningBrace;

    // positions , dimensions , .... (int stacks)
    protected int intPtr;

    protected int[] intStack;
    public int lastAct;
    // error recovery management
    protected int lastCheckPoint;
    protected int lastErrorEndPositionBeforeRecovery = -1;
    protected TerminalToken lastIgnoredToken = TokenNameNotAToken, nextIgnoredToken = TokenNameNotAToken;

    protected int listLength; // for recovering some incomplete list (interfaces, throws or parameters)

    protected int listTypeParameterLength; // for recovering some incomplete list (type parameters)
    protected int lParenPos, rParenPos; // accurate only when used !
    protected int modifiers;
    protected int modifiersSourceStart;
    protected int annotationAsModifierSourceStart = -1;
    protected int[] nestedMethod; // the ptr is nestedType
    protected int forStartPosition = 0;

    protected int nestedType, dimensions;
    ASTNode[] noAstNodes = new ASTNode[100];

    Expression[] noExpressions = new Expression[100];
    // modifiers dimensions nestedType etc.......
    protected boolean optimizeStringLiterals = true;
    protected CompilerOptions options;

    protected ProblemHandler problemReporter;

    protected int rBraceStart, rBraceEnd, rBraceSuccessorStart; // accurate only when used !
    protected int realBlockPtr;
    protected int[] realBlockStack;
    protected int recoveredStaticInitializerStart;
    public ReferenceContext referenceContext;
    public boolean reportOnlyOneSyntaxError = false;
    public boolean reportSyntaxErrorIsRequired = true;
    protected boolean restartRecovery;

    protected int lastPosistion;
// statement recovery
    public boolean methodRecoveryActivated = false;
    protected boolean statementRecoveryActivated = false;
    protected TypeDeclaration[] recoveredTypes;
    protected int recoveredTypePtr;
    protected int nextTypeStart;
    protected TypeDeclaration pendingRecoveredType;
    public RecoveryScanner recoveryScanner;

    protected int[] stack = new int[255];
    protected int stateStackTop;
    protected int synchronizedBlockSourceStart;

    protected int[] variablesCounter;

    protected boolean checkExternalizeStrings;

    protected boolean recordStringLiterals;
// javadoc
    public Javadoc javadoc;
    public JavadocParser javadocParser;
// used for recovery
    protected int lastJavadocEnd;

    protected int unstackedAct = 17981;

    private boolean tolerateDefaultClassMethods = false;
    private boolean processingLambdaParameterList = false;
    private boolean expectTypeAnnotation = false;

    protected boolean parsingRecordComponents = false;

    public Parser() {
        // Caveat Emptor: For inheritance purposes and then only in very special needs. Only minimal state is
        // initialized !
    }

    public Parser(ProblemHandler problemReporter) {
        this.problemReporter = problemReporter;
        this.options = problemReporter.options;
        this.optimizeStringLiterals = false;
        initializeScanner();
        this.astLengthStack = new int[50];
        this.expressionLengthStack = new int[30];
        this.typeAnnotationLengthStack = new int[30];
        this.intStack = new int[50];
        this.identifierStack = new char[30][];
        this.identifierLengthStack = new int[30];
        this.nestedMethod = new int[30];
        this.realBlockStack = new int[30];
        this.identifierPositionStack = new long[30];
        this.variablesCounter = new int[30];
        // javadoc support
        this.javadocParser = createJavadocParser();
    }

    protected void annotationRecoveryCheckPoint(int end) {
        if (this.lastCheckPoint < end) {
            this.lastCheckPoint = end + 1;
        }
    }

    public void arrayInitializer(int length) {
        // length is the size of the array Initializer
        // expressionPtr points on the last elt of the arrayInitializer,
        // in other words, it has not been decremented yet.

        ArrayInitializer ai = new ArrayInitializer();
        if (length != 0) {
            this.expressionPtr -= length;
            System.arraycopy(this.expressionStack, this.expressionPtr + 1, ai.expressions = new Expression[length], 0,
                length);
        }
        pushOnExpressionStack(ai);
        // positionning
        ai.sourceEnd = this.endStatementPosition;
        ai.sourceStart = this.intStack[this.intPtr--];
    }

    protected void blockReal() {
        // See consumeLocalVariableDeclarationStatement in case of change: duplicated code
        // increment the amount of declared variables for this block
        this.realBlockStack[this.realBlockPtr]++;
    }

    /*
     * Build initial recovery state. Recovery state is inferred from the current state of the parser (reduced node
     * stack).
     */
    public RecoveredElement buildInitialRecoveryState() {

        /*
         * initialize recovery by retrieving available reduced nodes also rebuild bracket balance
         */
        this.lastCheckPoint = 0;
        this.lastErrorEndPositionBeforeRecovery = this.scanner.currentPosition;

        RecoveredElement element = null;
        if (this.referenceContext instanceof CompilationUnitDeclaration) {
            element = new RecoveredUnit(this.compilationUnit, this);

            /*
             * ignore current stack state, since restarting from the beginnning since could not trust simple brace count
             */
            // restart recovery from scratch
            this.compilationUnit.currentPackage = null;
            this.compilationUnit.imports = null;
            this.compilationUnit.types = null;
            this.currentToken = TokenNameNotAToken;
            this.listLength = 0;
            this.parsingRecordComponents = false;
            this.listTypeParameterLength = 0;
            this.endPosition = 0;
            this.endStatementPosition = 0;
            return element;
        } else if (this.referenceContext instanceof AbstractMethodDeclaration methodDeclaration) {
            element = new RecoveredMethod(methodDeclaration, null, 0, this);
            this.lastCheckPoint = methodDeclaration.bodyStart;
            if (this.statementRecoveryActivated) {
                element = element.add(new Block(0), 0);
            }
        } else {
            /* Initializer bodies are parsed in the context of the type declaration, we must thus search it inside */
            if (this.referenceContext instanceof TypeDeclaration type) {
                FieldDeclaration[] fieldDeclarations = type.fields;
                int length = fieldDeclarations == null ? 0 : fieldDeclarations.length;
                for (int i = 0; i < length; i++) {
                    FieldDeclaration field = fieldDeclarations[i];
                    if (field != null
                        && field.getKind() == 2
                        && ((Initializer) field).block != null
                        && field.declarationSourceStart <= this.scanner.initialPosition
                        && this.scanner.initialPosition <= field.declarationSourceEnd
                        && this.scanner.eofPosition <= field.declarationSourceEnd + 1) {
                        element = new RecoveredInitializer(field, null, 1, this);
                        this.lastCheckPoint = field.declarationSourceStart;
                        break;
                    }
                }
            }
        }

        if (element == null)
            return element;

        for (int i = 0; i <= this.astPtr; i++) {
            ASTNode node = this.astStack[i];
            if (node instanceof AbstractMethodDeclaration method) {
                if (method.declarationSourceEnd == 0) {
                    element = element.add(method, 0);
                    this.lastCheckPoint = method.bodyStart;
                } else {
                    element = element.add(method, 0);
                    this.lastCheckPoint = method.declarationSourceEnd + 1;
                }
                continue;
            }
            if (node instanceof Initializer initializer) {
                // ignore initializer with no block
                if (initializer.block == null)
                    continue;
                if (initializer.declarationSourceEnd == 0) {
                    element = element.add(initializer, 1);
                    this.lastCheckPoint = initializer.sourceStart;
                } else {
                    element = element.add(initializer, 0);
                    this.lastCheckPoint = initializer.declarationSourceEnd + 1;
                }
                continue;
            }
            if (node instanceof FieldDeclaration field) {
                if (field.declarationSourceEnd == 0) {
                    element = element.add(field, 0);
                    if (field.initialization == null) {
                        this.lastCheckPoint = field.sourceEnd + 1;
                    } else {
                        this.lastCheckPoint = field.initialization.sourceEnd + 1;
                    }
                } else {
                    element = element.add(field, 0);
                    this.lastCheckPoint = field.declarationSourceEnd + 1;
                }
                continue;
            }
            if (node instanceof TypeDeclaration type) {
                if ((type.modifiers & 16384) != 0) {
                    // do not allow enums to be build as recovery types
                    // https://bugs.eclipse.org/bugs/show_bug.cgi?id=340691
                    continue;
                }
                if (type.declarationSourceEnd == 0) {
                    element = element.add(type, 0);
                    this.lastCheckPoint = type.bodyStart;
                } else {
                    element = element.add(type, 0);
                    this.lastCheckPoint = type.declarationSourceEnd + 1;
                }
                continue;
            }
            if (node instanceof ImportReference importRef) {
                element = element.add(importRef, 0);
                this.lastCheckPoint = importRef.declarationSourceEnd + 1;
            }
            if (this.statementRecoveryActivated) {
                if (node instanceof Block block) {
                    element = element.add(block, 0);
                    this.lastCheckPoint = block.sourceEnd + 1;
                } else if (node instanceof LocalDeclaration statement) {
                    element = element.add(statement, 0);
                    this.lastCheckPoint = statement.sourceEnd + 1;
                } else if (node instanceof Expression statement && statement.isTrulyExpression()) {
                    if (node instanceof Assignment
                        || node instanceof PrefixExpression
                        || node instanceof PostfixExpression
                        || node instanceof MessageSend
                        || node instanceof AllocationExpression) {
                        // recover only specific expressions
                        element = element.add(statement, 0);
                        if (statement.statementEnd != -1) {
                            this.lastCheckPoint = statement.statementEnd + 1;
                        } else {
                            this.lastCheckPoint = statement.sourceEnd + 1;
                        }
                    }
                } else if (node instanceof Statement statement) {
                    element = element.add(statement, 0);
                    this.lastCheckPoint = statement.sourceEnd + 1;
                }
            }
        }

        if (this.statementRecoveryActivated) {
            if (this.pendingRecoveredType != null
                && this.scanner.startPosition - 1 <= this.pendingRecoveredType.declarationSourceEnd) {
                // Add the pending type to the AST if this type isn't already added in the AST.
                element = element.add(this.pendingRecoveredType, 0);
                this.lastCheckPoint = this.pendingRecoveredType.declarationSourceEnd + 1;
                this.pendingRecoveredType = null;
            }
        }
        return element;
    }

    protected void checkAndSetModifiers(int flag) {
        /*
         * modify the current modifiers buffer. When the startPosition of the modifiers is 0 it means that the modifier
         * being parsed is the first of a list of several modifiers. The startPosition is zeroed when a copy of
         * modifiers-buffer is push onto the this.astStack.
         */
        if (flag == 2048 && isParsingJava17Plus()) {
            problemReporter().StrictfpNotRequired(this.scanner.startPosition, this.scanner.currentPosition - 1);
        }

        if ((this.modifiers & flag) != 0) { // duplicate modifier
            this.modifiers |= 4194304;
        }
        this.modifiers |= flag;

        if (this.modifiersSourceStart < 0)
            this.modifiersSourceStart = this.scanner.startPosition;

        if (this.currentElement != null) {
            this.currentElement.addModifier(flag, this.modifiersSourceStart);
        }
    }

    public void checkComment() {

        // discard obsolete comments while inside methods or fields initializer (see bug 74369)
        if (!(this.diet && this.dietInt == 0) && this.scanner.commentPtr >= 0) {
            flushCommentsDefinedPriorTo(this.endStatementPosition);
        }

        int lastComment = this.scanner.commentPtr;

        if (this.modifiersSourceStart >= 0 && this.modifiersSourceStart > this.annotationAsModifierSourceStart) {
            // eliminate comments located after modifierSourceStart if positioned
            while (lastComment >= 0) {
                int commentSourceStart = this.scanner.commentStarts[lastComment];
                if (commentSourceStart < 0)
                    commentSourceStart = -commentSourceStart;
                if (commentSourceStart <= this.modifiersSourceStart)
                    break;
                lastComment--;
            }
        }
        if (lastComment >= 0) {
            // consider all remaining leading comments to be part of current declaration
            int lastCommentStart = this.scanner.commentStarts[0];
            if (lastCommentStart < 0)
                lastCommentStart = -lastCommentStart;
            if (this.forStartPosition != 0 || this.forStartPosition < lastCommentStart) {// if there is no 'for'
                                                                                         // in-between.
                this.modifiersSourceStart = lastCommentStart;
            }

            // check deprecation in last comment if javadoc (can be followed by non-javadoc comments which are simply
            // ignored)
            while (lastComment >= 0 && this.scanner.commentStops[lastComment] < 0)
                lastComment--; // non javadoc comment have negative end positions
            if (lastComment >= 0 && this.javadocParser != null) {
                int commentEnd = this.scanner.commentStops[lastComment] - 1; // stop is one over,
                // do not report problem before last parsed comment while recovering code...
                if (this.javadocParser.shouldReportProblems) {
                    this.javadocParser.reportProblems = this.currentElement == null || commentEnd > this.lastJavadocEnd;
                } else {
                    this.javadocParser.reportProblems = false;
                }
                if (this.javadocParser.checkDeprecation(lastComment)) {
                    checkAndSetModifiers(1048576);
                }
                this.javadoc = this.javadocParser.docComment;	// null if check javadoc is not activated
                if (this.currentElement == null)
                    this.lastJavadocEnd = commentEnd;
            }
        }
    }

    protected void checkNonNLSAfterBodyEnd(int declarationEnd) {
        if (this.scanner.currentPosition - 1 <= declarationEnd) {
            this.scanner.eofPosition = declarationEnd < Integer.MAX_VALUE ? declarationEnd + 1 : declarationEnd;
            try {
                while (this.scanner.getNextToken() != TokenNameEOF) {
                    /* empty */}
            } catch (InvalidInputException e) {
                // Nothing to do
            }
        }
    }

    protected void classInstanceCreation(boolean isQualified) {
        // ClassInstanceCreationExpression ::= 'new' ClassType '(' ArgumentListopt ')' ClassBodyopt

        // ClassBodyopt produces a null item on the astStak if it produces NO class body
        // An empty class body produces a 0 on the length stack.....

        AllocationExpression alloc;
        int length;
        if (((length = this.astLengthStack[this.astLengthPtr--]) == 1) && (this.astStack[this.astPtr] == null)) {
            // NO ClassBody
            this.astPtr--;
            alloc = newAllocationExpression(isQualified);
            alloc.sourceEnd = this.endPosition; // the position has been stored explicitly

            if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
                this.expressionPtr -= length;
                System.arraycopy(this.expressionStack, this.expressionPtr + 1, alloc.arguments = new Expression[length],
                    0, length);
            }
            alloc.type = getTypeReference(0);
            checkForDiamond(alloc.type);

            // the default constructor with the correct number of argument
            // will be created and added by the TC (see createsInternalConstructorWithBinding)
            alloc.sourceStart = this.intStack[this.intPtr--];
            pushOnExpressionStack(alloc);
        } else {
            dispatchDeclarationInto(length);
            TypeDeclaration anonymousTypeDeclaration = (TypeDeclaration) this.astStack[this.astPtr];
            anonymousTypeDeclaration.declarationSourceEnd = this.endStatementPosition;
            anonymousTypeDeclaration.addClinit();
            anonymousTypeDeclaration.bodyEnd = this.endStatementPosition;
            if (anonymousTypeDeclaration.allocation != null) {
                anonymousTypeDeclaration.allocation.sourceEnd = this.endStatementPosition;
                checkForDiamond(anonymousTypeDeclaration.allocation.type);
            }
            if (length == 0 && !containsComment(anonymousTypeDeclaration.bodyStart, anonymousTypeDeclaration.bodyEnd)) {
                anonymousTypeDeclaration.bits |= 8;
            }
            this.astPtr--;
            this.astLengthPtr--;
        }
    }

    protected AllocationExpression newAllocationExpression(boolean isQualified) {
        AllocationExpression alloc;
        if (isQualified) {
            alloc = new QualifiedAllocationExpression();
        } else {
            alloc = new AllocationExpression();
        }
        return alloc;
    }

    protected void checkForDiamond(TypeReference allocType) {
        if (allocType instanceof ParameterizedSingleTypeReference type) {
            if (type.typeArguments == TypeReference.NO_TYPE_ARGUMENTS) {
                type.bits |= 524288;
            }
        } else if (allocType instanceof ParameterizedQualifiedTypeReference type) {
            if (type.typeArguments[type.typeArguments.length - 1] == TypeReference.NO_TYPE_ARGUMENTS) { // Don't care
                                                                                                        // for X<>.Y<>
                                                                                                        // and
                                                                                                        // X<>.Y<String>
                type.bits |= 524288;
            }
        }
    }

    protected ParameterizedQualifiedTypeReference computeQualifiedGenericsFromRightSide(TypeReference rightSide,
        int dim, Annotation[][] annotationsOnDimensions) {
        int nameSize = this.identifierLengthStack[this.identifierLengthPtr];
        int tokensSize = nameSize;
        if (rightSide instanceof ParameterizedSingleTypeReference) {
            tokensSize++;
        } else if (rightSide instanceof SingleTypeReference) {
            tokensSize++;
        } else if (rightSide instanceof QualifiedTypeReference) {
            tokensSize += ((QualifiedTypeReference) rightSide).tokens.length;
        }
        TypeReference[][] typeArguments = new TypeReference[tokensSize][];
        char[][] tokens = new char[tokensSize][];
        long[] positions = new long[tokensSize];
        Annotation[][] typeAnnotations = null;
        if (rightSide instanceof ParameterizedSingleTypeReference singleParameterizedTypeReference) {
            tokens[nameSize] = singleParameterizedTypeReference.token;
            positions[nameSize] = (((long) singleParameterizedTypeReference.sourceStart) << 32)
                + singleParameterizedTypeReference.sourceEnd;
            typeArguments[nameSize] = singleParameterizedTypeReference.typeArguments;
            if (singleParameterizedTypeReference.annotations != null) {
                typeAnnotations = new Annotation[tokensSize][];
                typeAnnotations[nameSize] = singleParameterizedTypeReference.annotations[0];
            }
        } else if (rightSide instanceof SingleTypeReference singleTypeReference) {
            tokens[nameSize] = singleTypeReference.token;
            positions[nameSize] = (((long) singleTypeReference.sourceStart) << 32) + singleTypeReference.sourceEnd;
            if (singleTypeReference.annotations != null) {
                typeAnnotations = new Annotation[tokensSize][];
                typeAnnotations[nameSize] = singleTypeReference.annotations[0];
            }
        } else if (rightSide instanceof ParameterizedQualifiedTypeReference parameterizedTypeReference) {
            TypeReference[][] rightSideTypeArguments = parameterizedTypeReference.typeArguments;
            System.arraycopy(rightSideTypeArguments, 0, typeArguments, nameSize, rightSideTypeArguments.length);
            char[][] rightSideTokens = parameterizedTypeReference.tokens;
            System.arraycopy(rightSideTokens, 0, tokens, nameSize, rightSideTokens.length);
            long[] rightSidePositions = parameterizedTypeReference.sourcePositions;
            System.arraycopy(rightSidePositions, 0, positions, nameSize, rightSidePositions.length);
            Annotation[][] rightSideAnnotations = parameterizedTypeReference.annotations;
            if (rightSideAnnotations != null) {
                typeAnnotations = new Annotation[tokensSize][];
                System.arraycopy(rightSideAnnotations, 0, typeAnnotations, nameSize, rightSideAnnotations.length);
            }
        } else if (rightSide instanceof QualifiedTypeReference qualifiedTypeReference) {
            char[][] rightSideTokens = qualifiedTypeReference.tokens;
            System.arraycopy(rightSideTokens, 0, tokens, nameSize, rightSideTokens.length);
            long[] rightSidePositions = qualifiedTypeReference.sourcePositions;
            System.arraycopy(rightSidePositions, 0, positions, nameSize, rightSidePositions.length);
            Annotation[][] rightSideAnnotations = qualifiedTypeReference.annotations;
            if (rightSideAnnotations != null) {
                typeAnnotations = new Annotation[tokensSize][];
                System.arraycopy(rightSideAnnotations, 0, typeAnnotations, nameSize, rightSideAnnotations.length);
            }
        }

        int currentTypeArgumentsLength = this.genericsLengthStack[this.genericsLengthPtr--];
        TypeReference[] currentTypeArguments = new TypeReference[currentTypeArgumentsLength];
        this.genericsPtr -= currentTypeArgumentsLength;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1, currentTypeArguments, 0, currentTypeArgumentsLength);

        if (nameSize == 1) {
            tokens[0] = this.identifierStack[this.identifierPtr];
            positions[0] = this.identifierPositionStack[this.identifierPtr--];
            typeArguments[0] = currentTypeArguments;
        } else {
            this.identifierPtr -= nameSize;
            System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens, 0, nameSize);
            System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions, 0, nameSize);
            typeArguments[nameSize - 1] = currentTypeArguments;
        }
        this.identifierLengthPtr--;
        ParameterizedQualifiedTypeReference typeRef
            = new ParameterizedQualifiedTypeReference(tokens, typeArguments, dim, annotationsOnDimensions, positions);

        while (nameSize > 0) {
            int length;
            if ((length = this.typeAnnotationLengthStack[this.typeAnnotationLengthPtr--]) != 0) {
                if (typeAnnotations == null)
                    typeAnnotations = new Annotation[tokensSize][];
                System.arraycopy(this.typeAnnotationStack, (this.typeAnnotationPtr -= length) + 1,
                    typeAnnotations[nameSize - 1] = new Annotation[length], 0, length);
                if (nameSize == 1) {
                    typeRef.sourceStart = typeAnnotations[0][0].sourceStart;
                }
            }
            nameSize--;
        }

        if ((typeRef.annotations = typeAnnotations) != null) {
            typeRef.bits |= 1048576;
        }
        return typeRef;
    }

    protected void concatExpressionLists() {
        this.expressionLengthStack[--this.expressionLengthPtr]++;
    }

    protected void concatGenericsLists() {
        this.genericsLengthStack[this.genericsLengthPtr - 1] += this.genericsLengthStack[this.genericsLengthPtr--];
    }

    protected void concatNodeLists() {
        /*
         * This is a case where you have two sublists into the this.astStack that you want to merge in one list. There
         * is no action required on the this.astStack. The only thing you need to do is merge the two lengths specified
         * on the astStackLength. The top two length are for example: ... p n and you want to result in a list like: ...
         * n+p This means that the p could be equals to 0 in case there is no astNode pushed on the this.astStack. Look
         * at the InterfaceMemberDeclarations for an example.
         */

        this.astLengthStack[this.astLengthPtr - 1] += this.astLengthStack[this.astLengthPtr--];
    }

    protected void consumeAdditionalBound() {
        pushOnGenericsStack(getTypeReference(this.intStack[this.intPtr--]));
    }

    protected void consumeAdditionalBoundList() {
        concatGenericsLists();
    }

    protected void consumeAdditionalBoundList1() {
        concatGenericsLists();
    }

    protected void consumeAllocationHeader() {
        // ClassInstanceCreationExpression ::= 'new' ClassType '(' ArgumentListopt ')' ClassBodyopt

        // ClassBodyopt produces a null item on the astStak if it produces NO class body
        // An empty class body produces a 0 on the length stack.....

        if (this.currentElement == null) {
            return; // should never occur, this consumeRule is only used in recovery mode
        }
        if (this.currentToken == TokenNameLBRACE) {
            // beginning of an anonymous type
            TypeDeclaration anonymousType = new TypeDeclaration(this.compilationUnit.compilationResult);
            anonymousType.name = CharOperation.NO_CHAR;
            anonymousType.bits |= (512 | 256);
            anonymousType.sourceStart = this.intStack[this.intPtr--];
            anonymousType.declarationSourceStart = anonymousType.sourceStart;
            anonymousType.sourceEnd = this.rParenPos; // closing parenthesis
            QualifiedAllocationExpression alloc = new QualifiedAllocationExpression(anonymousType);
            alloc.type = getTypeReference(0);
            alloc.sourceStart = anonymousType.sourceStart;
            alloc.sourceEnd = anonymousType.sourceEnd;
            this.lastCheckPoint = anonymousType.bodyStart = this.scanner.currentPosition;
            this.currentElement = this.currentElement.add(anonymousType, 0);
            this.lastIgnoredToken = TokenNameInvalid;
            {
                this.currentToken = TokenNameNotAToken;
            } // opening brace already taken into account
            return;
        }
        this.lastCheckPoint = this.scanner.startPosition; // force to restart at this exact position
        this.restartRecovery = true; // request to restart from here on
    }

    protected void consumeAnnotationAsModifier() {
        Expression expression = this.expressionStack[this.expressionPtr];
        int sourceStart = expression.sourceStart;
        if (this.modifiersSourceStart < 0) {
            this.modifiersSourceStart = sourceStart;
            this.annotationAsModifierSourceStart = sourceStart;
        }
    }

    protected void consumeAnnotationName() {
        if (this.currentElement != null && !this.expectTypeAnnotation) {
            int start = this.intStack[this.intPtr];
            int end = (int) (this.identifierPositionStack[this.identifierPtr] & 0x00000000FFFFFFFFL);
            annotationRecoveryCheckPoint(end);

            this.currentElement
                = this.currentElement.addAnnotationName(this.identifierPtr, this.identifierLengthPtr, start, 0);
        }
        this.recordStringLiterals = false;
        this.expectTypeAnnotation = false;
    }

    protected void consumeAnnotationTypeDeclaration() {
        int length;
        if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            // there are length declarations
            // dispatch according to the type of the declarations
            dispatchDeclarationInto(length);
        }

        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];

        // convert constructor that do not have the type's name into methods
        typeDecl.checkConstructors(this);

        // always add <clinit> (will be remove at code gen time if empty)
        if (this.scanner.containsAssertKeyword) {
            typeDecl.bits |= 1;
        }
        typeDecl.addClinit();
        typeDecl.bodyEnd = this.endStatementPosition;
        if (length == 0 && !containsComment(typeDecl.bodyStart, typeDecl.bodyEnd)) {
            typeDecl.bits |= 8;
        }
        typeDecl.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);
    }

    protected void consumeAnnotationTypeDeclarationHeader() {
        TypeDeclaration annotationTypeDeclaration = (TypeDeclaration) this.astStack[this.astPtr];
        if (this.currentToken == TokenNameLBRACE) {
            annotationTypeDeclaration.bodyStart = this.scanner.currentPosition;
        }
        if (this.currentElement != null) {
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
        // flush the comments related to the annotation type header
        this.scanner.commentPtr = -1;
    }

    protected void consumeAnnotationTypeDeclarationHeaderName() {
        // consumeAnnotationTypeDeclarationHeader ::= Modifiers '@' PushModifiers interface Identifier
        // consumeAnnotationTypeDeclarationHeader ::= '@' PushModifiers interface Identifier
        TypeDeclaration annotationTypeDeclaration = new TypeDeclaration(this.compilationUnit.compilationResult);
        if (this.nestedMethod[this.nestedType] == 0) {
            if (this.nestedType != 0) {
                annotationTypeDeclaration.bits |= 1024;
            }
        } else {
            // Record that the block has a declaration for local types
            annotationTypeDeclaration.bits |= 256;
            markEnclosingMemberWithLocalType();
            blockReal();
        }

        // highlight the name of the type
        long pos = this.identifierPositionStack[this.identifierPtr];
        annotationTypeDeclaration.sourceEnd = (int) pos;
        annotationTypeDeclaration.sourceStart = (int) (pos >>> 32);
        annotationTypeDeclaration.name = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        // compute the declaration source too
        // 'interface' push two int positions: the beginning of the class token and its end.
        // we want to keep the beginning position but get rid of the end position
        // it is only used for the ClassLiteralAccess positions.
        this.intPtr--; // remove the start position of the interface token
        this.intPtr--; // remove the end position of the interface token

        annotationTypeDeclaration.modifiersSourceStart = this.intStack[this.intPtr--];
        annotationTypeDeclaration.modifiers = this.intStack[this.intPtr--] | 8192 | 512;
        if (annotationTypeDeclaration.modifiersSourceStart >= 0) {
            annotationTypeDeclaration.declarationSourceStart = annotationTypeDeclaration.modifiersSourceStart;
            this.intPtr--; // remove the position of the '@' token as we have modifiers
        } else {
            // remove the position of the '@' token as we don't have modifiers
            annotationTypeDeclaration.declarationSourceStart = this.intStack[this.intPtr--];
        }

        // Store secondary info
        if ((annotationTypeDeclaration.bits & 1024) == 0 && (annotationTypeDeclaration.bits & 256) == 0) {
            if (this.compilationUnit != null
                && !CharOperation.equals(annotationTypeDeclaration.name, this.compilationUnit.getMainTypeName())) {
                annotationTypeDeclaration.bits |= 4096;
            }
        }

        // consume annotations
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                annotationTypeDeclaration.annotations = new Annotation[length], 0, length);
        }
        annotationTypeDeclaration.bodyStart = annotationTypeDeclaration.sourceEnd + 1;

        // javadoc
        annotationTypeDeclaration.javadoc = this.javadoc;
        this.javadoc = null;
        pushOnAstStack(annotationTypeDeclaration);

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = annotationTypeDeclaration.bodyStart;
            this.currentElement = this.currentElement.add(annotationTypeDeclaration, 0);
            this.lastIgnoredToken = TokenNameInvalid;
        }
    }

    protected void consumeAnnotationTypeDeclarationHeaderNameWithTypeParameters() {
        // consumeAnnotationTypeDeclarationHeader ::= Modifiers '@' PushModifiers interface Identifier TypeParameters
        // consumeAnnotationTypeDeclarationHeader ::= '@' PushModifiers interface Identifier TypeParameters
        TypeDeclaration annotationTypeDeclaration = new TypeDeclaration(this.compilationUnit.compilationResult);
        // consume type parameters
        int length = this.genericsLengthStack[this.genericsLengthPtr--];
        this.genericsPtr -= length;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1,
            annotationTypeDeclaration.typeParameters = new TypeParameter[length], 0, length);

        problemReporter().invalidUsageOfTypeParametersForAnnotationDeclaration(annotationTypeDeclaration);

        annotationTypeDeclaration.bodyStart
            = annotationTypeDeclaration.typeParameters[length - 1].declarationSourceEnd + 1;

//	annotationTypeDeclaration.typeParameters = null;

        this.listTypeParameterLength = 0;

        if (this.nestedMethod[this.nestedType] == 0) {
            if (this.nestedType != 0) {
                annotationTypeDeclaration.bits |= 1024;
            }
        } else {
            // Record that the block has a declaration for local types
            annotationTypeDeclaration.bits |= 256;
            markEnclosingMemberWithLocalType();
            blockReal();
        }

        // highlight the name of the type
        long pos = this.identifierPositionStack[this.identifierPtr];
        annotationTypeDeclaration.sourceEnd = (int) pos;
        annotationTypeDeclaration.sourceStart = (int) (pos >>> 32);
        annotationTypeDeclaration.name = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        // compute the declaration source too
        // 'interface' push two int positions: the beginning of the class token and its end.
        // we want to keep the beginning position but get rid of the end position
        // it is only used for the ClassLiteralAccess positions.
        this.intPtr--; // remove the start position of the interface token
        this.intPtr--; // remove the end position of the interface token

        annotationTypeDeclaration.modifiersSourceStart = this.intStack[this.intPtr--];
        annotationTypeDeclaration.modifiers = this.intStack[this.intPtr--] | 8192 | 512;
        if (annotationTypeDeclaration.modifiersSourceStart >= 0) {
            annotationTypeDeclaration.declarationSourceStart = annotationTypeDeclaration.modifiersSourceStart;
            this.intPtr--; // remove the position of the '@' token as we have modifiers
        } else {
            // remove the position of the '@' token as we don't have modifiers
            annotationTypeDeclaration.declarationSourceStart = this.intStack[this.intPtr--];
        }

        // Store secondary info
        if ((annotationTypeDeclaration.bits & 1024) == 0 && (annotationTypeDeclaration.bits & 256) == 0) {
            if (this.compilationUnit != null
                && !CharOperation.equals(annotationTypeDeclaration.name, this.compilationUnit.getMainTypeName())) {
                annotationTypeDeclaration.bits |= 4096;
            }
        }

        // consume annotations
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                annotationTypeDeclaration.annotations = new Annotation[length], 0, length);
        }
        // javadoc
        annotationTypeDeclaration.javadoc = this.javadoc;
        this.javadoc = null;
        pushOnAstStack(annotationTypeDeclaration);

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = annotationTypeDeclaration.bodyStart;
            this.currentElement = this.currentElement.add(annotationTypeDeclaration, 0);
            this.lastIgnoredToken = TokenNameInvalid;
        }
    }

    protected void consumeAnnotationTypeMemberDeclaration() {
        // AnnotationTypeMemberDeclaration ::= AnnotationTypeMemberDeclarationHeader
        // AnnotationTypeMemberHeaderExtendedDims DefaultValueopt ';'
        MethodDeclaration annotationTypeMemberDeclaration = (MethodDeclaration) this.astStack[this.astPtr];
        annotationTypeMemberDeclaration.modifiers |= 16777216;
        // store the this.endPosition (position just before the '}') in case there is
        // a trailing comment behind the end of the method
        int declarationEndPosition = flushCommentsDefinedPriorTo(this.endStatementPosition);
        annotationTypeMemberDeclaration.bodyStart = this.endStatementPosition;
        annotationTypeMemberDeclaration.bodyEnd = declarationEndPosition;
        annotationTypeMemberDeclaration.declarationSourceEnd = declarationEndPosition;
    }

    protected void consumeAnnotationTypeMemberDeclarations() {
        // AnnotationTypeMemberDeclarations ::= AnnotationTypeMemberDeclarations AnnotationTypeMemberDeclaration
        concatNodeLists();
    }

    protected void consumeAnnotationTypeMemberDeclarationsopt() {
        this.nestedType--;
    }

    protected void consumeArgumentList() {
        // ArgumentList ::= ArgumentList ',' Expression
        concatExpressionLists();
    }

    protected void consumeArguments() {
        // Arguments ::= '(' ArgumentListopt ')'
        // nothing to do, the expression stack is already updated
        pushOnIntStack(this.rParenPos);
    }

    protected void consumeArrayAccess(boolean unspecifiedReference) {
        // ArrayAccess ::= Name '[' Expression ']' ==> true
        // ArrayAccess ::= PrimaryNoNewArray '[' Expression ']' ==> false

        // optimize push/pop
        Expression exp;
        if (unspecifiedReference) {
            exp = this.expressionStack[this.expressionPtr]
                = new ArrayReference(getUnspecifiedReferenceOptimized(), this.expressionStack[this.expressionPtr]);
        } else {
            this.expressionPtr--;
            this.expressionLengthPtr--;
            exp = this.expressionStack[this.expressionPtr] = new ArrayReference(
                this.expressionStack[this.expressionPtr], this.expressionStack[this.expressionPtr + 1]);
        }
        exp.sourceEnd = this.endStatementPosition;
    }

    protected void consumeArrayCreationExpressionWithInitializer() {
        // ArrayCreationWithArrayInitializer ::= 'new' PrimitiveType DimWithOrWithOutExprs ArrayInitializer
        // ArrayCreationWithArrayInitializer ::= 'new' ClassOrInterfaceType DimWithOrWithOutExprs ArrayInitializer

        int length;
        ArrayAllocationExpression arrayAllocation = new ArrayAllocationExpression();
        this.expressionLengthPtr--;
        arrayAllocation.initializer = (ArrayInitializer) this.expressionStack[this.expressionPtr--];

        length = (this.expressionLengthStack[this.expressionLengthPtr--]);
        this.expressionPtr -= length;
        System.arraycopy(this.expressionStack, this.expressionPtr + 1,
            arrayAllocation.dimensions = new Expression[length], 0, length);
        Annotation[][] annotationsOnDimensions = getAnnotationsOnDimensions(length);
        arrayAllocation.annotationsOnDimensions = annotationsOnDimensions;

        arrayAllocation.type = getTypeReference(0);
        arrayAllocation.type.bits |= 1073741824; // no need to worry about raw type usage
        if (annotationsOnDimensions != null) {
            arrayAllocation.bits |= 1048576;
            arrayAllocation.type.bits |= 1048576;
        }

        arrayAllocation.sourceStart = this.intStack[this.intPtr--];
        if (arrayAllocation.initializer == null) {
            arrayAllocation.sourceEnd = this.endStatementPosition;
        } else {
            arrayAllocation.sourceEnd = arrayAllocation.initializer.sourceEnd;
        }
        pushOnExpressionStack(arrayAllocation);
    }

    protected void consumeArrayCreationExpressionWithoutInitializer() {
        // ArrayCreationWithoutArrayInitializer ::= 'new' ClassOrInterfaceType DimWithOrWithOutExprs
        // ArrayCreationWithoutArrayInitializer ::= 'new' PrimitiveType DimWithOrWithOutExprs

        int length;
        ArrayAllocationExpression arrayAllocation = new ArrayAllocationExpression();
        length = (this.expressionLengthStack[this.expressionLengthPtr--]);
        this.expressionPtr -= length;
        System.arraycopy(this.expressionStack, this.expressionPtr + 1,
            arrayAllocation.dimensions = new Expression[length], 0, length);
        Annotation[][] annotationsOnDimensions = getAnnotationsOnDimensions(length);
        arrayAllocation.annotationsOnDimensions = annotationsOnDimensions;
        arrayAllocation.type = getTypeReference(0);
        arrayAllocation.type.bits |= 1073741824; // no need to worry about raw type usage
        if (annotationsOnDimensions != null) {
            arrayAllocation.bits |= 1048576;
            arrayAllocation.type.bits |= 1048576;
        }
        arrayAllocation.sourceStart = this.intStack[this.intPtr--];
        if (arrayAllocation.initializer == null) {
            arrayAllocation.sourceEnd = this.endStatementPosition;
        } else {
            arrayAllocation.sourceEnd = arrayAllocation.initializer.sourceEnd;
        }
        pushOnExpressionStack(arrayAllocation);
    }

    protected void consumeArrayInitializer() {
        // ArrayInitializer ::= '{' VariableInitializers '}'
        // ArrayInitializer ::= '{' VariableInitializers , '}'

        arrayInitializer(this.expressionLengthStack[this.expressionLengthPtr--]);
    }

    protected void consumeArrayTypeWithTypeArgumentsName() {
        this.genericsIdentifiersLengthStack[this.genericsIdentifiersLengthPtr]
            += this.identifierLengthStack[this.identifierLengthPtr];
        pushOnGenericsLengthStack(0); // handle type arguments
    }

    protected void consumeAssertStatement() {
        // AssertStatement ::= 'assert' Expression ':' Expression ';'
        this.expressionLengthPtr -= 2;
        pushOnAstStack(new AssertStatement(this.expressionStack[this.expressionPtr--],
            this.expressionStack[this.expressionPtr--], this.intStack[this.intPtr--]));
    }

    protected void consumeAssignment() {
        // Assignment ::= LeftHandSide AssignmentOperator AssignmentExpression
        // optimize the push/pop

        int op = this.intStack[this.intPtr--]; // <--the encoded operator

        this.expressionPtr--;
        this.expressionLengthPtr--;
        Expression expression = this.expressionStack[this.expressionPtr + 1];
        this.expressionStack[this.expressionPtr] = (op != 21)
            ? new CompoundAssignment(this.expressionStack[this.expressionPtr], expression, op, expression.sourceEnd)
            : new Assignment(this.expressionStack[this.expressionPtr], expression, expression.sourceEnd);

        if (this.pendingRecoveredType != null) {
            // Used only in statements recovery.
            // This is not a real assignment but a placeholder for an existing anonymous type.
            // The assignment must be replace by the anonymous type.
            if (this.pendingRecoveredType.allocation != null
                && this.scanner.startPosition - 1 <= this.pendingRecoveredType.declarationSourceEnd) {
                this.expressionStack[this.expressionPtr] = this.pendingRecoveredType.allocation;
                this.pendingRecoveredType = null;
                return;
            }
            this.pendingRecoveredType = null;
        }
    }

    protected void consumeAssignmentOperator(int pos) {
        // AssignmentOperator ::= '='
        // AssignmentOperator ::= '*='
        // AssignmentOperator ::= '/='
        // AssignmentOperator ::= '%='
        // AssignmentOperator ::= '+='
        // AssignmentOperator ::= '-='
        // AssignmentOperator ::= '<<='
        // AssignmentOperator ::= '>>='
        // AssignmentOperator ::= '>>>='
        // AssignmentOperator ::= '&='
        // AssignmentOperator ::= '^='
        // AssignmentOperator ::= '|='

        pushOnIntStack(pos);
    }

    protected void consumeBinaryExpression(int op) {
        // MultiplicativeExpression ::= MultiplicativeExpression '*' UnaryExpression
        // MultiplicativeExpression ::= MultiplicativeExpression '/' UnaryExpression
        // MultiplicativeExpression ::= MultiplicativeExpression '%' UnaryExpression
        // AdditiveExpression ::= AdditiveExpression '+' MultiplicativeExpression
        // AdditiveExpression ::= AdditiveExpression '-' MultiplicativeExpression
        // ShiftExpression ::= ShiftExpression '<<' AdditiveExpression
        // ShiftExpression ::= ShiftExpression '>>' AdditiveExpression
        // ShiftExpression ::= ShiftExpression '>>>' AdditiveExpression
        // RelationalExpression ::= RelationalExpression '<' ShiftExpression
        // RelationalExpression ::= RelationalExpression '>' ShiftExpression
        // RelationalExpression ::= RelationalExpression '<=' ShiftExpression
        // RelationalExpression ::= RelationalExpression '>=' ShiftExpression
        // AndExpression ::= AndExpression '&' EqualityExpression
        // ExclusiveOrExpression ::= ExclusiveOrExpression '^' AndExpression
        // InclusiveOrExpression ::= InclusiveOrExpression '|' ExclusiveOrExpression
        // ConditionalAndExpression ::= ConditionalAndExpression '&&' InclusiveOrExpression
        // ConditionalOrExpression ::= ConditionalOrExpression '||' ConditionalAndExpression

        // optimize the push/pop

        this.expressionPtr--;
        this.expressionLengthPtr--;
        Expression expr1 = this.expressionStack[this.expressionPtr];
        Expression expr2 = this.expressionStack[this.expressionPtr + 1];
        switch (op) {
            case 1:
                this.expressionStack[this.expressionPtr] = new OR_OR_Expression(expr1, expr2, op);
                break;

            case 0:
                this.expressionStack[this.expressionPtr] = new AND_AND_Expression(expr1, expr2, op);
                break;

            case 14:
                // look for "string1" + "string2"
                if (this.optimizeStringLiterals) {
                    if (expr1 instanceof StringLiteral string1) {
                        if (((expr1.bits & 534773760) >> 21) == 0) {
                            if (expr2 instanceof CharLiteral charLiteral) { // string+char
                                this.expressionStack[this.expressionPtr] = string1.extendWith(charLiteral);
                            } else if (expr2 instanceof StringLiteral string2) { // string+string
                                this.expressionStack[this.expressionPtr] = string1.extendWith(string2);
                            } else {
                                this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, 14);
                            }
                        } else {
                            this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, 14);
                        }
                    } else if (expr1 instanceof CombinedBinaryExpression expr) {
                        CombinedBinaryExpression cursor;
                        // left branch is comprised of PLUS BEs
                        // cursor is shifted upwards, while needed BEs are added
                        // on demand; past the arityMax-th
                        // consecutive BE, a CBE is inserted that holds a
                        // full-fledged references table
                        if ((cursor = expr).arity < cursor.arityMax) {
                            cursor.left = new BinaryExpression(cursor);
                            cursor.arity++;
                        } else {
                            cursor.left = new CombinedBinaryExpression(cursor);
                            cursor.arity = 0;
                            cursor.tuneArityMax();
                        }
                        cursor.right = expr2;
                        cursor.sourceEnd = expr2.sourceEnd;
                        this.expressionStack[this.expressionPtr] = cursor;
                        // BE_INSTRUMENTATION: neutralized in the released code
//					cursor.depthTracker = ((BinaryExpression)cursor.left).
//						depthTracker + 1;
                    } else if (expr1 instanceof BinaryExpression &&
                    // single out the a + b case, which is a BE
                    // instead of a CBE (slightly more than a half of
                    // strings concatenation are one-deep binary
                    // expressions)
                        ((expr1.bits & 7936) >> 8) == 14) {
                        this.expressionStack[this.expressionPtr] = new CombinedBinaryExpression(expr1, expr2);
                    } else {
                        this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, 14);
                    }
                } else if (expr1 instanceof StringLiteral string) {
                    if (expr2 instanceof StringLiteral && ((expr1.bits & 534773760) >> 21) == 0) {
                        // string + string
                        this.expressionStack[this.expressionPtr] = string.extendsWith((StringLiteral) expr2);
                    } else {
                        // single out the a + b case
                        this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, 14);
                    }
                } else if (expr1 instanceof CombinedBinaryExpression expr) {
                    CombinedBinaryExpression cursor;
                    // shift cursor; create BE/CBE as needed
                    if ((cursor = expr).arity < cursor.arityMax) {
                        cursor.left = new BinaryExpression(cursor);
                        // clear the bits on cursor
                        cursor.bits &= ~534773760;
                        cursor.arity++;
                    } else {
                        cursor.left = new CombinedBinaryExpression(cursor);
                        // clear the bits on cursor
                        cursor.bits &= ~534773760;
                        cursor.arity = 0;
                        cursor.tuneArityMax();
                    }
                    cursor.right = expr2;
                    cursor.sourceEnd = expr2.sourceEnd;
                    // BE_INSTRUMENTATION: neutralized in the released code
//					cursor.depthTracker = ((BinaryExpression)cursor.left).
//						depthTracker + 1;
                    this.expressionStack[this.expressionPtr] = cursor;
                } else if (expr1 instanceof BinaryExpression && ((expr1.bits & 7936) >> 8) == 14) {
                    // single out the a + b case
                    this.expressionStack[this.expressionPtr] = new CombinedBinaryExpression(expr1, expr2);
                } else {
                    this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, 14);
                }
                break;

            case 4:
            case 15:
                this.intPtr--; // star end position or starting position of angle bracket
                this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, op);
                break;

            default:
                this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, op);
        }
    }

    /**
     * @param op binary operator
     */
    protected void consumeBinaryExpressionWithName(int op) {
        pushOnExpressionStack(getUnspecifiedReferenceOptimized());
        this.expressionPtr--;
        this.expressionLengthPtr--;
        Expression expr1 = this.expressionStack[this.expressionPtr + 1];
        Expression expr2 = this.expressionStack[this.expressionPtr];
        // Note: we do not attempt to promote BinaryExpression-s to
        // IndexedBinaryExpression-s here since expr1 always holds a name
        switch (op) {
            case 1:
                this.expressionStack[this.expressionPtr] = new OR_OR_Expression(expr1, expr2, op);
                break;

            case 0:
                this.expressionStack[this.expressionPtr] = new AND_AND_Expression(expr1, expr2, op);
                break;

            case 14:
                // look for "string1" + "string2"
                if (this.optimizeStringLiterals) {
                    if (expr1 instanceof StringLiteral string1 && ((expr1.bits & 534773760) >> 21) == 0) {
                        if (expr2 instanceof CharLiteral char2) { // string+char
                            this.expressionStack[this.expressionPtr] = string1.extendWith(char2);
                        } else if (expr2 instanceof StringLiteral string2) { // string+string
                            this.expressionStack[this.expressionPtr] = string1.extendWith(string2);
                        } else {
                            this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, 14);
                        }
                    } else {
                        this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, 14);
                    }
                } else if (expr1 instanceof StringLiteral string1) {
                    if (expr2 instanceof StringLiteral string2 && ((expr1.bits & 534773760) >> 21) == 0) {
                        // string + string
                        this.expressionStack[this.expressionPtr] = string1.extendsWith(string2);
                    } else {
                        this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, op);
                    }
                } else {
                    this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, op);
                }
                break;

            case 4:
            case 15:
                this.intPtr--; // star end position or starting position of angle bracket
                this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, op);
                break;

            default:
                this.expressionStack[this.expressionPtr] = new BinaryExpression(expr1, expr2, op);
        }
    }

    protected void consumeBlock() {
        // Block ::= OpenBlock '{' BlockStatementsopt '}'
        // LambdaBody ::= NestedType NestedMethod '{' BlockStatementsopt '}'
        // simpler action for empty blocks

        int statementsLength = this.astLengthStack[this.astLengthPtr--];
        Block block;
        if (statementsLength == 0) { // empty block
            block = new Block(0);
            block.sourceStart = this.intStack[this.intPtr--];
            block.sourceEnd = this.endStatementPosition;
            // check whether this block at least contains some comment in it
            if (!containsComment(block.sourceStart, block.sourceEnd)) {
                block.bits |= 8;
            }
            this.realBlockPtr--; // still need to pop the block variable counter
        } else {
            block = new Block(this.realBlockStack[this.realBlockPtr--]);
            this.astPtr -= statementsLength;
            System.arraycopy(this.astStack, this.astPtr + 1, block.statements = new Statement[statementsLength], 0,
                statementsLength);
            block.sourceStart = this.intStack[this.intPtr--];
            block.sourceEnd = this.endStatementPosition;
        }
        if (this.currentElement instanceof RecoveredBlock && this.currentElement.getLastStart() == block.sourceStart) {
            // in assist scenarii we cannot guarantee uniqueness of equal blocks, so simply update the duplicate, too:
            this.currentElement.updateSourceEndIfNecessary(block.sourceEnd);
        }
        pushOnAstStack(block);
    }

    protected void consumeBlockStatements() {
        // BlockStatements ::= BlockStatements BlockStatement
        concatNodeLists();
    }

    protected void consumeCastExpressionLL1() {
        // CastExpression ::= '(' Name ')' InsideCastExpressionLL1 UnaryExpressionNotPlusMinus

        // optimize push/pop

        Expression cast;
        Expression exp;
        this.expressionPtr--;
        this.expressionStack[this.expressionPtr]
            = cast = new CastExpression(exp = this.expressionStack[this.expressionPtr + 1],
                (TypeReference) this.expressionStack[this.expressionPtr]);
        this.expressionLengthPtr--;
        updateSourcePosition(cast);
        cast.sourceEnd = exp.sourceEnd;
    }

    public IntersectionCastTypeReference createIntersectionCastTypeReference(TypeReference[] typeReferences) {
        return new IntersectionCastTypeReference(typeReferences);
    }

    protected void consumeCastExpressionLL1WithBounds() {
        // CastExpression ::= '(' Name AdditionalBoundsList ')' UnaryExpressionNotPlusMinus
        Expression cast;
        Expression exp;
        int length;
        exp = this.expressionStack[this.expressionPtr--];
        this.expressionLengthPtr--;
        TypeReference[] bounds = new TypeReference[length = this.expressionLengthStack[this.expressionLengthPtr]];
        System.arraycopy(this.expressionStack, this.expressionPtr -= (length - 1), bounds, 0, length);
        this.expressionStack[this.expressionPtr]
            = cast = new CastExpression(exp, createIntersectionCastTypeReference(bounds));
        this.expressionLengthStack[this.expressionLengthPtr] = 1;
        updateSourcePosition(cast);
        cast.sourceEnd = exp.sourceEnd;
    }

    protected void consumeCastExpressionWithGenericsArray() {
        // CastExpression ::= PushLPAREN Name TypeArguments Dimsopt AdditionalBoundsListOpt PushRPAREN
        // InsideCastExpression UnaryExpressionNotPlusMinus

        TypeReference[] bounds = null;
        int additionalBoundsLength = this.genericsLengthStack[this.genericsLengthPtr--];
        if (additionalBoundsLength > 0) {
            bounds = new TypeReference[additionalBoundsLength + 1];
            this.genericsPtr -= additionalBoundsLength;
            System.arraycopy(this.genericsStack, this.genericsPtr + 1, bounds, 1, additionalBoundsLength);
        }
        Expression exp;
        Expression cast;
        TypeReference castType;
        int end = this.intStack[this.intPtr--];

        int dim = this.intStack[this.intPtr--];
        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
        if (additionalBoundsLength > 0) {
            bounds[0] = getTypeReference(dim);
            castType = createIntersectionCastTypeReference(bounds);
        } else {
            castType = getTypeReference(dim);
        }
        this.expressionStack[this.expressionPtr]
            = cast = new CastExpression(exp = this.expressionStack[this.expressionPtr], castType);
        this.intPtr--;  // pop position of '<'
        castType.sourceEnd = end - 1;
        castType.sourceStart = (cast.sourceStart = this.intStack[this.intPtr--]) + 1;
        cast.sourceEnd = exp.sourceEnd;
    }

    protected void consumeCastExpressionWithNameArray() {
        // CastExpression ::= PushLPAREN Name Dims AdditionalBoundsListOpt PushRPAREN InsideCastExpression
        // UnaryExpressionNotPlusMinus

        Expression exp;
        Expression cast;
        TypeReference castType;
        int end = this.intStack[this.intPtr--];

        TypeReference[] bounds = null;
        int additionalBoundsLength = this.genericsLengthStack[this.genericsLengthPtr--];
        if (additionalBoundsLength > 0) {
            bounds = new TypeReference[additionalBoundsLength + 1];
            this.genericsPtr -= additionalBoundsLength;
            System.arraycopy(this.genericsStack, this.genericsPtr + 1, bounds, 1, additionalBoundsLength);
        }
        // handle type arguments
        pushOnGenericsLengthStack(0);
        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);

        if (additionalBoundsLength > 0) {
            bounds[0] = getTypeReference(this.intStack[this.intPtr--]);
            castType = createIntersectionCastTypeReference(bounds);
        } else {
            castType = getTypeReference(this.intStack[this.intPtr--]);
        }
        this.expressionStack[this.expressionPtr]
            = cast = new CastExpression(exp = this.expressionStack[this.expressionPtr], castType);
        castType.sourceEnd = end - 1;
        castType.sourceStart = (cast.sourceStart = this.intStack[this.intPtr--]) + 1;
        cast.sourceEnd = exp.sourceEnd;
    }

    protected void consumeCastExpressionWithPrimitiveType() {
        // CastExpression ::= PushLPAREN PrimitiveType Dimsopt AdditionalBoundsListOpt PushRPAREN InsideCastExpression
        // UnaryExpression

        // this.intStack : posOfLeftParen dim posOfRightParen

        TypeReference[] bounds = null;
        int additionalBoundsLength = this.genericsLengthStack[this.genericsLengthPtr--];
        if (additionalBoundsLength > 0) {
            bounds = new TypeReference[additionalBoundsLength + 1];
            this.genericsPtr -= additionalBoundsLength;
            System.arraycopy(this.genericsStack, this.genericsPtr + 1, bounds, 1, additionalBoundsLength);
        }

        // optimize the push/pop
        Expression exp;
        Expression cast;
        TypeReference castType;
        int end = this.intStack[this.intPtr--];
        if (additionalBoundsLength > 0) {
            bounds[0] = getTypeReference(this.intStack[this.intPtr--]);
            castType = createIntersectionCastTypeReference(bounds);
        } else {
            castType = getTypeReference(this.intStack[this.intPtr--]);
        }
        this.expressionStack[this.expressionPtr]
            = cast = new CastExpression(exp = this.expressionStack[this.expressionPtr], castType);
        castType.sourceEnd = end - 1;
        castType.sourceStart = (cast.sourceStart = this.intStack[this.intPtr--]) + 1;
        cast.sourceEnd = exp.sourceEnd;
    }

    protected void consumeCastExpressionWithQualifiedGenericsArray() {
        // CastExpression ::= PushLPAREN Name OnlyTypeArguments '.' ClassOrInterfaceType Dimsopt AdditionalBoundsOpt
        // PushRPAREN InsideCastExpression UnaryExpressionNotPlusMinus

        TypeReference[] bounds = null;
        int additionalBoundsLength = this.genericsLengthStack[this.genericsLengthPtr--];
        if (additionalBoundsLength > 0) {
            bounds = new TypeReference[additionalBoundsLength + 1];
            this.genericsPtr -= additionalBoundsLength;
            System.arraycopy(this.genericsStack, this.genericsPtr + 1, bounds, 1, additionalBoundsLength);
        }

        Expression exp;
        Expression cast;
        TypeReference castType;
        int end = this.intStack[this.intPtr--];
        int dim = this.intStack[this.intPtr--];
        Annotation[][] annotationsOnDimensions = dim == 0 ? null : getAnnotationsOnDimensions(dim);
        TypeReference rightSide = getTypeReference(0);
        castType = computeQualifiedGenericsFromRightSide(rightSide, dim, annotationsOnDimensions);

        if (additionalBoundsLength > 0) {
            bounds[0] = castType;
            castType = createIntersectionCastTypeReference(bounds);
        }

        this.intPtr--;
        this.expressionStack[this.expressionPtr]
            = cast = new CastExpression(exp = this.expressionStack[this.expressionPtr], castType);
        castType.sourceEnd = end - 1;
        castType.sourceStart = (cast.sourceStart = this.intStack[this.intPtr--]) + 1;
        cast.sourceEnd = exp.sourceEnd;
    }

    protected void consumeCatches() {
        // Catches ::= Catches CatchClause
        optimizedConcatNodeLists();
    }

    protected void consumeCatchFormalParameter() {
        // CatchFormalParameter ::= Modifiersopt CatchType VariableDeclaratorId
        this.identifierLengthPtr--;
        char[] identifierName = this.identifierStack[this.identifierPtr];
        long namePositions = this.identifierPositionStack[this.identifierPtr--];
        int extendedDimensions = this.intStack[this.intPtr--]; // https://bugs.eclipse.org/bugs/show_bug.cgi?id=348369
        TypeReference type = (TypeReference) this.astStack[this.astPtr--];
        if (extendedDimensions > 0) {
            type = augmentTypeWithAdditionalDimensions(type, extendedDimensions, null, false);
            type.sourceEnd = this.endPosition;
            // https://bugs.eclipse.org/bugs/show_bug.cgi?id=391092
            if (type instanceof UnionTypeReference) {
                this.problemReporter().illegalArrayOfUnionType(type);
            }
        }
        this.astLengthPtr--;
        int modifierPositions = this.intStack[this.intPtr--];
        this.intPtr--;
        Argument arg = new Argument(identifierName, namePositions, type, this.intStack[this.intPtr + 1] & ~1048576); // modifiers
        arg.bits &= ~4;
        arg.declarationSourceStart = modifierPositions;
        // consume annotations
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                arg.annotations = new Annotation[length], 0, length);
        }
        pushOnAstStack(arg);
        /*
         * if incomplete method header, this.listLength counter will not have been reset, indicating that some arguments
         * are available on the stack
         */
        this.listLength++;
    }

    protected void consumeCatchHeader() {
        // CatchDeclaration ::= 'catch' '(' FormalParameter ')' '{'

        if (this.currentElement == null) {
            return; // should never occur, this consumeRule is only used in recovery mode
        }
        // current element should be a block due to the presence of the opening brace
        if (!(this.currentElement instanceof RecoveredBlock)) {
            if (!(this.currentElement instanceof RecoveredMethod)) {
                return;
            }
            RecoveredMethod rMethod = (RecoveredMethod) this.currentElement;
            if (!(rMethod.methodBody == null && rMethod.bracketBalance > 0)) {
                return;
            }
        }

        Argument arg = (Argument) this.astStack[this.astPtr--];
        // convert argument to local variable
        LocalDeclaration localDeclaration = new LocalDeclaration(arg.name, arg.sourceStart, arg.sourceEnd);
        localDeclaration.type = arg.type;
        localDeclaration.declarationSourceStart = arg.declarationSourceStart;
        localDeclaration.declarationSourceEnd = arg.declarationSourceEnd;

        this.currentElement = this.currentElement.add(localDeclaration, 0);
        this.lastCheckPoint = this.scanner.startPosition; // force to restart at this exact position
        this.restartRecovery = true; // request to restart from here on
        this.lastIgnoredToken = TokenNameInvalid;
    }

    protected void consumeCatchType() {
        // CatchType ::= UnionType
        int length = this.astLengthStack[this.astLengthPtr--];
        if (length != 1) {
            TypeReference[] typeReferences;
            System.arraycopy(this.astStack, (this.astPtr -= length) + 1, (typeReferences = new TypeReference[length]),
                0, length);
            UnionTypeReference typeReference = new UnionTypeReference(typeReferences);
            pushOnAstStack(typeReference);
        } else {
            // push back the type reference
            pushOnAstLengthStack(1);
        }
    }

    protected void consumeClassBodyDeclaration() {
        // ClassBodyDeclaration ::= Diet NestedMethod CreateInitializer Block
        // push an Initializer
        // optimize the push/pop
        this.nestedMethod[this.nestedType]--;
        Block block = (Block) this.astStack[this.astPtr--];
        this.astLengthPtr--;
        if (this.diet)
            block.bits &= ~8; // clear bit since was diet
        Initializer initializer = (Initializer) this.astStack[this.astPtr];
        initializer.declarationSourceStart = initializer.sourceStart = block.sourceStart;
        initializer.block = block;
        this.intPtr--; // pop sourcestart left on the stack by consumeNestedMethod.
        initializer.bodyStart = this.intStack[this.intPtr--];
        this.realBlockPtr--; // pop the block variable counter left on the stack by consumeNestedMethod
        int javadocCommentStart = this.intStack[this.intPtr--];
        if (javadocCommentStart != -1) {
            initializer.declarationSourceStart = javadocCommentStart;
            initializer.javadoc = this.javadoc;
            this.javadoc = null;
        }
        initializer.bodyEnd = this.endPosition;
        initializer.sourceEnd = this.endStatementPosition;
        initializer.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);
    }

    protected void consumeClassBodyDeclarations() {
        // ClassBodyDeclarations ::= ClassBodyDeclarations ClassBodyDeclaration
        concatNodeLists();
    }

    protected void consumeClassBodyDeclarationsopt() {
        // ClassBodyDeclarationsopt ::= NestedType ClassBodyDeclarations
        this.nestedType--;
    }

    protected void consumeClassBodyopt() {
        // ClassBodyopt ::= $empty
        pushOnAstStack(null);
        this.endPosition = this.rParenPos;
    }

    protected void consumeClassDeclaration() {
        // ClassDeclaration ::= ClassHeader ClassBody
        // RecordDeclaration ::= RecordHeaderPart ClassBody

        int length;
        if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            // there are length declarations
            // dispatch according to the type of the declarations
            dispatchDeclarationInto(length);
        }

        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];

        // convert constructors that do not have the type's name into methods
        boolean needDefaultConstructor = !typeDecl.checkConstructors(this);
        if (typeDecl.isRecord())
            needDefaultConstructor = false; // records require canonical constructors, not default no-arg constructors

        // add the default constructor when needed (interface don't have it)
        if (needDefaultConstructor) {
            switch (TypeDeclaration.kind(typeDecl.modifiers)) {
                case 1:
                case 3:
                    boolean insideFieldInitializer = false;
                    if (this.diet) {
                        for (int i = this.nestedType; i > 0; i--) {
                            if (this.variablesCounter[i] > 0) {
                                insideFieldInitializer = true;
                                break;
                            }
                        }
                    }
                    typeDecl.createDefaultConstructor(!(this.diet && this.dietInt == 0) || insideFieldInitializer);
            }
        }

        if (this.scanner.containsAssertKeyword) {
            typeDecl.bits |= 1;
        }
        // always add <clinit> (will be remove at code gen time if empty)
        typeDecl.addClinit();
        typeDecl.bodyEnd = this.endStatementPosition;
        if (length == 0 && !containsComment(typeDecl.bodyStart, typeDecl.bodyEnd)) {
            typeDecl.bits |= 8;
        }

        typeDecl.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);
    }

    protected void consumeClassHeader() {
        // ClassHeader ::= ClassHeaderName ClassHeaderExtendsopt ClassHeaderImplementsopt

        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];
        if (this.currentToken == TokenNameLBRACE) {
            typeDecl.bodyStart = this.scanner.currentPosition;
        }
        if (this.currentElement != null) {
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
        // flush the comments related to the class header
        this.scanner.commentPtr = -1;
    }

    protected void consumeClassHeaderExtends() {
        // ClassHeaderExtends ::= 'extends' ClassType
        // superclass
        TypeReference superClass = getTypeReference(0);
        // There is a class declaration on the top of stack
        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];
        typeDecl.bits |= (superClass.bits & 1048576);
        typeDecl.superclass = superClass;
        typeDecl.bodyStart = typeDecl.superclass.sourceEnd + 1;
        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = typeDecl.bodyStart;
        }
    }

    protected void consumeClassHeaderImplements() {
        // ClassHeaderImplements ::= 'implements' InterfaceTypeList
        int length = this.astLengthStack[this.astLengthPtr--];
        // super interfaces
        this.astPtr -= length;
        // There is a class declaration on the top of stack
        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];
        System.arraycopy(this.astStack, this.astPtr + 1, typeDecl.superInterfaces = new TypeReference[length], 0,
            length);
        TypeReference[] superinterfaces = typeDecl.superInterfaces;
        for (TypeReference superinterface : superinterfaces) {
            typeDecl.bits |= (superinterface.bits & 1048576);
        }
        typeDecl.bodyStart = typeDecl.superInterfaces[length - 1].sourceEnd + 1;
        this.listLength = 0; // reset after having read super-interfaces
        // recovery
        if (this.currentElement != null) { // is recovering
            this.lastCheckPoint = typeDecl.bodyStart;
        }
    }

    private void consumeClassOrRecordHeaderName1(boolean isRecord) {
        TypeDeclaration typeDecl = new TypeDeclaration(this.compilationUnit.compilationResult);
        if (this.nestedMethod[this.nestedType] == 0) {
            if (this.nestedType != 0) {
                typeDecl.bits |= 1024;
            }
        } else {
            // Record that the block has a declaration for local types
            typeDecl.bits |= 256;
            markEnclosingMemberWithLocalType();
            blockReal();
        }

        // highlight the name of the type
        long pos = this.identifierPositionStack[this.identifierPtr];
        typeDecl.sourceEnd = (int) pos;
        typeDecl.sourceStart = (int) (pos >>> 32);
        typeDecl.name = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        // compute the declaration source too
        // 'class' and 'interface' push two int positions: the beginning of the class token and its end.
        // we want to keep the beginning position but get rid of the end position
        // it is only used for the ClassLiteralAccess positions.
        typeDecl.declarationSourceStart = this.intStack[this.intPtr--];
        if (isRecord) {
            typeDecl.restrictedIdentifierStart = typeDecl.declarationSourceStart;
        }
        this.intPtr--; // remove the end position of the class token

        typeDecl.modifiersSourceStart = this.intStack[this.intPtr--];
        typeDecl.modifiers = this.intStack[this.intPtr--];
        if (typeDecl.modifiersSourceStart >= 0) {
            typeDecl.declarationSourceStart = typeDecl.modifiersSourceStart;
        }

        // Store secondary info
        if ((typeDecl.bits & 1024) == 0 && (typeDecl.bits & 256) == 0) {
            if (this.compilationUnit != null
                && !CharOperation.equals(typeDecl.name, this.compilationUnit.getMainTypeName())) {
                typeDecl.bits |= 4096;
            }
        }

        // consume annotations
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                typeDecl.annotations = new Annotation[length], 0, length);
        }
        typeDecl.bodyStart = typeDecl.sourceEnd + 1;
        if (isRecord) {
            typeDecl.modifiers |= 16777216;
        }
        pushOnAstStack(typeDecl);

        this.listLength = 0; // will be updated when reading super-interfaces
        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = typeDecl.bodyStart;
            this.currentElement = this.currentElement.add(typeDecl, 0);
            this.lastIgnoredToken = TokenNameInvalid;
        }
        // javadoc
        typeDecl.javadoc = this.javadoc;
        this.javadoc = null;
    }

    protected void consumeClassHeaderName1() {
        // ClassHeaderName1 ::= Modifiersopt 'class' 'Identifier'
        consumeClassOrRecordHeaderName1(false);
    }

    protected void consumeClassInstanceCreationExpression() {
        // ClassInstanceCreationExpression ::= 'new' ClassType '(' ArgumentListopt ')' ClassBodyopt
        classInstanceCreation(false);
    }

    protected void consumeClassInstanceCreationExpressionName() {
        // ClassInstanceCreationExpressionName ::= Name '.'
        pushOnExpressionStack(getUnspecifiedReferenceOptimized());
    }

    protected void consumeClassInstanceCreationExpressionQualified() {
        // ClassInstanceCreationExpression ::= Primary '.' 'new' SimpleName '(' ArgumentListopt ')' ClassBodyopt
        // ClassInstanceCreationExpression ::= ClassInstanceCreationExpressionName 'new' SimpleName '(' ArgumentListopt
        // ')' ClassBodyopt
        classInstanceCreation(true);

        QualifiedAllocationExpression qae = (QualifiedAllocationExpression) this.expressionStack[this.expressionPtr];

        if (qae.anonymousType == null) {
            this.expressionLengthPtr--;
            this.expressionPtr--;
            qae.enclosingInstance = this.expressionStack[this.expressionPtr];
            this.expressionStack[this.expressionPtr] = qae;
        }
        qae.sourceStart = qae.enclosingInstance.sourceStart;
    }

    protected void consumeClassInstanceCreationExpressionQualifiedWithTypeArguments() {
        // ClassInstanceCreationExpression ::= Primary '.' 'new' TypeArguments SimpleName '(' ArgumentListopt ')'
        // ClassBodyopt
        // ClassInstanceCreationExpression ::= ClassInstanceCreationExpressionName 'new' TypeArguments SimpleName '('
        // ArgumentListopt ')' ClassBodyopt

        QualifiedAllocationExpression alloc;
        int length;
        if (((length = this.astLengthStack[this.astLengthPtr--]) == 1) && (this.astStack[this.astPtr] == null)) {
            // NO ClassBody
            this.astPtr--;
            alloc = new QualifiedAllocationExpression();
            alloc.sourceEnd = this.endPosition; // the position has been stored explicitly

            if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
                this.expressionPtr -= length;
                System.arraycopy(this.expressionStack, this.expressionPtr + 1, alloc.arguments = new Expression[length],
                    0, length);
            }
            alloc.type = getTypeReference(0);
            checkForDiamond(alloc.type);
            length = this.genericsLengthStack[this.genericsLengthPtr--];
            this.genericsPtr -= length;
            System.arraycopy(this.genericsStack, this.genericsPtr + 1, alloc.typeArguments = new TypeReference[length],
                0, length);
            this.intPtr--;

            // the default constructor with the correct number of argument
            // will be created and added by the TC (see createsInternalConstructorWithBinding)
            alloc.sourceStart = this.intStack[this.intPtr--];
            pushOnExpressionStack(alloc);
        } else {
            dispatchDeclarationInto(length);
            TypeDeclaration anonymousTypeDeclaration = (TypeDeclaration) this.astStack[this.astPtr];
            anonymousTypeDeclaration.declarationSourceEnd = this.endStatementPosition;
            anonymousTypeDeclaration.bodyEnd = this.endStatementPosition;
            if (length == 0 && !containsComment(anonymousTypeDeclaration.bodyStart, anonymousTypeDeclaration.bodyEnd)) {
                anonymousTypeDeclaration.bits |= 8;
            }
            this.astPtr--;
            this.astLengthPtr--;

            QualifiedAllocationExpression allocationExpression = anonymousTypeDeclaration.allocation;
            if (allocationExpression != null) {
                allocationExpression.sourceEnd = this.endStatementPosition;
                // handle type arguments
                length = this.genericsLengthStack[this.genericsLengthPtr--];
                this.genericsPtr -= length;
                System.arraycopy(this.genericsStack, this.genericsPtr + 1,
                    allocationExpression.typeArguments = new TypeReference[length], 0, length);
                allocationExpression.sourceStart = this.intStack[this.intPtr--];
                checkForDiamond(allocationExpression.type);
            }
        }

        QualifiedAllocationExpression qae = (QualifiedAllocationExpression) this.expressionStack[this.expressionPtr];

        if (qae.anonymousType == null) {
            this.expressionLengthPtr--;
            this.expressionPtr--;
            qae.enclosingInstance = this.expressionStack[this.expressionPtr];
            this.expressionStack[this.expressionPtr] = qae;
        }
        qae.sourceStart = qae.enclosingInstance.sourceStart;
    }

    protected void consumeClassInstanceCreationExpressionWithTypeArguments() {
        // ClassInstanceCreationExpression ::= 'new' TypeArguments ClassType '(' ArgumentListopt ')' ClassBodyopt
        AllocationExpression alloc;
        int length;
        if (((length = this.astLengthStack[this.astLengthPtr--]) == 1) && (this.astStack[this.astPtr] == null)) {
            // NO ClassBody
            this.astPtr--;
            alloc = new AllocationExpression();
            alloc.sourceEnd = this.endPosition; // the position has been stored explicitly

            if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
                this.expressionPtr -= length;
                System.arraycopy(this.expressionStack, this.expressionPtr + 1, alloc.arguments = new Expression[length],
                    0, length);
            }
            alloc.type = getTypeReference(0);
            checkForDiamond(alloc.type);

            length = this.genericsLengthStack[this.genericsLengthPtr--];
            this.genericsPtr -= length;
            System.arraycopy(this.genericsStack, this.genericsPtr + 1, alloc.typeArguments = new TypeReference[length],
                0, length);
            this.intPtr--;

            // the default constructor with the correct number of argument
            // will be created and added by the TC (see createsInternalConstructorWithBinding)
            alloc.sourceStart = this.intStack[this.intPtr--];
            pushOnExpressionStack(alloc);
        } else {
            dispatchDeclarationInto(length);
            TypeDeclaration anonymousTypeDeclaration = (TypeDeclaration) this.astStack[this.astPtr];
            anonymousTypeDeclaration.declarationSourceEnd = this.endStatementPosition;
            anonymousTypeDeclaration.bodyEnd = this.endStatementPosition;
            if (length == 0 && !containsComment(anonymousTypeDeclaration.bodyStart, anonymousTypeDeclaration.bodyEnd)) {
                anonymousTypeDeclaration.bits |= 8;
            }
            this.astPtr--;
            this.astLengthPtr--;

            QualifiedAllocationExpression allocationExpression = anonymousTypeDeclaration.allocation;
            if (allocationExpression != null) {
                allocationExpression.sourceEnd = this.endStatementPosition;
                // handle type arguments
                length = this.genericsLengthStack[this.genericsLengthPtr--];
                this.genericsPtr -= length;
                System.arraycopy(this.genericsStack, this.genericsPtr + 1,
                    allocationExpression.typeArguments = new TypeReference[length], 0, length);
                allocationExpression.sourceStart = this.intStack[this.intPtr--];
                checkForDiamond(allocationExpression.type);
            }
        }
    }

    protected void consumeClassOrInterface() {
        this.genericsIdentifiersLengthStack[this.genericsIdentifiersLengthPtr]
            += this.identifierLengthStack[this.identifierLengthPtr];
        pushOnGenericsLengthStack(0); // handle type arguments
    }

    protected void consumeClassOrInterfaceName() {
        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
        pushOnGenericsLengthStack(0); // handle type arguments
    }

    protected void consumeClassTypeElt() {
        // ClassTypeElt ::= ClassType
        pushOnAstStack(getTypeReference(0));
        /*
         * if incomplete thrown exception list, this.listLength counter will not have been reset, indicating that some
         * items are available on the stack
         */
        this.listLength++;
    }

    protected void consumeClassTypeList() {
        // ClassTypeList ::= ClassTypeList ',' ClassTypeElt
        optimizedConcatNodeLists();
    }

    protected void consumeConditionalExpression() {
        // ConditionalExpression ::= ConditionalOrExpression '?' Expression ':' ConditionalExpression
        // optimize the push/pop
        this.intPtr -= 2;// consume position of the question mark
        this.expressionPtr -= 2;
        this.expressionLengthPtr -= 2;
        this.expressionStack[this.expressionPtr] = new ConditionalExpression(this.expressionStack[this.expressionPtr],
            this.expressionStack[this.expressionPtr + 1], this.expressionStack[this.expressionPtr + 2]);
    }

    protected void consumeConditionalExpressionWithName() {
        // ConditionalExpression ::= Name '?' Expression ':' ConditionalExpression
        this.intPtr -= 2;// consume position of the question mark
        pushOnExpressionStack(getUnspecifiedReferenceOptimized());
        this.expressionPtr -= 2;
        this.expressionLengthPtr -= 2;
        this.expressionStack[this.expressionPtr]
            = new ConditionalExpression(this.expressionStack[this.expressionPtr + 2],
                this.expressionStack[this.expressionPtr], this.expressionStack[this.expressionPtr + 1]);
    }

    protected void consumeConstructorDeclaration() {
        // ConstructorDeclaration ::= ConstructorHeader ConstructorBody

        /*
         * this.astStack : MethodDeclaration statements this.identifierStack : name ==> this.astStack :
         * MethodDeclaration this.identifierStack :
         */

        // must provide a default constructor call when needed

        int length;

        // pop the position of the { (body of the method) pushed in block decl
        this.intPtr--;
        this.intPtr--;

        // statements
        this.realBlockPtr--;
        ExplicitConstructorCall constructorCall = null;
        Statement[] statements = null;
        if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            this.astPtr -= length;
            if (!this.options.ignoreMethodBodies) {
                if (this.astStack[this.astPtr + 1]instanceof ExplicitConstructorCall explicitCall) {
                    // avoid a isSomeThing that would only be used here BUT what is faster between two alternatives ?
                    System.arraycopy(this.astStack, this.astPtr + 2, statements = new Statement[length - 1], 0,
                        length - 1);
                    constructorCall = explicitCall;
                } else { // need to add explicitly the super();
                    System.arraycopy(this.astStack, this.astPtr + 1, statements = new Statement[length], 0, length);
                    constructorCall = SuperReference.implicitSuperConstructorCall();
                }
            }
        } else {
            boolean insideFieldInitializer = false;
            if (this.diet) {
                for (int i = this.nestedType; i > 0; i--) {
                    if (this.variablesCounter[i] > 0) {
                        insideFieldInitializer = true;
                        break;
                    }
                }
            }

            if (!this.options.ignoreMethodBodies) {
                if (!this.diet || insideFieldInitializer) {
                    // add it only in non-diet mode, if diet_bodies, then constructor call will be added elsewhere.
                    constructorCall = SuperReference.implicitSuperConstructorCall();
                }
            }
        }

        // now we know that the top of stack is a constructorDeclaration
        ConstructorDeclaration cd = (ConstructorDeclaration) this.astStack[this.astPtr];
        cd.constructorCall = constructorCall;
        cd.statements = statements;

        // highlight of the implicit call on the method name
        if (constructorCall != null && cd.constructorCall.sourceEnd == 0) {
            cd.constructorCall.sourceEnd = cd.sourceEnd;
            cd.constructorCall.sourceStart = cd.sourceStart;
        }

        if (!(this.diet && this.dietInt == 0)
            && statements == null
            && (constructorCall == null || constructorCall.isImplicitSuper())
            && !containsComment(cd.bodyStart, this.endPosition)) {
            cd.bits |= 8;
        }

        // watch for } that could be given as a unicode ! ( u007D is '}' )
        // store the this.endPosition (position just before the '}') in case there is
        // a trailing comment behind the end of the method
        cd.bodyEnd = this.endPosition;
        cd.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);
    }

    protected void consumeConstructorHeader() {
        // ConstructorHeader ::= ConstructorHeaderName MethodHeaderParameters MethodHeaderThrowsClauseopt
        // CompactConstructorHeader ::= CompactConstructorHeaderName MethodHeaderThrowsClauseopt

        AbstractMethodDeclaration method = (AbstractMethodDeclaration) this.astStack[this.astPtr];

        if (this.currentToken == TokenNameLBRACE) {
            method.bodyStart = this.scanner.currentPosition;
        }
        // recovery
        if (this.currentElement != null) {
            if (this.currentToken == TokenNameSEMICOLON) { // for invalid constructors
                method.modifiers |= 16777216;
                method.declarationSourceEnd = this.scanner.currentPosition - 1;
                method.bodyEnd = this.scanner.currentPosition - 1;
                if (this.currentElement.parseTree() == method && this.currentElement.parent != null) {
                    this.currentElement = this.currentElement.parent;
                }
            }
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
    }

    protected void consumeConstructorHeaderName(boolean isCompact) {

        /* recovering - might be an empty message send */
        if (this.currentElement != null) {
            if (this.lastIgnoredToken == TokenNamenew) { // was an allocation expression
                this.lastCheckPoint = this.scanner.startPosition; // force to restart at this exact position
                this.restartRecovery = true;
                return;
            }
        }

        // ConstructorHeaderName ::= Modifiersopt 'Identifier' '('
        // CompactConstructorHeaderName ::= Modifiersopt 'Identifier'
        ConstructorDeclaration cd = new ConstructorDeclaration(this.compilationUnit.compilationResult);

        // name -- this is not really revelant but we do .....
        cd.selector = this.identifierStack[this.identifierPtr];
        long selectorSource = this.identifierPositionStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        // modifiers
        cd.declarationSourceStart = this.intStack[this.intPtr--];
        cd.modifiers = this.intStack[this.intPtr--];

        // consume annotations
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                cd.annotations = new Annotation[length], 0, length);
        }
        // javadoc
        cd.javadoc = this.javadoc;
        this.javadoc = null;

        // highlight starts at the selector starts
        cd.sourceStart = (int) (selectorSource >>> 32);
        pushOnAstStack(cd);

        cd.sourceEnd = isCompact ? cd.sourceStart + cd.selector.length - 1 : this.lParenPos;
        cd.bodyStart = isCompact ? cd.sourceStart + cd.selector.length : this.lParenPos + 1;

        this.listLength = 0; // initialize this.listLength before reading parameters/throws

        if (isCompact) {
            cd.modifiers |= 8388608;
            cd.bits |= 512;
            for (int i = this.astPtr; i >= 0; i--) {
                if (this.astStack[i]instanceof TypeDeclaration declaringClass) {
                    if (declaringClass.declarationSourceEnd > 0)
                        continue; // skip preceding member types
                    if (declaringClass.isRecord())
                        ;
                    else
                        problemReporter().compactConstructorsOnlyInRecords(cd);
                    break;
                }
            }
        }

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = cd.bodyStart;
            if ((this.currentElement instanceof RecoveredType && this.lastIgnoredToken != TokenNameDOT)
                || cd.modifiers != 0) {
                this.currentElement = this.currentElement.add(cd, 0);
                this.lastIgnoredToken = TokenNameInvalid;
            }
        }
    }

    protected void consumeConstructorHeaderNameWithTypeParameters() {

        /* recovering - might be an empty message send */
        if (this.currentElement != null) {
            if (this.lastIgnoredToken == TokenNamenew) { // was an allocation expression
                this.lastCheckPoint = this.scanner.startPosition; // force to restart at this exact position
                this.restartRecovery = true;
                return;
            }
        }

        // ConstructorHeaderName ::= Modifiersopt TypeParameters 'Identifier' '('
        ConstructorDeclaration cd = new ConstructorDeclaration(this.compilationUnit.compilationResult);

        helperConstructorHeaderNameWithTypeParameters(cd);
    }

    private void helperConstructorHeaderNameWithTypeParameters(ConstructorDeclaration cd) {
        // name -- this is not really revelant but we do .....
        cd.selector = this.identifierStack[this.identifierPtr];
        long selectorSource = this.identifierPositionStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        // consume type parameters
        int length = this.genericsLengthStack[this.genericsLengthPtr--];
        this.genericsPtr -= length;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1, cd.typeParameters = new TypeParameter[length], 0,
            length);

        // modifiers
        cd.declarationSourceStart = this.intStack[this.intPtr--];
        cd.modifiers = this.intStack[this.intPtr--];
        // consume annotations
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                cd.annotations = new Annotation[length], 0, length);
        }
        // javadoc
        cd.javadoc = this.javadoc;
        this.javadoc = null;

        // highlight starts at the selector starts
        cd.sourceStart = (int) (selectorSource >>> 32);
        pushOnAstStack(cd);
        cd.sourceEnd = this.lParenPos;
        cd.bodyStart = this.lParenPos + 1;
        this.listLength = 0; // initialize this.listLength before reading parameters/throws

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = cd.bodyStart;
            if ((this.currentElement instanceof RecoveredType && this.lastIgnoredToken != TokenNameDOT)
                || cd.modifiers != 0) {
                this.currentElement = this.currentElement.add(cd, 0);
                this.lastIgnoredToken = TokenNameInvalid;
            }
        }
    }

    protected void consumeCreateInitializer() {
        pushOnAstStack(new Initializer(null, 0));
    }

    protected void consumeDefaultLabel() {
        pushOnExpressionStackLengthStack();
    }

    protected void consumeDefaultModifiers() {
        checkComment(); // might update modifiers with the deprecated flag
        pushOnIntStack(this.modifiers); // modifiers
        pushOnIntStack(this.modifiersSourceStart >= 0 ? this.modifiersSourceStart : this.scanner.startPosition);
        resetModifiers();
        pushOnExpressionStackLengthStack(); // no annotation
    }

    protected void consumeDiet() {
        // Diet ::= $empty
        checkComment();
        pushOnIntStack(this.modifiersSourceStart); // push the start position of a javadoc comment if there is one
        resetModifiers();
        jumpOverMethodBody();
    }

    protected void consumeDims() {
        // Dims ::= DimsLoop
        pushOnIntStack(this.dimensions);
        this.dimensions = 0;
    }

    protected void consumeDimWithOrWithOutExpr() {
        // DimWithOrWithOutExpr ::= TypeAnnotationsopt '[' ']'
        // DimWithOrWithOutExpr ::= TypeAnnotationsopt '[' Expression ']'
        pushOnExpressionStack(null);

        if (this.currentElement != null && this.currentToken == TokenNameLBRACE) {
            this.ignoreNextOpeningBrace = true;
            this.currentElement.bracketBalance++;
        }
    }

    protected void consumeDimWithOrWithOutExprs() {
        // DimWithOrWithOutExprs ::= DimWithOrWithOutExprs DimWithOrWithOutExpr
        concatExpressionLists();
    }

    protected void consumeUnionType() {
        // UnionType ::= UnionType '|' Type
        pushOnAstStack(getTypeReference(this.intStack[this.intPtr--]));
        optimizedConcatNodeLists();
    }

    protected void consumeUnionTypeAsClassType() {
        // UnionType ::= Type
        pushOnAstStack(getTypeReference(this.intStack[this.intPtr--]));
    }

    protected void consumeEmptyAnnotationTypeMemberDeclarationsopt() {
        // AnnotationTypeMemberDeclarationsopt ::= $empty
        pushOnAstLengthStack(0);
    }

    protected void consumeEmptyArgumentListopt() {
        // ArgumentListopt ::= $empty
        pushOnExpressionStackLengthStack();
    }

    protected void consumeEmptyArguments() {
        // Argumentsopt ::= $empty
        final FieldDeclaration fieldDeclaration = (FieldDeclaration) this.astStack[this.astPtr];
        pushOnIntStack(fieldDeclaration.sourceEnd);
        pushOnExpressionStackLengthStack();
    }

    protected void consumeEmptyArrayInitializer() {
        // ArrayInitializer ::= '{' ,opt '}'
        arrayInitializer(0);
    }

    protected void consumeEmptyBlockStatementsopt() {
        // BlockStatementsopt ::= $empty
        pushOnAstLengthStack(0);
    }

    protected void consumeEmptyCatchesopt() {
        // Catchesopt ::= $empty
        pushOnAstLengthStack(0);
    }

    protected void consumeEmptyClassBodyDeclarationsopt() {
        // ClassBodyDeclarationsopt ::= $empty
        pushOnAstLengthStack(0);
    }

    protected void consumeEmptyDimsopt() {
        // Dimsopt ::= $empty
        pushOnIntStack(0);
    }

    protected void consumeUnnamedVariable() {
        // VariableDeclaratorId ::= '_'
        pushOnIntStack(0);
    }

    protected void consumeEmptyEnumDeclarations() {
        // EnumBodyDeclarationsopt ::= $empty
        pushOnAstLengthStack(0);
    }

    protected void consumeEmptyExpression() {
        // Expressionopt ::= $empty
        pushOnExpressionStackLengthStack();
    }

    protected void consumeEmptyForInitopt() {
        // ForInitopt ::= $empty
        pushOnAstLengthStack(0);
        this.forStartPosition = 0;
    }

    protected void consumeEmptyForUpdateopt() {
        // ForUpdateopt ::= $empty
        pushOnExpressionStackLengthStack();
    }

    protected void consumeEmptyInterfaceMemberDeclarationsopt() {
        // InterfaceMemberDeclarationsopt ::= $empty
        pushOnAstLengthStack(0);
    }

    protected void consumeEmptyInternalCompilationUnit() {
        // InternalCompilationUnit ::= $empty
        // nothing to do by default
        if (this.compilationUnit.isPackageInfo()) {
            this.compilationUnit.types = new TypeDeclaration[1];
            this.compilationUnit.createPackageInfoType();
        }
    }

    protected void consumeEmptyMemberValueArrayInitializer() {
        // MemberValueArrayInitializer ::= '{' ',' '}'
        // MemberValueArrayInitializer ::= '{' '}'
        arrayInitializer(0);
    }

    protected void consumeEmptyMemberValuePairsopt() {
        // MemberValuePairsopt ::= $empty
        pushOnAstLengthStack(0);
    }

    protected void consumeEmptyMethodHeaderDefaultValue() {
        // DefaultValueopt ::= $empty
        AbstractMethodDeclaration method = (AbstractMethodDeclaration) this.astStack[this.astPtr];
        if (method.isAnnotationMethod()) { // 'method' can be a MethodDeclaration when recovery is started
            pushOnExpressionStackLengthStack();
        }
        this.recordStringLiterals = true;
    }

    protected void consumeEmptyStatement() {
        // EmptyStatement ::= ';'
        char[] source = this.scanner.source;
        if (source[this.endStatementPosition] == ';') {
            pushOnAstStack(new EmptyStatement(this.endStatementPosition, this.endStatementPosition));
        } else {
            if (source.length > 5) {
                int c1, c2, c3, c4;
                int pos = this.endStatementPosition - 4;
                while (source[pos] == 'u') {
                    pos--;
                }
                if (source[pos] == '\\'
                    && !((c1 = ScannerHelper.getHexadecimalValue(source[this.endStatementPosition - 3])) > 15
                        || c1 < 0
                        || (c2 = ScannerHelper.getHexadecimalValue(source[this.endStatementPosition - 2])) > 15
                        || c2 < 0
                        || (c3 = ScannerHelper.getHexadecimalValue(source[this.endStatementPosition - 1])) > 15
                        || c3 < 0
                        || (c4 = ScannerHelper.getHexadecimalValue(source[this.endStatementPosition])) > 15
                        || c4 < 0)
                    && ((char) (((c1 * 16 + c2) * 16 + c3) * 16 + c4)) == ';') {
                    // we have a Unicode for the ';' (/u003B)
                    pushOnAstStack(new EmptyStatement(pos, this.endStatementPosition));
                    return;
                }
            }
            pushOnAstStack(new EmptyStatement(this.endPosition + 1, this.endStatementPosition));
        }
    }

    protected void consumeEmptyTypeDeclaration() {
        // ClassMemberDeclaration ::= ';'
        // InterfaceMemberDeclaration ::= ';'
        // TypeDeclaration ::= ';'
        pushOnAstLengthStack(0);
        if (!this.statementRecoveryActivated)
            problemReporter().superfluousSemicolon(this.endPosition + 1, this.endStatementPosition);
        flushCommentsDefinedPriorTo(this.endStatementPosition);
    }

    protected void consumeEnhancedForStatement() {
        // EnhancedForStatement ::= EnhancedForStatementHeader Statement
        // EnhancedForStatementNoShortIf ::= EnhancedForStatementHeader StatementNoShortIf

        // statements
        this.astLengthPtr--;
        Statement statement = (Statement) this.astStack[this.astPtr--];

        // foreach statement is on the ast stack
        ForeachStatement foreachStatement = (ForeachStatement) this.astStack[this.astPtr];
        foreachStatement.action = statement;
        // remember useful empty statement
        if (statement instanceof EmptyStatement)
            statement.bits |= 1;

        foreachStatement.sourceEnd = this.endStatementPosition;
    }

    protected void consumeEnhancedForStatementHeader() {
        // EnhancedForStatementHeader ::= EnhancedForStatementHeaderInit ':' Expression ')'
        final ForeachStatement statement = (ForeachStatement) this.astStack[this.astPtr];
        // updates are on the expression stack
        this.expressionLengthPtr--;
        final Expression collection = this.expressionStack[this.expressionPtr--];
        statement.collection = collection;
        // https://bugs.eclipse.org/393719 - [compiler] inconsistent warnings on iteration variables
        // let declaration(Source)End include the collection to achieve that @SuppressWarnings affects this part, too:
        statement.elementVariable.declarationSourceEnd = collection.sourceEnd;
        statement.elementVariable.declarationEnd = collection.sourceEnd;
        statement.sourceEnd = this.rParenPos;
    }

    protected void consumeEnhancedForStatementHeaderInit(boolean hasModifiers) {
        TypeReference type;

        char[] identifierName = this.identifierStack[this.identifierPtr];
        long namePosition = this.identifierPositionStack[this.identifierPtr];

        LocalDeclaration localDeclaration
            = createLocalDeclaration(identifierName, (int) (namePosition >>> 32), (int) namePosition);
        localDeclaration.declarationSourceEnd = localDeclaration.declarationEnd;
        localDeclaration.bits |= 16;

        int extraDims = this.intStack[this.intPtr--];
        Annotation[][] annotationsOnExtendedDimensions = extraDims == 0 ? null : getAnnotationsOnDimensions(extraDims);
        this.identifierPtr--;
        this.identifierLengthPtr--;
        // remove fake modifiers/modifiers start
        int declarationSourceStart = 0;
        int modifiersValue = 0;
        if (hasModifiers) {
            declarationSourceStart = this.intStack[this.intPtr--];
            modifiersValue = this.intStack[this.intPtr--];
        } else {
            this.intPtr -= 2;
        }

        type = getTypeReference(this.intStack[this.intPtr--]); // type dimension

        // consume annotations
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                localDeclaration.annotations = new Annotation[length], 0, length);
            localDeclaration.bits |= 1048576;
        }
        if (extraDims != 0) {
            type = augmentTypeWithAdditionalDimensions(type, extraDims, annotationsOnExtendedDimensions, false);
        }
        if (hasModifiers) {
            localDeclaration.declarationSourceStart = declarationSourceStart;
            localDeclaration.modifiers = modifiersValue;
        } else {
            localDeclaration.declarationSourceStart = type.sourceStart;
        }
        localDeclaration.type = type;
        localDeclaration.bits |= (type.bits & 1048576);

        ForeachStatement iteratorForStatement = new ForeachStatement(localDeclaration, this.intStack[this.intPtr--]);
        pushOnAstStack(iteratorForStatement);

        iteratorForStatement.sourceEnd = localDeclaration.declarationSourceEnd;
        this.forStartPosition = 0;
    }

    protected void consumeEnterAnonymousClassBody(boolean qualified) {
        // EnterAnonymousClassBody ::= $empty
        TypeReference typeReference = getTypeReference(0);

        TypeDeclaration anonymousType = new TypeDeclaration(this.compilationUnit.compilationResult);
        anonymousType.name = CharOperation.NO_CHAR;
        anonymousType.bits |= (512 | 256);
        anonymousType.bits |= (typeReference.bits & 1048576);
        QualifiedAllocationExpression alloc = new QualifiedAllocationExpression(anonymousType);
        markEnclosingMemberWithLocalType();
        pushOnAstStack(anonymousType);

        alloc.sourceEnd = this.rParenPos; // the position has been stored explicitly
        int argumentLength;
        if ((argumentLength = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            this.expressionPtr -= argumentLength;
            System.arraycopy(this.expressionStack, this.expressionPtr + 1,
                alloc.arguments = new Expression[argumentLength], 0, argumentLength);
        }

        if (qualified) {
            this.expressionLengthPtr--;
            alloc.enclosingInstance = this.expressionStack[this.expressionPtr--];
        }

        alloc.type = typeReference;

        anonymousType.sourceEnd = alloc.sourceEnd;
        // position at the type while it impacts the anonymous declaration
        anonymousType.sourceStart = anonymousType.declarationSourceStart = alloc.type.sourceStart;
        alloc.sourceStart = this.intStack[this.intPtr--];
        pushOnExpressionStack(alloc);

        anonymousType.bodyStart = this.scanner.currentPosition;
        this.listLength = 0; // will be updated when reading super-interfaces

        // flush the comments related to the anonymous
        this.scanner.commentPtr = -1;

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = anonymousType.bodyStart;
            this.currentElement = this.currentElement.add(anonymousType, 0);
            if (!(this.currentElement instanceof RecoveredAnnotation)) {
                this.currentToken = TokenNameNotAToken;
            } else {
                this.ignoreNextOpeningBrace = true;
                this.currentElement.bracketBalance++;
            }
            this.lastIgnoredToken = TokenNameInvalid;
        }
        checkForDiamond(typeReference);
    }

    protected void consumeEnterMemberValue() {
        // EnterMemberValue ::= $empty
        if (this.currentElement instanceof RecoveredAnnotation recoveredAnnotation) {
            recoveredAnnotation.hasPendingMemberValueName = true;
        }
    }

    protected void consumeEnterMemberValueArrayInitializer() {
        // EnterMemberValueArrayInitializer ::= $empty
        if (this.currentElement != null) {
            this.ignoreNextOpeningBrace = true;
            this.currentElement.bracketBalance++;
        }
    }

    protected void consumeEnterVariable() {
        // EnterVariable ::= $empty
        // do nothing by default

        char[] identifierName = this.identifierStack[this.identifierPtr];
        long namePosition = this.identifierPositionStack[this.identifierPtr];
        int extendedDimensions = this.intStack[this.intPtr--];
        // pop any annotations on extended dimensions now, so they don't pollute the base dimensions.
        Annotation[][] annotationsOnExtendedDimensions
            = extendedDimensions == 0 ? null : getAnnotationsOnDimensions(extendedDimensions);
        AbstractVariableDeclaration declaration;
        // create the ast node
        boolean isLocalDeclaration = this.nestedMethod[this.nestedType] != 0;
        if (isLocalDeclaration) {
            // create the local variable declarations
            declaration = createLocalDeclaration(identifierName, (int) (namePosition >>> 32), (int) namePosition);
        } else {
            // create the field declaration
            declaration = createFieldDeclaration(identifierName, (int) (namePosition >>> 32), (int) namePosition);
        }

        this.identifierPtr--;
        this.identifierLengthPtr--;
        TypeReference type;
        int variableIndex = this.variablesCounter[this.nestedType];
        if (variableIndex == 0) {
            // first variable of the declaration (FieldDeclaration or LocalDeclaration)
            if (isLocalDeclaration) {
                declaration.declarationSourceStart = this.intStack[this.intPtr--];
                declaration.modifiers = this.intStack[this.intPtr--];
                // consume annotations
                int length;
                if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
                    System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                        declaration.annotations = new Annotation[length], 0, length);
                }
                type = getTypeReference(this.intStack[this.intPtr--]); // type dimension
                if (declaration.declarationSourceStart == -1) {
                    // this is true if there is no modifiers for the local variable declaration
                    declaration.declarationSourceStart = type.sourceStart;
                }
                pushOnAstStack(type);
            } else {
                type = getTypeReference(this.intStack[this.intPtr--]); // type dimension
                pushOnAstStack(type);
                declaration.declarationSourceStart = this.intStack[this.intPtr--];
                declaration.modifiers = this.intStack[this.intPtr--];
                // consume annotations
                int length;
                if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
                    System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                        declaration.annotations = new Annotation[length], 0, length);
                }
                // Store javadoc only on first declaration as it is the same for all ones
                FieldDeclaration fieldDeclaration = (FieldDeclaration) declaration;
                fieldDeclaration.javadoc = this.javadoc;
            }
            this.javadoc = null;
        } else {
            type = (TypeReference) this.astStack[this.astPtr - variableIndex];
            AbstractVariableDeclaration previousVariable = (AbstractVariableDeclaration) this.astStack[this.astPtr];
            declaration.declarationSourceStart = previousVariable.declarationSourceStart;
            declaration.modifiers = previousVariable.modifiers;
            final Annotation[] annotations = previousVariable.annotations;
            if (annotations != null) {
                final int annotationsLength = annotations.length;
                System.arraycopy(annotations, 0, declaration.annotations = new Annotation[annotationsLength], 0,
                    annotationsLength);
            }
            declaration.bits |= 4194304;
        }

        declaration.type = extendedDimensions == 0
            ? type
            : augmentTypeWithAdditionalDimensions(type, extendedDimensions, annotationsOnExtendedDimensions, false);
        declaration.bits |= (type.bits & 1048576);

        this.variablesCounter[this.nestedType]++;
        pushOnAstStack(declaration);
        // recovery
        if (this.currentElement != null) {
            if (!(this.currentElement instanceof RecoveredType)
                && (this.currentToken == TokenNameDOT
                    // || declaration.modifiers != 0
                    || (Util.getLineNumber(declaration.type.sourceStart, this.scanner.lineEnds, 0, this.scanner.linePtr)
                        != Util.getLineNumber((int) (namePosition >>> 32), this.scanner.lineEnds, 0,
                            this.scanner.linePtr)))) {
                this.lastCheckPoint = (int) (namePosition >>> 32);
                this.restartRecovery = true;
                return;
            }
            if (isLocalDeclaration) {
                LocalDeclaration localDecl = (LocalDeclaration) this.astStack[this.astPtr];
                this.lastCheckPoint = localDecl.sourceEnd + 1;
                this.currentElement = this.currentElement.add(localDecl, 0);
            } else {
                FieldDeclaration fieldDecl = (FieldDeclaration) this.astStack[this.astPtr];
                this.lastCheckPoint = fieldDecl.sourceEnd + 1;
                this.currentElement = this.currentElement.add(fieldDecl, 0);
            }
            this.lastIgnoredToken = TokenNameInvalid;
        }
    }

    protected void consumeEnumBodyWithConstants() {
        // merge the constants values with the class body
        concatNodeLists();
    }

    protected void consumeEnumConstantHeader() {
        FieldDeclaration enumConstant = (FieldDeclaration) this.astStack[this.astPtr];
        boolean foundOpeningBrace = this.currentToken == TokenNameLBRACE;
        if (foundOpeningBrace) {
            // qualified allocation expression
            TypeDeclaration anonymousType = new TypeDeclaration(this.compilationUnit.compilationResult);
            anonymousType.name = CharOperation.NO_CHAR;
            anonymousType.bits |= (512 | 256);
            final int start = this.scanner.startPosition;
            anonymousType.declarationSourceStart = start;
            anonymousType.sourceStart = start;
            anonymousType.sourceEnd = start; // closing parenthesis
            anonymousType.modifiers = 0;
            anonymousType.bodyStart = this.scanner.currentPosition;
            markEnclosingMemberWithLocalType();
            consumeNestedType();
            this.variablesCounter[this.nestedType]++;
            pushOnAstStack(anonymousType);
            QualifiedAllocationExpression allocationExpression = new QualifiedAllocationExpression(anonymousType);

            // fill arguments if needed
            int length;
            if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
                this.expressionPtr -= length;
                System.arraycopy(this.expressionStack, this.expressionPtr + 1,
                    allocationExpression.arguments = new Expression[length], 0, length);
            }
            enumConstant.initialization = allocationExpression;
        } else {
            AllocationExpression allocationExpression = new AllocationExpression();

            // fill arguments if needed
            int length;
            if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
                this.expressionPtr -= length;
                System.arraycopy(this.expressionStack, this.expressionPtr + 1,
                    allocationExpression.arguments = new Expression[length], 0, length);
            }
            enumConstant.initialization = allocationExpression;
        }
        // initialize the starting position of the allocation expression
        enumConstant.initialization.sourceStart = enumConstant.declarationSourceStart;

        // recovery
        if (this.currentElement != null) {
            if (foundOpeningBrace) {
                TypeDeclaration anonymousType = (TypeDeclaration) this.astStack[this.astPtr];
                this.currentElement = this.currentElement.add(anonymousType, 0);
                this.lastCheckPoint = anonymousType.bodyStart;
                this.lastIgnoredToken = TokenNameInvalid;
                {
                    this.currentToken = TokenNameNotAToken;
                } // opening brace already taken into account
            } else {
                if (this.currentToken == TokenNameSEMICOLON) {
                    RecoveredType currentType = currentRecoveryType();
                    if (currentType != null) {
                        currentType.insideEnumConstantPart = false;
                    }
                }
                this.lastCheckPoint = this.scanner.startPosition; // force to restart at this exact position
                this.lastIgnoredToken = TokenNameInvalid;
                this.restartRecovery = true;
            }
        }
    }

    protected void consumeEnumConstantHeaderName() {
        if (this.currentElement != null) {
            if (!(this.currentElement instanceof RecoveredType
                || (this.currentElement instanceof RecoveredField recoveredField
                    && recoveredField.fieldDeclaration.type == null))
                || (this.lastIgnoredToken == TokenNameDOT)) {
                this.lastCheckPoint = this.scanner.startPosition;
                this.restartRecovery = true;
                return;
            }
        }
        long namePosition = this.identifierPositionStack[this.identifierPtr];
        char[] constantName = this.identifierStack[this.identifierPtr];
        final int sourceEnd = (int) namePosition;
        FieldDeclaration enumConstant = createFieldDeclaration(constantName, (int) (namePosition >>> 32), sourceEnd);
        this.identifierPtr--;
        this.identifierLengthPtr--;
        enumConstant.modifiersSourceStart = this.intStack[this.intPtr--];
        enumConstant.modifiers = this.intStack[this.intPtr--];
        enumConstant.declarationSourceStart = enumConstant.modifiersSourceStart;

        // consume annotations
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                enumConstant.annotations = new Annotation[length], 0, length);
            enumConstant.bits |= 1048576;
        }
        pushOnAstStack(enumConstant);
        if (this.currentElement != null) {
            this.lastCheckPoint = enumConstant.sourceEnd + 1;
            this.currentElement = this.currentElement.add(enumConstant, 0);
        }
        // javadoc
        enumConstant.javadoc = this.javadoc;
        this.javadoc = null;
    }

    protected void consumeEnumConstantNoClassBody() {
        // set declarationEnd and declarationSourceEnd
        int endOfEnumConstant = this.intStack[this.intPtr--];
        final FieldDeclaration fieldDeclaration = (FieldDeclaration) this.astStack[this.astPtr];
        fieldDeclaration.declarationEnd = endOfEnumConstant;
        fieldDeclaration.declarationSourceEnd = endOfEnumConstant;

        // initialize the starting position of the allocation expression
        ASTNode initialization = fieldDeclaration.initialization;
        if (initialization != null) {
            initialization.sourceEnd = endOfEnumConstant;
        }

        // conditionally flush comments only if a comment starts inside the enum constant's source range
        if (this.scanner.commentPtr >= 0) {
            int startOfEnumConstant = fieldDeclaration.sourceStart;

            int lastCommentStart = Math.abs(this.scanner.commentStarts[this.scanner.commentPtr]);
            if (lastCommentStart >= startOfEnumConstant && lastCommentStart <= endOfEnumConstant) {
                this.scanner.commentPtr = -1; // flush, it's a trailing comment inside the enum constant
            }
        }
    }

    protected void consumeEnumConstants() {
        concatNodeLists();
    }

    protected void consumeEnumConstantWithClassBody() {
        dispatchDeclarationInto(this.astLengthStack[this.astLengthPtr--]);
        TypeDeclaration anonymousType = (TypeDeclaration) this.astStack[this.astPtr--]; // pop type
        this.astLengthPtr--;
        anonymousType.addClinit();
        anonymousType.bodyEnd = this.endPosition;
        anonymousType.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);
        final FieldDeclaration fieldDeclaration = ((FieldDeclaration) this.astStack[this.astPtr]);
        fieldDeclaration.declarationEnd = this.endStatementPosition;
        int declarationSourceEnd = anonymousType.declarationSourceEnd;
        fieldDeclaration.declarationSourceEnd = declarationSourceEnd;
        this.intPtr--; // remove end position of the arguments
        this.variablesCounter[this.nestedType] = 0;
        this.nestedType--;
        ASTNode initialization = fieldDeclaration.initialization;
        if (initialization != null) {
            initialization.sourceEnd = declarationSourceEnd;
        }
    }

    protected void consumeEnumDeclaration() {
        // EnumDeclaration ::= EnumHeader ClassHeaderImplementsopt EnumBody
        int length;
        if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            // there are length declarations
            // dispatch according to the type of the declarations
            dispatchDeclarationIntoEnumDeclaration(length);
        }

        TypeDeclaration enumDeclaration = (TypeDeclaration) this.astStack[this.astPtr];

        // convert constructor that do not have the type's name into methods
        boolean hasConstructor = enumDeclaration.checkConstructors(this);

        // add the default constructor when needed
        if (!hasConstructor) {
            boolean insideFieldInitializer = false;
            if (this.diet) {
                for (int i = this.nestedType; i > 0; i--) {
                    if (this.variablesCounter[i] > 0) {
                        insideFieldInitializer = true;
                        break;
                    }
                }
            }
            enumDeclaration.createDefaultConstructor(!this.diet || insideFieldInitializer);
        }

        // always add <clinit> (will be remove at code gen time if empty)
        if (this.scanner.containsAssertKeyword) {
            enumDeclaration.bits |= 1;
        }
        enumDeclaration.addClinit();
        enumDeclaration.bodyEnd = this.endStatementPosition;
        if (length == 0 && !containsComment(enumDeclaration.bodyStart, enumDeclaration.bodyEnd)) {
            enumDeclaration.bits |= 8;
        }

        enumDeclaration.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);
    }

    protected void consumeEnumHeader() {
        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];
        if (this.currentToken == TokenNameLBRACE) {
            typeDecl.bodyStart = this.scanner.currentPosition;
        }

        if (this.currentElement != null) {
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }

        // flush the comments related to the enum header
        this.scanner.commentPtr = -1;
    }

    protected void consumeEnumHeaderName() {
        // EnumHeaderName ::= Modifiersopt 'enum' Identifier
        TypeDeclaration enumDeclaration = new TypeDeclaration(this.compilationUnit.compilationResult);
        if (this.nestedMethod[this.nestedType] == 0) {
            if (this.nestedType != 0) {
                enumDeclaration.bits |= 1024;
            }
        } else {
            // Record that the block has a declaration for local types
            markEnclosingMemberWithLocalType();
            blockReal();
        }
        // highlight the name of the type
        long pos = this.identifierPositionStack[this.identifierPtr];
        enumDeclaration.sourceEnd = (int) pos;
        enumDeclaration.sourceStart = (int) (pos >>> 32);
        enumDeclaration.name = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        // compute the declaration source too
        // 'class' and 'interface' push two int positions: the beginning of the class token and its end.
        // we want to keep the beginning position but get rid of the end position
        // it is only used for the ClassLiteralAccess positions.
        enumDeclaration.declarationSourceStart = this.intStack[this.intPtr--];
        this.intPtr--; // remove the end position of the class token

        enumDeclaration.modifiersSourceStart = this.intStack[this.intPtr--];
        enumDeclaration.modifiers = this.intStack[this.intPtr--] | 16384;
        if (enumDeclaration.modifiersSourceStart >= 0) {
            enumDeclaration.declarationSourceStart = enumDeclaration.modifiersSourceStart;
        }

        // Store secondary info
        if ((enumDeclaration.bits & 1024) == 0 && (enumDeclaration.bits & 256) == 0) {
            if (this.compilationUnit != null
                && !CharOperation.equals(enumDeclaration.name, this.compilationUnit.getMainTypeName())) {
                enumDeclaration.bits |= 4096;
            }
        }

        // consume annotations
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                enumDeclaration.annotations = new Annotation[length], 0, length);
        }
//	if (this.currentToken == TokenNameLBRACE) {
//		enumDeclaration.bodyStart = this.scanner.currentPosition;
//	}
        enumDeclaration.bodyStart = enumDeclaration.sourceEnd + 1;
        pushOnAstStack(enumDeclaration);

        this.listLength = 0; // will be updated when reading super-interfaces

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = enumDeclaration.bodyStart;
            this.currentElement = this.currentElement.add(enumDeclaration, 0);
            this.lastIgnoredToken = TokenNameInvalid;
        }
        // javadoc
        enumDeclaration.javadoc = this.javadoc;
        this.javadoc = null;
    }

    protected void consumeEnumHeaderNameWithTypeParameters() {
        // EnumHeaderNameWithTypeParameters ::= Modifiersopt 'enum' Identifier TypeParameters
        TypeDeclaration enumDeclaration = new TypeDeclaration(this.compilationUnit.compilationResult);
        // consume type parameters
        int length = this.genericsLengthStack[this.genericsLengthPtr--];
        this.genericsPtr -= length;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1,
            enumDeclaration.typeParameters = new TypeParameter[length], 0, length);

        problemReporter().invalidUsageOfTypeParametersForEnumDeclaration(enumDeclaration);

        enumDeclaration.bodyStart = enumDeclaration.typeParameters[length - 1].declarationSourceEnd + 1;

//	enumDeclaration.typeParameters = null;

        this.listTypeParameterLength = 0;

        if (this.nestedMethod[this.nestedType] == 0) {
            if (this.nestedType != 0) {
                enumDeclaration.bits |= 1024;
            }
        } else {
            // Record that the block has a declaration for local types
//		markEnclosingMemberWithLocalType();
            blockReal();
        }
        // highlight the name of the type
        long pos = this.identifierPositionStack[this.identifierPtr];
        enumDeclaration.sourceEnd = (int) pos;
        enumDeclaration.sourceStart = (int) (pos >>> 32);
        enumDeclaration.name = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        // compute the declaration source too
        // 'class' and 'interface' push two int positions: the beginning of the class token and its end.
        // we want to keep the beginning position but get rid of the end position
        // it is only used for the ClassLiteralAccess positions.
        enumDeclaration.declarationSourceStart = this.intStack[this.intPtr--];
        this.intPtr--; // remove the end position of the class token

        enumDeclaration.modifiersSourceStart = this.intStack[this.intPtr--];
        enumDeclaration.modifiers = this.intStack[this.intPtr--] | 16384;
        if (enumDeclaration.modifiersSourceStart >= 0) {
            enumDeclaration.declarationSourceStart = enumDeclaration.modifiersSourceStart;
        }

        // Store secondary info
        if ((enumDeclaration.bits & 1024) == 0 && (enumDeclaration.bits & 256) == 0) {
            if (this.compilationUnit != null
                && !CharOperation.equals(enumDeclaration.name, this.compilationUnit.getMainTypeName())) {
                enumDeclaration.bits |= 4096;
            }
        }

        // consume annotations
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                enumDeclaration.annotations = new Annotation[length], 0, length);
        }
//	if (this.currentToken == TokenNameLBRACE) {
//		enumDeclaration.bodyStart = this.scanner.currentPosition;
//	}
        enumDeclaration.bodyStart = enumDeclaration.sourceEnd + 1;
        pushOnAstStack(enumDeclaration);

        this.listLength = 0; // will be updated when reading super-interfaces

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = enumDeclaration.bodyStart;
            this.currentElement = this.currentElement.add(enumDeclaration, 0);
            this.lastIgnoredToken = TokenNameInvalid;
        }
        // javadoc
        enumDeclaration.javadoc = this.javadoc;
        this.javadoc = null;
    }

    protected void consumeEqualityExpression(int op) {
        // EqualityExpression ::= EqualityExpression '==' RelationalExpression
        // EqualityExpression ::= EqualityExpression '!=' RelationalExpression

        // optimize the push/pop

        this.expressionPtr--;
        this.expressionLengthPtr--;
        this.expressionStack[this.expressionPtr] = new EqualExpression(this.expressionStack[this.expressionPtr],
            this.expressionStack[this.expressionPtr + 1], op);
    }

    /*
     */
    protected void consumeEqualityExpressionWithName(int op) {
        // EqualityExpression ::= Name '==' RelationalExpression
        // EqualityExpression ::= Name '!=' RelationalExpression
        pushOnExpressionStack(getUnspecifiedReferenceOptimized());
        this.expressionPtr--;
        this.expressionLengthPtr--;
        this.expressionStack[this.expressionPtr] = new EqualExpression(this.expressionStack[this.expressionPtr + 1],
            this.expressionStack[this.expressionPtr], op);
    }

    protected void consumeExitMemberValue() {
        // ExitMemberValue ::= $empty
        if (this.currentElement instanceof RecoveredAnnotation recoveredAnnotation) {
            recoveredAnnotation.hasPendingMemberValueName = false;
            recoveredAnnotation.memberValuPairEqualEnd = -1;
        }
    }

    protected void consumeExitTryBlock() {
        // ExitTryBlock ::= $empty
        if (this.currentElement != null) {
            this.restartRecovery = true;
        }
    }

    protected void consumeExitVariableWithInitialization() {
        // ExitVariableWithInitialization ::= $empty
        // do nothing by default
        this.expressionLengthPtr--;
        AbstractVariableDeclaration variableDecl = (AbstractVariableDeclaration) this.astStack[this.astPtr];
        variableDecl.initialization = this.expressionStack[this.expressionPtr--];
        // we need to update the declarationSourceEnd of the local variable declaration to the
        // source end position of the initialization expression
        variableDecl.declarationSourceEnd = variableDecl.initialization.sourceEnd;
        variableDecl.declarationEnd = variableDecl.initialization.sourceEnd;

        recoveryExitFromVariable();
    }

    protected void consumeExitVariableWithoutInitialization() {
        // ExitVariableWithoutInitialization ::= $empty
        // do nothing by default

        AbstractVariableDeclaration variableDecl = (AbstractVariableDeclaration) this.astStack[this.astPtr];
        variableDecl.declarationSourceEnd = variableDecl.declarationEnd;
        if (this.currentElement instanceof RecoveredField) {
            if (this.endStatementPosition > variableDecl.sourceEnd) {
                this.currentElement.updateSourceEndIfNecessary(this.endStatementPosition);
            }
        }
        recoveryExitFromVariable();
    }

    protected void consumeExplicitConstructorInvocation(int flag, int recFlag) {

        /*
         * flag allows to distinguish 3 cases : (0) : ExplicitConstructorInvocation ::= 'this' '(' ArgumentListopt ')'
         * ';' ExplicitConstructorInvocation ::= 'super' '(' ArgumentListopt ')' ';' (1) : ExplicitConstructorInvocation
         * ::= Primary '.' 'super' '(' ArgumentListopt ')' ';' ExplicitConstructorInvocation ::= Primary '.' 'this' '('
         * ArgumentListopt ')' ';' (2) : ExplicitConstructorInvocation ::= Name '.' 'super' '(' ArgumentListopt ')' ';'
         * ExplicitConstructorInvocation ::= Name '.' 'this' '(' ArgumentListopt ')' ';'
         */
        int startPosition = this.intStack[this.intPtr--];
        ExplicitConstructorCall ecc = new ExplicitConstructorCall(recFlag);
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            this.expressionPtr -= length;
            System.arraycopy(this.expressionStack, this.expressionPtr + 1, ecc.arguments = new Expression[length], 0,
                length);
        }
        switch (flag) {
            case 0:
                ecc.sourceStart = startPosition;
                break;

            case 1:
                this.expressionLengthPtr--;
                ecc.sourceStart = (ecc.qualification = this.expressionStack[this.expressionPtr--]).sourceStart;
                break;

            case 2:
                ecc.sourceStart = (ecc.qualification = getUnspecifiedReferenceOptimized()).sourceStart;
                break;
        }
        pushOnAstStack(ecc);
        ecc.sourceEnd = this.endStatementPosition;
    }

    protected void consumeExplicitConstructorInvocationWithTypeArguments(int flag, int recFlag) {

        /*
         * flag allows to distinguish 3 cases : (0) : ExplicitConstructorInvocation ::= TypeArguments 'this' '('
         * ArgumentListopt ')' ';' ExplicitConstructorInvocation ::= TypeArguments 'super' '(' ArgumentListopt ')' ';'
         * (1) : ExplicitConstructorInvocation ::= Primary '.' TypeArguments 'super' '(' ArgumentListopt ')' ';'
         * ExplicitConstructorInvocation ::= Primary '.' TypeArguments 'this' '(' ArgumentListopt ')' ';' (2) :
         * ExplicitConstructorInvocation ::= Name '.' TypeArguments 'super' '(' ArgumentListopt ')' ';'
         * ExplicitConstructorInvocation ::= Name '.' TypeArguments 'this' '(' ArgumentListopt ')' ';'
         */
        int startPosition = this.intStack[this.intPtr--];
        ExplicitConstructorCall ecc = new ExplicitConstructorCall(recFlag);
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            this.expressionPtr -= length;
            System.arraycopy(this.expressionStack, this.expressionPtr + 1, ecc.arguments = new Expression[length], 0,
                length);
        }
        length = this.genericsLengthStack[this.genericsLengthPtr--];
        this.genericsPtr -= length;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1, ecc.typeArguments = new TypeReference[length], 0,
            length);
        ecc.typeArgumentsSourceStart = this.intStack[this.intPtr--];

        switch (flag) {
            case 0:
                ecc.sourceStart = startPosition;
                break;

            case 1:
                this.expressionLengthPtr--;
                ecc.sourceStart = (ecc.qualification = this.expressionStack[this.expressionPtr--]).sourceStart;
                break;

            case 2:
                ecc.sourceStart = (ecc.qualification = getUnspecifiedReferenceOptimized()).sourceStart;
                break;
        }

        pushOnAstStack(ecc);
        ecc.sourceEnd = this.endStatementPosition;
    }

    protected void consumeExpressionStatement() {
        // ExpressionStatement ::= StatementExpression ';'
        this.expressionLengthPtr--;
        Expression expression = this.expressionStack[this.expressionPtr--];
        expression.statementEnd = this.endStatementPosition;
        expression.bits |= 1048576;
        pushOnAstStack(expression);
    }

    protected void consumeFieldAccess(boolean isSuperAccess) {
        // FieldAccess ::= Primary '.' 'Identifier'
        // FieldAccess ::= 'super' '.' 'Identifier'

        FieldReference fr = new FieldReference(this.identifierStack[this.identifierPtr],
            this.identifierPositionStack[this.identifierPtr--]);
        this.identifierLengthPtr--;
        if (isSuperAccess) {
            // considers the fieldReference beginning at the 'super' ....
            fr.sourceStart = this.intStack[this.intPtr--];
            fr.receiver = new SuperReference(fr.sourceStart, this.endPosition);
            pushOnExpressionStack(fr);
        } else {
            // optimize push/pop
            fr.receiver = this.expressionStack[this.expressionPtr];
            // field reference begins at the receiver
            fr.sourceStart = fr.receiver.sourceStart;
            this.expressionStack[this.expressionPtr] = fr;
        }
    }

    protected void consumeFieldDeclaration() {
        // See consumeLocalVariableDeclarationDefaultModifier() in case of change: duplicated code
        // FieldDeclaration ::= Modifiersopt Type VariableDeclarators ';'

        /*
         * this.astStack : this.expressionStack: Expression Expression ...... Expression this.identifierStack : type
         * identifier identifier ...... identifier this.intStack : typeDim dim dim dim ==> this.astStack :
         * FieldDeclaration FieldDeclaration ...... FieldDeclaration this.expressionStack : this.identifierStack :
         * this.intStack :
         *
         */
        int variableDeclaratorsCounter = this.astLengthStack[this.astLengthPtr];

        for (int i = variableDeclaratorsCounter - 1; i >= 0; i--) {
            FieldDeclaration fieldDeclaration = (FieldDeclaration) this.astStack[this.astPtr - i];
            fieldDeclaration.declarationSourceEnd = this.endStatementPosition;
            fieldDeclaration.declarationEnd = this.endStatementPosition;	// semi-colon included
        }

        updateSourceDeclarationParts(variableDeclaratorsCounter);
        int endPos = flushCommentsDefinedPriorTo(this.endStatementPosition);
        if (endPos != this.endStatementPosition) {
            for (int i = 0; i < variableDeclaratorsCounter; i++) {
                FieldDeclaration fieldDeclaration = (FieldDeclaration) this.astStack[this.astPtr - i];
                fieldDeclaration.declarationSourceEnd = endPos;
            }
        }
        // update the this.astStack, this.astPtr and this.astLengthStack
        int startIndex = this.astPtr - this.variablesCounter[this.nestedType] + 1;
        System.arraycopy(this.astStack, startIndex, this.astStack, startIndex - 1, variableDeclaratorsCounter);
        this.astPtr--; // remove the type reference
        this.astLengthStack[--this.astLengthPtr] = variableDeclaratorsCounter;

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = endPos + 1;
            if (this.currentElement.parent != null && this.currentElement instanceof RecoveredField) {
                if (!(this.currentElement instanceof RecoveredInitializer)) {
                    this.currentElement = this.currentElement.parent;
                }
            }
            this.restartRecovery = true;
        }
        this.variablesCounter[this.nestedType] = 0;
    }

    protected void consumeForceNoDiet() {
        // ForceNoDiet ::= $empty
        this.dietInt++;
    }

    protected void consumeForInit() {
        // ForInit ::= StatementExpressionList
        pushOnAstLengthStack(-1);
        this.forStartPosition = 0;
    }

// Common consumer for formal parameters and record components both of which use single variable declarator syntax (as opposed to say fields)
    protected void consumeSingleVariableDeclarator(boolean isVarArgs) {
        // SingleVariableDeclarator ::= Modifiersopt Type VariableDeclaratorIdOrThis
        // SingleVariableDeclarator ::= Modifiersopt Type PushZeroTypeAnnotations '...' VariableDeclaratorIdOrThis
        // SingleVariableDeclarator ::= Modifiersopt Type @308... TypeAnnotations '...' VariableDeclaratorIdOrThis
        /*
         * this.astStack : this.identifierStack : type identifier this.intStack : dim dim 1||0 // 1 => normal parameter,
         * 0 => this parameter this.parsingRecordComponents : true or false; ==> this.astStack : Single variable
         * (Argument or RecordComponent) this.identifierStack : this.intStack : this.parsingRecordComponents: unchanged
         */
        NameReference qualifyingNameReference = null;
        boolean isReceiver = this.intStack[this.intPtr--] == 0;  // flag pushed in consumeExplicitThisParameter -> 0,
                                                                 // consumeVariableDeclaratorIdParameter -> 1
        if (isReceiver) {
            qualifyingNameReference = (NameReference) this.expressionStack[this.expressionPtr--];
            this.expressionLengthPtr--;
        }
        this.identifierLengthPtr--;
        char[] identifierName = this.identifierStack[this.identifierPtr];
        long namePositions = this.identifierPositionStack[this.identifierPtr--];
        int extendedDimensions = this.intStack[this.intPtr--];
        Annotation[][] annotationsOnExtendedDimensions
            = extendedDimensions == 0 ? null : getAnnotationsOnDimensions(extendedDimensions);
        Annotation[] varArgsAnnotations = null;
        int endOfEllipsis = 0;
        int length;
        if (isVarArgs) {
            endOfEllipsis = this.intStack[this.intPtr--];
            if ((length = this.typeAnnotationLengthStack[this.typeAnnotationLengthPtr--]) != 0) {
                System.arraycopy(this.typeAnnotationStack, (this.typeAnnotationPtr -= length) + 1,
                    varArgsAnnotations = new Annotation[length], 0, length);
            }
        }
        int firstDimensions = this.intStack[this.intPtr--];
        TypeReference type = getTypeReference(firstDimensions);
        if (isVarArgs || extendedDimensions != 0) {
            if (isVarArgs) {
                type = augmentTypeWithAdditionalDimensions(type, 1,
                    varArgsAnnotations != null ? new Annotation[][] { varArgsAnnotations } : null, true);
            }
            if (extendedDimensions != 0) {
                type = augmentTypeWithAdditionalDimensions(type, extendedDimensions, annotationsOnExtendedDimensions,
                    false);
            }
            type.sourceEnd = type.isParameterizedTypeReference() ? this.endStatementPosition : this.endPosition;
        }
        if (isVarArgs) {
            if (extendedDimensions == 0) {
                type.sourceEnd = endOfEllipsis;
            }
            type.bits |= 16384; // set isVarArgs
        }
        int modifierPositions = this.intStack[this.intPtr--];
        AbstractVariableDeclaration singleVariable;
        if (this.parsingRecordComponents) {
            singleVariable
                = createComponent(identifierName, namePositions, type, this.intStack[this.intPtr--] & ~1048576);
        } else {
            if (isReceiver) {
                singleVariable = new Receiver(identifierName, namePositions, type, qualifyingNameReference,
                    this.intStack[this.intPtr--] & ~1048576);
            } else {
                singleVariable
                    = new Argument(identifierName, namePositions, type, this.intStack[this.intPtr--] & ~1048576); // modifiers
            }
        }
        singleVariable.declarationSourceStart = modifierPositions;
        singleVariable.bits |= (type.bits & 1048576);
        // consume annotations
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                singleVariable.annotations = new Annotation[length], 0, length);
            singleVariable.bits |= 1048576;
            RecoveredType currentRecoveryType = this.currentRecoveryType();
            if (currentRecoveryType != null)
                currentRecoveryType.annotationsConsumed(singleVariable.annotations);
        }
        pushOnAstStack(singleVariable);

        /*
         * if incomplete method header, this.listLength counter will not have been reset, indicating that some arguments
         * are available on the stack
         */
        this.listLength++;

        if (isVarArgs) {
            if (!this.statementRecoveryActivated && extendedDimensions > 0) {
                problemReporter().illegalExtendedDimensions(singleVariable);
            }
        } else if (this.parsingRecordComponents) {
            if (!this.statementRecoveryActivated && extendedDimensions > 0)
                problemReporter().illegalExtendedDimensionsForRecordComponent(singleVariable);
        }
    }

    protected Annotation[][] getAnnotationsOnDimensions(int dimensionsCount) {
        Annotation[][] dimensionsAnnotations = null;
        if (dimensionsCount > 0) {
            for (int i = 0; i < dimensionsCount; i++) {
                Annotation[] annotations;
                int length;
                if ((length = this.typeAnnotationLengthStack[this.typeAnnotationLengthPtr--]) != 0) {
                    System.arraycopy(this.typeAnnotationStack, (this.typeAnnotationPtr -= length) + 1,
                        annotations = new Annotation[length], 0, length);
                    if (dimensionsAnnotations == null) {
                        dimensionsAnnotations = new Annotation[dimensionsCount][];
                    }
                    dimensionsAnnotations[dimensionsCount - i - 1] = annotations;
                }
            }
        }
        return dimensionsAnnotations;
    }

    protected void consumeSingleVariableDeclaratorList() {
        // SingleVariableDeclaratorList ::= SingleVariableDeclaratorList ',' SingleVariableDeclarator
        // TypeElidedFormalParameterList ::= TypeElidedFormalParameterList ',' TypeElidedFormalParameter
        optimizedConcatNodeLists();
    }

    protected void consumeFormalParameterListopt() {
        // FormalParameterListopt ::= $empty
        pushOnAstLengthStack(0);
    }

    protected void consumeGenericTypeWithDiamond() {
        // GenericType ::= ClassOrInterface '<' '>'
        // zero type arguments == <>
        pushOnGenericsLengthStack(-1);
        concatGenericsLists();
        this.intPtr--;	// pop the null dimension pushed in by consumeReferenceType, as we have no type between <>,
                          // getTypeReference won't kick in
    }

    protected void consumeImportDeclaration() {
        // SingleTypeImportDeclaration ::= SingleTypeImportDeclarationName ';'
        ImportReference impt = (ImportReference) this.astStack[this.astPtr];
        // flush annotations defined prior to import statements
        impt.declarationEnd = this.endStatementPosition;
        impt.declarationSourceEnd = flushCommentsDefinedPriorTo(impt.declarationSourceEnd);

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = impt.declarationSourceEnd + 1;
            this.currentElement = this.currentElement.add(impt, 0);
            this.lastIgnoredToken = TokenNameInvalid;
            this.restartRecovery = true;
            // used to avoid branching back into the regular automaton
        }
    }

    protected void consumeImportDeclarations() {
        // ImportDeclarations ::= ImportDeclarations ImportDeclaration
        optimizedConcatNodeLists();
    }

    protected void consumeInsideCastExpressionLL1() {
        // InsideCastExpressionLL1 ::= $empty
        pushOnGenericsLengthStack(0); // handle type arguments
        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
        pushOnExpressionStack(getTypeReference(0));
    }

    protected void consumeInsideCastExpressionLL1WithBounds() {
        // InsideCastExpressionLL1WithBounds ::= $empty
        int additionalBoundsLength = this.genericsLengthStack[this.genericsLengthPtr--];
        TypeReference[] bounds = new TypeReference[additionalBoundsLength + 1];
        this.genericsPtr -= additionalBoundsLength;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1, bounds, 1, additionalBoundsLength);

        pushOnGenericsLengthStack(0); // handle type arguments
        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
        bounds[0] = getTypeReference(0);

        for (int i = 0; i <= additionalBoundsLength; i++) {
            pushOnExpressionStack(bounds[i]);
            if (i > 0)
                this.expressionLengthStack[--this.expressionLengthPtr]++;
        }
    }

    protected void consumeInstanceOfExpression() {
        int length = this.astLengthStack[this.astLengthPtr--];
        Expression exp;
        // consume annotations
        if (length > 0) {
            Pattern pattern = (Pattern) this.astStack[this.astPtr--];
            exp = consumePatternInsideInstanceof(pattern);
        } else {
            TypeReference typeRef = (TypeReference) this.expressionStack[this.expressionPtr--];
            this.expressionLengthPtr--;
            this.expressionStack[this.expressionPtr]
                = exp = new InstanceOfExpression(this.expressionStack[this.expressionPtr], typeRef);
            int anyModifiersourceStart = this.intStack[this.intPtr--];
            int anyModifiers = this.intStack[this.intPtr--];
            if (anyModifiers != 0) {
                problemReporter().illegalModifiers(anyModifiersourceStart, typeRef.sourceEnd);
            }
        }

        if (exp.sourceEnd == 0) {
            // array on base type....
            exp.sourceEnd = this.scanner.startPosition - 1;
        }
    }

    protected Expression consumePatternInsideInstanceof(Pattern pattern) {
        return this.expressionStack[this.expressionPtr]
            = new InstanceOfExpression(this.expressionStack[this.expressionPtr], pattern);
    }

    protected void consumeTypeReferenceWithModifiersAndAnnotations() {
        // RelationalExpression ::= RelationalExpression 'instanceof' ReferenceType
        // optimize the push/pop

        int length;
        Annotation[] typeAnnotations = null;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                typeAnnotations = new Annotation[length], 0, length);
        }

        TypeReference ref = getTypeReference(this.intStack[this.intPtr--]);
        if (typeAnnotations != null) {
            int levels = ref.getAnnotatableLevels();
            if (ref.annotations == null)
                ref.annotations = new Annotation[levels][];
            ref.annotations[0] = typeAnnotations;
            ref.sourceStart = ref.annotations[0][0].sourceStart;
            ref.bits |= 1048576;
        }
        pushOnExpressionStack(ref);
        // by construction, no base type may be used in getTypeReference
//	exp.declarationSourceStart = this.intStack[this.intPtr--];
//	exp.modifiers = this.intStack[this.intPtr--];
        // the scanner is on the next token already....
    }

    protected void consumeInstanceOfClassic() {
        consumeTypeReferenceWithModifiersAndAnnotations();
        pushOnAstLengthStack(0); // signal no pattern
    }

    protected void consumeInstanceofPattern() {
        // Only if we are not inside a block
        if (this.realBlockPtr != -1)
            blockReal();
    }

    protected void consumeInstanceOfExpressionWithName() {
        // RelationalExpression_NotName ::= Name instanceof ReferenceType
        // optimize the push/pop

        int length = this.astLengthStack[this.astLengthPtr--];
        Expression exp;
        if (length != 0) {
            Pattern pattern = (Pattern) this.astStack[this.astPtr--];
            pushOnExpressionStack(getUnspecifiedReferenceOptimized());
            exp = consumePatternInsideInstanceof(pattern);
        } else {
            // by construction, no base type may be used in getTypeReference
            TypeReference typeRef = (TypeReference) this.expressionStack[this.expressionPtr--];
            this.expressionLengthPtr--;
            pushOnExpressionStack(getUnspecifiedReferenceOptimized());
            this.expressionStack[this.expressionPtr]
                = exp = new InstanceOfExpression(this.expressionStack[this.expressionPtr], typeRef);
            this.intPtr--; // skip modifierSourceStart
            this.intPtr--; // lose the fake modifier if any
        }
        if (exp.sourceEnd == 0) {
            // array on base type....
            exp.sourceEnd = this.scanner.startPosition - 1;
        }
    }

    protected void consumeInterfaceDeclaration() {
        // see consumeClassDeclaration in case of changes: duplicated code
        // InterfaceDeclaration ::= InterfaceHeader InterfaceBody
        int length;
        if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            // there are length declarations
            // dispatch.....according to the type of the declarations
            dispatchDeclarationInto(length);
        }

        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];

        // convert constructor that do not have the type's name into methods
        typeDecl.checkConstructors(this);

        // https://bugs.eclipse.org/bugs/show_bug.cgi?id=212713,
        // reject initializers that have been tolerated by the grammar.
        FieldDeclaration[] fields = typeDecl.fields;
        int fieldCount = fields == null ? 0 : fields.length;
        for (int i = 0; i < fieldCount; i++) {
            FieldDeclaration field = fields[i];
            if (field instanceof Initializer) {
                problemReporter().interfaceCannotHaveInitializers(typeDecl.name, field);
            }
        }

        // always add <clinit> (will be remove at code gen time if empty)
        if (this.scanner.containsAssertKeyword) {
            typeDecl.bits |= 1;
        }
        typeDecl.addClinit();
        typeDecl.bodyEnd = this.endStatementPosition;
        if (length == 0 && !containsComment(typeDecl.bodyStart, typeDecl.bodyEnd)) {
            typeDecl.bits |= 8;
        }
        typeDecl.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);
    }

    protected void consumeInterfaceHeader() {
        // InterfaceHeader ::= InterfaceHeaderName InterfaceHeaderExtendsopt

        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];
        if (this.currentToken == TokenNameLBRACE) {
            typeDecl.bodyStart = this.scanner.currentPosition;
        }
        if (this.currentElement != null) {
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
        // flush the comments related to the interface header
        this.scanner.commentPtr = -1;
    }

    protected void consumeInterfaceHeaderExtends() {
        // InterfaceHeaderExtends ::= 'extends' InterfaceTypeList
        int length = this.astLengthStack[this.astLengthPtr--];
        // super interfaces
        this.astPtr -= length;
        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];
        System.arraycopy(this.astStack, this.astPtr + 1, typeDecl.superInterfaces = new TypeReference[length], 0,
            length);
        TypeReference[] superinterfaces = typeDecl.superInterfaces;
        for (TypeReference superinterface : superinterfaces) {
            typeDecl.bits |= (superinterface.bits & 1048576);
        }
        typeDecl.bodyStart = typeDecl.superInterfaces[length - 1].sourceEnd + 1;
        this.listLength = 0; // reset after having read super-interfaces
        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = typeDecl.bodyStart;
        }
    }

    protected void consumeInterfaceHeaderName1() {
        // InterfaceHeaderName ::= Modifiersopt 'interface' 'Identifier'
        TypeDeclaration typeDecl = new TypeDeclaration(this.compilationUnit.compilationResult);

        if (this.nestedMethod[this.nestedType] == 0) {
            if (this.nestedType != 0) {
                typeDecl.bits |= 1024;
            }
        } else {
            // Record that the block has a declaration for local types
            typeDecl.bits |= 256;
            markEnclosingMemberWithLocalType();
            blockReal();
        }

        // highlight the name of the type
        long pos = this.identifierPositionStack[this.identifierPtr];
        typeDecl.sourceEnd = (int) pos;
        typeDecl.sourceStart = (int) (pos >>> 32);
        typeDecl.name = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        // compute the declaration source too
        // 'class' and 'interface' push two int positions: the beginning of the class token and its end.
        // we want to keep the beginning position but get rid of the end position
        // it is only used for the ClassLiteralAccess positions.
        typeDecl.declarationSourceStart = this.intStack[this.intPtr--];
        this.intPtr--; // remove the end position of the class token
        typeDecl.modifiersSourceStart = this.intStack[this.intPtr--];
        typeDecl.modifiers = this.intStack[this.intPtr--] | 512;
        if (typeDecl.modifiersSourceStart >= 0) {
            typeDecl.declarationSourceStart = typeDecl.modifiersSourceStart;
        }

        // Store secondary info
        if ((typeDecl.bits & 1024) == 0 && (typeDecl.bits & 256) == 0) {
            if (this.compilationUnit != null
                && !CharOperation.equals(typeDecl.name, this.compilationUnit.getMainTypeName())) {
                typeDecl.bits |= 4096;
            }
        }

        // consume annotations
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                typeDecl.annotations = new Annotation[length], 0, length);
        }
        typeDecl.bodyStart = typeDecl.sourceEnd + 1;
        pushOnAstStack(typeDecl);
        this.listLength = 0; // will be updated when reading super-interfaces
        // recovery
        if (this.currentElement != null) { // is recovering
            this.lastCheckPoint = typeDecl.bodyStart;
            this.currentElement = this.currentElement.add(typeDecl, 0);
            this.lastIgnoredToken = TokenNameInvalid;
        }
        // javadoc
        typeDecl.javadoc = this.javadoc;
        this.javadoc = null;
    }

    protected void consumePermittedTypes() {
        int length = this.astLengthStack[this.astLengthPtr--];
        this.astPtr -= length;
        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];
        typeDecl.restrictedIdentifierStart = this.intStack[this.intPtr--];
        System.arraycopy(this.astStack, this.astPtr + 1, typeDecl.permittedTypes = new TypeReference[length], 0,
            length);
        for (TypeReference typeReference : typeDecl.permittedTypes) {
            rejectIllegalTypeAnnotations(typeReference);
        }
        typeDecl.bodyStart = typeDecl.permittedTypes[length - 1].sourceEnd + 1;
        this.listLength = 0; // reset after having read permitted types.
        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = typeDecl.bodyStart;
        }
    }

    protected void consumeInterfaceMemberDeclarations() {
        // InterfaceMemberDeclarations ::= InterfaceMemberDeclarations InterfaceMemberDeclaration
        concatNodeLists();
    }

    protected void consumeInterfaceMemberDeclarationsopt() {
        // InterfaceMemberDeclarationsopt ::= NestedType InterfaceMemberDeclarations
        this.nestedType--;
    }

    protected void consumeInterfaceType() {
        // InterfaceType ::= ClassOrInterfaceType
        pushOnAstStack(getTypeReference(0));
        /*
         * if incomplete type header, this.listLength counter will not have been reset, indicating that some interfaces
         * are available on the stack
         */
        this.listLength++;
    }

    protected void consumeInterfaceTypeList() {
        // InterfaceTypeList ::= InterfaceTypeList ',' InterfaceType
        optimizedConcatNodeLists();
    }

    protected void consumeInternalCompilationUnit() {
        // InternalCompilationUnit ::= PackageDeclaration
        // InternalCompilationUnit ::= PackageDeclaration ImportDeclarations ReduceImports
        // InternalCompilationUnit ::= ImportDeclarations ReduceImports
        if (this.compilationUnit.isPackageInfo()) {
            this.compilationUnit.types = new TypeDeclaration[1];
            this.compilationUnit.createPackageInfoType();
        }
    }

    protected void consumeImplicitlyDeclaredClassBodyDeclarations() {
        concatNodeLists();
    }

    protected void consumeInternalCompilationUnitWithPotentialImplicitlyDeclaredClass() {
        int length;
        if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            LinkedList<AbstractMethodDeclaration> methods = new LinkedList<>();
            LinkedList<FieldDeclaration> fields = new LinkedList<>();
            LinkedList<TypeDeclaration> types = new LinkedList<>();
            int sourceStart = Integer.MAX_VALUE;
            // here are length declarations
            for (int i = length - 1; i >= 0; i--) {
                ASTNode astNode = this.astStack[this.astPtr--];
                if (astNode instanceof MethodDeclaration method) {
                    if (method.declarationSourceStart < sourceStart) {
                        sourceStart = method.declarationSourceStart;
                    }
                    // methods and constructors have been regrouped into one single list
                    methods.addFirst(method);
                } else if (astNode instanceof TypeDeclaration type) {
                    if (type.declarationSourceStart < sourceStart) {
                        sourceStart = type.declarationSourceStart;
                    }
                    types.addFirst(type);
                } else if (astNode instanceof FieldDeclaration field) {
                    if (field.declarationSourceStart < sourceStart) {
                        sourceStart = field.declarationSourceStart;
                    }
                    fields.addFirst(field);
                }
            }
            if (!methods.isEmpty() || !fields.isEmpty()) {
                problemReporter().validateJavaFeatureSupport(JavaFeature.COMPACT_SOURCE_AND_INSTANCE_MAIN_METHODS, 0,
                    0);
                ImplicitTypeDeclaration implicitClass
                    = new ImplicitTypeDeclaration(this.compilationUnit.compilationResult);
                implicitClass.methods = methods.toArray(AbstractMethodDeclaration[]::new);
                implicitClass.createDefaultConstructor(false);
                implicitClass.fields = fields.toArray(FieldDeclaration[]::new);
                implicitClass.memberTypes = types.toArray(TypeDeclaration[]::new);

                implicitClass.declarationSourceStart = sourceStart;
                implicitClass.declarationSourceEnd = this.scanner.eofPosition - 1;
                implicitClass.bodyStart = sourceStart;
                implicitClass.bodyEnd = this.scanner.eofPosition - 1;
                implicitClass.sourceStart = sourceStart;
                implicitClass.sourceEnd = this.scanner.eofPosition - 1;
                this.compilationUnit.types = new TypeDeclaration[] { implicitClass };
                implicitClass.addClinit();
            } else if (types.size() > 0) {
                // add types to compilation unit
                this.compilationUnit.types = types.toArray(TypeDeclaration[]::new);
            } else {
                // empty compilation unit
            }
        }
    }

    protected void consumeInternalCompilationUnitWithTypes() {
        // InternalCompilationUnit ::= PackageDeclaration ImportDeclarations ReduceImports TypeDeclarations
        // InternalCompilationUnit ::= PackageDeclaration TypeDeclarations
        // InternalCompilationUnit ::= TypeDeclarations
        // InternalCompilationUnit ::= ImportDeclarations ReduceImports TypeDeclarations
        // consume type declarations
        int length;
        if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            if (this.compilationUnit.isPackageInfo()) {
                this.compilationUnit.types = new TypeDeclaration[length + 1];
                this.astPtr -= length;
                System.arraycopy(this.astStack, this.astPtr + 1, this.compilationUnit.types, 1, length);
                this.compilationUnit.createPackageInfoType();
            } else {
                this.compilationUnit.types = new TypeDeclaration[length];
                this.astPtr -= length;
                System.arraycopy(this.astStack, this.astPtr + 1, this.compilationUnit.types, 0, length);
            }
        }
    }

    protected void consumeInvalidAnnotationTypeDeclaration() {
        // BlockStatement ::= AnnotationTypeDeclaration
        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];
        if (!this.statementRecoveryActivated)
            problemReporter().illegalLocalTypeDeclaration(typeDecl);
        // remove the ast node created in interface header
        this.astPtr--;
        pushOnAstLengthStack(-1);
        concatNodeLists();
    }

    protected void consumeInvalidConstructorDeclaration() {
        // ConstructorDeclaration ::= ConstructorHeader ';'
        // now we know that the top of stack is a constructorDeclaration
        ConstructorDeclaration cd = (ConstructorDeclaration) this.astStack[this.astPtr];

        cd.bodyEnd = this.endPosition; // position just before the trailing semi-colon
        cd.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);
        // report the problem and continue the parsing - narrowing the problem onto the method

        cd.modifiers |= 16777216; // remember semi-colon body
    }

    protected void consumeInvalidConstructorDeclaration(boolean hasBody) {
        // InvalidConstructorDeclaration ::= ConstructorHeader ConstructorBody ==> true
        // InvalidConstructorDeclaration ::= ConstructorHeader ';' ==> false

        /*
         * this.astStack : modifiers arguments throws statements this.identifierStack : name ==> this.astStack :
         * MethodDeclaration this.identifierStack :
         */
        if (hasBody) {
            // pop the position of the { (body of the method) pushed in block decl
            this.intPtr--;
        }

        // statements
        if (hasBody) {
            this.realBlockPtr--;
        }

        int length;
        if (hasBody && ((length = this.astLengthStack[this.astLengthPtr--]) != 0)) {
            this.astPtr -= length;
        }
        ConstructorDeclaration constructorDeclaration = (ConstructorDeclaration) this.astStack[this.astPtr];
        constructorDeclaration.bodyEnd = this.endStatementPosition;
        constructorDeclaration.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);
        if (!hasBody) {
            constructorDeclaration.modifiers |= 16777216;
        }
    }

    protected void consumeInvalidEnumDeclaration() {
        // BlockStatement ::= EnumDeclaration
        if (this.options.sourceLevel >= 3932160L)
            return; // local enum classes allowed from 16 onwards.
        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];
        if (!this.statementRecoveryActivated)
            problemReporter().illegalLocalTypeDeclaration(typeDecl);
        // remove the ast node created in interface header
        this.astPtr--;
        pushOnAstLengthStack(-1);
        concatNodeLists();
    }

    protected void consumeInvalidInterfaceDeclaration() {
        // BlockStatement ::= InvalidInterfaceDeclaration
        // InterfaceDeclaration ::= Modifiersopt 'interface' 'Identifier' ExtendsInterfacesopt InterfaceHeader
        // InterfaceBody
        if (this.options.sourceLevel >= 3932160L)
            return; // local interfaces allowed from 16 onwards.
        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];
        if (!this.statementRecoveryActivated)
            problemReporter().illegalLocalTypeDeclaration(typeDecl);
        // remove the ast node created in interface header
        this.astPtr--;
        pushOnAstLengthStack(-1);
        concatNodeLists();
    }

    protected void consumeInterfaceMethodDeclaration(boolean hasSemicolonBody) {
        // InterfaceMemberDeclaration ::= DefaultMethodHeader MethodBody
        // InterfaceMemberDeclaration ::= MethodHeader MethodBody
        // -- the next rule is illegal but allows to give a more canonical error message from inside
        // consumeInterfaceMethodDeclaration():
        // InterfaceMemberDeclaration ::= DefaultMethodHeader ';'

        /*
         * this.astStack : modifiers arguments throws statements this.identifierStack : type name this.intStack : dim
         * dim dim ==> this.astStack : MethodDeclaration this.identifierStack : this.intStack :
         */

        int explicitDeclarations = 0;
        Statement[] statements = null;
        if (!hasSemicolonBody) {
            // pop the position of the { (body of the method) pushed in block decl
            this.intPtr--;
            this.intPtr--;

            explicitDeclarations = this.realBlockStack[this.realBlockPtr--];

            // statements
            int length;
            if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
                if (this.options.ignoreMethodBodies) {
                    this.astPtr -= length;
                } else {
                    System.arraycopy(this.astStack, (this.astPtr -= length) + 1, statements = new Statement[length], 0,
                        length);
                }
            }
        }

        // watch for } that could be given as a unicode ! ( u007D is '}' )
        MethodDeclaration md = (MethodDeclaration) this.astStack[this.astPtr];
        md.statements = statements;
        md.explicitDeclarations = explicitDeclarations;
        md.bodyEnd = this.endPosition;
        md.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);

        boolean isDefault = (md.modifiers & 65536) != 0;
        boolean isStatic = (md.modifiers & 8) != 0;
        boolean isPrivate = (md.modifiers & 2) != 0;
        boolean bodyAllowed = (isParsingJava9Plus() && isPrivate) || isDefault || isStatic;
        if (bodyAllowed && hasSemicolonBody) {
            md.modifiers |= 16777216; // avoid complaints regarding undocumented empty
                                      // body
        }
        if (!bodyAllowed && !this.statementRecoveryActivated && !hasSemicolonBody) {
            problemReporter().abstractMethodNeedingNoBody(md);
        }
    }

    protected void consumeLeftParen() {
        // PushLPAREN ::= '('
        pushOnIntStack(this.lParenPos);
    }

    protected void consumeLocalVariableDeclaration() {
        // LocalVariableDeclaration ::= Modifiers Type VariableDeclarators ';'

        /*
         * this.astStack : this.expressionStack: Expression Expression ...... Expression this.identifierStack : type
         * identifier identifier ...... identifier this.intStack : typeDim dim dim dim ==> this.astStack :
         * FieldDeclaration FieldDeclaration ...... FieldDeclaration this.expressionStack : this.identifierStack :
         * this.intStack :
         *
         */
        int variableDeclaratorsCounter = this.astLengthStack[this.astLengthPtr];

        // update the this.astStack, this.astPtr and this.astLengthStack
        int startIndex = this.astPtr - this.variablesCounter[this.nestedType] + 1;
        System.arraycopy(this.astStack, startIndex, this.astStack, startIndex - 1, variableDeclaratorsCounter);
        this.astPtr--; // remove the type reference
        this.astLengthStack[--this.astLengthPtr] = variableDeclaratorsCounter;
        this.variablesCounter[this.nestedType] = 0;
        this.forStartPosition = 0;
    }

    protected void consumeLocalVariableDeclarationStatement() {
        int variableDeclaratorsCounter = this.astLengthStack[this.astLengthPtr];
        if (variableDeclaratorsCounter == 1) {
            LocalDeclaration localDeclaration = (LocalDeclaration) this.astStack[this.astPtr];
            if (localDeclaration.isRecoveredFromLoneIdentifier()) {
                // https://bugs.eclipse.org/bugs/show_bug.cgi?id=430336, [1.8][compiler] Bad syntax error recovery:
                // Lonely identifier should be variable name, not type
                // Mutate foo $missing; into foo = $missing$;
                Expression left;
                if (localDeclaration.type instanceof QualifiedTypeReference qtr) {
                    left = new QualifiedNameReference(qtr.tokens, qtr.sourcePositions, 0, 0);
                } else {
                    left = new SingleNameReference(localDeclaration.type.getLastToken(), 0L);
                }
                left.sourceStart = localDeclaration.type.sourceStart;
                left.sourceEnd = localDeclaration.type.sourceEnd;

                Expression right = new SingleNameReference(localDeclaration.name, 0L);
                right.sourceStart = localDeclaration.sourceStart;
                right.sourceEnd = localDeclaration.sourceEnd;

                Assignment assignment = new Assignment(left, right, 0);
                int end = this.endStatementPosition;
                assignment.sourceEnd = (end == localDeclaration.sourceEnd) ? ++end : end;
                assignment.statementEnd = end;
                this.astStack[this.astPtr] = assignment;

                // also massage recovery scanner data.
                if (this.recoveryScanner != null) {
                    RecoveryScannerData data = this.recoveryScanner.getData();
                    int position = data.insertedTokensPtr;
                    while (position > 0) {
                        if (data.insertedTokensPosition[position] != data.insertedTokensPosition[position - 1])
                            break;
                        position--;
                    }
                    if (position >= 0)
                        this.recoveryScanner.insertTokenAhead(position);
                }

                if (this.currentElement != null) {
                    this.lastCheckPoint = assignment.sourceEnd + 1;
                    this.currentElement = this.currentElement.add(assignment, 0);
                }
                return;
            }
        }
        // LocalVariableDeclarationStatement ::= LocalVariableDeclaration ';'
        // see blockReal in case of change: duplicated code
        // increment the amount of declared variables for this block
        this.realBlockStack[this.realBlockPtr]++;

        // update source end to include the semi-colon
        for (int i = variableDeclaratorsCounter - 1; i >= 0; i--) {
            LocalDeclaration localDeclaration = (LocalDeclaration) this.astStack[this.astPtr - i];
            localDeclaration.declarationSourceEnd = this.endStatementPosition;
            localDeclaration.declarationEnd = this.endStatementPosition;	// semi-colon included
        }
    }

    protected void consumeMarkerAnnotation(boolean isTypeAnnotation) {
        // MarkerAnnotation ::= AnnotationName
        // MarkerTypeAnnotation ::= TypeAnnotationName
        MarkerAnnotation markerAnnotation;

        int oldIndex = this.identifierPtr;

        TypeReference typeReference = getAnnotationType();
        markerAnnotation = new MarkerAnnotation(typeReference, this.intStack[this.intPtr--]);
        markerAnnotation.declarationSourceEnd = markerAnnotation.sourceEnd;
        if (isTypeAnnotation) {
            pushOnTypeAnnotationStack(markerAnnotation);
        } else {
            pushOnExpressionStack(markerAnnotation);
        }
        this.recordStringLiterals = true;

        if (this.currentElement instanceof RecoveredAnnotation recoveredAnnotation) {
            this.currentElement = recoveredAnnotation.addAnnotation(markerAnnotation);
        }
    }

    protected void consumeMemberValueArrayInitializer() {
        // MemberValueArrayInitializer ::= '{' MemberValues ',' '}'
        // MemberValueArrayInitializer ::= '{' MemberValues '}'
        arrayInitializer(this.expressionLengthStack[this.expressionLengthPtr--]);
    }

    protected void consumeMemberValueAsName() {
        pushOnExpressionStack(getUnspecifiedReferenceOptimized());
    }

    protected void consumeMemberValuePair() {
        // MemberValuePair ::= SimpleName '=' MemberValue
        char[] simpleName = this.identifierStack[this.identifierPtr];
        long position = this.identifierPositionStack[this.identifierPtr--];
        this.identifierLengthPtr--;
        int end = (int) position;
        int start = (int) (position >>> 32);
        Expression value = this.expressionStack[this.expressionPtr--];
        this.expressionLengthPtr--;
        MemberValuePair memberValuePair = new MemberValuePair(simpleName, start, end, value);
        pushOnAstStack(memberValuePair);

        if (this.currentElement instanceof RecoveredAnnotation recoveredAnnotation) {
            recoveredAnnotation.setKind(1);
        }
    }

    protected void consumeMemberValuePairs() {
        // MemberValuePairs ::= MemberValuePairs ',' MemberValuePair
        concatNodeLists();
    }

    protected void consumeMemberValues() {
        // MemberValues ::= MemberValues ',' MemberValue
        concatExpressionLists();
    }

    protected void consumeMethodBody() {
        // MethodBody ::= NestedMethod '{' BlockStatementsopt '}'
        this.nestedMethod[this.nestedType]--;
    }

    protected void consumeMethodDeclaration(boolean isNotAbstract, boolean isDefaultMethod) {
        // MethodDeclaration ::= MethodHeader MethodBody
        // AbstractMethodDeclaration ::= MethodHeader ';'

        /*
         * this.astStack : modifiers arguments throws statements this.identifierStack : type name this.intStack : dim
         * dim dim ==> this.astStack : MethodDeclaration this.identifierStack : this.intStack :
         */

        int length;
        if (isNotAbstract) {
            // pop the position of the { (body of the method) pushed in block decl
            this.intPtr--;
            this.intPtr--;
        }

        int explicitDeclarations = 0;
        Statement[] statements = null;
        if (isNotAbstract) {
            // statements
            explicitDeclarations = this.realBlockStack[this.realBlockPtr--];
            if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
                if (this.options.ignoreMethodBodies) {
                    this.astPtr -= length;
                } else {
                    System.arraycopy(this.astStack, (this.astPtr -= length) + 1, statements = new Statement[length], 0,
                        length);
                }
            }
        }

        // now we know that we have a method declaration at the top of the ast stack
        MethodDeclaration md = (MethodDeclaration) this.astStack[this.astPtr];
        md.statements = statements;
        md.explicitDeclarations = explicitDeclarations;

        // cannot be done in consumeMethodHeader because we have no idea whether or not there
        // is a body when we reduce the method header
        if (!isNotAbstract) { // remember the fact that the method has a semicolon body
            md.modifiers |= 16777216;
        } else if (!(this.diet && this.dietInt == 0)
            && statements == null
            && !containsComment(md.bodyStart, this.endPosition)) {
            md.bits |= 8;
        }
        // store the this.endPosition (position just before the '}') in case there is
        // a trailing comment behind the end of the method
        md.bodyEnd = this.endPosition;
        md.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);
        if (isDefaultMethod && !this.tolerateDefaultClassMethods) {
            problemReporter().defaultModifierIllegallySpecified(md.sourceStart, md.sourceEnd);
        }
    }

    protected void consumeMethodHeader() {
        // MethodHeader ::= MethodHeaderName MethodHeaderParameters MethodHeaderExtendedDims ThrowsClauseopt
        // AnnotationMethodHeader ::= AnnotationMethodHeaderName FormalParameterListopt MethodHeaderRightParen
        // MethodHeaderExtendedDims AnnotationMethodHeaderDefaultValueopt
        // RecoveryMethodHeader ::= RecoveryMethodHeaderName FormalParameterListopt MethodHeaderRightParen
        // MethodHeaderExtendedDims AnnotationMethodHeaderDefaultValueopt
        // RecoveryMethodHeader ::= RecoveryMethodHeaderName FormalParameterListopt MethodHeaderRightParen
        // MethodHeaderExtendedDims MethodHeaderThrowsClause

        // retrieve end position of method declarator
        AbstractMethodDeclaration method = (AbstractMethodDeclaration) this.astStack[this.astPtr];

        if (this.currentToken == TokenNameLBRACE) {
            method.bodyStart = this.scanner.currentPosition;
        }
        // recovery
        if (this.currentElement != null) {
            if (this.currentToken == TokenNameSEMICOLON /* && !method.isAnnotationMethod() */) {
                method.modifiers |= 16777216;
                method.declarationSourceEnd = this.scanner.currentPosition - 1;
                method.bodyEnd = this.scanner.currentPosition - 1;
                if (this.currentElement.parseTree() == method && this.currentElement.parent != null) {
                    this.currentElement = this.currentElement.parent;
                }
            } else if (this.currentToken == TokenNameLBRACE) {
                if (this.currentElement instanceof RecoveredMethod recoveredMethod
                    && recoveredMethod.methodDeclaration != method) {
                    this.ignoreNextOpeningBrace = true;
                    this.currentElement.bracketBalance++;
                }
            }
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
    }

    protected void consumeMethodHeaderDefaultValue() {
        // MethodHeaderDefaultValue ::= DefaultValue
        MethodDeclaration md = (MethodDeclaration) this.astStack[this.astPtr];

        int length = this.expressionLengthStack[this.expressionLengthPtr--];
        if (length == 1) {
            this.intPtr--; // we get rid of the position of the default keyword
            this.intPtr--; // we get rid of the position of the default keyword
            if (md.isAnnotationMethod()) {
                ((AnnotationMethodDeclaration) md).defaultValue = this.expressionStack[this.expressionPtr];
                md.modifiers |= 131072;
            }
            this.expressionPtr--;
            this.recordStringLiterals = true;
        }

        if (this.currentElement != null) {
            if (md.isAnnotationMethod()) {
                this.currentElement
                    .updateSourceEndIfNecessary(((AnnotationMethodDeclaration) md).defaultValue.sourceEnd);
            }
        }
    }

    protected void consumeMethodHeaderExtendedDims() {
        // MethodHeaderExtendedDims ::= Dimsopt
        // now we update the returnType of the method
        MethodDeclaration md = (MethodDeclaration) this.astStack[this.astPtr];
        int extendedDimensions = this.intStack[this.intPtr--];
        if (md.isAnnotationMethod()) {

        }
        if (extendedDimensions != 0) {
            md.sourceEnd = this.endPosition;
            md.returnType = augmentTypeWithAdditionalDimensions(md.returnType, extendedDimensions,
                getAnnotationsOnDimensions(extendedDimensions), false);
            md.bits |= (md.returnType.bits & 1048576);
            if (this.currentToken == TokenNameLBRACE) {
                md.bodyStart = this.endPosition + 1;
            }
            // recovery
            if (this.currentElement != null) {
                this.lastCheckPoint = md.bodyStart;
            }
        }
    }

    protected void consumeMethodHeaderName(boolean isAnnotationMethod) {
        // MethodHeaderName ::= Modifiersopt Type 'Identifier' '('
        // AnnotationMethodHeaderName ::= Modifiersopt Type 'Identifier' '('
        // RecoveryMethodHeaderName ::= Modifiersopt Type 'Identifier' '('
        MethodDeclaration md;
        if (isAnnotationMethod) {
            md = new AnnotationMethodDeclaration(this.compilationUnit.compilationResult);
            this.recordStringLiterals = false;
        } else {
            md = new MethodDeclaration(this.compilationUnit.compilationResult);
        }

        // name
        md.selector = this.identifierStack[this.identifierPtr];
        long selectorSource = this.identifierPositionStack[this.identifierPtr--];
        this.identifierLengthPtr--;
        // type
        md.returnType = getTypeReference(this.intStack[this.intPtr--]);
        md.bits |= (md.returnType.bits & 1048576);
        // modifiers
        md.declarationSourceStart = this.intStack[this.intPtr--];
        md.modifiers = this.intStack[this.intPtr--];
        // consume annotations
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                md.annotations = new Annotation[length], 0, length);
        }
        // javadoc
        md.javadoc = this.javadoc;
        this.javadoc = null;

        // highlight starts at selector start
        md.sourceStart = (int) (selectorSource >>> 32);
        pushOnAstStack(md);
        md.sourceEnd = this.lParenPos;
        md.bodyStart = this.lParenPos + 1;
        this.listLength = 0; // initialize this.listLength before reading parameters/throws

        // recovery
        if (this.currentElement != null) {
            if (this.currentElement instanceof RecoveredType
                // || md.modifiers != 0
                || (Util.getLineNumber(md.returnType.sourceStart, this.scanner.lineEnds, 0, this.scanner.linePtr)
                    == Util.getLineNumber(md.sourceStart, this.scanner.lineEnds, 0, this.scanner.linePtr))) {
                this.lastCheckPoint = md.bodyStart;
                this.currentElement = this.currentElement.add(md, 0);
                this.lastIgnoredToken = TokenNameInvalid;
            } else {
                this.lastCheckPoint = md.sourceStart;
                this.restartRecovery = true;
            }
        }
    }

    protected void consumeMethodHeaderNameWithTypeParameters(boolean isAnnotationMethod) {
        // MethodHeaderName ::= Modifiersopt TypeParameters Type 'Identifier' '('
        // AnnotationMethodHeaderName ::= Modifiersopt TypeParameters Type 'Identifier' '('
        // RecoveryMethodHeaderName ::= Modifiersopt TypeParameters Type 'Identifier' '('
        MethodDeclaration md;
        if (isAnnotationMethod) {
            md = new AnnotationMethodDeclaration(this.compilationUnit.compilationResult);
            this.recordStringLiterals = false;
        } else {
            md = new MethodDeclaration(this.compilationUnit.compilationResult);
        }

        // name
        md.selector = this.identifierStack[this.identifierPtr];
        long selectorSource = this.identifierPositionStack[this.identifierPtr--];
        this.identifierLengthPtr--;
        // type
        TypeReference returnType = getTypeReference(this.intStack[this.intPtr--]);
        if (isAnnotationMethod)
            rejectIllegalLeadingTypeAnnotations(returnType);
        md.returnType = returnType;
        md.bits |= (returnType.bits & 1048576);

        // consume type parameters
        int length = this.genericsLengthStack[this.genericsLengthPtr--];
        this.genericsPtr -= length;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1, md.typeParameters = new TypeParameter[length], 0,
            length);

        // modifiers
        md.declarationSourceStart = this.intStack[this.intPtr--];
        md.modifiers = this.intStack[this.intPtr--];
        // consume annotations
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                md.annotations = new Annotation[length], 0, length);
        }
        // javadoc
        md.javadoc = this.javadoc;
        this.javadoc = null;

        // highlight starts at selector start
        md.sourceStart = (int) (selectorSource >>> 32);
        pushOnAstStack(md);
        md.sourceEnd = this.lParenPos;
        md.bodyStart = this.lParenPos + 1;
        this.listLength = 0; // initialize this.listLength before reading parameters/throws

        // recovery
        if (this.currentElement != null) {
            boolean isType;
            if ((isType = this.currentElement instanceof RecoveredType)
                // || md.modifiers != 0
                || (Util.getLineNumber(md.returnType.sourceStart, this.scanner.lineEnds, 0, this.scanner.linePtr)
                    == Util.getLineNumber(md.sourceStart, this.scanner.lineEnds, 0, this.scanner.linePtr))) {
                if (isType) {
                    ((RecoveredType) this.currentElement).pendingTypeParameters = null;
                }
                this.lastCheckPoint = md.bodyStart;
                this.currentElement = this.currentElement.add(md, 0);
                this.lastIgnoredToken = TokenNameInvalid;
            } else {
                this.lastCheckPoint = md.sourceStart;
                this.restartRecovery = true;
            }
        }
    }

    protected void consumeMethodHeaderRightParen() {
        // MethodHeaderParameters ::= FormalParameterListopt ')'
        int length = this.astLengthStack[this.astLengthPtr--];
        this.astPtr -= length;
        AbstractMethodDeclaration md = (AbstractMethodDeclaration) this.astStack[this.astPtr];
        md.sourceEnd = this.rParenPos;
        // arguments
        if (length != 0) {
            Argument arg = (Argument) this.astStack[this.astPtr + 1];
            if (arg.isReceiver()) {
                md.receiver = (Receiver) arg;
                if (length > 1) {
                    System.arraycopy(this.astStack, this.astPtr + 2, md.arguments = new Argument[length - 1], 0,
                        length - 1);
                }
                // Receiver annotations can only be type annotations; move to the type
                Annotation[] annotations = arg.annotations;
                if (annotations != null && annotations.length > 0) {
                    // The code assumes that receiver.type.annotations[0] will be null/empty
                    TypeReference type = arg.type;
                    if (type.annotations == null) {
                        type.bits |= 1048576;
                        type.annotations = new Annotation[type.getAnnotatableLevels()][];
                        md.bits |= 1048576;
                    }
                    type.annotations[0] = annotations;
                    int annotationSourceStart = annotations[0].sourceStart;
                    if (type.sourceStart > annotationSourceStart)
                        type.sourceStart = annotationSourceStart;
                    arg.annotations = null;
                }
                md.bits |= (arg.type.bits & 1048576);
            } else {
                System.arraycopy(this.astStack, this.astPtr + 1, md.arguments = new Argument[length], 0, length);
                for (Argument argument : md.arguments) {
                    if ((argument.bits & 1048576) != 0) {
                        md.bits |= 1048576;
                        break;
                    }
                }
            }
        }
        md.bodyStart = this.rParenPos + 1;
        this.listLength = 0; // reset this.listLength after having read all parameters
        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = md.bodyStart;
            if (this.currentElement.parseTree() == md)
                return;

            // might not have been attached yet - in some constructor scenarii
            if (md.isConstructor()) {
                if ((length != 0) || (this.currentToken == TokenNameLBRACE) || (this.currentToken == TokenNamethrows)) {
                    this.currentElement = this.currentElement.add(md, 0);
                    this.lastIgnoredToken = TokenNameInvalid;
                }
            }
        }
    }

    protected void consumeMethodHeaderThrowsClause() {
        // MethodHeaderThrowsClause ::= 'throws' ClassTypeList
        int length = this.astLengthStack[this.astLengthPtr--];
        this.astPtr -= length;
        AbstractMethodDeclaration md = (AbstractMethodDeclaration) this.astStack[this.astPtr];
        System.arraycopy(this.astStack, this.astPtr + 1, md.thrownExceptions = new TypeReference[length], 0, length);
        md.sourceEnd = md.thrownExceptions[length - 1].sourceEnd;
        md.bodyStart = md.thrownExceptions[length - 1].sourceEnd + 1;
        this.listLength = 0; // reset this.listLength after having read all thrown exceptions
        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = md.bodyStart;
        }
    }

    protected void consumeMethodInvocationName() {
        // MethodInvocation ::= Name '(' ArgumentListopt ')'

        // when the name is only an identifier...we have a message send to "this" (implicit)

        MessageSend m = newMessageSend();
        m.sourceEnd = this.rParenPos;
        m.sourceStart = (int) ((m.nameSourcePosition = this.identifierPositionStack[this.identifierPtr]) >>> 32);
        m.selector = this.identifierStack[this.identifierPtr--];
        if (this.identifierLengthStack[this.identifierLengthPtr] == 1) {
            m.receiver = ThisReference.implicitThis();
            this.identifierLengthPtr--;
        } else {
            this.identifierLengthStack[this.identifierLengthPtr]--;
            m.receiver = getUnspecifiedReference();
            m.sourceStart = m.receiver.sourceStart;
        }
        int length = this.typeAnnotationLengthStack[this.typeAnnotationLengthPtr--];
        Annotation[] typeAnnotations;
        if (length != 0) {
            System.arraycopy(this.typeAnnotationStack, (this.typeAnnotationPtr -= length) + 1,
                typeAnnotations = new Annotation[length], 0, length);
            problemReporter().misplacedTypeAnnotations(typeAnnotations[0], typeAnnotations[typeAnnotations.length - 1]);
        }
        pushOnExpressionStack(m);
    }

    protected void consumeMethodInvocationNameWithTypeArguments() {
        // MethodInvocation ::= Name '.' TypeArguments 'Identifier' '(' ArgumentListopt ')'

        // when the name is only an identifier...we have a message send to "this" (implicit)

        MessageSend m = newMessageSendWithTypeArguments();
        m.sourceEnd = this.rParenPos;
        m.sourceStart = (int) ((m.nameSourcePosition = this.identifierPositionStack[this.identifierPtr]) >>> 32);
        m.selector = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        // handle type arguments
        int length = this.genericsLengthStack[this.genericsLengthPtr--];
        this.genericsPtr -= length;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1, m.typeArguments = new TypeReference[length], 0,
            length);
        this.intPtr--;  // consume position of '<'

        m.receiver = getUnspecifiedReference();
        m.sourceStart = m.receiver.sourceStart;
        pushOnExpressionStack(m);
    }

    protected void consumeMethodInvocationPrimary() {
        // optimize the push/pop
        // MethodInvocation ::= Primary '.' 'Identifier' '(' ArgumentListopt ')'

        MessageSend m = newMessageSend();
        m.sourceStart = (int) ((m.nameSourcePosition = this.identifierPositionStack[this.identifierPtr]) >>> 32);
        m.selector = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;
        m.receiver = this.expressionStack[this.expressionPtr];
        m.sourceStart = m.receiver.sourceStart;
        m.sourceEnd = this.rParenPos;
        this.expressionStack[this.expressionPtr] = m;
    }

    protected void consumeMethodInvocationPrimaryWithTypeArguments() {
        // optimize the push/pop
        // MethodInvocation ::= Primary '.' TypeArguments 'Identifier' '(' ArgumentListopt ')'

        MessageSend m = newMessageSendWithTypeArguments();
        m.sourceStart = (int) ((m.nameSourcePosition = this.identifierPositionStack[this.identifierPtr]) >>> 32);
        m.selector = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        // handle type arguments
        int length = this.genericsLengthStack[this.genericsLengthPtr--];
        this.genericsPtr -= length;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1, m.typeArguments = new TypeReference[length], 0,
            length);
        this.intPtr--; // consume position of '<'

        m.receiver = this.expressionStack[this.expressionPtr];
        m.sourceStart = m.receiver.sourceStart;
        m.sourceEnd = this.rParenPos;
        this.expressionStack[this.expressionPtr] = m;
    }

    protected void consumeMethodInvocationSuper() {
        // MethodInvocation ::= 'super' '.' 'Identifier' '(' ArgumentListopt ')'

        MessageSend m = newMessageSend();
        m.sourceStart = this.intStack[this.intPtr--]; // start position of the super keyword
        m.sourceEnd = this.rParenPos;
        m.nameSourcePosition = this.identifierPositionStack[this.identifierPtr];
        m.selector = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;
        m.receiver = new SuperReference(m.sourceStart, this.endPosition);
        pushOnExpressionStack(m);
    }

    protected void consumeMethodInvocationSuperWithTypeArguments() {
        // MethodInvocation ::= 'super' '.' TypeArguments 'Identifier' '(' ArgumentListopt ')'

        MessageSend m = newMessageSendWithTypeArguments();
        this.intPtr--; // start position of the typeArguments
        m.sourceEnd = this.rParenPos;
        m.nameSourcePosition = this.identifierPositionStack[this.identifierPtr];
        m.selector = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        // handle type arguments
        int length = this.genericsLengthStack[this.genericsLengthPtr--];
        this.genericsPtr -= length;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1, m.typeArguments = new TypeReference[length], 0,
            length);
        m.sourceStart = this.intStack[this.intPtr--]; // start position of the super keyword

        m.receiver = new SuperReference(m.sourceStart, this.endPosition);
        pushOnExpressionStack(m);
    }

    protected void consumeModifiers() {
        int savedModifiersSourceStart = this.modifiersSourceStart;
        checkComment(); // might update modifiers with the deprecated flag
        pushOnIntStack(this.modifiers); // modifiers
        if (this.modifiersSourceStart >= savedModifiersSourceStart) {
            this.modifiersSourceStart = savedModifiersSourceStart;
        }
        pushOnIntStack(this.modifiersSourceStart);
        resetModifiers();
    }

    protected void consumeModifiers2() {
        this.expressionLengthStack[this.expressionLengthPtr - 1]
            += this.expressionLengthStack[this.expressionLengthPtr--];
    }

    protected void consumeMultipleResources() {
        // Resources ::= Resources ';' Resource
        concatNodeLists();
    }

    protected void consumeTypeAnnotation() {
        // TypeAnnotation ::= NormalTypeAnnotation
        // TypeAnnotation ::= MarkerTypeAnnotation
        // TypeAnnotation ::= SingleMemberTypeAnnotation
        this.dimensions = this.intStack[this.intPtr--]; // https://bugs.eclipse.org/bugs/show_bug.cgi?id=417660
    }

    protected void consumeOneMoreTypeAnnotation() {
        // TypeAnnotations ::= TypeAnnotations TypeAnnotation
        this.typeAnnotationLengthStack[--this.typeAnnotationLengthPtr]++;
    }

    protected void consumeNameArrayType() {
        pushOnGenericsLengthStack(0); // handle type arguments
        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
    }

    protected void consumeNestedMethod() {
        // NestedMethod ::= $empty
        jumpOverMethodBody();
        this.nestedMethod[this.nestedType]++;
        pushOnIntStack(this.scanner.currentPosition);
        consumeOpenBlock();
    }

    protected void consumeNestedType() {
        // NestedType ::= $empty
        int length = this.nestedMethod.length;
        if (++this.nestedType >= length) {
            System.arraycopy(this.nestedMethod, 0, this.nestedMethod = new int[length + 30], 0, length);
            // increase the size of the variablesCounter as well. It has to be consistent with the size of the
            // nestedMethod collection
            System.arraycopy(this.variablesCounter, 0, this.variablesCounter = new int[length + 30], 0, length);
        }
        this.nestedMethod[this.nestedType] = 0;
        this.variablesCounter[this.nestedType] = 0;
    }

    protected void consumeNormalAnnotation(boolean isTypeAnnotation) {
        // NormalTypeAnnotation ::= TypeAnnotationName '(' MemberValuePairsopt ')'
        // NormalAnnotation ::= AnnotationName '(' MemberValuePairsopt ')'
        NormalAnnotation normalAnnotation;

        int oldIndex = this.identifierPtr;

        TypeReference typeReference = getAnnotationType();
        normalAnnotation = new NormalAnnotation(typeReference, this.intStack[this.intPtr--]);
        int length;
        if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            System.arraycopy(this.astStack, (this.astPtr -= length) + 1,
                normalAnnotation.memberValuePairs = new MemberValuePair[length], 0, length);
        }
        normalAnnotation.declarationSourceEnd = this.rParenPos;

        if (isTypeAnnotation) {
            pushOnTypeAnnotationStack(normalAnnotation);
        } else {
            pushOnExpressionStack(normalAnnotation);
        }

        if (this.currentElement != null) {
            annotationRecoveryCheckPoint(normalAnnotation.declarationSourceEnd);

            if (this.currentElement instanceof RecoveredAnnotation recoveredAnnotation) {
                this.currentElement = recoveredAnnotation.addAnnotation(normalAnnotation);
            }
        }

        this.recordStringLiterals = true;
    }

    protected void consumeOneDimLoop(boolean isAnnotated) {
        // OneDimLoop ::= '[' ']'
        // OneDimLoop ::= TypeAnnotations '[' ']'
        this.dimensions++;
        if (!isAnnotated) {
            pushOnTypeAnnotationLengthStack(); // signal no annotations for the current dimension.
        }
    }

    protected void consumeOnlySynchronized() {
        // OnlySynchronized ::= 'synchronized'
        pushOnIntStack(this.synchronizedBlockSourceStart);
        resetModifiers();
        this.expressionLengthPtr--;
    }

    protected void consumeOpenBlock() {
        // OpenBlock ::= $empty

        pushOnIntStack(this.scanner.startPosition);
        int stackLength = this.realBlockStack.length;
        if (++this.realBlockPtr >= stackLength) {
            System.arraycopy(this.realBlockStack, 0, this.realBlockStack = new int[stackLength + 255], 0, stackLength);
        }
        this.realBlockStack[this.realBlockPtr] = 0;
    }

    protected void consumePackageComment() {
        // get possible comment for syntax since 1.5
        checkComment();
        resetModifiers();
    }

    protected void consumeInternalCompilationUnitWithModuleDeclaration() {
        this.compilationUnit.moduleDeclaration = (ModuleDeclaration) this.astStack[this.astPtr--];
        this.astLengthStack[this.astLengthPtr--] = 0;
    }

    protected void consumeRequiresStatement() {
        RequiresStatement req = (RequiresStatement) this.astStack[this.astPtr];
        req.declarationEnd = req.declarationSourceEnd = this.endStatementPosition;
        // recovery
        if (this.currentElement instanceof RecoveredModule) {
            this.lastCheckPoint = req.declarationSourceEnd + 1;
            this.currentElement = this.currentElement.add(req, 0);
            this.lastIgnoredToken = TokenNameInvalid;
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
    }

    protected void consumeSingleRequiresModuleName() {
        ModuleReference impt;
        int length;
        char[][] tokens = new char[length = this.identifierLengthStack[this.identifierLengthPtr--]][];
        this.identifierPtr -= length;
        long[] positions = new long[length];
        System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens, 0, length);
        System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions, 0, length);
        RequiresStatement req = new RequiresStatement(impt = new ModuleReference(tokens, positions));
        if (this.currentToken == TokenNameSEMICOLON) {
            req.declarationSourceEnd = impt.sourceEnd + 1;
        } else {
            req.declarationSourceEnd = impt.sourceEnd;
        }
        req.declarationEnd = req.declarationSourceEnd;
        this.intPtr--;
        req.modifiers |= this.intStack[this.intPtr--];
        req.sourceStart = req.declarationSourceStart = this.intStack[this.intPtr--];
        req.sourceEnd = impt.sourceEnd;
        pushOnAstStack(req);
        // recovery
        if (this.currentElement instanceof RecoveredModule) {
            this.lastCheckPoint = req.declarationSourceEnd;
        }
    }

    protected void consumeExportsStatement() {
        ExportsStatement expt = (ExportsStatement) this.astStack[this.astPtr];
        expt.declarationSourceEnd = this.endStatementPosition;
        expt.declarationEnd = expt.declarationSourceEnd;
        // recovery
        if (this.currentElement instanceof RecoveredPackageVisibilityStatement) {
            this.lastCheckPoint = expt.declarationSourceEnd + 1;
            this.currentElement = this.currentElement.parent;
            this.lastIgnoredToken = TokenNameInvalid;
            this.restartRecovery = true;
            // used to avoid branching back into the regular automaton
        }
    }

    protected void consumeExportsHeader() {
        ImportReference impt = (ImportReference) this.astStack[this.astPtr];
        impt.bits |= 262144;
        ExportsStatement expt = new ExportsStatement(impt);
        expt.declarationSourceStart = this.intStack[this.intPtr--];
        expt.sourceStart = expt.declarationSourceStart;
        expt.sourceEnd = impt.sourceEnd;
        if (this.currentToken == TokenNameSEMICOLON) {
            expt.declarationSourceEnd = this.scanner.currentPosition - 1;
        } else {
            expt.declarationSourceEnd = expt.sourceEnd;
        }
        expt.declarationEnd = expt.declarationSourceEnd;
        this.astStack[this.astPtr] = expt; // replace with ExportsStatement
        // recovery
        if (this.currentElement instanceof RecoveredModule) {
            this.lastCheckPoint = expt.declarationSourceEnd + 1;
            this.currentElement = this.currentElement.add(expt, 0);
        }
    }

    protected void consumeOpensHeader() {
        ImportReference impt = (ImportReference) this.astStack[this.astPtr];
        impt.bits |= 262144;
        OpensStatement stmt = new OpensStatement(impt);
        stmt.declarationSourceStart = this.intStack[this.intPtr--];
        stmt.sourceStart = stmt.declarationSourceStart;
        stmt.sourceEnd = impt.sourceEnd;
        if (this.currentToken == TokenNameSEMICOLON) {
            stmt.declarationSourceEnd = this.scanner.currentPosition - 1;
        } else {
            stmt.declarationSourceEnd = stmt.sourceEnd;
        }
        stmt.declarationEnd = stmt.declarationSourceEnd;
        this.astStack[this.astPtr] = stmt; // replace with OpensStatement
        // recovery
        if (this.currentElement instanceof RecoveredModule) {
            this.lastCheckPoint = stmt.declarationSourceEnd + 1;
            this.lastCheckPoint = stmt.declarationSourceEnd + 1;
            this.currentElement = this.currentElement.add(stmt, 0);
        }
    }

    protected void consumeOpensStatement() {
        OpensStatement expt = (OpensStatement) this.astStack[this.astPtr];
        expt.declarationSourceEnd = this.endStatementPosition;
        expt.declarationEnd = expt.declarationSourceEnd;
        // recovery
        if (this.currentElement instanceof RecoveredPackageVisibilityStatement) {
            this.lastCheckPoint = expt.declarationSourceEnd + 1;
            this.currentElement = this.currentElement.parent;
            this.lastIgnoredToken = TokenNameInvalid;
            this.restartRecovery = true;
            // used to avoid branching back into the regular automaton
        }
    }

    protected void consumeSingleTargetModuleName() {
        ModuleReference reference;
        int length;
        char[][] tokens = new char[length = this.identifierLengthStack[this.identifierLengthPtr--]][];
        this.identifierPtr -= length;
        long[] positions = new long[length];
        System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens, 0, length);
        System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions, 0, length);
        pushOnAstStack(reference = new ModuleReference(tokens, positions));

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = reference.sourceEnd + 1;
        }
    }

    protected void consumeTargetModuleList() {
        int length = this.astLengthStack[this.astLengthPtr--];
        this.astPtr -= length;
        PackageVisibilityStatement node = (PackageVisibilityStatement) this.astStack[this.astPtr];
        if (length > 0) {
            System.arraycopy(this.astStack, this.astPtr + 1, node.targets = new ModuleReference[length], 0, length);
            node.sourceEnd = node.targets[length - 1].sourceEnd;
            if (this.currentToken == TokenNameSEMICOLON) {
                node.declarationSourceEnd = node.sourceEnd + 1;
            } else {
                node.declarationSourceEnd = node.sourceEnd;
            }
        }

        this.listLength = 0; // reset after having read target modules list
        // recovery TBD
        if (this.currentElement != null) { // is recovering
            this.lastCheckPoint = node.sourceEnd;
        }
    }

    protected void consumeTargetModuleNameList() {
        this.listLength++;
        optimizedConcatNodeLists();
    }

    protected void consumeSinglePkgName() {
        ImportReference impt;
        int length;
        char[][] tokens = new char[length = this.identifierLengthStack[this.identifierLengthPtr--]][];
        this.identifierPtr -= length;
        long[] positions = new long[length];
        System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens, 0, length);
        System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions, 0, length);
        pushOnAstStack(impt = new ImportReference(tokens, positions, false, 0));

        // recovery
        if (this.currentElement instanceof RecoveredModule) {
            this.lastCheckPoint = impt.sourceEnd + 1;
        }
    }

    protected void consumeUsesStatement() {
        UsesStatement stmt = (UsesStatement) this.astStack[this.astPtr];
        stmt.declarationEnd = stmt.declarationSourceEnd = this.endStatementPosition;
        // recovery
        if (this.currentElement instanceof RecoveredModule) {
            this.lastCheckPoint = stmt.declarationSourceEnd;
            this.lastIgnoredToken = TokenNameInvalid;
            this.restartRecovery = true;
        }
    }

    protected void consumeUsesHeader() {
        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
        pushOnGenericsLengthStack(0);
        TypeReference siName = getTypeReference(0);
        if (siName.annotations != null) {
            for (int j = 0; j < siName.annotations.length; j++) {
                Annotation[] qualifierAnnot = siName.annotations[j];
                if (qualifierAnnot != null && qualifierAnnot.length > 0) {
                    problemReporter().misplacedTypeAnnotations(qualifierAnnot[0],
                        qualifierAnnot[qualifierAnnot.length - 1]);
                    siName.annotations[j] = null;
                }
            }
        }
        UsesStatement stmt = new UsesStatement(siName);
        if (this.currentToken == TokenNameSEMICOLON) {
            stmt.declarationSourceEnd = siName.sourceEnd + 1;
        } else {
            stmt.declarationSourceEnd = siName.sourceEnd;
        }
        stmt.declarationEnd = stmt.declarationSourceEnd;
        stmt.sourceStart = stmt.declarationSourceStart = this.intStack[this.intPtr--];
        stmt.sourceEnd = siName.sourceEnd;
        pushOnAstStack(stmt);
        // recovery
        if (this.currentElement instanceof RecoveredModule) {
            this.lastCheckPoint = stmt.sourceEnd + 1;
            this.currentElement = this.currentElement.add(stmt, 0);
        }
    }

    protected void consumeProvidesInterface() {
        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
        pushOnGenericsLengthStack(0);
        TypeReference siName = getTypeReference(0);
        if (siName.annotations != null) {
            for (int j = 0; j < siName.annotations.length; j++) {
                Annotation[] qualifierAnnot = siName.annotations[j];
                if (qualifierAnnot != null && qualifierAnnot.length > 0) {
                    problemReporter().misplacedTypeAnnotations(qualifierAnnot[0],
                        qualifierAnnot[qualifierAnnot.length - 1]);
                    siName.annotations[j] = null;
                }
            }
        }
        ProvidesStatement ref = new ProvidesStatement();
        ref.serviceInterface = siName;
        pushOnAstStack(ref);
        ref.declarationSourceStart = this.intStack[this.intPtr--];
        ref.sourceStart = ref.declarationSourceStart;
        ref.sourceEnd = siName.sourceEnd;
        ref.declarationSourceEnd = ref.sourceEnd;
        // recovery
        if (this.currentElement instanceof RecoveredModule) {
            this.lastCheckPoint = siName.sourceEnd + 1;
            this.currentElement = this.currentElement.add(ref, 0);
            this.lastIgnoredToken = TokenNameInvalid;
        }
    }

    protected void consumeSingleServiceImplName() {
        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
        pushOnGenericsLengthStack(0);
        TypeReference siName = getTypeReference(0);
        if (siName.annotations != null) {
            for (int j = 0; j < siName.annotations.length; j++) {
                Annotation[] qualifierAnnot = siName.annotations[j];
                if (qualifierAnnot != null && qualifierAnnot.length > 0) {
                    problemReporter().misplacedTypeAnnotations(qualifierAnnot[0],
                        qualifierAnnot[qualifierAnnot.length - 1]);
                    siName.annotations[j] = null;
                }
            }
        }
        pushOnAstStack(siName);
        // recovery
        if (this.currentElement instanceof RecoveredModule) {
            this.lastCheckPoint = siName.sourceEnd + 1;
        }
    }

    protected void consumeServiceImplNameList() {
        this.listLength++;
        optimizedConcatNodeLists();
    }

    protected void consumeProvidesStatement() {
        ProvidesStatement ref = (ProvidesStatement) this.astStack[this.astPtr];
        ref.declarationEnd = ref.declarationSourceEnd = this.endStatementPosition;
        // recovery
        if (this.currentElement instanceof RecoveredProvidesStatement) {
            this.lastIgnoredToken = TokenNameInvalid;
            this.currentElement = this.currentElement.parent;
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
    }

    protected void consumeWithClause() {
        int length = this.astLengthStack[this.astLengthPtr--];
        this.astPtr -= length;

        ProvidesStatement service = (ProvidesStatement) this.astStack[this.astPtr];
        System.arraycopy(this.astStack, this.astPtr + 1, service.implementations = new TypeReference[length], 0,
            length);

        service.sourceEnd = service.implementations[length - 1].sourceEnd;

        if (this.currentToken == TokenNameSEMICOLON) {
            service.declarationSourceEnd = service.sourceEnd + 1;
        } else {
            service.declarationSourceEnd = service.sourceEnd;
        }
        this.listLength = 0; // reset after having read super-interfaces
        // recovery
        if (this.currentElement instanceof RecoveredProvidesStatement) { // is recovering
            this.lastCheckPoint = service.declarationSourceEnd;
        }
    }

    protected void consumeEmptyModuleStatementsOpt() {
        pushOnAstLengthStack(0);
    }

    protected void consumeModuleStatements() {
        concatNodeLists();
    }

    protected void consumeModuleModifiers() {
        checkComment(); // might update modifiers with the deprecated flag
        // Merge with other modifiers
        this.intStack[this.intPtr - 1] |= this.modifiers;
        resetModifiers();
        // Account for the possible presence of annotations as well
        this.expressionLengthStack[this.expressionLengthPtr - 1]
            += this.expressionLengthStack[this.expressionLengthPtr--];
    }

    protected void consumeModuleHeader() {
        // ModuleHeader ::= 'module' Name

        int length;
        char[][] tokens = new char[length = this.identifierLengthStack[this.identifierLengthPtr--]][];
        this.identifierPtr -= length;
        long[] positions = new long[length];
        System.arraycopy(this.identifierStack, ++this.identifierPtr, tokens, 0, length);
        System.arraycopy(this.identifierPositionStack, this.identifierPtr--, positions, 0, length);

        ModuleDeclaration typeDecl = new ModuleDeclaration(this.compilationUnit.compilationResult, tokens, positions);
        // compute the declaration source too
        typeDecl.declarationSourceStart = this.intStack[this.intPtr--];
        typeDecl.bodyStart = typeDecl.sourceEnd + 1;
        typeDecl.modifiersSourceStart = this.intStack[this.intPtr--];
        typeDecl.modifiers = this.intStack[this.intPtr--];
        if (typeDecl.modifiersSourceStart >= 0) {
            typeDecl.declarationSourceStart = typeDecl.modifiersSourceStart;
        }
//	int otherModifiersStart = this.intStack[this.intPtr--];
//	int otherModifiers = this.intStack[this.intPtr--];
//	if (otherModifiersStart >= 0) {
//		typeDecl.declarationSourceStart = typeDecl.modifiersSourceStart = otherModifiersStart;
//	}
        // Merge with other modifiers
//	typeDecl.modifiers |= otherModifiers;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                typeDecl.annotations = new Annotation[length], 0, length);
        }
        pushOnAstStack(typeDecl);

        this.listLength = 0;
        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = typeDecl.bodyStart;
            this.currentElement = this.currentElement.add(typeDecl, 0);
            this.lastIgnoredToken = TokenNameInvalid;
        }
        // javadoc
//		typeDecl.javadoc = this.javadoc;
//		this.javadoc = null;
    }

    protected void consumeModuleDeclaration() {
        // ModuleDeclaration ::= ModuleHeader ModuleBody
        this.compilationUnit.javadoc = this.javadoc;
        this.javadoc = null;

        int length = this.astLengthStack[this.astLengthPtr--];
        int[] flag = new int[length + 1]; // plus one -- see <HERE>
        int size1 = 0, size2 = 0, size3 = 0, size4 = 0, size5 = 0;
        if (length != 0) {
            // there are length declarations
            // dispatch according to the type of the declarations
            for (int i = length - 1; i >= 0; i--) {
                ASTNode astNode = this.astStack[this.astPtr--];
                if (astNode instanceof RequiresStatement) {
                    flag[i] = 1;
                    size1++;
                } else if (astNode instanceof ExportsStatement) {
                    flag[i] = 2;
                    size2++;
                } else if (astNode instanceof UsesStatement) {
                    // field
                    flag[i] = 3;
                    size3++;
                } else if (astNode instanceof ProvidesStatement) {
                    flag[i] = 4;
                    size4++;
                } else if (astNode instanceof OpensStatement) {
                    flag[i] = 5;
                    size5++;
                }
            }
        }
        ModuleDeclaration modul = (ModuleDeclaration) this.astStack[this.astPtr];
        modul.requiresCount = size1;
        modul.exportsCount = size2;
        modul.usesCount = size3;
        modul.servicesCount = size4;
        modul.opensCount = size5;
        modul.requires = new RequiresStatement[size1];
        modul.exports = new ExportsStatement[size2];
        modul.uses = new UsesStatement[size3];
        modul.services = new ProvidesStatement[size4];
        modul.opens = new OpensStatement[size5];
        // arrays fill up
        size1 = size2 = size3 = size4 = size5 = 0;
        int flagI = flag[0], start = 0;
        int length2;
        for (int end = 0; end <= length; end++) // <HERE> the plus one allows to
        {
            if (flagI != flag[end]) // treat the last element as a ended flag.....
            { // array copy
                switch (flagI) {
                    case 1:
                        size1 += (length2 = end - start);
                        System.arraycopy(this.astStack, this.astPtr + start + 1, modul.requires, size1 - length2,
                            length2);
                        break;

                    case 2:
                        size2 += (length2 = end - start);
                        System.arraycopy(this.astStack, this.astPtr + start + 1, modul.exports, size2 - length2,
                            length2);
                        break;

                    case 3:
                        size3 += (length2 = end - start);
                        System.arraycopy(this.astStack, this.astPtr + start + 1, modul.uses, size3 - length2, length2);
                        break;

                    case 4:
                        size4 += (length2 = end - start);
                        System.arraycopy(this.astStack, this.astPtr + start + 1, modul.services, size4 - length2,
                            length2);
                        break;

                    case 5:
                        size5 += (length2 = end - start);
                        System.arraycopy(this.astStack, this.astPtr + start + 1, modul.opens, size5 - length2, length2);
                        break;
                }
                flagI = flag[start = end];
            }
        }
        modul.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);
    }

    protected void consumePackageDeclaration() {
        // PackageDeclaration ::= 'package' Name ';'
        /*
         * build an ImportRef build from the last name stored in the identifier stack.
         */

        ImportReference impt = this.compilationUnit.currentPackage;
        this.compilationUnit.javadoc = this.javadoc;
        this.javadoc = null;
        // flush comments defined prior to import statements
        impt.declarationEnd = this.endStatementPosition;
        impt.declarationSourceEnd = flushCommentsDefinedPriorTo(impt.declarationSourceEnd);
        if (this.firstToken == TokenNameQUESTION)
            this.unstackedAct = 17980; // force termination at goal
    }

    protected void consumePackageDeclarationName() {
        // PackageDeclarationName ::= PackageComment 'package' Name RejectTypeAnnotations
        /*
         * build an ImportRef build from the last name stored in the identifier stack.
         */

        ImportReference impt;
        int length;
        char[][] tokens = new char[length = this.identifierLengthStack[this.identifierLengthPtr--]][];
        this.identifierPtr -= length;
        long[] positions = new long[length];
        System.arraycopy(this.identifierStack, ++this.identifierPtr, tokens, 0, length);
        System.arraycopy(this.identifierPositionStack, this.identifierPtr--, positions, 0, length);

        impt = new ImportReference(tokens, positions, false, 0);
        this.compilationUnit.currentPackage = impt;

        if (this.currentToken == TokenNameSEMICOLON) {
            impt.declarationSourceEnd = this.scanner.currentPosition - 1;
        } else {
            impt.declarationSourceEnd = impt.sourceEnd;
        }
        impt.declarationEnd = impt.declarationSourceEnd;
        // this.endPosition is just before the ;
        impt.declarationSourceStart = this.intStack[this.intPtr--];

        // get possible comment source start
        if (this.javadoc != null) {
            impt.declarationSourceStart = this.javadoc.sourceStart;
        }

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = impt.declarationSourceEnd + 1;
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
    }

    protected void consumePackageDeclarationNameWithModifiers() {
        // PackageDeclarationName ::= Modifiers 'package' PushRealModifiers Name RejectTypeAnnotations
        /*
         * build an ImportRef build from the last name stored in the identifier stack.
         */

        ImportReference impt;
        int length;
        char[][] tokens = new char[length = this.identifierLengthStack[this.identifierLengthPtr--]][];
        this.identifierPtr -= length;
        long[] positions = new long[length];
        System.arraycopy(this.identifierStack, ++this.identifierPtr, tokens, 0, length);
        System.arraycopy(this.identifierPositionStack, this.identifierPtr--, positions, 0, length);

        int packageModifiersSourceStart = this.intStack[this.intPtr--];
        int packageModifiersSourceEnd; // Unless there were any
        int packageModifiers = this.intStack[this.intPtr--];

        impt = new ImportReference(tokens, positions, false, packageModifiers);
        this.compilationUnit.currentPackage = impt;
        // consume annotations
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                impt.annotations = new Annotation[length], 0, length);
            impt.declarationSourceStart = packageModifiersSourceStart;
            packageModifiersSourceEnd = this.intStack[this.intPtr--] - 2; // we don't need the position of the 'package
                                                                          // keyword
        } else {
            impt.declarationSourceStart = this.intStack[this.intPtr--];
            packageModifiersSourceEnd = impt.declarationSourceStart - 2;
            // get possible comment source start
            if (this.javadoc != null) {
                impt.declarationSourceStart = this.javadoc.sourceStart;
            }
        }

        if ((packageModifiers & ~1048576) != 0) {
            problemReporter().illegalModifiers(packageModifiersSourceStart, packageModifiersSourceEnd);
        }

        if (this.currentToken == TokenNameSEMICOLON) {
            impt.declarationSourceEnd = this.scanner.currentPosition - 1;
        } else {
            impt.declarationSourceEnd = impt.sourceEnd;
        }
        impt.declarationEnd = impt.declarationSourceEnd;

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = impt.declarationSourceEnd + 1;
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
    }

    protected void consumePostfixExpression() {
        // PostfixExpression ::= Name
        pushOnExpressionStack(getUnspecifiedReferenceOptimized());
    }

    protected void consumePrimaryNoNewArray() {
        // PrimaryNoNewArray ::= PushLPAREN Expression PushRPAREN
        final Expression parenthesizedExpression = this.expressionStack[this.expressionPtr];
        updateSourcePosition(parenthesizedExpression);
        int numberOfParenthesis = (parenthesizedExpression.bits & 534773760) >> 21;
        parenthesizedExpression.bits &= ~534773760;
        parenthesizedExpression.bits |= (numberOfParenthesis + 1) << 21;
    }

    protected void consumePrimaryNoNewArrayArrayType() {
        // PrimaryNoNewArray ::= Name Dims '.' 'class'
        this.intPtr--; // remove the class start position

        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
        pushOnGenericsLengthStack(0);
        ClassLiteralAccess cla;
        pushOnExpressionStack(
            cla = new ClassLiteralAccess(this.intStack[this.intPtr--], getTypeReference(this.intStack[this.intPtr--])));
        rejectIllegalTypeAnnotations(cla.type); // javac correctly rejects annotations on dimensions here.
    }

    protected void consumePrimaryNoNewArrayName() {
        // PrimaryNoNewArray ::= Name '.' 'class'
        this.intPtr--; // remove the class start position

        // handle type arguments
        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
        pushOnGenericsLengthStack(0);
        TypeReference typeReference = getTypeReference(0);

        rejectIllegalTypeAnnotations(typeReference);

        pushOnExpressionStack(new ClassLiteralAccess(this.intStack[this.intPtr--], typeReference));
    }

    protected void rejectIllegalLeadingTypeAnnotations(TypeReference typeReference) {
        // Reject misplaced annotations prefixed to a type reference; Used when the grammar is permissive enough to
        // allow them in the first place.
        Annotation[][] annotations = typeReference.annotations;
        if (annotations != null && annotations[0] != null) {
            problemReporter().misplacedTypeAnnotations(annotations[0][0], annotations[0][annotations[0].length - 1]);
            annotations[0] = null;  // don't complain further.
        }
    }

    private void rejectIllegalTypeAnnotations(TypeReference typeReference) {
        // Reject misplaced annotations on type reference; Used when grammar is permissive enough to allow them in the
        // first place.
        Annotation[][] annotations = typeReference.annotations;
        Annotation[] misplacedAnnotations;
        for (int i = 0, length = annotations == null ? 0 : annotations.length; i < length; i++) {
            misplacedAnnotations = annotations[i];
            if (misplacedAnnotations != null) {
                problemReporter().misplacedTypeAnnotations(misplacedAnnotations[0],
                    misplacedAnnotations[misplacedAnnotations.length - 1]);
            }
        }
        annotations = typeReference.getAnnotationsOnDimensions(true);
        for (int i = 0, length = annotations == null ? 0 : annotations.length; i < length; i++) {
            misplacedAnnotations = annotations[i];
            if (misplacedAnnotations != null) {
                problemReporter().misplacedTypeAnnotations(misplacedAnnotations[0],
                    misplacedAnnotations[misplacedAnnotations.length - 1]);
            }
        }
        typeReference.annotations = null;
        typeReference.setAnnotationsOnDimensions(null);
        typeReference.bits &= ~1048576;
    }

    protected void consumeQualifiedSuperReceiver() {
        // QualifiedSuperReceiver ::= Name '.' 'super'
        // handle type arguments
        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
        pushOnGenericsLengthStack(0);
        // javac does not accept annotations here anywhere ...
        TypeReference typeReference = getTypeReference(0);
        rejectIllegalTypeAnnotations(typeReference);
        pushOnExpressionStack(
            new QualifiedSuperReference(typeReference, this.intStack[this.intPtr--], this.endPosition));
    }

    protected void consumePrimaryNoNewArrayNameThis() {
        // PrimaryNoNewArray ::= Name '.' 'this'
        // handle type arguments
        pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
        pushOnGenericsLengthStack(0); // handle type arguments
        // javac does not accept annotations here anywhere ...
        TypeReference typeReference = getTypeReference(0);
        rejectIllegalTypeAnnotations(typeReference);
        pushOnExpressionStack(
            new QualifiedThisReference(typeReference, this.intStack[this.intPtr--], this.endPosition));
    }

    protected void consumePrimaryNoNewArrayPrimitiveArrayType() {
        // PrimaryNoNewArray ::= PrimitiveType Dims '.' 'class'
        this.intPtr--; // remove the class start position
        ClassLiteralAccess cla;
        pushOnExpressionStack(
            cla = new ClassLiteralAccess(this.intStack[this.intPtr--], getTypeReference(this.intStack[this.intPtr--])));
        rejectIllegalTypeAnnotations(cla.type);
    }

    protected void consumePrimaryNoNewArrayPrimitiveType() {
        // PrimaryNoNewArray ::= PrimitiveType '.' 'class'
        this.intPtr--; // remove the class start position
        ClassLiteralAccess cla;
        pushOnExpressionStack(cla = new ClassLiteralAccess(this.intStack[this.intPtr--], getTypeReference(0)));
        rejectIllegalTypeAnnotations(cla.type);
    }

    protected void consumePrimaryNoNewArrayThis() {
        // PrimaryNoNewArray ::= 'this'
        pushOnExpressionStack(new ThisReference(this.intStack[this.intPtr--], this.endPosition));
    }

    protected void consumePrimaryNoNewArrayWithName() {
        // PrimaryNoNewArray ::= PushLPAREN Name PushRPAREN
        pushOnExpressionStack(getUnspecifiedReferenceOptimized());
        final Expression parenthesizedExpression = this.expressionStack[this.expressionPtr];
        updateSourcePosition(parenthesizedExpression);
        int numberOfParenthesis = (parenthesizedExpression.bits & 534773760) >> 21;
        parenthesizedExpression.bits &= ~534773760;
        parenthesizedExpression.bits |= (numberOfParenthesis + 1) << 21;
    }

    protected void consumePrimitiveType() {
        // Type ::= PrimitiveType
        pushOnIntStack(0);
    }

    protected void consumePushLeftBrace() {
        pushOnIntStack(this.endPosition); // modifiers
    }

    protected void consumePushModifiers() {
        pushOnIntStack(this.modifiers); // modifiers
        pushOnIntStack(this.modifiersSourceStart);
        resetModifiers();
        pushOnExpressionStackLengthStack();
    }

    protected void consumePushCombineModifiers() {
        // ModifiersWithDefault ::= Modifiersopt 'default' Modifiersopt'
        // int stack on entry : ... Modifiers, ModifiersSourceStart, defaultSourceStart, defaultSourceEnd, Modifiers',
        // Modifiers'SourceStart <<--- intPtr
        // int stack on exit : ... combinedModifiers, combinedModifiersSourceStart <<--- intPtr

        this.intPtr--; // pop modifiers'SourceStart, real location is with earlier block
        int newModifiers = this.intStack[this.intPtr--] | 65536; // pop modifiers
        this.intPtr -= 2; // pop location of 'default' keyword

        if ((this.intStack[this.intPtr - 1] & newModifiers) != 0) { // duplicate modifier(s) ?
            newModifiers |= 4194304;
        }
        this.intStack[this.intPtr - 1] |= newModifiers; // merge them in place
        // Also fix number of annotations-modifiers:
        this.expressionLengthStack[this.expressionLengthPtr - 1]
            += this.expressionLengthStack[this.expressionLengthPtr--];
        if (this.currentElement != null) {
            this.currentElement.addModifier(newModifiers, this.intStack[this.intPtr]);
        }
    }

    protected void consumePushModifiersForHeader() {
        checkComment(); // might update modifiers with the deprecated flag
        pushOnIntStack(this.modifiers); // modifiers
        pushOnIntStack(this.modifiersSourceStart);
        resetModifiers();
        pushOnExpressionStackLengthStack();
    }

    protected void consumePushPosition() {
        // for source managment purpose
        // PushPosition ::= $empty
        pushOnIntStack(this.endPosition);
    }

    protected void consumePushRealModifiers() {
        checkComment(); // might update modifiers with the deprecated flag
        pushOnIntStack(this.modifiers); // modifiers
        pushOnIntStack(this.modifiersSourceStart);
        resetModifiers();
    }

    protected void consumeQualifiedName(boolean qualifiedNameIsAnnotated) {
        // QualifiedName ::= Name '.' SimpleName
        // QualifiedName ::= Name '.' TypeAnnotations SimpleName
        /*
         * back from the recursive loop of QualifiedName. Updates identifier length into the length stack
         */

        this.identifierLengthStack[--this.identifierLengthPtr]++;
        if (!qualifiedNameIsAnnotated) {
            pushOnTypeAnnotationLengthStack();
        }
    }

    protected void consumeUnannotatableQualifiedName() {
        // UnannotatableName ::= UnannotatableName '.' SimpleName
        this.identifierLengthStack[--this.identifierLengthPtr]++;
    }

    protected void consumeRecoveryMethodHeaderName() {
        // this method is call only inside recovery
        boolean isAnnotationMethod = false;
        if (this.currentElement instanceof RecoveredType recoveredType) {
            isAnnotationMethod = (recoveredType.typeDeclaration.modifiers & 8192) != 0;
        } else {
            RecoveredType recoveredType = this.currentElement.enclosingType();
            if (recoveredType != null) {
                isAnnotationMethod = (recoveredType.typeDeclaration.modifiers & 8192) != 0;
            }
        }
        consumeMethodHeaderName(isAnnotationMethod);
    }

    protected void consumeRecoveryMethodHeaderNameWithTypeParameters() {
        // this method is call only inside recovery
        boolean isAnnotationMethod = false;
        if (this.currentElement instanceof RecoveredType recoveredType) {
            isAnnotationMethod = (recoveredType.typeDeclaration.modifiers & 8192) != 0;
        } else {
            RecoveredType recoveredType = this.currentElement.enclosingType();
            if (recoveredType != null) {
                isAnnotationMethod = (recoveredType.typeDeclaration.modifiers & 8192) != 0;
            }
        }
        consumeMethodHeaderNameWithTypeParameters(isAnnotationMethod);
    }

    protected void consumeReduceImports() {
        // Consume imports
        int length;
        if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            this.astPtr -= length;
            System.arraycopy(this.astStack, this.astPtr + 1, this.compilationUnit.imports = new ImportReference[length],
                0, length);
        }
    }

    protected void consumeReferenceType() {
        pushOnIntStack(0); // handle array type
    }

    protected void consumeReferenceType1() {
        pushOnGenericsStack(getTypeReference(this.intStack[this.intPtr--]));
    }

    protected void consumeReferenceType2() {
        pushOnGenericsStack(getTypeReference(this.intStack[this.intPtr--]));
    }

    protected void consumeReferenceType3() {
        pushOnGenericsStack(getTypeReference(this.intStack[this.intPtr--]));
    }

    protected void consumeResourceAsLocalVariable() {
        // Resource ::= Name
        NameReference ref = getUnspecifiedReference(true);
        pushOnAstStack(ref);
    }

    protected void consumeResourceAsThis() {
        Reference ref = new ThisReference(this.intStack[this.intPtr--], this.endPosition);
        pushOnAstStack(ref);
    }

    protected void consumeResourceAsFieldAccess() {
        // Resource ::= FieldAccess
        FieldReference ref = (FieldReference) this.expressionStack[this.expressionPtr--];
        pushOnAstStack(ref);
    }

    protected void consumeResourceAsLocalVariableDeclaration() {
        // Resource ::= Type PushModifiers VariableDeclaratorId EnterVariable '=' ForceNoDiet VariableInitializer
        // RestoreDiet ExitVariableWithInitialization
        // Resource ::= Modifiers Type PushRealModifiers VariableDeclaratorId EnterVariable '=' ForceNoDiet
        // VariableInitializer RestoreDiet ExitVariableWithInitialization
        consumeLocalVariableDeclaration();
    }

    protected void consumeResourceOptionalTrailingSemiColon(boolean punctuated) {
        // TrailingSemiColon ::= ';'
        Statement statement = (Statement) this.astStack[this.astPtr];

        if (punctuated) {
            if (statement instanceof LocalDeclaration declaration) {
                declaration.declarationSourceEnd = this.endStatementPosition;
            }
        }
    }

    protected void consumeRestoreDiet() {
        // RestoreDiet ::= $empty
        this.dietInt--;
    }

    protected void consumeRightParen() {
        // PushRPAREN ::= ')'
        pushOnIntStack(this.rParenPos);
    }

    protected void consumeNonTypeUseName() { // https://bugs.eclipse.org/bugs/show_bug.cgi?id=383596
        // RejectTypeAnnotations ::= $empty
        // We can get here with type annotation stack empty, because completion parser manipulates the identifier stacks
        // even without rule reduction. See completionIdentifierCheck
        for (int i = this.identifierLengthStack[this.identifierLengthPtr]; i > 0 && this.typeAnnotationLengthPtr >= 0;
            --i) {
            int length = this.typeAnnotationLengthStack[this.typeAnnotationLengthPtr--];
            Annotation[] typeAnnotations;
            if (length != 0) {
                System.arraycopy(this.typeAnnotationStack, (this.typeAnnotationPtr -= length) + 1,
                    typeAnnotations = new Annotation[length], 0, length);
                problemReporter().misplacedTypeAnnotations(typeAnnotations[0],
                    typeAnnotations[typeAnnotations.length - 1]);
            }
        }
    }

    protected void consumeZeroTypeAnnotations() {
        // PushZeroTypeAnnotations ::= $empty
        // Name ::= SimpleName
        // TypeAnnotationsopt ::= $empty
        pushOnTypeAnnotationLengthStack(); // signal absence of @308 annotations.
        if (this.currentElement instanceof RecoveredAnnotation ann) {
            if (ann.parent instanceof RecoveredMethod meth
                && !meth.foundOpeningBrace
                && this.currentToken == TokenNameRPAREN) {
                // take note of an incomplete annotation "@Ann(v=)":
                meth.incompleteParameterAnnotationSeen = true;
            }
            if (this.identifierPtr > ann.identifierPtr) {
                ann.hasPendingMemberValueName = true;
                ann.errorToken = this.currentToken;
            }
        }
    }

// BEGIN_AUTOGENERATED_REGION_CONSUME_RULE
// This method is part of an automatic generation : do NOT edit-modify
    protected void consumeRule(int act) {
        switch (act) {
            case 40:   // $NON-NLS-1$
                consumePrimitiveType();
                break;

            case 54:   // $NON-NLS-1$
                consumeReferenceType();
                break;

            case 58:   // $NON-NLS-1$
                consumeClassOrInterfaceName();
                break;

            case 59:   // $NON-NLS-1$
                consumeClassOrInterface();
                break;

            case 60:   // $NON-NLS-1$

                break;

            case 61:   // $NON-NLS-1$
                consumeGenericTypeWithDiamond();
                break;

            case 62:   // $NON-NLS-1$
                consumeArrayTypeWithTypeArgumentsName();
                break;

            case 63:   // $NON-NLS-1$

                break;

            case 64:   // $NON-NLS-1$
                consumeNameArrayType();
                break;

            case 65:   // $NON-NLS-1$

                break;

            case 66:   // $NON-NLS-1$

                break;

            case 68:   // $NON-NLS-1$
                consumeZeroTypeAnnotations();
                break;

            case 73:   // $NON-NLS-1$
                consumeUnannotatableQualifiedName();
                break;

            case 74:   // $NON-NLS-1$
                consumeQualifiedName(false);
                break;

            case 75:   // $NON-NLS-1$
                consumeQualifiedName(true);
                break;

            case 76:   // $NON-NLS-1$
                consumeZeroTypeAnnotations();
                break;

            case 80:   // $NON-NLS-1$
                consumeOneMoreTypeAnnotation();
                break;

            case 81:   // $NON-NLS-1$
                consumeTypeAnnotation();
                break;

            case 82:   // $NON-NLS-1$
                consumeTypeAnnotation();
                break;

            case 83:   // $NON-NLS-1$
                consumeTypeAnnotation();
                break;

            case 84:   // $NON-NLS-1$
                consumeAnnotationName();
                break;

            case 85:   // $NON-NLS-1$
                consumeNormalAnnotation(true);
                break;

            case 86:   // $NON-NLS-1$
                consumeMarkerAnnotation(true);
                break;

            case 87:   // $NON-NLS-1$
                consumeSingleMemberAnnotation(true);
                break;

            case 88:   // $NON-NLS-1$
                consumeNonTypeUseName();
                break;

            case 89:   // $NON-NLS-1$
                consumeZeroTypeAnnotations();
                break;

            case 90:   // $NON-NLS-1$
                consumeExplicitThisParameter(false);
                break;

            case 91:   // $NON-NLS-1$
                consumeExplicitThisParameter(true);
                break;

            case 92:   // $NON-NLS-1$
                consumeVariableDeclaratorIdParameter();
                break;

            case 93:   // $NON-NLS-1$

                break;

            case 94:   // $NON-NLS-1$
                consumeInternalCompilationUnit();
                break;

            case 95:   // $NON-NLS-1$
                consumeInternalCompilationUnit();
                break;

            case 96:   // $NON-NLS-1$
                consumeInternalCompilationUnitWithTypes();
                break;

            case 97:   // $NON-NLS-1$
                consumeInternalCompilationUnitWithTypes();
                break;

            case 98:   // $NON-NLS-1$
                consumeInternalCompilationUnit();
                break;

            case 99:   // $NON-NLS-1$
                consumeEmptyInternalCompilationUnit();
                break;

            case 100:   // $NON-NLS-1$
                consumeInternalCompilationUnitWithModuleDeclaration();
                break;

            case 101:   // $NON-NLS-1$
                consumeInternalCompilationUnitWithModuleDeclaration();
                break;

            case 102:   // $NON-NLS-1$
                consumeModuleDeclaration();
                break;

            case 103:   // $NON-NLS-1$
                consumeInternalCompilationUnitWithPotentialImplicitlyDeclaredClass();
                break;

            case 104:   // $NON-NLS-1$
                consumeInternalCompilationUnitWithPotentialImplicitlyDeclaredClass();
                break;

            case 105:   // $NON-NLS-1$
                consumeModuleHeader();
                break;

            case 107:   // $NON-NLS-1$
                consumeModuleModifiers();
                break;

            case 110:   // $NON-NLS-1$
                consumeEmptyModuleStatementsOpt();
                break;

            case 113:   // $NON-NLS-1$
                consumeModuleStatements();
                break;

            case 119:   // $NON-NLS-1$
                consumeRequiresStatement();
                break;

            case 120:   // $NON-NLS-1$
                consumeSingleRequiresModuleName();
                break;

            case 121:   // $NON-NLS-1$
                consumeModifiers();
                break;

            case 122:   // $NON-NLS-1$
                consumeDefaultModifiers();
                break;

            case 124:   // $NON-NLS-1$
                consumeModifiers2();
                break;

            case 127:   // $NON-NLS-1$
                consumeExportsStatement();
                break;

            case 128:   // $NON-NLS-1$
                consumeExportsHeader();
                break;

            case 130:   // $NON-NLS-1$
                consumeTargetModuleList();
                break;

            case 131:   // $NON-NLS-1$
                consumeSingleTargetModuleName();
                break;

            case 133:   // $NON-NLS-1$
                consumeTargetModuleNameList();
                break;

            case 134:   // $NON-NLS-1$
                consumeSinglePkgName();
                break;

            case 135:   // $NON-NLS-1$
                consumeOpensStatement();
                break;

            case 136:   // $NON-NLS-1$
                consumeOpensHeader();
                break;

            case 137:   // $NON-NLS-1$
                consumeUsesStatement();
                break;

            case 138:   // $NON-NLS-1$
                consumeUsesHeader();
                break;

            case 139:   // $NON-NLS-1$
                consumeProvidesStatement();
                break;

            case 140:   // $NON-NLS-1$
                consumeProvidesInterface();
                break;

            case 141:   // $NON-NLS-1$
                consumeSingleServiceImplName();
                break;

            case 143:   // $NON-NLS-1$
                consumeServiceImplNameList();
                break;

            case 144:   // $NON-NLS-1$
                consumeWithClause();
                break;

            case 145:   // $NON-NLS-1$
                consumeReduceImports();
                break;

            case 146:   // $NON-NLS-1$

                break;

            case 169:   // $NON-NLS-1$
                consumeCatchHeader();
                break;

            case 171:   // $NON-NLS-1$
                consumeImportDeclarations();
                break;

            case 173:   // $NON-NLS-1$
                consumeTypeDeclarations();
                break;

            case 174:   // $NON-NLS-1$
                consumePackageDeclaration();
                break;

            case 175:   // $NON-NLS-1$
                consumePackageDeclarationNameWithModifiers();
                break;

            case 176:   // $NON-NLS-1$
                consumePackageDeclarationName();
                break;

            case 177:   // $NON-NLS-1$
                consumePackageComment();
                break;

            case 182:   // $NON-NLS-1$
                consumeImportDeclaration();
                break;

            case 183:   // $NON-NLS-1$
                consumeSingleTypeImportDeclarationName();
                break;

            case 184:   // $NON-NLS-1$
                consumeImportDeclaration();
                break;

            case 185:   // $NON-NLS-1$
                consumeTypeImportOnDemandDeclarationName();
                break;

            case 188:   // $NON-NLS-1$
                consumeEmptyTypeDeclaration();
                break;

            case 193:   // $NON-NLS-1$
                consumeModifiers2();
                break;

            case 207:   // $NON-NLS-1$
                consumeAnnotationAsModifier();
                break;

            case 208:   // $NON-NLS-1$
                consumeClassDeclaration();
                break;

            case 209:   // $NON-NLS-1$
                consumeClassHeader();
                break;

            case 210:   // $NON-NLS-1$
                consumeTypeHeaderNameWithTypeParameters();
                break;

            case 212:   // $NON-NLS-1$
                consumeClassHeaderName1();
                break;

            case 213:   // $NON-NLS-1$
                consumeClassHeaderExtends();
                break;

            case 214:   // $NON-NLS-1$
                consumeClassHeaderImplements();
                break;

            case 216:   // $NON-NLS-1$
                consumeInterfaceTypeList();
                break;

            case 217:   // $NON-NLS-1$
                consumeInterfaceType();
                break;

            case 220:   // $NON-NLS-1$
                consumeClassBodyDeclarations();
                break;

            case 226:   // $NON-NLS-1$
                consumeImplicitlyDeclaredClassBodyDeclarations();
                break;

            case 227:   // $NON-NLS-1$
                consumeClassBodyDeclaration();
                break;

            case 228:   // $NON-NLS-1$
                consumeDiet();
                break;

            case 229:   // $NON-NLS-1$
                consumeClassBodyDeclaration();
                break;

            case 230:   // $NON-NLS-1$
                consumeCreateInitializer();
                break;

            case 238:   // $NON-NLS-1$
                consumeEmptyTypeDeclaration();
                break;

            case 241:   // $NON-NLS-1$
                consumeFieldDeclaration();
                break;

            case 243:   // $NON-NLS-1$
                consumeVariableDeclarators();
                break;

            case 246:   // $NON-NLS-1$
                consumeEnterVariable();
                break;

            case 247:   // $NON-NLS-1$
                consumeExitVariableWithInitialization();
                break;

            case 248:   // $NON-NLS-1$
                consumeExitVariableWithoutInitialization();
                break;

            case 249:   // $NON-NLS-1$
                consumeForceNoDiet();
                break;

            case 250:   // $NON-NLS-1$
                consumeRestoreDiet();
                break;

            case 252:   // $NON-NLS-1$
                consumeUnnamedVariable();
                break;

            case 256:   // $NON-NLS-1$
                // set to true to consume a method with a body
                consumeMethodDeclaration(true, false);
                break;

            case 257:   // $NON-NLS-1$
                // set to true to consume a method with a body
                consumeMethodDeclaration(true, true);
                break;

            case 258:   // $NON-NLS-1$
                // set to false to consume a method without body
                consumeMethodDeclaration(false, false);
                break;

            case 259:   // $NON-NLS-1$
                consumeMethodHeader();
                break;

            case 260:   // $NON-NLS-1$
                consumeMethodHeader();
                break;

            case 261:   // $NON-NLS-1$
                consumeMethodHeaderNameWithTypeParameters(false);
                break;

            case 262:   // $NON-NLS-1$
                consumeMethodHeaderName(false);
                break;

            case 263:   // $NON-NLS-1$
                consumeMethodHeaderNameWithTypeParameters(false);
                break;

            case 264:   // $NON-NLS-1$
                consumeMethodHeaderName(false);
                break;

            case 265:   // $NON-NLS-1$
                consumePushCombineModifiers();
                break;

            case 266:   // $NON-NLS-1$
                consumeMethodHeaderRightParen();
                break;

            case 267:   // $NON-NLS-1$
                consumeMethodHeaderExtendedDims();
                break;

            case 268:   // $NON-NLS-1$
                consumeMethodHeaderThrowsClause();
                break;

            case 269:   // $NON-NLS-1$
                consumeConstructorHeader();
                break;

            case 270:   // $NON-NLS-1$
                consumeConstructorHeaderNameWithTypeParameters();
                break;

            case 271:   // $NON-NLS-1$
                consumeConstructorHeaderName(false);
                break;

            case 272:   // $NON-NLS-1$
                consumeConstructorDeclaration();
                break;

            case 273:   // $NON-NLS-1$
                consumeConstructorHeader();
                break;

            case 274:   // $NON-NLS-1$
                consumeConstructorHeaderName(true);
                break;

            case 276:   // $NON-NLS-1$
                consumeSingleVariableDeclaratorList();
                break;

            case 277:   // $NON-NLS-1$
                consumeSingleVariableDeclarator(false);
                break;

            case 278:   // $NON-NLS-1$
                consumeSingleVariableDeclarator(true);
                break;

            case 279:   // $NON-NLS-1$
                consumeSingleVariableDeclarator(true);
                break;

            case 280:   // $NON-NLS-1$
                consumeCatchFormalParameter();
                break;

            case 281:   // $NON-NLS-1$
                consumeCatchType();
                break;

            case 282:   // $NON-NLS-1$
                consumeUnionTypeAsClassType();
                break;

            case 283:   // $NON-NLS-1$
                consumeUnionType();
                break;

            case 285:   // $NON-NLS-1$
                consumeClassTypeList();
                break;

            case 286:   // $NON-NLS-1$
                consumeClassTypeElt();
                break;

            case 287:   // $NON-NLS-1$
                consumeMethodBody();
                break;

            case 288:   // $NON-NLS-1$
                consumeNestedMethod();
                break;

            case 289:   // $NON-NLS-1$
                consumeStaticInitializer();
                break;

            case 290:   // $NON-NLS-1$
                consumeStaticOnly();
                break;

            case 291:   // $NON-NLS-1$
                consumeConstructorDeclaration();
                break;

            case 292:   // $NON-NLS-1$
                consumeInvalidConstructorDeclaration();
                break;

            case 293:   // $NON-NLS-1$
                consumeExplicitConstructorInvocation(0, 3);
                break;

            case 294:   // $NON-NLS-1$
                consumeExplicitConstructorInvocationWithTypeArguments(0, 3);
                break;

            case 295:   // $NON-NLS-1$
                consumeExplicitConstructorInvocation(0, 2);
                break;

            case 296:   // $NON-NLS-1$
                consumeExplicitConstructorInvocationWithTypeArguments(0, 2);
                break;

            case 297:   // $NON-NLS-1$
                consumeExplicitConstructorInvocation(1, 2);
                break;

            case 298:   // $NON-NLS-1$
                consumeExplicitConstructorInvocationWithTypeArguments(1, 2);
                break;

            case 299:   // $NON-NLS-1$
                consumeExplicitConstructorInvocation(2, 2);
                break;

            case 300:   // $NON-NLS-1$
                consumeExplicitConstructorInvocationWithTypeArguments(2, 2);
                break;

            case 301:   // $NON-NLS-1$
                consumeExplicitConstructorInvocation(1, 3);
                break;

            case 302:   // $NON-NLS-1$
                consumeExplicitConstructorInvocationWithTypeArguments(1, 3);
                break;

            case 303:   // $NON-NLS-1$
                consumeExplicitConstructorInvocation(2, 3);
                break;

            case 304:   // $NON-NLS-1$
                consumeExplicitConstructorInvocationWithTypeArguments(2, 3);
                break;

            case 305:   // $NON-NLS-1$
                consumeInterfaceDeclaration();
                break;

            case 306:   // $NON-NLS-1$
                consumeInterfaceHeader();
                break;

            case 307:   // $NON-NLS-1$
                consumeTypeHeaderNameWithTypeParameters();
                break;

            case 309:   // $NON-NLS-1$
                consumeInterfaceHeaderName1();
                break;

            case 310:   // $NON-NLS-1$
                consumeInterfaceHeaderExtends();
                break;

            case 313:   // $NON-NLS-1$
                consumeInterfaceMemberDeclarations();
                break;

            case 314:   // $NON-NLS-1$
                consumeEmptyTypeDeclaration();
                break;

            case 316:   // $NON-NLS-1$
                consumeInterfaceMethodDeclaration(false);
                break;

            case 317:   // $NON-NLS-1$
                consumeInterfaceMethodDeclaration(false);
                break;

            case 318:   // $NON-NLS-1$
                consumeInterfaceMethodDeclaration(true);
                break;

            case 319:   // $NON-NLS-1$
                consumeInvalidConstructorDeclaration(true);
                break;

            case 320:   // $NON-NLS-1$
                consumeInvalidConstructorDeclaration(false);
                break;

            case 331:   // $NON-NLS-1$
                consumeClassDeclaration();
                break;

            case 332:   // $NON-NLS-1$

                break;

            case 333:   // $NON-NLS-1$
                consumeRecordHeaderNameWithTypeParameters();
                break;

            case 334:   // $NON-NLS-1$
                consumeRecordHeaderName();
                break;

            case 335:   // $NON-NLS-1$
                consumeRecordHeaderName1();
                break;

            case 336:   // $NON-NLS-1$
                consumeRecordComponentHeaderRightParen();
                break;

            case 338:   // $NON-NLS-1$
                consumeRecordComponentsopt();
                break;

            case 341:   // $NON-NLS-1$
                consumeInstanceOfExpression();
                break;

            case 344:   // $NON-NLS-1$
                consumeInstanceOfClassic();
                break;

            case 345:   // $NON-NLS-1$
                consumeInstanceofPattern();
                break;

            case 348:   // $NON-NLS-1$
                consumeTypePattern();
                break;

            case 349:   // $NON-NLS-1$
                consumeTypePattern();
                break;

            case 350:   // $NON-NLS-1$
                consumeRecordPattern();
                break;

            case 351:   // $NON-NLS-1$
                consumePatternListopt();
                break;

            case 354:   // $NON-NLS-1$
                consumePatternList();
                break;

            case 357:   // $NON-NLS-1$
                consumeUnnamedPattern();
                break;

            case 359:   // $NON-NLS-1$
                consumePushLeftBrace();
                break;

            case 360:   // $NON-NLS-1$
                consumeEmptyArrayInitializer();
                break;

            case 361:   // $NON-NLS-1$
                consumeArrayInitializer();
                break;

            case 362:   // $NON-NLS-1$
                consumeArrayInitializer();
                break;

            case 364:   // $NON-NLS-1$
                consumeVariableInitializers();
                break;

            case 365:   // $NON-NLS-1$
                consumeBlock();
                break;

            case 366:   // $NON-NLS-1$
                consumeOpenBlock();
                break;

            case 367:   // $NON-NLS-1$

                break;

            case 368:   // $NON-NLS-1$
                consumeBlockStatements();
                break;

            case 376:   // $NON-NLS-1$
                consumeInvalidInterfaceDeclaration();
                break;

            case 377:   // $NON-NLS-1$
                consumeInvalidAnnotationTypeDeclaration();
                break;

            case 378:   // $NON-NLS-1$
                consumeInvalidEnumDeclaration();
                break;

            case 379:   // $NON-NLS-1$
                consumeLocalVariableDeclarationStatement();
                break;

            case 380:   // $NON-NLS-1$
                consumeLocalVariableDeclaration();
                break;

            case 381:   // $NON-NLS-1$
                consumeLocalVariableDeclaration();
                break;

            case 382:   // $NON-NLS-1$
                consumePushModifiers();
                break;

            case 383:   // $NON-NLS-1$
                consumePushModifiersForHeader();
                break;

            case 384:   // $NON-NLS-1$
                consumePushRealModifiers();
                break;

            case 412:   // $NON-NLS-1$
                consumeEmptyStatement();
                break;

            case 413:   // $NON-NLS-1$
                consumeStatementLabel();
                break;

            case 414:   // $NON-NLS-1$
                consumeStatementLabel();
                break;

            case 415:   // $NON-NLS-1$

                break;

            case 416:   // $NON-NLS-1$
                consumeExpressionStatement();
                break;

            case 425:   // $NON-NLS-1$

                break;

            case 426:   // $NON-NLS-1$

                break;

            case 427:   // $NON-NLS-1$

                break;

            case 428:   // $NON-NLS-1$

                break;

            case 429:   // $NON-NLS-1$
                consumeStatementIfNoElse();
                break;

            case 430:   // $NON-NLS-1$
                consumeStatementIfWithElse();
                break;

            case 431:   // $NON-NLS-1$
                consumeStatementIfWithElse();
                break;

            case 432:   // $NON-NLS-1$
                consumeSwitchStatementOrExpression(true);
                break;

            case 433:   // $NON-NLS-1$
                consumeSwitchBlock(false);
                break;

            case 436:   // $NON-NLS-1$
                consumeSwitchBlock(true);
                break;

            case 438:   // $NON-NLS-1$
                consumeSwitchBlockStatements();
                break;

            case 440:   // $NON-NLS-1$
                consumeSwitchBlockStatement();
                break;

            case 441:   // $NON-NLS-1$
                consumeSwitchLabels(false, false);
                break;

            case 442:   // $NON-NLS-1$
                consumeSwitchLabels(true, false);
                break;

            case 443:   // $NON-NLS-1$
                consumeSwitchLabels(false, true);
                break;

            case 445:   // $NON-NLS-1$
                consumeDefaultLabel();
                break;

            case 448:   // $NON-NLS-1$
                consumeSwitchStatementOrExpression(false);
                break;

            case 449:   // $NON-NLS-1$
                consumeSwitchRule(SwitchRuleKind.EXPRESSION);
                break;

            case 450:   // $NON-NLS-1$
                consumeSwitchRule(SwitchRuleKind.BLOCK);
                break;

            case 451:   // $NON-NLS-1$
                consumeSwitchRule(SwitchRuleKind.THROW);
                break;

            case 453:   // $NON-NLS-1$
                consumeCaseLabelElements();
                break;

            case 454:   // $NON-NLS-1$
                consumeCaseLabelElement(CaseLabelKind.CASE_EXPRESSION);
                break;

            case 455:   // $NON-NLS-1$
                consumeCaseLabelElement(CaseLabelKind.CASE_DEFAULT);
                break;

            case 456:   // $NON-NLS-1$
                consumeCaseLabelElement(CaseLabelKind.CASE_PATTERN);
                break;

            case 457:   // $NON-NLS-1$
                consumeCaseLabelElement(CaseLabelKind.CASE_PATTERN);
                break;

            case 459:   // $NON-NLS-1$
                consumeGuard();
                break;

            case 460:   // $NON-NLS-1$
                consumeStatementYield();
                break;

            case 461:   // $NON-NLS-1$
                consumeStatementWhile();
                break;

            case 462:   // $NON-NLS-1$
                consumeStatementWhile();
                break;

            case 463:   // $NON-NLS-1$
                consumeStatementDo();
                break;

            case 464:   // $NON-NLS-1$
                consumeStatementFor();
                break;

            case 465:   // $NON-NLS-1$
                consumeStatementFor();
                break;

            case 466:   // $NON-NLS-1$
                consumeForInit();
                break;

            case 470:   // $NON-NLS-1$
                consumeStatementExpressionList();
                break;

            case 471:   // $NON-NLS-1$
                consumeSimpleAssertStatement();
                break;

            case 472:   // $NON-NLS-1$
                consumeAssertStatement();
                break;

            case 473:   // $NON-NLS-1$
                consumeStatementBreak();
                break;

            case 474:   // $NON-NLS-1$
                consumeStatementBreakWithLabel();
                break;

            case 475:   // $NON-NLS-1$
                consumeStatementContinue();
                break;

            case 476:   // $NON-NLS-1$
                consumeStatementContinueWithLabel();
                break;

            case 477:   // $NON-NLS-1$
                consumeStatementReturn();
                break;

            case 478:   // $NON-NLS-1$
                consumeStatementThrow();
                break;

            case 479:   // $NON-NLS-1$
                consumeStatementSynchronized();
                break;

            case 480:   // $NON-NLS-1$
                consumeOnlySynchronized();
                break;

            case 481:   // $NON-NLS-1$
                consumeStatementTry(false, false);
                break;

            case 482:   // $NON-NLS-1$
                consumeStatementTry(true, false);
                break;

            case 483:   // $NON-NLS-1$
                consumeStatementTry(false, true);
                break;

            case 484:   // $NON-NLS-1$
                consumeStatementTry(true, true);
                break;

            case 485:   // $NON-NLS-1$

                break;

            case 486:   // $NON-NLS-1$
                consumeResourceOptionalTrailingSemiColon(false);
                break;

            case 487:   // $NON-NLS-1$
                consumeResourceOptionalTrailingSemiColon(true);
                break;

            case 488:   // $NON-NLS-1$

                break;

            case 489:   // $NON-NLS-1$
                consumeMultipleResources();
                break;

            case 490:   // $NON-NLS-1$
                consumeResourceOptionalTrailingSemiColon(true);
                break;

            case 491:   // $NON-NLS-1$
                consumeResourceAsLocalVariableDeclaration();
                break;

            case 492:   // $NON-NLS-1$
                consumeResourceAsLocalVariableDeclaration();
                break;

            case 493:   // $NON-NLS-1$
                consumeResourceAsLocalVariable();
                break;

            case 494:   // $NON-NLS-1$
                consumeResourceAsThis();
                break;

            case 495:   // $NON-NLS-1$
                consumeResourceAsFieldAccess();
                break;

            case 497:   // $NON-NLS-1$
                consumeExitTryBlock();
                break;

            case 499:   // $NON-NLS-1$
                consumeCatches();
                break;

            case 500:   // $NON-NLS-1$
                consumeStatementCatch();
                break;

            case 502:   // $NON-NLS-1$
                consumeLeftParen();
                break;

            case 503:   // $NON-NLS-1$
                consumeRightParen();
                break;

            case 508:   // $NON-NLS-1$
                consumePrimaryNoNewArrayThis();
                break;

            case 509:   // $NON-NLS-1$
                consumePrimaryNoNewArray();
                break;

            case 510:   // $NON-NLS-1$
                consumePrimaryNoNewArrayWithName();
                break;

            case 513:   // $NON-NLS-1$
                consumePrimaryNoNewArrayNameThis();
                break;

            case 514:   // $NON-NLS-1$
                consumeQualifiedSuperReceiver();
                break;

            case 515:   // $NON-NLS-1$
                consumePrimaryNoNewArrayName();
                break;

            case 516:   // $NON-NLS-1$
                consumePrimaryNoNewArrayArrayType();
                break;

            case 517:   // $NON-NLS-1$
                consumePrimaryNoNewArrayPrimitiveArrayType();
                break;

            case 518:   // $NON-NLS-1$
                consumePrimaryNoNewArrayPrimitiveType();
                break;

            case 523:   // $NON-NLS-1$
                consumeReferenceExpressionTypeArgumentsAndTrunk(false);
                break;

            case 524:   // $NON-NLS-1$
                consumeReferenceExpressionTypeArgumentsAndTrunk(true);
                break;

            case 525:   // $NON-NLS-1$
                consumeReferenceExpressionTypeForm(true);
                break;

            case 526:   // $NON-NLS-1$
                consumeReferenceExpressionTypeForm(false);
                break;

            case 527:   // $NON-NLS-1$
                consumeReferenceExpressionGenericTypeForm();
                break;

            case 528:   // $NON-NLS-1$
                consumeReferenceExpressionPrimaryForm();
                break;

            case 529:   // $NON-NLS-1$
                consumeReferenceExpressionPrimaryForm();
                break;

            case 530:   // $NON-NLS-1$
                consumeReferenceExpressionSuperForm();
                break;

            case 531:   // $NON-NLS-1$
                consumeEmptyTypeArguments();
                break;

            case 533:   // $NON-NLS-1$
                consumeIdentifierOrNew(false);
                break;

            case 534:   // $NON-NLS-1$
                consumeIdentifierOrNew(true);
                break;

            case 535:   // $NON-NLS-1$
                consumeLambdaExpression();
                break;

            case 536:   // $NON-NLS-1$
                consumeNestedLambda();
                break;

            case 537:   // $NON-NLS-1$
                consumeTypeElidedLambdaParameter(false);
                break;

            case 538:   // $NON-NLS-1$
                consumeTypeElidedLambdaParameter(false);
                break;

            case 544:   // $NON-NLS-1$
                consumeSingleVariableDeclaratorList();
                break;

            case 545:   // $NON-NLS-1$
                consumeTypeElidedLambdaParameter(true);
                break;

            case 546:   // $NON-NLS-1$
                consumeBracketedTypeElidedUnderscoreLambdaParameter();
                break;

            case 547:   // $NON-NLS-1$
                consumeLambdaBodyExpression();
                break;

            case 549:   // $NON-NLS-1$
                consumeAllocationHeader();
                break;

            case 550:   // $NON-NLS-1$
                consumeClassInstanceCreationExpressionWithTypeArguments();
                break;

            case 551:   // $NON-NLS-1$
                consumeClassInstanceCreationExpression();
                break;

            case 552:   // $NON-NLS-1$
                consumeClassInstanceCreationExpressionQualifiedWithTypeArguments();
                break;

            case 553:   // $NON-NLS-1$
                consumeClassInstanceCreationExpressionQualified();
                break;

            case 554:   // $NON-NLS-1$
                consumeClassInstanceCreationExpressionQualified();
                break;

            case 555:   // $NON-NLS-1$
                consumeClassInstanceCreationExpressionQualifiedWithTypeArguments();
                break;

            case 556:   // $NON-NLS-1$

                break;

            case 557:   // $NON-NLS-1$
                consumeClassInstanceCreationExpressionName();
                break;

            case 558:   // $NON-NLS-1$
                consumeClassBodyopt();
                break;

            case 560:   // $NON-NLS-1$
                consumeEnterAnonymousClassBody(false);
                break;

            case 561:   // $NON-NLS-1$
                consumeClassBodyopt();
                break;

            case 563:   // $NON-NLS-1$
                consumeEnterAnonymousClassBody(true);
                break;

            case 565:   // $NON-NLS-1$
                consumeArgumentList();
                break;

            case 566:   // $NON-NLS-1$

                break;

            case 567:   // $NON-NLS-1$

                break;

            case 568:   // $NON-NLS-1$
                consumeArrayCreationExpressionWithoutInitializer();
                break;

            case 569:   // $NON-NLS-1$
                consumeArrayCreationExpressionWithInitializer();
                break;

            case 570:   // $NON-NLS-1$
                consumeArrayCreationExpressionWithoutInitializer();
                break;

            case 571:   // $NON-NLS-1$
                consumeArrayCreationExpressionWithInitializer();
                break;

            case 573:   // $NON-NLS-1$
                consumeDimWithOrWithOutExprs();
                break;

            case 575:   // $NON-NLS-1$
                consumeDimWithOrWithOutExpr();
                break;

            case 576:   // $NON-NLS-1$
                consumeDims();
                break;

            case 579:   // $NON-NLS-1$
                consumeOneDimLoop(false);
                break;

            case 580:   // $NON-NLS-1$
                consumeOneDimLoop(true);
                break;

            case 581:   // $NON-NLS-1$
                consumeFieldAccess(false);
                break;

            case 582:   // $NON-NLS-1$
                consumeFieldAccess(true);
                break;

            case 583:   // $NON-NLS-1$
                consumeFieldAccess(false);
                break;

            case 584:   // $NON-NLS-1$
                consumeMethodInvocationName();
                break;

            case 585:   // $NON-NLS-1$
                consumeMethodInvocationNameWithTypeArguments();
                break;

            case 586:   // $NON-NLS-1$
                consumeMethodInvocationPrimaryWithTypeArguments();
                break;

            case 587:   // $NON-NLS-1$
                consumeMethodInvocationPrimary();
                break;

            case 588:   // $NON-NLS-1$
                consumeMethodInvocationPrimary();
                break;

            case 589:   // $NON-NLS-1$
                consumeMethodInvocationPrimaryWithTypeArguments();
                break;

            case 590:   // $NON-NLS-1$
                consumeMethodInvocationSuperWithTypeArguments();
                break;

            case 591:   // $NON-NLS-1$
                consumeMethodInvocationSuper();
                break;

            case 592:   // $NON-NLS-1$
                consumeArrayAccess(true);
                break;

            case 593:   // $NON-NLS-1$
                consumeArrayAccess(false);
                break;

            case 594:   // $NON-NLS-1$
                consumeArrayAccess(false);
                break;

            case 596:   // $NON-NLS-1$
                consumePostfixExpression();
                break;

            case 599:   // $NON-NLS-1$
                consumeUnaryExpression(14, true);
                break;

            case 600:   // $NON-NLS-1$
                consumeUnaryExpression(13, true);
                break;

            case 601:   // $NON-NLS-1$
                consumePushPosition();
                break;

            case 604:   // $NON-NLS-1$
                consumeUnaryExpression(14);
                break;

            case 605:   // $NON-NLS-1$
                consumeUnaryExpression(13);
                break;

            case 607:   // $NON-NLS-1$
                consumeUnaryExpression(14, false);
                break;

            case 608:   // $NON-NLS-1$
                consumeUnaryExpression(13, false);
                break;

            case 610:   // $NON-NLS-1$
                consumeUnaryExpression(12);
                break;

            case 611:   // $NON-NLS-1$
                consumeUnaryExpression(11);
                break;

            case 613:   // $NON-NLS-1$
                consumeCastExpressionWithPrimitiveType();
                break;

            case 614:   // $NON-NLS-1$
                consumeCastExpressionWithGenericsArray();
                break;

            case 615:   // $NON-NLS-1$
                consumeCastExpressionWithQualifiedGenericsArray();
                break;

            case 616:   // $NON-NLS-1$
                consumeCastExpressionLL1();
                break;

            case 617:   // $NON-NLS-1$
                consumeCastExpressionLL1WithBounds();
                break;

            case 618:   // $NON-NLS-1$
                consumeCastExpressionWithNameArray();
                break;

            case 619:   // $NON-NLS-1$
                consumeCastExpressionWithGenericsArray();
                break;

            case 620:   // $NON-NLS-1$
                consumeCastExpressionWithQualifiedGenericsArray();
                break;

            case 621:   // $NON-NLS-1$
                consumeCastExpressionLL1();
                break;

            case 622:   // $NON-NLS-1$
                consumeCastExpressionLL1WithBounds();
                break;

            case 623:   // $NON-NLS-1$
                consumeCastExpressionWithNameArray();
                break;

            case 624:   // $NON-NLS-1$
                consumeZeroAdditionalBounds();
                break;

            case 628:   // $NON-NLS-1$

                break;

            case 629:   // $NON-NLS-1$

                break;

            case 630:   // $NON-NLS-1$
                consumeInsideCastExpressionLL1();
                break;

            case 631:   // $NON-NLS-1$
                consumeInsideCastExpressionLL1WithBounds();
                break;

            case 632:   // $NON-NLS-1$

                break;

            case 634:   // $NON-NLS-1$
                consumeBinaryExpression(15);
                break;

            case 635:   // $NON-NLS-1$
                consumeBinaryExpression(9);
                break;

            case 636:   // $NON-NLS-1$
                consumeBinaryExpression(16);
                break;

            case 638:   // $NON-NLS-1$
                consumeBinaryExpression(14);
                break;

            case 639:   // $NON-NLS-1$
                consumeBinaryExpression(13);
                break;

            case 641:   // $NON-NLS-1$
                consumeBinaryExpression(10);
                break;

            case 642:   // $NON-NLS-1$
                consumeBinaryExpression(17);
                break;

            case 643:   // $NON-NLS-1$
                consumeBinaryExpression(19);
                break;

            case 645:   // $NON-NLS-1$
                consumeBinaryExpression(4);
                break;

            case 646:   // $NON-NLS-1$
                consumeBinaryExpression(6);
                break;

            case 647:   // $NON-NLS-1$
                consumeBinaryExpression(5);
                break;

            case 648:   // $NON-NLS-1$
                consumeBinaryExpression(7);
                break;

            case 650:   // $NON-NLS-1$
                consumeEqualityExpression(18);
                break;

            case 651:   // $NON-NLS-1$
                consumeEqualityExpression(20);
                break;

            case 653:   // $NON-NLS-1$
                consumeBinaryExpression(2);
                break;

            case 655:   // $NON-NLS-1$
                consumeBinaryExpression(8);
                break;

            case 657:   // $NON-NLS-1$
                consumeBinaryExpression(3);
                break;

            case 659:   // $NON-NLS-1$
                consumeBinaryExpression(0);
                break;

            case 661:   // $NON-NLS-1$
                consumeBinaryExpression(1);
                break;

            case 663:   // $NON-NLS-1$
                consumeConditionalExpression();
                break;

            case 664:   // $NON-NLS-1$
                consumeConditionalExpression();
                break;

            case 667:   // $NON-NLS-1$
                consumeAssignment();
                break;

            case 669:   // $NON-NLS-1$
                ignoreExpressionAssignment();
                break;

            case 670:   // $NON-NLS-1$
                consumeAssignmentOperator(21);
                break;

            case 671:   // $NON-NLS-1$
                consumeAssignmentOperator(15);
                break;

            case 672:   // $NON-NLS-1$
                consumeAssignmentOperator(9);
                break;

            case 673:   // $NON-NLS-1$
                consumeAssignmentOperator(16);
                break;

            case 674:   // $NON-NLS-1$
                consumeAssignmentOperator(14);
                break;

            case 675:   // $NON-NLS-1$
                consumeAssignmentOperator(13);
                break;

            case 676:   // $NON-NLS-1$
                consumeAssignmentOperator(10);
                break;

            case 677:   // $NON-NLS-1$
                consumeAssignmentOperator(17);
                break;

            case 678:   // $NON-NLS-1$
                consumeAssignmentOperator(19);
                break;

            case 679:   // $NON-NLS-1$
                consumeAssignmentOperator(2);
                break;

            case 680:   // $NON-NLS-1$
                consumeAssignmentOperator(8);
                break;

            case 681:   // $NON-NLS-1$
                consumeAssignmentOperator(3);
                break;

            case 688:   // $NON-NLS-1$
                consumeEmptyExpression();
                break;

            case 693:   // $NON-NLS-1$
                consumeEmptyClassBodyDeclarationsopt();
                break;

            case 694:   // $NON-NLS-1$
                consumeClassBodyDeclarationsopt();
                break;

            case 695:   // $NON-NLS-1$
                consumeDefaultModifiers();
                break;

            case 696:   // $NON-NLS-1$
                consumeModifiers();
                break;

            case 697:   // $NON-NLS-1$
                consumeEmptyBlockStatementsopt();
                break;

            case 699:   // $NON-NLS-1$
                consumeEmptyDimsopt();
                break;

            case 701:   // $NON-NLS-1$
                consumeEmptyArgumentListopt();
                break;

            case 705:   // $NON-NLS-1$
                consumeFormalParameterListopt();
                break;

            case 711:   // $NON-NLS-1$
                consumePermittedTypes();
                break;

            case 712:   // $NON-NLS-1$
                consumeEmptyInterfaceMemberDeclarationsopt();
                break;

            case 713:   // $NON-NLS-1$
                consumeInterfaceMemberDeclarationsopt();
                break;

            case 714:   // $NON-NLS-1$
                consumeNestedType();
                break;

            case 715:   // $NON-NLS-1$
                consumeEmptyForInitopt();
                break;

            case 717:   // $NON-NLS-1$
                consumeEmptyForUpdateopt();
                break;

            case 721:   // $NON-NLS-1$
                consumeEmptyCatchesopt();
                break;

            case 723:   // $NON-NLS-1$
                consumeEnumDeclaration();
                break;

            case 724:   // $NON-NLS-1$
                consumeEnumHeader();
                break;

            case 725:   // $NON-NLS-1$
                consumeEnumHeaderName();
                break;

            case 726:   // $NON-NLS-1$
                consumeEnumHeaderNameWithTypeParameters();
                break;

            case 727:   // $NON-NLS-1$

                break;

            case 728:   // $NON-NLS-1$

                break;

            case 729:   // $NON-NLS-1$
                consumeEnumBodyWithConstants();
                break;

            case 730:   // $NON-NLS-1$
                consumeEnumBodyWithConstants();
                break;

            case 732:   // $NON-NLS-1$
                consumeEnumConstants();
                break;

            case 733:   // $NON-NLS-1$
                consumeEnumConstantHeaderName();
                break;

            case 734:   // $NON-NLS-1$
                consumeEnumConstantHeader();
                break;

            case 735:   // $NON-NLS-1$
                consumeEnumConstantWithClassBody();
                break;

            case 736:   // $NON-NLS-1$
                consumeEnumConstantNoClassBody();
                break;

            case 737:   // $NON-NLS-1$
                consumeArguments();
                break;

            case 738:   // $NON-NLS-1$
                consumeEmptyArguments();
                break;

            case 740:   // $NON-NLS-1$

                break;

            case 741:   // $NON-NLS-1$
                consumeEmptyEnumDeclarations();
                break;

            case 743:   // $NON-NLS-1$
                consumeEnhancedForStatement();
                break;

            case 744:   // $NON-NLS-1$
                consumeEnhancedForStatement();
                break;

            case 745:   // $NON-NLS-1$
                consumeEnhancedForStatementHeaderInit(false);
                break;

            case 746:   // $NON-NLS-1$
                consumeEnhancedForStatementHeaderInit(true);
                break;

            case 747:   // $NON-NLS-1$
                consumeEnhancedForStatementHeader();
                break;

            case 748:   // $NON-NLS-1$
                consumeImportDeclaration();
                break;

            case 749:   // $NON-NLS-1$
                consumeSingleStaticImportDeclarationName();
                break;

            case 750:   // $NON-NLS-1$
                consumeImportDeclaration();
                break;

            case 751:   // $NON-NLS-1$
                consumeStaticImportOnDemandDeclarationName();
                break;

            case 753:   // $NON-NLS-1$
                consumeImportDeclaration();
                break;

            case 754:   // $NON-NLS-1$
                consumeSingleModuleImportDeclarationName();
                break;

            case 755:   // $NON-NLS-1$
                consumeTypeArguments();
                break;

            case 756:   // $NON-NLS-1$

                break;

            case 758:   // $NON-NLS-1$
                consumeTypeArgumentList1();
                break;

            case 760:   // $NON-NLS-1$
                consumeTypeArgumentList();
                break;

            case 761:   // $NON-NLS-1$
                consumeTypeArgument();
                break;

            case 765:   // $NON-NLS-1$
                consumeReferenceType1();
                break;

            case 766:   // $NON-NLS-1$
                consumeTypeArgumentReferenceType1();
                break;

            case 768:   // $NON-NLS-1$
                consumeTypeArgumentList2();
                break;

            case 771:   // $NON-NLS-1$
                consumeReferenceType2();
                break;

            case 772:   // $NON-NLS-1$
                consumeTypeArgumentReferenceType2();
                break;

            case 774:   // $NON-NLS-1$
                consumeTypeArgumentList3();
                break;

            case 777:   // $NON-NLS-1$
                consumeReferenceType3();
                break;

            case 778:   // $NON-NLS-1$
                consumeWildcard();
                break;

            case 779:   // $NON-NLS-1$

                break;

            case 780:   // $NON-NLS-1$
                consumeWildcardBoundsExtends();
                break;

            case 781:   // $NON-NLS-1$
                consumeWildcardBoundsSuper();
                break;

            case 782:   // $NON-NLS-1$
                consumeWildcard1();
                break;

            case 783:   // $NON-NLS-1$

                break;

            case 784:   // $NON-NLS-1$
                consumeWildcardBounds1Extends();
                break;

            case 785:   // $NON-NLS-1$
                consumeWildcardBounds1Super();
                break;

            case 786:   // $NON-NLS-1$
                consumeWildcard2();
                break;

            case 787:   // $NON-NLS-1$

                break;

            case 788:   // $NON-NLS-1$
                consumeWildcardBounds2Extends();
                break;

            case 789:   // $NON-NLS-1$
                consumeWildcardBounds2Super();
                break;

            case 790:   // $NON-NLS-1$
                consumeWildcard3();
                break;

            case 791:   // $NON-NLS-1$

                break;

            case 792:   // $NON-NLS-1$
                consumeWildcardBounds3Extends();
                break;

            case 793:   // $NON-NLS-1$
                consumeWildcardBounds3Super();
                break;

            case 794:   // $NON-NLS-1$
                consumeTypeParameterHeader();
                break;

            case 795:   // $NON-NLS-1$
                consumeTypeParameters();
                break;

            case 797:   // $NON-NLS-1$
                consumeTypeParameterList();
                break;

            case 799:   // $NON-NLS-1$
                consumeTypeParameterWithExtends();
                break;

            case 800:   // $NON-NLS-1$
                consumeTypeParameterWithExtendsAndBounds();
                break;

            case 802:   // $NON-NLS-1$
                consumeAdditionalBoundList();
                break;

            case 803:   // $NON-NLS-1$
                consumeAdditionalBound();
                break;

            case 805:   // $NON-NLS-1$
                consumeTypeParameterList1();
                break;

            case 806:   // $NON-NLS-1$

                break;

            case 807:   // $NON-NLS-1$
                consumeTypeParameter1WithExtends();
                break;

            case 808:   // $NON-NLS-1$
                consumeTypeParameter1WithExtendsAndBounds();
                break;

            case 810:   // $NON-NLS-1$
                consumeAdditionalBoundList1();
                break;

            case 811:   // $NON-NLS-1$

                break;

            case 817:   // $NON-NLS-1$
                consumeUnaryExpression(14);
                break;

            case 818:   // $NON-NLS-1$
                consumeUnaryExpression(13);
                break;

            case 821:   // $NON-NLS-1$
                consumeUnaryExpression(12);
                break;

            case 822:   // $NON-NLS-1$
                consumeUnaryExpression(11);
                break;

            case 825:   // $NON-NLS-1$
                consumeBinaryExpression(15);
                break;

            case 826:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(15);
                break;

            case 827:   // $NON-NLS-1$
                consumeBinaryExpression(9);
                break;

            case 828:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(9);
                break;

            case 829:   // $NON-NLS-1$
                consumeBinaryExpression(16);
                break;

            case 830:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(16);
                break;

            case 832:   // $NON-NLS-1$
                consumeBinaryExpression(14);
                break;

            case 833:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(14);
                break;

            case 834:   // $NON-NLS-1$
                consumeBinaryExpression(13);
                break;

            case 835:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(13);
                break;

            case 837:   // $NON-NLS-1$
                consumeBinaryExpression(10);
                break;

            case 838:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(10);
                break;

            case 839:   // $NON-NLS-1$
                consumeBinaryExpression(17);
                break;

            case 840:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(17);
                break;

            case 841:   // $NON-NLS-1$
                consumeBinaryExpression(19);
                break;

            case 842:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(19);
                break;

            case 844:   // $NON-NLS-1$
                consumeBinaryExpression(4);
                break;

            case 845:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(4);
                break;

            case 846:   // $NON-NLS-1$
                consumeBinaryExpression(6);
                break;

            case 847:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(6);
                break;

            case 848:   // $NON-NLS-1$
                consumeBinaryExpression(5);
                break;

            case 849:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(5);
                break;

            case 850:   // $NON-NLS-1$
                consumeBinaryExpression(7);
                break;

            case 851:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(7);
                break;

            case 853:   // $NON-NLS-1$
                consumeInstanceOfExpressionWithName();
                break;

            case 854:   // $NON-NLS-1$
                consumeInstanceOfExpression();
                break;

            case 856:   // $NON-NLS-1$
                consumeEqualityExpression(18);
                break;

            case 857:   // $NON-NLS-1$
                consumeEqualityExpressionWithName(18);
                break;

            case 858:   // $NON-NLS-1$
                consumeEqualityExpression(20);
                break;

            case 859:   // $NON-NLS-1$
                consumeEqualityExpressionWithName(20);
                break;

            case 861:   // $NON-NLS-1$
                consumeBinaryExpression(2);
                break;

            case 862:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(2);
                break;

            case 864:   // $NON-NLS-1$
                consumeBinaryExpression(8);
                break;

            case 865:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(8);
                break;

            case 867:   // $NON-NLS-1$
                consumeBinaryExpression(3);
                break;

            case 868:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(3);
                break;

            case 870:   // $NON-NLS-1$
                consumeBinaryExpression(0);
                break;

            case 871:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(0);
                break;

            case 873:   // $NON-NLS-1$
                consumeBinaryExpression(1);
                break;

            case 874:   // $NON-NLS-1$
                consumeBinaryExpressionWithName(1);
                break;

            case 876:   // $NON-NLS-1$
                consumeConditionalExpression();
                break;

            case 877:   // $NON-NLS-1$
                consumeConditionalExpression();
                break;

            case 878:   // $NON-NLS-1$
                consumeConditionalExpressionWithName();
                break;

            case 879:   // $NON-NLS-1$
                consumeConditionalExpressionWithName();
                break;

            case 884:   // $NON-NLS-1$
                consumeAnnotationTypeDeclarationHeaderName();
                break;

            case 885:   // $NON-NLS-1$
                consumeAnnotationTypeDeclarationHeaderNameWithTypeParameters();
                break;

            case 886:   // $NON-NLS-1$
                consumeAnnotationTypeDeclarationHeaderNameWithTypeParameters();
                break;

            case 887:   // $NON-NLS-1$
                consumeAnnotationTypeDeclarationHeaderName();
                break;

            case 888:   // $NON-NLS-1$
                consumeAnnotationTypeDeclarationHeader();
                break;

            case 889:   // $NON-NLS-1$
                consumeAnnotationTypeDeclaration();
                break;

            case 891:   // $NON-NLS-1$
                consumeEmptyAnnotationTypeMemberDeclarationsopt();
                break;

            case 892:   // $NON-NLS-1$
                consumeAnnotationTypeMemberDeclarationsopt();
                break;

            case 894:   // $NON-NLS-1$
                consumeAnnotationTypeMemberDeclarations();
                break;

            case 895:   // $NON-NLS-1$
                consumeMethodHeaderNameWithTypeParameters(true);
                break;

            case 896:   // $NON-NLS-1$
                consumeMethodHeaderName(true);
                break;

            case 897:   // $NON-NLS-1$
                consumeEmptyMethodHeaderDefaultValue();
                break;

            case 898:   // $NON-NLS-1$
                consumeMethodHeaderDefaultValue();
                break;

            case 899:   // $NON-NLS-1$
                consumeMethodHeader();
                break;

            case 900:   // $NON-NLS-1$
                consumeAnnotationTypeMemberDeclaration();
                break;

            case 908:   // $NON-NLS-1$
                consumeAnnotationName();
                break;

            case 909:   // $NON-NLS-1$
                consumeNormalAnnotation(false);
                break;

            case 910:   // $NON-NLS-1$
                consumeEmptyMemberValuePairsopt();
                break;

            case 913:   // $NON-NLS-1$
                consumeMemberValuePairs();
                break;

            case 914:   // $NON-NLS-1$
                consumeMemberValuePair();
                break;

            case 915:   // $NON-NLS-1$
                consumeEnterMemberValue();
                break;

            case 916:   // $NON-NLS-1$
                consumeExitMemberValue();
                break;

            case 918:   // $NON-NLS-1$
                consumeMemberValueAsName();
                break;

            case 921:   // $NON-NLS-1$
                consumeMemberValueArrayInitializer();
                break;

            case 922:   // $NON-NLS-1$
                consumeMemberValueArrayInitializer();
                break;

            case 923:   // $NON-NLS-1$
                consumeEmptyMemberValueArrayInitializer();
                break;

            case 924:   // $NON-NLS-1$
                consumeEmptyMemberValueArrayInitializer();
                break;

            case 925:   // $NON-NLS-1$
                consumeEnterMemberValueArrayInitializer();
                break;

            case 927:   // $NON-NLS-1$
                consumeMemberValues();
                break;

            case 928:   // $NON-NLS-1$
                consumeMarkerAnnotation(false);
                break;

            case 929:   // $NON-NLS-1$
                consumeSingleMemberAnnotationMemberValue();
                break;

            case 930:   // $NON-NLS-1$
                consumeSingleMemberAnnotation(false);
                break;

            case 931:   // $NON-NLS-1$
                consumeRecoveryMethodHeaderNameWithTypeParameters();
                break;

            case 932:   // $NON-NLS-1$
                consumeRecoveryMethodHeaderName();
                break;

            case 933:   // $NON-NLS-1$
                consumeRecoveryMethodHeaderNameWithTypeParameters();
                break;

            case 934:   // $NON-NLS-1$
                consumeRecoveryMethodHeaderName();
                break;

            case 935:   // $NON-NLS-1$
                consumeMethodHeader();
                break;

            case 936:   // $NON-NLS-1$
                consumeMethodHeader();
                break;

        }
    }

    protected void consumeVariableDeclaratorIdParameter() {
        pushOnIntStack(1);  // signal "normal" variable declarator id parameter.
    }

    protected void consumeExplicitThisParameter(boolean isQualified) {
        // VariableDeclaratorIdOrThis ::= 'this'
        // VariableDeclaratorIdOrThis ::= UnannotatableName '.' 'this'
        // VariableDeclaratorIdOrThis ::= VariableDeclaratorId

        NameReference qualifyingNameReference = null;
        if (isQualified) {
            qualifyingNameReference = getUnspecifiedReference(false); // By construction the qualified name is
                                                                      // unannotated here, so we should not meddle with
                                                                      // the type annotation stack
        }
        pushOnExpressionStack(qualifyingNameReference);
        int thisStart = this.intStack[this.intPtr--];
        pushIdentifier(ClassFileConstants.This, (((long) thisStart << 32)) + (thisStart + 3));
        pushOnIntStack(0);  // extended dimensions ...
        pushOnIntStack(0);  // signal explicit this
    }

    protected void consumeNestedLambda() {
        // NestedLambda ::= $empty - we get here just after the type+parenthesis elided singleton parameter or just
        // before the '(' of the parameter list.
        consumeNestedType();
        this.nestedMethod[this.nestedType]++;
        LambdaExpression lambda = new LambdaExpression(this.compilationUnit.compilationResult);
        pushOnAstStack(lambda);
        this.processingLambdaParameterList = true;
    }

    protected void consumeLambdaHeader() {
        // LambdaHeader ::= LambdaParameters '->' Synthetic/fake production with a synthetic non-terminal. Body not seen
        // yet.

        int arrowPosition = this.scanner.currentPosition - 1;

        Argument[] arguments = null;
        int length = this.astLengthStack[this.astLengthPtr--];
        this.astPtr -= length;
        // arguments
        if (length != 0) {
            System.arraycopy(this.astStack, this.astPtr + 1, arguments = new Argument[length], 0, length);
        }
        for (int i = 0; i < length; i++) {
            final Argument argument = arguments[i];
            if (argument.isReceiver()) {
                problemReporter().illegalThis(argument);
            }
            if (!JavaFeature.UNNAMMED_PATTERNS_AND_VARS.isSupported(this.options)
                && argument.name.length == 1
                && argument.name[0] == '_')
                problemReporter().illegalUseOfUnderscoreAsAnIdentifier(argument.sourceStart, argument.sourceEnd, true); // true
                                                                                                                        // ==
                                                                                                                        // lambdaParameter
        }
        LambdaExpression lexp = (LambdaExpression) this.astStack[this.astPtr];
        lexp.setArguments(arguments);

        lexp.sourceEnd = this.intStack[this.intPtr--];   // ')' position or identifier position.
        lexp.sourceStart = this.intStack[this.intPtr--]; // '(' position or identifier position.
        lexp.hasParentheses = (this.scanner.getSource()[lexp.sourceStart] == '(');
        this.listLength -= arguments == null ? 0 : arguments.length;  // not necessary really.
        this.processingLambdaParameterList = false;
        if (this.currentElement != null) {
            this.lastCheckPoint = arrowPosition + 1; // we don't want the typed formal parameters to be processed by
                                                     // recovery.
            this.currentElement.lambdaNestLevel++;
        }
    }

    protected void consumeLambdaExpression() {

        // LambdaExpression ::= LambdaHeader LambdaBody

        this.nestedType--;

        this.astLengthPtr--; 	// pop length for LambdaBody (always 1)
        Statement body = (Statement) this.astStack[this.astPtr--];
        if (body instanceof Block) {
            if (this.options.ignoreMethodBodies) {
                Statement oldBody = body;
                body = new Block(0);
                body.sourceStart = oldBody.sourceStart;
                body.sourceEnd = oldBody.sourceEnd;
            }
        }

        LambdaExpression lexp = (LambdaExpression) this.astStack[this.astPtr--];
        this.astLengthPtr--;
        lexp.setBody(body);
        lexp.sourceEnd = body.sourceEnd;

        if (body instanceof Expression expression && expression.isTrulyExpression()) {
            expression.statementEnd = body.sourceEnd;
        }
        pushOnExpressionStack(lexp);
        if (this.currentElement != null) {
            this.lastCheckPoint = body.sourceEnd + 1;
            this.currentElement.lambdaNestLevel--;
        }
        markEnclosingMemberWithLocalOrFunctionalType(LocalTypeKind.LAMBDA);
    }

    /*
     * Stash away a copy of the textual representation of the functional expression to facilitate virgin copy
     * construction by reparse. This deep copy may be replaced by a shallow copy by LE.copy() or RE.copy where feasible.
     */
    protected Argument typeElidedArgument() {
        this.identifierLengthPtr--;
        char[] identifierName = this.identifierStack[this.identifierPtr];
        long namePositions = this.identifierPositionStack[this.identifierPtr--];

        Argument arg = new Argument(identifierName, namePositions);
        arg.declarationSourceStart = (int) (namePositions >>> 32);
        return arg;
    }

    protected void consumeTypeElidedLambdaParameter(boolean parenthesized) {

        // LambdaParameters ::= Identifier
        // TypeElidedFormalParameter ::= Modifiersopt Identifier

        int modifier = 0;
        int annotationLength = 0;
        int modifiersStart = 0;
        if (parenthesized) { // The grammar is permissive enough to allow optional modifiers for the parenthesized
                             // version, they should be rejected if present.
            modifiersStart = this.intStack[this.intPtr--];
            modifier = this.intStack[this.intPtr--];
            // pop annotations
            annotationLength = this.expressionLengthStack[this.expressionLengthPtr--];
            this.expressionPtr -= annotationLength;
        }

        Argument arg = typeElidedArgument();
        if (modifier != 0 || annotationLength != 0) {
            problemReporter().illegalModifiersForElidedType(arg);
            arg.declarationSourceStart = modifiersStart;
        }
        if (!parenthesized) { // in the absence of '(' and ')', record positions.
            pushOnIntStack(arg.declarationSourceStart);
            pushOnIntStack(arg.declarationSourceEnd);
        }
        pushOnAstStack(arg);
        this.listLength++;  // not relevant really.
    }

    protected void consumeBracketedTypeElidedUnderscoreLambdaParameter() {
        consumeDefaultModifiers();
        consumeTypeElidedLambdaParameter(true);
    }

    protected void consumeLambdaBodyExpression() {
        Expression exp = this.expressionStack[this.expressionPtr--];
        this.expressionLengthPtr--;
        pushOnAstStack(exp);
    }

    protected void consumeIdentifierOrNew(boolean newForm) {
        // IdentifierOrNew ::= 'Identifier'
        // IdentifierOrNew ::= 'new'
        if (newForm) {
            int newStart = this.intStack[this.intPtr--];
            pushIdentifier(ClassFileConstants.Init, (((long) newStart << 32)) + (newStart + 2));
        }
    }

    protected void consumeEmptyTypeArguments() {
        // NonWildTypeArgumentsopt ::= $empty
        pushOnGenericsLengthStack(0); // signal absence of type arguments.
    }

    public ReferenceExpression newReferenceExpression() {
        return new ReferenceExpression();
    }

    protected void consumeReferenceExpressionTypeForm(boolean isPrimitive) { // actually Name or Type form.

        // ReferenceExpression ::= PrimitiveType Dims '::' NonWildTypeArgumentsopt IdentifierOrNew
        // ReferenceExpression ::= Name Dimsopt '::' NonWildTypeArgumentsopt IdentifierOrNew

        ReferenceExpression referenceExpression = newReferenceExpression();
        TypeReference[] typeArguments = null;
        char[] selector;
        int sourceEnd;

        sourceEnd = (int) this.identifierPositionStack[this.identifierPtr];
        selector = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        int length = this.genericsLengthStack[this.genericsLengthPtr--];
        if (length > 0) {
            this.genericsPtr -= length;
            System.arraycopy(this.genericsStack, this.genericsPtr + 1, typeArguments = new TypeReference[length], 0,
                length);
            this.intPtr--;  // pop type arguments source start.
        }

        int dimension = this.intStack[this.intPtr--];
        boolean typeAnnotatedName = false;
        for (int i = this.identifierLengthStack[this.identifierLengthPtr], j = 0;
            i > 0 && this.typeAnnotationLengthPtr >= 0; --i, j++) {
            length = this.typeAnnotationLengthStack[this.typeAnnotationLengthPtr - j];
            if (length != 0) {
                typeAnnotatedName = true;
                break;
            }
        }

        if (dimension > 0 || typeAnnotatedName) {
            if (!isPrimitive) {
                pushOnGenericsLengthStack(0);
                pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
            }
            referenceExpression.initialize(this.compilationUnit.compilationResult, getTypeReference(dimension),
                typeArguments, selector, sourceEnd);
        } else {
            referenceExpression.initialize(this.compilationUnit.compilationResult, getUnspecifiedReference(),
                typeArguments, selector, sourceEnd);
        }
        if (CharOperation.equals(selector, TypeConstants.INIT) && referenceExpression.lhs instanceof NameReference) {
            referenceExpression.lhs.bits &= ~3;
        }
        consumeReferenceExpression(referenceExpression);
    }

    protected void consumeReferenceExpressionPrimaryForm() {
        // ReferenceExpression ::= Primary '::' NonWildTypeArgumentsopt Identifier

        ReferenceExpression referenceExpression = newReferenceExpression();
        TypeReference[] typeArguments = null;
        char[] selector;
        int sourceEnd;

        sourceEnd = (int) this.identifierPositionStack[this.identifierPtr];
        selector = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        int length = this.genericsLengthStack[this.genericsLengthPtr--];
        if (length > 0) {
            this.genericsPtr -= length;
            System.arraycopy(this.genericsStack, this.genericsPtr + 1, typeArguments = new TypeReference[length], 0,
                length);
            this.intPtr--;  // pop type arguments source start.
        }

        Expression primary = this.expressionStack[this.expressionPtr--];
        this.expressionLengthPtr--;
        referenceExpression.initialize(this.compilationUnit.compilationResult, primary, typeArguments, selector,
            sourceEnd);
        consumeReferenceExpression(referenceExpression);
    }

    protected void consumeReferenceExpressionSuperForm() {
        // ReferenceExpression ::= 'super' '::' NonWildTypeArgumentsopt Identifier

        ReferenceExpression referenceExpression = newReferenceExpression();
        TypeReference[] typeArguments = null;
        char[] selector;
        int sourceEnd;

        sourceEnd = (int) this.identifierPositionStack[this.identifierPtr];
        selector = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        int length = this.genericsLengthStack[this.genericsLengthPtr--];
        if (length > 0) {
            this.genericsPtr -= length;
            System.arraycopy(this.genericsStack, this.genericsPtr + 1, typeArguments = new TypeReference[length], 0,
                length);
            this.intPtr--;  // pop type arguments source start.
        }

        SuperReference superReference = new SuperReference(this.intStack[this.intPtr--], this.endPosition);
        referenceExpression.initialize(this.compilationUnit.compilationResult, superReference, typeArguments, selector,
            sourceEnd);
        consumeReferenceExpression(referenceExpression);
    }

    protected void consumeReferenceExpression(ReferenceExpression referenceExpression) {
        pushOnExpressionStack(referenceExpression);
        markEnclosingMemberWithLocalOrFunctionalType(LocalTypeKind.METHOD_REFERENCE);
    }

    protected void consumeReferenceExpressionTypeArgumentsAndTrunk(boolean qualified) {
        // ReferenceExpressionTypeArgumentsAndTrunk ::= OnlyTypeArguments Dimsopt ==> qualified == false
        // ReferenceExpressionTypeArgumentsAndTrunk ::= OnlyTypeArguments '.' ClassOrInterfaceType Dimsopt ==> qualified
        // == true
        pushOnIntStack(qualified ? 1 : 0);
        pushOnIntStack(this.scanner.startPosition - 1); // mark position of :: as the end of type
    }

    protected void consumeReferenceExpressionGenericTypeForm() {

        // ReferenceExpression ::= Name BeginTypeArguments ReferenceExpressionTypeArgumentsAndTrunk '::'
        // NonWildTypeArgumentsopt IdentifierOrNew

        ReferenceExpression referenceExpression = newReferenceExpression();
        TypeReference type;
        TypeReference[] typeArguments = null;
        char[] selector;
        int sourceEnd;

        sourceEnd = (int) this.identifierPositionStack[this.identifierPtr];
        selector = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;

        int length = this.genericsLengthStack[this.genericsLengthPtr--];
        if (length > 0) {
            this.genericsPtr -= length;
            System.arraycopy(this.genericsStack, this.genericsPtr + 1, typeArguments = new TypeReference[length], 0,
                length);
            this.intPtr--;  // pop type arguments source start.
        }

        int typeSourceEnd = this.intStack[this.intPtr--];
        boolean qualified = this.intStack[this.intPtr--] != 0;
        int dims = this.intStack[this.intPtr--];
        if (qualified) {
            Annotation[][] annotationsOnDimensions = dims == 0 ? null : getAnnotationsOnDimensions(dims);
            TypeReference rightSide = getTypeReference(0);
            type = computeQualifiedGenericsFromRightSide(rightSide, dims, annotationsOnDimensions);
        } else {
            pushOnGenericsIdentifiersLengthStack(this.identifierLengthStack[this.identifierLengthPtr]);
            type = getTypeReference(dims);
        }
        this.intPtr--; // pop '<' position
        type.sourceEnd = typeSourceEnd;

        referenceExpression.initialize(this.compilationUnit.compilationResult, type, typeArguments, selector,
            sourceEnd);

        consumeReferenceExpression(referenceExpression);
    }

    protected void consumeSimpleAssertStatement() {
        // AssertStatement ::= 'assert' Expression ';'
        this.expressionLengthPtr--;
        pushOnAstStack(new AssertStatement(this.expressionStack[this.expressionPtr--], this.intStack[this.intPtr--]));
    }

    protected void consumeSingleMemberAnnotation(boolean isTypeAnnotation) {
        // SingleMemberTypeAnnotation ::= TypeAnnotationName '(' SingleMemberAnnotationMemberValue ')'
        // SingleMemberAnnotation ::= AnnotationName '(' SingleMemberAnnotationMemberValue ')'
        SingleMemberAnnotation singleMemberAnnotation;

        int oldIndex = this.identifierPtr;

        TypeReference typeReference = getAnnotationType();
        singleMemberAnnotation = new SingleMemberAnnotation(typeReference, this.intStack[this.intPtr--]);
        singleMemberAnnotation.memberValue = this.expressionStack[this.expressionPtr--];
        this.expressionLengthPtr--;
        singleMemberAnnotation.declarationSourceEnd = this.rParenPos;

        if (isTypeAnnotation) {
            pushOnTypeAnnotationStack(singleMemberAnnotation);
        } else {
            pushOnExpressionStack(singleMemberAnnotation);
        }

        if (this.currentElement != null) {
            annotationRecoveryCheckPoint(singleMemberAnnotation.declarationSourceEnd);

            if (this.currentElement instanceof RecoveredAnnotation recoveredAnnotation) {
                this.currentElement = recoveredAnnotation.addAnnotation(singleMemberAnnotation);
            }
        }
        this.recordStringLiterals = true;
    }

    protected void consumeSingleMemberAnnotationMemberValue() {
        // this rule is used for syntax recovery only
        if (this.currentElement != null && this.currentElement instanceof RecoveredAnnotation recoveredAnnotation) {
            recoveredAnnotation.setKind(2);
        }
    }

    protected void consumeSingleStaticImportDeclarationName() {
        // SingleStaticImportDeclarationName ::= 'import' 'static' Name RejectTypeAnnotations
        consumeSingleModifierImportDeclarationName(8);
    }

    protected void consumeSingleModuleImportDeclarationName() {
        // SingleModuleImportDeclarationName ::= 'import' 'module' Name RejectTypeAnnotations
        consumeSingleModifierImportDeclarationName(32768);
    }

    protected void consumeSingleModifierImportDeclarationName(int modifier) {
        // SingleStaticImportDeclarationName ::= 'import' 'static' Name RejectTypeAnnotations
        // SingleModuleImportDeclarationName ::= 'import' 'module' Name RejectTypeAnnotations
        /* push an ImportRef build from the last name stored in the identifier stack. */

        ImportReference impt;
        int length;
        char[][] tokens = new char[length = this.identifierLengthStack[this.identifierLengthPtr--]][];
        this.identifierPtr -= length;
        long[] positions = new long[length];
        System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens, 0, length);
        System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions, 0, length);
        pushOnAstStack(impt = new ImportReference(tokens, positions, false, modifier));

        this.modifiers = 0;
        // 'module' stores position on stack, 'static' sets modifiersSourceStart:
        if (modifier == 32768) {
            impt.modifiersSourceStart = this.intStack[this.intPtr--];
        } else { // static
            impt.modifiersSourceStart = this.modifiersSourceStart;
        }
        this.modifiersSourceStart = -1; // see checkAndSetModifiers()

        if (this.currentToken == TokenNameSEMICOLON) {
            impt.declarationSourceEnd = this.scanner.currentPosition - 1;
        } else {
            impt.declarationSourceEnd = impt.sourceEnd;
        }
        impt.declarationEnd = impt.declarationSourceEnd;
        // this.endPosition is just before the ;
        impt.declarationSourceStart = this.intStack[this.intPtr--];

        if (modifier == 32768)
            impt.bits |= 131072; // implicitly

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = impt.declarationSourceEnd + 1;
            this.currentElement = this.currentElement.add(impt, 0);
            this.lastIgnoredToken = TokenNameInvalid;
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
    }

    protected void consumeSingleTypeImportDeclarationName() {
        // SingleTypeImportDeclarationName ::= 'import' Name
        /*
         * push an ImportRef build from the last name stored in the identifier stack.
         */

        ImportReference impt;
        int length;
        char[][] tokens = new char[length = this.identifierLengthStack[this.identifierLengthPtr--]][];
        this.identifierPtr -= length;
        long[] positions = new long[length];
        System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens, 0, length);
        System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions, 0, length);
        pushOnAstStack(impt = new ImportReference(tokens, positions, false, 0));

        if (this.currentToken == TokenNameSEMICOLON) {
            impt.declarationSourceEnd = this.scanner.currentPosition - 1;
        } else {
            impt.declarationSourceEnd = impt.sourceEnd;
        }
        impt.declarationEnd = impt.declarationSourceEnd;
        // this.endPosition is just before the ;
        impt.declarationSourceStart = this.intStack[this.intPtr--];

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = impt.declarationSourceEnd + 1;
            this.currentElement = this.currentElement.add(impt, 0);
            this.lastIgnoredToken = TokenNameInvalid;
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
    }

    protected void consumeStatementBreak() {
        // BreakStatement ::= 'break' ';'
        // break pushes a position on this.intStack in case there is no label

        pushOnAstStack(new BreakStatement(null, this.intStack[this.intPtr--], this.endStatementPosition));

        if (this.pendingRecoveredType != null) {
            // Used only in statements recovery.
            // This is not a real break statement but a placeholder for an existing local type.
            // The break statement must be replace by the local type.
            if (this.pendingRecoveredType.allocation == null
                && this.endPosition <= this.pendingRecoveredType.declarationSourceEnd) {
                this.astStack[this.astPtr] = this.pendingRecoveredType;
                this.pendingRecoveredType = null;
                return;
            }
            this.pendingRecoveredType = null;
        }
    }

    protected void consumeStatementBreakWithLabel() {
        // BreakStatement ::= 'break' Identifier ';'
        // break pushs a position on this.intStack in case there is no label

        pushOnAstStack(new BreakStatement(this.identifierStack[this.identifierPtr--], this.intStack[this.intPtr--],
            this.endStatementPosition));
        this.identifierLengthPtr--;
    }

    protected void consumeStatementYield() {
        // YieldStatement ::= RestrictedIdentifierYield Expression ';'

        // add the compliance check
        if (this.expressionLengthStack[this.expressionLengthPtr--] != 0) {
            Expression expr = this.expressionStack[this.expressionPtr--];
            YieldStatement yieldStatement
                = new YieldStatement(expr, false, this.intStack[this.intPtr--], this.endStatementPosition);
            pushOnAstStack(yieldStatement);
        }
    }

    protected void consumeStatementCatch() {
        // CatchClause ::= 'catch' '(' FormalParameter ')' Block

        // catch are stored directly into the Try
        // has they always comes two by two....
        // we remove one entry from the astlengthPtr.
        // The construction of the try statement must
        // then fetch the catches using 2*i and 2*i + 1

        this.astLengthPtr--;
        this.listLength = 0; // reset formalParameter counter (incremented for catch variable)
    }

    protected void consumeStatementContinue() {
        // ContinueStatement ::= 'continue' ';'
        // continue pushs a position on this.intStack in case there is no label

        pushOnAstStack(new ContinueStatement(null, this.intStack[this.intPtr--], this.endStatementPosition));
    }

    protected void consumeStatementContinueWithLabel() {
        // ContinueStatement ::= 'continue' Identifier ';'
        // continue pushs a position on this.intStack in case there is no label

        pushOnAstStack(new ContinueStatement(this.identifierStack[this.identifierPtr--], this.intStack[this.intPtr--],
            this.endStatementPosition));
        this.identifierLengthPtr--;
    }

    protected void consumeStatementDo() {
        // DoStatement ::= 'do' Statement 'while' '(' Expression ')' ';'

        // the 'while' pushes a value on this.intStack that we need to remove
        this.intPtr--;

        Statement statement = (Statement) this.astStack[this.astPtr];
        this.expressionLengthPtr--;
        this.astStack[this.astPtr] = new DoStatement(this.expressionStack[this.expressionPtr--], statement,
            this.intStack[this.intPtr--], this.endStatementPosition);
    }

    protected void consumeStatementExpressionList() {
        // StatementExpressionList ::= StatementExpressionList ',' StatementExpression
        concatExpressionLists();
    }

    protected void consumeStatementFor() {
        // ForStatement ::= 'for' '(' ForInitopt ';' Expressionopt ';' ForUpdateopt ')' Statement
        // ForStatementNoShortIf ::= 'for' '(' ForInitopt ';' Expressionopt ';' ForUpdateopt ')' StatementNoShortIf

        int length;
        Expression cond = null;
        Statement[] inits, updates;
        boolean scope = true;

        // statements
        this.astLengthPtr--;
        Statement statement = (Statement) this.astStack[this.astPtr--];

        // updates are on the expresion stack
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) == 0) {
            updates = null;
        } else {
            this.expressionPtr -= length;
            System.arraycopy(this.expressionStack, this.expressionPtr + 1, updates = new Statement[length], 0, length);
        }

        if (this.expressionLengthStack[this.expressionLengthPtr--] != 0)
            cond = this.expressionStack[this.expressionPtr--];

        // inits may be on two different stacks
        if ((length = this.astLengthStack[this.astLengthPtr--]) == 0) {
            inits = null;
            scope = false;
        } else {
            if (length == -1) { // on this.expressionStack
                scope = false;
                length = this.expressionLengthStack[this.expressionLengthPtr--];
                this.expressionPtr -= length;
                System.arraycopy(this.expressionStack, this.expressionPtr + 1, inits = new Statement[length], 0,
                    length);
            } else { // on this.astStack
                this.astPtr -= length;
                System.arraycopy(this.astStack, this.astPtr + 1, inits = new Statement[length], 0, length);
            }
        }
        pushOnAstStack(new ForStatement(inits, cond, updates, statement, scope, this.intStack[this.intPtr--],
            this.endStatementPosition));
    }

    protected void consumeStatementIfNoElse() {
        // IfThenStatement ::= 'if' '(' Expression ')' Statement

        // optimize the push/pop
        this.expressionLengthPtr--;
        Statement thenStatement = (Statement) this.astStack[this.astPtr];
        this.astStack[this.astPtr] = new IfStatement(this.expressionStack[this.expressionPtr--], thenStatement,
            this.intStack[this.intPtr--], this.endStatementPosition);
    }

    protected void consumeStatementIfWithElse() {
        // IfThenElseStatement ::= 'if' '(' Expression ')' StatementNoShortIf 'else' Statement
        // IfThenElseStatementNoShortIf ::= 'if' '(' Expression ')' StatementNoShortIf 'else' StatementNoShortIf

        this.expressionLengthPtr--;

        // optimized {..., Then, Else } ==> {..., If }
        this.astLengthPtr--;

        // optimize the push/pop
        this.astStack[--this.astPtr]
            = new IfStatement(this.expressionStack[this.expressionPtr--], (Statement) this.astStack[this.astPtr],
                (Statement) this.astStack[this.astPtr + 1], this.intStack[this.intPtr--], this.endStatementPosition);
    }

    protected void consumeStatementLabel() {
        // LabeledStatement ::= 'Identifier' ':' Statement
        // LabeledStatementNoShortIf ::= 'Identifier' ':' StatementNoShortIf

        // optimize push/pop
        Statement statement = (Statement) this.astStack[this.astPtr];
        this.astStack[this.astPtr] = new LabeledStatement(this.identifierStack[this.identifierPtr], statement,
            this.identifierPositionStack[this.identifierPtr--], this.endStatementPosition);
        this.identifierLengthPtr--;
    }

    protected void consumeStatementReturn() {
        // ReturnStatement ::= 'return' Expressionopt ';'
        // return pushs a position on this.intStack in case there is no expression

        if (this.expressionLengthStack[this.expressionLengthPtr--] != 0) {
            pushOnAstStack(new ReturnStatement(this.expressionStack[this.expressionPtr--], this.intStack[this.intPtr--],
                this.endStatementPosition));
        } else {
            pushOnAstStack(new ReturnStatement(null, this.intStack[this.intPtr--], this.endStatementPosition));
        }
    }

    protected void consumeSwitchStatementOrExpression(boolean isStmt) {
        // SwitchStatement ::= 'switch' '(' Expression ')' PostExpressionInSwitchStatement OpenBlock SwitchBlock
        // SwitchExpression ::= 'switch' '(' Expression ')' PostExpressionInSwitchExpression OpenBlock SwitchBlock

        // Expression and SwitchBlock are only non-epsilon productions. the block is inlined but a scope need to be
        // created if some declaration occurs.
        this.nestedType--;
        int length;
        SwitchStatement switchStatement = isStmt ? new SwitchStatement() : new SwitchExpression();
        this.expressionLengthPtr--;
        switchStatement.expression = this.expressionStack[this.expressionPtr--];
        if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            this.astPtr -= length;
            System.arraycopy(this.astStack, this.astPtr + 1, switchStatement.statements = new Statement[length], 0,
                length);
        }
        this.realBlockPtr--;
        switchStatement.blockStart = this.intStack[this.intPtr--];
        switchStatement.sourceStart = this.intStack[this.intPtr--];
        switchStatement.sourceEnd = this.endStatementPosition;
        if (length == 0 && !containsComment(switchStatement.blockStart, switchStatement.sourceEnd)) {
            switchStatement.bits |= 8;
        }
        if (isStmt)
            pushOnAstStack(switchStatement);
        else {
            if (!isParsingJava14Plus())
                problemReporter().switchExpressionsNotSupported(switchStatement);
            pushOnExpressionStack(switchStatement);
        }
    }

    protected void consumeStatementSynchronized() {
        // SynchronizedStatement ::= OnlySynchronized '(' Expression ')' Block
        // optimize the push/pop

        if (this.astLengthStack[this.astLengthPtr] == 0) {
            this.astLengthStack[this.astLengthPtr] = 1;
            this.expressionLengthPtr--;
            this.astStack[++this.astPtr] = new SynchronizedStatement(this.expressionStack[this.expressionPtr--], null,
                this.intStack[this.intPtr--], this.endStatementPosition);
        } else {
            this.expressionLengthPtr--;
            this.astStack[this.astPtr] = new SynchronizedStatement(this.expressionStack[this.expressionPtr--],
                (Block) this.astStack[this.astPtr], this.intStack[this.intPtr--], this.endStatementPosition);
        }
        this.modifiers = 0;
        this.modifiersSourceStart = -1; // <-- see comment into modifiersFlag(int)
    }

    protected void consumeStatementThrow() {
        // ThrowStatement ::= 'throw' Expression ';'
        this.expressionLengthPtr--;
        pushOnAstStack(new ThrowStatement(this.expressionStack[this.expressionPtr--], this.intStack[this.intPtr--],
            this.endStatementPosition));
    }

    protected void consumeStatementTry(boolean withFinally, boolean hasResources) {
        // TryStatement ::= 'try' Block Catches
        // TryStatement ::= 'try' Block Catchesopt Finally
        // TryStatementWithResources ::= 'try' ResourceSpecification TryBlock Catchesopt
        // TryStatementWithResources ::= 'try' ResourceSpecification TryBlock Catchesopt Finally

        int length;
        TryStatement tryStmt = new TryStatement();
        // finally
        if (withFinally) {
            this.astLengthPtr--;
            tryStmt.finallyBlock = (Block) this.astStack[this.astPtr--];
        }
        // catches are handle by two <argument-block> [see statementCatch]
        if ((length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            if (length == 1) {
                tryStmt.catchBlocks = new Block[] { (Block) this.astStack[this.astPtr--] };
                tryStmt.catchArguments = new Argument[] { (Argument) this.astStack[this.astPtr--] };
            } else {
                Block[] bks = (tryStmt.catchBlocks = new Block[length]);
                Argument[] args = (tryStmt.catchArguments = new Argument[length]);
                while (length-- > 0) {
                    bks[length] = (Block) this.astStack[this.astPtr--];
                    args[length] = (Argument) this.astStack[this.astPtr--];
                }
            }
        }
        // try
        this.astLengthPtr--;
        tryStmt.tryBlock = (Block) this.astStack[this.astPtr--];

        if (hasResources) {
            // get the resources
            length = this.astLengthStack[this.astLengthPtr--];
            Statement[] stmts = new Statement[length];
            System.arraycopy(this.astStack, (this.astPtr -= length) + 1, stmts, 0, length);

            tryStmt.resources = stmts;

            if (this.options.sourceLevel < 3473408L) {
                for (Statement stmt : stmts) {
                    if (stmt instanceof FieldReference || stmt instanceof NameReference) {
                        problemReporter().autoManagedVariableResourcesNotBelow9((Expression) stmt);
                    }
                }
            }
        }
        // positions
        tryStmt.sourceEnd = this.endStatementPosition;
        tryStmt.sourceStart = this.intStack[this.intPtr--];

        pushOnAstStack(tryStmt);
    }

    protected void consumeStatementWhile() {
        // WhileStatement ::= 'while' '(' Expression ')' Statement
        // WhileStatementNoShortIf ::= 'while' '(' Expression ')' StatementNoShortIf

        this.expressionLengthPtr--;
        Statement statement = (Statement) this.astStack[this.astPtr];
        this.astStack[this.astPtr] = new WhileStatement(this.expressionStack[this.expressionPtr--], statement,
            this.intStack[this.intPtr--], this.endStatementPosition);
    }

    protected void consumeStaticImportOnDemandDeclarationName() {
        // StaticImportOnDemandDeclarationName ::= 'import' 'static' Name '.' RejectTypeAnnotations '*'
        /*
         * push an ImportRef build from the last name stored in the identifier stack.
         */

        ImportReference impt;
        int length;
        char[][] tokens = new char[length = this.identifierLengthStack[this.identifierLengthPtr--]][];
        this.identifierPtr -= length;
        long[] positions = new long[length];
        System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens, 0, length);
        System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions, 0, length);
        pushOnAstStack(impt = new ImportReference(tokens, positions, true, 8));

        // star end position
        this.intPtr--;
        this.modifiers = 0;
        impt.modifiersSourceStart = this.modifiersSourceStart;
        this.modifiersSourceStart = -1; // <-- see comment into modifiersFlag(int)

        if (this.currentToken == TokenNameSEMICOLON) {
            impt.declarationSourceEnd = this.scanner.currentPosition - 1;
        } else {
            impt.declarationSourceEnd = impt.sourceEnd;
        }
        impt.declarationEnd = impt.declarationSourceEnd;
        // this.endPosition is just before the ;
        impt.declarationSourceStart = this.intStack[this.intPtr--];

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = impt.declarationSourceEnd + 1;
            this.currentElement = this.currentElement.add(impt, 0);
            this.lastIgnoredToken = TokenNameInvalid;
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
    }

    protected void consumeStaticInitializer() {
        // StaticInitializer ::= StaticOnly Block
        // push an Initializer
        // optimize the push/pop
        Block block = (Block) this.astStack[this.astPtr];
        if (this.diet)
            block.bits &= ~8; // clear bit set since was diet
        Initializer initializer = new Initializer(block, 8);
        this.astStack[this.astPtr] = initializer;
        initializer.sourceEnd = this.endStatementPosition;
        initializer.declarationSourceEnd = flushCommentsDefinedPriorTo(this.endStatementPosition);
        this.nestedMethod[this.nestedType]--;
        initializer.declarationSourceStart = this.intStack[this.intPtr--];
        initializer.bodyStart = this.intStack[this.intPtr--];
        initializer.bodyEnd = this.endPosition;
        // doc comment
        initializer.javadoc = this.javadoc;
        this.javadoc = null;

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = initializer.declarationSourceEnd;
            this.currentElement = this.currentElement.add(initializer, 0);
            this.lastIgnoredToken = TokenNameInvalid;
        }
    }

    protected void consumeStaticOnly() {
        // StaticOnly ::= 'static'
        int savedModifiersSourceStart = this.modifiersSourceStart;
        checkComment(); // might update declaration source start
        if (this.modifiersSourceStart >= savedModifiersSourceStart) {
            this.modifiersSourceStart = savedModifiersSourceStart;
        }
        pushOnIntStack(this.scanner.currentPosition);
        pushOnIntStack(this.modifiersSourceStart >= 0 ? this.modifiersSourceStart : this.scanner.startPosition);
        jumpOverMethodBody();
        this.nestedMethod[this.nestedType]++;
        resetModifiers();
        this.expressionLengthPtr--; // remove the 0 pushed in consumeToken() for the static modifier

        // recovery
        if (this.currentElement != null) {
            this.recoveredStaticInitializerStart = this.intStack[this.intPtr]; // remember start position only for
                                                                               // static initializers
        }
    }

    private void consumeTextBlock() {
        problemReporter().validateJavaFeatureSupport(JavaFeature.TEXT_BLOCKS, this.scanner.startPosition,
            this.scanner.currentPosition - 1);
        boolean shouldRecordStringLiterals = this.recordStringLiterals
            && this.checkExternalizeStrings
            && this.lastPosistion < this.scanner.currentPosition
            && !this.statementRecoveryActivated;

        TextBlock textBlock = new TextBlock(this.scanner.getCurrentTextBlock(), this.scanner.startPosition,
            this.scanner.currentPosition - 1,
            shouldRecordStringLiterals
                ? Util.getLineNumber(this.scanner.startPosition, this.scanner.lineEnds, 0, this.scanner.linePtr)
                : 0,
            shouldRecordStringLiterals
                ? Util.getLineNumber(this.scanner.currentPosition - 1, this.scanner.lineEnds, 0, this.scanner.linePtr)
                : 0);
        if (shouldRecordStringLiterals)
            this.compilationUnit.recordStringLiteral(textBlock, this.currentElement != null);
        pushOnExpressionStack(textBlock);
    }

    protected void consumeSwitchBlock(boolean hasContents) {
        // SwitchBlock ::= '{' { SwitchBlockStatements SwitchLabels } '}'
        if (hasContents)
            concatNodeLists();
        else
            pushOnAstLengthStack(0);
    }

    protected void consumeSwitchBlockStatement() {
        // SwitchBlockStatement ::= SwitchLabels BlockStatements
        concatNodeLists();
    }

    protected void consumeSwitchBlockStatements() {
        // SwitchBlockStatements ::= SwitchBlockStatements SwitchBlockStatement
        concatNodeLists();
    }

    protected void consumeSwitchLabels(boolean shouldConcat, boolean isSwitchRule) {
        // SwitchLabels -> SwitchLabel ':'
        // SwitchLabels ::= SwitchLabels SwitchLabel ':'
        Expression[] labelExpressions;
        int sourceEnd, sourceStart;

        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) > 0) {
            this.expressionPtr -= length;
            System.arraycopy(this.expressionStack, this.expressionPtr + 1, labelExpressions = new Expression[length], 0,
                length);
            sourceStart = this.intStack[this.intPtr--];
            sourceEnd = labelExpressions[length - 1].sourceEnd;
        } else { // default ->
            sourceEnd = this.intStack[this.intPtr--];
            sourceStart = this.intStack[this.intPtr--];
            labelExpressions = Expression.NO_EXPRESSIONS;
        }

        CaseStatement caseStatement = new CaseStatement(labelExpressions, sourceStart, sourceEnd);
        caseStatement.isSwitchRule = isSwitchRule;
        if (labelExpressions.length > 1 && !isParsingJava14Plus())
            problemReporter().multiConstantCaseLabelsNotSupported(caseStatement);
        if (isSwitchRule && !isParsingJava14Plus())
            problemReporter().arrowInCaseStatementsNotSupported(caseStatement);

        // Look for $fall-through$ tag in leading comment for case statement
        if (hasLeadingTagComment(FALL_THROUGH_TAG, caseStatement.sourceStart))
            caseStatement.bits |= 536870912;

        // Look for $fall-through$ AND $CASES-OMITTED$ tags in leading comment for default statement
        if (labelExpressions.length == 0 && hasLeadingTagComment(CASES_OMITTED_TAG, caseStatement.sourceStart))
            caseStatement.bits |= 1073741824;

        pushOnAstStack(caseStatement);
        if (shouldConcat)
            optimizedConcatNodeLists();
    }

    protected void consumeSwitchRule(SwitchRuleKind kind) {
        // SwitchRule ::= SwitchLabel CaseArrow { Expression | Block | ThrowStatement }
        if (kind == SwitchRuleKind.EXPRESSION) {
            consumeExpressionStatement();
            Expression expr = (Expression) this.astStack[this.astPtr];
            expr.bits &= ~1048576;
            YieldStatement yieldStatement = new YieldStatement(expr, true, expr.sourceStart, this.endStatementPosition);
            this.astStack[this.astPtr] = yieldStatement;
        } else if (kind == SwitchRuleKind.BLOCK) {
            Block block = (Block) this.astStack[this.astPtr];
            block.bits |= 1;
        }
        concatNodeLists();
    }

    protected void consumeCaseLabelElement(CaseLabelKind kind) {
        Expression pattern = null;
        switch (kind) {
            case CASE_PATTERN -> {
                this.astLengthPtr--;
                pattern = (Pattern) this.astStack[this.astPtr--];
                pushOnExpressionStack(pattern);
            }
            case CASE_EXPRESSION -> {
                if (!((pattern = this.expressionStack[this.expressionPtr]) instanceof NullLiteral))
                    pattern = null;
            }
            case CASE_DEFAULT -> {
                int end = this.intStack[this.intPtr--];
                int start = this.intStack[this.intPtr--];
                pushOnExpressionStack(pattern = new FakeDefaultLiteral(start, end));
            }
        }
        if (pattern != null)
            problemReporter().validateJavaFeatureSupport(JavaFeature.PATTERN_MATCHING_IN_SWITCH, pattern.sourceStart,
                pattern.sourceEnd);
    }

    protected void consumeCaseLabelElements() {
        concatExpressionLists();
        boolean thisLabelIsPattern = this.expressionStack[this.expressionPtr] instanceof Pattern;
        boolean lastLabelIsPattern = this.expressionStack[this.expressionPtr - 1] instanceof Pattern;
        if (thisLabelIsPattern != lastLabelIsPattern)
            problemReporter().illegalCaseConstantCombination(this.expressionStack[this.expressionPtr]);
        if (thisLabelIsPattern && lastLabelIsPattern) {
            Pattern lastPattern = (Pattern) this.expressionStack[this.expressionPtr - 1];
            Pattern thisPattern = (Pattern) this.expressionStack[this.expressionPtr];
            if (lastPattern instanceof GuardedPattern gp) {
                problemReporter().parseErrorMisplacedConstruct(gp.whenSourceStart, gp.sourceEnd);
            }
            // current pattern can't have alternatives, but getAlternatives() is useful to strip the guard (which will
            // be attached to the combined pattern below
            Pattern[] patterns = Stream
                .concat(Arrays.stream(lastPattern.getAlternatives()), Arrays.stream(thisPattern.getAlternatives()))
                .toArray(Pattern[]::new);
            Pattern combinedPattern = new EitherOrMultiPattern(patterns);
            if (thisPattern instanceof GuardedPattern gp) {
                combinedPattern = new GuardedPattern(combinedPattern, gp.condition);
                ((GuardedPattern) combinedPattern).whenSourceStart = gp.whenSourceStart;
            }
            this.expressionStack[--this.expressionPtr] = combinedPattern;
            this.expressionLengthStack[this.expressionLengthPtr]--;
        }
    }

    protected void consumeToken(TerminalToken type) {
        /* remember the last consumed value */
        /* try to minimize the number of build values */
//	// clear the commentPtr of the scanner in case we read something different from a modifier
//	switch(type) {
//		case TokenNameabstract :
//		case TokenNamestrictfp :
//		case TokenNamefinal :
//		case TokenNamenative :
//		case TokenNameprivate :
//		case TokenNameprotected :
//		case TokenNamepublic :
//		case TokenNametransient :
//		case TokenNamevolatile :
//		case TokenNamestatic :
//		case TokenNamesynchronized :
//			break;
//		default:
//			this.scanner.commentPtr = -1;
//	}
        // System.out.println(this.scanner.toStringAction(type));
        switch (type) {
            case TokenNameARROW:
                consumeLambdaHeader();
                break;

            case TokenNameCOLON_COLON:
                break;

            case TokenNameBeginLambda:
                flushCommentsDefinedPriorTo(this.scanner.currentPosition);
                break;

            case TokenNameUNDERSCORE:
            case TokenNameIdentifier:
                pushIdentifier();
                if (this.scanner.useAssertAsAnIndentifier
                    && this.lastErrorEndPositionBeforeRecovery < this.scanner.currentPosition) {
                    long positions = this.identifierPositionStack[this.identifierPtr];
                    if (!this.statementRecoveryActivated)
                        problemReporter().useAssertAsAnIdentifier((int) (positions >>> 32), (int) positions);
                }
                if (this.scanner.useEnumAsAnIndentifier
                    && this.lastErrorEndPositionBeforeRecovery < this.scanner.currentPosition) {
                    long positions = this.identifierPositionStack[this.identifierPtr];
                    if (!this.statementRecoveryActivated)
                        problemReporter().useEnumAsAnIdentifier((int) (positions >>> 32), (int) positions);
                }
                break;

            case TokenNameinterface:
                // 'class' is pushing two int (positions) on the stack ==> 'interface' needs to do it too....
                pushOnIntStack(this.scanner.currentPosition - 1);
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNameabstract:
                checkAndSetModifiers(1024);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNamestrictfp:
                checkAndSetModifiers(2048);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNamefinal:
                checkAndSetModifiers(16);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNamenative:
                checkAndSetModifiers(256);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNamenon_sealed:
                checkAndSetModifiers(67108864);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNameopen:
                checkAndSetModifiers(32);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNameprivate:
                checkAndSetModifiers(2);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNameprotected:
                checkAndSetModifiers(4);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNamepublic:
                checkAndSetModifiers(1);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNameRestrictedIdentifiersealed:
                checkAndSetModifiers(268435456);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNameRestrictedIdentifierWhen:
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNametransient:
                checkAndSetModifiers(128);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNametransitive:
                checkAndSetModifiers(32);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNamevolatile:
                checkAndSetModifiers(64);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNamestatic:
                if (isParsingModuleDeclaration())
                    checkAndSetModifiers(64);
                else
                    checkAndSetModifiers(8);
                pushOnExpressionStackLengthStack();
                break;

            case TokenNamesynchronized:
                this.synchronizedBlockSourceStart = this.scanner.startPosition;
                checkAndSetModifiers(32);
                pushOnExpressionStackLengthStack();
                break;

            // ==============================
            case TokenNamevoid:
                pushIdentifier(-6);
                pushOnIntStack(this.scanner.currentPosition - 1);
                pushOnIntStack(this.scanner.startPosition);
                break;

            // push a default dimension while void is not part of the primitive
            // declaration baseType and so takes the place of a type without getting into
            // regular type parsing that generates a dimension on this.intStack
            case TokenNameboolean:
                pushIdentifier(-5);
                pushOnIntStack(this.scanner.currentPosition - 1);
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNamebyte:
                pushIdentifier(-3);
                pushOnIntStack(this.scanner.currentPosition - 1);
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNamechar:
                pushIdentifier(-2);
                pushOnIntStack(this.scanner.currentPosition - 1);
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNamedouble:
                pushIdentifier(-8);
                pushOnIntStack(this.scanner.currentPosition - 1);
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNamefloat:
                pushIdentifier(-9);
                pushOnIntStack(this.scanner.currentPosition - 1);
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNameint:
                pushIdentifier(-10);
                pushOnIntStack(this.scanner.currentPosition - 1);
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNamelong:
                pushIdentifier(-7);
                pushOnIntStack(this.scanner.currentPosition - 1);
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNameshort:
                pushIdentifier(-4);
                pushOnIntStack(this.scanner.currentPosition - 1);
                pushOnIntStack(this.scanner.startPosition);
                break;

            // ==============================
            case TokenNameIntegerLiteral:
                pushOnExpressionStack(IntLiteral.buildIntLiteral(this.scanner.getCurrentTokenSource(),
                    this.scanner.startPosition, this.scanner.currentPosition - 1));
                break;

            case TokenNameLongLiteral:
                pushOnExpressionStack(LongLiteral.buildLongLiteral(this.scanner.getCurrentTokenSource(),
                    this.scanner.startPosition, this.scanner.currentPosition - 1));
                break;

            case TokenNameFloatingPointLiteral:
                pushOnExpressionStack(new FloatLiteral(this.scanner.getCurrentTokenSource(), this.scanner.startPosition,
                    this.scanner.currentPosition - 1));
                break;

            case TokenNameDoubleLiteral:
                pushOnExpressionStack(new DoubleLiteral(this.scanner.getCurrentTokenSource(),
                    this.scanner.startPosition, this.scanner.currentPosition - 1));
                break;

            case TokenNameCharacterLiteral:
                pushOnExpressionStack(new CharLiteral(this.scanner.getCurrentTokenSource(), this.scanner.startPosition,
                    this.scanner.currentPosition - 1));
                break;

            case TokenNameStringLiteral:
                StringLiteral stringLiteral;
                if (this.recordStringLiterals
                    && this.checkExternalizeStrings
                    && this.lastPosistion < this.scanner.currentPosition
                    && !this.statementRecoveryActivated) {
                    stringLiteral = createStringLiteral(this.scanner.getCurrentTokenSourceString(),
                        this.scanner.startPosition, this.scanner.currentPosition - 1,
                        Util.getLineNumber(this.scanner.startPosition, this.scanner.lineEnds, 0, this.scanner.linePtr));
                    this.compilationUnit.recordStringLiteral(stringLiteral, this.currentElement != null);
                } else {
                    stringLiteral = createStringLiteral(this.scanner.getCurrentTokenSourceString(),
                        this.scanner.startPosition, this.scanner.currentPosition - 1, 0);
                }
                pushOnExpressionStack(stringLiteral);
                break;

            case TokenNameTextBlock:
                consumeTextBlock();
                break;

            case TokenNamefalse:
                pushOnExpressionStack(new FalseLiteral(this.scanner.startPosition, this.scanner.currentPosition - 1));
                break;

            case TokenNametrue:
                pushOnExpressionStack(new TrueLiteral(this.scanner.startPosition, this.scanner.currentPosition - 1));
                break;

            case TokenNamenull:
                pushOnExpressionStack(new NullLiteral(this.scanner.startPosition, this.scanner.currentPosition - 1));
                break;

            // ============================
            case TokenNamesuper:
            case TokenNamethis:
                this.endPosition = this.scanner.currentPosition - 1;
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNamefor:
                this.forStartPosition = this.scanner.startPosition;
                //$FALL-THROUGH$
            case TokenNameassert:
            case TokenNameimport:
            case TokenNamepackage:
            case TokenNamethrow:
            case TokenNamedo:
            case TokenNameif:
            case TokenNamewhile:
            case TokenNamebreak:
            case TokenNamecontinue:
            case TokenNamereturn:
            case TokenNamemodule:
            case TokenNamerequires:
            case TokenNameexports:
            case TokenNameopens:
            case TokenNameuses:
            case TokenNameprovides:
            case TokenNameRestrictedIdentifierYield:
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNametry:
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNameRestrictedIdentifierpermits:
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNamecase:
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNameswitch:
                consumeNestedType();
                this.nestedMethod[this.nestedType]++;
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNamenew:
                // https://bugs.eclipse.org/bugs/show_bug.cgi?id=40954
                resetModifiers();
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNameRestrictedIdentifierrecord:
            case TokenNameclass:
                pushOnIntStack(this.scanner.currentPosition - 1);
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNameenum:
                pushOnIntStack(this.scanner.currentPosition - 1);
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNamedefault:
                pushOnIntStack(this.scanner.startPosition);
                pushOnIntStack(this.scanner.currentPosition - 1);
                break;

            // let extra semantic action decide when to push
            case TokenNameRBRACKET:
                this.rBracketPosition = this.scanner.startPosition;
                this.endPosition = this.scanner.startPosition;
                this.endStatementPosition = this.scanner.currentPosition - 1;
                break;

            case TokenNameLBRACE:
                this.endStatementPosition = this.scanner.currentPosition - 1;
                //$FALL-THROUGH$
            case TokenNamePLUS:
            case TokenNameMINUS:
            case TokenNameNOT:
            case TokenNameTWIDDLE:
                this.endPosition = this.scanner.startPosition;
                break;

            case TokenNamePLUS_PLUS:
            case TokenNameMINUS_MINUS:
                this.endPosition = this.scanner.startPosition;
                this.endStatementPosition = this.scanner.currentPosition - 1;
                break;

            case TokenNameRBRACE:
            case TokenNameSEMICOLON:
                this.endStatementPosition = this.scanner.currentPosition - 1;
                this.endPosition = this.scanner.startPosition - 1;
                // the item is not part of the potential futur expression/statement
                break;

            case TokenNameRPAREN:
                // in order to handle ( expression) ////// (cast)expression///// foo(x)
                this.rParenPos = this.scanner.currentPosition - 1; // position of the end of right parenthesis (in case
                                                                   // of unicode \u0029) lex00101
                break;

            case TokenNameLPAREN:
                this.lParenPos = this.scanner.startPosition;
                break;

            case TokenNameAT308:
                this.expectTypeAnnotation = true;
                pushOnIntStack(this.dimensions); // https://bugs.eclipse.org/bugs/show_bug.cgi?id=417660: Stack the
                                                 // dimensions, they get unstacked in consumeTypeAnnotation.
                this.dimensions = 0;
                //$FALL-THROUGH$
            case TokenNameAT:
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNameQUESTION:
                pushOnIntStack(this.scanner.startPosition);
                pushOnIntStack(this.scanner.currentPosition - 1);
                break;

            case TokenNameLESS:
                pushOnIntStack(this.scanner.startPosition);
                break;

            case TokenNameELLIPSIS:
                pushOnIntStack(this.scanner.currentPosition - 1);
                break;

            case TokenNameEQUAL:
                if (this.currentElement instanceof RecoveredAnnotation recoveredAnnotation) {
                    if (recoveredAnnotation.memberValuPairEqualEnd == -1) {
                        recoveredAnnotation.memberValuPairEqualEnd = this.scanner.currentPosition - 1;
                    }
                }
                break;

            case TokenNameMULTIPLY:
                // star end position
                pushOnIntStack(this.scanner.currentPosition - 1);
                break;

            // case TokenNameCOMMA :
            // case TokenNameCOLON :
            // case TokenNameLBRACKET :
            // case TokenNameDOT :
            // case TokenNameERROR :
            // case TokenNameEOF :
            // case TokenNamecase :
            // case TokenNamecatch :
            // case TokenNameelse :
            // case TokenNameextends :
            // case TokenNamefinally :
            // case TokenNameimplements :
            // case TokenNamethrows :
            // case TokenNameinstanceof :
            // case TokenNameEQUAL_EQUAL :
            // case TokenNameLESS_EQUAL :
            // case TokenNameGREATER_EQUAL :
            // case TokenNameNOT_EQUAL :
            // case TokenNameLEFT_SHIFT :
            // case TokenNameRIGHT_SHIFT :
            // case TokenNameUNSIGNED_RIGHT_SHIFT :
            // case TokenNamePLUS_EQUAL :
            // case TokenNameMINUS_EQUAL :
            // case TokenNameMULTIPLY_EQUAL :
            // case TokenNameDIVIDE_EQUAL :
            // case TokenNameAND_EQUAL :
            // case TokenNameOR_EQUAL :
            // case TokenNameXOR_EQUAL :
            // case TokenNameREMAINDER_EQUAL :
            // case TokenNameLEFT_SHIFT_EQUAL :
            // case TokenNameRIGHT_SHIFT_EQUAL :
            // case TokenNameUNSIGNED_RIGHT_SHIFT_EQUAL :
            // case TokenNameOR_OR :
            // case TokenNameAND_AND :
            // case TokenNameREMAINDER :
            // case TokenNameXOR :
            // case TokenNameAND :
            // case TokenNameMULTIPLY :
            // case TokenNameOR :
            // case TokenNameDIVIDE :
            // case TokenNameGREATER :
            default:
                // Cover synthetic tokens
                break;
        }
    }

    protected void consumeTypeArgument() {
        pushOnGenericsStack(getTypeReference(this.intStack[this.intPtr--]));
    }

    protected void consumeTypeArgumentList() {
        concatGenericsLists();
    }

    protected void consumeTypeArgumentList1() {
        concatGenericsLists();
    }

    protected void consumeTypeArgumentList2() {
        concatGenericsLists();
    }

    protected void consumeTypeArgumentList3() {
        concatGenericsLists();
    }

    protected void consumeTypeArgumentReferenceType1() {
        concatGenericsLists();
        pushOnGenericsStack(getTypeReference(0));
        this.intPtr--; // pop '<' position.
    }

    protected void consumeTypeArgumentReferenceType2() {
        concatGenericsLists();
        pushOnGenericsStack(getTypeReference(0));
        this.intPtr--;
    }

    protected void consumeTypeArguments() {
        concatGenericsLists();
        this.intPtr--;
    }

    protected void consumeTypeDeclarations() {
        // TypeDeclarations ::= TypeDeclarations TypeDeclaration
        concatNodeLists();
    }

    protected void consumeTypeHeaderNameWithTypeParameters() {
        // ClassHeaderName ::= ClassHeaderName1 TypeParameters
        // InterfaceHeaderName ::= InterfaceHeaderName1 TypeParameters
        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];

        // consume type parameters
        int length = this.genericsLengthStack[this.genericsLengthPtr--];
        this.genericsPtr -= length;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1, typeDecl.typeParameters = new TypeParameter[length],
            0, length);

        typeDecl.bodyStart = typeDecl.typeParameters[length - 1].declarationSourceEnd + 1;

        this.listTypeParameterLength = 0;

        if (this.currentElement != null) {
            // is recovering
            if (this.currentElement instanceof RecoveredType recoveredType) {
                recoveredType.pendingTypeParameters = null;
                this.lastCheckPoint = typeDecl.bodyStart;
            } else {
                this.lastCheckPoint = typeDecl.bodyStart;
                this.currentElement = this.currentElement.add(typeDecl, 0);
                this.lastIgnoredToken = TokenNameInvalid;
            }
        }
    }

    protected void consumeTypeImportOnDemandDeclarationName() {
        // TypeImportOnDemandDeclarationName ::= 'import' Name '.' RejectTypeAnnotations '*'
        /*
         * push an ImportRef build from the last name stored in the identifier stack.
         */

        ImportReference impt;
        int length;
        char[][] tokens = new char[length = this.identifierLengthStack[this.identifierLengthPtr--]][];
        this.identifierPtr -= length;
        long[] positions = new long[length];
        System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens, 0, length);
        System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions, 0, length);
        pushOnAstStack(impt = new ImportReference(tokens, positions, true, 0));

        // star end position
        this.intPtr--;
        if (this.currentToken == TokenNameSEMICOLON) {
            impt.declarationSourceEnd = this.scanner.currentPosition - 1;
        } else {
            impt.declarationSourceEnd = impt.sourceEnd;
        }
        impt.declarationEnd = impt.declarationSourceEnd;
        // this.endPosition is just before the ;
        impt.declarationSourceStart = this.intStack[this.intPtr--];

        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = impt.declarationSourceEnd + 1;
            this.currentElement = this.currentElement.add(impt, 0);
            this.lastIgnoredToken = TokenNameInvalid;
            this.restartRecovery = true; // used to avoid branching back into the regular automaton
        }
    }

    protected void consumeTypeParameter1WithExtends() {
        // TypeParameter1 ::= TypeParameterHeader 'extends' ReferenceType1
        TypeReference superType = (TypeReference) this.genericsStack[this.genericsPtr--];
        this.genericsLengthPtr--;
        TypeParameter typeParameter = (TypeParameter) this.genericsStack[this.genericsPtr];
        typeParameter.declarationSourceEnd = superType.sourceEnd;
        typeParameter.type = superType;
        typeParameter.bits |= (superType.bits & 1048576);
        this.genericsStack[this.genericsPtr] = typeParameter;
    }

    protected void consumeTypeParameter1WithExtendsAndBounds() {
        // TypeParameter1 ::= TypeParameterHeader 'extends' ReferenceType AdditionalBoundList1
        int additionalBoundsLength = this.genericsLengthStack[this.genericsLengthPtr--];
        TypeReference[] bounds = new TypeReference[additionalBoundsLength];
        this.genericsPtr -= additionalBoundsLength;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1, bounds, 0, additionalBoundsLength);
        TypeReference superType = getTypeReference(this.intStack[this.intPtr--]);
        TypeParameter typeParameter = (TypeParameter) this.genericsStack[this.genericsPtr];
        typeParameter.declarationSourceEnd = bounds[additionalBoundsLength - 1].sourceEnd;
        typeParameter.type = superType;
        typeParameter.bits |= (superType.bits & 1048576);
        typeParameter.bounds = bounds;
        for (TypeReference bound2 : bounds) {
            typeParameter.bits |= (bound2.bits & 1048576);
        }
    }

    protected void consumeTypeParameterHeader() {
        // TypeParameterHeader ::= TypeAnnotationsopt Identifier
        TypeParameter typeParameter = new TypeParameter();
        int length;
        if ((length = this.typeAnnotationLengthStack[this.typeAnnotationLengthPtr--]) != 0) {
            System.arraycopy(this.typeAnnotationStack, (this.typeAnnotationPtr -= length) + 1,
                typeParameter.annotations = new Annotation[length], 0, length);
            typeParameter.bits |= 1048576;
        }
        long pos = this.identifierPositionStack[this.identifierPtr];
        final int end = (int) pos;
        typeParameter.declarationSourceEnd = end;
        typeParameter.sourceEnd = end;
        final int start = (int) (pos >>> 32);
        typeParameter.declarationSourceStart = start;
        typeParameter.sourceStart = start;
        typeParameter.name = this.identifierStack[this.identifierPtr--];
        this.identifierLengthPtr--;
        pushOnGenericsStack(typeParameter);

        this.listTypeParameterLength++;
    }

    protected void consumeTypeParameterList() {
        // TypeParameterList ::= TypeParameterList ',' TypeParameter
        concatGenericsLists();
    }

    protected void consumeTypeParameterList1() {
        // TypeParameterList1 ::= TypeParameterList ',' TypeParameter1
        concatGenericsLists();
    }

    protected void consumeTypeParameters() {
        int startPos = this.intStack[this.intPtr--];

        if (this.currentElement instanceof RecoveredType recoveredType) {
            int length = this.genericsLengthStack[this.genericsLengthPtr];
            TypeParameter[] typeParameters = new TypeParameter[length];
            System.arraycopy(this.genericsStack, this.genericsPtr - length + 1, typeParameters, 0, length);

            recoveredType.add(typeParameters, startPos);
        }
    }

    protected void consumeTypeParameterWithExtends() {
        // TypeParameter ::= TypeParameterHeader 'extends' ReferenceType
        TypeReference superType = getTypeReference(this.intStack[this.intPtr--]);
        TypeParameter typeParameter = (TypeParameter) this.genericsStack[this.genericsPtr];
        typeParameter.declarationSourceEnd = superType.sourceEnd;
        typeParameter.type = superType;
        typeParameter.bits |= (superType.bits & 1048576);
    }

    protected void consumeTypeParameterWithExtendsAndBounds() {
        // TypeParameter ::= TypeParameterHeader 'extends' ReferenceType AdditionalBoundList
        int additionalBoundsLength = this.genericsLengthStack[this.genericsLengthPtr--];
        TypeReference[] bounds = new TypeReference[additionalBoundsLength];
        this.genericsPtr -= additionalBoundsLength;
        System.arraycopy(this.genericsStack, this.genericsPtr + 1, bounds, 0, additionalBoundsLength);
        TypeReference superType = getTypeReference(this.intStack[this.intPtr--]);
        TypeParameter typeParameter = (TypeParameter) this.genericsStack[this.genericsPtr];
        typeParameter.type = superType;
        typeParameter.bits |= (superType.bits & 1048576);
        typeParameter.bounds = bounds;
        typeParameter.declarationSourceEnd = bounds[additionalBoundsLength - 1].sourceEnd;
        for (TypeReference bound2 : bounds) {
            typeParameter.bits |= (bound2.bits & 1048576);
        }
    }

    protected void consumeGuard() {
        this.astLengthPtr--;
        Pattern pattern = (Pattern) this.astStack[this.astPtr--];
        Expression expr = this.expressionStack[this.expressionPtr--];
        this.expressionLengthPtr--;
        GuardedPattern gPattern = new GuardedPattern(pattern, expr);
        gPattern.whenSourceStart = this.intStack[this.intPtr--];
        pushOnAstStack(gPattern);
    }

    protected void consumeTypePattern() {
        // name
        char[] identifierName = this.identifierStack[this.identifierPtr];
        long namePosition = this.identifierPositionStack[this.identifierPtr];

        LocalDeclaration local
            = createLocalDeclaration(identifierName, (int) (namePosition >>> 32), (int) namePosition);
        local.declarationSourceEnd = local.declarationEnd;
        local.bits |= 8388608;
        this.identifierPtr--;
        this.identifierLengthPtr--;

        // type
        consumeTypeReferenceWithModifiersAndAnnotations();
        TypeReference type = (TypeReference) this.expressionStack[this.expressionPtr--];
        this.expressionLengthPtr--;

        // Move annotations from type reference to LocalDeclaration
        local.annotations = type.annotations != null && type.annotations.length > 0 ? type.annotations[0] : null;
        type.annotations = null;
        local.type = type;

        TypePattern aTypePattern = TypePattern.createTypePattern(local);
        aTypePattern.sourceStart = this.intStack[this.intPtr--];
        local.modifiers = this.intStack[this.intPtr--];
        local.declarationSourceStart = type.sourceStart;
        aTypePattern.sourceEnd = local.sourceEnd;

        problemReporter().validateJavaFeatureSupport(JavaFeature.PATTERN_MATCHING_IN_INSTANCEOF, type.sourceStart,
            local.declarationEnd);
        pushOnAstStack(aTypePattern);
    }

    protected void consumeUnnamedPattern() {
        // UnnamedPattern -> '_'

        // name
        char[] identifierName = this.identifierStack[this.identifierPtr];
        long namePosition = this.identifierPositionStack[this.identifierPtr];

        LocalDeclaration local
            = createLocalDeclaration(identifierName, (int) (namePosition >>> 32), (int) namePosition);
        local.declarationSourceEnd = local.declarationEnd;
        local.bits |= 8388608;
        local.declarationSourceStart = (int) (namePosition >>> 32);
        this.identifierPtr--;
        this.identifierLengthPtr--;

        TypePattern aUnnamedPattern = TypePattern.createTypePattern(local);
        aUnnamedPattern.sourceStart = local.sourceStart;
        aUnnamedPattern.sourceEnd = local.sourceEnd;

        pushOnAstStack(aUnnamedPattern);
    }

    protected void consumeRecordPattern() {
        int length;
        Annotation[] typeAnnotations = null;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            System.arraycopy(this.expressionStack, (this.expressionPtr -= length) + 1,
                typeAnnotations = new Annotation[length], 0, length);
        }

        int sourceEnd = this.intStack[this.intPtr--];  // ')' position
        this.intPtr--;  // pop '(' position

        int dimension = this.intStack[this.intPtr--];

        int modifierStart = this.intStack[this.intPtr--];
        int modifier = this.intStack[this.intPtr--];

        TypeReference type = getTypeReference(0);

        if (typeAnnotations != null) {
            int levels = type.getAnnotatableLevels();
            if (type.annotations == null)
                type.annotations = new Annotation[levels][];
            type.annotations[0] = typeAnnotations;
            type.sourceStart = type.annotations[0][0].sourceStart;
            type.bits |= 1048576;
        }

        RecordPattern recPattern = new RecordPattern(type, type.sourceStart, sourceEnd);

        length = this.astLengthPtr == -1 ? 0 : this.astLengthStack[this.astLengthPtr--];
        this.astPtr -= length;

        if (length != 0) {
            Pattern[] patterns = new Pattern[length];
            System.arraycopy(this.astStack, this.astPtr + 1, patterns, 0, length);
            recPattern.patterns = patterns;
            for (int i = 0; i < length; ++i) {
                Pattern pattern = patterns[i];

            }
        } else {
            recPattern.patterns = ASTNode.NO_TYPE_PATTERNS;
        }
        if (dimension != 0) {
            problemReporter().dimensionsIllegalOnRecordPattern(type.sourceStart, sourceEnd);
        }
        if (modifier != 0) {
            problemReporter().illegalModifiers(modifierStart, type.sourceStart - 2);
        }
        problemReporter().validateJavaFeatureSupport(JavaFeature.RECORD_PATTERNS, type.sourceStart, sourceEnd);
        pushOnAstStack(recPattern);
    }

    protected void consumePatternList() {
        // PatternList -> Pattern
        // PatternList ::= PatternList ',' Pattern
        optimizedConcatNodeLists();
    }

    protected void consumePatternListopt() {
        // PatternListopt ::= $empty
        pushOnAstLengthStack(0);
    }

    protected void consumeZeroAdditionalBounds() {
        if (this.currentToken == TokenNameRPAREN)  // Signal zero additional bounds - do this only when the cast type is
                                                   // fully seen (i.e not in error path)
            pushOnGenericsLengthStack(0);          // Not all stacks are adjusted - this is not meant to be popped by
                                                   // getTypeReference
    }

    protected void consumeUnaryExpression(int op) {
        // UnaryExpression ::= '+' PushPosition UnaryExpression
        // UnaryExpression ::= '-' PushPosition UnaryExpression
        // UnaryExpressionNotPlusMinus ::= '~' PushPosition UnaryExpression
        // UnaryExpressionNotPlusMinus ::= '!' PushPosition UnaryExpression

        // optimize the push/pop

        // handle manually the -2147483648 while it is not a real
        // computation of an - and 2147483648 (notice that 2147483648
        // is Integer.MAX_VALUE+1.....)
        // Same for -9223372036854775808L ............

        // this.intStack have the position of the operator

        Expression r, exp = this.expressionStack[this.expressionPtr];
        if (op == 13) {
            if (exp instanceof IntLiteral intLiteral) {
                IntLiteral convertToMinValue = intLiteral.convertToMinValue();
                if (convertToMinValue == intLiteral) {
                    // not a min value literal so we convert it to an unary expression
                    r = new UnaryExpression(exp, op);
                } else {
                    r = convertToMinValue;
                }
            } else if (exp instanceof LongLiteral longLiteral) {
                LongLiteral convertToMinValue = longLiteral.convertToMinValue();
                if (convertToMinValue == longLiteral) {
                    // not a min value literal so we convert it to an unary expression
                    r = new UnaryExpression(exp, op);
                } else {
                    r = convertToMinValue;
                }
            } else {
                r = new UnaryExpression(exp, op);
            }
        } else {
            r = new UnaryExpression(exp, op);
        }
        r.sourceStart = this.intStack[this.intPtr--];
        r.sourceEnd = exp.sourceEnd;
        this.expressionStack[this.expressionPtr] = r;
    }

    protected void consumeUnaryExpression(int op, boolean post) {
        // PreIncrementExpression ::= '++' PushPosition UnaryExpression
        // PreDecrementExpression ::= '--' PushPosition UnaryExpression

        // ++ and -- operators
        // optimize the push/pop

        // this.intStack has the position of the operator when prefix

        Expression leftHandSide = this.expressionStack[this.expressionPtr];
        if (leftHandSide instanceof Reference) {
            // ++foo()++ is unvalid
            if (post) {
                this.expressionStack[this.expressionPtr]
                    = new PostfixExpression(leftHandSide, op, this.endStatementPosition);
            } else {
                this.expressionStack[this.expressionPtr]
                    = new PrefixExpression(leftHandSide, op, this.intStack[this.intPtr--]);
            }
        } else {
            // the ++ or the -- is NOT taken into account if code gen proceeds
            if (!post) {
                this.intPtr--;
            }
            if (!this.statementRecoveryActivated)
                problemReporter().invalidUnaryExpression(leftHandSide);
        }
    }

    protected void consumeVariableDeclarators() {
        // VariableDeclarators ::= VariableDeclarators ',' VariableDeclarator
        optimizedConcatNodeLists();
    }

    protected void consumeVariableInitializers() {
        // VariableInitializers ::= VariableInitializers ',' VariableInitializer
        concatExpressionLists();
    }

    protected void consumeWildcard() {
        final Wildcard wildcard = new Wildcard(0);
        wildcard.sourceEnd = this.intStack[this.intPtr--];
        wildcard.sourceStart = this.intStack[this.intPtr--];
        annotateTypeReference(wildcard);
        pushOnGenericsStack(wildcard);
    }

    protected void consumeWildcard1() {
        final Wildcard wildcard = new Wildcard(0);
        wildcard.sourceEnd = this.intStack[this.intPtr--];
        wildcard.sourceStart = this.intStack[this.intPtr--];
        annotateTypeReference(wildcard);
        pushOnGenericsStack(wildcard);
    }

    protected void consumeWildcard2() {
        final Wildcard wildcard = new Wildcard(0);
        wildcard.sourceEnd = this.intStack[this.intPtr--];
        wildcard.sourceStart = this.intStack[this.intPtr--];
        annotateTypeReference(wildcard);
        pushOnGenericsStack(wildcard);
    }

    protected void consumeWildcard3() {
        final Wildcard wildcard = new Wildcard(0);
        wildcard.sourceEnd = this.intStack[this.intPtr--];
        wildcard.sourceStart = this.intStack[this.intPtr--];
        annotateTypeReference(wildcard);
        pushOnGenericsStack(wildcard);
    }

    protected void consumeWildcardBounds1Extends() {
        Wildcard wildcard = new Wildcard(1);
        wildcard.bound = (TypeReference) this.genericsStack[this.genericsPtr];
        wildcard.sourceEnd = wildcard.bound.sourceEnd;
        this.intPtr--; // remove end position of the '?'
        wildcard.sourceStart = this.intStack[this.intPtr--];
        annotateTypeReference(wildcard);
        this.genericsStack[this.genericsPtr] = wildcard;
    }

    protected void consumeWildcardBounds1Super() {
        Wildcard wildcard = new Wildcard(2);
        wildcard.bound = (TypeReference) this.genericsStack[this.genericsPtr];
        this.intPtr--; // remove the starting position of the super keyword
        wildcard.sourceEnd = wildcard.bound.sourceEnd;
        this.intPtr--; // remove end position of the '?'
        wildcard.sourceStart = this.intStack[this.intPtr--];
        annotateTypeReference(wildcard);
        this.genericsStack[this.genericsPtr] = wildcard;
    }

    protected void consumeWildcardBounds2Extends() {
        Wildcard wildcard = new Wildcard(1);
        wildcard.bound = (TypeReference) this.genericsStack[this.genericsPtr];
        wildcard.sourceEnd = wildcard.bound.sourceEnd;
        this.intPtr--; // remove end position of the '?'
        wildcard.sourceStart = this.intStack[this.intPtr--];
        annotateTypeReference(wildcard);
        this.genericsStack[this.genericsPtr] = wildcard;
    }

    protected void consumeWildcardBounds2Super() {
        Wildcard wildcard = new Wildcard(2);
        wildcard.bound = (TypeReference) this.genericsStack[this.genericsPtr];
        this.intPtr--; // remove the starting position of the super keyword
        wildcard.sourceEnd = wildcard.bound.sourceEnd;
        this.intPtr--; // remove end position of the '?'
        wildcard.sourceStart = this.intStack[this.intPtr--];
        annotateTypeReference(wildcard);
        this.genericsStack[this.genericsPtr] = wildcard;
    }

    protected void consumeWildcardBounds3Extends() {
        Wildcard wildcard = new Wildcard(1);
        wildcard.bound = (TypeReference) this.genericsStack[this.genericsPtr];
        wildcard.sourceEnd = wildcard.bound.sourceEnd;
        this.intPtr--; // remove end position of the '?'
        wildcard.sourceStart = this.intStack[this.intPtr--];
        annotateTypeReference(wildcard);
        this.genericsStack[this.genericsPtr] = wildcard;
    }

    protected void consumeWildcardBounds3Super() {
        Wildcard wildcard = new Wildcard(2);
        wildcard.bound = (TypeReference) this.genericsStack[this.genericsPtr];
        this.intPtr--; // remove the starting position of the super keyword
        wildcard.sourceEnd = wildcard.bound.sourceEnd;
        this.intPtr--; // remove end position of the '?'
        wildcard.sourceStart = this.intStack[this.intPtr--];
        annotateTypeReference(wildcard);
        this.genericsStack[this.genericsPtr] = wildcard;
    }

    protected void consumeWildcardBoundsExtends() {
        Wildcard wildcard = new Wildcard(1);
        wildcard.bound = getTypeReference(this.intStack[this.intPtr--]);
        wildcard.sourceEnd = wildcard.bound.sourceEnd;
        this.intPtr--; // remove end position of the '?'
        wildcard.sourceStart = this.intStack[this.intPtr--];
        annotateTypeReference(wildcard);
        pushOnGenericsStack(wildcard);
    }

    protected void consumeWildcardBoundsSuper() {
        Wildcard wildcard = new Wildcard(2);
        wildcard.bound = getTypeReference(this.intStack[this.intPtr--]);
        this.intPtr--; // remove the starting position of the super keyword
        wildcard.sourceEnd = wildcard.bound.sourceEnd;
        this.intPtr--; // remove end position of the '?'
        wildcard.sourceStart = this.intStack[this.intPtr--];
        annotateTypeReference(wildcard);
        pushOnGenericsStack(wildcard);
    }

    protected void consumeRecordHeaderNameWithTypeParameters() {
        // RecordHeaderName ::= RecordHeaderName1 TypeParameters
        consumeTypeHeaderNameWithTypeParameters();
        this.parsingRecordComponents = true;
    }

    protected void consumeRecordHeaderName() {
        // RecordHeaderName1 ::= Modifiersopt RestrictedIdentifierrecord 'Identifier'
        this.parsingRecordComponents = true;
    }

    protected void consumeRecordHeaderName1() {
        // Modifiersopt RestrictedIdentifierrecord 'Identifier'
        consumeClassOrRecordHeaderName1(true);
    }

    protected void consumeRecordComponentHeaderRightParen() {
        // RecordComponentHeaderRightParen ::= ')'
        this.parsingRecordComponents = false;
        int length = this.astLengthStack[this.astLengthPtr--];
        this.astPtr -= length;
        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];
        if (length != 0) {
            RecordComponent[] recComps = new RecordComponent[length];
            System.arraycopy(this.astStack, this.astPtr + 1, recComps, 0, length);
            typeDecl.recordComponents = recComps;
        } else {
            typeDecl.recordComponents = ASTNode.NO_RECORD_COMPONENTS;
        }
        typeDecl.bodyStart = this.rParenPos + 1;
        this.listLength = 0; // reset this.listLength after having read all parameters
        // recovery
        if (this.currentElement != null) {
            this.lastCheckPoint = typeDecl.bodyStart;
            if (this.currentElement.parseTree() == typeDecl)
                return;
        }
        resetModifiers();
    }

    protected void consumeRecordComponentsopt() {
        // RecordComponentsopt ::= $empty
        pushOnAstLengthStack(0);
    }

    /* Java 16 - Records - end */
    /**
     * Given the current comment stack, answer whether some comment is available in a certain exclusive range
     *
     * @param sourceStart int
     * @param sourceEnd int
     * @return boolean
     */
    public boolean containsComment(int sourceStart, int sourceEnd) {
        int iComment = this.scanner.commentPtr;
        for (; iComment >= 0; iComment--) {
            int commentStart = this.scanner.commentStarts[iComment];
            if (commentStart < 0)
                commentStart = -commentStart;
            // ignore comments before start
            if (commentStart < sourceStart)
                continue;
            // ignore comments after end
            if (commentStart > sourceEnd)
                continue;
            return true;
        }
        return false;
    }

    public MethodDeclaration convertToMethodDeclaration(ConstructorDeclaration c, CompilationResult compilationResult) {
        MethodDeclaration m = new MethodDeclaration(compilationResult);
        m.typeParameters = c.typeParameters;
        m.sourceStart = c.sourceStart;
        m.sourceEnd = c.sourceEnd;
        m.bodyStart = c.bodyStart;
        m.bodyEnd = c.bodyEnd;
        m.declarationSourceEnd = c.declarationSourceEnd;
        m.declarationSourceStart = c.declarationSourceStart;
        m.selector = c.selector;
        m.statements = c.statements;
        m.modifiers = c.modifiers;
        m.annotations = c.annotations;
        m.arguments = c.arguments;
        m.thrownExceptions = c.thrownExceptions;
        m.explicitDeclarations = c.explicitDeclarations;
        m.returnType = null;
        m.javadoc = c.javadoc;
        m.bits = c.bits;
        return m;
    }

    protected TypeReference augmentTypeWithAdditionalDimensions(TypeReference typeReference, int additionalDimensions,
        Annotation[][] additionalAnnotations, boolean isVarargs) {
        if (isParsingJava10Plus()
            && typeReference instanceof SingleTypeReference singleTypeRef
            && CharOperation.equals(singleTypeRef.token, TypeConstants.VAR))
            problemReporter().varLocalCannotBeArray(singleTypeRef);
        return typeReference.augmentTypeWithAdditionalDimensions(additionalDimensions, additionalAnnotations,
            isVarargs);
    }

    protected FieldDeclaration createFieldDeclaration(char[] fieldDeclarationName, int sourceStart, int sourceEnd) {
        return new FieldDeclaration(fieldDeclarationName, sourceStart, sourceEnd);
    }

    protected RecordComponent createComponent(char[] identifierName, long namePositions, TypeReference type,
        int modifier) {
        return new RecordComponent(identifierName, namePositions, type, modifier);
    }

    protected JavadocParser createJavadocParser() {
        return new JavadocParser(this);
    }

    protected LocalDeclaration createLocalDeclaration(char[] localDeclarationName, int sourceStart, int sourceEnd) {
        return new LocalDeclaration(localDeclarationName, sourceStart, sourceEnd);
    }

    protected StringLiteral createStringLiteral(char[] token, int start, int end, int lineNumber) {
        return new StringLiteral(token, start, end, lineNumber);
    }

    protected RecoveredType currentRecoveryType() {
        if (this.currentElement != null) {
            if (this.currentElement instanceof RecoveredType recoveredType) {
                return recoveredType;
            } else {
                return this.currentElement.enclosingType();
            }
        }
        return null;
    }

    public CompilationUnitDeclaration dietParse(ICompilationUnit sourceUnit, CompilationResult compilationResult) {
        CompilationUnitDeclaration parsedUnit;
        boolean old = this.diet;
        int oldInt = this.dietInt;
        try {
            this.dietInt = 0;
            this.diet = true;
            parsedUnit = parse(sourceUnit, compilationResult);
        } finally {
            this.diet = old;
            this.dietInt = oldInt;
        }
        return parsedUnit;
    }

    protected void dispatchDeclarationInto(int length) {
        /*
         * they are length on this.astStack that should go into methods fields constructors lists of the typeDecl
         *
         * Return if there is a constructor declaration in the methods declaration
         */

        // Looks for the size of each array .

        if (length == 0)
            return;
        int[] flag = new int[length + 1]; // plus one -- see <HERE>
        int size1 = 0, size2 = 0, size3 = 0;
        boolean hasAbstractMethods = false;
        for (int i = length - 1; i >= 0; i--) {
            ASTNode astNode = this.astStack[this.astPtr--];
            if (astNode instanceof AbstractMethodDeclaration method) {
                // methods and constructors have been regrouped into one single list
                flag[i] = 2;
                size2++;
                if (method.isAbstract()) {
                    hasAbstractMethods = true;
                }
            } else if (astNode instanceof TypeDeclaration) {
                flag[i] = 3;
                size3++;
            } else {
                // field
                flag[i] = 1;
                size1++;
            }
        }

        // arrays creation
        TypeDeclaration typeDecl = (TypeDeclaration) this.astStack[this.astPtr];
        if (size1 != 0) {
            typeDecl.fields = new FieldDeclaration[size1];
        }
        if (size2 != 0) {
            typeDecl.methods = new AbstractMethodDeclaration[size2];
            if (hasAbstractMethods)
                typeDecl.bits |= 2048;
        }
        if (size3 != 0) {
            typeDecl.memberTypes = new TypeDeclaration[size3];
        }

        // arrays fill up
        size1 = size2 = size3 = 0;
        int flagI = flag[0], start = 0;
        int length2;
        for (int end = 0; end <= length; end++) // <HERE> the plus one allows to
        {
            if (flagI != flag[end]) // treat the last element as a ended flag.....
            { // array copy
                switch (flagI) {
                    case 1:
                        size1 += (length2 = end - start);
                        System.arraycopy(this.astStack, this.astPtr + start + 1, typeDecl.fields, size1 - length2,
                            length2);
                        break;

                    case 2:
                        size2 += (length2 = end - start);
                        System.arraycopy(this.astStack, this.astPtr + start + 1, typeDecl.methods, size2 - length2,
                            length2);
                        break;

                    case 3:
                        size3 += (length2 = end - start);
                        System.arraycopy(this.astStack, this.astPtr + start + 1, typeDecl.memberTypes, size3 - length2,
                            length2);
                        break;
                }
                flagI = flag[start = end];
            }
        }

    }

    protected void dispatchDeclarationIntoEnumDeclaration(int length) {
        if (length == 0)
            return;
        int[] flag = new int[length + 1]; // plus one -- see <HERE>
        int size1 = 0, size2 = 0, size3 = 0;
        TypeDeclaration enumDeclaration = (TypeDeclaration) this.astStack[this.astPtr - length];
        boolean hasAbstractMethods = false;
        int enumConstantsCounter = 0;
        for (int i = length - 1; i >= 0; i--) {
            ASTNode astNode = this.astStack[this.astPtr--];
            if (astNode instanceof AbstractMethodDeclaration method) {
                // methods and constructors have been regrouped into one single list
                flag[i] = 2;
                size2++;
                if (method.isAbstract()) {
                    hasAbstractMethods = true;
                }
            } else if (astNode instanceof TypeDeclaration) {
                flag[i] = 3;
                size3++;
            } else if (astNode instanceof FieldDeclaration field) {
                flag[i] = 1;
                size1++;
                if (field.getKind() == 3) {
                    enumConstantsCounter++;
                }
            }
        }

        // arrays creation
        if (size1 != 0) {
            enumDeclaration.fields = new FieldDeclaration[size1];
        }
        if (size2 != 0) {
            enumDeclaration.methods = new AbstractMethodDeclaration[size2];
            if (hasAbstractMethods)
                enumDeclaration.bits |= 2048;
        }
        if (size3 != 0) {
            enumDeclaration.memberTypes = new TypeDeclaration[size3];
        }

        // arrays fill up
        size1 = size2 = size3 = 0;
        int flagI = flag[0], start = 0;
        int length2;
        for (int end = 0; end <= length; end++) // <HERE> the plus one allows to
        {
            if (flagI != flag[end]) // treat the last element as a ended flag.....
            { // array copy
                switch (flagI) {
                    case 1:
                        size1 += (length2 = end - start);
                        System.arraycopy(this.astStack, this.astPtr + start + 1, enumDeclaration.fields,
                            size1 - length2, length2);
                        break;

                    case 2:
                        size2 += (length2 = end - start);
                        System.arraycopy(this.astStack, this.astPtr + start + 1, enumDeclaration.methods,
                            size2 - length2, length2);
                        break;

                    case 3:
                        size3 += (length2 = end - start);
                        System.arraycopy(this.astStack, this.astPtr + start + 1, enumDeclaration.memberTypes,
                            size3 - length2, length2);
                        break;
                }
                flagI = flag[start = end];
            }
        }

    }

    protected CompilationUnitDeclaration endParse(int act) {
        this.lastAct = act;

        if (this.statementRecoveryActivated) {
            RecoveredElement recoveredElement = buildInitialRecoveryState();

            if (recoveredElement != null) {
                recoveredElement.topElement().updateParseTree();
            }

            if (this.hasError)
                resetStacks();
        } else if (this.currentElement != null) {
            this.currentElement.topElement().updateParseTree();
        } else {
        }
        persistLineSeparatorPositions();
        for (int i = 0; i < this.scanner.foundTaskCount; i++) {
            if (!this.statementRecoveryActivated)
                problemReporter().task(new String(this.scanner.foundTaskTags[i]),
                    new String(this.scanner.foundTaskMessages[i]),
                    this.scanner.foundTaskPriorities[i] == null
                        ? null
                        : new String(this.scanner.foundTaskPriorities[i]),
                    this.scanner.foundTaskPositions[i][0], this.scanner.foundTaskPositions[i][1]);
        }
        this.javadoc = null;
        return this.compilationUnit;
    }

    /*
     * Flush comments defined prior to a given positions.
     *
     * Note: comments are stacked in syntactical order
     *
     * Either answer given <position>, or the end position of a comment line immediately following the <position> (same
     * line)
     *
     * e.g. void foo(){ } // end of method foo
     */
    public int flushCommentsDefinedPriorTo(int position) {
        int lastCommentIndex = this.scanner.commentPtr;
        if (lastCommentIndex < 0)
            return position; // no comment

        // compute the index of the first obsolete comment
        int index = lastCommentIndex;
        int validCount = 0;
        while (index >= 0) {
            int commentEnd = this.scanner.commentStops[index];
            if (commentEnd < 0)
                commentEnd = -commentEnd; // negative end position for non-javadoc comments
            if (commentEnd <= position) {
                break;
            }
            index--;
            validCount++;
        }
        // if the source at <position> is immediately followed by a line comment, then
        // flush this comment and shift <position> to the comment end.
        if (validCount > 0) {
            int immediateCommentEnd = -this.scanner.commentStops[index + 1]; // non-javadoc comment end positions are
                                                                             // negative
            if (immediateCommentEnd > 0) { // only tolerating non-javadoc comments
                // is there any line break until the end of the immediate comment ? (thus only tolerating line comment)
                immediateCommentEnd--; // comment end in one char too far
                if (Util.getLineNumber(position, this.scanner.lineEnds, 0, this.scanner.linePtr)
                    == Util.getLineNumber(immediateCommentEnd, this.scanner.lineEnds, 0, this.scanner.linePtr)) {
                    position = immediateCommentEnd;
                    validCount--; // flush this comment
                    index++;
                }
            }
        }

        if (index < 0)
            return position; // no obsolete comment

        switch (validCount) {
            case 0:
                // do nothing
                break;

            // move valid comment infos, overriding obsolete comment infos
            case 2:
                this.scanner.copyCommentInfo(0, index + 1);
                this.scanner.copyCommentInfo(1, index + 2);
                break;

            case 1:
                this.scanner.copyCommentInfo(0, index + 1);
                break;

            default:
                this.scanner.copyAllCommentInfo(index + 1, validCount);
        }
        this.scanner.commentPtr = validCount - 1;
        return position;
    }

    protected TypeReference getAnnotationType() {
        int length = this.identifierLengthStack[this.identifierLengthPtr--];
        if (length == 1) {
            return new SingleTypeReference(this.identifierStack[this.identifierPtr],
                this.identifierPositionStack[this.identifierPtr--]);
        } else {
            char[][] tokens = new char[length][];
            this.identifierPtr -= length;
            long[] positions = new long[length];
            System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens, 0, length);
            System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions, 0, length);
            return new QualifiedTypeReference(tokens, positions);
        }
    }

    public TerminalToken getFirstToken() {
        // the first token is a virtual token that
        // allows the parser to parse several goals
        // even if they aren't LALR(1)....
        // Goal ::= '++' CompilationUnit
        // Goal ::= '--' MethodBody
        // Goal ::= '==' ConstructorBody
        // -- Initializer
        // Goal ::= '>>' StaticInitializer
        // Goal ::= '>>' Block
        // -- error recovery
        // Goal ::= '>>>' Headers
        // Goal ::= '*' BlockStatements
        // Goal ::= '*' MethodPushModifiersHeader
        // -- JDOM
        // Goal ::= '&&' FieldDeclaration
        // Goal ::= '||' ImportDeclaration
        // Goal ::= '?' PackageDeclaration
        // Goal ::= '+' TypeDeclaration
        // Goal ::= '/' GenericMethodDeclaration
        // Goal ::= '&' ClassBodyDeclaration
        // -- code snippet
        // Goal ::= '%' Expression
        // -- completion parser
        // Goal ::= '!' ConstructorBlockStatementsopt
        // Goal ::= '~' BlockStatementsopt

        return this.firstToken;
    }

    protected void annotateTypeReference(Wildcard ref) {
        int length;
        if ((length = this.typeAnnotationLengthStack[this.typeAnnotationLengthPtr--]) != 0) {
            if (ref.annotations == null)
                ref.annotations = new Annotation[1][];
            System.arraycopy(this.typeAnnotationStack, (this.typeAnnotationPtr -= length) + 1,
                ref.annotations[0] = new Annotation[length], 0, length);
            if (ref.sourceStart > ref.annotations[0][0].sourceStart) {
                ref.sourceStart = ref.annotations[0][0].sourceStart;
            }
            ref.bits |= 1048576;
        }
        if (ref.bound != null) {
            ref.bits |= (ref.bound.bits & 1048576);
        }
    }

    protected final TypeReference getTypeReference(int dim) {
        TypeReference typeRef = constructTypeReference(dim);
        if (isParsingJava10Plus()
            && typeRef instanceof ArrayTypeReference singleTypeRef
            && CharOperation.equals(singleTypeRef.token, TypeConstants.VAR)) {
            if (singleTypeRef.isParameterizedTypeReference())
                problemReporter().varCannotBeUsedWithTypeArguments(singleTypeRef);
            if (singleTypeRef.dimensions() > 0)
                problemReporter().varLocalCannotBeArray(singleTypeRef);
        }
        return typeRef;
    }

    /* Construct a TypeReference that may be qualified or not with dim as its dimensions */
    protected TypeReference constructTypeReference(int dim) {
        TypeReference ref;
        Annotation[][] annotationsOnDimensions = null;
        int length = this.identifierLengthStack[this.identifierLengthPtr--];
        if (length < 0) { // flag for precompiled type reference on base types
            if (dim > 0) {
                annotationsOnDimensions = getAnnotationsOnDimensions(dim);
            }
            ref = TypeReference.baseTypeReference(-length, dim, annotationsOnDimensions);
            ref.sourceStart = this.intStack[this.intPtr--];
            if (dim == 0) {
                ref.sourceEnd = this.intStack[this.intPtr--];
            } else {
                this.intPtr--;
                ref.sourceEnd = this.rBracketPosition;
            }
        } else {
            int numberOfIdentifiers = this.genericsIdentifiersLengthStack[this.genericsIdentifiersLengthPtr--];
            if (length != numberOfIdentifiers || this.genericsLengthStack[this.genericsLengthPtr] != 0) {
                // generic type
                ref = getTypeReferenceForGenericType(dim, length, numberOfIdentifiers);
            } else if (length == 1) {
                // single type reference
                this.genericsLengthPtr--; // pop the 0
                if (dim == 0) {
                    ref = new SingleTypeReference(this.identifierStack[this.identifierPtr],
                        this.identifierPositionStack[this.identifierPtr--]);
                } else {
                    annotationsOnDimensions = getAnnotationsOnDimensions(dim);
                    ref = new ArrayTypeReference(this.identifierStack[this.identifierPtr], dim, annotationsOnDimensions,
                        this.identifierPositionStack[this.identifierPtr--]);
                    ref.sourceEnd = this.endPosition;
                    if (annotationsOnDimensions != null) {
                        ref.bits |= 1048576;
                    }
                }
            } else {
                this.genericsLengthPtr--;
                // Qualified type reference
                char[][] tokens = new char[length][];
                this.identifierPtr -= length;
                long[] positions = new long[length];
                System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens, 0, length);
                System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions, 0, length);
                if (dim == 0) {
                    ref = new QualifiedTypeReference(tokens, positions);
                } else {
                    annotationsOnDimensions = getAnnotationsOnDimensions(dim);
                    ref = new ArrayQualifiedTypeReference(tokens, dim, annotationsOnDimensions, positions);
                    ref.sourceEnd = this.endPosition;
                    if (annotationsOnDimensions != null) {
                        ref.bits |= 1048576;
                    }
                }
            }
        }
        int levels = ref.getAnnotatableLevels();
        for (int i = levels - 1; i >= 0; i--) {
            if ((length = this.typeAnnotationLengthStack[this.typeAnnotationLengthPtr--]) != 0) {
                if (ref.annotations == null)
                    ref.annotations = new Annotation[levels][];
                System.arraycopy(this.typeAnnotationStack, (this.typeAnnotationPtr -= length) + 1,
                    ref.annotations[i] = new Annotation[length], 0, length);
                if (i == 0) {
                    ref.sourceStart = ref.annotations[0][0].sourceStart;
                }
                ref.bits |= 1048576;
            }
        }
        return ref;
    }

    protected TypeReference getTypeReferenceForGenericType(int dim, int identifierLength, int numberOfIdentifiers) {
        Annotation[][] annotationsOnDimensions = dim == 0 ? null : getAnnotationsOnDimensions(dim);
        if (identifierLength == 1 && numberOfIdentifiers == 1) {
            int currentTypeArgumentsLength = this.genericsLengthStack[this.genericsLengthPtr--];
            TypeReference[] typeArguments;
            if (currentTypeArgumentsLength < 0) {
                typeArguments = TypeReference.NO_TYPE_ARGUMENTS;
            } else {
                typeArguments = new TypeReference[currentTypeArgumentsLength];
                this.genericsPtr -= currentTypeArgumentsLength;
                System.arraycopy(this.genericsStack, this.genericsPtr + 1, typeArguments, 0,
                    currentTypeArgumentsLength);
            }
            ParameterizedSingleTypeReference parameterizedSingleTypeReference
                = new ParameterizedSingleTypeReference(this.identifierStack[this.identifierPtr], typeArguments, dim,
                    annotationsOnDimensions, this.identifierPositionStack[this.identifierPtr--]);
            if (dim != 0) {
                parameterizedSingleTypeReference.sourceEnd = this.endStatementPosition;
            }
            /*
             * We used to eagerly mark the PSTR as constituting diamond usage if we encountered <>, but that is too
             * eager and complicates error handling by making it hard to distinguish legitimate use cases from ill
             * formed ones. We are more discriminating now and tag a type as being diamond only where <> can legally
             * occur. See https://bugs.eclipse.org/bugs/show_bug.cgi?id=339478#c11
             */
            return parameterizedSingleTypeReference;
        } else {
            TypeReference[][] typeArguments = new TypeReference[numberOfIdentifiers][];
            char[][] tokens = new char[numberOfIdentifiers][];
            long[] positions = new long[numberOfIdentifiers];
            int index = numberOfIdentifiers;
            int currentIdentifiersLength = identifierLength;
            while (index > 0) {
                int currentTypeArgumentsLength = this.genericsLengthStack[this.genericsLengthPtr--];
                if (currentTypeArgumentsLength > 0) {
                    this.genericsPtr -= currentTypeArgumentsLength;
                    System.arraycopy(this.genericsStack, this.genericsPtr + 1,
                        typeArguments[index - 1] = new TypeReference[currentTypeArgumentsLength], 0,
                        currentTypeArgumentsLength);
                } else if (currentTypeArgumentsLength < 0) {
                    // diamond case for qualified type reference (java.util.ArrayList<>)
                    typeArguments[index - 1] = TypeReference.NO_TYPE_ARGUMENTS;
                }
                switch (currentIdentifiersLength) {
                    case 1:
                        // we are in a case A<B>.C<D> or A<B>.C<D>
                        tokens[index - 1] = this.identifierStack[this.identifierPtr];
                        positions[index - 1] = this.identifierPositionStack[this.identifierPtr--];
                        break;

                    default:
                        // we are in a case A.B.C<B>.C<D> or A.B.C<B>...
                        this.identifierPtr -= currentIdentifiersLength;
                        System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens,
                            index - currentIdentifiersLength, currentIdentifiersLength);
                        System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions,
                            index - currentIdentifiersLength, currentIdentifiersLength);
                }
                index -= currentIdentifiersLength;
                if (index > 0) {
                    currentIdentifiersLength = this.identifierLengthStack[this.identifierLengthPtr--];
                }
            }
            ParameterizedQualifiedTypeReference parameterizedQualifiedTypeReference
                = new ParameterizedQualifiedTypeReference(tokens, typeArguments, dim, annotationsOnDimensions,
                    positions);
            if (dim != 0) {
                parameterizedQualifiedTypeReference.sourceEnd = this.endStatementPosition;
            }
            /*
             * We used to eagerly mark the PQTR as constituting diamond usage if we encountered <>, but that is too
             * eager and complicates error handling by making it hard to distinguish legitimate use cases from ill
             * formed ones. We are more discriminating now and tag a type as being diamond only where <> can legally
             * occur. See https://bugs.eclipse.org/bugs/show_bug.cgi?id=339478#c11
             */
            return parameterizedQualifiedTypeReference;
        }
    }

    protected NameReference getUnspecifiedReference() {
        return getUnspecifiedReference(true);
    }

    protected NameReference getUnspecifiedReference(boolean rejectTypeAnnotations) {
        /* build a (unspecified) NameReference which may be qualified */
        if (rejectTypeAnnotations) { // Compensate for overpermissive grammar.
            consumeNonTypeUseName();
        }
        int length;
        NameReference ref;
        if ((length = this.identifierLengthStack[this.identifierLengthPtr--]) == 1)
            // single variable reference
            ref = new SingleNameReference(this.identifierStack[this.identifierPtr],
                this.identifierPositionStack[this.identifierPtr--]);
        else
        // Qualified variable reference
        {
            char[][] tokens = new char[length][];
            this.identifierPtr -= length;
            System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens, 0, length);
            long[] positions = new long[length];
            System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions, 0, length);
            ref = new QualifiedNameReference(tokens, positions,
                (int) (this.identifierPositionStack[this.identifierPtr + 1] >> 32), // sourceStart
                (int) this.identifierPositionStack[this.identifierPtr + length]); // sourceEnd
        }
        return ref;
    }

    protected NameReference getUnspecifiedReferenceOptimized() {
        /*
         * build a (unspecified) NameReference which may be qualified The optimization occurs for qualified reference
         * while we are certain in this case the last item of the qualified name is a field access. This optimization is
         * IMPORTANT while it results that when a NameReference is build, the type checker should always look for that
         * it is not a type reference
         */
        consumeNonTypeUseName();
        int length;
        NameReference ref;
        if ((length = this.identifierLengthStack[this.identifierLengthPtr--]) == 1) {
            // single variable reference
            ref = new SingleNameReference(this.identifierStack[this.identifierPtr],
                this.identifierPositionStack[this.identifierPtr--]);
            ref.bits &= ~7;
            ref.bits |= 2 | 1;
            return ref;
        }

        // Qualified-variable-reference
        // In fact it is variable-reference DOT field-ref , but it would result in a type
        // conflict tha can be only reduce by making a superclass (or inetrface ) between
        // nameReference and FieldReference or putting FieldReference under NameReference
        // or else..........This optimisation is not really relevant so just leave as it is

        char[][] tokens = new char[length][];
        this.identifierPtr -= length;
        System.arraycopy(this.identifierStack, this.identifierPtr + 1, tokens, 0, length);
        long[] positions = new long[length];
        System.arraycopy(this.identifierPositionStack, this.identifierPtr + 1, positions, 0, length);
        ref = new QualifiedNameReference(tokens, positions,
            (int) (this.identifierPositionStack[this.identifierPtr + 1] >> 32), // sourceStart
            (int) this.identifierPositionStack[this.identifierPtr + length]); // sourceEnd
        ref.bits &= ~7;
        ref.bits |= 2 | 1;
        return ref;
    }

    public void goForBlockStatementsopt() {
        // tells the scanner to go for block statements opt parsing

        this.firstToken = TokenNameTWIDDLE;
        this.scanner.recordLineSeparator = false;
    }

    public void goForClassBodyDeclarations() {
        // tells the scanner to go for any body declarations parsing

        this.firstToken = TokenNameAND;
        this.scanner.recordLineSeparator = true;
    }

    public void goForCompilationUnit() {
        // tells the scanner to go for compilation unit parsing

        this.firstToken = TokenNamePLUS_PLUS;
        this.scanner.foundTaskCount = 0;
        this.scanner.recordLineSeparator = true;
    }

    public void goForExpression() {
        // tells the scanner to go for an expression parsing

        this.firstToken = TokenNameREMAINDER;
        this.scanner.recordLineSeparator = true; // recovery goals must record line separators
    }

    public void goForHeaders() {
        // tells the scanner to go for headers only parsing
        RecoveredType currentType = currentRecoveryType();
        if (currentType != null && currentType.insideEnumConstantPart) {
            this.firstToken = TokenNameNOT;
        } else {
            this.firstToken = TokenNameUNSIGNED_RIGHT_SHIFT;
        }
        this.scanner.recordLineSeparator = true; // recovery goals must record line separators
        this.scanner.scanContext = null;
    }

    /**
     * Look for a specific tag comment leading a given source range (comment located after any statement in astStack)
     *
     * @param rangeEnd int
     * @return boolean
     */
    public boolean hasLeadingTagComment(char[] commentPrefixTag, int rangeEnd) {
        int iComment = this.scanner.commentPtr;
        if (iComment < 0)
            return false; // no comment available
        int iStatement = this.astLengthPtr;
        if (iStatement < 0 || this.astLengthStack[iStatement] <= 1)
            return false; // no statement available
        // Fallthrough comment must be located after the previous statement
        ASTNode lastNode = this.astStack[this.astPtr];
        int rangeStart = lastNode.sourceEnd;
        previousComment: for (; iComment >= 0; iComment--) {
            int commentStart = this.scanner.commentStarts[iComment];
            if (commentStart < 0)
                commentStart = -commentStart; // line comments have negative start positions
            // ignore comments before start
            if (commentStart < rangeStart)
                return false; // no more comments in range
            // ignore comments after end
            if (commentStart > rangeEnd)
                continue;
            // found last comment in range - only check the last comment in range
            char[] source = this.scanner.source;
            int charPos = commentStart + 2; // skip // or /*
            // tag can be leaded by optional spaces
            for (; charPos < rangeEnd; charPos++) {
                char c = source[charPos];
                if (c >= 128 || (ScannerHelper.OBVIOUS_IDENT_CHAR_NATURES[c] & 256) == 0) {
                    break;
                }
            }
            for (int iTag = 0, length = commentPrefixTag.length; iTag < length; iTag++, charPos++) {
                if (charPos >= rangeEnd // comment is too small to host tag
                    || source[charPos] != commentPrefixTag[iTag]) {
                    if (iTag == 0) {
                        return false; // didn't even match leading '$' -> not a tag comment
                    } else {
                        continue previousComment; // accept as tag comment -> skip it and keep searching backwards
                    }
                }
            }
            return true;
        }
        return false;
    }

    protected void ignoreExpressionAssignment() {
        // Assignment ::= InvalidArrayInitializerAssignement
        // encoded operator would be: this.intStack[this.intPtr]
        this.intPtr--;
        ArrayInitializer arrayInitializer = (ArrayInitializer) this.expressionStack[this.expressionPtr--];
        this.expressionLengthPtr--;
        // report a syntax error and abort parsing
        if (!this.statementRecoveryActivated)
            problemReporter().arrayConstantsOnlyInArrayInitializers(arrayInitializer.sourceStart,
                arrayInitializer.sourceEnd);
    }

    public void initialize() {
        this.initialize(false);
    }

    public void initialize(boolean parsingCompilationUnit) {
        // positioning the parser for a new compilation unit
        // avoiding stack reallocation and all that....
        this.javadoc = null;
        this.astPtr = -1;
        this.astLengthPtr = -1;
        this.expressionPtr = -1;
        this.expressionLengthPtr = -1;
        this.typeAnnotationLengthPtr = -1;
        this.typeAnnotationPtr = -1;
        this.identifierPtr = -1;
        this.identifierLengthPtr = -1;
        this.intPtr = -1;
        this.nestedMethod[this.nestedType = 0] = 0; // need to reset for further reuse
        this.variablesCounter[this.nestedType] = 0;
        this.dimensions = 0;
        this.realBlockPtr = -1;
        this.compilationUnit = null;
        this.referenceContext = null;
        this.endStatementPosition = 0;

        // remove objects from stack too, while the same parser/compiler couple is
        // re-used between two compilations ....

        int astLength = this.astStack.length;
        if (this.noAstNodes.length < astLength) {
            this.noAstNodes = new ASTNode[astLength];
            // System.out.println("Resized AST stacks : "+ astLength);

        }
        System.arraycopy(this.noAstNodes, 0, this.astStack, 0, astLength);

        int expressionLength = this.expressionStack.length;
        if (this.noExpressions.length < expressionLength) {
            this.noExpressions = new Expression[expressionLength];
            // System.out.println("Resized EXPR stacks : "+ expressionLength);
        }
        System.arraycopy(this.noExpressions, 0, this.expressionStack, 0, expressionLength);

        // reset this.scanner state
        this.scanner.commentPtr = -1;
        this.scanner.foundTaskCount = 0;
        this.scanner.eofPosition = Integer.MAX_VALUE;
        this.recordStringLiterals = true;
        final boolean checkNLS = this.options.getSeverity(256) != 256;
        this.checkExternalizeStrings = checkNLS;
        this.scanner.checkNonExternalizedStringLiterals = parsingCompilationUnit && checkNLS;
        this.scanner.checkUninternedIdentityComparison
            = parsingCompilationUnit && this.options.complainOnUninternedIdentityComparison;
        this.scanner.lastPosition = -1;

        resetModifiers();

        // recovery
        this.lastCheckPoint = -1;
        this.currentElement = null;
        this.restartRecovery = false;
        this.hasReportedError = false;
        this.recoveredStaticInitializerStart = 0;
        this.lastIgnoredToken = TokenNameInvalid;
        this.lastErrorEndPositionBeforeRecovery = -1;
        this.lastJavadocEnd = -1;
        this.listLength = 0;
        this.parsingRecordComponents = false;
        this.listTypeParameterLength = 0;
        this.lastPosistion = -1;

        this.rBraceStart = 0;
        this.rBraceEnd = 0;
        this.rBraceSuccessorStart = 0;
        this.rBracketPosition = 0;

        this.genericsIdentifiersLengthPtr = -1;
        this.genericsLengthPtr = -1;
        this.genericsPtr = -1;
    }

    public void initializeScanner() {
        this.scanner = new Scanner(false /* comment */, false /* whitespace */, false, /*
                                                                                        * will be set in
                                                                                        * initialize(boolean)
                                                                                        */
            this.options.sourceLevel /* sourceLevel */, this.options.complianceLevel /* complianceLevel */,
            this.options.taskTags/* taskTags */, this.options.taskPriorities/* taskPriorities */,
            this.options.isTaskCaseSensitive/* taskCaseSensitive */,
            this.options.enablePreviewFeatures /* isPreviewEnabled */);
    }

    public void jumpOverMethodBody() {
        // on diet parsing.....do not buffer method statements

        // the scanner.diet is reinitialized to false
        // automatically by the scanner once it has jumped over
        // the statements

        if (this.diet && (this.dietInt == 0))
            this.scanner.diet = true;
    }

    private void jumpOverType() {
        if (this.recoveredTypes != null
            && this.nextTypeStart > -1
            && this.nextTypeStart < this.scanner.currentPosition) {
            TypeDeclaration typeDeclaration = this.recoveredTypes[this.recoveredTypePtr];
            boolean isAnonymous = typeDeclaration.allocation != null;

            this.scanner.startPosition = typeDeclaration.declarationSourceEnd + 1;
            this.scanner.currentPosition = typeDeclaration.declarationSourceEnd + 1;
            this.scanner.diet = false; // quit jumping over method bodies

            if (!isAnonymous) {
                ((RecoveryScanner) this.scanner)
                    .setPendingTokens(new TerminalToken[] { TokenNameSEMICOLON, TokenNamebreak });
            } else {
                ((RecoveryScanner) this.scanner)
                    .setPendingTokens(new TerminalToken[] { TokenNameIdentifier, TokenNameEQUAL, TokenNameIdentifier });
            }

            this.pendingRecoveredType = typeDeclaration;

            try {
                this.currentToken = this.scanner.getNextToken();
            } catch (InvalidInputException e) {
                // it's impossible because we added pending tokens before
            }

            if (++this.recoveredTypePtr < this.recoveredTypes.length) {
                TypeDeclaration nextTypeDeclaration = this.recoveredTypes[this.recoveredTypePtr];
                this.nextTypeStart = nextTypeDeclaration.allocation == null
                    ? nextTypeDeclaration.declarationSourceStart
                    : nextTypeDeclaration.allocation.sourceStart;
            } else {
                this.nextTypeStart = Integer.MAX_VALUE;
            }
        }
    }

    protected void markEnclosingMemberWithLocalType() {
        if (this.currentElement != null)
            return; // this is already done in the recovery code
        markEnclosingMemberWithLocalOrFunctionalType(LocalTypeKind.LOCAL);
    }

    protected void markEnclosingMemberWithLocalOrFunctionalType(LocalTypeKind context) {
        for (int i = this.astPtr; i >= 0; i--) {
            ASTNode node = this.astStack[i];
            if (node instanceof AbstractMethodDeclaration
                || node instanceof FieldDeclaration
                || (node instanceof TypeDeclaration type // mark type for now: all initializers will be marked when
                                                         // added to this type
                    // and enclosing type must not be closed (see https://bugs.eclipse.org/bugs/show_bug.cgi?id=147485)
                    && type.declarationSourceEnd == 0)) {
                switch (context) {
                    case METHOD_REFERENCE:
                        node.bits |= 2097152;
                        break;

                    case LAMBDA:
                        node.bits |= 2097152;
                        //$FALL-THROUGH$
                    case LOCAL:
                        node.bits |= 2;
                }
                return;
            }
        }
        // default to reference context (case of parse method body)
        if (this.referenceContext instanceof AbstractMethodDeclaration
            || this.referenceContext instanceof TypeDeclaration) {
            ASTNode node = (ASTNode) this.referenceContext;
            switch (context) {
                case METHOD_REFERENCE:
                    node.bits |= 2097152;
                    break;

                case LAMBDA:
                    node.bits |= 2097152;
                    //$FALL-THROUGH$
                case LOCAL:
                    node.bits |= 2;
            }
        }
    }

    /*
     * Move checkpoint location (current implementation is moving it by one token)
     *
     * Answers true if successfully moved checkpoint (in other words, it did not attempt to move it beyond end of file).
     */
    protected boolean moveRecoveryCheckpoint() {
        int pos = this.lastCheckPoint;
        /* reset this.scanner, and move checkpoint by one token */
        this.scanner.startPosition = pos;
        this.scanner.currentPosition = pos;
        this.scanner.diet = false; // quit jumping over method bodies

        /* if about to restart, then no need to shift token */
        if (this.restartRecovery) {
            this.lastIgnoredToken = TokenNameInvalid;
            return true;
        }

        /* protect against shifting on an invalid token */
        this.lastIgnoredToken = this.nextIgnoredToken;
        this.nextIgnoredToken = TokenNameInvalid;
        do {
            try {
                this.scanner.resetLookBack(); // stay clear of the voodoo in the present method
                this.nextIgnoredToken = this.scanner.getNextToken();
            } catch (InvalidInputException e) {
                pos = this.scanner.currentPosition;
            } finally {
                this.scanner.resetLookBack(); // steer clear of the voodoo in the present method
            }
        } while (this.nextIgnoredToken == TokenNameInvalid);

        if (this.nextIgnoredToken == TokenNameEOF) { // no more recovery after this point
            if (this.currentToken == TokenNameEOF) { // already tried one iteration on EOF
                return false;
            }
        }
        if (this.lastCheckPoint == this.scanner.currentPosition) {
            // Possible infinite loop - synthetic token? bailout for now
            // TODO: more intelligent solution?
            return false;
        }
        this.lastCheckPoint = this.scanner.currentPosition;

        /* reset this.scanner again to previous checkpoint location */
        this.scanner.startPosition = pos;
        this.scanner.currentPosition = pos;
        this.scanner.commentPtr = -1;
        this.scanner.foundTaskCount = 0;
        return true;

        /*
         * The following implementation moves the checkpoint location by one line:
         *
         * int pos = this.lastCheckPoint; // reset this.scanner, and move checkpoint by one token
         * this.scanner.startPosition = pos; this.scanner.currentPosition = pos; this.scanner.diet = false; // quit
         * jumping over method bodies
         *
         * // if about to restart, then no need to shift token if (this.restartRecovery){ this.lastIgnoredToken = -1;
         * return true; }
         *
         * // protect against shifting on an invalid token this.lastIgnoredToken = this.nextIgnoredToken;
         * this.nextIgnoredToken = -1;
         *
         * boolean wasTokenizingWhiteSpace = this.scanner.tokenizeWhiteSpace; this.scanner.tokenizeWhiteSpace = true;
         * checkpointMove: do { try { this.nextIgnoredToken = this.scanner.getNextToken();
         * switch(this.nextIgnoredToken){ case Scanner.TokenNameWHITESPACE :
         * if(this.scanner.getLineNumber(this.scanner.startPosition) ==
         * this.scanner.getLineNumber(this.scanner.currentPosition)){ this.nextIgnoredToken = -1; } break; case
         * TokenNameSEMICOLON : case TokenNameLBRACE : case TokenNameRBRACE : break; case TokenNameIdentifier :
         * if(this.scanner.currentPosition == this.scanner.startPosition){ this.scanner.currentPosition++; // on fake
         * completion identifier } default: this.nextIgnoredToken = -1; break; case TokenNameEOF : break checkpointMove;
         * } } catch(InvalidInputException e){ pos = this.scanner.currentPosition; } } while (this.nextIgnoredToken <
         * 0); this.scanner.tokenizeWhiteSpace = wasTokenizingWhiteSpace;
         *
         * if (this.nextIgnoredToken == TokenNameEOF) { // no more recovery after this point if (this.currentToken ==
         * TokenNameEOF) { // already tried one iteration on EOF return false; } } this.lastCheckPoint =
         * this.scanner.currentPosition;
         *
         * // reset this.scanner again to previous checkpoint location this.scanner.startPosition = pos;
         * this.scanner.currentPosition = pos; this.scanner.commentPtr = -1;
         *
         * return true;
         */
    }

    protected MessageSend newMessageSend() {
        // '(' ArgumentListopt ')'
        // the arguments are on the expression stack

        MessageSend m = new MessageSend();
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            this.expressionPtr -= length;
            System.arraycopy(this.expressionStack, this.expressionPtr + 1, m.arguments = new Expression[length], 0,
                length);
        }
        return m;
    }

    protected MessageSend newMessageSendWithTypeArguments() {
        MessageSend m = new MessageSend();
        int length;
        if ((length = this.expressionLengthStack[this.expressionLengthPtr--]) != 0) {
            this.expressionPtr -= length;
            System.arraycopy(this.expressionStack, this.expressionPtr + 1, m.arguments = new Expression[length], 0,
                length);
        }
        return m;
    }

    protected void optimizedConcatNodeLists() {
        /*
         * back from a recursive loop. Virtualy group the astNode into an array using this.astLengthStack
         */

        /*
         * This is a case where you have two sublists into the this.astStack that you want to merge in one list. There
         * is no action required on the this.astStack. The only thing you need to do is merge the two lengths specified
         * on the astStackLength. The top two length are for example: ... p n and you want to result in a list like: ...
         * n+p This means that the p could be equals to 0 in case there is no astNode pushed on the this.astStack. Look
         * at the InterfaceMemberDeclarations for an example. This case optimizes the fact that p == 1.
         */

        this.astLengthStack[--this.astLengthPtr]++;
    }

    @Override
    public boolean atConflictScenario(TerminalToken token) {

        /*
         * Answer true if the parser is at a configuration where the scanner must look ahead and help disambiguate
         * between (a) '<' as an operator and '<' as the start of <type argument> and (b) the use of '(' in '('
         * expression ')' and '( type ')' and '(' lambda formal parameters ')'. (c) whether the token @ begins a Java
         * SE5 style declaration annotation or if it begins a SE8 style type annotation. When requested thus, the
         * scanner helps by fabricating synthetic tokens and injecting them into the stream ahead of the tokens that
         * trigger conflicts in the absence of these artificial tokens. These manufactured token help transform the
         * grammar into LALR(1) by splitting the states so that they have unambigious prefixes.
         *
         * We do this by claiming to the automaton that the next token seen is the (suitable) synthetic token and
         * observing the response of the state machine. Error signals we are NOT at a conflict site, while shift or
         * shift/reduce signals that we are. Accept is impossible, while there may be intermediate reductions that are
         * called for -- It is axiomatic of the push down automaton that corresponds to the LALR grammar that it will
         * never shift on invalid input.
         *
         * Obviously, the dry runs should not alter the parser state in any way or otherwise cause side effects. Proof
         * by argument that this is the case:
         *
         * - The only pieces of state needed to answer the question are: this.stack, this.stateStackTop and the last
         * action variable `act`. None of the various and sundry stacks used in the AST constructions process are
         * touched here. - As we reduce, we DON'T call the semantic action functions i.e the consume* method calls are
         * skipped. - Lexer stream is left untouched. - this.stateStackTop and the last action variable `act` of the
         * automaton are readily cloned, these being primitives and changes are to the replicas. - We never remove
         * elements from the state stack here (or elsewhere for that matter). Pops are implemented by mere adjustments
         * of the stack pointer. - During this algorithm, either the stack pointer monotonically decreases or stays
         * fixed. (The only way for the stack pointer to increase would call for a shift or a shift/reduce at which
         * point the algorithm is ready to terminate already.) This means that we don't have to replicate the stack.
         * Pushes can be mimiced by writing to a local stackTopState variable, leaving the original stack untouched.
         *
         * Though this code looks complex, we should exit early in most situations.
         */
        if (this.unstackedAct == 17981) { // automaton is not running.
            return false;
        }
        return switch (token) {
            case TokenNameLPAREN -> automatonWillShift(TokenNameBeginLambda, this.unstackedAct)
                || automatonWillShift(TokenNameBeginIntersectionCast, this.unstackedAct);
            case TokenNameLESS -> automatonWillShift(TokenNameBeginTypeArguments, this.unstackedAct);
            case TokenNameAT -> automatonWillShift(token, this.unstackedAct);
            default -> throw new IllegalArgumentException("unexpected token " + token); //$NON-NLS-1$
        };
    }

    /*
     * main loop of the automat When a rule is reduced, the method consumeRule(int) is called with the number of the
     * consumed rule. When a terminal is consumed, the method consumeToken(TerminalToken) is called in order to remember
     * (when needed) the consumed token
     */
// (int)asr[asi(act)]
// name[symbol_index[currentKind]]
    protected void parse() {
        // $NON-NLS-1$

        boolean isDietParse = this.diet;
        TerminalToken oldFirstToken = getFirstToken();
        this.hasError = false;

        this.hasReportedError = false;
        int act = 991;
        this.unstackedAct = 17981;
        this.stateStackTop = -1;
        this.currentToken = getFirstToken();

        try {
            this.scanner.setActiveParser(this);
            ProcessTerminals: for (;;) {
                if (Thread.currentThread().isInterrupted()) {
                    Thread.currentThread().interrupt();
                    throw new AbortCompilation(null); // fail silently
                }

                int stackLength = this.stack.length;
                if (++this.stateStackTop >= stackLength) {
                    System.arraycopy(this.stack, 0, this.stack = new int[stackLength + 255], 0, stackLength);
                }
                this.stack[this.stateStackTop] = act;
                this.unstackedAct = act = tAction(act, this.currentToken.tokenNumber());
                if (act == 17981 || this.restartRecovery()) {
                    if (!this.hasReportedError) {
                        if (act == 17981)
                            this.hasError = true;
                    }
                    TerminalToken previousToken = this.currentToken;
                    switch (resumeOnSyntaxError()) {
                        case 0:
                            act = 17981; // this is suspect, but goes quite some way back in time ...
                            break ProcessTerminals;

                        case 1:
                            if (act == 17981 && previousToken != TokenNameNotAToken) {
                            }
                            act = 991;
                            this.stateStackTop = -1;
                            this.currentToken = getFirstToken();
                            continue;

                        case 2:
                            if (act == 17981) {
                                act = this.stack[this.stateStackTop--];
                                continue;
                            } else {
                                // FALL THROUGH.
                            }
                    }
                }
                if (act <= 936) {
                    this.stateStackTop--;
                } else if (act > 17981) { /* shift-reduce */
                    consumeToken(this.currentToken);
                    if (this.currentElement != null) {
                        boolean oldValue = this.recordStringLiterals;
                        this.recordStringLiterals = false;
                        recoveryTokenCheck();
                        this.recordStringLiterals = oldValue;
                    }
                    try {
                        this.currentToken = fetchNextToken();
                    } catch (InvalidInputException e) {
                        if (!this.hasReportedError) {
                            problemReporter().scannerError(this, e.getMessage());
                            this.hasReportedError = true;
                        }
                        this.lastCheckPoint = this.scanner.currentPosition;
                        this.currentToken = TokenNameNotAToken;
                        this.restartRecovery = true;
                    }
                    if (this.statementRecoveryActivated) {
                        jumpOverType();
                    }
                    this.unstackedAct = act -= 17981;
                } else {
                    if (act < 17980) { /* shift */
                        consumeToken(this.currentToken);
                        if (this.currentElement != null) {
                            boolean oldValue = this.recordStringLiterals;
                            this.recordStringLiterals = false;
                            recoveryTokenCheck();
                            this.recordStringLiterals = oldValue;
                        }
                        try {
                            this.currentToken = fetchNextToken();
                        } catch (InvalidInputException e) {
                            if (!this.hasReportedError) {
                                problemReporter().scannerError(this, e.getMessage());
                                this.hasReportedError = true;
                            }
                            this.lastCheckPoint = this.scanner.currentPosition;
                            this.currentToken = TokenNameNotAToken;
                            this.restartRecovery = true;
                        }
                        if (this.statementRecoveryActivated) {
                            jumpOverType();
                        }
                        continue;
                    }
                    break ProcessTerminals;
                }

                // ProcessNonTerminals :
                do { /* reduce */
                    this.stateStackTop -= (rhs[act] - 1);
                    this.unstackedAct = ntAction(this.stack[this.stateStackTop], lhs[act]);
                    consumeRule(act);
                    act = this.unstackedAct;

                    if (act == 17980) {
                        break ProcessTerminals;
                    }
                } while (act <= 936);
            }
        } finally {
            this.unstackedAct = 17981;
            this.scanner.setActiveParser(null);
        }

        endParse(act);
        // record all nls tags in the corresponding compilation unit
        final NLSTag[] tags = this.scanner.getNLSTags();
        if (tags != null) {

        }

        this.scanner.checkNonExternalizedStringLiterals = false;

        if (this.scanner.checkUninternedIdentityComparison) {
            this.scanner.getIdentityComparisonLines();
            this.scanner.checkUninternedIdentityComparison = false;
        }

        if (this.reportSyntaxErrorIsRequired && this.hasError && !this.statementRecoveryActivated) {
            if (!this.options.performStatementsRecovery) {
                reportSyntaxErrors(isDietParse, oldFirstToken);
            } else {
                RecoveryScannerData data = this.referenceContext.compilationResult().recoveryScannerData;

                if (this.recoveryScanner == null) {
                    this.recoveryScanner = new RecoveryScanner(this.scanner, data);
                } else {
                    this.recoveryScanner.setData(data);
                }

                this.recoveryScanner.setSource(this.scanner.source);
                this.recoveryScanner.lineEnds = this.scanner.lineEnds;
                this.recoveryScanner.linePtr = this.scanner.linePtr;

                reportSyntaxErrors(isDietParse, oldFirstToken);

                if (data == null) {
                    this.referenceContext.compilationResult().recoveryScannerData = this.recoveryScanner.getData();
                }

                if (this.methodRecoveryActivated && this.options.performStatementsRecovery) {
                    this.methodRecoveryActivated = false;
                    recoverStatements();
                    this.methodRecoveryActivated = true;

                    this.lastAct = 17981;
                }
            }
        }
        this.problemReporter.referenceContext = null; // Null this so we won't escalate problems needlessly (bug 393192)
        // $NON-NLS-1$
    }

    protected boolean restartRecovery() {
        return this.restartRecovery;
    }

    protected TerminalToken fetchNextToken() throws InvalidInputException {
        return this.scanner.getNextToken();
    }

    public void parse(ConstructorDeclaration cd, CompilationUnitDeclaration unit, boolean recordLineSeparator) {
        // only parse the method body of cd
        // fill out its statements

        // convert bugs into parse error

        boolean oldMethodRecoveryActivated = this.methodRecoveryActivated;
        if (this.options.performMethodsFullRecovery) {
            this.methodRecoveryActivated = true;
            // we should not relocate bodyStart if there is a block within the statements
            this.ignoreNextOpeningBrace = true;
        }

        initialize();
        goForBlockStatementsopt();
        if (recordLineSeparator) {
            this.scanner.recordLineSeparator = true;
        }
        this.nestedMethod[this.nestedType]++;
        pushOnRealBlockStack();

        this.referenceContext = cd;
        this.compilationUnit = unit;

        this.scanner.resetTo(cd.bodyStart, cd.bodyEnd);
        try {
            parse();
        } catch (AbortCompilation ex) {
            this.lastAct = 17981;
        } finally {
            this.nestedMethod[this.nestedType]--;
            if (this.options.performStatementsRecovery) {
                this.methodRecoveryActivated = oldMethodRecoveryActivated;
            }
        }

        checkNonNLSAfterBodyEnd(cd.declarationSourceEnd);

        if (this.lastAct == 17981) {
            cd.bits |= 524288;
            initialize();
            return;
        }

        // statements
        cd.explicitDeclarations = this.realBlockStack[this.realBlockPtr--];
        int length;
        if (this.astLengthPtr > -1 && (length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            this.astPtr -= length;
            if (!this.options.ignoreMethodBodies) {
                if (this.astStack[this.astPtr + 1]instanceof ExplicitConstructorCall explicitCall)
                // avoid a isSomeThing that would only be used here BUT what is faster between two alternatives ?
                {
                    System.arraycopy(this.astStack, this.astPtr + 2, cd.statements = new Statement[length - 1], 0,
                        length - 1);
                    cd.constructorCall = explicitCall;
                } else { // need to add explicitly the super();
                    System.arraycopy(this.astStack, this.astPtr + 1, cd.statements = new Statement[length], 0, length);
                    cd.constructorCall = SuperReference.implicitSuperConstructorCall();
                }
            }
        } else {
            if (!this.options.ignoreMethodBodies) {
                cd.constructorCall = SuperReference.implicitSuperConstructorCall();
            }
            if (!containsComment(cd.bodyStart, cd.bodyEnd)) {
                cd.bits |= 8;
            }
        }

        ExplicitConstructorCall explicitConstructorCall = cd.constructorCall;
        if (explicitConstructorCall != null && explicitConstructorCall.sourceEnd == 0) {
            explicitConstructorCall.sourceEnd = cd.sourceEnd;
            explicitConstructorCall.sourceStart = cd.sourceStart;
        }
    }

    public CompilationUnitDeclaration parse(ICompilationUnit sourceUnit, CompilationResult compilationResult) {
        // parses a compilation unit and manages error handling (even bugs....)

        CompilationUnitDeclaration unit;
        try {
            /* automaton initialization */
            initialize(true);
            goForCompilationUnit();

            /* unit creation */
            this.referenceContext = this.compilationUnit = new CompilationUnitDeclaration(compilationResult, 0);

            var problemReporterContext = this.problemReporter.referenceContext;
            this.problemReporter.referenceContext = this.referenceContext;
            if (this.problemReporter != null
                && this.options != null
                && this.options.requestedSourceVersion != null
                && !this.options.requestedSourceVersion.isBlank()) {
                try {
                    var requestedVersion = Version.parse(this.options.requestedSourceVersion);
                    var latestVersion = Version.parse("26");
                    if (requestedVersion.compareTo(latestVersion) > 0) {
                        this.problemReporter.tooRecentJavaVersion(requestedVersion.toString(),
                            latestVersion.toString());
                    }
                } catch (Exception ex) {
                    this.problemReporter.abortDueToInternalError(ex.getMessage());
                }
            }
            this.problemReporter.referenceContext = problemReporterContext;

            /* scanners initialization */
            char[] contents;
            try {
                contents = sourceUnit.getContents();
            } catch (AbortCompilationUnit abortException) {
                problemReporter().cannotReadSource(this.compilationUnit, abortException, this.options.verbose);
                contents = CharOperation.NO_CHAR; // pretend empty from thereon
            }

            this.scanner.setSource(contents);
            this.compilationUnit.sourceEnd = this.scanner.source.length - 1;

            if (this.javadocParser != null && this.javadocParser.checkDocComment) {
                this.javadocParser.scanner.setSource(contents);

            }
            /* run automaton */
            parse();
        } finally {
            unit = this.compilationUnit;
            this.compilationUnit = null; // reset parser
            // tag unit has having read bodies
            if (!this.diet)
                unit.bits |= 16;
        }
        return unit;
    }

    public void parse(Initializer initializer, TypeDeclaration type, CompilationUnitDeclaration unit) {
        // only parse the method body of md
        // fill out method statements

        // convert bugs into parse error

        boolean oldMethodRecoveryActivated = this.methodRecoveryActivated;
        if (this.options.performMethodsFullRecovery) {
            this.methodRecoveryActivated = true;
        }

        initialize();
        goForBlockStatementsopt();
        this.nestedMethod[this.nestedType]++;
        pushOnRealBlockStack();

        this.referenceContext = type;
        this.compilationUnit = unit;

        this.scanner.resetTo(initializer.bodyStart, initializer.bodyEnd); // just on the beginning {
        try {
            parse();
        } catch (AbortCompilation ex) {
            this.lastAct = 17981;
        } finally {
            this.nestedMethod[this.nestedType]--;
            if (this.options.performStatementsRecovery) {
                this.methodRecoveryActivated = oldMethodRecoveryActivated;
            }
        }

        checkNonNLSAfterBodyEnd(initializer.declarationSourceEnd);

        if (this.lastAct == 17981) {
            initializer.bits |= 524288;
            return;
        }

        // refill statements
        this.realBlockPtr--;
        int length;
        if (this.astLengthPtr > -1 && (length = this.astLengthStack[this.astLengthPtr--]) > 0) {
            System.arraycopy(this.astStack, (this.astPtr -= length) + 1,
                initializer.block.statements = new Statement[length], 0, length);
        } else {
            // check whether this block at least contains some comment in it
            if (!containsComment(initializer.block.sourceStart, initializer.block.sourceEnd)) {
                initializer.block.bits |= 8;
            }
        }

        // mark initializer with local type if one was found during parsing
        if ((type.bits & 2) != 0) {
            initializer.bits |= 2;
        }
    }

// A P I
    public void parse(MethodDeclaration md, CompilationUnitDeclaration unit) {
        // only parse the method body of md
        // fill out method statements

        // convert bugs into parse error

        if (md.isAbstract())
            return;
        if (md.isNative())
            return;
        if ((md.modifiers & 16777216) != 0)
            return;

        boolean oldMethodRecoveryActivated = this.methodRecoveryActivated;
        if (this.options.performMethodsFullRecovery) {
            // we should not relocate bodyStart if there is a block within the statements
            this.ignoreNextOpeningBrace = true;
            this.methodRecoveryActivated = true;
            this.rParenPos = md.sourceEnd;
        }
        initialize();
        goForBlockStatementsopt();
        this.nestedMethod[this.nestedType]++;
        pushOnRealBlockStack();

        this.referenceContext = md;
        this.compilationUnit = unit;

        this.scanner.resetTo(md.bodyStart, md.bodyEnd);
        // reset the scanner to parser from { down to }
        try {
            parse();
        } catch (AbortCompilation ex) {
            this.lastAct = 17981;
        } finally {
            this.nestedMethod[this.nestedType]--;
            if (this.options.performStatementsRecovery) {
                this.methodRecoveryActivated = oldMethodRecoveryActivated;
            }
        }

        checkNonNLSAfterBodyEnd(md.declarationSourceEnd);

        if (this.lastAct == 17981) {
            md.bits |= 524288;
            return;
        }

        // refill statements
        md.explicitDeclarations = this.realBlockStack[this.realBlockPtr--];
        int length;
        if (this.astLengthPtr > -1 && (length = this.astLengthStack[this.astLengthPtr--]) != 0) {
            if (this.options.ignoreMethodBodies) {
                // ignore statements
                this.astPtr -= length;
            } else {
                System.arraycopy(this.astStack, (this.astPtr -= length) + 1, md.statements = new Statement[length], 0,
                    length);
            }
        } else {
            if (!containsComment(md.bodyStart, md.bodyEnd)) {
                md.bits |= 8;
            }
        }
    }

    public ASTNode[] parseClassBodyDeclarations(char[] source, int length, CompilationUnitDeclaration unit) {

        boolean oldDiet = this.diet;
        int oldInt = this.dietInt;
        boolean oldTolerateDefaultClassMethods = this.tolerateDefaultClassMethods;
        /* automaton initialization */
        initialize();
        goForClassBodyDeclarations();
        /* scanner initialization */
        this.scanner.setSource(source);
        this.scanner.resetTo(0, 0 + length - 1);
        if (this.javadocParser != null && this.javadocParser.checkDocComment) {
            this.javadocParser.scanner.setSource(source);
            this.javadocParser.scanner.resetTo(0, 0 + length - 1);
        }

        /* type declaration should be parsed as member type declaration */
        this.nestedType = 1;

        /* unit creation */
        TypeDeclaration referenceContextTypeDeclaration = new TypeDeclaration(unit.compilationResult);
        referenceContextTypeDeclaration.name = Util.EMPTY_STRING.toCharArray();
        referenceContextTypeDeclaration.fields = new FieldDeclaration[0];
        this.compilationUnit = unit;
        unit.types = new TypeDeclaration[1];
        unit.types[0] = referenceContextTypeDeclaration;
        this.referenceContext = unit;

        /* run automaton */
        try {
            this.diet = true;
            this.dietInt = 0;
            this.tolerateDefaultClassMethods = true;
            parse();
        } catch (AbortCompilation ex) {
            this.lastAct = 17981;
        } finally {
            this.diet = oldDiet;
            this.dietInt = oldInt;
            this.tolerateDefaultClassMethods = oldTolerateDefaultClassMethods;
        }

        ASTNode[] result;
        if (this.lastAct == 17981) {
            if (!this.options.performMethodsFullRecovery && !this.options.performStatementsRecovery) {
                return null;
            }
            // collect all body declaration inside the compilation unit except the default constructor
            final List bodyDeclarations = new ArrayList();
            ASTVisitor visitor = new ASTVisitor() {
                @Override
                public boolean visit(MethodDeclaration methodDeclaration) {
                    {
                        java.util.Objects.requireNonNull(methodDeclaration);
                        bodyDeclarations.add(methodDeclaration);
                    }
                    return false;
                }

                @Override
                public boolean visit(FieldDeclaration fieldDeclaration) {
                    bodyDeclarations.add(fieldDeclaration);
                    return false;
                }

                @Override
                public boolean visit(TypeDeclaration memberTypeDeclaration, ClassScope scope) {
                    bodyDeclarations.add(memberTypeDeclaration);
                    return false;
                }
            };
            unit.ignoreFurtherInvestigation = false;
            unit.traverse(visitor);
            unit.ignoreFurtherInvestigation = true;
            result = (ASTNode[]) bodyDeclarations.toArray(new ASTNode[bodyDeclarations.size()]);
        } else {
            int astLength;
            if (this.astLengthPtr > -1 && (astLength = this.astLengthStack[this.astLengthPtr--]) != 0) {
                result = new ASTNode[astLength];
                this.astPtr -= astLength;
                System.arraycopy(this.astStack, this.astPtr + 1, result, 0, astLength);
            } else {
                // empty class body declaration (like ';' see https://bugs.eclipse.org/bugs/show_bug.cgi?id=280079).
                result = new ASTNode[0];
            }
        }
        boolean containsInitializers = false;
        TypeDeclaration typeDeclaration = null;
        for (ASTNode node : result) {
            if (node instanceof TypeDeclaration type) {
                type.parseMethods(this, unit);
            } else if (node instanceof AbstractMethodDeclaration method) {
                method.parseStatements(this, unit);
            } else if (node instanceof FieldDeclaration fieldDeclaration) {
                switch (fieldDeclaration.getKind()) {
                    case 2:
                        containsInitializers = true;
                        if (typeDeclaration == null) {
                            typeDeclaration = referenceContextTypeDeclaration;
                        }
                        if (typeDeclaration.fields == null) {
                            typeDeclaration.fields = new FieldDeclaration[1];
                            typeDeclaration.fields[0] = fieldDeclaration;
                        } else {
                            int length2 = typeDeclaration.fields.length;
                            FieldDeclaration[] temp = new FieldDeclaration[length2 + 1];
                            System.arraycopy(typeDeclaration.fields, 0, temp, 0, length2);
                            temp[length2] = fieldDeclaration;
                            typeDeclaration.fields = temp;
                        }
                        break;
                }
            }
            if (((node.bits & 524288) != 0)
                && (!this.options.performMethodsFullRecovery && !this.options.performStatementsRecovery)) {
                return null;
            }
        }
        if (containsInitializers) {
            FieldDeclaration[] fieldDeclarations = typeDeclaration.fields;
            for (FieldDeclaration fieldDeclaration : fieldDeclarations) {
                Initializer initializer = (Initializer) fieldDeclaration;
                initializer.parseStatements(this, typeDeclaration, unit);
                if (((initializer.bits & 524288) != 0)
                    && (!this.options.performMethodsFullRecovery && !this.options.performStatementsRecovery)) {
                    return null;
                }
            }
        }
        return result;
    }

    public Expression parseExpression(char[] source, int length, CompilationUnitDeclaration unit) {
        initialize();
        goForExpression();
        this.nestedMethod[this.nestedType]++;

        this.referenceContext = unit;
        this.compilationUnit = unit;

        this.scanner.setSource(source);
        this.scanner.resetTo(0, 0 + length - 1);
        try {
            parse();
        } catch (AbortCompilation ex) {
            this.lastAct = 17981;
        } finally {
            this.nestedMethod[this.nestedType]--;
        }

        if (this.lastAct == 17981) {
            return null;
        }

        return this.expressionStack[this.expressionPtr];
    }

    public void parseStatements(ReferenceContext rc, int start, int end, TypeDeclaration[] types,
        CompilationUnitDeclaration unit) {
        boolean oldStatementRecoveryEnabled = this.statementRecoveryActivated;
        this.statementRecoveryActivated = true;

        initialize();

        goForBlockStatementsopt();
        this.nestedMethod[this.nestedType]++;
        pushOnRealBlockStack();

        pushOnAstLengthStack(0);

        this.referenceContext = rc;
        this.compilationUnit = unit;

        this.pendingRecoveredType = null;

        if (types != null && types.length > 0) {
            this.recoveredTypes = types;
            this.recoveredTypePtr = 0;
            this.nextTypeStart = this.recoveredTypes[0].allocation == null
                ? this.recoveredTypes[0].declarationSourceStart
                : this.recoveredTypes[0].allocation.sourceStart;
        } else {
            this.recoveredTypes = null;
            this.recoveredTypePtr = -1;
            this.nextTypeStart = -1;
        }

        this.scanner.resetTo(start, end);
        // reset the scanner to parser from { down to }

        this.lastCheckPoint = this.scanner.initialPosition;

        this.stateStackTop = -1;

        try {
            parse();
        } catch (AbortCompilation ex) {
            this.lastAct = 17981;
        } finally {
            this.nestedMethod[this.nestedType]--;
            this.recoveredTypes = null;
            this.statementRecoveryActivated = oldStatementRecoveryEnabled;
        }

        checkNonNLSAfterBodyEnd(end);
    }

    public void persistLineSeparatorPositions() {
        if (this.scanner.recordLineSeparator) {
            this.compilationUnit.compilationResult.lineSeparatorPositions = this.scanner.getLineEnds();
        }
    }

    /*
     * Prepares the state of the parser to go for BlockStatements.
     */
    /**
     * Returns this parser's problem reporter initialized with its reference context. Also it is assumed that a problem
     * is going to be reported, so initializes the compilation result's line positions.
     *
     * @return ProblemHandler
     */
    public ProblemHandler problemReporter() {
        if (this.scanner.recordLineSeparator) {
            this.compilationUnit.compilationResult.lineSeparatorPositions = this.scanner.getLineEnds();
        }
        this.problemReporter.referenceContext = this.referenceContext;
        return this.problemReporter;
    }

    protected void pushIdentifier(char[] identifier, long position) {
        int stackLength = this.identifierStack.length;
        if (++this.identifierPtr >= stackLength) {
            System.arraycopy(this.identifierStack, 0, this.identifierStack = new char[stackLength + 20][], 0,
                stackLength);
            System.arraycopy(this.identifierPositionStack, 0, this.identifierPositionStack = new long[stackLength + 20],
                0, stackLength);
        }
        this.identifierStack[this.identifierPtr] = identifier;
        this.identifierPositionStack[this.identifierPtr] = position;

        stackLength = this.identifierLengthStack.length;
        if (++this.identifierLengthPtr >= stackLength) {
            System.arraycopy(this.identifierLengthStack, 0, this.identifierLengthStack = new int[stackLength + 10], 0,
                stackLength);
        }
        this.identifierLengthStack[this.identifierLengthPtr] = 1;
        if (!JavaFeature.UNNAMMED_PATTERNS_AND_VARS.isSupported(this.options)
            && identifier.length == 1
            && identifier[0] == '_'
            && !this.processingLambdaParameterList)
            problemReporter().illegalUseOfUnderscoreAsAnIdentifier((int) (position >>> 32), (int) position,
                isParsingJava9Plus());
    }

    protected void pushIdentifier() {
        /*
         * push the consumeToken on the identifier stack. Increase the total number of identifier in the stack.
         * identifierPtr points on the next top
         */

        pushIdentifier(this.scanner.getCurrentIdentifierSource(),
            (((long) this.scanner.startPosition) << 32) + (this.scanner.currentPosition - 1));
    }

    protected void pushIdentifier(int flag) {
        /*
         * push a special flag on the stack : -zero stands for optional Name -negative number for direct ref to base
         * types. identifierLengthPtr points on the top
         */

        int stackLength = this.identifierLengthStack.length;
        if (++this.identifierLengthPtr >= stackLength) {
            System.arraycopy(this.identifierLengthStack, 0, this.identifierLengthStack = new int[stackLength + 10], 0,
                stackLength);
        }
        this.identifierLengthStack[this.identifierLengthPtr] = flag;
    }

    protected void pushOnAstLengthStack(int pos) {
        int stackLength = this.astLengthStack.length;
        if (++this.astLengthPtr >= stackLength) {
            System.arraycopy(this.astLengthStack, 0, this.astLengthStack = new int[stackLength + 255], 0, stackLength);
        }
        this.astLengthStack[this.astLengthPtr] = pos;
    }

    protected void pushOnAstStack(ASTNode node) {
        /*
         * add a new obj on top of the ast stack astPtr points on the top
         */

        int stackLength = this.astStack.length;
        if (++this.astPtr >= stackLength) {
            System.arraycopy(this.astStack, 0, this.astStack = new ASTNode[stackLength + 100], 0, stackLength);
            this.astPtr = stackLength;
        }
        this.astStack[this.astPtr] = node;

        stackLength = this.astLengthStack.length;
        if (++this.astLengthPtr >= stackLength) {
            System.arraycopy(this.astLengthStack, 0, this.astLengthStack = new int[stackLength + 100], 0, stackLength);
        }
        this.astLengthStack[this.astLengthPtr] = 1;
    }

    protected void pushOnTypeAnnotationStack(Annotation annotation) {
        int stackLength = this.typeAnnotationStack.length;
        if (++this.typeAnnotationPtr >= stackLength) {
            System.arraycopy(this.typeAnnotationStack, 0, this.typeAnnotationStack = new Annotation[stackLength + 100],
                0, stackLength);
        }
        this.typeAnnotationStack[this.typeAnnotationPtr] = annotation;

        stackLength = this.typeAnnotationLengthStack.length;
        if (++this.typeAnnotationLengthPtr >= stackLength) {
            System.arraycopy(this.typeAnnotationLengthStack, 0,
                this.typeAnnotationLengthStack = new int[stackLength + 100], 0, stackLength);
        }
        this.typeAnnotationLengthStack[this.typeAnnotationLengthPtr] = 1;
    }

    protected void pushOnTypeAnnotationLengthStack() {
        int stackLength = this.typeAnnotationLengthStack.length;
        if (++this.typeAnnotationLengthPtr >= stackLength) {
            System.arraycopy(this.typeAnnotationLengthStack, 0,
                this.typeAnnotationLengthStack = new int[stackLength + 100], 0, stackLength);
        }
        this.typeAnnotationLengthStack[this.typeAnnotationLengthPtr] = 0;
    }

    protected void pushOnExpressionStack(Expression expr) {
        int stackLength = this.expressionStack.length;
        if (++this.expressionPtr >= stackLength) {
            System.arraycopy(this.expressionStack, 0, this.expressionStack = new Expression[stackLength + 100], 0,
                stackLength);
        }
        this.expressionStack[this.expressionPtr] = expr;

        stackLength = this.expressionLengthStack.length;
        if (++this.expressionLengthPtr >= stackLength) {
            System.arraycopy(this.expressionLengthStack, 0, this.expressionLengthStack = new int[stackLength + 100], 0,
                stackLength);
        }
        this.expressionLengthStack[this.expressionLengthPtr] = 1;
    }

    protected void pushOnExpressionStackLengthStack() {
        int stackLength = this.expressionLengthStack.length;
        if (++this.expressionLengthPtr >= stackLength) {
            System.arraycopy(this.expressionLengthStack, 0, this.expressionLengthStack = new int[stackLength + 255], 0,
                stackLength);
        }
        this.expressionLengthStack[this.expressionLengthPtr] = 0;
    }

    protected void pushOnGenericsIdentifiersLengthStack(int pos) {
        int stackLength = this.genericsIdentifiersLengthStack.length;
        if (++this.genericsIdentifiersLengthPtr >= stackLength) {
            System.arraycopy(this.genericsIdentifiersLengthStack, 0,
                this.genericsIdentifiersLengthStack = new int[stackLength + 10], 0, stackLength);
        }
        this.genericsIdentifiersLengthStack[this.genericsIdentifiersLengthPtr] = pos;
    }

    protected void pushOnGenericsLengthStack(int pos) {
        int stackLength = this.genericsLengthStack.length;
        if (++this.genericsLengthPtr >= stackLength) {
            System.arraycopy(this.genericsLengthStack, 0, this.genericsLengthStack = new int[stackLength + 10], 0,
                stackLength);
        }
        this.genericsLengthStack[this.genericsLengthPtr] = pos;
    }

    protected void pushOnGenericsStack(ASTNode node) {
        /*
         * add a new obj on top of the generics stack genericsPtr points on the top
         */

        int stackLength = this.genericsStack.length;
        if (++this.genericsPtr >= stackLength) {
            System.arraycopy(this.genericsStack, 0, this.genericsStack = new ASTNode[stackLength + 10], 0, stackLength);
        }
        this.genericsStack[this.genericsPtr] = node;

        stackLength = this.genericsLengthStack.length;
        if (++this.genericsLengthPtr >= stackLength) {
            System.arraycopy(this.genericsLengthStack, 0, this.genericsLengthStack = new int[stackLength + 10], 0,
                stackLength);
        }
        this.genericsLengthStack[this.genericsLengthPtr] = 1;
    }

    protected void pushOnIntStack(int pos) {
        int stackLength = this.intStack.length;
        if (++this.intPtr >= stackLength) {
            System.arraycopy(this.intStack, 0, this.intStack = new int[stackLength + 255], 0, stackLength);
        }
        this.intStack[this.intPtr] = pos;
    }

    protected void pushOnRealBlockStack() {
        int stackLength = this.realBlockStack.length;
        if (++this.realBlockPtr >= stackLength) {
            System.arraycopy(this.realBlockStack, 0, this.realBlockStack = new int[stackLength + 255], 0, stackLength);
        }
        this.realBlockStack[this.realBlockPtr] = 0;
    }

    protected void recoverStatements() {
        class MethodVisitor extends ASTVisitor {
            public ASTVisitor typeVisitor;

            TypeDeclaration enclosingType; // used only for initializer

            TypeDeclaration[] types = new TypeDeclaration[0];
            int typePtr = -1;

            @Override
            public void endVisit(ConstructorDeclaration constructorDeclaration) {
                endVisitMethod(constructorDeclaration);
            }

            @Override
            public void endVisit(Initializer initializer) {
                if (initializer.block == null)
                    return;
                TypeDeclaration[] foundTypes = null;
                int length = 0;
                if (this.typePtr > -1) {
                    length = this.typePtr + 1;
                    foundTypes = new TypeDeclaration[length];
                    System.arraycopy(this.types, 0, foundTypes, 0, length);
                }
                ReferenceContext oldContext = Parser.this.referenceContext;
                Parser.this.recoveryScanner.resetTo(initializer.bodyStart, initializer.bodyEnd);
                Scanner oldScanner = Parser.this.scanner;
                Parser.this.scanner = Parser.this.recoveryScanner;
                parseStatements(this.enclosingType, initializer.bodyStart, initializer.bodyEnd, foundTypes,
                    Parser.this.compilationUnit);
                Parser.this.scanner = oldScanner;
                Parser.this.referenceContext = oldContext;

                for (int i = 0; i < length; i++) {
                    foundTypes[i].traverse(this.typeVisitor, ((MethodScope) null));
                }
            }

            @Override
            public void endVisit(MethodDeclaration methodDeclaration) {
                endVisitMethod(methodDeclaration);
            }

            private void endVisitMethod(AbstractMethodDeclaration methodDeclaration) {
                TypeDeclaration[] foundTypes = null;
                int length = 0;
                if (this.typePtr > -1) {
                    length = this.typePtr + 1;
                    foundTypes = new TypeDeclaration[length];
                    System.arraycopy(this.types, 0, foundTypes, 0, length);
                }
                ReferenceContext oldContext = Parser.this.referenceContext;
                Parser.this.recoveryScanner.resetTo(methodDeclaration.bodyStart, methodDeclaration.bodyEnd);
                Scanner oldScanner = Parser.this.scanner;
                Parser.this.scanner = Parser.this.recoveryScanner;
                parseStatements(methodDeclaration, methodDeclaration.bodyStart, methodDeclaration.bodyEnd, foundTypes,
                    Parser.this.compilationUnit);
                Parser.this.scanner = oldScanner;
                Parser.this.referenceContext = oldContext;

                for (int i = 0; i < length; i++) {
                    foundTypes[i].traverse(this.typeVisitor, ((ClassScope) null));
                }
            }

            @Override
            public boolean visit(ConstructorDeclaration constructorDeclaration) {
                this.typePtr = -1;
                return true;
            }

            @Override
            public boolean visit(Initializer initializer) {
                this.typePtr = -1;
                if (initializer.block == null)
                    return false;
                return true;
            }

            @Override
            public boolean visit(MethodDeclaration methodDeclaration) {
                this.typePtr = -1;
                return true;
            }

            private boolean visit(TypeDeclaration typeDeclaration) {
                if (this.types.length <= ++this.typePtr) {
                    int length = this.typePtr;
                    System.arraycopy(this.types, 0, this.types = new TypeDeclaration[length * 2 + 1], 0, length);
                }
                this.types[this.typePtr] = typeDeclaration;
                return false;
            }

            @Override
            public boolean visit(TypeDeclaration typeDeclaration, BlockScope scope) {
                return this.visit(typeDeclaration);
            }

            @Override
            public boolean visit(TypeDeclaration typeDeclaration, ClassScope scope) {
                return this.visit(typeDeclaration);
            }
        }
        class TypeVisitor extends ASTVisitor {
            public MethodVisitor methodVisitor;

            TypeDeclaration[] types = new TypeDeclaration[0];
            int typePtr = -1;

            @Override
            public void endVisit() {
                endVisitType();
            }

            @Override
            public void endVisit(TypeDeclaration typeDeclaration, ClassScope scope) {
                endVisitType();
            }

            private void endVisitType() {
                this.typePtr--;
            }

            @Override
            public boolean visit(ConstructorDeclaration constructorDeclaration) {
                if (constructorDeclaration.isDefaultConstructor())
                    return false;

                constructorDeclaration.traverse(this.methodVisitor);
                return false;
            }

            @Override
            public boolean visit(Initializer initializer) {
                if (initializer.block == null)
                    return false;
                this.methodVisitor.enclosingType = this.types[this.typePtr];
                initializer.traverse(this.methodVisitor);
                return false;
            }

            @Override
            public boolean visit(MethodDeclaration methodDeclaration) {
                methodDeclaration.traverse(this.methodVisitor);
                return false;
            }

            private boolean visit(TypeDeclaration typeDeclaration) {
                if (this.types.length <= ++this.typePtr) {
                    int length = this.typePtr;
                    System.arraycopy(this.types, 0, this.types = new TypeDeclaration[length * 2 + 1], 0, length);
                }
                this.types[this.typePtr] = typeDeclaration;
                return true;
            }

            @Override
            public boolean visit(TypeDeclaration typeDeclaration, BlockScope scope) {
                return this.visit(typeDeclaration);
            }

            @Override
            public boolean visit(TypeDeclaration typeDeclaration, ClassScope scope) {
                return this.visit(typeDeclaration);
            }
        }

        MethodVisitor methodVisitor = new MethodVisitor();
        TypeVisitor typeVisitor = new TypeVisitor();
        methodVisitor.typeVisitor = typeVisitor;
        typeVisitor.methodVisitor = methodVisitor;

        if (this.referenceContext instanceof AbstractMethodDeclaration method) {
            method.traverse(methodVisitor);
        } else if (this.referenceContext instanceof TypeDeclaration typeContext) {
            int length = typeContext.fields.length;
            for (int i = 0; i < length; i++) {
                final FieldDeclaration fieldDeclaration = typeContext.fields[i];
                switch (fieldDeclaration.getKind()) {
                    case 2:
                        Initializer initializer = (Initializer) fieldDeclaration;
                        if (initializer.block == null)
                            break;
                        methodVisitor.enclosingType = typeContext;
                        initializer.traverse(methodVisitor);
                        break;
                }
            }
        }
    }

    public void recoveryExitFromVariable() {
        if (this.currentElement != null && this.currentElement.parent != null) {
            if (this.currentElement instanceof RecoveredLocalVariable recoveredLocalVariable) {
                int end = recoveredLocalVariable.localDeclaration.sourceEnd;
                this.currentElement.updateSourceEndIfNecessary(end);
                this.currentElement = this.currentElement.parent;
            } else if (this.currentElement instanceof RecoveredField recoveredField
                && !(this.currentElement instanceof RecoveredInitializer)) {
                // Do not move focus to parent if we are still inside an array initializer
                // https://bugs.eclipse.org/bugs/show_bug.cgi?id=292087
                if (this.currentElement.bracketBalance <= 0) {
                    int end = recoveredField.fieldDeclaration.sourceEnd;
                    this.currentElement.updateSourceEndIfNecessary(end);
                    this.currentElement = this.currentElement.parent;
                }
            }
        }
    }

    /*
     * Token check performed on every token shift once having entered recovery mode.
     */
    public void recoveryTokenCheck() {
        switch (this.currentToken) {
            case TokenNameStringLiteral:
                if (this.recordStringLiterals
                    && this.checkExternalizeStrings
                    && this.lastPosistion < this.scanner.currentPosition
                    && !this.statementRecoveryActivated) {
                    StringLiteral stringLiteral = createStringLiteral(this.scanner.getCurrentTokenSourceString(),
                        this.scanner.startPosition, this.scanner.currentPosition - 1,
                        Util.getLineNumber(this.scanner.startPosition, this.scanner.lineEnds, 0, this.scanner.linePtr));
                    this.compilationUnit.recordStringLiteral(stringLiteral, this.currentElement != null);
                }
                break;

            case TokenNameLBRACE:
                RecoveredElement newElement = null;
                if (!this.ignoreNextOpeningBrace) {
                    newElement = this.currentElement.updateOnOpeningBrace(this.scanner.startPosition - 1,
                        this.scanner.currentPosition - 1);
                }
                this.lastCheckPoint = this.scanner.currentPosition;
                if (newElement != null) { // null means nothing happened
                    this.restartRecovery = true; // opening brace detected
                    this.currentElement = newElement;
                }
                break;

            case TokenNameRBRACE:

                this.rBraceStart = this.scanner.startPosition - 1;
                this.rBraceEnd = this.scanner.currentPosition - 1;
                this.endPosition = flushCommentsDefinedPriorTo(this.rBraceEnd);
                newElement = this.currentElement.updateOnClosingBrace(this.scanner.startPosition, this.rBraceEnd);
                this.lastCheckPoint = this.scanner.currentPosition;
                if (newElement != this.currentElement) {
                    this.currentElement = newElement;
//				if (newElement instanceof RecoveredField recoveredField && this.dietInt <= 0) {
//					if (recoveredField.fieldDeclaration.type == null) { // enum constant
//						this.isInsideEnumConstantPart = true; // restore status
//					}
//				}
                }
                break;

            case TokenNameSEMICOLON:
                this.endStatementPosition = this.scanner.currentPosition - 1;
                this.endPosition = this.scanner.startPosition - 1;
                RecoveredType currentType = currentRecoveryType();
                if (currentType != null) {
                    currentType.insideEnumConstantPart = false;
                }
                //$FALL-THROUGH$
            default: {
                if (this.rBraceEnd > this.rBraceSuccessorStart
                    && this.scanner.currentPosition != this.scanner.startPosition) {
                    this.rBraceSuccessorStart = this.scanner.startPosition;
                }
                break;
            }
        }
        this.ignoreNextOpeningBrace = false;
    }

// A P I
    protected void reportSyntaxErrors(boolean isDietParse, TerminalToken oldFirstToken) {
        if (this.referenceContext instanceof MethodDeclaration methodDeclaration) {
            if ((methodDeclaration.bits & 32) != 0) {
                return;
            }
        }
        this.compilationUnit.compilationResult.lineSeparatorPositions = this.scanner.getLineEnds();
        this.scanner.recordLineSeparator = false;

        int start = this.scanner.initialPosition;
        int end
            = this.scanner.eofPosition == Integer.MAX_VALUE ? this.scanner.eofPosition : this.scanner.eofPosition - 1;
        if (isDietParse) {
            TypeDeclaration[] types = this.compilationUnit.types;
            int[][] intervalToSkip
                = com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.diagnose.RangeUtil
                    .computeDietRange(types);
            DiagnoseParser diagnoseParser = new DiagnoseParser(this, oldFirstToken, start, end, intervalToSkip[0],
                intervalToSkip[1], this.options);
            diagnoseParser.diagnoseParse(false);

            reportSyntaxErrorsForSkippedMethod(types);
            this.scanner.resetTo(start, end);
        } else {
            DiagnoseParser diagnoseParser = new DiagnoseParser(this, oldFirstToken, start, end, this.options);
            diagnoseParser.diagnoseParse(this.options.performStatementsRecovery);
        }
    }

    private void reportSyntaxErrorsForSkippedMethod(TypeDeclaration[] types) {
        if (types != null) {
            for (TypeDeclaration type : types) {
                TypeDeclaration[] memberTypes = type.memberTypes;
                if (memberTypes != null) {
                    reportSyntaxErrorsForSkippedMethod(memberTypes);
                }

                AbstractMethodDeclaration[] methods = type.methods;
                if (methods != null) {
                    for (AbstractMethodDeclaration method : methods) {
                        if ((method.bits & 32) != 0) {
                            if (method.isAnnotationMethod()) {
                                DiagnoseParser diagnoseParser = new DiagnoseParser(this, TokenNameQUESTION,
                                    method.declarationSourceStart, method.declarationSourceEnd, this.options);
                                diagnoseParser.diagnoseParse(this.options.performStatementsRecovery);
                            } else {
                                DiagnoseParser diagnoseParser = new DiagnoseParser(this, TokenNameDIVIDE,
                                    method.declarationSourceStart, method.declarationSourceEnd, this.options);
                                diagnoseParser.diagnoseParse(this.options.performStatementsRecovery);
                            }
                        }
                    }
                }

                FieldDeclaration[] fields = type.fields;
                if (fields != null) {
                    int length = fields.length;
                    for (int j = 0; j < length; j++) {
                        if (fields[j]instanceof Initializer initializer) {
                            if ((initializer.bits & 32) != 0) {
                                DiagnoseParser diagnoseParser = new DiagnoseParser(this, TokenNameRIGHT_SHIFT,
                                    initializer.declarationSourceStart, initializer.declarationSourceEnd, this.options);
                                diagnoseParser.diagnoseParse(this.options.performStatementsRecovery);
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * Reset modifiers buffer and comment stack. Should be call only for nodes that claim both.
     */
    protected void resetModifiers() {
        this.modifiers = 0;
        this.modifiersSourceStart = -1; // <-- see comment into modifiersFlag(int)
        this.annotationAsModifierSourceStart = -1;
        this.scanner.commentPtr = -1;
    }

    /*
     * Reset context so as to resume to regular parse loop
     */
    protected void resetStacks() {
        this.astPtr = -1;
        this.astLengthPtr = -1;
        this.expressionPtr = -1;
        this.expressionLengthPtr = -1;
        this.typeAnnotationLengthPtr = -1;
        this.typeAnnotationPtr = -1;
        this.identifierPtr = -1;
        this.identifierLengthPtr = -1;
        this.intPtr = -1;

        this.nestedMethod[this.nestedType = 0] = 0; // need to reset for further reuse
        this.variablesCounter[this.nestedType] = 0;

        this.dimensions = 0;
        this.realBlockStack[this.realBlockPtr = 0] = 0;
        this.recoveredStaticInitializerStart = 0;
        this.listLength = 0;
        this.parsingRecordComponents = false;
        this.listTypeParameterLength = 0;

        this.genericsIdentifiersLengthPtr = -1;
        this.genericsLengthPtr = -1;
        this.genericsPtr = -1;
    }

    /*
     * Reset context so as to resume to regular parse loop If unable to reset for resuming, answers false.
     *
     * Move checkpoint location, reset internal stacks and decide which grammar goal is activated.
     */
    protected int resumeAfterRecovery() {
        if (!this.methodRecoveryActivated && !this.statementRecoveryActivated) {

            // reset internal stacks
            resetStacks();
            resetModifiers();

            /* attempt to move checkpoint location */
            if (!moveRecoveryCheckpoint()) {
                return 0;
            }

            // only look for headers
            if (this.referenceContext instanceof CompilationUnitDeclaration) {
                goForHeaders();
                this.diet = true; // passed this point, will not consider method bodies
                this.dietInt = 0;
                return 1;
            }

            // does not know how to restart
            return 0;
        } else if (!this.statementRecoveryActivated) {

            // reset internal stacks
            resetStacks();
            resetModifiers();

            /* attempt to move checkpoint location */
            if (!moveRecoveryCheckpoint()) {
                return 0;
            }

            // only look for headers
            goForHeaders();
            return 1;
        } else {
            return 0;
        }
    }

    protected int resumeOnSyntaxError() {

        /* request recovery initialization */
        if (this.currentElement == null) {
            // Reset javadoc before restart parsing after recovery
            this.javadoc = null;

            // do not investigate deeper in statement recovery
            if (this.statementRecoveryActivated)
                return 0;

            // build some recovered elements
            this.currentElement = buildInitialRecoveryState();
        }
        /* do not investigate deeper in recovery when no recovered element */
        if (this.currentElement == null)
            return 0;

        /* manual forced recovery restart - after headers */
        if (this.restartRecovery) {
            this.restartRecovery = false;
        }
        /* update recovery state with current error state of the parser */
        updateRecoveryState();
        if (getFirstToken() == TokenNameAND) {
            if (this.referenceContext instanceof CompilationUnitDeclaration) {
                TypeDeclaration typeDeclaration = new TypeDeclaration(this.referenceContext.compilationResult());
                typeDeclaration.name = Util.EMPTY_STRING.toCharArray();
                this.currentElement = this.currentElement.add(typeDeclaration, 0);
            }
        }

        if (this.lastPosistion < this.scanner.currentPosition) {
            this.lastPosistion = this.scanner.currentPosition;
            this.scanner.lastPosition = this.scanner.currentPosition;
        }

        /* attempt to reset state in order to resume to parse loop */
        return resumeAfterRecovery();
    }

    public void setMethodsFullRecovery() {
        this.options.performMethodsFullRecovery = false;
    }

    public void setStatementsRecovery() {

        this.options.performStatementsRecovery = false;
    }

    @Override
    public String toString() {
        String s = "lastCheckpoint : int = " + this.lastCheckPoint + "\n"; //$NON-NLS-1$ //$NON-NLS-2$
        s = s + "identifierStack : char[" + (this.identifierPtr + 1) + "][] = {"; //$NON-NLS-1$ //$NON-NLS-2$
        for (int i = 0; i <= this.identifierPtr; i++) {
            s = s + "\"" + String.valueOf(this.identifierStack[i]) + "\","; //$NON-NLS-1$ //$NON-NLS-2$
        }
        s = s + "}\n"; //$NON-NLS-1$

        s = s + "identifierLengthStack : int[" + (this.identifierLengthPtr + 1) + "] = {"; //$NON-NLS-1$ //$NON-NLS-2$
        for (int i = 0; i <= this.identifierLengthPtr; i++) {
            s = s + this.identifierLengthStack[i] + ","; //$NON-NLS-1$
        }
        s = s + "}\n"; //$NON-NLS-1$

        s = s + "astLengthStack : int[" + (this.astLengthPtr + 1) + "] = {"; //$NON-NLS-1$ //$NON-NLS-2$
        for (int i = 0; i <= this.astLengthPtr; i++) {
            s = s + this.astLengthStack[i] + ","; //$NON-NLS-1$
        }
        s = s + "}\n"; //$NON-NLS-1$
        s = s + "astPtr : int = " + this.astPtr + "\n"; //$NON-NLS-1$ //$NON-NLS-2$

        s = s + "intStack : int[" + (this.intPtr + 1) + "] = {"; //$NON-NLS-1$ //$NON-NLS-2$
        for (int i = 0; i <= this.intPtr; i++) {
            s = s + this.intStack[i] + ","; //$NON-NLS-1$
        }
        s = s + "}\n"; //$NON-NLS-1$

        s = s + "expressionLengthStack : int[" + (this.expressionLengthPtr + 1) + "] = {"; //$NON-NLS-1$ //$NON-NLS-2$
        for (int i = 0; i <= this.expressionLengthPtr; i++) {
            s = s + this.expressionLengthStack[i] + ","; //$NON-NLS-1$
        }
        s = s + "}\n"; //$NON-NLS-1$

        s = s + "expressionPtr : int = " + this.expressionPtr + "\n"; //$NON-NLS-1$ //$NON-NLS-2$

        s = s + "genericsIdentifiersLengthStack : int[" + (this.genericsIdentifiersLengthPtr + 1) + "] = {"; //$NON-NLS-1$ //$NON-NLS-2$
        for (int i = 0; i <= this.genericsIdentifiersLengthPtr; i++) {
            s = s + this.genericsIdentifiersLengthStack[i] + ","; //$NON-NLS-1$
        }
        s = s + "}\n"; //$NON-NLS-1$

        s = s + "genericsLengthStack : int[" + (this.genericsLengthPtr + 1) + "] = {"; //$NON-NLS-1$ //$NON-NLS-2$
        for (int i = 0; i <= this.genericsLengthPtr; i++) {
            s = s + this.genericsLengthStack[i] + ","; //$NON-NLS-1$
        }
        s = s + "}\n"; //$NON-NLS-1$

        s = s + "genericsPtr : int = " + this.genericsPtr + "\n"; //$NON-NLS-1$ //$NON-NLS-2$

        s = s + "\n\n\n----------------Scanner--------------\n" + this.scanner.toString(); //$NON-NLS-1$
        return s;
    }

    /*
     * Update recovery state based on current parser/scanner state
     */
    protected void updateRecoveryState() {

        /* expose parser state to recovery state */
        this.currentElement.updateFromParserState();

        /*
         * check and update recovered state based on current token, this action is also performed when shifting token
         * after recovery got activated once.
         */
        recoveryTokenCheck();
    }

    protected void updateSourceDeclarationParts(int variableDeclaratorsCounter) {
        // fields is a definition of fields that are grouped together like in
        // public int[] a, b[], c
        // which results into 3 fields.

        // Preserve stack, type, and null checks after discarding unused declaration positions.
        for (int i = 0; i < variableDeclaratorsCounter - 1; i++) {
            // last one is special(see below)
            java.util.Objects.requireNonNull((FieldDeclaration) this.astStack[this.astPtr - i - 1]);
        }
        // last one
        java.util.Objects.requireNonNull((FieldDeclaration) this.astStack[this.astPtr]);
    }

    protected void updateSourcePosition(Expression exp) {
        // update the source Position of the expression

        // this.intStack : int int
        // -->
        // this.intStack :

        exp.sourceEnd = this.intStack[this.intPtr--];
        exp.sourceStart = this.intStack[this.intPtr--];
    }

    public boolean automatonWillShift(TerminalToken token, int lastAction) {
        if (lastAction == 17981) {
            return false;
        }
        int stackTop = this.stateStackTop;        // local copy of stack pointer
        int stackTopState = this.stack[stackTop]; // single cell non write through "alternate stack" - the automaton's
                                                  // stack pointer either stays fixed during this manoeuvre or
                                                  // monotonically decreases.
        int highWaterMark = stackTop;
        // A rotated version of the automaton - cf. parse()'s for(;;)
        if (lastAction <= 936) { // in recovery mode, we could take a detour to here, with a pending reduce
                                 // action.
            stackTop--;
            lastAction += 17981;
        }
        for (;;) {
            if (lastAction > 17981) {
                lastAction -= 17981; /* reduce or shift-reduce on loop entry from above, reduce on loop back */
                do { /* reduce */
                    stackTop -= rhs[lastAction] - 1;
                    if (stackTop < highWaterMark) {
                        stackTopState = this.stack[highWaterMark = stackTop];
                    } // else stackTopState is upto date already.
                    lastAction = ntAction(stackTopState, lhs[lastAction]);
                } while (lastAction <= 936);
            }
            highWaterMark = ++stackTop;
            stackTopState = lastAction; // "push"
            lastAction = tAction(lastAction, token.tokenNumber()); // can be looked up from a precomputed cache.
            if (lastAction <= 936) {
                stackTop--;
                lastAction += 17981;
                continue;
            }
            // Error => false, Shift, Shift/Reduce => true, Accept => impossible.
            return lastAction != 17981;
        }
    }

    @Override
    public boolean automatonWillShift(TerminalToken token) {
        return automatonWillShift(token, this.unstackedAct);
    }

    @Override
    public boolean isParsingModuleDeclaration() {
        // It can be a null in case of a Vanguard parser, which means no module to be dealt with.
        return (isParsingJava9Plus() && this.compilationUnit != null && this.compilationUnit.isModuleInfo());
    }

    protected boolean isParsingJava9Plus() {
        return this.options != null && this.options.sourceLevel >= 3473408L;
    }

    protected boolean isParsingJava10Plus() {
        return this.options != null && this.options.sourceLevel >= 3538944L;
    }

    protected boolean isParsingJava14Plus() {
        return this.options != null && this.options.sourceLevel >= 3801088L;
    }

    protected boolean isParsingJava17Plus() {
        return this.options != null && this.options.sourceLevel >= 3997696L;
    }
}
