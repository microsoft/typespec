// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

public class DefaultNamerFactory implements NamerFactory {

    private static final ModelNamer MODEL_NAMER = new ModelNamer();

    @Override
    public ModelNamer getModelNamer() {
        return MODEL_NAMER;
    }
}
