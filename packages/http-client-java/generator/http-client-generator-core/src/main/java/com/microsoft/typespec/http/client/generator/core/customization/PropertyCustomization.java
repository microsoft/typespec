// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import java.lang.reflect.Modifier;

/**
 * Customization for an AutoRest generated instance property.
 * <p>
 * For constant property customizations use {@link ConstantCustomization}.
 */
public interface PropertyCustomization extends CodeCustomization {
    /**
     * Gets the name of the class that contains this property.
     *
     * @return The name of the class that contains this property.
     */
    String getClassName();

    /**
     * Gets the name of this property.
     *
     * @return The name of this property.
     */
    String getPropertyName();

    /**
     * Rename a property in the class. This is a refactor operation. All references of the property will be renamed and
     * the getter and setter method(s) for this property will be renamed accordingly as well.
     *
     * @param newName the new name for the property
     * @return the current class customization for chaining
     */
    PropertyCustomization rename(String newName);

    /**
     * Add an annotation to a property in the class.
     *
     * @param annotation the annotation to add. The leading @ can be omitted.
     * @return the current property customization for chaining
     */
    PropertyCustomization addAnnotation(String annotation);

    /**
     * Remove an annotation from the property.
     *
     * @param annotation the annotation to remove from the property. The leading @ can be omitted.
     * @return the current property customization for chaining
     */
    PropertyCustomization removeAnnotation(String annotation);

    /**
     * Generates a getter and a setter method(s) for a property in the class. This is a refactor operation. If a getter
     * or a setter is already available on the class, the current getter or setter will be kept.
     *
     * @return the current class customization for chaining
     */
    PropertyCustomization generateGetterAndSetter();

    /**
     * Replace the modifier for this property.
     * <p>
     * For compound modifiers such as {@code public final} use bitwise OR ({@code |}) of multiple Modifiers, {@code
     * Modifier.PUBLIC | Modifier.FINAL}.
     * <p>
     * Pass {@code 0} for {@code modifiers} to indicate that the property has no modifiers.
     *
     * @param modifiers The {@link Modifier Modifiers} for the property.
     * @return The updated PropertyCustomization object.
     * @throws IllegalArgumentException If the {@code modifier} is less than {@code 0} or any {@link Modifier} included
     * in the bitwise OR isn't a valid property {@link Modifier}.
     */
    PropertyCustomization setModifier(int modifiers);
}
