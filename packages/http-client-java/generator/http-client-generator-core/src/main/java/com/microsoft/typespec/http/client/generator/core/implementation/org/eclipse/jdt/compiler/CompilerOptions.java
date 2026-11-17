// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2026 IBM Corporation and others.
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
 *     Benjamin Muskalla - Contribution for bug 239066
 *     Stephan Herrmann  - Contributions for
 *     							bug 236385 - [compiler] Warn for potential programming problem if an object is created but not used
 *     							bug 295551 - Add option to automatically promote all warnings to errors
 *     							bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 370639 - [compiler][resource] restore the default for resource leak warnings
 *								bug 366063 - Compiler should not add synthetic @NonNull annotations
 *								bug 374605 - Unreasonable warning for enum-based switch statements
 *								bug 388281 - [compiler][null] inheritance of null annotations as an option
 *								bug 381443 - [compiler][null] Allow parameter widening from @NonNull to unannotated
 *								bug 383368 - [compiler][null] syntactic null analysis for field references
 *								Bug 435805 - [1.8][compiler][null] Java 8 compiler does not recognize declaration style null annotations
 *								Bug 410218 - Optional warning for arguments of "unexpected" types to Map#get(Object), Collection#remove(Object) et al.
 *     Jesper Steen Moller - Contributions for
 *								bug 404146 - [1.7][compiler] nested try-catch-finally-blocks leads to unrunnable Java byte code
 *								bug 407297 - [1.8][compiler] Control generation of parameter names by option
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler;

public class CompilerOptions {
    /** Compliance level for the compiler, refers to a JDK version, e.g. <code>3407872L</code> for JDK 1.8 */
    public long complianceLevel = 3407872L;
    /** Java source level, refers to a JDK version, e.g. <code>3407872L</code> for JDK 1.8 */
    public long sourceLevel = 3407872L;

    /** Tags used to recognize tasks in comments */
    public char[][] taskTags = null;
    /** Respective priorities of recognized task tags */
    public char[][] taskPriorities = null;

    /** Master flag controlling whether doc comment should be processed */
    public boolean docCommentSupport = false;

    /**
     * Initializing the compiler options with defaults
     */
    public CompilerOptions() {
    }

    /**
     * Returns the options used to parse formatter input: the defaults with the Java 11 source level, the TODO/FIXME/XXX
     * task tags, and Javadoc support. Problem severities for these options are
     * fixed in {@code ProblemHandler.computeSeverity(int)}.
     *
     * @return new formatter input options
     */
    public static CompilerOptions forFormatterInput() {
        CompilerOptions options = new CompilerOptions();
        options.taskTags = CharOperation.splitAndTrimOn("TODO,FIXME,XXX".toCharArray());
        options.taskPriorities = CharOperation.splitAndTrimOn("NORMAL,HIGH,NORMAL".toCharArray());
        options.docCommentSupport = true;
        options.sourceLevel = 3604480L; // Java 11
        return options;
    }

    public static String versionFromJdkLevel(long jdkLevel) {
        int major = (int) (jdkLevel >> 16);
        switch (major) {
            case 45:
                if (jdkLevel == 2949123L)
                    return "1.1";
                break;

            case 46:
                if (jdkLevel == 3014656L)
                    return "1.2";
                break;

            case 47:
                if (jdkLevel == 3080192L)
                    return "1.3";
                break;

            case 48:
                if (jdkLevel == 3145728L)
                    return "1.4";
                break;

            case 49:
                if (jdkLevel == 3211264L)
                    return "1.5";
                break;

            case 50:
                if (jdkLevel == 3276800L)
                    return "1.6";
                break;

            case 51:
                if (jdkLevel == 3342336L)
                    return "1.7";
                break;

            case 52:
                if (jdkLevel == 3407872L)
                    return "1.8";
                break;

            case 53:
                if (jdkLevel == 3473408L)
                    return "9";
                break;

            case 54:
                if (jdkLevel == 3538944L)
                    return "10";
                break;

            default:
                if (major > 54) {
                    return "" + (major - 44); //$NON-NLS-1$
                }
                return Util.EMPTY_STRING; // unknown version

        }
        return Util.EMPTY_STRING; // unknown version
    }

}
