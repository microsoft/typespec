// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;

public class ProtocolSampleBlankTemplate implements IJavaTemplate<Void, JavaFile> {

    @Override
    public void write(Void model, JavaFile context) {
        // the code snippet reference is used in README.md
        // see ReadmeTemplate
        String snippetReference = JavaSettings.getInstance().getPackage("readme");

        context.publicFinalClass("ReadmeSamples", classBlock -> {
            classBlock.publicMethod("void readmeSamples()", methodBlock -> {
                methodBlock.line(String.format("// BEGIN: %s", snippetReference));
                methodBlock.line(String.format("// END: %s", snippetReference));
            });
        });
    }
}
