// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Experimental;
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
        Experimental experimental = new Experimental();
        experimental.setWarningText("Preview warning");
        ApiMetadata metadata = new ApiMetadata.Builder().crossLanguageDefinitionId("Example.Widget.get")
            .devMessage("Original message")
            .experimental(experimental)
            .build();

        ApiMetadata updated = metadata.newBuilder().devMessage("Updated message").build();

        Assertions.assertEquals("Example.Widget.get", updated.getCrossLanguageDefinitionId());
        Assertions.assertEquals("Updated message", updated.getDevMessage());
        Assertions.assertSame(experimental, updated.getExperimental());
    }

    @Test
    public void clientMethodStoresApiMetadata() {
        ClientMethod method = new ClientMethod.Builder().name("get")
            .description("Gets a widget.")
            .parameters(List.of())
            .returnValue(new ReturnValue("the widget", ClassType.STRING))
            .apiMetadata(new ApiMetadata.Builder().crossLanguageDefinitionId("Example.Widget.get")
                .devMessage("Convenience API is not generated.")
                .build())
            .build();

        Assertions.assertEquals("Example.Widget.get", method.getApiMetadata().getCrossLanguageDefinitionId());
        Assertions.assertEquals("Convenience API is not generated.", method.getApiMetadata().getDevMessage());
    }

    @Test
    public void propertyBuilderPreservesExperimentalMetadata() {
        Experimental experimental = new Experimental();
        experimental.setWarningText("Property preview");
        ClientModelProperty property = new ClientModelProperty.Builder().name("value")
            .apiMetadata(new ApiMetadata.Builder().experimental(experimental).build())
            .build();
        Assertions.assertSame(experimental, property.newBuilder().build().getApiMetadata().getExperimental());
    }
}
