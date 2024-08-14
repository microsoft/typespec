// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.template;

import com.azure.autorest.model.clientmodel.ClientMethod;
import com.azure.autorest.model.clientmodel.ClientMethodExample;
import com.azure.autorest.model.clientmodel.TestContext;
import com.azure.autorest.model.clientmodel.examplemodel.ExampleHelperFeature;
import com.azure.autorest.model.javamodel.JavaFile;
import com.azure.autorest.template.example.ClientMethodExampleWriter;
import com.azure.autorest.template.example.ModelExampleWriter;
import com.azure.autorest.template.example.ProtocolTestWriter;
import com.azure.autorest.util.CodeNamer;

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
