// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.model;

import io.clientcore.core.serialization.json.JsonReader;
import java.io.IOException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

public final class EmitterOptionsTests {

    @ParameterizedTest
    @ValueSource(
        strings = {
            // JSON form
            "{\"rename-model\":{\"TopLevelArmResourceListResult\":\"ResourceListResult\",\"CustomTemplateResourcePropertiesAnonymousEmptyModel\":\"AnonymousEmptyModel\"}}",
            // Compact form
            "{\"rename-model\":\"TopLevelArmResourceListResult:ResourceListResult,CustomTemplateResourcePropertiesAnonymousEmptyModel:AnonymousEmptyModel\"}" })
    public void testRenameModel(String json) throws IOException {
        EmitterOptions options = EmitterOptions.fromJson(JsonReader.fromString(json));
        Assertions.assertEquals(2, options.getRenameModel().split(",").length);
    }

    @ParameterizedTest
    @ValueSource(strings = { "{\"rename-model\":[]}", "{\"rename-model\":1}" })
    public void invalidRenameModel(String json) {
        Assertions.assertThrows(IllegalStateException.class,
            () -> EmitterOptions.fromJson(JsonReader.fromString(json)));
    }

    @ParameterizedTest
    @ValueSource(
        strings = {
            "{\"remove-inner\":[\"NginxConfigurationResponse\"]}", // array form
            "{\"remove-inner\":\"NginxConfigurationResponse\"}" // string form
        })
    public void testRemoveInner(String json) throws IOException {
        EmitterOptions options = EmitterOptions.fromJson(JsonReader.fromString(json));
        Assertions.assertEquals(1, options.getRemoveInner().split(",").length);
        Assertions.assertEquals("NginxConfigurationResponse", options.getRemoveInner());
    }
}
