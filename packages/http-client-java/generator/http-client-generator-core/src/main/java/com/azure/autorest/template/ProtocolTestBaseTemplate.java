// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.template;

import com.azure.autorest.model.clientmodel.TestContext;
import com.azure.autorest.model.javamodel.JavaFile;
import com.azure.autorest.model.javamodel.JavaVisibility;
import com.azure.autorest.template.example.ProtocolTestWriter;

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
