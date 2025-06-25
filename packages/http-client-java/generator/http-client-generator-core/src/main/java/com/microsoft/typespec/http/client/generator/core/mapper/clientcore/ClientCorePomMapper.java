// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper.clientcore;

import com.microsoft.typespec.http.client.generator.core.mapper.PomMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class ClientCorePomMapper extends PomMapper {
    private static final ClientCorePomMapper INSTANCE = new ClientCorePomMapper();

    private ClientCorePomMapper() {
    }

    public static ClientCorePomMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public Pom map(Project project) {
        return createPom(project);
    }

    private Pom createPom(Project project) {
        Pom pom = new Pom();
        pom.setGroupId(project.getGroupId());
        pom.setArtifactId(project.getArtifactId());
        pom.setVersion(project.getVersion());

        pom.setServiceName(project.getServiceName());
        pom.setServiceDescription(project.getServiceDescriptionForPom());

        Set<String> addedDependencyPrefixes = new HashSet<>();
        List<String> dependencyIdentifiers = new ArrayList<>();
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes, Project.Dependency.CLIENTCORE, false);

        // merge dependencies in POM and dependencies added above
        dependencyIdentifiers.addAll(project.getPomDependencyIdentifiers()
            .stream()
            .filter(
                dependencyIdentifier -> addedDependencyPrefixes.stream().noneMatch(dependencyIdentifier::startsWith))
            .collect(Collectors.toList()));

        pom.setDependencyIdentifiers(dependencyIdentifiers);

        pom.setRequireCompilerPlugins(true);
        return pom;
    }

    protected static void addDependencyIdentifier(List<String> dependencyIdentifiers, Set<String> prefixes,
        Project.Dependency dependency, boolean isTestScope) {
        prefixes.add(dependency.getGroupId() + ":" + dependency.getArtifactId() + ":");
        dependencyIdentifiers.add(dependency.getDependencyIdentifier() + (isTestScope ? TEST_SUFFIX : ""));
    }
}
