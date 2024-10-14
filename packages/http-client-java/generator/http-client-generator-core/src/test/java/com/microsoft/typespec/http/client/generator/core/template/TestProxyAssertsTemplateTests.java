// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.azure.json.JsonProviders;
import com.azure.json.JsonReader;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import java.io.IOException;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class TestProxyAssertsTemplateTests {

    private static class MockProject extends Project {
        MockProject() {
            serviceName = "OpenAI";
            serviceDescription = "OpenAI Service";
            namespace = "com.azure.ai.openai";
            artifactId = "azure-ai-openai";
            sdkRepositoryPath = "sdk/openai/azure-ai-openai";
        }
    }

    @Test
    public void testAssertsTemplateWrite() throws IOException {
        Project project = new MockProject();

        String output = new TestProxyAssetsTemplate().write(project);

        try (JsonReader jsonReader = JsonProviders.createReader(output)) {
            Map<String, Object> jsonMap = jsonReader.readMap(JsonReader::readUntyped);

            Assertions.assertEquals("Azure/azure-sdk-assets", jsonMap.get("AssetsRepo").toString());
            Assertions.assertEquals("java", jsonMap.get("AssetsRepoPrefixPath").toString());
            Assertions.assertEquals("java/openai/azure-ai-openai", jsonMap.get("TagPrefix").toString());
            Assertions.assertNotNull(jsonMap.get("Tag").toString());
        }
    }
}
