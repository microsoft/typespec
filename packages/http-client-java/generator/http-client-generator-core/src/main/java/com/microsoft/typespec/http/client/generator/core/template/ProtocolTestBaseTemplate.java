// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.TestContext;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaVisibility;
import com.microsoft.typespec.http.client.generator.core.template.example.ProtocolTestWriter;

public class ProtocolTestBaseTemplate implements IJavaTemplate<TestContext, JavaFile> {

    private static final ProtocolTestBaseTemplate INSTANCE = new ProtocolTestBaseTemplate();

    protected ProtocolTestBaseTemplate() {
    }

    public static ProtocolTestBaseTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(TestContext testContext, JavaFile context) {

        ProtocolTestWriter writer = new ProtocolTestWriter(testContext);

        context.lineComment(javaLineComment -> {
            javaLineComment.line("The Java test files under 'generated' package are generated for your reference.");
            javaLineComment.line("If you wish to modify these files, please copy them out of the 'generated' package, and modify there.");
            javaLineComment.line("See https://aka.ms/azsdk/dpg/java/tests for guide on adding a test.");
        });
        context.line();

        context.declareImport(writer.getImports());

        context.classBlock(JavaVisibility.PackagePrivate, null, String.format("%s extends TestProxyTestBase", testContext.getTestBaseClassName()), classBlock -> {

            writer.writeClientVariables(classBlock);

            classBlock.annotation("Override");
            classBlock.method(JavaVisibility.Protected, null, "void beforeTest()", writer::writeClientInitialization);
        });
    }
}
