// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ConvenienceMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.examplemodel.ExampleHelperFeature;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.template.example.ClientInitializationExampleWriter;
import com.microsoft.typespec.http.client.generator.core.template.example.ClientMethodExampleWriter;
import com.microsoft.typespec.http.client.generator.core.template.example.ModelExampleWriter;

import java.util.HashSet;
import java.util.Set;

public class ClientMethodSampleTemplate implements IJavaTemplate<ClientMethodExample, JavaFile> {
    private static final ClientMethodSampleTemplate INSTANCE = new ClientMethodSampleTemplate();

    public static ClientMethodSampleTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(ClientMethodExample clientMethodExample, JavaFile javaFile) {
        String filename = clientMethodExample.getFilename();
        final ClientMethod method = clientMethodExample.getClientMethod();
        final AsyncSyncClient syncClient = clientMethodExample.getSyncClient();
        final ServiceClient serviceClient = clientMethodExample.getClientBuilder().getServiceClient();
        final ProxyMethodExample proxyMethodExample = clientMethodExample.getProxyMethodExample();

        ClientInitializationExampleWriter clientInitializationExampleWriter =
                new ClientInitializationExampleWriter(
                        syncClient,
                        method,
                        proxyMethodExample,
                        serviceClient);

        ClientMethodExampleWriter clientMethodExampleWriter =
                new ClientMethodExampleWriter(method, clientInitializationExampleWriter.getClientVarName(), proxyMethodExample);

        // declare imports
        Set<String> imports = new HashSet<>();
        imports.addAll(clientInitializationExampleWriter.getImports());
        imports.addAll(clientMethodExampleWriter.getImports());
        method.getReturnValue().getType().addImportsTo(imports, false);
        javaFile.declareImport(imports);

        javaFile.publicClass(null, filename, classBlock -> {
            Set<ExampleHelperFeature> helperFeatures = clientMethodExampleWriter.getHelperFeatures();
            String methodSignature = "void main(String[] args)";
            if (helperFeatures.contains(ExampleHelperFeature.ThrowsIOException)) {
                methodSignature += " throws IOException";
            }
            classBlock.publicStaticMethod(methodSignature, methodBlock -> {
                // write client initialization
                clientInitializationExampleWriter.write(methodBlock);

                // write method invocation

                // codesnippet begin
                if (proxyMethodExample.getCodeSnippetIdentifier() != null) {
                    methodBlock.line(String.format("// BEGIN:%s", proxyMethodExample.getCodeSnippetIdentifier()));
                }

                clientMethodExampleWriter.writeClientMethodInvocation(methodBlock, false);

                // codesnippet end
                if (proxyMethodExample.getCodeSnippetIdentifier() != null) {
                    methodBlock.line(String.format("// END:%s", proxyMethodExample.getCodeSnippetIdentifier()));
                }
            });
            if (helperFeatures.contains(ExampleHelperFeature.MapOfMethod)) {
                ModelExampleWriter.writeMapOfMethod(classBlock);
            }
        });
    }

    /**
     * Returns whether the given convenience example should be included in the generated sample code.
     * @param clientMethod the client method to generate samples for
     * @param convenienceMethod the convenience method
     * @return whether the given convenience example should be included in the generated sample code
     */
    public boolean isExampleIncluded(ClientMethod clientMethod, ConvenienceMethod convenienceMethod) {
        ConvenienceSyncMethodTemplate syncMethodTemplate = Templates.getConvenienceSyncMethodTemplate();
        return syncMethodTemplate.isMethodIncluded(clientMethod)
                && syncMethodTemplate.isMethodIncluded(convenienceMethod);
    }
}
