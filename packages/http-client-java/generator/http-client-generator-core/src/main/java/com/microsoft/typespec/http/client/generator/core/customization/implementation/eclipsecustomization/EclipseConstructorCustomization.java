// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization.implementation.eclipsecustomization;

import com.microsoft.typespec.http.client.generator.core.customization.ConstructorCustomization;
import com.microsoft.typespec.http.client.generator.core.customization.Editor;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.EclipseLanguageClient;
import java.lang.reflect.Modifier;
import java.util.List;
import org.eclipse.lsp4j.SymbolInformation;

/**
 * The constructor level customization for an AutoRest generated constructor.
 */
public final class EclipseConstructorCustomization extends EclipseCodeCustomization
    implements ConstructorCustomization {
    private final String packageName;
    private final String className;
    private final String constructorSignature;

    EclipseConstructorCustomization(Editor editor, EclipseLanguageClient languageClient, String packageName,
        String className, String constructorSignature, SymbolInformation symbol) {
        super(editor, languageClient, symbol);
        this.packageName = packageName;
        this.className = className;
        this.constructorSignature = constructorSignature;
    }

    @Override
    public String getClassName() {
        return className;
    }

    @SuppressWarnings("deprecation")
    @Override
    public EclipseJavadocCustomization getJavadoc() {
        return new EclipseJavadocCustomization(editor, languageClient, fileUri, fileName,
            symbol.getLocation().getRange().getStart().getLine());
    }

    @Override
    public EclipseConstructorCustomization addAnnotation(String annotation) {
        return EclipseUtils.addAnnotation(annotation, this, () -> refreshCustomization(constructorSignature));
    }

    @SuppressWarnings({ "OptionalGetWithoutIsPresent", "deprecation" })
    @Override
    public EclipseConstructorCustomization removeAnnotation(String annotation) {
        return EclipseUtils.removeAnnotation(this, compilationUnit -> compilationUnit.getClassByName(className)
            .get()
            .getConstructors()
            .stream()
            .filter(
                ctor -> EclipseUtils.declarationContainsSymbol(ctor.getRange().get(), symbol.getLocation().getRange()))
            .findFirst()
            .get()
            .getAnnotationByName(Utils.cleanAnnotationName(annotation)),
            () -> refreshCustomization(constructorSignature));
    }

    @Override
    public EclipseConstructorCustomization setModifier(int modifiers) {
        EclipseUtils.replaceModifier(symbol, editor, languageClient, "(?:.+ )?" + className + "\\(", className + "(",
            Modifier.constructorModifiers(), modifiers);

        return refreshCustomization(constructorSignature);
    }

    @Override
    public EclipseConstructorCustomization replaceParameters(String newParameters) {
        return replaceParameters(newParameters, null);
    }

    @Override
    public EclipseConstructorCustomization replaceParameters(String newParameters, List<String> importsToAdd) {
        String newSignature = className + "(" + newParameters + ")";

        EclipseClassCustomization classCustomization
            = new EclipsePackageCustomization(editor, languageClient, packageName).getClass(className);

        EclipseClassCustomization updatedClassCustomization
            = EclipseUtils.addImports(importsToAdd, classCustomization, classCustomization::refreshSymbol);

        return EclipseUtils.replaceParameters(newParameters,
            updatedClassCustomization.getConstructor(constructorSignature),
            () -> updatedClassCustomization.getConstructor(newSignature));
    }

    @Override
    public EclipseConstructorCustomization replaceBody(String newBody) {
        return replaceBody(newBody, null);
    }

    @Override
    public EclipseConstructorCustomization replaceBody(String newBody, List<String> importsToAdd) {
        EclipseClassCustomization classCustomization
            = new EclipsePackageCustomization(editor, languageClient, packageName).getClass(className);

        EclipseClassCustomization updatedClassCustomization
            = EclipseUtils.addImports(importsToAdd, classCustomization, classCustomization::refreshSymbol);

        return EclipseUtils.replaceBody(newBody, updatedClassCustomization.getConstructor(constructorSignature),
            () -> updatedClassCustomization.getConstructor(constructorSignature));
    }

    private EclipseConstructorCustomization refreshCustomization(String constructorSignature) {
        return new EclipsePackageCustomization(editor, languageClient, packageName).getClass(className)
            .getConstructor(constructorSignature);
    }
}
