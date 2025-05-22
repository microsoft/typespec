// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import java.lang.reflect.Modifier;
import java.util.List;

/**
 * The method level customization for an AutoRest generated method.
 */
public interface MethodCustomization extends CodeCustomization {
    /**
     * Gets the name of the method this customization is using.
     *
     * @return The name of the method.
     */
    String getMethodName();

    /**
     * Gets the name of the class containing the method.
     *
     * @return The name of the class containing the method.
     */
    String getClassName();

    /**
     * Gets the Javadoc customization for this method.
     *
     * @return the Javadoc customization
     */
    JavadocCustomization<?> getJavadoc();

    /**
     * Rename a method in the class. This is a refactor operation. All references to this method across the client
     * library will be automatically modified.
     *
     * @param newName the new name for the method
     * @return the current method customization for chaining
     */
    MethodCustomization rename(String newName);

    /**
     * Add an annotation to a method in the class.
     *
     * @param annotation the annotation to add. The leading @ can be omitted.
     * @return the current method customization for chaining
     */
    MethodCustomization addAnnotation(String annotation);

    /**
     * Remove an annotation from the method.
     *
     * @param annotation the annotation to remove from the method. The leading @ can be omitted.
     * @return the current method customization for chaining
     */
    MethodCustomization removeAnnotation(String annotation);

    /**
     * Replace the modifier for this method.
     * <p>
     * For compound modifiers such as {@code public abstract} use bitwise OR ({@code |}) of multiple Modifiers, {@code
     * Modifier.PUBLIC | Modifier.ABSTRACT}.
     * <p>
     * Pass {@code 0} for {@code modifiers} to indicate that the method has no modifiers.
     *
     * @param modifiers The {@link Modifier Modifiers} for the method.
     * @return The updated MethodCustomization object.
     * @throws IllegalArgumentException If the {@code modifier} is less than to {@code 0} or any {@link Modifier}
     * included in the bitwise OR isn't a valid method {@link Modifier}.
     */
    MethodCustomization setModifier(int modifiers);

    /**
     * Replace the parameters of the method.
     *
     * @param newParameters New method parameters.
     * @return The updated MethodCustomization object.
     */
    MethodCustomization replaceParameters(String newParameters);

    /**
     * Replaces the parameters of the method and adds any additional imports required by the new parameters.
     *
     * @param newParameters New method parameters.
     * @param importsToAdd Any additional imports required by the method. These will be custom types or types that
     * are ambiguous on which to use such as {@code List} or the utility class {@code Arrays}.
     * @return A new MethodCustomization representing the updated method.
     */
    MethodCustomization replaceParameters(String newParameters, List<String> importsToAdd);

    /**
     * Replace the body of the method.
     *
     * @param newBody New method body.
     * @return The updated MethodCustomization object.
     */
    MethodCustomization replaceBody(String newBody);

    /**
     * Replaces the body of the method and adds any additional imports required by the new body.
     *
     * @param newBody New method body.
     * @param importsToAdd Any additional imports required by the method. These will be custom types or types that
     * are ambiguous on which to use such as {@code List} or the utility class {@code Arrays}.
     * @return A new MethodCustomization representing the updated method.
     */
    MethodCustomization replaceBody(String newBody, List<String> importsToAdd);

    /**
     * Change the return type of the method. The new return type will be automatically imported.
     *
     * <p>
     * The {@code returnValueFormatter} can be used to transform the return value. If the original return type is {@code
     * void}, simply pass the new return expression to {@code returnValueFormatter}; if the new return type is {@code
     * void}, pass {@code null} to {@code returnValueFormatter}; if either the original return type nor the new return
     * type is {@code void}, the {@code returnValueFormatter} should be a String formatter that contains exactly 1
     * instance of {@code %s}.
     *
     * @param newReturnType the simple name of the new return type
     * @param returnValueFormatter the return value String formatter as described above
     * @return the current method customization for chaining
     */
    MethodCustomization setReturnType(String newReturnType, String returnValueFormatter);

    /**
     * Change the return type of the method. The new return type will be automatically imported.
     *
     * <p>
     * The {@code returnValueFormatter} can be used to transform the return value. If the original return type is {@code
     * void}, simply pass the new return expression to {@code returnValueFormatter}; if the new return type is {@code
     * void}, pass {@code null} to {@code returnValueFormatter}; if either the original return type nor the new return
     * type is {@code void}, the {@code returnValueFormatter} should be a String formatter that contains exactly 1
     * instance of {@code %s}.
     *
     * @param newReturnType the simple name of the new return type
     * @param returnValueFormatter the return value String formatter as described above
     * @param replaceReturnStatement if set to {@code true}, the return statement will be replaced by the provided
     * returnValueFormatter text with exactly one instance of {@code %s}. If set to true, appropriate semi-colons,
     * parentheses, opening and closing of code blocks have to be taken care of in the {@code returnValueFormatter}.
     * @return the current method customization for chaining
     */
    MethodCustomization setReturnType(String newReturnType, String returnValueFormatter,
        boolean replaceReturnStatement);
}
