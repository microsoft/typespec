// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ApiMetadataTests {
    @Test
    public void storesApiMetadata() {
        ApiMetadata metadata = new ApiMetadata.Builder().crossLanguageDefinitionId("Example.Widget.get")
            .devMessage("Convenience API is not generated.")
            .build();

        Assertions.assertEquals("Example.Widget.get", metadata.getCrossLanguageDefinitionId());
        Assertions.assertEquals("Convenience API is not generated.", metadata.getDevMessage());
    }

    @Test
    public void newBuilderPreservesExistingValues() {
        ApiMetadata metadata = new ApiMetadata.Builder().crossLanguageDefinitionId("Example.Widget.get")
            .devMessage("Original message")
            .build();

        ApiMetadata updated = metadata.newBuilder().devMessage("Updated message").build();

        Assertions.assertEquals("Example.Widget.get", updated.getCrossLanguageDefinitionId());
        Assertions.assertEquals("Updated message", updated.getDevMessage());
    }

    @Test
    public void clientMethodStoresApiMetadata() {
        ClientMethod method = new ClientMethod.Builder().name("get")
            .description("Gets a widget.")
            .parameters(List.of())
            .returnValue(new ReturnValue("the widget", ClassType.STRING))
            .setCrossLanguageDefinitionId("Example.Widget.get")
            .devMessage("Convenience API is not generated.")
            .build();

        Assertions.assertEquals("Example.Widget.get", method.getApiMetadata().getCrossLanguageDefinitionId());
        Assertions.assertEquals("Convenience API is not generated.", method.getApiMetadata().getDevMessage());
    }
}
