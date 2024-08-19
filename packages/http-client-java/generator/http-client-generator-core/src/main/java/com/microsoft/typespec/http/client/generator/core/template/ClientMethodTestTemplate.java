// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.TestContext;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleHelperFeature;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.example.ClientMethodExampleWriter;
import com.microsoft.typespec.http.client.generator.core.template.example.ModelExampleWriter;
import com.microsoft.typespec.http.client.generator.core.template.example.ProtocolTestWriter;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

import java.util.Set;

public class ClientMethodTestTemplate implements IJavaTemplate<TestContext<ClientMethodExample>, JavaFile> {

    private static final ClientMethodTestTemplate INSTANCE = new ClientMethodTestTemplate();

    protected ClientMethodTestTemplate() {
    }

    public static ClientMethodTestTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(TestContext<ClientMethodExample> testContext, JavaFile context) {

        final String className = testContext.getTestCase().getFilename() + "Tests";

        ProtocolTestWriter writer = new ProtocolTestWriter(testContext);
        ClientMethodExample clientMethodExample = testContext.getTestCase();
        ClientMethod clientMethod = clientMethodExample.getClientMethod();
        ClientMethodExampleWriter caseWriter = new ClientMethodExampleWriter(
                clientMethod,
                CodeNamer.toCamelCase(clientMethodExample.getSyncClient().getClassName()),
                clientMethodExample.getProxyMethodExample());

        Set<String> imports = writer.getImports();
        clientMethod.getReturnValue().getType().addImportsTo(imports, false);
        imports.addAll(caseWriter.getImports());
        context.declareImport(imports);

        context.annotation("Disabled");
        context.publicFinalClass(String.format("%1$s extends %2$s", className, testContext.getTestBaseClassName()), classBlock -> {
            classBlock.annotation("Test", "Disabled");  // "DoNotRecord(skipInPlayback = true)" not added
            Set<ExampleHelperFeature> helperFeatures = caseWriter.getHelperFeatures();
            String methodSignature = String.format("void test%1$s()", className);
            if (helperFeatures.contains(ExampleHelperFeature.ThrowsIOException)) {
                methodSignature += " throws IOException";
            }
            classBlock.publicMethod(methodSignature, methodBlock -> {
                methodBlock.line("// method invocation");
                caseWriter.writeClientMethodInvocation(methodBlock, true);
                caseWriter.writeAssertion(methodBlock);
            });
            if (helperFeatures.contains(ExampleHelperFeature.MapOfMethod)) {
                ModelExampleWriter.writeMapOfMethod(classBlock);
            }
        });
    }
}
