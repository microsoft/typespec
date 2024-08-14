// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.azure.core.util.CoreUtils;

import java.util.Collections;
import java.util.List;
import java.util.function.Consumer;

public class JavaEnum {
    private final JavaFileContents contents;
    private boolean previouslyAddedValue;
    private boolean addNewLine;

    public JavaEnum(JavaFileContents contents) {
        this.contents = contents;
    }

    private void addExpectedNewLine() {
        if (addNewLine) {
            contents.line();
            addNewLine = false;
        }
    }

    private void addExpectedCommaAndNewLine() {
        if (previouslyAddedValue) {
            contents.line(",");
            previouslyAddedValue = false;
        }

        addExpectedNewLine();
    }

    private void addExpectedSemicolonAndNewLine() {
        if (previouslyAddedValue) {
            contents.line(";");
            previouslyAddedValue = false;
        }

        addExpectedNewLine();
    }

    public final void addExpectedNewLineAfterLastValue() {
        if (previouslyAddedValue) {
            contents.line();
            previouslyAddedValue = false;
            addNewLine = false;
        }
    }

    public final void value(String name, String value) {
        addExpectedCommaAndNewLine();
        contents.javadocComment("Enum value " + value + ".");
        contents.text(name + "(\"" + value + "\")");
        previouslyAddedValue = true;
        addNewLine = true;
    }

    public final void value(String name, String value, String description, IType type) {
        addExpectedCommaAndNewLine();
        contents.javadocComment(CoreUtils.isNullOrEmpty(description) ? "Enum value " + value + "." : description);
        contents.text(name + "(" + type.defaultValueExpression(value) + ")");
        previouslyAddedValue = true;
        addNewLine = true;
    }

    public final void privateFinalMemberVariable(String variableType, String variableName) {
        addExpectedSemicolonAndNewLine();
        contents.line("private final " + variableType + " " + variableName + ";");
        addNewLine = true;
    }

    public final void constructor(String constructorSignature, Consumer<JavaBlock> constructor) {
        addExpectedSemicolonAndNewLine();
        contents.block(constructorSignature, constructor);
        previouslyAddedValue = false;
        addNewLine = true;
    }

    public final void method(JavaVisibility visibility, List<JavaModifier> modifiers, String methodSignature, Consumer<JavaBlock> method) {
        addExpectedSemicolonAndNewLine();
        contents.method(visibility, modifiers, methodSignature, method);
        previouslyAddedValue = false;
        addNewLine = true;
    }

    public final void publicMethod(String methodSignature, Consumer<JavaBlock> method) {
        method(JavaVisibility.Public, null, methodSignature, method);
    }

    public final void publicStaticMethod(String methodSignature, Consumer<JavaBlock> method) {
        method(JavaVisibility.Public, Collections.singletonList(JavaModifier.Static), methodSignature, method);
    }

    public final void javadocComment(String description) {
        addExpectedSemicolonAndNewLine();
        contents.javadocComment(description);
    }

    public final void javadocComment(Consumer<JavaJavadocComment> commentAction) {
        addExpectedSemicolonAndNewLine();
        contents.javadocComment(commentAction);
    }

    public final void annotation(String... annotations) {
        addExpectedSemicolonAndNewLine();
        contents.annotation(annotations);
    }
}
