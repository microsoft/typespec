// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.mapper.PomMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import com.microsoft.typespec.http.client.generator.mgmt.model.projectmodel.FluentProject;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class FluentPomMapper extends PomMapper {

    public Pom map(FluentProject project) {
        Pom pom = new Pom();
        pom.setGroupId(project.getGroupId());
        pom.setArtifactId(project.getArtifactId());
        pom.setVersion(project.getVersion());

        pom.setServiceName(project.getServiceName() + " Management");
        pom.setServiceDescription(project.getServiceDescriptionForPom());

        Set<String> addedDependencyPrefixes = new HashSet<>();
        List<String> dependencyIdentifiers = new ArrayList<>();
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes, Project.Dependency.AZURE_CORE, false);
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
            Project.Dependency.AZURE_CORE_MANAGEMENT, false);
        if (JavaSettings.getInstance().isGenerateTests()) {
            // JUnit, Reactor Test, and SLF4J Simple no longer need to be added to generated POMs as these are now
            // dependencies managed through azure-core-test.
            addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes, Project.Dependency.AZURE_CORE_TEST,
                true);
            addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes, Project.Dependency.AZURE_IDENTITY,
                true);
        }

        // merge dependencies in POM and dependencies added above
        dependencyIdentifiers.addAll(project.getPomDependencyIdentifiers()
            .stream()
            .filter(
                dependencyIdentifier -> addedDependencyPrefixes.stream().noneMatch(dependencyIdentifier::startsWith))
            .collect(Collectors.toList()));

        pom.setDependencyIdentifiers(dependencyIdentifiers);

        if (project.isIntegratedWithSdk()) {
            pom.setParentIdentifier(Project.Dependency.AZURE_CLIENT_SDK_PARENT.getDependencyIdentifier());
            pom.setParentRelativePath("../../parents/azure-client-sdk-parent");
        }

        pom.setRequireCompilerPlugins(!project.isIntegratedWithSdk());

        return pom;
    }
}
