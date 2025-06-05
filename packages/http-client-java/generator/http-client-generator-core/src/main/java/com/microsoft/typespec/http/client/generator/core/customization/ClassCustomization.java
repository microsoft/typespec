// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.CompilationUnit;
import java.util.function.Consumer;

/**
 * The class level customization for an AutoRest generated class.
 */
public final class ClassCustomization extends CodeCustomization {
    private final String className;

    ClassCustomization(Editor editor, String packageName, String className) {
        super(editor, packageName, className);
        this.className = className;
    }

    /**
     * Gets the name of the class this customization is using.
     *
     * @return The name of the class.
     */
    public String getClassName() {
        return className;
    }

    /**
     * Allows for a fully controlled modification of the abstract syntax tree that represents this class.
     *
     * @param astCustomization The abstract syntax tree customization callback.
     * @return This ClassCustomization with the abstract syntax tree changes applied.
     */
    public ClassCustomization customizeAst(Consumer<CompilationUnit> astCustomization) {
        CompilationUnit astToEdit = StaticJavaParser.parse(editor.getFileContent(fileName));
        astCustomization.accept(astToEdit);
        editor.replaceFile(fileName, astToEdit.toString());

        return this;
    }
}
