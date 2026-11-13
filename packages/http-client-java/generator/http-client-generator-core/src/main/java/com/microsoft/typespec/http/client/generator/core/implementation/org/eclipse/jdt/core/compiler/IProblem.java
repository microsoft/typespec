// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2018 IBM Corporation and others.
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
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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
 *     IBM Corporation - added the following constants
 *								   NonStaticAccessToStaticField
 *								   NonStaticAccessToStaticMethod
 *								   Task
 *								   ExpressionShouldBeAVariable
 *								   AssignmentHasNoEffect
 *     IBM Corporation - added the following constants
 *								   TooManySyntheticArgumentSlots
 *								   TooManyArrayDimensions
 *								   TooManyBytesForStringConstant
 *								   TooManyMethods
 *								   TooManyFields
 *								   NonBlankFinalLocalAssignment
 *								   ObjectCannotHaveSuperTypes
 *								   MissingSemiColon
 *								   InvalidParenthesizedExpression
 *								   EnclosingInstanceInConstructorCall
 *								   BytecodeExceeds64KLimitForConstructor
 *								   IncompatibleReturnTypeForNonInheritedInterfaceMethod
 *								   UnusedPrivateMethod
 *								   UnusedPrivateConstructor
 *								   UnusedPrivateType
 *								   UnusedPrivateField
 *								   IncompatibleExceptionInThrowsClauseForNonInheritedInterfaceMethod
 *								   InvalidExplicitConstructorCall
 *     IBM Corporation - added the following constants
 *								   PossibleAccidentalBooleanAssignment
 *								   SuperfluousSemicolon
 *								   IndirectAccessToStaticField
 *								   IndirectAccessToStaticMethod
 *								   IndirectAccessToStaticType
 *								   BooleanMethodThrowingException
 *								   UnnecessaryCast
 *								   UnnecessaryArgumentCast
 *								   UnnecessaryInstanceof
 *								   FinallyMustCompleteNormally
 *								   UnusedMethodDeclaredThrownException
 *								   UnusedConstructorDeclaredThrownException
 *								   InvalidCatchBlockSequence
 *								   UnqualifiedFieldAccess
 *     IBM Corporation - added the following constants
 *								   Javadoc
 *								   JavadocUnexpectedTag
 *								   JavadocMissingParamTag
 *								   JavadocMissingParamName
 *								   JavadocDuplicateParamName
 *								   JavadocInvalidParamName
 *								   JavadocMissingReturnTag
 *								   JavadocDuplicateReturnTag
 *								   JavadocMissingThrowsTag
 *								   JavadocMissingThrowsClassName
 *								   JavadocInvalidThrowsClass
 *								   JavadocDuplicateThrowsClassName
 *								   JavadocInvalidThrowsClassName
 *								   JavadocMissingSeeReference
 *								   JavadocInvalidSeeReference
 *								   JavadocInvalidSeeHref
 *								   JavadocInvalidSeeArgs
 *								   JavadocMissing
 *								   JavadocInvalidTag
 *								   JavadocMessagePrefix
 *								   EmptyControlFlowStatement
 *     IBM Corporation - added the following constants
 *								   IllegalUsageOfQualifiedTypeReference
 *								   InvalidDigit
 *     IBM Corporation - added the following constants
 *								   ParameterAssignment
 *								   FallthroughCase
 *     IBM Corporation - added the following constants
 *                                 UnusedLabel
 *                                 UnnecessaryNLSTag
 *                                 LocalVariableMayBeNull
 *                                 EnumConstantsCannotBeSurroundedByParenthesis
 *                                 JavadocMissingIdentifier
 *                                 JavadocNonStaticTypeFromStaticInvocation
 *                                 RawTypeReference
 *                                 NoAdditionalBoundAfterTypeVariable
 *                                 UnsafeGenericArrayForVarargs
 *                                 IllegalAccessFromTypeVariable
 *                                 AnnotationValueMustBeArrayInitializer
 *                                 InvalidEncoding
 *                                 CannotReadSource
 *                                 EnumStaticFieldInInInitializerContext
 *                                 ExternalProblemNotFixable
 *                                 ExternalProblemFixable
 *     IBM Corporation - added the following constants
 *                                 AnnotationValueMustBeAnEnumConstant
 *                                 OverridingMethodWithoutSuperInvocation
 *                                 MethodMustOverrideOrImplement
 *                                 TypeHidingTypeParameterFromType
 *                                 TypeHidingTypeParameterFromMethod
 *                                 TypeHidingType
 *     IBM Corporation - added the following constants
 *								   NullLocalVariableReference
 *								   PotentialNullLocalVariableReference
 *								   RedundantNullCheckOnNullLocalVariable
 * 								   NullLocalVariableComparisonYieldsFalse
 * 								   RedundantLocalVariableNullAssignment
 * 								   NullLocalVariableInstanceofYieldsFalse
 * 								   RedundantNullCheckOnNonNullLocalVariable
 * 								   NonNullLocalVariableComparisonYieldsFalse
 *     IBM Corporation - added the following constants
 *                                 InvalidUsageOfTypeParametersForAnnotationDeclaration
 *                                 InvalidUsageOfTypeParametersForEnumDeclaration
 *     IBM Corporation - added the following constants
 *								   RedundantSuperinterface
 *		Benjamin Muskalla - added the following constants
 *									MissingSynchronizedModifierInInheritedMethod
 *		Stephan Herrmann  - added the following constants
 *									UnusedObjectAllocation
 *									PotentiallyUnclosedCloseable
 *									PotentiallyUnclosedCloseableAtExit
 *									UnclosedCloseable
 *									UnclosedCloseableAtExit
 *									ExplicitlyClosedAutoCloseable
 * 								    RequiredNonNullButProvidedNull
 * 									RequiredNonNullButProvidedPotentialNull
 * 									RequiredNonNullButProvidedUnknown
 * 									NullAnnotationNameMustBeQualified
 * 									IllegalReturnNullityRedefinition
 * 									IllegalRedefinitionToNonNullParameter
 * 									IllegalDefinitionToNonNullParameter
 * 									ParameterLackingNonNullAnnotation
 * 									ParameterLackingNullableAnnotation
 * 									PotentialNullMessageSendReference
 * 									RedundantNullCheckOnNonNullMessageSend
 * 									CannotImplementIncompatibleNullness
 * 									RedundantNullAnnotation
 *									RedundantNullDefaultAnnotation
 *									RedundantNullDefaultAnnotationPackage
 *									RedundantNullDefaultAnnotationType
 *									RedundantNullDefaultAnnotationMethod
 *									ContradictoryNullAnnotations
 *									IllegalAnnotationForBaseType
 *									RedundantNullCheckOnSpecdNonNullLocalVariable
 *									SpecdNonNullLocalVariableComparisonYieldsFalse
 *									RequiredNonNullButProvidedSpecdNullable
 *									MissingDefaultCase
 *									MissingEnumConstantCaseDespiteDefault
 *									UninitializedLocalVariableHintMissingDefault
 *									UninitializedBlankFinalFieldHintMissingDefault
 *									ShouldReturnValueHintMissingDefault
 *									IllegalModifierForInterfaceDefaultMethod
 *									InheritedDefaultMethodConflictsWithOtherInherited
 *									ConflictingNullAnnotations
 *									ConflictingInheritedNullAnnotations
 *									UnsafeElementTypeConversion
 *									ArrayReferencePotentialNullReference
 *									DereferencingNullableExpression
 *									NullityMismatchingTypeAnnotation
 *									NullityMismatchingTypeAnnotationSuperHint
 *									NullityUncheckedTypeAnnotationDetail
 *									NullityUncheckedTypeAnnotationDetailSuperHint
 *									NullableFieldReference
 *									UninitializedNonNullField
 *									UninitializedNonNullFieldHintMissingDefault
 *									NonNullMessageSendComparisonYieldsFalse
 *									RedundantNullCheckOnNonNullSpecdField
 *									NonNullSpecdFieldComparisonYieldsFalse
 *									NonNullExpressionComparisonYieldsFalse
 *									RedundantNullCheckOnNonNullExpression
 *									ReferenceExpressionParameterNullityMismatch
 *									ReferenceExpressionParameterNullityUnchecked
 *									ReferenceExpressionReturnNullRedef
 *									ReferenceExpressionReturnNullRedefUnchecked
 *									DuplicateInheritedDefaultMethods
 *									SuperAccessCannotBypassDirectSuper
 *									SuperCallCannotBypassOverride
 *									ConflictingNullAnnotations
 *									ConflictingInheritedNullAnnotations
 *									UnsafeElementTypeConversion
 *									PotentialNullUnboxing
 *									NullUnboxing
 *									NullExpressionReference
 *									PotentialNullExpressionReference
 *									RedundantNullCheckAgainstNonNullType
 *									NullAnnotationUnsupportedLocation
 *									NullAnnotationUnsupportedLocationAtType
 *									NullityMismatchTypeArgument
 *									ContradictoryNullAnnotationsOnBound
 *									UnsafeNullnessCast
 *									ContradictoryNullAnnotationsInferred
 *									NonNullDefaultDetailIsNotEvaluated
 *									NullNotCompatibleToFreeTypeVariable
 *									NullityMismatchAgainstFreeTypeVariable
 *									ImplicitObjectBoundNoNullDefault
 *									IllegalParameterNullityRedefinition
 *									ContradictoryNullAnnotationsInferredFunctionType
 *									IllegalReturnNullityRedefinitionFreeTypeVariable
 *									UnlikelyCollectionMethodArgumentType
 *									UnlikelyEqualsArgumentType
 *      Jesper S Moller  - added the following constants
 *									TargetTypeNotAFunctionalInterface
 *									OuterLocalMustBeEffectivelyFinal
 *									IllegalModifiersForPackage
 *									DuplicateAnnotationNotMarkedRepeatable
 *									DisallowedTargetForContainerAnnotation
 *									RepeatedAnnotationWithContainerAnnotation
 *									ContainingAnnotationMustHaveValue
 *									ContainingAnnotationHasNonDefaultMembers
 *									ContainingAnnotationHasWrongValueType
 *								 	ContainingAnnotationHasShorterRetention
 *									RepeatableAnnotationHasTargets
 *									RepeatableAnnotationTargetMismatch
 *									RepeatableAnnotationIsDocumented
 *									RepeatableAnnotationIsInherited
 *									RepeatableAnnotationWithRepeatingContainerAnnotation
 *									VarLocalMultipleDeclarators
 *									VarLocalCannotBeArray
 *									VarLocalReferencesItself
 *									VarLocalWithoutInitizalier
 *									VarLocalInitializedToNull
 *									VarLocalCannotBeArrayInitalizers
 *									VarLocalCannotBeLambda
 *									VarLocalCannotBeMethodReference
 *									VarIsReserved
 *									VarIsReservedInFuture
 *									VarIsNotAllowedHere
******************************************************************************/

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.compiler;

/**
 * Description of a Java problem, as detected by the compiler or some of the underlying technology reusing the compiler.
 * A problem provides access to: <ul> <li> its location (source position, line number) </li> <li> its message
 * description </li> <li> a predicate to check whether it is an error </li> <li> its ID : a number identifying the very
 * nature of this problem </li> </ul>
 *
 * @since 2.0
 */
public class IProblem {

    private final int id;
    private final int startPosition;
    private final int endPosition;
    private final int line;
    public int severity;
    private final String[] arguments;
    private final String message;

    public IProblem(String message, int id, String[] stringArguments, int severity, int startPosition, int endPosition,
        int line) {
        this.message = message;
        this.id = id;
        this.arguments = stringArguments;
        this.severity = severity;
        this.startPosition = startPosition;
        this.endPosition = endPosition;
        this.line = line;
    }

    /**
     * Returns the problem id
     *
     * Answer the type of problem.
     *
     * @return the problem id
     * @return int
     */
    public int getID() {
        return this.id;
    }

    /**
     * Answer the end position of the problem (inclusive), or -1 if unknown.
     *
     * @return the end position of the problem (inclusive), or -1 if unknown
     */
    public int getSourceEnd() {
        return this.endPosition;
    }

    /**
     * Answer the line number in source where the problem begins.
     *
     * @return the line number in source where the problem begins
     */
    public int getSourceLineNumber() {
        return this.line;
    }

    /**
     * Answer the start position of the problem (inclusive), or -1 if unknown.
     *
     * @return the start position of the problem (inclusive), or -1 if unknown
     */
    public int getSourceStart() {
        return this.startPosition;
    }

    /*
     * Helper method: checks the severity to see if the Error bit is set.
     *
     * @return boolean
     */
    /**
     * Returns whether the severity of this problem is 'Error'.
     *
     * @return true if the severity of this problem is 'Error', false otherwise
     */
    public boolean isError() {
        return (this.severity & 1) != 0;
    }

    @Override
    public String toString() {
        StringBuilder s = new StringBuilder("Pb(" + (this.id & 2097151) + ") "); //$NON-NLS-1$ //$NON-NLS-2$
        if (this.message != null) {
            s.append(this.message);
        } else {
            if (this.arguments != null)
                for (String argument : this.arguments)
                    s.append(" ").append(argument); //$NON-NLS-1$
        }
        return s.toString();
    }
}
