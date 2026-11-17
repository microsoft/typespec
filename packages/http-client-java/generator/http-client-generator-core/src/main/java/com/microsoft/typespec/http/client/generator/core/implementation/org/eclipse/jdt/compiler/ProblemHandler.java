// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2016 IBM Corporation and others.
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
 *     Stephan Herrmann - Contribution for
 *								Bug 458396 - NPE in CodeStream.invoke()
 *******************************************************************************/
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
 *     Benjamin Muskalla - Contribution for bug 239066
 *     Stephan Herrmann  - Contributions for
 *	     						bug 236385 - [compiler] Warn for potential programming problem if an object is created but not used
 *  	   						bug 338303 - Warning about Redundant assignment conflicts with definite assignment
 *								bug 349326 - [1.7] new warning for missing try-with-resources
 *								bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 365519 - editorial cleanup after bug 186342 and bug 365387
 *								bug 365662 - [compiler][null] warn on contradictory and redundant null annotations
 *								bug 365531 - [compiler][null] investigate alternative strategy for internally encoding nullness defaults
 *								bug 365859 - [compiler][null] distinguish warnings based on flow analysis vs. null annotations
 *								bug 374605 - Unreasonable warning for enum-based switch statements
 *								bug 382353 - [1.8][compiler] Implementation property modifiers should be accepted on default methods.
 *								bug 382347 - [1.8][compiler] Compiler accepts incorrect default method inheritance
 *								bug 388281 - [compiler][null] inheritance of null annotations as an option
 *								bug 376053 - [compiler][resource] Strange potential resource leak problems
 *								bug 381443 - [compiler][null] Allow parameter widening from @NonNull to unannotated
 *								bug 393719 - [compiler] inconsistent warnings on iteration variables
 *								bug 392862 - [1.8][compiler][null] Evaluate null annotations on array types
 *								bug 388739 - [1.8][compiler] consider default methods when detecting whether a class needs to be declared abstract
 *								bug 331649 - [compiler][null] consider null annotations for fields
 *								bug 382789 - [compiler][null] warn when syntactically-nonnull expression is compared against null
 *								bug 376590 - Private fields with @Inject are ignored by unused field validation
 *								bug 400761 - [compiler][null] null may be return as boolean without a diagnostic
 *								bug 402028 - [1.8][compiler] null analysis for reference expressions
 *								bug 401796 - [1.8][compiler] don't treat default methods as overriding an independent inherited abstract method
 *								bug 404649 - [1.8][compiler] detect illegal reference to indirect or redundant super
 *								bug 392384 - [1.8][compiler][null] Restore nullness info from type annotations in class files
 *								Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 415043 - [1.8][null] Follow-up re null type annotations after bug 392099
 *								Bug 415291 - [1.8][null] differentiate type incompatibilities due to null annotations
 *								Bug 415850 - [1.8] Ensure RunJDTCoreTests can cope with null annotations enabled
 *								Bug 414380 - [compiler][internal] QualifiedNameReference#indexOfFirstFieldBinding does not point to the first field
 *								Bug 392238 - [1.8][compiler][null] Detect semantically invalid null type annotations
 *								Bug 416307 - [1.8][compiler][null] subclass with type parameter substitution confuses null checking
 *								Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *								Bug 424637 - [1.8][compiler][null] AIOOB in ReferenceExpression.resolveType with a method reference to Files::walk
 *								Bug 428294 - [1.8][compiler] Type mismatch: cannot convert from List<Object> to Collection<Object[]>
 *								Bug 428366 - [1.8] [compiler] The method valueAt(ObservableList<Object>, int) is ambiguous for the type Bindings
 *								Bug 416190 - [1.8][null] detect incompatible overrides due to null type annotations
 *								Bug 392245 - [1.8][compiler][null] Define whether / how @NonNullByDefault applies to TYPE_USE locations
 *								Bug 390889 - [1.8][compiler] Evaluate options to support 1.7- projects against 1.8 JRE.
 *								Bug 430150 - [1.8][null] stricter checking against type variables
 *								Bug 434600 - Incorrect null analysis error reporting on type parameters
 *								Bug 439516 - [1.8][null] NonNullByDefault wrongly applied to implicit type bound of binary type
 *								Bug 438467 - [compiler][null] Better error position for "The method _ cannot implement the corresponding method _ due to incompatible nullness constraints"
 *								Bug 439298 - [null] "Missing code implementation in the compiler" when using @NonNullByDefault in package-info.java
 *								Bug 435805 - [1.8][compiler][null] Java 8 compiler does not recognize declaration style null annotations
 *								Bug 446442 - [1.8] merge null annotations from super methods
 *								Bug 455723 - Nonnull argument not correctly inferred in loop
 *								Bug 458361 - [1.8][null] reconciler throws NPE in ProblemHandler.illegalReturnRedefinition()
 *								Bug 459967 - [null] compiler should know about nullness of special methods like MyEnum.valueOf()
 *								Bug 461878 - [1.7][1.8][compiler][null] ECJ compiler does not allow to use null annotations on annotations
 *								Bug 410218 - Optional warning for arguments of "unexpected" types to Map#get(Object), Collection#remove(Object) et al.
 *      Jesper S Moller <jesper@selskabet.org> -  Contributions for
 *								bug 382701 - [1.8][compiler] Implement semantic analysis of Lambda expressions & Reference expression
 *								bug 382721 - [1.8][compiler] Effectively final variables needs special treatment
 *								bug 384567 - [1.5][compiler] Compiler accepts illegal modifiers on package declaration
 *								bug 412153 - [1.8][compiler] Check validity of annotations which may be repeatable
 *								bug 412151 - [1.8][compiler] Check repeating annotation's collection type
 *								bug 419209 - [1.8] Repeating container annotations should be rejected in the presence of annotation it contains
 *								Bug 429384 - [1.8][null] implement conformance rules for null-annotated lower / upper type bounds
 *								Bug 416182 - [1.8][compiler][null] Contradictory null annotations not rejected
 *								bug 527554 - [18.3] Compiler support for JEP 286 Local-Variable Type
 *     Ulrich Grave <ulrich.grave@gmx.de> - Contributions for
 *                              bug 386692 - Missing "unused" warning on "autowired" fields
 *     Ashley Scopes - Contributions for
 * 								GH-954 	   - Module binding error renders incorrectly for diagnostics
 ********************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractMethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.AbstractVariableDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Annotation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Argument;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.ConstructorDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.Expression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.FieldDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.MethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeParameter;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.ast.TypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Parser;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.TerminalToken;

/*
 * Compiler error handler, responsible to determine whether
 * a problem is actually a warning or an error; also will
 * decide whether the compilation task can be processed further or not.
 *
 * Behavior : will request its current policy if need to stop on
 *	first error, and if should proceed (persist) with problems.
 */
public class ProblemHandler {

    public boolean ignoreAllErrors;
    public final IProblemFactory problemFactory;
    public final CompilerOptions options;

    /*
     * Problem handler can be supplied with a policy to specify its behavior in error handling. Also see static methods
     * for built-in policies.
     */
    public ProblemHandler(boolean ignoreAllErrors, CompilerOptions options, IProblemFactory problemFactory) {
        this.ignoreAllErrors = ignoreAllErrors;
        this.problemFactory = problemFactory;
        this.options = options;
    }

    public IProblem createProblem(int problemId, String[] messageArguments, int severity, int problemStartPosition,
        int problemEndPosition, int lineNumber) {
        return this.problemFactory.createProblem(problemId, messageArguments, severity, problemStartPosition,
            problemEndPosition, lineNumber);
    }

    public void handle(int problemId, String[] messageArguments, int severity, int problemStartPosition,
        int problemEndPosition, ReferenceContext referenceContext, CompilationResult unitResult) {
        if (severity == 256)
            return;

        if ((severity & 512) == 0 && ignoreAllErrors) {
            // Error is not to be exposed, but clients may need still notification as to whether there are
            // silently-ignored-errors.
            // if no reference context, we need to abort from the current compilation process
            if (referenceContext == null) {
                if ((severity & 1) != 0) { // non reportable error is fatal
                    IProblem problem = this.createProblem(problemId, messageArguments, severity, 0, 0, 0);
                    throw new AbortCompilation(problem);
                } else {
                    return; // ignore non reportable warning
                }
            }
            return;
        }

        // if no reference context, we need to abort from the current compilation process
        if (referenceContext == null) {
            if ((severity & 1) != 0) { // non reportable error is fatal
                IProblem problem = this.createProblem(problemId, messageArguments, severity, 0, 0, 0);
                throw new AbortCompilation(problem);
            } else {
                return; // ignore non reportable warning
            }
        }

        int[] lineEnds;
        int lineNumber = problemStartPosition >= 0
            ? Util.getLineNumber(problemStartPosition, lineEnds = unitResult.getLineSeparatorPositions(),
                lineEnds.length - 1)
            : 0;
        IProblem problem = this.createProblem(problemId, messageArguments, severity, problemStartPosition,
            problemEndPosition, lineNumber);

        // problem couldn't be created, ignore

        switch (severity & 1) {
            case 1:
                record(problem, unitResult, referenceContext);
                if ((severity & 128) != 0) {
                    // don't abort or tag as error if the error is suppressed
                    referenceContext.hasErrors();
                    referenceContext.tagAsHavingErrors();
                    // should abort ?
                    int abortLevel;
                    if ((abortLevel = severity & 30) != 0) {
                        referenceContext.abort(abortLevel, problem);
                    }
                }
                break;

            case 0:
                record(problem, unitResult, referenceContext);
                break;
        }
    }

    /**
     * Standard problem handling API, the actual severity (warning/error/ignore) is deducted from the problem ID and the
     * current compiler options.
     */
    public void handle(int problemId, String[] messageArguments, int problemStartPosition, int problemEndPosition,
        ReferenceContext referenceContext, CompilationResult unitResult) {
        this.handle(problemId, // no message elaboration
            messageArguments, computeSeverity(problemId), // severity inferred using the ID
            problemStartPosition, problemEndPosition, referenceContext, unitResult);
    }

    public void record(IProblem problem, CompilationResult unitResult, ReferenceContext referenceContext) {
        unitResult.record(problem, referenceContext);
    }

    public ReferenceContext referenceContext;

    public void abstractMethodNeedingNoBody(AbstractMethodDeclaration method) {
        this.handle(603979889, CharOperation.NO_STRINGS, method.sourceStart, method.sourceEnd, method,
            method.compilationResult());
    }

    public void annotationTypeDeclarationCannotHaveConstructor(ConstructorDeclaration constructorDeclaration) {
        this.handle(1610613360, CharOperation.NO_STRINGS, constructorDeclaration.sourceStart,
            constructorDeclaration.sourceEnd);
    }

    public void arrayConstantsOnlyInArrayInitializers(int sourceStart, int sourceEnd) {
        this.handle(1610612944, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

// https://bugs.eclipse.org/bugs/show_bug.cgi?id=391092
    public void illegalArrayOfUnionType(TypeReference typeReference) {
        this.handle(16777878, CharOperation.NO_STRINGS, typeReference.sourceStart, typeReference.sourceEnd);
    }

    /**
     * Answers the severity of a problem under the formatter's fixed options: ignore (256), warning (0), optional
     * warning (32), optional error (33), or fatal error (129).
     *
     * @param problemID the problem ID
     * @return the severity
     */
    public int computeSeverity(int problemID) {
        return switch (problemID) {
            case 536871092 -> 256; // unnecessary semicolon
            // 'assert' and 'enum' used as identifiers
            case 536871352, 536871353 -> 33;
            case 536871362 -> 32; // task tags
            case 1610613179 -> 0; // '_' used as an identifier
            default -> 129;
        };
    }

    public void defaultModifierIllegallySpecified(int sourceStart, int sourceEnd) {
        this.handle(67109922, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

// use this private API when the compilation unit result can be found through the
// reference context. Otherwise, use the other API taking a problem and a compilation result
// as arguments
    private void handle(int problemId, String[] messageArguments, int problemStartPosition, int problemEndPosition) {
        this.handle(problemId, messageArguments, problemStartPosition, problemEndPosition, this.referenceContext,
            this.referenceContext == null ? null : this.referenceContext.compilationResult());
        this.referenceContext = null;
    }

// use this private API when the compilation unit result cannot be found through the
// reference context.
    private void handle(int problemId, String[] messageArguments, int problemStartPosition, int problemEndPosition,
        CompilationResult unitResult) {
        this.handle(problemId, messageArguments, problemStartPosition, problemEndPosition, this.referenceContext,
            unitResult);
        this.referenceContext = null;
    }

    public void illegalExtendedDimensions(AbstractVariableDeclaration aVarDecl) {
        this.handle(1610613536, CharOperation.NO_STRINGS, aVarDecl.sourceStart, aVarDecl.sourceEnd);
    }

    public void illegalLocalTypeDeclaration(TypeDeclaration typeDeclaration) {
        int problemID = 0;
        if ((typeDeclaration.modifiers & 16384) != 0) {
            problemID = 536870943;
        } else if ((typeDeclaration.modifiers & 8192) != 0) {
            problemID = 536870942;
        } else if ((typeDeclaration.modifiers & 512) != 0) {
            problemID = 536870938;
        } else if (typeDeclaration.isRecord()) {
            problemID = 16778972;
        }
        if (problemID != 0) {
            String[] arguments = new String[] { new String(typeDeclaration.name) };
            this.handle(problemID, arguments, typeDeclaration.sourceStart, typeDeclaration.sourceEnd);
        }
    }

    public void illegalThis(Argument argument) {

        this.handle(1610613384, CharOperation.NO_STRINGS, argument.sourceStart, argument.sourceEnd);
    }

    public void interfaceCannotHaveConstructors(ConstructorDeclaration constructor) {
        this.handle(1610612943, CharOperation.NO_STRINGS, constructor.sourceStart, constructor.sourceEnd, constructor,
            constructor.compilationResult());
    }

    public void interfaceCannotHaveInitializers(char[] sourceName, FieldDeclaration fieldDecl) {
        String[] arguments = new String[] { new String(sourceName) };

        this.handle(16777516, arguments, fieldDecl.sourceStart, fieldDecl.sourceEnd);
    }

    public void invalidUnaryExpression(Expression expression) {
        this.handle(1610612942, CharOperation.NO_STRINGS, expression.sourceStart, expression.sourceEnd);
    }

    public void invalidUsageOfTypeParametersForAnnotationDeclaration(TypeDeclaration annotationTypeDeclaration) {
        TypeParameter[] parameters = annotationTypeDeclaration.typeParameters;
        int length = parameters.length;
        this.handle(1610613334, CharOperation.NO_STRINGS, parameters[0].declarationSourceStart,
            parameters[length - 1].declarationSourceEnd);
    }

    public void invalidUsageOfTypeParametersForEnumDeclaration(TypeDeclaration annotationTypeDeclaration) {
        TypeParameter[] parameters = annotationTypeDeclaration.typeParameters;
        int length = parameters.length;
        this.handle(1610613335, CharOperation.NO_STRINGS, parameters[0].declarationSourceStart,
            parameters[length - 1].declarationSourceEnd);
    }

    public void misplacedTypeAnnotations(Annotation first, Annotation last) {
        this.handle(1610613375, CharOperation.NO_STRINGS, first.sourceStart, last.sourceEnd);
    }

    private boolean isIdentifier(TerminalToken token) {
        return token == TerminalToken.TokenNameIdentifier;
    }

    private boolean isLiteral(TerminalToken token) {
        return Scanner.isLiteral(token);
    }

    public void parseErrorDeleteToken(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String errorTokenName) {
        syntaxError(1610612968, start, end, currentKind, errorTokenSource, errorTokenName, null);
    }

    public void parseErrorDeleteTokens(int start, int end) {
        this.handle(1610612969, CharOperation.NO_STRINGS, start, end);
    }

    public void parseErrorInsertAfterToken(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String errorTokenName, String expectedToken) {
        syntaxError(1610612967, start, end, currentKind, errorTokenSource, errorTokenName, expectedToken);
    }

    public void parseErrorInsertBeforeToken(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String errorTokenName, String expectedToken) {
        syntaxError(1610612966, start, end, currentKind, errorTokenSource, errorTokenName, expectedToken);
    }

    public void parseErrorInsertToComplete(int start, int end, String inserted, String completed) {
        String[] arguments = new String[] { inserted, completed };
        this.handle(1610612976, arguments, start, end);
    }

    public void parseErrorInsertToCompletePhrase(int start, int end, String inserted) {
        String[] arguments = new String[] { inserted };
        this.handle(1610612978, arguments, start, end);
    }

    public void parseErrorInsertToCompleteScope(int start, int end, String inserted) {
        String[] arguments = new String[] { inserted };
        this.handle(1610612977, arguments, start, end);
    }

    public void parseErrorInvalidToken(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String errorTokenName, String expectedToken) {
        syntaxError(1610612971, start, end, currentKind, errorTokenSource, errorTokenName, expectedToken);
    }

    public void parseErrorMergeTokens(int start, int end, String expectedToken) {
        String[] arguments = new String[] { expectedToken };
        this.handle(1610612970, arguments, start, end);
    }

    public void parseErrorMisplacedConstruct(int start, int end) {
        this.handle(1610612972, CharOperation.NO_STRINGS, start, end);
    }

    public void parseErrorNoSuggestion(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String errorTokenName) {
        syntaxError(1610612941, start, end, currentKind, errorTokenSource, errorTokenName, null);
    }

    public void parseErrorNoSuggestionForTokens(int start, int end) {
        this.handle(1610612974, CharOperation.NO_STRINGS, start, end);
    }

    public void parseErrorReplaceToken(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String errorTokenName, String expectedToken) {
        handleSyntaxError(start, end, currentKind, errorTokenSource, errorTokenName, expectedToken);
    }

    public void parseErrorReplaceTokens(int start, int end, String expectedToken) {
        String[] arguments = new String[] { expectedToken };
        this.handle(1610612973, arguments, start, end);
    }

    public void parseErrorUnexpectedEnd(int start, int end) {
        String[] arguments;
        if (this.referenceContext instanceof ConstructorDeclaration) {
            arguments = new String[] { "end of constructor" };
        } else if (this.referenceContext instanceof MethodDeclaration) {
            arguments = new String[] { "end of method" };
        } else if (this.referenceContext instanceof TypeDeclaration) {
            arguments = new String[] { "end of initializer" };
        } else {
            arguments = new String[] { "end of file" };
        }
        this.handle(1610612975, arguments, start, end);
    }

    public void scannerError(Parser parser, String errorTokenName) {
        Scanner scanner = parser.scanner;

        int flag = 1610612941;
        int startPos = scanner.startPosition;
        int endPos = scanner.currentPosition - 1;

        // special treatment for recognized errors....
        switch (errorTokenName) {
            case "Invalid_Hexa_Literal" -> flag = 1610612987;
            case "Invalid_Character_Constant" -> flag = 1610612989;
            case "Invalid_Escape" -> flag = 1610612990;
            case "Invalid_Unicode_Escape" -> {
                flag = 1610612992;
                // better locate the error message
                char[] source = scanner.source;
                int checkPos = scanner.currentPosition - 1;
                if (checkPos >= source.length)
                    checkPos = source.length - 1;
                while (checkPos >= startPos) {
                    if (source[checkPos] == '\\')
                        break;
                    checkPos--;
                }
                startPos = checkPos;
            }
            case "Invalid_Low_Surrogate" -> flag = 1610612999;
            case "Invalid_High_Surrogate" -> {
                flag = 1610613000;
                // better locate the error message
                char[] source = scanner.source;
                int checkPos = scanner.startPosition + 1;
                while (checkPos <= endPos) {
                    if (source[checkPos] == '\\')
                        break;
                    checkPos++;
                }
                endPos = checkPos - 1;
            }
            case "Invalid_Float_Literal" -> flag = 1610612993;
            case "Unterminated_String", "Invalid_Char_In_String" -> flag = 1610612995;
            case "Unterminated_Text_Block" -> flag = 2097424;
            case "Unterminated_Comment" -> flag = 1610612996;
            case "Invalid_Binary_Literal" -> flag = 1610613002;
            case "Invalid_Underscore" -> flag = 1610613004;
        }

        String[] arguments = flag == 1610612941 ? new String[] { errorTokenName } : CharOperation.NO_STRINGS;
        this.handle(flag, arguments,
            // this is the current -invalid- token position
            startPos, endPos, parser.compilationUnit.compilationResult);
    }

    public void superfluousSemicolon(int sourceStart, int sourceEnd) {
        this.handle(536871092, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    private void handleSyntaxError(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String errorTokenName, String expectedToken) {
        syntaxError(1610612940, start, end, currentKind, errorTokenSource, errorTokenName, expectedToken);
    }

    private void syntaxError(int id, int startPosition, int endPosition, TerminalToken currentKind,
        char[] currentTokenSource, String errorTokenName, String expectedToken) {
        if (currentKind == TerminalToken.TokenNameAT && expectedToken != null && expectedToken.equals("@")) { //$NON-NLS-1$
            // In the diagnose parser case, we don't have the wherewithal to discriminate when we should hand out @308
            // vs @. So we always answer @.
            // We should silently recover so swallow the message.
            return;
        }

        if (currentKind == TerminalToken.TokenNameARROW && expectedToken != null && expectedToken.equals("CaseArrow")) { //$NON-NLS-1$
            /*
             * Silently swallow the error: "Syntax error on token "->", CaseArrow expected": Diagnose Parser will apply
             * this repair and chug along on its way ... This can never be the only error in a program, so we are good
             * suppressing this. In fact, this means there is NO penalty in the Scanner having to failed to disambiguate
             * between TokenNameARROW and TokenNameCaseArrow and that is beautiful!
             */
            return;
        }

        String eTokenName;
        if (Scanner.isKeyword(currentKind) || isLiteral(currentKind) || isIdentifier(currentKind)) {
            eTokenName = new String(currentTokenSource);
        } else {
            eTokenName = errorTokenName;
        }

        eTokenName = replaceIfSynthetic(eTokenName);

        String[] arguments;
        if (expectedToken != null) {
            expectedToken = replaceIfSynthetic(expectedToken);
            arguments = new String[] { eTokenName, expectedToken };
        } else {
            arguments = new String[] { eTokenName };
        }
        this.handle(id, arguments, startPosition, endPosition);
    }

    private String replaceIfSynthetic(String token) {
        /*
         * Java 8 grammar changes use some synthetic tokens to make the grammar LALR(1). These tokens should not be
         * exposed in messages as it would make no sense to the programmer whatsoever. Replace such artificial tokens
         * with some "suitable" alternative. At the moment, there are two synthetic tokens that need such massaging viz
         * : "BeginLambda" and "BeginTypeArguments". There is a third synthetic token "ElidedSemicolonAndRightBrace"
         * that we don't expect to show up in messages since it is manufactured by the parser automatically.
         */
        return switch (token) {
            case "CaseArrow" -> "->";
            case "BeginTypeArguments" -> ".";
            case "BeginLambda" -> "(";
            case "RestrictedIdentifierYield" -> "yield";
            case "RestrictedIdentifierrecord" -> "record";
            case "RestrictedIdentifiersealed" -> "sealed";
            case "RestrictedIdentifierpermits" -> "permits";
            default -> token;
        };
    }

    public void task(String tag, String message, String priority, int start, int end) {
        this.handle(536871362,
            new String[] { tag, message, priority/* secret argument that is not surfaced in getMessage() */ }, start,
            end);
    }

    // Reports the use of a language feature that Java 11 source does not support
    public void validateJavaFeatureSupport(JavaFeature feature, int sourceStart, int sourceEnd) {
        String version = CompilerOptions.versionFromJdkLevel(feature.getCompliance());
        String[] args = new String[] { feature.getName(), version };
        this.handle(4195411, args, sourceStart, sourceEnd);
    }

    public void useAssertAsAnIdentifier(int sourceStart, int sourceEnd) {
        this.handle(536871352, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void useEnumAsAnIdentifier(int sourceStart, int sourceEnd) {
        this.handle(536871353, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void illegalUseOfUnderscoreAsAnIdentifier(int sourceStart, int sourceEnd, boolean reportError) {
        int problemId = (reportError) ? 1610613181 : 1610613179;
        this.handle(problemId, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void varLocalCannotBeArray(ASTNode varDecl) {
        this.handle(1073743325, CharOperation.NO_STRINGS, varDecl.sourceStart, varDecl.sourceEnd);
    }

    public void varCannotBeUsedWithTypeArguments(ASTNode astNode) {
        this.handle(1073743337, CharOperation.NO_STRINGS, astNode.sourceStart, astNode.sourceEnd);
    }

    public void autoManagedVariableResourcesNotBelow9(Expression resource) {
        this.handle(1610614087, CharOperation.NO_STRINGS, resource.sourceStart, resource.sourceEnd);
    }

    public void illegalModifiersForElidedType(Argument argument) {
        String[] arg = new String[] { new String(argument.name) };
        this.handle(536871913, arg, argument.declarationSourceStart, argument.declarationSourceEnd);
    }

    public void illegalModifiers(int modifierSourceStart, int modifiersSourceEnd) {
        this.handle(536871914, CharOperation.NO_STRINGS, modifierSourceStart, modifiersSourceEnd);
    }

    public void multiConstantCaseLabelsNotSupported(ASTNode statement) {
        this.handle(1073743543, CharOperation.NO_STRINGS, statement.sourceStart, statement.sourceEnd);
    }

    public void arrowInCaseStatementsNotSupported(ASTNode statement) {
        this.handle(1073743544, CharOperation.NO_STRINGS, statement.sourceStart, statement.sourceEnd);
    }

    public void switchExpressionsNotSupported(ASTNode statement) {
        this.handle(1073743545, CharOperation.NO_STRINGS, statement.sourceStart, statement.sourceEnd);
    }

    public void compactConstructorsOnlyInRecords(AbstractMethodDeclaration ccd) {
        this.handle(16778985, CharOperation.NO_STRINGS, ccd.sourceStart, ccd.sourceEnd);
    }

    public void illegalExtendedDimensionsForRecordComponent(AbstractVariableDeclaration aVarDecl) {
        this.handle(1610614499, CharOperation.NO_STRINGS, aVarDecl.sourceStart, aVarDecl.sourceEnd);
    }

    public void illegalCaseConstantCombination(Expression element) {
        this.handle(2099053, CharOperation.NO_STRINGS, element.sourceStart, element.sourceEnd);
    }

    public void dimensionsIllegalOnRecordPattern(int sourceStart, int sourceEnd) {
        this.handle(536872697, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    /**
     * General strategy: <ul> <li>clients are responsible for assigning {@link #referenceContext} prior to invoking any
     * reporting method. <li>individual
     * methods should ensure that {@link #referenceContext} is reset to {@code null} afterwards. This may happen in two
     * ways: <ul><li>by calling any of the {@code handle(..)} methods on all paths, or failing that <li>wrap their body
     * in {@code try { ... } finally {problemReporter.close();}}. </ul></ul>
     */
    public void close() {
        this.referenceContext = null;
    }
}
