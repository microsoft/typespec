// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class PomMapperTests {

    private static class MockProject extends Project {
        MockProject() {
            serviceName = "Mock";
            serviceDescription = "Mock Service";
            namespace = "com.azure.mock";
            artifactId = "azure-mock";

            pomDependencyIdentifiers.add("com.azure:azure-core-test:1.15.0");
        }
    }

    @Test
    public void testMergeDependencies() {
        Project mockProject = new MockProject();
        Pom pom = new PomMapper().map(mockProject);
        Assertions.assertEquals("com.azure", pom.getGroupId());
        Assertions.assertEquals("azure-mock", pom.getArtifactId());
        Assertions.assertEquals("Mock", pom.getServiceName());
        List<String> dependencies = pom.getDependencyIdentifiers();
        Assertions.assertTrue(dependencies.stream().anyMatch(d -> d.startsWith("com.azure:azure-core:")));
        Assertions.assertTrue(dependencies.stream().anyMatch(d -> d.startsWith("com.azure:azure-core-test:")));
        // it should have higher version
        Assertions.assertTrue(dependencies.stream().noneMatch(d -> d.startsWith("com.azure:azure-core-test:15.0")));
    }
}
