// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import com.github.javaparser.ast.CompilationUnit;
import java.lang.reflect.Modifier;
import java.util.List;
import java.util.function.Consumer;

/**
 * The class level customization for an AutoRest generated class.
 */
public interface ClassCustomization extends CodeCustomization {
    /**
     * Gets the name of the class this customization is using.
     *
     * @return The name of the class.
     */
    String getClassName();

    /**
     * Adds imports to the class.
     *
     * @param imports Imports to add.
     * @return A new {@link ClassCustomization} updated with the new imports for chaining.
     */
    ClassCustomization addImports(String... imports);

    /**
     * Adds a static block to the class. The {@code staticCodeBlock} should include the static keyword followed by
     * the static code.
     * 
     * @param staticCodeBlock The static code block including the static keyword.
     * @return The updated {@link ClassCustomization}.
     */
    ClassCustomization addStaticBlock(String staticCodeBlock);

    /**
     * Adds a static block to the class.
     *
     * @param staticCodeBlock The static code block. If this is {@code null} or an empty string, the class is not
     * modified and the {@link ClassCustomization} instance is returned without any change.
     * @param importsToAdd The list of imports to add to the class.
     * @return The updated {@link ClassCustomization}.
     */
    ClassCustomization addStaticBlock(String staticCodeBlock, List<String> importsToAdd);

    /**
     * Gets the method level customization for a method in the class.
     *
     * @param methodNameOrSignature the method name or signature
     * @return the method level customization
     */
    MethodCustomization getMethod(String methodNameOrSignature);

    /**
     * Gets the constructor level customization for a constructor in the class.
     * <p>
     * If only the constructor name is passed and the class has multiple constructors an error will be thrown to prevent
     * ambiguous runtime behavior.
     *
     * @param constructorNameOrSignature The constructor name or signature.
     * @return The constructor level customization.
     * @throws IllegalStateException If only the constructor name is passed and the class has multiple constructors.
     */
    ConstructorCustomization getConstructor(String constructorNameOrSignature);

    /**
     * Gets the property level customization for a property in the class.
     * <p>
     * For constant properties use {@link #getConstant(String)}.
     *
     * @param propertyName the property name
     * @return the property level customization
     */
    PropertyCustomization getProperty(String propertyName);

    /**
     * Gets the constant level customization for a constant in the class.
     * <p>
     * For instance properties use {@link #getProperty(String)}.
     *
     * @param constantName The constant name.
     * @return The constant level customization.
     */
    ConstantCustomization getConstant(String constantName);

    /**
     * Gets the Javadoc customization for this class.
     *
     * @return the Javadoc customization
     */
    JavadocCustomization getJavadoc();

    /**
     * Adds a constructor to this class.
     *
     * @param constructor The entire constructor as a literal string.
     * @return The constructor level customization for the added constructor.
     */
    ConstructorCustomization addConstructor(String constructor);

    /**
     * Adds a constructor to this class.
     *
     * @param constructor The entire constructor as a literal string.
     * @param importsToAdd Any additional imports required by the constructor. These will be custom types or types that
     * are ambiguous on which to use such as {@code List} or the utility class {@code Arrays}.
     * @return The constructor level customization for the added constructor.
     */
    ConstructorCustomization addConstructor(String constructor, List<String> importsToAdd);

    /**
     * Adds a method to this class.
     *
     * @param method The entire method as a literal string.
     * @return The method level customization for the added method.
     */
    MethodCustomization addMethod(String method);

    /**
     * Adds a method to this class.
     *
     * @param method The entire method as a literal string.
     * @param importsToAdd Any additional imports required by the constructor. These will be custom types or types that
     * are ambiguous on which to use such as {@code List} or the utility class {@code Arrays}.
     * @return The method level customization for the added method.
     */
    MethodCustomization addMethod(String method, List<String> importsToAdd);

    /**
     * Removes a method from this class.
     * <p>
     * If there exists multiple methods with the same name or signature only the first one found will be removed.
     * <p>
     * This method doesn't update usages of the method being removed. If the method was used elsewhere those usages will
     * have to be updated or removed in another customization, or customizations.
     * <p>
     * If this removes the only method contained in the class this will result in a class with no methods.
     *
     * @param methodNameOrSignature The name or signature of the method being removed.
     * @return The current ClassCustomization.
     */
    ClassCustomization removeMethod(String methodNameOrSignature);

    /**
     * Renames a class in the package.
     *
     * @param newName the new simple name for this class
     * @return The current ClassCustomization.
     */
    ClassCustomization rename(String newName);

    /**
     * Replace the modifier for this class.
     * <p>
     * For compound modifiers such as {@code public abstract} use bitwise OR ({@code |}) of multiple Modifiers, {@code
     * Modifier.PUBLIC | Modifier.ABSTRACT}.
     * <p>
     * Pass {@code 0} for {@code modifiers} to indicate that the method has no modifiers.
     *
     * @param modifiers The {@link Modifier Modifiers} for the class.
     * @return The updated ClassCustomization object.
     * @throws IllegalArgumentException If the {@code modifier} is less than {@code 0} or any {@link Modifier} included
     * in the bitwise OR isn't a valid class {@link Modifier}.
     */
    ClassCustomization setModifier(int modifiers);

    /**
     * Add an annotation on the class. The annotation class will be automatically imported.
     *
     * @param annotation the annotation to add to the class. The leading @ can be omitted.
     * @return the current class customization for chaining
     */
    ClassCustomization addAnnotation(String annotation);

    /**
     * Remove an annotation from the class.
     *
     * @param annotation the annotation to remove from the class. The leading @ can be omitted.
     * @return the current class customization for chaining
     */
    ClassCustomization removeAnnotation(String annotation);

    /**
     * Rename an enum member if the current class is an enum class.
     *
     * @param enumMemberName the current enum member name
     * @param newName the new enum member name
     * @return the current class customization for chaining
     */
    ClassCustomization renameEnumMember(String enumMemberName, String newName);

    /**
     * Allows for a fully controlled modification of the abstract syntax tree that represents this class.
     *
     * @param astCustomization The abstract syntax tree customization callback.
     * @return A new ClassCustomization for this class with the abstract syntax tree changes applied.
     */
    ClassCustomization customizeAst(Consumer<CompilationUnit> astCustomization);

    ClassCustomization refreshSymbol();
}
