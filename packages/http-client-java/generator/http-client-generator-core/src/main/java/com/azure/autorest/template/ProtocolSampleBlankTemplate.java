// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.azure.autorest.template;

import com.azure.autorest.extension.base.plugin.JavaSettings;
import com.azure.autorest.model.javamodel.JavaFile;

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
