// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentExampleLiveTestStep;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentLiveTestCase;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentLiveTestStep;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentLiveTests;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleHelperFeature;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.example.ModelExampleWriter;
import com.azure.core.util.CoreUtils;

import java.util.ArrayList;

public class FluentLiveTestsTemplate {

    private static final FluentLiveTestsTemplate INSTANCE = new FluentLiveTestsTemplate();

    public static FluentLiveTestsTemplate getInstance(){
        return INSTANCE;
    }

    public void write(FluentLiveTests liveTests, JavaFile javaFile) {
        // write class
        addImports(liveTests, javaFile);
        javaFile.publicClass(new ArrayList<>(), liveTests.getClassName() + " extends TestBase", classBlock->{
            for (FluentLiveTestCase testCase : liveTests.getTestCases()) {
                // write manager field
                classBlock.privateMemberVariable(liveTests.getManagerType().getName(), liveTests.getManagerName());
                // write setup
                classBlock.annotation("Override");
                classBlock.publicMethod("void beforeTest()", methodBlock -> methodBlock.line(
                    String.format(
                        "%s = %s.configure().withLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC))" +
                            ".authenticate(" +
                            "new DefaultAzureCredentialBuilder().build(), new AzureProfile(AzureEnvironment.AZURE)" +
                            ");", liveTests.getManagerName(), liveTests.getManagerType().getName())
                ));
                // write method signature
                if (!CoreUtils.isNullOrEmpty(testCase.getDescription())) {
                    classBlock.javadocComment(testCase.getDescription());
                }
                classBlock.annotation("Test");
                classBlock.annotation("DoNotRecord(skipInPlayback = true)");
                String methodSignature = String.format("%s %s()", "void", getTestMethodName(testCase.getMethodName()));
                if (testCase.getHelperFeatures().contains(ExampleHelperFeature.ThrowsIOException)) {
                    methodSignature += " throws IOException";
                }
                classBlock.publicMethod(methodSignature, methodBlock -> {
                    for (FluentLiveTestStep step : testCase.getSteps()) {
                        if (step instanceof FluentExampleLiveTestStep) {
                            if (!CoreUtils.isNullOrEmpty(step.getDescription())) {
                                methodBlock.line("// " + step.getDescription());
                            }
                            FluentExampleLiveTestStep exampleStep = (FluentExampleLiveTestStep) step;
                            methodBlock.line(exampleStep.getExampleMethod().getMethodContent());
                        }
                        methodBlock.line();
                    }
                });
            }
            if (liveTests.getHelperFeatures().contains(ExampleHelperFeature.MapOfMethod)) {
                ModelExampleWriter.writeMapOfMethod(classBlock);
            }
        });
    }
    private String getTestMethodName(String methodName) {
        return methodName.endsWith("Test") ? methodName : methodName + "Test";
    }

    private void addImports(FluentLiveTests liveTests, JavaFile javaFile) {
        javaFile.declareImport(liveTests.getImports());
        javaFile.declareImport(liveTests.getManagerType().getFullName());
        javaFile.declareImport("org.junit.jupiter.api.Test", "org.junit.jupiter.api.BeforeEach");
        javaFile.declareImport("com.azure.identity.DefaultAzureCredentialBuilder", "com.azure.core.management.profile.AzureProfile", "com.azure.core.management.AzureEnvironment");
        javaFile.declareImport("com.azure.core.test.annotation.DoNotRecord", "com.azure.core.test.TestBase");
        javaFile.declareImport("com.azure.core.http.policy.HttpLogOptions", "com.azure.core.http.policy.HttpLogDetailLevel");
    }
}
