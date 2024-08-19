// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;

public class JavaFile implements JavaContext {
    private String packageKeyword;
    private int packageWithPeriodLength;
    private final String filePath;
    private final JavaFileContents contents;

    public JavaFile(String filePath) {
        this.filePath = filePath;
        this.contents = new JavaFileContents();
    }

    public final String getFilePath() {
        return filePath;
    }

    public final JavaFileContents getContents() {
        return contents;
    }

    public final void text(String text) {
        getContents().text(text);
    }

    public final void line(String text) {
        getContents().line(text);
    }

    public final void line() {
        getContents().line();
    }

    public final void indent(Runnable indentAction) {
        getContents().indent(indentAction);
    }

    public final void publicFinalClass(String classDeclaration, Consumer<JavaClass> classAction) {
        publicClass(Collections.singletonList(JavaModifier.Final), classDeclaration, classAction);
    }

    public final void publicClass(List<JavaModifier> modifiers, String classDeclaration, Consumer<JavaClass> classAction) {
        classBlock(JavaVisibility.Public, modifiers, classDeclaration, classAction);
    }

    public final void classBlock(JavaVisibility visibility, List<JavaModifier> modifiers, String classDeclaration, Consumer<JavaClass> classAction) {
        getContents().classBlock(visibility, modifiers, classDeclaration, classAction);
    }

    public final void declarePackage(String packageKeyword) {
        this.packageKeyword = packageKeyword;
        if (packageKeyword == null || packageKeyword.isEmpty()) {
            packageWithPeriodLength = 0;
        } else {
            packageWithPeriodLength = packageKeyword.length();
            if (!packageKeyword.endsWith(".")) {
                ++packageWithPeriodLength;
            }
        }
        getContents().declarePackage(packageKeyword);
    }

    public final void declareImport(String... imports) {
        declareImport(Arrays.asList(imports));
    }

    public final void declareImport(Set<String> imports) {
        declareImport(new ArrayList<>(imports));
    }

    public final void declareImport(List<String> imports) {
        if (packageKeyword != null && !packageKeyword.isEmpty()) {
            // Only import paths that don't start with this file's package, or if they do start
            // with this file's package, then they must exist within a subpackage.
            imports = imports.stream()
                    .filter(importKeyword -> !importKeyword.startsWith(packageKeyword)
                            || importKeyword.indexOf('.', packageWithPeriodLength) != -1)
                    .collect(Collectors.toList());
        }
        getContents().declareImport(imports);
    }

    public final void javadocComment(Consumer<JavaJavadocComment> commentAction) {
        getContents().javadocComment(commentAction);
    }

    public final void lineComment(Consumer<JavaLineComment> commentAction) {
        getContents().lineComment(commentAction);
    }

    public final void annotation(String... annotations) {
        getContents().annotation(annotations);
    }

    public final void publicEnum(String enumName, Consumer<JavaEnum> enumAction) {
        enumBlock(JavaVisibility.Public, enumName, enumAction);
    }

    public final void enumBlock(JavaVisibility visibility, String enumName, Consumer<JavaEnum> enumAction) {
        getContents().enumBlock(visibility, enumName, enumAction);
    }

    public final void publicInterface(String interfaceName, Consumer<JavaInterface> interfaceAction) {
        interfaceBlock(JavaVisibility.Public, interfaceName, interfaceAction);
    }

    public final void interfaceBlock(JavaVisibility visibility, String interfaceName, Consumer<JavaInterface> interfaceAction) {
        getContents().interfaceBlock(visibility, interfaceName, interfaceAction);
    }
}
