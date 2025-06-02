// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public final class ProxyMethodExampleMapperTests {

    @Test
    public void testBuildCodeSnippetIdentifier() {
        String operationId = "OnlineExperimentation_CreateOrUpdateMetric";
        String exampleName = "CreateOrUpdateMetric_Average";

        String codeSnippetIdentifier = ProxyMethodExampleMapper.buildCodeSnippetIdentifier(operationId, exampleName);
        Assertions.assertEquals(
            "com.azure.mock.generated.online-experimentation-create-or-update-metric.create-or-update-metric-average",
            codeSnippetIdentifier);
    }
}
