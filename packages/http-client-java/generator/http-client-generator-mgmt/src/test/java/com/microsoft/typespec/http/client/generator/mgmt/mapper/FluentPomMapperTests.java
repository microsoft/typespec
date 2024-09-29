// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGenAccessor;
import com.microsoft.typespec.http.client.generator.mgmt.TestUtils;
import com.microsoft.typespec.http.client.generator.mgmt.model.projectmodel.FluentProject;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

public class FluentPomMapperTests {

    private static FluentGenAccessor fluentgenAccessor;

    @BeforeAll
    public static void ensurePlugin() {
        FluentGen fluentgen = new TestUtils.MockFluentGen();
        fluentgenAccessor = new FluentGenAccessor(fluentgen);
    }

    @Test
    public void testMergeDependencies() {
        String additionalDependencyIdentifier = "com.azure.resourcemanager:azure-resourcemanager-resources:2.42.0:test";

        FluentProject fluentProject = Mockito.mock(FluentProject.class);
        Mockito.when(fluentProject.getGroupId()).thenReturn("com.azure.resourcemanager");
        Mockito.when(fluentProject.getArtifactId()).thenReturn("azure-resourcemanager-mock");
        Mockito.when(fluentProject.getVersion()).thenReturn("1.0.0-beta.1");
        Mockito.when(fluentProject.getServiceName()).thenReturn("MockManagement");
        Mockito.when(fluentProject.getServiceDescription()).thenReturn("MockManagement");
        Mockito.when(fluentProject.getServiceDescriptionForPom()).thenReturn("MockManagement");
        Mockito.when(fluentProject.getPomDependencyIdentifiers()).thenReturn(List.of(additionalDependencyIdentifier));

        Pom pom = new FluentPomMapper().map(fluentProject);

        Assertions.assertTrue(
            pom.getDependencyIdentifiers().stream().anyMatch(p -> p.equals(additionalDependencyIdentifier)));
    }
}
