// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.projectmodel;

import java.net.URISyntaxException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

public class ProjectTests {

    @Test
    public void testParsePom() throws URISyntaxException {
        Path pomPath = Paths.get(ProjectTests.class.getClassLoader().getResource("test-pom.xml").toURI());

        List<String> dependencyIdentifiers = Project.findPomDependencies(pomPath);

        Assertions.assertTrue(
            dependencyIdentifiers.contains("com.azure.resourcemanager:azure-resourcemanager-resources:2.42.0:test"));
    }
}
