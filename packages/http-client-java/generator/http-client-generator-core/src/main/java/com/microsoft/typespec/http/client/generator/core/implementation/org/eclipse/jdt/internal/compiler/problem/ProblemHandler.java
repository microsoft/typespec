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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.problem;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.IProblem;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.CompilationResult;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.IErrorHandlingPolicy;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.IProblemFactory;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ASTNode;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.AbstractMethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.AbstractVariableDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Annotation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Argument;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.CompilationUnitDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.ConstructorDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.Expression;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.FieldDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.MethodDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TypeDeclaration;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TypeParameter;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.TypeReference;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.env.ICompilationUnit;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.CompilerOptions;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.JavaFeature;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl.ReferenceContext;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Parser;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.RecoveryScanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.Scanner;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.parser.TerminalToken;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;
import java.io.CharConversionException;
import java.util.HashMap;
import java.util.Map;

/*
 * Compiler error handler, responsible to determine whether
 * a problem is actually a warning or an error; also will
 * decide whether the compilation task can be processed further or not.
 *
 * Behavior : will request its current policy if need to stop on
 *	first error, and if should proceed (persist) with problems.
 */
public class ProblemHandler {

    public IErrorHandlingPolicy policy;
    public final IProblemFactory problemFactory;
    public final CompilerOptions options;

    /*
     * Problem handler can be supplied with a policy to specify its behavior in error handling. Also see static methods
     * for built-in policies.
     */
    public ProblemHandler(IErrorHandlingPolicy policy, CompilerOptions options, IProblemFactory problemFactory) {
        this.policy = policy;
        this.problemFactory = problemFactory;
        this.options = options;
    }

    public IProblem createProblem(int problemId, String[] problemArguments, String[] messageArguments, int severity,
        int problemStartPosition, int problemEndPosition, int lineNumber) {
        return this.problemFactory.createProblem(problemId, problemArguments, messageArguments, severity,
            problemStartPosition, problemEndPosition, lineNumber);
    }

    public void handle(int problemId, String[] problemArguments, String[] messageArguments, int severity,
        int problemStartPosition, int problemEndPosition, ReferenceContext referenceContext,
        CompilationResult unitResult) {
        if (severity == 256)
            return;

        boolean mandatory = (severity & (1 | 32)) == 1;
        if ((severity & 512) == 0 && this.policy.ignoreAllErrors()) {
            // Error is not to be exposed, but clients may need still notification as to whether there are
            // silently-ignored-errors.
            // if no reference context, we need to abort from the current compilation process
            if (referenceContext == null) {
                if ((severity & 1) != 0) { // non reportable error is fatal
                    IProblem problem
                        = this.createProblem(problemId, problemArguments, messageArguments, severity, 0, 0, 0);
                    throw new AbortCompilation(null, problem);
                } else {
                    return; // ignore non reportable warning
                }
            }
            return;
        }

        if ((severity & 32) != 0 && problemId != 536871362 && !this.options.ignoreSourceFolderWarningOption) {
            ICompilationUnit cu = unitResult.getCompilationUnit();
            try {
                if (cu != null && cu.ignoreOptionalProblems())
                    return;
                // workaround for illegal implementation of ICompilationUnit, see https://bugs.eclipse.org/372351
            } catch (AbstractMethodError ex) {
                // continue
            }
        }

        // if no reference context, we need to abort from the current compilation process
        if (referenceContext == null) {
            if ((severity & 1) != 0) { // non reportable error is fatal
                IProblem problem = this.createProblem(problemId, problemArguments, messageArguments, severity, 0, 0, 0);
                throw new AbortCompilation(null, problem);
            } else {
                return; // ignore non reportable warning
            }
        }

        int[] lineEnds;
        int lineNumber = problemStartPosition >= 0
            ? Util.getLineNumber(problemStartPosition, lineEnds = unitResult.getLineSeparatorPositions(), 0,
                lineEnds.length - 1)
            : 0;
        int columnNumber = problemStartPosition >= 0
            ? Util.searchColumnNumber(unitResult.getLineSeparatorPositions(), lineNumber, problemStartPosition)
            : 0;
        IProblem problem = this.createProblem(problemId, problemArguments, messageArguments, severity,
            problemStartPosition, problemEndPosition, lineNumber);

        if (problem == null)
            return; // problem couldn't be created, ignore

        switch (severity & 1) {
            case 1:
                record(problem, unitResult, referenceContext, mandatory);
                if ((severity & 128) != 0) {
                    // don't abort or tag as error if the error is suppressed
                    if (!referenceContext.hasErrors() && !mandatory && this.options.suppressOptionalErrors) {
                        CompilationUnitDeclaration unitDecl = referenceContext.getCompilationUnitDeclaration();
                        if (unitDecl != null && unitDecl.isSuppressed()) {
                            return;
                        }
                    }
                    referenceContext.tagAsHavingErrors();
                    // should abort ?
                    int abortLevel;
                    if ((abortLevel = this.policy.stopOnFirstError() ? 2 : severity & 30) != 0) {
                        referenceContext.abort(abortLevel, problem);
                    }
                }
                break;

            case 0:
                record(problem, unitResult, referenceContext, false);
                break;
        }
    }

    /**
     * Standard problem handling API, the actual severity (warning/error/ignore) is deducted from the problem ID and the
     * current compiler options.
     */
    public void handle(int problemId, String[] problemArguments, String[] messageArguments, int problemStartPosition,
        int problemEndPosition, ReferenceContext referenceContext, CompilationResult unitResult) {
        this.handle(problemId, problemArguments, // no message elaboration
            messageArguments, computeSeverity(problemId), // severity inferred using the ID
            problemStartPosition, problemEndPosition, referenceContext, unitResult);
    }

    public void record(IProblem problem, CompilationResult unitResult, ReferenceContext referenceContext,
        boolean mandatoryError) {
        unitResult.record(problem, referenceContext, mandatoryError);
    }

    public ReferenceContext referenceContext;

    private static Map<String, String> permittedRestrictedKeyWordMap;

    static {
        permittedRestrictedKeyWordMap = new HashMap<>();
        permittedRestrictedKeyWordMap.put("record", "RestrictedIdentifierrecord");
        permittedRestrictedKeyWordMap.put("sealed", "RestrictedIdentifiersealed");
        permittedRestrictedKeyWordMap.put("permits", "RestrictedIdentifierpermits");
        permittedRestrictedKeyWordMap.put("non-sealed", "non-sealed");
    }

    public static int getIrritant(int problemID) {
        switch (problemID) {

            case 16777381:
                return 8;

            case 268435844:
                return 1024;

            case 67108974:
                return 1;

            case 67109274:
                return 2;

            case 67109277:
            case 67109278:
                return 16384;

            case 67109276:
            case 16777221:
            case 67108967:
            case 134217861:
            case 33554505:
            case 8390037:
            case 67110273:
            case 16778621:
            case 67110270:
            case 67110271:
            case 33555840:
            case 8390038:
                return 4;

            case 67110268:
            case 16778616:
            case 67110265:
            case 67110266:
            case 33555835:
            case 8390039:
            case 67110278:
            case 16778626:
            case 67110275:
            case 67110276:
            case 33555845:
            case 8390040:
                return 1082130432;

            case 16778649:
                return 1610612744;

            case 536870973:
                return 16;

            case 536871193:
                return 1610612740;

            case 536870974:
                return 32;

            case 536870997:
                return 1074003968;

            case 536871063:
                return 64;

            case 33554622:
            case 33554623:
            case 67109056:
            case 67109057:
            case 67110854:
                return 128;

            case 536871173:
            case 536871177:
                return 256;

            case 536871352:
                return 512;

            case 536871353:
                return 536870928;

            case 603979893:
            case 570425420:
                return 2048;

            case 603979895:
            case 570425422:
            case 553648146:
                return 268435456;

            case 536871090:
                return 8192;

            case 603979910:
            case 603979894:
            case 570425421:
            case 553648135:
                return 32768;

            case 536871002:
            case 570425435:
            case 536871006:
            case 536871007:
                return 65536;

            case 570425436:
            case 570425437:
                return 131072;

            case 16777787:
            case 16777792:
            case 16777793:
            case 16777249:
                return 536871936;

            case 536871091:
                return 262144;

            case 536871092:
            case 553648316:
                return 524288;

            case 536871372:
                return 134217728;

            case 553648309:
            case 553648311:
                return 67108864;

            case 536871096:
                return 16777216;

            case 536871097:
            case 536871098:
                return 8388608;

            case 570425423:
                return 4194304;

            case 536871101:
                return 536870913;

            case 16777746:
            case 16777747:
            case 16777748:
            case 16777801:
            case 16777752:
            case 16777761:
            case 67109423:
            case 16777786:
            case 16777785:
            case 67109438:
            case 67109670:
                return 536870914;

            case 16777788:
                return 536936448;

            case 67109491:
            case 67109500:
                return 536872960;

            case 536871540:
            case 536871541:
            case 536871542:
                return 536879104;

            case 16777753:
                return 536870916;

            case 536871008:
                return 536870920;

            case 16777523:
                return 536870944;

            case 16777496:
                return 536887296;

            case 67109665:
            case 134218530:
                return 536870976;

            case 536871363:
            case 536871584:
            case 536871373:
                return 536871040;

            case 536871364:
            case 536871831:
            case 536871863:
            case 33555356:
            case 536871864:
            case 536871585:
            case 536871371:
                return 538968064;

            case 536871367:
            case 536871369:
            case 536871365:
            case 536871370:
            case 536871366:
            case 536871368:
            case 536871583:
            case 536871582:
            case 536871832:
            case 536871843:
            case 536871844:
            case 536871848:
            case 536871849:
            case 536871850:
            case 536871873:
            case 536871853:
            case 536871856:
            case 536871857:
            case 536871854:
            case 2099062:
                return 541065216;

            case 16778126:
            case 536871845:
            case 67109778:
            case 67109838:
            case 67109779:
            case 975:
            case 67109780:
            case 67109782:
            case 536871833:
            case 67109803:
            case 67109804:
            case 536871865:
            case 536871866:
            case 536871876:
            case 33555366:
            case 33555367:
            case 67109821:
            case 67109823:
            case 536871841:
            case 536871877:
            case 536871878:
            case 67109837:
            case 67109836:
            case 67109811:
                return 1073742848;

            case 536871874:
            case 1610613797:
            case 536871875:
                return 1610612752;

            case 969:
            case 970:
            case 976:
            case 16778195:
            case 977:
            case 978:
                return 1074266112;

            case 16778196:
            case 16778197:
                return 1074790400;

            case 67109781:
            case 67109810:
                return 1073872896;

            case 16778127:
                return 1073743872;

            case 16778128:
            case 536871898:
            case 536871867:
            case 536871868:
            case 67109822:
            case 67109824:
            case 536871879:
                return 1073745920;

            case 536871895:
            case 536871896:
                return 1342177280;

            case 67109786:
            case 536871837:
            case 536871855:
            case 536871838:
            case 536871839:
            case 536871840:
            case 536871974:
            case 536871975:
                return 1073750016;

            case 536871632:
            case 536871633:
                return 536871168;

            case 33555193:
            case 33556157:
            case 33555200:	// this one is further protected by
                              // CompilerOptions.reportMissingEnumCaseDespiteDefault
                return 536875008;

            case 536871679:
            case 536871678:
                return 1073774592;

            case 16777842:
                return 536871424;

            case 536871543:
                return 536903680;

            case 536871547:
                return 570425344;

            case 536871111:
                return 537001984;

            case -1610612266:
            case -1610612272:
            case -1610612260:
            case -1610612257:
            case -1610612253:
            case -1610610924:
            case -1610610923:
            case -1610610922:
            case -1610610920:
            case -1610610921:
            case -1610610919:
            case -1610612217:
            case -1610612267:
            case -1610612223:
            case -1610612252:
            case -1610612251:
            case -1610612249:
            case -1610612224:
            case -1610612221:
            case -1610612220:
            case -1610612218:
            case -1610612262:
            case -1610612263:
            case -1610612264:
            case -1610612269:
            case -1610612270:
            case -1610612255:
            case -1610612256:
            case -1610612258:
            case -1610610930:
            case -1610610935:
            case -1610610932:
            case -1610610933:
            case -1610610927:
            case -1610610928:
            case -1610610929:
            case -1610610934:
            case -1610612254:
            case -1610612219:
            case -1610612248:
            case -1610612246:
            case -1610612244:
            case -1610612242:
            case -1610612240:
            case -1610612238:
            case -1610612225:
            case -1610612235:
            case -1610612233:
            case -1610612231:
            case -1610612229:
            case -1610612234:
            case -1610612236:
            case -1610612228:
            case -1610612227:
            case -1610612226:
            case -1610612268:
            case -1610611886:
            case -1610611885:
            case -1610611884:
            case -1610611883:
            case -1610611882:
            case -1610611881:
            case -1610611880:
            case -1610611879:
            case -1610611878:
            case -1610611877:
            case -2130704982:
            case -1610612247:
            case -1610612243:
            case -1610612239:
            case -1610612232:
            case -1610612245:
            case -1610612241:
            case -1610612237:
            case -1610612230:
            case -1610612271:
            case -1610612273:
            case -1610612274:
            case -1610610926:
                return 33554432;

            case -1610612265:
            case -1610610931:
            case -1610612261:
            case -1610612259:
            case -1610610936:
                return 2097152;

            case -1610612250:
                return 1048576;

            case 536870971:
                return 537133056;

            case 536871106:
                return 537395200;

            case 67109280:
                return 537919488;

            case 67109443:
            case 67109524:
                return 553648128;

            case 16777547:
                return 603979776;

            case 536871123:
                return 671088640;

            case 67109281:
                return 805306368;

            case 16777548:
                return 1073741825;

            case 536871061:
                return 1073741826;

            case 536871362:
                return 1073741828;

            case 536871060:
                return 1073741832;

            case 603979897:
                return 1073741840;

            case 603979898:
                return 1073741856;

            case 536871799:
            case 536871800:
                return 1073741952;

            case 536872173:
            case 536872174:
            case 536871797:
            case 536871798:
                return 1073742080;

            case 536871801:
                return 1073742336;

            case 536872172:
            case 536872175:
            case 536872176:
            case 536872177:
            case 536872180:
                return 1610612737;

            case 536872178:
            case 536872179:
                return 1610612738;

            case 16778100:
                return 1073741888;

            case 536871825:
            case 536871842:
                return 1073758208;

            case 16777877:
                return 1073807360;

            case 1200:
                return 1075838976;

            case 1201:
                return 1077936128;

            case 8390065:
            case 8390066:
            case 8390067:
                return 1090519040;

            case 8390069:
                return 1107296256;

            case 4195408:
            case 4195412:
                return 1140850688;

            case 1102:
                return 1207959552;
        }
        return 0;
    }

    public void abortDueToInternalError(String errorMessage) {
        String[] arguments = new String[] { errorMessage };
        this.handle(0, arguments, arguments, 1 | 30 | 128, 0, 0);
    }

    public void tooRecentJavaVersion(String notSupportedVersion, String firstSupportedVersion) {
        String[] args = new String[] { notSupportedVersion, firstSupportedVersion };
        this.handle(4195414, args, args, 0, 0, 0);
    }

    public void abstractMethodNeedingNoBody(AbstractMethodDeclaration method) {
        this.handle(603979889, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, method.sourceStart, method.sourceEnd,
            method, method.compilationResult());
    }

    public void annotationTypeDeclarationCannotHaveConstructor(ConstructorDeclaration constructorDeclaration) {
        this.handle(1610613360, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, constructorDeclaration.sourceStart,
            constructorDeclaration.sourceEnd);
    }

    public void arrayConstantsOnlyInArrayInitializers(int sourceStart, int sourceEnd) {
        this.handle(1610612944, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void cannotReadSource(CompilationUnitDeclaration unit, AbortCompilationUnit abortException,
        boolean verbose) {
        String fileName = new String(unit.compilationResult.fileName);
        if (abortException.exception instanceof CharConversionException) {
            // specific encoding issue
            String encoding = abortException.encoding;
            if (encoding == null) {
                encoding = System.getProperty("file.encoding"); //$NON-NLS-1$
            }
            String[] arguments = new String[] { fileName, encoding };
            this.handle(536871613, arguments, arguments, 0, 0);
            return;
        }
        if (verbose) {
            System.err.println(Util.getStackTrace(abortException.exception));
        }
        String exceptionTrace
            = abortException.exception.getClass().getName() + ':' + abortException.exception.getMessage();
        String[] arguments = new String[] { fileName, exceptionTrace };
        this.handle(536871614, arguments, arguments, 0, 0);
    }

// https://bugs.eclipse.org/bugs/show_bug.cgi?id=391092
    public void illegalArrayOfUnionType(TypeReference typeReference) {
        this.handle(16777878, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, typeReference.sourceStart,
            typeReference.sourceEnd);
    }

    /*
     * Given the current configuration, answers which category the problem falls into: error (1), warning (0) or
     * ignore (256). When different from ignore, severity can be coupled with the optional flag (32) to indicate that
     * this problem is configurable through options
     */
    public int computeSeverity(int problemID) {
        switch (problemID) {
            // For compatibility with javac 8b111 for now.
            case 16778125:
            case 1610613402:
            case 1610613179:
            case 536872732:
            case 67109465:
            case 67109667:
            case 1610613477:
                return 0;

            case 16777538:
                return 1;

            /*
             * Javadoc tags resolved references errors
             */
            case -1610612262:
            case -1610612263:
            case -1610612264:
            case -1610612270:
            case -1610612255:
            case -1610612256:
            case -1610612258:
            case -1610612254:
            case -1610612219:
            case -1610612248:
            case -1610612246:
            case -1610612244:
            case -1610612242:
            case -1610612240:
            case -1610612238:
            case -1610612225:
            case -1610612235:
            case -1610612233:
            case -1610612231:
            case -1610612229:
            case -1610612234:
            case -1610612236:
            case -1610612228:
            case -1610612227:
            case -1610612226:
            case -1610612268:
            case -1610611886:
            case -1610611885:
            case -1610611884:
            case -1610611883:
            case -1610611882:
            case -1610611881:
            case -1610611880:
            case -1610611879:
            case -1610611878:
            case -1610611877:
                if (!this.options.reportInvalidJavadocTags) {
                    return 256;
                }
                break;

            /*
             * Javadoc invalid tags due to deprecated references
             */
            case -1610612245:
            case -1610612241:
            case -1610612237:
            case -1610612230:
                if (!(this.options.reportInvalidJavadocTags && this.options.reportInvalidJavadocTagsDeprecatedRef)) {
                    return 256;
                }
                break;

            /*
             * Javadoc invalid tags due to non-visible references
             */
            case -1610612247:
            case -1610612243:
            case -1610612239:
            case -1610612232:
            case -1610612271:
                if (!(this.options.reportInvalidJavadocTags && this.options.reportInvalidJavadocTagsNotVisibleRef)) {
                    return 256;
                }
                break;

            /*
             * Javadoc missing tag descriptions
             */
            case -1610612220:
                if ("no_tag".equals(this.options.reportMissingJavadocTagDescription)) {
                    return 256;
                }
                break;

            case -1610612273:
                if (!"all_standard_tags".equals(this.options.reportMissingJavadocTagDescription)) {
                    return 256;
                }
                break;
        }
        int irritant = getIrritant(problemID);
        if (irritant != 0) {
            if ((problemID & -2147483648) != 0 && !this.options.docCommentSupport)
                return 256;
            return this.options.getSeverity(irritant);
        }
        return 1 | 128;
    }

    public void defaultModifierIllegallySpecified(int sourceStart, int sourceEnd) {
        this.handle(67109922, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

// use this private API when the compilation unit result can be found through the
// reference context. Otherwise, use the other API taking a problem and a compilation result
// as arguments
    private void handle(int problemId, String[] problemArguments, String[] messageArguments, int problemStartPosition,
        int problemEndPosition) {
        this.handle(problemId, problemArguments, messageArguments, problemStartPosition, problemEndPosition,
            this.referenceContext, this.referenceContext == null ? null : this.referenceContext.compilationResult());
        this.referenceContext = null;
    }

// use this private API when the compilation unit result cannot be found through the
// reference context.
    private void handle(int problemId, String[] problemArguments, String[] messageArguments, int problemStartPosition,
        int problemEndPosition, CompilationResult unitResult) {
        this.handle(problemId, problemArguments, messageArguments, problemStartPosition, problemEndPosition,
            this.referenceContext, unitResult);
        this.referenceContext = null;
    }

// use this private API when the compilation unit result can be found through the
// reference context. Otherwise, use the other API taking a problem and a compilation result
// as arguments
    private void handle(int problemId, String[] problemArguments, String[] messageArguments, int severity,
        int problemStartPosition, int problemEndPosition) {
        this.handle(problemId, problemArguments, messageArguments, severity, problemStartPosition, problemEndPosition,
            this.referenceContext, this.referenceContext == null ? null : this.referenceContext.compilationResult());
        this.referenceContext = null;
    }

    public void illegalExtendedDimensions(AbstractVariableDeclaration aVarDecl) {
        this.handle(1610613536, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, aVarDecl.sourceStart,
            aVarDecl.sourceEnd);
    }

    public void illegalLocalTypeDeclaration(TypeDeclaration typeDeclaration) {
        if (isRecoveredName(typeDeclaration.name))
            return;

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
            this.handle(problemID, arguments, arguments, typeDeclaration.sourceStart, typeDeclaration.sourceEnd);
        }
    }

    public void illegalThis(Argument argument) {

        this.handle(1610613384, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, argument.sourceStart,
            argument.sourceEnd);
    }

    public void interfaceCannotHaveConstructors(ConstructorDeclaration constructor) {
        this.handle(1610612943, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, constructor.sourceStart,
            constructor.sourceEnd, constructor, constructor.compilationResult());
    }

    public void interfaceCannotHaveInitializers(char[] sourceName, FieldDeclaration fieldDecl) {
        String[] arguments = new String[] { new String(sourceName) };

        this.handle(16777516, arguments, arguments, fieldDecl.sourceStart, fieldDecl.sourceEnd);
    }

    public void invalidUnaryExpression(Expression expression) {
        this.handle(1610612942, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, expression.sourceStart,
            expression.sourceEnd);
    }

    public void invalidUsageOfTypeParametersForAnnotationDeclaration(TypeDeclaration annotationTypeDeclaration) {
        TypeParameter[] parameters = annotationTypeDeclaration.typeParameters;
        int length = parameters.length;
        this.handle(1610613334, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS,
            parameters[0].declarationSourceStart, parameters[length - 1].declarationSourceEnd);
    }

    public void invalidUsageOfTypeParametersForEnumDeclaration(TypeDeclaration annotationTypeDeclaration) {
        TypeParameter[] parameters = annotationTypeDeclaration.typeParameters;
        int length = parameters.length;
        this.handle(1610613335, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS,
            parameters[0].declarationSourceStart, parameters[length - 1].declarationSourceEnd);
    }

    public void misplacedTypeAnnotations(Annotation first, Annotation last) {
        this.handle(1610613375, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, first.sourceStart, last.sourceEnd);
    }

    private boolean isIdentifier(TerminalToken token) {
        return token == TerminalToken.TokenNameIdentifier;
    }

    private boolean isLiteral(TerminalToken token) {
        return Scanner.isLiteral(token);
    }

    private boolean isRecoveredName(char[] simpleName) {
        return simpleName == RecoveryScanner.FAKE_IDENTIFIER;
    }

    public void javadocDuplicatedReturnTag(int sourceStart, int sourceEnd) {
        this.handle(-1610612260, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidMemberTypeQualification(int sourceStart, int sourceEnd) {
        if (javadocVisibility(this.options.reportInvalidJavadocTagsVisibility, (-1))) {
            this.handle(-1610612270, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
        }
    }

    public void javadocInvalidParamTagName(int sourceStart, int sourceEnd) {
        this.handle(-1610612217, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidParamTypeParameter(int sourceStart, int sourceEnd) {
        this.handle(-1610612267, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidProvidesClass(int sourceStart, int sourceEnd) {
        this.handle(-1610610927, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidReference(int sourceStart, int sourceEnd) {
        this.handle(-1610612253, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidSnippet(int sourceStart, int sourceEnd) {
        this.handle(-1610610924, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidSnippetMissingColon(int sourceStart, int sourceEnd) {
        this.handle(-1610610923, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidSnippetContentNewLine(int sourceStart, int sourceEnd) {
        this.handle(-1610610922, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidSnippetRegionNotClosed(int sourceStart, int sourceEnd) {
        this.handle(-1610610921, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidSnippetRegexSubstringTogether(int sourceStart, int sourceEnd) {
        this.handle(-1610610920, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidSnippetDuplicateRegions(int sourceStart, int sourceEnd) {
        this.handle(-1610610919, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    /**
     * Report an invalid reference that does not conform to the href syntax.
     */
    public void javadocInvalidSeeHref(int sourceStart, int sourceEnd) {
        this.handle(-1610612252, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidSeeReferenceArgs(int sourceStart, int sourceEnd) {
        this.handle(-1610612251, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    /**
     * Report a problem on an invalid URL reference.
     */
    public void javadocInvalidSeeUrlReference(int sourceStart, int sourceEnd) {
        this.handle(-1610612274, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidTag(int sourceStart, int sourceEnd) {
        this.handle(-1610612249, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidThrowsClass(int sourceStart, int sourceEnd) {
        this.handle(-1610612257, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidUsesClass(int sourceStart, int sourceEnd) {
        this.handle(-1610610932, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocInvalidValueReference(int sourceStart, int sourceEnd, int modifiers) {
        if (javadocVisibility(this.options.reportInvalidJavadocTagsVisibility, modifiers))
            this.handle(-1610612219, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocMalformedSeeReference(int sourceStart, int sourceEnd) {
        this.handle(-1610612223, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocMissingHashCharacter(int sourceStart, int sourceEnd, String ref) {
        int severity = computeSeverity(-1610612221);
        if (severity == 256)
            return;
        String[] arguments = new String[] { ref };
        this.handle(-1610612221, arguments, arguments, severity, sourceStart, sourceEnd);
    }

    public void javadocMissingIdentifier(int sourceStart, int sourceEnd, int modifiers) {
        if (javadocVisibility(this.options.reportInvalidJavadocTagsVisibility, modifiers))
            this.handle(-1610612269, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocMissingParamName(int sourceStart, int sourceEnd, int modifiers) {
        if (javadocVisibility(this.options.reportInvalidJavadocTagsVisibility, modifiers))
            this.handle(-1610612264, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocMissingProvidesClassName(int sourceStart, int sourceEnd, int modifiers) {
        if (javadocVisibility(this.options.reportInvalidJavadocTagsVisibility, modifiers)) {
            this.handle(-1610610929, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
        }
    }

    public void javadocMissingReference(int sourceStart, int sourceEnd, int modifiers) {
        if (javadocVisibility(this.options.reportInvalidJavadocTagsVisibility, modifiers))
            this.handle(-1610612254, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocMissingTagDescription(char[] tokenName, int sourceStart, int sourceEnd, int modifiers) {
        int severity = computeSeverity(-1610612273);
        if (severity == 256)
            return;
        if (javadocVisibility(this.options.reportInvalidJavadocTagsVisibility, modifiers)) {
            String[] arguments = new String[] { new String(tokenName) };
            // use the empty return tag problem for all identified tags
            this.handle(-1610612220, arguments, arguments, sourceStart, sourceEnd);
        }
    }

    public void javadocMissingTagDescriptionAfterReference(int sourceStart, int sourceEnd, int modifiers) {
        int severity = computeSeverity(-1610612273);
        if (severity == 256)
            return;
        if (javadocVisibility(this.options.reportInvalidJavadocTagsVisibility, modifiers)) {
            this.handle(-1610612273, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, severity, sourceStart,
                sourceEnd);
        }
    }

    public void javadocMissingThrowsClassName(int sourceStart, int sourceEnd, int modifiers) {
        if (javadocVisibility(this.options.reportInvalidJavadocTagsVisibility, modifiers)) {
            this.handle(-1610612258, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
        }
    }

    public void javadocMissingUsesClassName(int sourceStart, int sourceEnd, int modifiers) {
        if (javadocVisibility(this.options.reportInvalidJavadocTagsVisibility, modifiers)) {
            this.handle(-1610610934, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
        }
    }

    public void javadocUnexpectedTag(int sourceStart, int sourceEnd) {
        this.handle(-1610612266, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocUnexpectedText(int sourceStart, int sourceEnd) {
        this.handle(-1610612218, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void javadocUnterminatedInlineTag(int sourceStart, int sourceEnd) {
        this.handle(-1610612224, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    private boolean javadocVisibility(int visibility, int modifiers) {
        if (modifiers < 0)
            return true;
        switch (modifiers & 7) {
            case 1:
                return true;

            case 4:
                return (visibility != 1);

            case 0:
                return (visibility == 0 || visibility == 2);

            case 2:
                return (visibility == 2);
        }
        return true;
    }

    public void parseErrorDeleteToken(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String errorTokenName) {
        syntaxError(1610612968, start, end, currentKind, errorTokenSource, errorTokenName, null);
    }

    public void parseErrorDeleteTokens(int start, int end) {
        this.handle(1610612969, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, start, end);
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
        this.handle(1610612976, arguments, arguments, start, end);
    }

    public void parseErrorInsertToCompletePhrase(int start, int end, String inserted) {
        String[] arguments = new String[] { inserted };
        this.handle(1610612978, arguments, arguments, start, end);
    }

    public void parseErrorInsertToCompleteScope(int start, int end, String inserted) {
        String[] arguments = new String[] { inserted };
        this.handle(1610612977, arguments, arguments, start, end);
    }

    public void parseErrorInvalidToken(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String errorTokenName, String expectedToken) {
        syntaxError(1610612971, start, end, currentKind, errorTokenSource, errorTokenName, expectedToken);
    }

    public void parseErrorMergeTokens(int start, int end, String expectedToken) {
        String[] arguments = new String[] { expectedToken };
        this.handle(1610612970, arguments, arguments, start, end);
    }

    public void parseErrorMisplacedConstruct(int start, int end) {
        this.handle(1610612972, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, start, end);
    }

    public void parseErrorNoSuggestion(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String errorTokenName) {
        syntaxError(1610612941, start, end, currentKind, errorTokenSource, errorTokenName, null);
    }

    public void parseErrorNoSuggestionForTokens(int start, int end) {
        this.handle(1610612974, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, start, end);
    }

    public void parseErrorReplaceToken(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String errorTokenName, String expectedToken) {
        handleSyntaxError(start, end, currentKind, errorTokenSource, errorTokenName, expectedToken);
    }

    public void parseErrorReplaceTokens(int start, int end, String expectedToken) {
        String[] arguments = new String[] { expectedToken };
        this.handle(1610612973, arguments, arguments, start, end);
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
        this.handle(1610612975, arguments, arguments, start, end);
    }

    public void scannerError(Parser parser, String errorTokenName) {
        Scanner scanner = parser.scanner;

        int flag = 1610612941;
        int startPos = scanner.startPosition;
        int endPos = scanner.currentPosition - 1;

        // special treatment for recognized errors....
        if (errorTokenName.equals("End_Of_Source"))
            flag = 1610612986;
        else if (errorTokenName.equals("Invalid_Hexa_Literal"))
            flag = 1610612987;
        else if (errorTokenName.equals("Illegal_Hexa_Literal"))
            flag = 1610613006;
        else if (errorTokenName.equals("Invalid_Octal_Literal"))
            flag = 1610612988;
        else if (errorTokenName.equals("Invalid_Character_Constant"))
            flag = 1610612989;
        else if (errorTokenName.equals("Invalid_Escape"))
            flag = 1610612990;
        else if (errorTokenName.equals("Invalid_Unicode_Escape")) {
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
        } else if (errorTokenName.equals("Invalid_Low_Surrogate")) {
            flag = 1610612999;
        } else if (errorTokenName.equals("Invalid_High_Surrogate")) {
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
        } else if (errorTokenName.equals("Invalid_Float_Literal"))
            flag = 1610612993;
        else if (errorTokenName.equals("Unterminated_String"))
            flag = 1610612995;
        else if (errorTokenName.equals("Unterminated_Text_Block"))
            flag = 2097424;
        else if (errorTokenName.equals("Unterminated_Comment"))
            flag = 1610612996;
        else if (errorTokenName.equals("Invalid_Char_In_String"))
            flag = 1610612995;
        else if (errorTokenName.equals("Invalid_Digit"))
            flag = 1610612998;
        else if (errorTokenName.equals("Invalid_Binary_Literal"))
            flag = 1610613002;
        else if (errorTokenName.equals("Invalid_Underscore"))
            flag = 1610613004;

        String[] arguments = flag == 1610612941 ? new String[] { errorTokenName } : CharOperation.NO_STRINGS;
        this.handle(flag, arguments, arguments,
            // this is the current -invalid- token position
            startPos, endPos, parser.compilationUnit.compilationResult);
    }

    public void superfluousSemicolon(int sourceStart, int sourceEnd) {
        this.handle(536871092, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    private boolean handleSyntaxErrorOnNewTokens(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String expectedToken) {
        if (isIdentifier(currentKind)) {
            if (expectedToken != null) {
                String tokenName = new String(errorTokenSource);
                String restrictedIdentifier = permittedRestrictedKeyWordMap.get(tokenName);
                if (restrictedIdentifier == null || !restrictedIdentifier.equals(expectedToken)) {
                    return false;
                }
            }
            return validateRestrictedKeywords(errorTokenSource, start, end);
        }
        return false;
    }

    private void handleSyntaxError(int start, int end, TerminalToken currentKind, char[] errorTokenSource,
        String errorTokenName, String expectedToken) {
        if (!handleSyntaxErrorOnNewTokens(start, end, currentKind, errorTokenSource, expectedToken)) {
            syntaxError(1610612940, start, end, currentKind, errorTokenSource, errorTokenName, expectedToken);
        }
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
        this.handle(id, arguments, arguments, startPosition, endPosition);
    }

    private String replaceIfSynthetic(String token) {
        /*
         * Java 8 grammar changes use some synthetic tokens to make the grammar LALR(1). These tokens should not be
         * exposed in messages as it would make no sense to the programmer whatsoever. Replace such artificial tokens
         * with some "suitable" alternative. At the moment, there are two synthetic tokens that need such massaging viz
         * : "BeginLambda" and "BeginTypeArguments". There is a third synthetic token "ElidedSemicolonAndRightBrace"
         * that we don't expect to show up in messages since it is manufactured by the parser automatically.
         */
        if (token.equals("CaseArrow")) //$NON-NLS-1$
            return "->"; //$NON-NLS-1$
        if (token.equals("BeginTypeArguments")) //$NON-NLS-1$
            return "."; //$NON-NLS-1$
        if (token.equals("BeginLambda")) //$NON-NLS-1$
            return "("; //$NON-NLS-1$
        if (token.equals("RestrictedIdentifierYield")) //$NON-NLS-1$
            return "yield"; //$NON-NLS-1$
        if (token.equals("RestrictedIdentifierrecord"))
            return "record";
        if (token.equals("RestrictedIdentifiersealed"))
            return "sealed";
        if (token.equals("RestrictedIdentifierpermits"))
            return "permits";
        return token;
    }

    public void task(String tag, String message, String priority, int start, int end) {
        this.handle(536871362,
            new String[] { tag, message, priority/* secret argument that is not surfaced in getMessage() */ },
            new String[] { tag, message, priority/* secret argument that is not surfaced in getMessage() */ }, start,
            end);
    }

//Returns true if the problem is handled and reported (only errors considered and not warnings)
    private boolean validateRestrictedKeywords(char[] name, int start, int end) {
        boolean isPreviewEnabled = this.options.enablePreviewFeatures;
        for (JavaFeature feature : JavaFeature.values()) {
            char[][] restrictedKeywords = feature.getRestrictedKeywords();
            for (char[] k : restrictedKeywords) {
                if (CharOperation.equals(name, k)) {
                    return validateJavaFeatureSupport(feature, start, end);
                }
            }
        }
        return false;
    }

// Returns true if the problem is handled and reported (only errors considered and not warnings)
    public boolean validateJavaFeatureSupport(JavaFeature feature, int sourceStart, int sourceEnd) {
        boolean versionInRange = feature.getCompliance() <= this.options.sourceLevel;
        String version = CompilerOptions.versionFromJdkLevel(feature.getCompliance());
        int problemId = -1;
        if (feature.isPreview()) {
            if (!versionInRange) {
                problemId = 4195409;
            } else if (!this.options.enablePreviewFeatures) {
                problemId = 4195407;
            } else {
                if (this.options.isAnyEnabled())
                    problemId = 4195408;
            }
        } else if (!versionInRange) {
            problemId = 4195411;
        }
        if (problemId > -1) {
            String[] args = new String[] { feature.getName(), version };
            this.handle(problemId, args, args, sourceStart, sourceEnd);
            return true;
        }
        return false;
    }

    public void useAssertAsAnIdentifier(int sourceStart, int sourceEnd) {
        this.handle(536871352, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void useEnumAsAnIdentifier(int sourceStart, int sourceEnd) {
        this.handle(536871353, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void illegalUseOfUnderscoreAsAnIdentifier(int sourceStart, int sourceEnd, boolean reportError) {
        int problemId = (reportError) ? 1610613181 : 1610613179;
        problemId = problemId;
        this.handle(problemId, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void varLocalCannotBeArray(ASTNode varDecl) {
        this.handle(1073743325, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, varDecl.sourceStart,
            varDecl.sourceEnd);
    }

    public void varCannotBeUsedWithTypeArguments(ASTNode astNode) {
        this.handle(1073743337, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, astNode.sourceStart,
            astNode.sourceEnd);
    }

    public void autoManagedVariableResourcesNotBelow9(Expression resource) {
        this.handle(1610614087, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, resource.sourceStart,
            resource.sourceEnd);
    }

    public void illegalModifiersForElidedType(Argument argument) {
        String[] arg = new String[] { new String(argument.name) };
        this.handle(536871913, arg, arg, argument.declarationSourceStart, argument.declarationSourceEnd);
    }

    public void illegalModifiers(int modifierSourceStart, int modifiersSourceEnd) {
        this.handle(536871914, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, modifierSourceStart,
            modifiersSourceEnd);
    }

    public void multiConstantCaseLabelsNotSupported(ASTNode statement) {
        this.handle(1073743543, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, statement.sourceStart,
            statement.sourceEnd);
    }

    public void arrowInCaseStatementsNotSupported(ASTNode statement) {
        this.handle(1073743544, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, statement.sourceStart,
            statement.sourceEnd);
    }

    public void switchExpressionsNotSupported(ASTNode statement) {
        this.handle(1073743545, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, statement.sourceStart,
            statement.sourceEnd);
    }

    public void compactConstructorsOnlyInRecords(AbstractMethodDeclaration ccd) {
        this.handle(16778985, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, ccd.sourceStart, ccd.sourceEnd);
    }

    public void illegalExtendedDimensionsForRecordComponent(AbstractVariableDeclaration aVarDecl) {
        this.handle(1610614499, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, aVarDecl.sourceStart,
            aVarDecl.sourceEnd);
    }

    public void StrictfpNotRequired(int sourceStart, int sourceEnd) {
        this.handle(1610613477, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
    }

    public void illegalCaseConstantCombination(Expression element) {
        this.handle(2099053, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, element.sourceStart,
            element.sourceEnd);
    }

    public void dimensionsIllegalOnRecordPattern(int sourceStart, int sourceEnd) {
        this.handle(536872697, CharOperation.NO_STRINGS, CharOperation.NO_STRINGS, sourceStart, sourceEnd);
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
