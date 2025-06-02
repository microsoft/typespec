// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import java.lang.reflect.Modifier;
import java.util.List;

/**
 * The constructor level customization for an AutoRest generated constructor.
 */
public interface ConstructorCustomization extends CodeCustomization {
    /**
     * Gets the name of the class containing the constructor.
     *
     * @return The name of the class containing the constructor.
     */
    String getClassName();

    /**
     * Gets the Javadoc customization for this constructor.
     *
     * @return The Javadoc customization for this constructor.
     */
    JavadocCustomization getJavadoc();

    /**
     * Add an annotation to the constructor.
     *
     * @param annotation The annotation to add to the constructor. The leading @ can be omitted.
     * @return A new ConstructorCustomization representing the updated constructor.
     */
    ConstructorCustomization addAnnotation(String annotation);

    /**
     * Remove an annotation from the constructor.
     *
     * @param annotation The annotation to remove from the constructor. The leading @ can be omitted.
     * @return A new ConstructorCustomization representing the updated constructor.
     */
    ConstructorCustomization removeAnnotation(String annotation);

    /**
     * Replace the modifier for this constructor.
     * <p>
     * For compound modifiers such as {@code public abstract} use bitwise OR ({@code |}) of multiple Modifiers,
     * {@code Modifier.PUBLIC | Modifier.ABSTRACT}.
     * <p>
     * Pass {@code 0} for {@code modifiers} to indicate that the constructor has no modifiers.
     *
     * @param modifiers The {@link Modifier Modifiers} for the constructor.
     * @return A new ConstructorCustomization representing the updated constructor.
     * @throws IllegalArgumentException If the {@code modifier} is less than to {@code 0} or any {@link Modifier}
     * included in the bitwise OR isn't a valid constructor {@link Modifier}.
     */
    ConstructorCustomization setModifier(int modifiers);

    /**
     * Replace the parameters of the constructor.
     *
     * @param newParameters New constructor parameters.
     * @return A new ConstructorCustomization representing the updated constructor.
     */
    ConstructorCustomization replaceParameters(String newParameters);

    /**
     * Replaces the parameters of the constructor and adds any additional imports required by the new parameters.
     *
     * @param newParameters New constructor parameters.
     * @param importsToAdd Any additional imports required by the constructor. These will be custom types or types that
     * are ambiguous on which to use such as {@code List} or the utility class {@code Arrays}.
     * @return A new ConstructorCustomization representing the updated constructor.
     */
    ConstructorCustomization replaceParameters(String newParameters, List<String> importsToAdd);

    /**
     * Replace the body of the constructor.
     *
     * @param newBody New constructor body.
     * @return A new ConstructorCustomization representing the updated constructor.
     */
    ConstructorCustomization replaceBody(String newBody);

    /**
     * Replaces the body of the constructor and adds any additional imports required by the new body.
     *
     * @param newBody New constructor body.
     * @param importsToAdd Any additional imports required by the constructor. These will be custom types or types that
     * are ambiguous on which to use such as {@code List} or the utility class {@code Arrays}.
     * @return A new ConstructorCustomization representing the updated constructor.
     */
    ConstructorCustomization replaceBody(String newBody, List<String> importsToAdd);
}
