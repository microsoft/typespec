// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.namer;

import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import com.microsoft.typespec.http.client.generator.core.util.ModelNamer;
import com.microsoft.typespec.http.client.generator.core.util.NamerFactory;

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
