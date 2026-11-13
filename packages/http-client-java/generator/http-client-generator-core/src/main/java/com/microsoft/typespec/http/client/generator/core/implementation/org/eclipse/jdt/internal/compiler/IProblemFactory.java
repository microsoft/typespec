// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2009 IBM Corporation and others.
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

/*
 * Copyright (c) 2000, 2025 IBM Corporation and others.
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 * SPDX-License-Identifier: EPL-2.0
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *		Benjamin Muskalla - Contribution for bug 239066
 *		Stephan Herrmann <stephan@cs.tu-berlin.de> - Contributions for
 *							bug 185682 - Increment/decrement operators mark local variables as read
 *							bug 349326 - [1.7] new warning for missing try-with-resources
 *							bug 186342 - [compiler][null] Using annotations for null checking
 *							bug 365662 - [compiler][null] warn on contradictory and redundant null annotations
 *							bug 365531 - [compiler][null] investigate alternative strategy for internally encoding nullness defaults
 *							bug 365859 - [compiler][null] distinguish warnings based on flow analysis vs. null annotations
 *							bug 374605 - Unreasonable warning for enum-based switch statements
 *							bug 382353 - [1.8][compiler] Implementation property modifiers should be accepted on default methods.
 *							bug 382347 - [1.8][compiler] Compiler accepts incorrect default method inheritance
 *							bug 388281 - [compiler][null] inheritance of null annotations as an option
 *							bug 381443 - [compiler][null] Allow parameter widening from @NonNull to unannotated
 *							bug 393719 - [compiler] inconsistent warnings on iteration variables
 *							bug 392862 - [1.8][compiler][null] Evaluate null annotations on array types
 *							bug 382789 - [compiler][null] warn when syntactically-nonnull expression is compared against null
 *							bug 400761 - [compiler][null] null may be return as boolean without a diagnostic
 *							bug 402028 - [1.8][compiler] null analysis for reference expressions
 *							bug 401796 - [1.8][compiler] don't treat default methods as overriding an independent inherited abstract method
 *							bug 404649 - [1.8][compiler] detect illegal reference to indirect or redundant super
 *							Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *							Bug 415043 - [1.8][null] Follow-up re null type annotations after bug 392099
 *							Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *							Bug 416307 - [1.8][compiler][null] subclass with type parameter substitution confuses null checking
 *							Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *							Bug 424637 - [1.8][compiler][null] AIOOB in ReferenceExpression.resolveType with a method reference to Files::walk
 *							Bug 418743 - [1.8][null] contradictory annotations on invocation of generic method not reported
 *							Bug 416190 - [1.8][null] detect incompatible overrides due to null type annotations
 *							Bug 392245 - [1.8][compiler][null] Define whether / how @NonNullByDefault applies to TYPE_USE locations
 *							Bug 430150 - [1.8][null] stricter checking against type variables
 *							Bug 434600 - Incorrect null analysis error reporting on type parameters
 *							Bug 439516 - [1.8][null] NonNullByDefault wrongly applied to implicit type bound of binary type
 *							Bug 438467 - [compiler][null] Better error position for "The method _ cannot implement the corresponding method _ due to incompatible nullness constraints"
 *							Bug 458361 - [1.8][null] reconciler throws NPE in ProblemHandler.illegalReturnRedefinition()
 *							Bug 410218 - Optional warning for arguments of "unexpected" types to Map#get(Object), Collection#remove(Object) et al.
 *		Jesper S Moller <jesper@selskabet.org> - Contributions for
 *							bug 382701 - [1.8][compiler] Implement semantic analysis of Lambda expressions & Reference expression
 *							bug 384567 - [1.5][compiler] Compiler accepts illegal modifiers on package declaration
 *							Bug 412153 - [1.8][compiler] Check validity of annotations which may be repeatable
 *							Bug 412151 - [1.8][compiler] Check repeating annotation's collection type
 *							Bug 419209 - [1.8] Repeating container annotations should be rejected in the presence of annotation it contains
 *							Bug 527554 - [18.3] Compiler support for JEP 286 Local-Variable Type
 */
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.HashtableOfInt;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;

/*
 * Factory used from inside the compiler to build the actual problems
 * which are handed back in the compilation result.
 *
 * This allows sharing the internal problem representation with the environment.
 *
 * Note: The factory is responsible for computing and storing an English error message.
 */
@SuppressWarnings("rawtypes")
public class IProblemFactory {

    private static final HashtableOfInt MESSAGE_TEMPLATES = createEnglishTemplates();

    private final static char[] DOUBLE_QUOTES = "''".toCharArray(); //$NON-NLS-1$
    private final static char[] SINGLE_QUOTE = "'".toCharArray(); //$NON-NLS-1$

    /**
     * Answer a new IProblem created according to the parameters values.
     *
     * @param problemId the problem id
     * @param problemArguments the fully qualified arguments recorded inside the problem
     * @param messageArguments the arguments needed to set the error message (shorter names than problemArguments ones)
     * @param severity the severity of the problem
     * @param startPosition the start position of the problem
     * @param endPosition the end position of the problem
     * @param lineNumber the line on which the problem occurred
     * @return a new IProblem created according to the parameters values.
     */
    public IProblem createProblem(int problemId, String[] problemArguments, String[] messageArguments, int severity,
        int startPosition, int endPosition, int lineNumber) {
        return new IProblem(this.getLocalizedMessage(problemId, messageArguments), problemId, problemArguments,
            severity, startPosition, endPosition, lineNumber);
    }

    private final static int keyFromID(int id) {
        return id + 1; // keys are offsetted by one in table, since it cannot handle 0 key
    }

    public final String getLocalizedMessage(int id, String[] problemArguments) {
        String rawMessage = (String) MESSAGE_TEMPLATES.get(keyFromID(id & 2097151));
        if (rawMessage == null) {
            return "Unable to retrieve the error message for problem id: " //$NON-NLS-1$
                + (id & 2097151) + ". Check compiler resources.";  //$NON-NLS-1$
        }
        char[] message = rawMessage.toCharArray();

        // for compatibility with MessageFormat which eliminates double quotes in original message
        message = CharOperation.replace(message, DOUBLE_QUOTES, SINGLE_QUOTE);

        if (problemArguments == null) {
            return new String(message);
        }

        int length = message.length;
        int start = 0;
        int end = length;
        StringBuilder output = null;
        if ((id & -2147483648) != 0) {
            output = new StringBuilder(10 + length + problemArguments.length * 20);
            output.append((String) MESSAGE_TEMPLATES.get(keyFromID(536871426 & 2097151)));
        }
        while (true) {
            if ((end = CharOperation.indexOf('{', message, start)) > -1) {
                if (output == null)
                    output = new StringBuilder(length + problemArguments.length * 20);
                output.append(message, start, end - start);
                if ((start = CharOperation.indexOf('}', message, end + 1)) > -1) {
                    try {
                        output.append(problemArguments[CharOperation.parseInt(message, end + 1, start - end - 1)]);
                    } catch (NumberFormatException nfe) {
                        output.append(message, end + 1, start - end);
                    } catch (ArrayIndexOutOfBoundsException e) {
                        return "Cannot bind message for problem (id: " //$NON-NLS-1$
                            + (id & 2097151) + ") \""  //$NON-NLS-1$
                            + new String(message) + "\" with arguments: {" //$NON-NLS-1$
                            + Util.toString(problemArguments) + "}"; //$NON-NLS-1$
                    }
                    start++;
                } else {
                    output.append(message, end, length);
                    break;
                }
            } else {
                if (output == null) {
                    return new String(message);
                }
                output.append(message, start, length - start);
                break;
            }
        }

        return output.toString();
    }

    /**
     * Creates the shared English diagnostic templates.
     */
    private static HashtableOfInt createEnglishTemplates() {
        HashtableOfInt templates = new HashtableOfInt(956);
        templates.put(keyFromID(0), "{0}");
        templates.put(keyFromID(26),
            "The member interface {0} can only be defined inside a top-level class or interface or in a static context");
        templates.put(keyFromID(30),
            "The member annotation {0} can only be defined inside a top-level class or interface or in a static context");
        templates.put(keyFromID(31),
            "The member enum {0} can only be defined inside a top-level class or interface or in a static context");
        templates.put(keyFromID(113), "Abstract methods do not specify a body");
        templates.put(keyFromID(180), "Unnecessary semicolon");
        templates.put(keyFromID(204), "Syntax error on token \"{0}\", {1} expected");
        templates.put(keyFromID(205), "Syntax error on token \"{0}\", no accurate correction available");
        templates.put(keyFromID(206), "Invalid argument to operation ++/--");
        templates.put(keyFromID(207), "Interfaces cannot have constructors");
        templates.put(keyFromID(208), "Array constants can only be used in initializers");
        templates.put(keyFromID(230), "Syntax error on token \"{0}\", {1} expected before this token");
        templates.put(keyFromID(231), "Syntax error on token \"{0}\", {1} expected after this token");
        templates.put(keyFromID(232), "Syntax error on token \"{0}\", delete this token");
        templates.put(keyFromID(233), "Syntax error on tokens, delete these tokens");
        templates.put(keyFromID(234), "Syntax error on tokens, they can be merged to form {0}");
        templates.put(keyFromID(235), "Syntax error on token \"{0}\", invalid {1}");
        templates.put(keyFromID(236), "Syntax error on token(s), misplaced construct(s)");
        templates.put(keyFromID(237), "Syntax error on tokens, {0} expected instead");
        templates.put(keyFromID(238), "Syntax error on tokens, no accurate correction available");
        templates.put(keyFromID(239), "Syntax error, unexpected {0}");
        templates.put(keyFromID(240), "Syntax error, insert \"{0}\" to complete {1}");
        templates.put(keyFromID(241), "Syntax error, insert \"{0}\" to complete scope");
        templates.put(keyFromID(242), "Syntax error, insert \"{0}\" to complete phrase");
        templates.put(keyFromID(250), "Unexpected end of file");
        templates.put(keyFromID(251), "Invalid hex literal number");
        templates.put(keyFromID(252), "Invalid octal literal number");
        templates.put(keyFromID(253), "Invalid character constant");
        templates.put(keyFromID(254),
            "Invalid escape sequence (valid ones are  \\b  \\t  \\n  \\f  \\r  \\\"  \\'  \\\\ )");
        templates.put(keyFromID(256), "Invalid unicode");
        templates.put(keyFromID(257), "Invalid float literal number");
        templates.put(keyFromID(259), "String literal is not properly closed by a double-quote");
        templates.put(keyFromID(260), "Unexpected end of comment");
        templates.put(keyFromID(262), "Invalid digit (valid ones are 0..9)");
        templates.put(keyFromID(263), "Invalid low surrogate: must be within 0xDC00 and 0xDFFF");
        templates.put(keyFromID(264), "Invalid high surrogate: must be within 0xD800 and 0xDBFF");
        templates.put(keyFromID(266), "Invalid binary literal number (only '0' and '1' are expected)");
        templates.put(keyFromID(268), "Underscores have to be located within digits");
        templates.put(keyFromID(272), "Text block is not properly closed with the delimiter");
        templates.put(keyFromID(300), "The interface {0} cannot define an initializer");
        templates.put(keyFromID(440),
            "'assert' should not be used as an identifier, since it is a reserved keyword from source level 1.4 on");
        templates.put(keyFromID(441),
            "'enum' should not be used as an identifier, since it is a reserved keyword from source level 1.5 on");
        templates.put(keyFromID(443),
            "'_' should not be used as an identifier, since it is a reserved keyword from source level 1.8 on");
        templates.put(keyFromID(445), "'_' is a keyword from source level 9 onwards, cannot be used as identifier");
        templates.put(keyFromID(450), "{0}{1}");
        templates.put(keyFromID(462), "Invalid URL reference. Double quote the reference or use the href syntax");
        templates.put(keyFromID(463), "Description expected after this reference");
        templates.put(keyFromID(466), "Invalid member type qualification");
        templates.put(keyFromID(467), "Missing identifier");
        templates.put(keyFromID(469), "Invalid param tag type parameter name");
        templates.put(keyFromID(470), "Unexpected tag");
        templates.put(keyFromID(472), "Missing parameter name");
        templates.put(keyFromID(476), "Duplicate tag for return type");
        templates.put(keyFromID(478), "Missing class name");
        templates.put(keyFromID(479), "Invalid class name");
        templates.put(keyFromID(482), "Missing reference");
        templates.put(keyFromID(483), "Invalid reference");
        templates.put(keyFromID(484), "Malformed link reference");
        templates.put(keyFromID(485), "Invalid parameters declaration");
        templates.put(keyFromID(487), "Invalid tag");
        templates.put(keyFromID(512), "Missing closing brace for inline tag");
        templates.put(keyFromID(513), "Malformed reference (missing end space separator)");
        templates.put(keyFromID(515), "Missing #: \"{0}\"");
        templates.put(keyFromID(516), "Description expected after @{0}");
        templates.put(keyFromID(517), "Only static field reference is allowed for @value tag");
        templates.put(keyFromID(518), "Unexpected text");
        templates.put(keyFromID(519), "Invalid param tag name");
        templates.put(keyFromID(598), "Syntax error, annotation declaration cannot have type parameters");
        templates.put(keyFromID(599), "Syntax error, enum declaration cannot have type parameters");
        templates.put(keyFromID(624), "Annotation type declaration cannot have a constructor");
        templates.put(keyFromID(639), "Syntax error, type annotations are illegal here");
        templates.put(keyFromID(648), "Lambda expressions cannot declare a this parameter");
        templates.put(keyFromID(662), "Illegal attempt to create arrays of union types");
        templates.put(keyFromID(701),
            "Cannot read the source from {0}; either the file uses a different encoding than {1} or it is corrupted");
        templates.put(keyFromID(702), "Cannot read the source from {0} due to internal exception {1}");
        templates.put(keyFromID(741),
            "Floating-point expressions are always strictly evaluated from source level 17. Keyword 'strictfp' is not required.");
        templates.put(keyFromID(800), "Extended dimensions are illegal for a variable argument");
        templates.put(keyFromID(1001),
            "Syntax error, modifiers and annotations are not allowed for the lambda parameter {0} as its type is elided");
        templates.put(keyFromID(1002), "Syntax error, modifiers are not allowed here");
        templates.put(keyFromID(1058), "Default methods are allowed only in interfaces.");
        templates.put(keyFromID(1103),
            "{0} is a preview feature and disabled by default. Use --enable-preview to enable");
        templates.put(keyFromID(1104),
            "You are using a preview language feature that may or may not be supported in a future release");
        templates.put(keyFromID(1105), "The preview feature {0} is only available with source level {1} and above");
        templates.put(keyFromID(1107), "The Java feature ''{0}'' is only available with source level {1} and above");
        templates.put(keyFromID(1110),
            "Compiling for Java version ''{0}'' is not supported yet. Using ''{1}'' instead");
        templates.put(keyFromID(1351), "Variable resource not allowed here for source level below 9");
        templates.put(keyFromID(1501), "'var' is not allowed as an element type of an array");
        templates.put(keyFromID(1513), "'var' cannot be used with type arguments");
        templates.put(keyFromID(1719), "Multi-constant case labels supported from Java 14 onwards only");
        templates.put(keyFromID(1720), "Arrow in case statement supported from Java 14 onwards only");
        templates.put(keyFromID(1721), "Switch Expressions are supported from Java 14 onwards only");
        templates.put(keyFromID(1756), "A record declaration {0} is not allowed in a local inner class");
        templates.put(keyFromID(1763), "Extended dimensions are illegal for a record component");
        templates.put(keyFromID(1769), "A compact constructor is allowed only in record classes");
        templates.put(keyFromID(1785), "A record pattern may not specify dimensions");
        templates.put(keyFromID(1802), "Missing uses class name");
        templates.put(keyFromID(1804), "Invalid uses class");
        templates.put(keyFromID(1807), "Missing provides class name");
        templates.put(keyFromID(1809), "Invalid provides class");
        templates.put(keyFromID(1812), "Space required after snippet tag");
        templates.put(keyFromID(1813), "Snippet is invalid due to missing colon");
        templates.put(keyFromID(1814), "Snippet content should be on a new line");
        templates.put(keyFromID(1815), "Region in the snippet is not closed");
        templates.put(keyFromID(1816), "Attribute regex and substring used simulataneously");
        templates.put(keyFromID(1817), "Duplicate region");
        templates.put(keyFromID(1901), "Cannot mix pattern with other case labels");
        return templates;
    }
}
