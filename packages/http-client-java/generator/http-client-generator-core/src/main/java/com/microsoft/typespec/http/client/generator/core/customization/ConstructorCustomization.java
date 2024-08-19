// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.EclipseLanguageClient;
import org.eclipse.lsp4j.SymbolInformation;

import java.lang.reflect.Modifier;
import java.util.List;

/**
 * The constructor level customization for an AutoRest generated constructor.
 */
public final class ConstructorCustomization extends CodeCustomization {
    private final String packageName;
    private final String className;
    private final String constructorSignature;

    ConstructorCustomization(Editor editor, EclipseLanguageClient languageClient, String packageName, String className,
                             String constructorSignature, SymbolInformation symbol) {
        super(editor, languageClient, symbol);
        this.packageName = packageName;
        this.className = className;
        this.constructorSignature = constructorSignature;
    }

    /**
     * Gets the name of the class containing the constructor.
     *
     * @return The name of the class containing the constructor.
     */
    public String getClassName() {
        return className;
    }

    /**
     * Gets the Javadoc customization for this constructor.
     *
     * @return The Javadoc customization for this constructor.
     */
    public JavadocCustomization getJavadoc() {
        return new JavadocCustomization(editor, languageClient, fileUri, fileName,
            symbol.getLocation().getRange().getStart().getLine());
    }

    /**
     * Add an annotation to the constructor.
     *
     * @param annotation The annotation to add to the constructor. The leading @ can be omitted.
     * @return A new ConstructorCustomization representing the updated constructor.
     */
    public ConstructorCustomization addAnnotation(String annotation) {
        return Utils.addAnnotation(annotation, this, () -> refreshCustomization(constructorSignature));
    }

    /**
     * Remove an annotation from the constructor.
     *
     * @param annotation The annotation to remove from the constructor. The leading @ can be omitted.
     * @return A new ConstructorCustomization representing the updated constructor.
     */
    public ConstructorCustomization removeAnnotation(String annotation) {
        return Utils.removeAnnotation(this, compilationUnit -> compilationUnit.getClassByName(className).get()
                .getConstructors()
                .stream()
                .filter(ctor -> Utils.declarationContainsSymbol(ctor.getRange().get(), symbol.getLocation().getRange()))
                .findFirst().get()
                .getAnnotationByName(Utils.cleanAnnotationName(annotation)),
            () -> refreshCustomization(constructorSignature));
    }

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
    public ConstructorCustomization setModifier(int modifiers) {
        Utils.replaceModifier(symbol, editor, languageClient, "(?:.+ )?" + className + "\\(", className + "(",
            Modifier.constructorModifiers(), modifiers);

        return refreshCustomization(constructorSignature);
    }

    /**
     * Replace the parameters of the constructor.
     *
     * @param newParameters New constructor parameters.
     * @return A new ConstructorCustomization representing the updated constructor.
     */
    public ConstructorCustomization replaceParameters(String newParameters) {
        return replaceParameters(newParameters, null);
    }

    /**
     * Replaces the parameters of the constructor and adds any additional imports required by the new parameters.
     *
     * @param newParameters New constructor parameters.
     * @param importsToAdd Any additional imports required by the constructor. These will be custom types or types that
     * are ambiguous on which to use such as {@code List} or the utility class {@code Arrays}.
     * @return A new ConstructorCustomization representing the updated constructor.
     */
    public ConstructorCustomization replaceParameters(String newParameters, List<String> importsToAdd) {
        String newSignature = className + "(" + newParameters + ")";

        ClassCustomization classCustomization = new PackageCustomization(editor, languageClient, packageName)
            .getClass(className);

        ClassCustomization updatedClassCustomization = Utils.addImports(importsToAdd, classCustomization,
            classCustomization::refreshSymbol);

        return Utils.replaceParameters(newParameters, updatedClassCustomization.getConstructor(constructorSignature),
            () -> updatedClassCustomization.getConstructor(newSignature));
    }

    /**
     * Replace the body of the constructor.
     *
     * @param newBody New constructor body.
     * @return A new ConstructorCustomization representing the updated constructor.
     */
    public ConstructorCustomization replaceBody(String newBody) {
        return replaceBody(newBody, null);
    }

    /**
     * Replaces the body of the constructor and adds any additional imports required by the new body.
     *
     * @param newBody New constructor body.
     * @param importsToAdd Any additional imports required by the constructor. These will be custom types or types that
     * are ambiguous on which to use such as {@code List} or the utility class {@code Arrays}.
     * @return A new ConstructorCustomization representing the updated constructor.
     */
    public ConstructorCustomization replaceBody(String newBody, List<String> importsToAdd) {
        ClassCustomization classCustomization = new PackageCustomization(editor, languageClient, packageName)
            .getClass(className);

        ClassCustomization updatedClassCustomization = Utils.addImports(importsToAdd, classCustomization,
            classCustomization::refreshSymbol);

        return Utils.replaceBody(newBody, updatedClassCustomization.getConstructor(constructorSignature),
            () -> updatedClassCustomization.getConstructor(constructorSignature));
    }

    private ConstructorCustomization refreshCustomization(String constructorSignature) {
        return new PackageCustomization(editor, languageClient, packageName)
            .getClass(className)
            .getConstructor(constructorSignature);
    }
}
