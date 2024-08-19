// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.EclipseLanguageClient;
import org.eclipse.lsp4j.SymbolInformation;

import java.lang.annotation.Annotation;

public final class AnnotationCustomization<A extends Annotation> extends CodeCustomization {
    private final String packageName;
    private final String className;
    private final String methodName;
    private final String fieldName;
    private final A annotation;

    static <A extends Annotation> AnnotationCustomization<A> createClassAnnotationCustomization(Editor editor,
                                                                                                EclipseLanguageClient languageClient, SymbolInformation symbol, String packageName, String className,
                                                                                                A annotation) {
        return new AnnotationCustomization<>(editor, languageClient, symbol, packageName, className, null, null,
            annotation);
    }

    static <A extends Annotation> AnnotationCustomization<A> createMethodAnnotationCustomization(Editor editor,
        EclipseLanguageClient languageClient, SymbolInformation symbol, String packageName, String className,
        String methodName, A annotation) {
        return new AnnotationCustomization<>(editor, languageClient, symbol, packageName, className, methodName, null,
            annotation);
    }

    static <A extends Annotation> AnnotationCustomization<A> createFieldAnnotationCustomization(Editor editor,
        EclipseLanguageClient languageClient, SymbolInformation symbol, String packageName, String className,
        String fieldName, A annotation) {
        return new AnnotationCustomization<>(editor, languageClient, symbol, packageName, className, null, fieldName,
            annotation);
    }

    private AnnotationCustomization(Editor editor, EclipseLanguageClient languageClient, SymbolInformation symbol,
        String packageName, String className, String methodName, String fieldName, A annotation) {
        super(editor, languageClient, symbol);
        this.packageName = packageName;
        this.className = className;
        this.methodName = methodName;
        this.fieldName = fieldName;
        this.annotation = annotation;
    }
}
