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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.impl;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler.CharOperation;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.util.Util;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.Map;

public class CompilerOptions {

    // resource leak analysis:
    static final char[][] DEFAULT_OWNING_ANNOTATION_NAME
        = CharOperation.splitOn('.', "org.eclipse.jdt.annotation.Owning".toCharArray()); //$NON-NLS-1$
    static final char[][] DEFAULT_NOTOWNING_ANNOTATION_NAME
        = CharOperation.splitOn('.', "org.eclipse.jdt.annotation.NotOwning".toCharArray()); //$NON-NLS-1$

    // defaults for the above:
    static final char[][] DEFAULT_NULLABLE_ANNOTATION_NAME
        = CharOperation.splitOn('.', "org.eclipse.jdt.annotation.Nullable".toCharArray()); //$NON-NLS-1$
    static final char[][] DEFAULT_NONNULL_ANNOTATION_NAME
        = CharOperation.splitOn('.', "org.eclipse.jdt.annotation.NonNull".toCharArray()); //$NON-NLS-1$
    static final char[][] DEFAULT_NONNULLBYDEFAULT_ANNOTATION_NAME
        = CharOperation.splitOn('.', "org.eclipse.jdt.annotation.NonNullByDefault".toCharArray()); //$NON-NLS-1$

    private static final String[] NO_STRINGS = new String[0];

    // Severity level for handlers
    /**
     * Defaults defined at {@link IrritantSet#COMPILER_DEFAULT_ERRORS}
     *
     * @see #resetDefaults()
     */
    protected IrritantSet errorThreshold;
    /**
     * Defaults defined at {@link IrritantSet#COMPILER_DEFAULT_WARNINGS}
     *
     * @see #resetDefaults()
     */
    protected IrritantSet warningThreshold;
    /**
     * Defaults defined at {@link IrritantSet#COMPILER_DEFAULT_INFOS}
     *
     * @see #resetDefaults()
     */
    protected IrritantSet infoThreshold;

    /** Classfile debug information, may contain source file name, line numbers, local variable tables, etc... */
    public int produceDebugAttributes;
    /** Classfile method parameters information as per JEP 118... */
    public boolean produceMethodParameters;
    /** Indicates whether generic signature should be generated for lambda expressions */
    public boolean generateGenericSignatureForLambdaExpressions;
    /** Compliance level for the compiler, refers to a JDK version, e.g. <code>3407872L</code> for JDK 1.8 */
    public long complianceLevel;
    /** Java source level, refers to a JDK version, e.g. <code>3407872L</code> for JDK 1.8 */
    public long sourceLevel;
    /**
     * Use <code>-release</code> setting to pass compliance version and enable checking for availability of system APIs
     * for the compliance version.
     */
    public boolean release;
    /**
     * Initially requested source version, not necessarily consistent with {@link #sourceLevel} as sourceLevel forcibly
     * contain a version that is compatible with ECJ. <p>Consumers are free to use {@code sourceLevel} or this
     * {@code requestedSourceVersion} value to decide of their behavior.</p> <p>May be {@code null}.</p>
     */
    public String requestedSourceVersion;
    /** VM target level, refers to a JDK version, e.g. <code>3407872L</code> for JDK 1.8 */
    public long targetJDK;
    /** Source encoding format */
    public String defaultEncoding;
    /** Compiler trace verbosity */
    public boolean verbose;

    /** Indicates if unused/optimizable local variables need to be preserved (debugging purpose) */
    public boolean preserveAllLocalVariables;
    /** Indicates whether literal expressions are inlined at parse-time or not */
    public boolean parseLiteralExpressionsAsConstants;
    /** Max problems per compilation unit */
    public int maxProblemsPerUnit;
    /** Tags used to recognize tasks in comments */
    public char[][] taskTags;
    /** Respective priorities of recognized task tags */
    public char[][] taskPriorities;
    /** Indicate whether tag detection is case sensitive or not */
    public boolean isTaskCaseSensitive;
    /** Specify whether deprecation inside deprecated code is to be reported */
    public boolean reportDeprecationInsideDeprecatedCode;
    /** Specify whether override of deprecated method is to be reported */
    public boolean reportDeprecationWhenOverridingDeprecatedMethod;
    /** Specify if should report unused parameter when implementing abstract method */
    public boolean reportUnusedParameterWhenImplementingAbstract;
    /** Specify if should report unused parameter when overriding concrete method */
    public boolean reportUnusedParameterWhenOverridingConcrete;
    /** Specify if should report documented unused parameter (in javadoc) */
    public boolean reportUnusedParameterIncludeDocCommentReference;
    /** Specify if should reported unused declared thrown exception when overriding method */
    public boolean reportUnusedDeclaredThrownExceptionWhenOverriding;
    /** Specify if should reported unused declared thrown exception when documented in javadoc */
    public boolean reportUnusedDeclaredThrownExceptionIncludeDocCommentReference;
    /** Specify if should reported unused declared thrown exception when Exception or Throwable */
    public boolean reportUnusedDeclaredThrownExceptionExemptExceptionAndThrowable;
    /** Specify whether should report constructor/setter method parameter hiding */
    public boolean reportSpecialParameterHidingField;
    /** Specify whether trivial deadcode pattern is to be reported (e.g. if (DEBUG) ...) */
    public boolean reportDeadCodeInTrivialIfStatement;
    /** Master flag controlling whether doc comment should be processed */
    public boolean docCommentSupport;
    /** Specify if invalid javadoc shall be reported */
    public boolean reportInvalidJavadocTags;
    /** Only report invalid javadoc above a given level of visibility of associated construct */
    public int reportInvalidJavadocTagsVisibility;
    /** Specify if deprecated javadoc ref is allowed */
    public boolean reportInvalidJavadocTagsDeprecatedRef;
    /** Specify if non visible javadoc ref is allowed */
    public boolean reportInvalidJavadocTagsNotVisibleRef;
    /** Specify when to report missing javadoc tag description */
    public String reportMissingJavadocTagDescription;
    /** Only report missing javadoc tags above a given level of visibility of associated construct */
    public int reportMissingJavadocTagsVisibility;
    /** Specify if need to flag missing javadoc tags for overriding method */
    public boolean reportMissingJavadocTagsOverriding;
    /** Specify if need to flag missing javadoc tags for method type parameters (java 1.5 and above) */
    public boolean reportMissingJavadocTagsMethodTypeParameters;
    /** Only report missing javadoc comment above a given level of visibility of associated construct */
    public int reportMissingJavadocCommentsVisibility;
    /** Specify if need to flag missing javadoc comment for overriding method */
    public boolean reportMissingJavadocCommentsOverriding;
    /** Indicate if @SuppressWarnings annotations are activated */
    public boolean suppressWarnings;
    /** Indicate if @SuppressWarnings annotations should also suppress optional errors */
    public boolean suppressOptionalErrors;
    /** Specify if should treat optional error as fatal or just like warning */
    public boolean treatOptionalErrorAsFatal;
    /** Specify if parser should perform structural recovery in methods */
    public boolean performMethodsFullRecovery;
    /** Specify if parser perform statements recovery */
    public boolean performStatementsRecovery;
    /** Control whether annotation processing is enabled */
    public boolean processAnnotations;
    /** Store annotations */
    public boolean storeAnnotations;
    /**
     * Specify if need to report missing override annotation for a method implementing an interface method (java 1.6 and
     * above)
     */
    public boolean reportMissingOverrideAnnotationForInterfaceMethodImplementation;
    /** Indicate if annotation processing generates classfiles */
    public boolean generateClassFiles;
    /** Indicate if method bodies should be ignored */
    public boolean ignoreMethodBodies;
    /** Raise null related warnings for variables tainted inside an assert statement (java 1.4 and above) */
    public boolean includeNullInfoFromAsserts;
    /** Controls whether forced generic type problems get reported */
    public boolean reportUnavoidableGenericTypeProblems;
    /**
     * Indicates that the 'ignore optional problems from source folder' option need to be ignored See
     * https://bugs.eclipse.org/bugs/show_bug.cgi?id=372377
     */
    public boolean ignoreSourceFolderWarningOption;

    // === Support for Null Annotations: ===
    /** Master switch for null analysis based on annotations: */
    public boolean isAnnotationBasedNullAnalysisEnabled;
    /** Fully qualified name of annotation to use as marker for nullable types. */
    public char[][] nullableAnnotationName;
    /** Fully qualified name of annotation to use as marker for nonnull types. */
    public char[][] nonNullAnnotationName;
    /** Fully qualified name of annotation to use as marker for default nonnull. */
    public char[][] nonNullByDefaultAnnotationName;
    /** Fully qualified names of secondary annotations to use as marker for nullable types. */
    public String[] nullableAnnotationSecondaryNames = NO_STRINGS;
    /** Fully qualified names of secondary annotations to use as marker for nonnull types. */
    public String[] nonNullAnnotationSecondaryNames = NO_STRINGS;
    /** Fully qualified names of secondary annotations to use as marker for default nonnull. */
    public String[] nonNullByDefaultAnnotationSecondaryNames = NO_STRINGS;

    /** Should an owning-annotation be evaluated for improved analysis of resource leaks? */
    public boolean isAnnotationBasedResourceAnalysisEnabled;
    /** Name of the annotation which the resource leak analysis will use as 'owning' */
    public char[][] owningAnnotationName;
    /** Name of the annotation which the resource leak analysis will use as 'not-owning' */
    public char[][] notOwningAnnotationName;

    /** Should missing enum cases be reported even if a default case exists in the same switch? */
    public boolean reportMissingEnumCaseDespiteDefault;

    /**
     * When checking for unlikely argument types of of Map.get() et al, perform strict analysis against the expected
     * type
     */
    public boolean reportUnlikelyCollectionMethodArgumentTypeStrict;

    /** Should null annotations of overridden methods be inherited? */
    public boolean inheritNullAnnotations;

    /** Should immediate null-check for fields be considered during null analysis (syntactical match)? */
    public boolean enableSyntacticNullAnalysisForFields;

    public boolean complainOnUninternedIdentityComparison;
    public boolean emulateJavacBug8031744 = true;

    /** Master flag to enabled/disable all preview features */
    public boolean enablePreviewFeatures;

    /**
     * Should the compiler ignore the unnamed module when a package is defined in both a named module and the unnamed
     * module?
     */
    public boolean ignoreUnnamedModuleForSplitPackage;

    /** Should the compiler use the StringConcatFactory for String concatenation expressions in the produced binary */
    public boolean useStringConcatFactory;

    /** Should the compiler validate VM's (simulated) operand stack during code generation? */
    public boolean validateOperandStack;

    /**
     * Initializing the compiler options with defaults
     */
    public CompilerOptions() {
        this(null); // use default options
    }

    /**
     * Initializing the compiler options with external settings
     */
    public CompilerOptions(Map<String, String> settings) {
        resetDefaults();
        if (settings != null) {
            set(settings);
        }
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

    public static long versionToJdkLevel(String versionID) {
        String version = versionID;
        // verification is optimized for all versions with same length and same "1." prefix
        if (version != null && version.length() > 0) {
            if (version.length() >= 3 && version.charAt(0) == '1' && version.charAt(1) == '.') {
                switch (version.charAt(2)) {
                    case '1':
                        return 2949123L;

                    case '2':
                        return 3014656L;

                    case '3':
                        return 3080192L;

                    case '4':
                        return 3145728L;

                    case '5':
                        return 3211264L;

                    case '6':
                        return 3276800L;

                    case '7':
                        return 3342336L;

                    case '8':
                        return 3407872L;

                    default:
                        return 0; // unknown
                }
            } else {
                try {
                    int index = version.indexOf('.');
                    if (index != -1) {
                        version = version.substring(0, index);
                    } else {
                        index = version.indexOf('-');
                        if (index != -1)
                            version = version.substring(0, index);
                    }
                    int major = Integer.parseInt(version) + 44;
                    if (major > 70) {
                        major = 70; // unknown
                    }
                    return ((long) major << 16) + 0;
                } catch (NumberFormatException e) {
                    // do nothing and return 0 at the end
                }
            }
        }
        if ("jsr14".equals(versionID)) {
            return 3145728L;
        }
        if ("cldc1.1".equals(versionID)) {
            return 2949124L;
        }
        return 0; // unknown
    }

    public static Map<String, String> getJavaCoreDefaultOptions() {
        Map<String, String> options = new CompilerOptions().getMap();
        options.put("org.eclipse.jdt.core.compiler.debug.localVariable", "generate");
        options.put("org.eclipse.jdt.core.compiler.codegen.unusedLocal", "preserve");
        options.put("org.eclipse.jdt.core.compiler.taskTags", "TODO,FIXME,XXX");
        options.put("org.eclipse.jdt.core.compiler.taskPriorities", "NORMAL,HIGH,NORMAL");
        options.put("org.eclipse.jdt.core.compiler.taskCaseSensitive", "enabled");
        options.put("org.eclipse.jdt.core.compiler.doc.comment.support", "enabled");
        options.put("org.eclipse.jdt.core.compiler.problem.forbiddenReference", "error");
        return options;
    }

    public Map<String, String> getMap() {
        Map<String, String> optionsMap = new HashMap<>(30);
        optionsMap.put("org.eclipse.jdt.core.compiler.debug.localVariable",
            (this.produceDebugAttributes & 4) != 0 ? "generate" : "do not generate");
        optionsMap.put("org.eclipse.jdt.core.compiler.debug.lineNumber",
            (this.produceDebugAttributes & 2) != 0 ? "generate" : "do not generate");
        optionsMap.put("org.eclipse.jdt.core.compiler.debug.sourceFile",
            (this.produceDebugAttributes & 1) != 0 ? "generate" : "do not generate");
        optionsMap.put("org.eclipse.jdt.core.compiler.codegen.methodParameters",
            this.produceMethodParameters ? "generate" : "do not generate");
        optionsMap.put("org.eclipse.jdt.core.compiler.codegen.lambda.genericSignature",
            this.generateGenericSignatureForLambdaExpressions ? "generate" : "do not generate");
        optionsMap.put("org.eclipse.jdt.core.compiler.codegen.unusedLocal",
            this.preserveAllLocalVariables ? "preserve" : "optimize out");
        optionsMap.put("org.eclipse.jdt.core.compiler.doc.comment.support",
            this.docCommentSupport ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.methodWithConstructorName", getSeverityString(1));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.overridingPackageDefaultMethod", getSeverityString(2));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.deprecation", getSeverityString(4));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.terminalDeprecation", getSeverityString(1082130432));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.deprecationInDeprecatedCode",
            this.reportDeprecationInsideDeprecatedCode ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.deprecationWhenOverridingDeprecatedMethod",
            this.reportDeprecationWhenOverridingDeprecatedMethod ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.memberOfDeprecatedTypeNotDeprecated",
            getSeverityString(1610612744));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.hiddenCatchBlock", getSeverityString(8));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedLocal", getSeverityString(16));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedLambdaParameter", getSeverityString(1610612740));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedParameter", getSeverityString(32));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedExceptionParameter", getSeverityString(1074003968));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedImport", getSeverityString(1024));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.syntheticAccessEmulation", getSeverityString(128));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.noEffectAssignment", getSeverityString(8192));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.nonExternalizedStringLiteral", getSeverityString(256));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.noImplicitStringConversion", getSeverityString(64));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.staticAccessReceiver", getSeverityString(2048));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.indirectStaticAccess", getSeverityString(268435456));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.incompatibleNonInheritedInterfaceMethod",
            getSeverityString(16384));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedPrivateMember", getSeverityString(32768));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.localVariableHiding", getSeverityString(65536));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.fieldHiding", getSeverityString(131072));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.typeParameterHiding", getSeverityString(536871936));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.possibleAccidentalBooleanAssignment",
            getSeverityString(262144));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.emptyStatement", getSeverityString(524288));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.assertIdentifier", "error");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.enumIdentifier", "error");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.undocumentedEmptyBlock", getSeverityString(134217728));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unnecessaryTypeCheck", getSeverityString(67108864));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unnecessaryElse", getSeverityString(536870913));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.autoboxing", getSeverityString(536871168));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.annotationSuperInterface", getSeverityString(536871424));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.incompleteEnumSwitch", getSeverityString(536875008));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingEnumCaseDespiteDefault",
            this.reportMissingEnumCaseDespiteDefault ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingDefaultCase", getSeverityString(1073774592));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.invalidJavadoc", getSeverityString(33554432));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.invalidJavadocTagsVisibility",
            getVisibilityString(this.reportInvalidJavadocTagsVisibility));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.invalidJavadocTags",
            this.reportInvalidJavadocTags ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.invalidJavadocTagsDeprecatedRef",
            this.reportInvalidJavadocTagsDeprecatedRef ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.invalidJavadocTagsNotVisibleRef",
            this.reportInvalidJavadocTagsNotVisibleRef ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingJavadocTags", getSeverityString(2097152));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingJavadocTagsVisibility",
            getVisibilityString(this.reportMissingJavadocTagsVisibility));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingJavadocTagsOverriding",
            this.reportMissingJavadocTagsOverriding ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingJavadocTagsMethodTypeParameters",
            this.reportMissingJavadocTagsMethodTypeParameters ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingJavadocComments", getSeverityString(1048576));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingJavadocTagDescription",
            this.reportMissingJavadocTagDescription);
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingJavadocCommentsVisibility",
            getVisibilityString(this.reportMissingJavadocCommentsVisibility));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingJavadocCommentsOverriding",
            this.reportMissingJavadocCommentsOverriding ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.finallyBlockNotCompletingNormally",
            getSeverityString(16777216));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedDeclaredThrownException",
            getSeverityString(8388608));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedDeclaredThrownExceptionWhenOverriding",
            this.reportUnusedDeclaredThrownExceptionWhenOverriding ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedDeclaredThrownExceptionIncludeDocCommentReference",
            this.reportUnusedDeclaredThrownExceptionIncludeDocCommentReference ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedDeclaredThrownExceptionExemptExceptionAndThrowable",
            this.reportUnusedDeclaredThrownExceptionExemptExceptionAndThrowable ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unqualifiedFieldAccess", getSeverityString(4194304));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unavoidableGenericTypeProblems",
            this.reportUnavoidableGenericTypeProblems ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.uncheckedTypeOperation", getSeverityString(536870914));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.rawTypeReference", getSeverityString(536936448));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.finalParameterBound", getSeverityString(536870916));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingSerialVersion", getSeverityString(536870920));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.forbiddenReference", getSeverityString(536870944));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.discouragedReference", getSeverityString(536887296));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.varargsArgumentNeedCast", getSeverityString(536870976));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingOverrideAnnotation", getSeverityString(536872960));
        optionsMap.put(
            "org.eclipse.jdt.core.compiler.problem.missingOverrideAnnotationForInterfaceMethodImplementation",
            this.reportMissingOverrideAnnotationForInterfaceMethodImplementation ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingDeprecatedAnnotation",
            getSeverityString(536879104));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedLabel", getSeverityString(537001984));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedTypeArgumentsForMethodInvocation",
            getSeverityString(553648128));
        optionsMap.put("org.eclipse.jdt.core.compiler.compliance", versionFromJdkLevel(this.complianceLevel));
        optionsMap.put("org.eclipse.jdt.core.compiler.release", this.release ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.source", versionFromJdkLevel(this.sourceLevel));
        optionsMap.put("org.eclipse.jdt.core.compiler.codegen.targetPlatform", versionFromJdkLevel(this.targetJDK));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.fatalOptionalError",
            this.treatOptionalErrorAsFatal ? "enabled" : "disabled");
        if (this.defaultEncoding != null) {
            optionsMap.put("org.eclipse.jdt.core.encoding", this.defaultEncoding);
        }
        optionsMap.put("org.eclipse.jdt.core.compiler.taskTags",
            this.taskTags == null ? Util.EMPTY_STRING : new String(CharOperation.concatWith(this.taskTags, ',')));
        optionsMap.put("org.eclipse.jdt.core.compiler.taskPriorities",
            this.taskPriorities == null
                ? Util.EMPTY_STRING
                : new String(CharOperation.concatWith(this.taskPriorities, ',')));
        optionsMap.put("org.eclipse.jdt.core.compiler.taskCaseSensitive",
            this.isTaskCaseSensitive ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedParameterWhenImplementingAbstract",
            this.reportUnusedParameterWhenImplementingAbstract ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedParameterWhenOverridingConcrete",
            this.reportUnusedParameterWhenOverridingConcrete ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedParameterIncludeDocCommentReference",
            this.reportUnusedParameterIncludeDocCommentReference ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.specialParameterHidingField",
            this.reportSpecialParameterHidingField ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.maxProblemPerUnit", String.valueOf(this.maxProblemsPerUnit));
        optionsMap.put("org.eclipse.jdt.core.compiler.codegen.shareCommonFinallyBlocks", "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.nullReference", getSeverityString(536871040));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.potentialNullReference", getSeverityString(538968064));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.redundantNullCheck", getSeverityString(541065216));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.suppressWarnings",
            this.suppressWarnings ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.suppressOptionalErrors",
            this.suppressOptionalErrors ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unhandledWarningToken", getSeverityString(536903680));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedWarningToken", getSeverityString(570425344));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.parameterAssignment", getSeverityString(537133056));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.fallthroughCase", getSeverityString(537395200));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.overridingMethodWithoutSuperInvocation",
            getSeverityString(537919488));
        optionsMap.put("org.eclipse.jdt.core.compiler.generateClassFiles",
            this.generateClassFiles ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.processAnnotations",
            this.processAnnotations ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.storeAnnotations",
            this.storeAnnotations ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.emulateJavacBug8031744",
            this.emulateJavacBug8031744 ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.redundantSuperinterface", getSeverityString(603979776));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.comparingIdentical", getSeverityString(671088640));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingSynchronizedOnInheritedMethod",
            getSeverityString(805306368));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.missingHashCodeMethod", getSeverityString(1073741825));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.deadCode", getSeverityString(1073741826));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.deadCodeInTrivialIfStatement",
            this.reportDeadCodeInTrivialIfStatement ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.tasks", getSeverityString(1073741828));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedObjectAllocation", getSeverityString(1073741832));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.includeNullInfoFromAsserts",
            this.includeNullInfoFromAsserts ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.reportMethodCanBeStatic", getSeverityString(1073741840));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.reportMethodCanBePotentiallyStatic",
            getSeverityString(1073741856));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.redundantSpecificationOfTypeArguments",
            getSeverityString(1073741888));

        // resource leak analysis:
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unclosedCloseable", getSeverityString(1073741952));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.potentiallyUnclosedCloseable",
            getSeverityString(1073742080));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.explicitlyClosedAutoCloseable",
            getSeverityString(1073742336));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.insufficientResourceAnalysis",
            getSeverityString(1610612737));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.incompatibleOwningContract",
            getSeverityString(1610612738));
        optionsMap.put("org.eclipse.jdt.core.compiler.annotation.resourceanalysis",
            this.isAnnotationBasedResourceAnalysisEnabled ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.annotation.owning",
            String.valueOf(CharOperation.concatWith(this.owningAnnotationName, '.')));
        optionsMap.put("org.eclipse.jdt.core.compiler.annotation.notowning",
            String.valueOf(CharOperation.concatWith(this.notOwningAnnotationName, '.')));

        // null analysis:
        optionsMap.put("org.eclipse.jdt.core.compiler.annotation.nullanalysis",
            this.isAnnotationBasedNullAnalysisEnabled ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.nullSpecViolation", getSeverityString(1073742848));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.nullAnnotationInferenceConflict",
            getSeverityString(1073743872));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.nullUncheckedConversion", getSeverityString(1073745920));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.redundantNullAnnotation", getSeverityString(1073750016));
        optionsMap.put("org.eclipse.jdt.core.compiler.annotation.nullable",
            String.valueOf(CharOperation.concatWith(this.nullableAnnotationName, '.')));
        optionsMap.put("org.eclipse.jdt.core.compiler.annotation.nonnull",
            String.valueOf(CharOperation.concatWith(this.nonNullAnnotationName, '.')));
        optionsMap.put("org.eclipse.jdt.core.compiler.annotation.nonnullbydefault",
            String.valueOf(CharOperation.concatWith(this.nonNullByDefaultAnnotationName, '.')));
        optionsMap.put("org.eclipse.jdt.core.compiler.annotation.nullable.secondary",
            nameListToString(this.nullableAnnotationSecondaryNames));
        optionsMap.put("org.eclipse.jdt.core.compiler.annotation.nonnull.secondary",
            nameListToString(this.nonNullAnnotationSecondaryNames));
        optionsMap.put("org.eclipse.jdt.core.compiler.annotation.nonnullbydefault.secondary",
            nameListToString(this.nonNullByDefaultAnnotationSecondaryNames));
        optionsMap.put("org.eclipse.jdt.core.compiler.annotation.missingNonNullByDefaultAnnotation",
            getSeverityString(1073758208));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unusedTypeParameter", getSeverityString(1073807360));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.syntacticNullAnalysisForFields",
            this.enableSyntacticNullAnalysisForFields ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.annotation.inheritNullAnnotations",
            this.inheritNullAnnotations ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.nonnullParameterAnnotationDropped",
            getSeverityString(1073872896));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.uninternedIdentityComparison",
            this.complainOnUninternedIdentityComparison ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.pessimisticNullAnalysisForFreeTypeVariables",
            getSeverityString(1074266112));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.nonnullTypeVariableFromLegacyInvocation",
            getSeverityString(1074790400));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.annotatedTypeArgumentToUnannotated",
            getSeverityString(1342177280));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unlikelyCollectionMethodArgumentType",
            getSeverityString(1075838976));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unlikelyCollectionMethodArgumentTypeStrict",
            this.reportUnlikelyCollectionMethodArgumentTypeStrict ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unlikelyEqualsArgumentType",
            getSeverityString(1077936128));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.APILeak", getSeverityString(1090519040));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.unstableAutoModuleName", getSeverityString(1107296256));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.enablePreviewFeatures",
            this.enablePreviewFeatures ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.reportPreviewFeatures", getSeverityString(1140850688));
        optionsMap.put("org.eclipse.jdt.core.compiler.problem.suppressWarningsNotFullyAnalysed",
            getSeverityString(1207959552));
        optionsMap.put("org.eclipse.jdt.core.compiler.ignoreUnnamedModuleForSplitPackage",
            this.ignoreUnnamedModuleForSplitPackage ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.codegen.useStringConcatFactory",
            this.useStringConcatFactory ? "enabled" : "disabled");
        optionsMap.put("org.eclipse.jdt.core.compiler.codegen.validateOperandStack",
            this.validateOperandStack ? "enabled" : "disabled");
        return optionsMap;
    }

    public int getSeverity(int irritant) {
        if (this.errorThreshold.isSet(irritant)) {
            if ((irritant & (-536870912 | 570425344)) == 570425344) {
                return 1 | 32; // cannot be treated as fatal - codegen
                               // already occurred
            }
            return this.treatOptionalErrorAsFatal ? 1 | 32 | 128 : 1 | 32;
        }
        if (this.warningThreshold.isSet(irritant)) {
            return 0 | 32;
        }
        if (this.infoThreshold.isSet(irritant)) {
            return 1024 | 32;
        }
        return 256;
    }

    public String getSeverityString(int irritant) {
        if (this.errorThreshold.isSet(irritant))
            return "error";
        if (this.warningThreshold.isSet(irritant))
            return "warning";
        if (this.infoThreshold.isSet(irritant)) {
            return "info";
        }
        return "ignore";
    }

    public String getVisibilityString(int level) {
        switch (level & 7) {
            case 1:
                return "public";

            case 4:
                return "protected";

            case 2:
                return "private";

            default:
                return "default";
        }
    }

    public boolean isAnyEnabled() {
        return this.warningThreshold.isAnySet() || this.errorThreshold.isAnySet() || this.infoThreshold.isAnySet();
    }

    protected void resetDefaults() {
        // problem default severities defined on IrritantSet
        this.errorThreshold = new IrritantSet(IrritantSet.COMPILER_DEFAULT_ERRORS);
        this.warningThreshold = new IrritantSet(IrritantSet.COMPILER_DEFAULT_WARNINGS);
        this.infoThreshold = new IrritantSet(IrritantSet.COMPILER_DEFAULT_INFOS);

        // by default only lines and source attributes are generated.
        this.produceDebugAttributes = 1 | 2;

        // by default be compliant with first supported version

        this.complianceLevel = 3407872L;
        this.sourceLevel = 3407872L;
        this.targetJDK = 3407872L;
        this.release = false;

        this.defaultEncoding = null; // will use the platform default encoding

        // print what unit is being processed
        this.verbose = false;

        // no reference info by default

        // indicates if unused/optimizable local variables need to be preserved (debugging purpose)
        this.preserveAllLocalVariables = false;

        this.produceMethodParameters = false;

        // indicates whether literal expressions are inlined at parse-time or not
        this.parseLiteralExpressionsAsConstants = true;

        // max problems per compilation unit
        this.maxProblemsPerUnit = 100; // no more than 100 problems per default

        // tags used to recognize tasks in comments
        this.taskTags = null;
        this.taskPriorities = null;
        this.isTaskCaseSensitive = true;

        // deprecation report
        this.reportDeprecationInsideDeprecatedCode = false;
        this.reportDeprecationWhenOverridingDeprecatedMethod = false;

        // unused parameters report
        this.reportUnusedParameterWhenImplementingAbstract = false;
        this.reportUnusedParameterWhenOverridingConcrete = false;
        this.reportUnusedParameterIncludeDocCommentReference = true;

        // unused declaration of thrown exception
        this.reportUnusedDeclaredThrownExceptionWhenOverriding = false;
        this.reportUnusedDeclaredThrownExceptionIncludeDocCommentReference = true;
        this.reportUnusedDeclaredThrownExceptionExemptExceptionAndThrowable = true;

        // constructor/setter parameter hiding
        this.reportSpecialParameterHidingField = false;

        this.reportUnavoidableGenericTypeProblems = true;

        // check javadoc comments tags
        this.reportInvalidJavadocTagsVisibility = 1;
        this.reportInvalidJavadocTags = false;
        this.reportInvalidJavadocTagsDeprecatedRef = false;
        this.reportInvalidJavadocTagsNotVisibleRef = false;
        this.reportMissingJavadocTagDescription = "return_tag";

        // check missing javadoc tags
        this.reportMissingJavadocTagsVisibility = 1;
        this.reportMissingJavadocTagsOverriding = false;
        this.reportMissingJavadocTagsMethodTypeParameters = false;

        // check missing javadoc comments
        this.reportMissingJavadocCommentsVisibility = 1;
        this.reportMissingJavadocCommentsOverriding = false;

        // javadoc comment support
        this.docCommentSupport = false;

        // suppress warning annotation
        this.suppressWarnings = true;

        // suppress also optional errors
        this.suppressOptionalErrors = false;

        // treat optional error as non fatal
        this.treatOptionalErrorAsFatal = false;

        // parser perform statements recovery
        this.performMethodsFullRecovery = true;

        // parser perform statements recovery
        this.performStatementsRecovery = true;

        // store annotations
        this.storeAnnotations = false;

        // annotation processing
        this.generateClassFiles = true;

        // enable annotation processing by default only in batch mode
        this.processAnnotations = false;

        // disable missing override annotation reporting for interface method implementation
        this.reportMissingOverrideAnnotationForInterfaceMethodImplementation = true;

        // dead code detection
        this.reportDeadCodeInTrivialIfStatement = false;

        // ignore method bodies
        this.ignoreMethodBodies = false;

        this.ignoreSourceFolderWarningOption = false;

        // allow null info from asserts to be considered downstream by default
        this.includeNullInfoFromAsserts = false;

        this.isAnnotationBasedNullAnalysisEnabled = false;
        this.nullableAnnotationName = DEFAULT_NULLABLE_ANNOTATION_NAME;
        this.nonNullAnnotationName = DEFAULT_NONNULL_ANNOTATION_NAME;
        this.nonNullByDefaultAnnotationName = DEFAULT_NONNULLBYDEFAULT_ANNOTATION_NAME;
        this.enableSyntacticNullAnalysisForFields = false;
        this.inheritNullAnnotations = false;

        this.isAnnotationBasedResourceAnalysisEnabled = false;
        this.owningAnnotationName = DEFAULT_OWNING_ANNOTATION_NAME;
        this.notOwningAnnotationName = DEFAULT_NOTOWNING_ANNOTATION_NAME;

        this.reportMissingEnumCaseDespiteDefault = false;

        this.complainOnUninternedIdentityComparison = false;
        this.enablePreviewFeatures = false;

        this.ignoreUnnamedModuleForSplitPackage = false;
        this.useStringConcatFactory = true;
        this.validateOperandStack = true;
    }

    public void set(Map<String, String> optionsMap) {
        String optionValue;
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.debug.localVariable")) != null) {
            if ("generate".equals(optionValue)) {
                this.produceDebugAttributes |= 4;
            } else if ("do not generate".equals(optionValue)) {
                this.produceDebugAttributes &= ~4;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.debug.lineNumber")) != null) {
            if ("generate".equals(optionValue)) {
                this.produceDebugAttributes |= 2;
            } else if ("do not generate".equals(optionValue)) {
                this.produceDebugAttributes &= ~2;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.debug.sourceFile")) != null) {
            if ("generate".equals(optionValue)) {
                this.produceDebugAttributes |= 1;
            } else if ("do not generate".equals(optionValue)) {
                this.produceDebugAttributes &= ~1;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.codegen.unusedLocal")) != null) {
            if ("preserve".equals(optionValue)) {
                this.preserveAllLocalVariables = true;
            } else if ("optimize out".equals(optionValue)) {
                this.preserveAllLocalVariables = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.deprecationInDeprecatedCode"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportDeprecationInsideDeprecatedCode = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportDeprecationInsideDeprecatedCode = false;
            }
        }
        if ((optionValue
            = optionsMap.get("org.eclipse.jdt.core.compiler.problem.deprecationWhenOverridingDeprecatedMethod"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportDeprecationWhenOverridingDeprecatedMethod = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportDeprecationWhenOverridingDeprecatedMethod = false;
            }
        }
        if ((optionValue
            = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedDeclaredThrownExceptionWhenOverriding"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportUnusedDeclaredThrownExceptionWhenOverriding = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportUnusedDeclaredThrownExceptionWhenOverriding = false;
            }
        }
        if ((optionValue = optionsMap
            .get("org.eclipse.jdt.core.compiler.problem.unusedDeclaredThrownExceptionIncludeDocCommentReference"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportUnusedDeclaredThrownExceptionIncludeDocCommentReference = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportUnusedDeclaredThrownExceptionIncludeDocCommentReference = false;
            }
        }
        if ((optionValue = optionsMap
            .get("org.eclipse.jdt.core.compiler.problem.unusedDeclaredThrownExceptionExemptExceptionAndThrowable"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportUnusedDeclaredThrownExceptionExemptExceptionAndThrowable = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportUnusedDeclaredThrownExceptionExemptExceptionAndThrowable = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.compliance")) != null) {
            long level = versionToJdkLevel(optionValue);
            if (level != 0)
                this.complianceLevel = level;
        }
        if ((this.requestedSourceVersion = optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.source"))
            != null) {
            long level = versionToJdkLevel(optionValue);
            if (level != 0)
                this.sourceLevel = level;
        }
        this.release = "enabled".equals(optionsMap.get("org.eclipse.jdt.core.compiler.release"));
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.codegen.targetPlatform")) != null) {
            long level = versionToJdkLevel(optionValue);
            if (level != 0) {
                this.targetJDK = level;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.encoding")) != null) {
            this.defaultEncoding = null;
            String stringValue = optionValue;
            if (stringValue.length() > 0) {
                try {
                    new InputStreamReader(new ByteArrayInputStream(new byte[0]), stringValue);
                    this.defaultEncoding = stringValue;
                } catch (UnsupportedEncodingException e) {
                    // ignore unsupported encoding
                }
            }
        }
        if ((optionValue
            = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedParameterWhenImplementingAbstract"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportUnusedParameterWhenImplementingAbstract = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportUnusedParameterWhenImplementingAbstract = false;
            }
        }
        if ((optionValue
            = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedParameterWhenOverridingConcrete")) != null) {
            if ("enabled".equals(optionValue)) {
                this.reportUnusedParameterWhenOverridingConcrete = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportUnusedParameterWhenOverridingConcrete = false;
            }
        }
        if ((optionValue
            = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedParameterIncludeDocCommentReference"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportUnusedParameterIncludeDocCommentReference = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportUnusedParameterIncludeDocCommentReference = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.specialParameterHidingField"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportSpecialParameterHidingField = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportSpecialParameterHidingField = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unavoidableGenericTypeProblems"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportUnavoidableGenericTypeProblems = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportUnavoidableGenericTypeProblems = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.deadCodeInTrivialIfStatement"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportDeadCodeInTrivialIfStatement = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportDeadCodeInTrivialIfStatement = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.maxProblemPerUnit")) != null) {
            String stringValue = optionValue;
            try {
                int val = Integer.parseInt(stringValue);
                if (val >= 0)
                    this.maxProblemsPerUnit = val;
            } catch (NumberFormatException e) {
                // ignore ill-formatted limit
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.taskTags")) != null) {
            String stringValue = optionValue;
            if (stringValue.length() == 0) {
                this.taskTags = null;
            } else {
                this.taskTags = CharOperation.splitAndTrimOn(',', stringValue.toCharArray());
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.taskPriorities")) != null) {
            String stringValue = optionValue;
            if (stringValue.length() == 0) {
                this.taskPriorities = null;
            } else {
                this.taskPriorities = CharOperation.splitAndTrimOn(',', stringValue.toCharArray());
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.taskCaseSensitive")) != null) {
            if ("enabled".equals(optionValue)) {
                this.isTaskCaseSensitive = true;
            } else if ("disabled".equals(optionValue)) {
                this.isTaskCaseSensitive = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.codegen.shareCommonFinallyBlocks")) != null) {
            // withdrawn support
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.codegen.methodParameters")) != null) {
            if ("generate".equals(optionValue)) {
                this.produceMethodParameters = true;
            } else if ("do not generate".equals(optionValue)) {
                this.produceMethodParameters = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.codegen.lambda.genericSignature")) != null) {
            if ("generate".equals(optionValue)) {
                this.generateGenericSignatureForLambdaExpressions = true;
            } else if ("do not generate".equals(optionValue)) {
                this.generateGenericSignatureForLambdaExpressions = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.suppressWarnings")) != null) {
            if ("enabled".equals(optionValue)) {
                this.suppressWarnings = true;
            } else if ("disabled".equals(optionValue)) {
                this.suppressWarnings = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.suppressOptionalErrors")) != null) {
            if ("enabled".equals(optionValue)) {
                this.suppressOptionalErrors = true;
            } else if ("disabled".equals(optionValue)) {
                this.suppressOptionalErrors = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.fatalOptionalError")) != null) {
            if ("enabled".equals(optionValue)) {
                this.treatOptionalErrorAsFatal = true;
            } else if ("disabled".equals(optionValue)) {
                this.treatOptionalErrorAsFatal = false;
            }
        }
        if ((optionValue = optionsMap
            .get("org.eclipse.jdt.core.compiler.problem.missingOverrideAnnotationForInterfaceMethodImplementation"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportMissingOverrideAnnotationForInterfaceMethodImplementation = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportMissingOverrideAnnotationForInterfaceMethodImplementation = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.includeNullInfoFromAsserts"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.includeNullInfoFromAsserts = true;
            } else if ("disabled".equals(optionValue)) {
                this.includeNullInfoFromAsserts = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.methodWithConstructorName")) != null)
            updateSeverity(1, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.overridingPackageDefaultMethod"))
            != null)
            updateSeverity(2, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.deprecation")) != null)
            updateSeverity(4, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.terminalDeprecation")) != null)
            updateSeverity(1082130432, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.memberOfDeprecatedTypeNotDeprecated"))
            != null)
            updateSeverity(1610612744, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.hiddenCatchBlock")) != null)
            updateSeverity(8, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedLocal")) != null)
            updateSeverity(16, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedLambdaParameter")) != null)
            updateSeverity(1610612740, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedParameter")) != null)
            updateSeverity(32, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedExceptionParameter")) != null)
            updateSeverity(1074003968, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedImport")) != null)
            updateSeverity(1024, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedPrivateMember")) != null)
            updateSeverity(32768, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedDeclaredThrownException"))
            != null)
            updateSeverity(8388608, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.noImplicitStringConversion")) != null)
            updateSeverity(64, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.syntheticAccessEmulation")) != null)
            updateSeverity(128, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.localVariableHiding")) != null)
            updateSeverity(65536, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.fieldHiding")) != null)
            updateSeverity(131072, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.typeParameterHiding")) != null)
            updateSeverity(536871936, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.possibleAccidentalBooleanAssignment"))
            != null)
            updateSeverity(262144, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.emptyStatement")) != null)
            updateSeverity(524288, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.nonExternalizedStringLiteral"))
            != null)
            updateSeverity(256, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.assertIdentifier")) != null)
            updateSeverity(512, "error");
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.enumIdentifier")) != null)
            updateSeverity(536870928, "error");
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.staticAccessReceiver")) != null)
            updateSeverity(2048, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.indirectStaticAccess")) != null)
            updateSeverity(268435456, optionValue);
        if ((optionValue
            = optionsMap.get("org.eclipse.jdt.core.compiler.problem.incompatibleNonInheritedInterfaceMethod")) != null)
            updateSeverity(16384, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.undocumentedEmptyBlock")) != null)
            updateSeverity(134217728, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unnecessaryTypeCheck")) != null)
            updateSeverity(67108864, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unnecessaryElse")) != null)
            updateSeverity(536870913, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.finallyBlockNotCompletingNormally"))
            != null)
            updateSeverity(16777216, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unqualifiedFieldAccess")) != null)
            updateSeverity(4194304, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.noEffectAssignment")) != null)
            updateSeverity(8192, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.uncheckedTypeOperation")) != null)
            updateSeverity(536870914, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.rawTypeReference")) != null)
            updateSeverity(536936448, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.finalParameterBound")) != null)
            updateSeverity(536870916, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingSerialVersion")) != null)
            updateSeverity(536870920, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.forbiddenReference")) != null)
            updateSeverity(536870944, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.discouragedReference")) != null)
            updateSeverity(536887296, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.varargsArgumentNeedCast")) != null)
            updateSeverity(536870976, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.nullReference")) != null)
            updateSeverity(536871040, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.potentialNullReference")) != null)
            updateSeverity(538968064, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.redundantNullCheck")) != null)
            updateSeverity(541065216, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.autoboxing")) != null)
            updateSeverity(536871168, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.annotationSuperInterface")) != null)
            updateSeverity(536871424, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingOverrideAnnotation")) != null)
            updateSeverity(536872960, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingDeprecatedAnnotation")) != null)
            updateSeverity(536879104, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.incompleteEnumSwitch")) != null)
            updateSeverity(536875008, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingEnumCaseDespiteDefault"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportMissingEnumCaseDespiteDefault = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportMissingEnumCaseDespiteDefault = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingDefaultCase")) != null)
            updateSeverity(1073774592, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unhandledWarningToken")) != null)
            updateSeverity(536903680, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedWarningToken")) != null)
            updateSeverity(570425344, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedLabel")) != null)
            updateSeverity(537001984, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.parameterAssignment")) != null)
            updateSeverity(537133056, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.fallthroughCase")) != null)
            updateSeverity(537395200, optionValue);
        if ((optionValue
            = optionsMap.get("org.eclipse.jdt.core.compiler.problem.overridingMethodWithoutSuperInvocation")) != null)
            updateSeverity(537919488, optionValue);
        if ((optionValue
            = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedTypeArgumentsForMethodInvocation")) != null)
            updateSeverity(553648128, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.redundantSuperinterface")) != null)
            updateSeverity(603979776, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.comparingIdentical")) != null)
            updateSeverity(671088640, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingSynchronizedOnInheritedMethod"))
            != null)
            updateSeverity(805306368, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingHashCodeMethod")) != null)
            updateSeverity(1073741825, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.deadCode")) != null)
            updateSeverity(1073741826, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.tasks")) != null)
            updateSeverity(1073741828, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedObjectAllocation")) != null)
            updateSeverity(1073741832, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.reportMethodCanBeStatic")) != null)
            updateSeverity(1073741840, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.reportMethodCanBePotentiallyStatic"))
            != null)
            updateSeverity(1073741856, optionValue);
        if ((optionValue
            = optionsMap.get("org.eclipse.jdt.core.compiler.problem.redundantSpecificationOfTypeArguments")) != null)
            updateSeverity(1073741888, optionValue);
        // resource leak analysis:
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unclosedCloseable")) != null)
            updateSeverity(1073741952, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.potentiallyUnclosedCloseable"))
            != null)
            updateSeverity(1073742080, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.explicitlyClosedAutoCloseable"))
            != null)
            updateSeverity(1073742336, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.insufficientResourceAnalysis"))
            != null)
            updateSeverity(1610612737, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.incompatibleOwningContract")) != null)
            updateSeverity(1610612738, optionValue);
        if (getSeverity(1073741952) == 256 && getSeverity(1073742080) == 256 && getSeverity(1073742336) == 256) {

        } else {

        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.annotation.resourceanalysis")) != null) {
            this.storeAnnotations |= this.isAnnotationBasedResourceAnalysisEnabled = "enabled".equals(optionValue);
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.annotation.owning")) != null) {
            this.owningAnnotationName = CharOperation.splitAndTrimOn('.', optionValue.toCharArray());
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.annotation.notowning")) != null) {
            this.notOwningAnnotationName = CharOperation.splitAndTrimOn('.', optionValue.toCharArray());
        }

        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unusedTypeParameter")) != null)
            updateSeverity(1073807360, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unlikelyCollectionMethodArgumentType"))
            != null)
            updateSeverity(1075838976, optionValue);
        if ((optionValue
            = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unlikelyCollectionMethodArgumentTypeStrict"))
            != null) {
            this.reportUnlikelyCollectionMethodArgumentTypeStrict = "enabled".equals(optionValue);
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unlikelyEqualsArgumentType")) != null)
            updateSeverity(1077936128, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.APILeak")) != null)
            updateSeverity(1090519040, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.unstableAutoModuleName")) != null)
            updateSeverity(1107296256, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.annotation.nullanalysis")) != null) {
            this.isAnnotationBasedNullAnalysisEnabled = "enabled".equals(optionValue);
        }
        if (this.isAnnotationBasedNullAnalysisEnabled) {
            this.storeAnnotations = true;
            if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.nullSpecViolation")) != null) {
                if ("error".equals(optionValue)) {
                    this.errorThreshold.set(1073742848);
                    this.warningThreshold.clear(1073742848);
                } else if ("warning".equals(optionValue)) {
                    this.errorThreshold.clear(1073742848);
                    this.warningThreshold.set(1073742848);
                }
                // "ignore" is not valid for this option
            }
            if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.nullAnnotationInferenceConflict"))
                != null)
                updateSeverity(1073743872, optionValue);
            if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.nullUncheckedConversion")) != null)
                updateSeverity(1073745920, optionValue);
            if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.redundantNullAnnotation")) != null)
                updateSeverity(1073750016, optionValue);
            if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.annotation.nullable")) != null) {
                this.nullableAnnotationName = CharOperation.splitAndTrimOn('.', optionValue.toCharArray());
            }
            if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.annotation.nonnull")) != null) {
                this.nonNullAnnotationName = CharOperation.splitAndTrimOn('.', optionValue.toCharArray());
            }
            if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.annotation.nonnullbydefault")) != null) {
                this.nonNullByDefaultAnnotationName = CharOperation.splitAndTrimOn('.', optionValue.toCharArray());
            }
            if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.annotation.nullable.secondary")) != null) {
                this.nullableAnnotationSecondaryNames = stringToNameList(optionValue);
            }
            if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.annotation.nonnull.secondary")) != null) {
                this.nonNullAnnotationSecondaryNames = stringToNameList(optionValue);
            }
            if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.annotation.nonnullbydefault.secondary"))
                != null) {
                this.nonNullByDefaultAnnotationSecondaryNames = stringToNameList(optionValue);
            }
            if ((optionValue
                = optionsMap.get("org.eclipse.jdt.core.compiler.annotation.missingNonNullByDefaultAnnotation")) != null)
                updateSeverity(1073758208, optionValue);
            if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.syntacticNullAnalysisForFields"))
                != null) {
                this.enableSyntacticNullAnalysisForFields = "enabled".equals(optionValue);
            }
            if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.annotation.inheritNullAnnotations"))
                != null) {
                this.inheritNullAnnotations = "enabled".equals(optionValue);
            }
            if ((optionValue
                = optionsMap.get("org.eclipse.jdt.core.compiler.problem.nonnullParameterAnnotationDropped")) != null)
                updateSeverity(1073872896, optionValue);
            if ((optionValue
                = optionsMap.get("org.eclipse.jdt.core.compiler.problem.annotatedTypeArgumentToUnannotated")) != null)
                updateSeverity(1342177280, optionValue);
            if ((optionValue
                = optionsMap.get("org.eclipse.jdt.core.compiler.problem.pessimisticNullAnalysisForFreeTypeVariables"))
                != null)
                updateSeverity(1074266112, optionValue);
            if (getSeverity(1074266112) == 256) {

            } else {

            }
            if ((optionValue
                = optionsMap.get("org.eclipse.jdt.core.compiler.problem.nonnullTypeVariableFromLegacyInvocation"))
                != null)
                updateSeverity(1074790400, optionValue);
        }

        // Javadoc options
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.doc.comment.support")) != null) {
            if ("enabled".equals(optionValue)) {
                this.docCommentSupport = true;
            } else if ("disabled".equals(optionValue)) {
                this.docCommentSupport = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.invalidJavadoc")) != null) {
            updateSeverity(33554432, optionValue);
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.invalidJavadocTagsVisibility"))
            != null) {
            if ("public".equals(optionValue)) {
                this.reportInvalidJavadocTagsVisibility = 1;
            } else if ("protected".equals(optionValue)) {
                this.reportInvalidJavadocTagsVisibility = 4;
            } else if ("default".equals(optionValue)) {
                this.reportInvalidJavadocTagsVisibility = 0;
            } else if ("private".equals(optionValue)) {
                this.reportInvalidJavadocTagsVisibility = 2;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.invalidJavadocTags")) != null) {
            if ("enabled".equals(optionValue)) {
                this.reportInvalidJavadocTags = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportInvalidJavadocTags = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.invalidJavadocTagsDeprecatedRef"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportInvalidJavadocTagsDeprecatedRef = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportInvalidJavadocTagsDeprecatedRef = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.invalidJavadocTagsNotVisibleRef"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportInvalidJavadocTagsNotVisibleRef = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportInvalidJavadocTagsNotVisibleRef = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingJavadocTags")) != null) {
            updateSeverity(2097152, optionValue);
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingJavadocTagsVisibility"))
            != null) {
            if ("public".equals(optionValue)) {
                this.reportMissingJavadocTagsVisibility = 1;
            } else if ("protected".equals(optionValue)) {
                this.reportMissingJavadocTagsVisibility = 4;
            } else if ("default".equals(optionValue)) {
                this.reportMissingJavadocTagsVisibility = 0;
            } else if ("private".equals(optionValue)) {
                this.reportMissingJavadocTagsVisibility = 2;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingJavadocTagsOverriding"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportMissingJavadocTagsOverriding = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportMissingJavadocTagsOverriding = false;
            }
        }
        if ((optionValue
            = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingJavadocTagsMethodTypeParameters")) != null) {
            if ("enabled".equals(optionValue)) {
                this.reportMissingJavadocTagsMethodTypeParameters = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportMissingJavadocTagsMethodTypeParameters = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingJavadocComments")) != null) {
            updateSeverity(1048576, optionValue);
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingJavadocTagDescription"))
            != null) {
            this.reportMissingJavadocTagDescription = optionValue;
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingJavadocCommentsVisibility"))
            != null) {
            if ("public".equals(optionValue)) {
                this.reportMissingJavadocCommentsVisibility = 1;
            } else if ("protected".equals(optionValue)) {
                this.reportMissingJavadocCommentsVisibility = 4;
            } else if ("default".equals(optionValue)) {
                this.reportMissingJavadocCommentsVisibility = 0;
            } else if ("private".equals(optionValue)) {
                this.reportMissingJavadocCommentsVisibility = 2;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.missingJavadocCommentsOverriding"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.reportMissingJavadocCommentsOverriding = true;
            } else if ("disabled".equals(optionValue)) {
                this.reportMissingJavadocCommentsOverriding = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.generateClassFiles")) != null) {
            if ("enabled".equals(optionValue) || "generate".equals(optionValue)) {
                this.generateClassFiles = true;
            } else if ("disabled".equals(optionValue) || "do not generate".equals(optionValue)) {
                this.generateClassFiles = false;
            }
        }
        boolean useAnnotationsForAnalysis
            = this.isAnnotationBasedNullAnalysisEnabled || this.isAnnotationBasedResourceAnalysisEnabled;
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.processAnnotations")) != null) {
            if ("enabled".equals(optionValue)) {
                this.processAnnotations = true;
                this.storeAnnotations = true; // annotation processing requires annotation to be stored
            } else if ("disabled".equals(optionValue)) {
                this.processAnnotations = false;
                if (!useAnnotationsForAnalysis)
                    this.storeAnnotations = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.storeAnnotations")) != null) {
            if ("enabled".equals(optionValue)) {
                this.storeAnnotations = true;
            } else if ("disabled".equals(optionValue)) {
                if (!useAnnotationsForAnalysis && !this.processAnnotations)
                    this.storeAnnotations = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.emulateJavacBug8031744")) != null) {
            if ("enabled".equals(optionValue)) {
                this.emulateJavacBug8031744 = true;
            } else if ("disabled".equals(optionValue)) {
                this.emulateJavacBug8031744 = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.uninternedIdentityComparison"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.complainOnUninternedIdentityComparison = true;
            } else if ("disabled".equals(optionValue)) {
                this.complainOnUninternedIdentityComparison = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.enablePreviewFeatures")) != null) {
            if ("enabled".equals(optionValue)) {
                this.enablePreviewFeatures = true;
            } else if ("disabled".equals(optionValue)) {
                this.enablePreviewFeatures = false;
            }
        }
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.reportPreviewFeatures")) != null)
            updateSeverity(1140850688, optionValue);
        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.problem.suppressWarningsNotFullyAnalysed"))
            != null)
            updateSeverity(1207959552, optionValue);

        if ((optionValue = optionsMap.get("org.eclipse.jdt.internal.debug.compile.mode")) != null) {
            if ("enabled".equals(optionValue)) {

            } else if ("disabled".equals(optionValue)) {

            }
        }

        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.ignoreUnnamedModuleForSplitPackage"))
            != null) {
            if ("enabled".equals(optionValue)) {
                this.ignoreUnnamedModuleForSplitPackage = true;
            } else if ("disabled".equals(optionValue)) {
                this.ignoreUnnamedModuleForSplitPackage = false;
            }
        }

        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.codegen.useStringConcatFactory")) != null) {
            if ("enabled".equals(optionValue)) {
                this.useStringConcatFactory = true;
            } else if ("disabled".equals(optionValue)) {
                this.useStringConcatFactory = false;
            }
        }

        if ((optionValue = optionsMap.get("org.eclipse.jdt.core.compiler.codegen.validateOperandStack")) != null) {
            if ("enabled".equals(optionValue)) {
                this.validateOperandStack = true;
            } else if ("disabled".equals(optionValue)) {
                this.validateOperandStack = false;
            }
        }
    }

    private String[] stringToNameList(String optionValue) {
        String[] result = optionValue.split(","); //$NON-NLS-1$
        if (result == null)
            return NO_STRINGS;
        for (int i = 0; i < result.length; i++)
            result[i] = result[i].trim();
        return result;
    }

    String nameListToString(String[] names) {
        if (names == null)
            return ""; //$NON-NLS-1$
        return String.join(String.valueOf(','), names);
    }

    @Override
    public String toString() {
        StringBuilder buf = new StringBuilder("CompilerOptions:"); //$NON-NLS-1$
        buf.append("\n\t- local variables debug attributes: ") //$NON-NLS-1$
            .append((this.produceDebugAttributes & 4) != 0 ? "ON" : " OFF");  //$NON-NLS-1$ //$NON-NLS-2$
        buf.append("\n\t- line number debug attributes: ") //$NON-NLS-1$
            .append((this.produceDebugAttributes & 2) != 0 ? "ON" : " OFF");  //$NON-NLS-1$ //$NON-NLS-2$
        buf.append("\n\t- source debug attributes: ") //$NON-NLS-1$
            .append((this.produceDebugAttributes & 1) != 0 ? "ON" : " OFF");  //$NON-NLS-1$ //$NON-NLS-2$
        buf.append("\n\t- MethodParameters attributes: ") //$NON-NLS-1$
            .append(this.produceMethodParameters ? "generate" : "do not generate");
        buf.append("\n\t- Generic signature for lambda expressions: ") //$NON-NLS-1$
            .append(this.generateGenericSignatureForLambdaExpressions ? "generate" : "do not generate");
        buf.append("\n\t- preserve all local variables: ").append(this.preserveAllLocalVariables ? "ON" : " OFF"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
        buf.append("\n\t- method with constructor name: ").append(getSeverityString(1)); //$NON-NLS-1$
        buf.append("\n\t- overridden package default method: ") //$NON-NLS-1$
            .append(getSeverityString(2));
        buf.append("\n\t- deprecation: ").append(getSeverityString(4)); //$NON-NLS-1$
        buf.append("\n\t- removal: ").append(getSeverityString(1082130432)); //$NON-NLS-1$
        buf.append("\n\t- masked catch block: ").append(getSeverityString(8)); //$NON-NLS-1$
        buf.append("\n\t- unused local variable: ").append(getSeverityString(16)); //$NON-NLS-1$
        buf.append("\n\t- unused lambda parameter: ").append(getSeverityString(1610612740)); //$NON-NLS-1$
        buf.append("\n\t- unused parameter: ").append(getSeverityString(32)); //$NON-NLS-1$
        buf.append("\n\t- unused exception parameter: ").append(getSeverityString(1074003968)); //$NON-NLS-1$
        buf.append("\n\t- unused import: ").append(getSeverityString(1024)); //$NON-NLS-1$
        buf.append("\n\t- synthetic access emulation: ").append(getSeverityString(128)); //$NON-NLS-1$
        buf.append("\n\t- assignment with no effect: ").append(getSeverityString(8192)); //$NON-NLS-1$
        buf.append("\n\t- non externalized string: ").append(getSeverityString(256)); //$NON-NLS-1$
        buf.append("\n\t- static access receiver: ").append(getSeverityString(2048)); //$NON-NLS-1$
        buf.append("\n\t- indirect static access: ").append(getSeverityString(268435456)); //$NON-NLS-1$
        buf.append("\n\t- incompatible non inherited interface method: ") //$NON-NLS-1$
            .append(getSeverityString(16384));
        buf.append("\n\t- unused private member: ").append(getSeverityString(32768)); //$NON-NLS-1$
        buf.append("\n\t- local variable hiding another variable: ").append(getSeverityString(65536)); //$NON-NLS-1$
        buf.append("\n\t- field hiding another variable: ").append(getSeverityString(131072)); //$NON-NLS-1$
        buf.append("\n\t- type hiding another type: ").append(getSeverityString(536871936)); //$NON-NLS-1$
        buf.append("\n\t- possible accidental boolean assignment: ").append(getSeverityString(262144)); //$NON-NLS-1$
        buf.append("\n\t- superfluous semicolon: ").append(getSeverityString(524288)); //$NON-NLS-1$
        buf.append("\n\t- uncommented empty block: ").append(getSeverityString(134217728)); //$NON-NLS-1$
        buf.append("\n\t- unnecessary type check: ").append(getSeverityString(67108864)); //$NON-NLS-1$
        buf.append("\n\t- javadoc comment support: ").append(this.docCommentSupport ? "ON" : " OFF"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
        buf.append("\n\t\t+ invalid javadoc: ").append(getSeverityString(33554432)); //$NON-NLS-1$
        buf.append("\n\t\t+ report invalid javadoc tags: ") //$NON-NLS-1$
            .append(this.reportInvalidJavadocTags ? "enabled" : "disabled");
        buf.append("\n\t\t\t* deprecated references: ") //$NON-NLS-1$
            .append(this.reportInvalidJavadocTagsDeprecatedRef ? "enabled" : "disabled");
        buf.append("\n\t\t\t* not visible references: ") //$NON-NLS-1$
            .append(this.reportInvalidJavadocTagsNotVisibleRef ? "enabled" : "disabled");
        buf.append("\n\t\t+ visibility level to report invalid javadoc tags: ") //$NON-NLS-1$
            .append(getVisibilityString(this.reportInvalidJavadocTagsVisibility));
        buf.append("\n\t\t+ missing javadoc tags: ").append(getSeverityString(2097152)); //$NON-NLS-1$
        buf.append("\n\t\t+ visibility level to report missing javadoc tags: ") //$NON-NLS-1$
            .append(getVisibilityString(this.reportMissingJavadocTagsVisibility));
        buf.append("\n\t\t+ report missing javadoc tags for method type parameters: ") //$NON-NLS-1$
            .append(this.reportMissingJavadocTagsMethodTypeParameters ? "enabled" : "disabled");
        buf.append("\n\t\t+ report missing javadoc tags in overriding methods: ") //$NON-NLS-1$
            .append(this.reportMissingJavadocTagsOverriding ? "enabled" : "disabled");
        buf.append("\n\t\t+ missing javadoc comments: ").append(getSeverityString(1048576)); //$NON-NLS-1$
        buf.append("\n\t\t+ report missing tag description option: ").append(this.reportMissingJavadocTagDescription); //$NON-NLS-1$
        buf.append("\n\t\t+ visibility level to report missing javadoc comments: ") //$NON-NLS-1$
            .append(getVisibilityString(this.reportMissingJavadocCommentsVisibility));
        buf.append("\n\t\t+ report missing javadoc comments in overriding methods: ") //$NON-NLS-1$
            .append(this.reportMissingJavadocCommentsOverriding ? "enabled" : "disabled");
        buf.append("\n\t- finally block not completing normally: ") //$NON-NLS-1$
            .append(getSeverityString(16777216));
        buf.append("\n\t- report unused declared thrown exception: ") //$NON-NLS-1$
            .append(getSeverityString(8388608));
        buf.append("\n\t- report unused declared thrown exception when overriding: ") //$NON-NLS-1$
            .append(this.reportUnusedDeclaredThrownExceptionWhenOverriding ? "enabled" : "disabled");
        buf.append("\n\t- report unused declared thrown exception include doc comment reference: ") //$NON-NLS-1$
            .append(this.reportUnusedDeclaredThrownExceptionIncludeDocCommentReference ? "enabled" : "disabled");
        buf.append("\n\t- report unused declared thrown exception exempt exception and throwable: ") //$NON-NLS-1$
            .append(this.reportUnusedDeclaredThrownExceptionExemptExceptionAndThrowable ? "enabled" : "disabled");
        buf.append("\n\t- unnecessary else: ").append(getSeverityString(536870913)); //$NON-NLS-1$
        buf.append("\n\t- JDK compliance level: " + versionFromJdkLevel(this.complianceLevel)); //$NON-NLS-1$
        buf.append("\n\t- JDK source level: " + versionFromJdkLevel(this.sourceLevel)); //$NON-NLS-1$
        buf.append("\n\t- JDK target level: " + versionFromJdkLevel(this.targetJDK)); //$NON-NLS-1$
        buf.append("\n\t- Preview Features: ").append(this.enablePreviewFeatures ? "enabled" : "disabled"); //$NON-NLS-1$
        buf.append("\n\t- verbose : ").append(this.verbose ? "ON" : "OFF"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
        buf.append("\n\t- produce reference info : ").append("OFF"); //$NON-NLS-1$ //$NON-NLS-2$ //$NON-NLS-3$
        buf.append("\n\t- parse literal expressions as constants : ") //$NON-NLS-1$
            .append(this.parseLiteralExpressionsAsConstants ? "ON" : "OFF");  //$NON-NLS-1$ //$NON-NLS-2$
        buf.append("\n\t- encoding : ").append(this.defaultEncoding == null ? "<default>" : this.defaultEncoding); //$NON-NLS-1$ //$NON-NLS-2$
        buf.append("\n\t- task tags: ") //$NON-NLS-1$
            .append(
                this.taskTags == null ? Util.EMPTY_STRING : new String(CharOperation.concatWith(this.taskTags, ',')));
        buf.append("\n\t- task priorities : ") //$NON-NLS-1$
            .append(this.taskPriorities == null
                ? Util.EMPTY_STRING
                : new String(CharOperation.concatWith(this.taskPriorities, ',')));
        buf.append("\n\t- report deprecation inside deprecated code : ") //$NON-NLS-1$
            .append(this.reportDeprecationInsideDeprecatedCode ? "enabled" : "disabled");
        buf.append("\n\t- report deprecation when overriding deprecated method : ") //$NON-NLS-1$
            .append(this.reportDeprecationWhenOverridingDeprecatedMethod ? "enabled" : "disabled");
        buf.append("\n\t- report unused parameter when implementing abstract method : ") //$NON-NLS-1$
            .append(this.reportUnusedParameterWhenImplementingAbstract ? "enabled" : "disabled");
        buf.append("\n\t- report unused parameter when overriding concrete method : ") //$NON-NLS-1$
            .append(this.reportUnusedParameterWhenOverridingConcrete ? "enabled" : "disabled");
        buf.append("\n\t- report unused parameter include doc comment reference : ") //$NON-NLS-1$
            .append(this.reportUnusedParameterIncludeDocCommentReference ? "enabled" : "disabled");
        buf.append("\n\t- report constructor/setter parameter hiding existing field : ") //$NON-NLS-1$
            .append(this.reportSpecialParameterHidingField ? "enabled" : "disabled");
        buf.append("\n\t- report unavoidable generic type problems : ") //$NON-NLS-1$
            .append(this.reportUnavoidableGenericTypeProblems ? "enabled" : "disabled");
        buf.append("\n\t- unsafe type operation: ").append(getSeverityString(536870914)); //$NON-NLS-1$
        buf.append("\n\t- unsafe raw type: ").append(getSeverityString(536936448)); //$NON-NLS-1$
        buf.append("\n\t- final bound for type parameter: ").append(getSeverityString(536870916)); //$NON-NLS-1$
        buf.append("\n\t- missing serialVersionUID: ").append(getSeverityString(536870920)); //$NON-NLS-1$
        buf.append("\n\t- varargs argument need cast: ").append(getSeverityString(536870976)); //$NON-NLS-1$
        buf.append("\n\t- forbidden reference to type with access restriction: ") //$NON-NLS-1$
            .append(getSeverityString(536870944));
        buf.append("\n\t- discouraged reference to type with access restriction: ") //$NON-NLS-1$
            .append(getSeverityString(536887296));
        buf.append("\n\t- null reference: ").append(getSeverityString(536871040)); //$NON-NLS-1$
        buf.append("\n\t- potential null reference: ").append(getSeverityString(538968064)); //$NON-NLS-1$
        buf.append("\n\t- redundant null check: ").append(getSeverityString(541065216)); //$NON-NLS-1$
        buf.append("\n\t- autoboxing: ").append(getSeverityString(536871168)); //$NON-NLS-1$
        buf.append("\n\t- annotation super interface: ").append(getSeverityString(536871424)); //$NON-NLS-1$
        buf.append("\n\t- missing @Override annotation: ").append(getSeverityString(536872960)); //$NON-NLS-1$
        buf.append("\n\t- missing @Override annotation for interface method implementation: ") //$NON-NLS-1$
            .append(this.reportMissingOverrideAnnotationForInterfaceMethodImplementation ? "enabled" : "disabled");
        buf.append("\n\t- missing @Deprecated annotation: ").append(getSeverityString(536879104)); //$NON-NLS-1$
        buf.append("\n\t- incomplete enum switch: ").append(getSeverityString(536875008)); //$NON-NLS-1$
        buf.append("\n\t- raise null related warnings for variables tainted in assert statements: ") //$NON-NLS-1$
            .append(this.includeNullInfoFromAsserts ? "enabled" : "disabled");
        buf.append("\n\t- suppress warnings: ").append(this.suppressWarnings ? "enabled" : "disabled"); //$NON-NLS-1$
        buf.append("\n\t- suppress optional errors: ").append(this.suppressOptionalErrors ? "enabled" : "disabled"); //$NON-NLS-1$
        buf.append("\n\t- unhandled warning token: ").append(getSeverityString(536903680)); //$NON-NLS-1$
        buf.append("\n\t- unused warning token: ").append(getSeverityString(570425344)); //$NON-NLS-1$
        buf.append("\n\t- unused label: ").append(getSeverityString(537001984)); //$NON-NLS-1$
        buf.append("\n\t- treat optional error as fatal: ") //$NON-NLS-1$
            .append(this.treatOptionalErrorAsFatal ? "enabled" : "disabled");
        buf.append("\n\t- parameter assignment: ").append(getSeverityString(537133056)); //$NON-NLS-1$
        buf.append("\n\t- generate class files: ").append(this.generateClassFiles ? "enabled" : "disabled"); //$NON-NLS-1$
        buf.append("\n\t- process annotations: ").append(this.processAnnotations ? "enabled" : "disabled"); //$NON-NLS-1$
        buf.append("\n\t- unused type arguments for method/constructor invocation: ") //$NON-NLS-1$
            .append(getSeverityString(553648128));
        buf.append("\n\t- redundant superinterface: ").append(getSeverityString(603979776)); //$NON-NLS-1$
        buf.append("\n\t- comparing identical expr: ").append(getSeverityString(671088640)); //$NON-NLS-1$
        buf.append("\n\t- missing synchronized on inherited method: ") //$NON-NLS-1$
            .append(getSeverityString(805306368));
        buf.append("\n\t- should implement hashCode() method: ").append(getSeverityString(1073741825)); //$NON-NLS-1$
        buf.append("\n\t- dead code: ").append(getSeverityString(1073741826)); //$NON-NLS-1$
        buf.append("\n\t- dead code in trivial if statement: ") //$NON-NLS-1$
            .append(this.reportDeadCodeInTrivialIfStatement ? "enabled" : "disabled");
        buf.append("\n\t- tasks severity: ").append(getSeverityString(1073741828)); //$NON-NLS-1$
        buf.append("\n\t- unused object allocation: ").append(getSeverityString(1073741832)); //$NON-NLS-1$
        buf.append("\n\t- method can be static: ").append(getSeverityString(1073741840)); //$NON-NLS-1$
        buf.append("\n\t- method can be potentially static: ").append(getSeverityString(1073741856)); //$NON-NLS-1$
        buf.append("\n\t- redundant specification of type arguments: ") //$NON-NLS-1$
            .append(getSeverityString(1073741888));
        // resource leak analysis:
        buf.append("\n\t- resource is not closed: ").append(getSeverityString(1073741952)); //$NON-NLS-1$
        buf.append("\n\t- resource may not be closed: ").append(getSeverityString(1073742080)); //$NON-NLS-1$
        buf.append("\n\t- resource should be handled by try-with-resources: ") //$NON-NLS-1$
            .append(getSeverityString(1073742336));
        buf.append("\n\t- resource should be managed explicitly: ") //$NON-NLS-1$
            .append(getSeverityString(1610612737));

        buf.append("\n\t- Unused Type Parameter: ").append(getSeverityString(1073807360)); //$NON-NLS-1$
        buf.append("\n\t- pessimistic null analysis for free type variables: ") //$NON-NLS-1$
            .append(getSeverityString(1074266112));
        buf.append("\n\t- report unsafe nonnull return from legacy method: ") //$NON-NLS-1$
            .append(getSeverityString(1074790400));
        buf.append("\n\t- unlikely argument type for collection methods: ") //$NON-NLS-1$
            .append(getSeverityString(1075838976));
        buf.append("\n\t- unlikely argument type for collection methods, strict check against expected type: ") //$NON-NLS-1$
            .append(this.reportUnlikelyCollectionMethodArgumentTypeStrict ? "enabled" : "disabled");
        buf.append("\n\t- unlikely argument types for equals(): ") //$NON-NLS-1$
            .append(getSeverityString(1077936128));
        buf.append("\n\t- API leak: ").append(getSeverityString(1090519040)); //$NON-NLS-1$
        buf.append("\n\t- unstable auto module name: ").append(getSeverityString(1107296256)); //$NON-NLS-1$
        buf.append("\n\t- SuppressWarnings not fully analysed: ") //$NON-NLS-1$
            .append(getSeverityString(1207959552));
        buf.append("\n\t- ignore package from unnamed module: ") //$NON-NLS-1$
            .append(this.ignoreUnnamedModuleForSplitPackage ? "enabled" : "disabled");
        buf.append("\n\t- use StringConcatFactory for String concatenation expressions: ") //$NON-NLS-1$
            .append(this.useStringConcatFactory ? "enabled" : "disabled");
        buf.append("\n\t- validate virtual machine's operand stack during code generation: ") //$NON-NLS-1$
            .append(this.validateOperandStack ? "enabled" : "disabled");
        return buf.toString();
    }

    protected void updateSeverity(int irritant, Object severityString) {
        if ("error".equals(severityString)) {
            this.errorThreshold.set(irritant);
            this.warningThreshold.clear(irritant);
            this.infoThreshold.clear(irritant);
        } else if ("warning".equals(severityString)) {
            this.errorThreshold.clear(irritant);
            this.warningThreshold.set(irritant);
            this.infoThreshold.clear(irritant);
        } else if ("info".equals(severityString)) {
            this.errorThreshold.clear(irritant);
            this.warningThreshold.clear(irritant);
            this.infoThreshold.set(irritant);
        } else if ("ignore".equals(severityString)) {
            this.errorThreshold.clear(irritant);
            this.warningThreshold.clear(irritant);
            this.infoThreshold.clear(irritant);
        }
    }

}
