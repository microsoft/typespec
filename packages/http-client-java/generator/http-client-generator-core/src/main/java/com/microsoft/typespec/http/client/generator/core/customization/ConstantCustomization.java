// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import java.lang.reflect.Modifier;

/**
 * Customization for an AutoRest generated constant property.
 * <p>
 * For instance property customizations use {@link PropertyCustomization}.
 */
public interface ConstantCustomization extends CodeCustomization {
    /**
     * Gets the name of the class that contains this constant.
     *
     * @return The name of the class that contains this constant.
     */
    String getClassName();

    /**
     * Gets the name of this constant.
     *
     * @return The name of this constant.
     */
    String getConstantName();

    /**
     * Gets the Javadoc customization for this constant.
     *
     * @return The Javadoc customization.
     */
    JavadocCustomization getJavadoc();

    /**
     * Replace the modifier for this constant.
     * <p>
     * For compound modifiers such as {@code public abstract} use bitwise OR ({@code |}) of multiple Modifiers, {@code
     * Modifier.PUBLIC | Modifier.ABSTRACT}.
     * <p>
     * This operation doesn't allow for the constant to lose constant status, so
     * {@code Modifier.STATIC | Modifier.FINAL} will be added to the passed {@code modifiers}.
     * <p>
     * Pass {@code 0} for {@code modifiers} to indicate that the constant has no modifiers.
     *
     * @param modifiers The {@link Modifier Modifiers} for the constant.
     * @return The updated ConstantCustomization object.
     * @throws IllegalArgumentException If the {@code modifier} is less than to {@code 0} or any {@link Modifier}
     * included in the bitwise OR isn't a valid constant {@link Modifier}.
     */
    ConstantCustomization setModifier(int modifiers);

    /**
     * Renames the constant.
     * <p>
     * This operation doesn't allow for the constant to lose naming conventions of capitalized and underscore delimited
     * words, so the {@code newName} will be capitalized.
     * <p>
     * This is a refactor operation, all references of the constant will be renamed and the getter method(s) for this
     * property will be renamed accordingly as well.
     *
     * @param newName The new name for the constant.
     * @return A new instance of {@link ConstantCustomization} for chaining.
     * @throws NullPointerException If {@code newName} is null.
     */
    ConstantCustomization rename(String newName);

    /**
     * Add an annotation to a property in the class.
     *
     * @param annotation the annotation to add. The leading @ can be omitted.
     * @return A new instance of {@link ConstantCustomization} for chaining.
     */
    ConstantCustomization addAnnotation(String annotation);

    /**
     * Remove an annotation from the constant.
     *
     * @param annotation the annotation to remove from the constant. The leading @ can be omitted.
     * @return A new instance of {@link ConstantCustomization} for chaining.
     */
    ConstantCustomization removeAnnotation(String annotation);
}
