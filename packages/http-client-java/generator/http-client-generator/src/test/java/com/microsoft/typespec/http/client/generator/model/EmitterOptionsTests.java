// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.model;

import com.azure.core.util.BinaryData;
import java.io.UncheckedIOException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class EmitterOptionsTests {

    @Test
    public void testRenameModel() {
        EmitterOptions options = BinaryData.fromString(
            "{\"rename-model\":{\"TopLevelArmResourceListResult\":\"ResourceListResult\",\"CustomTemplateResourcePropertiesAnonymousEmptyModel\":\"AnonymousEmptyModel\"}}")
            .toObject(EmitterOptions.class);
        Assertions.assertEquals(2, options.getRenameModel().split(",").length);

        // string form
        options = BinaryData.fromString(
            "{\"rename-model\":\"TopLevelArmResourceListResult:ResourceListResult,CustomTemplateResourcePropertiesAnonymousEmptyModel:AnonymousEmptyModel\"}")
            .toObject(EmitterOptions.class);
        Assertions.assertEquals(2, options.getRenameModel().split(",").length);

        // invalid
        Assertions.assertThrows(UncheckedIOException.class, () -> {
            BinaryData.fromString("{\"rename-model\":[]}").toObject(EmitterOptions.class);
        });

        Assertions.assertThrows(UncheckedIOException.class, () -> {
            BinaryData.fromString("{\"rename-model\":1}").toObject(EmitterOptions.class);
        });
    }

    @Test
    public void testRemoveInner() {
        EmitterOptions options = BinaryData.fromString("{\"remove-inner\":[\"NginxConfigurationResponse\"]}")
            .toObject(EmitterOptions.class);
        Assertions.assertEquals(1, options.getRemoveInner().split(",").length);
        Assertions.assertEquals("NginxConfigurationResponse", options.getRemoveInner());

        // string form
        options
            = BinaryData.fromString("{\"remove-inner\":\"NginxConfigurationResponse\"}").toObject(EmitterOptions.class);
        Assertions.assertEquals(1, options.getRemoveInner().split(",").length);
    }
}
