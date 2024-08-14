// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.fluent.namer;

import com.microsoft.typespec.http.client.generator.fluent.util.FluentJavaSettings;
import com.azure.autorest.util.ModelNamer;
import com.azure.autorest.util.NamerFactory;

public class FluentNamerFactory implements NamerFactory {

    private final ModelNamer modelNamer;

    public FluentNamerFactory(FluentJavaSettings settings) {
        modelNamer = settings.isTrack1Naming() ? new FluentModelNamer() : new ModelNamer();
    }

    @Override
    public ModelNamer getModelNamer() {
        return modelNamer;
    }
}
