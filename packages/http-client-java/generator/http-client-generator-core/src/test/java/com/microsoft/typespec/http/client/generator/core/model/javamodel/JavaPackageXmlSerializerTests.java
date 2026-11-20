// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.javamodel;

import com.github.javaparser.StaticJavaParser;
import com.github.javaparser.ast.expr.MethodCallExpr;
import com.github.javaparser.ast.stmt.ThrowStmt;
import com.microsoft.typespec.http.client.generator.core.MockUnitJavagen;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.parallel.Isolated;

@Isolated
public class JavaPackageXmlSerializerTests {
    @AfterEach
    public void restoreSettings() {
        new MockUnitJavagen();
        JavaSettings.clear();
    }

    @Test
    public void logsThrownExceptions() {
        JavaSettings.clear();
        JavaPackage javaPackage = new JavaPackage(new MockUnitJavagen());
        javaPackage.addJavaFromResources("com.azure.mock.xml", "XmlSerializer");

        String source = javaPackage.getJavaFiles().get(0).getContents().toString();
        List<ThrowStmt> throwsStatements = StaticJavaParser.parse(source).findAll(ThrowStmt.class);
        Assertions.assertFalse(throwsStatements.isEmpty());
        for (ThrowStmt statement : throwsStatements) {
            MethodCallExpr call
                = Assertions.assertInstanceOf(MethodCallExpr.class, statement.getExpression(), statement.toString());
            Assertions.assertEquals("LOGGER", call.getScope().orElseThrow().toString());
            Assertions.assertEquals("logExceptionAsError", call.getNameAsString());
        }
    }
}
