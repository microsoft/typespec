// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.template;

import com.azure.autorest.model.clientmodel.ProtocolExample;
import com.azure.autorest.model.javamodel.JavaFile;
import com.azure.autorest.template.example.ProtocolExampleWriter;

public class ProtocolSampleTemplate implements IJavaTemplate<ProtocolExample, JavaFile> {

    private static final ProtocolSampleTemplate INSTANCE = new ProtocolSampleTemplate();

    protected ProtocolSampleTemplate() {
    }

    public static ProtocolSampleTemplate getInstance() {
        return INSTANCE;
    }

    public void write(ProtocolExample protocolExample, JavaFile javaFile) {
        ProtocolExampleWriter writer = new ProtocolExampleWriter(protocolExample);

        String filename = protocolExample.getFilename();

        javaFile.declareImport(writer.getImports());

        javaFile.publicClass(null, filename, classBlock -> {
            classBlock.publicStaticMethod("void main(String[] args)", methodBlock -> {
                writer.writeClientInitialization(methodBlock);

                // codesnippet begin
                if (protocolExample.getProxyMethodExample().getCodeSnippetIdentifier() != null) {
                    methodBlock.line(String.format("// BEGIN:%s", protocolExample.getProxyMethodExample().getCodeSnippetIdentifier()));
                }

                writer.writeClientMethodInvocation(methodBlock, false);

                // codesnippet end
                if (protocolExample.getProxyMethodExample().getCodeSnippetIdentifier() != null) {
                    methodBlock.line(String.format("// END:%s", protocolExample.getProxyMethodExample().getCodeSnippetIdentifier()));
                }
            });
        });
    }
}
