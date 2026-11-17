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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler;

/*
 * Factory used from inside the compiler to build the actual problems
 * which are handed back in the compilation result.
 *
 * This allows sharing the internal problem representation with the environment.
 *
 * Note: The factory is responsible for computing and storing an English error message.
 */
public class IProblemFactory {

    /**
     * Answer a new IProblem created according to the parameters values.
     *
     * @param problemId the problem id
     * @param messageArguments the arguments needed to set the error message (shorter names than problemArguments ones)
     * @param severity the severity of the problem
     * @param startPosition the start position of the problem
     * @param endPosition the end position of the problem
     * @param lineNumber the line on which the problem occurred
     * @return a new IProblem created according to the parameters values.
     */
    public IProblem createProblem(int problemId, String[] messageArguments, int severity, int startPosition,
        int endPosition, int lineNumber) {
        return new IProblem(this.getLocalizedMessage(problemId, messageArguments), problemId, severity, startPosition,
            endPosition, lineNumber);
    }

    public final String getLocalizedMessage(int id, String[] problemArguments) {
        String rawMessage = messageTemplate(id & 2097151);
        if (rawMessage == null) {
            return "Unable to retrieve the error message for problem id: " //$NON-NLS-1$
                + (id & 2097151) + ". Check compiler resources.";  //$NON-NLS-1$
        }
        char[] message = rawMessage.toCharArray();

        int length = message.length;
        int start = 0;
        int end;
        StringBuilder output = null;
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
                            + String.join(", ", problemArguments) + "}"; //$NON-NLS-1$
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
     * Returns the English message template for a problem ID without its category bits, or {@code null} for problems
     * that the formatter never reports.
     */
    private static String messageTemplate(int id) {
        return switch (id) {
            case 26 -> "The member interface {0} can only be defined inside a top-level class or interface or in a static context";
            case 30 -> "The member annotation {0} can only be defined inside a top-level class or interface or in a static context";
            case 31 -> "The member enum {0} can only be defined inside a top-level class or interface or in a static context";
            case 113 -> "Abstract methods do not specify a body";
            case 204 -> "Syntax error on token \"{0}\", {1} expected";
            case 205 -> "Syntax error on token \"{0}\", no accurate correction available";
            case 206 -> "Invalid argument to operation ++/--";
            case 207 -> "Interfaces cannot have constructors";
            case 208 -> "Array constants can only be used in initializers";
            case 230 -> "Syntax error on token \"{0}\", {1} expected before this token";
            case 231 -> "Syntax error on token \"{0}\", {1} expected after this token";
            case 232 -> "Syntax error on token \"{0}\", delete this token";
            case 233 -> "Syntax error on tokens, delete these tokens";
            case 234 -> "Syntax error on tokens, they can be merged to form {0}";
            case 235 -> "Syntax error on token \"{0}\", invalid {1}";
            case 236 -> "Syntax error on token(s), misplaced construct(s)";
            case 237 -> "Syntax error on tokens, {0} expected instead";
            case 238 -> "Syntax error on tokens, no accurate correction available";
            case 239 -> "Syntax error, unexpected {0}";
            case 240 -> "Syntax error, insert \"{0}\" to complete {1}";
            case 241 -> "Syntax error, insert \"{0}\" to complete scope";
            case 242 -> "Syntax error, insert \"{0}\" to complete phrase";
            case 251 -> "Invalid hex literal number";
            case 253 -> "Invalid character constant";
            case 254 -> "Invalid escape sequence (valid ones are  \\b  \\t  \\n  \\f  \\r  \\\"  \\'  \\\\ )";
            case 256 -> "Invalid unicode";
            case 257 -> "Invalid float literal number";
            case 259 -> "String literal is not properly closed by a double-quote";
            case 260 -> "Unexpected end of comment";
            case 263 -> "Invalid low surrogate: must be within 0xDC00 and 0xDFFF";
            case 264 -> "Invalid high surrogate: must be within 0xD800 and 0xDBFF";
            case 266 -> "Invalid binary literal number (only '0' and '1' are expected)";
            case 268 -> "Underscores have to be located within digits";
            case 272 -> "Text block is not properly closed with the delimiter";
            case 300 -> "The interface {0} cannot define an initializer";
            case 440 -> "'assert' should not be used as an identifier, since it is a reserved keyword from source level 1.4 on";
            case 441 -> "'enum' should not be used as an identifier, since it is a reserved keyword from source level 1.5 on";
            case 443 -> "'_' should not be used as an identifier, since it is a reserved keyword from source level 1.8 on";
            case 445 -> "'_' is a keyword from source level 9 onwards, cannot be used as identifier";
            case 450 -> "{0}{1}";
            case 598 -> "Syntax error, annotation declaration cannot have type parameters";
            case 599 -> "Syntax error, enum declaration cannot have type parameters";
            case 624 -> "Annotation type declaration cannot have a constructor";
            case 639 -> "Syntax error, type annotations are illegal here";
            case 648 -> "Lambda expressions cannot declare a this parameter";
            case 662 -> "Illegal attempt to create arrays of union types";
            case 800 -> "Extended dimensions are illegal for a variable argument";
            case 1001 -> "Syntax error, modifiers and annotations are not allowed for the lambda parameter {0} as its type is elided";
            case 1002 -> "Syntax error, modifiers are not allowed here";
            case 1058 -> "Default methods are allowed only in interfaces.";
            case 1107 -> "The Java feature '{0}' is only available with source level {1} and above";
            case 1351 -> "Variable resource not allowed here for source level below 9";
            case 1501 -> "'var' is not allowed as an element type of an array";
            case 1513 -> "'var' cannot be used with type arguments";
            case 1719 -> "Multi-constant case labels supported from Java 14 onwards only";
            case 1720 -> "Arrow in case statement supported from Java 14 onwards only";
            case 1721 -> "Switch Expressions are supported from Java 14 onwards only";
            case 1756 -> "A record declaration {0} is not allowed in a local inner class";
            case 1763 -> "Extended dimensions are illegal for a record component";
            case 1769 -> "A compact constructor is allowed only in record classes";
            case 1785 -> "A record pattern may not specify dimensions";
            case 1901 -> "Cannot mix pattern with other case labels";
            default -> null;
        };
    }
}
