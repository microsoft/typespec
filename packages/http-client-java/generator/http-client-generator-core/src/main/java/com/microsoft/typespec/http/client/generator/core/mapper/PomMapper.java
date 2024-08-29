// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class PomMapper implements IMapper<Project, Pom> {

    protected static final String TEST_SUFFIX = ":test";

    @Override
    public Pom map(Project project) {
        if (!JavaSettings.getInstance().isBranded()) {
            return createGenericPom(project);
        } else {
            return createAzurePom(project);
        }
    }

    private Pom createAzurePom(Project project) {
        Pom pom = new Pom();
        pom.setGroupId(project.getGroupId());
        pom.setArtifactId(project.getArtifactId());
        pom.setVersion(project.getVersion());

        pom.setServiceName(project.getServiceName());
        pom.setServiceDescription(project.getServiceDescriptionForPom());

        Set<String> addedDependencyPrefixes = new HashSet<>();
        List<String> dependencyIdentifiers = new ArrayList<>();
        if (JavaSettings.getInstance().isStreamStyleSerialization()) {
            addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
                    Project.Dependency.AZURE_JSON, false);
            addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
                    Project.Dependency.AZURE_XML, false);
        }
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
                Project.Dependency.AZURE_CORE, false);
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
                Project.Dependency.AZURE_CORE_HTTP_NETTY, false);
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
                Project.Dependency.JUNIT_JUPITER_API, true);
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
                Project.Dependency.JUNIT_JUPITER_ENGINE, true);
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
                Project.Dependency.AZURE_CORE_TEST, true);
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
                Project.Dependency.AZURE_IDENTITY, true);
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
                Project.Dependency.SLF4J_SIMPLE, true);

        // merge dependencies in POM and dependencies added above
        dependencyIdentifiers.addAll(project.getPomDependencyIdentifiers().stream()
                .filter(dependencyIdentifier -> addedDependencyPrefixes.stream().noneMatch(dependencyIdentifier::startsWith))
                .collect(Collectors.toList()));

        pom.setDependencyIdentifiers(dependencyIdentifiers);

        if (project.isIntegratedWithSdk()) {
            pom.setParentIdentifier(Project.Dependency.AZURE_CLIENT_SDK_PARENT.getDependencyIdentifier());
            pom.setParentRelativePath("../../parents/azure-client-sdk-parent");
        }

        pom.setRequireCompilerPlugins(!project.isIntegratedWithSdk());

        return pom;
    }

    private Pom createGenericPom(Project project) {
        Pom pom = new Pom();
        pom.setGroupId(project.getGroupId());
        pom.setArtifactId(project.getArtifactId());
        pom.setVersion(project.getVersion());

        pom.setServiceName(project.getServiceName());
        pom.setServiceDescription(project.getServiceDescriptionForPom());
        Map<String, String> repositories = new HashMap<>();
        repositories.put("clientcore", "https://clientcore.blob.core.windows.net/artifacts");
        pom.setRepositories(repositories);

        Set<String> addedDependencyPrefixes = new HashSet<>();
        List<String> dependencyIdentifiers = new ArrayList<>();
        // for generic pom, stream style is always true
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
                Project.Dependency.CLIENTCORE, false);
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
                Project.Dependency.CLIENTCORE_JSON, false);

        // merge dependencies in POM and dependencies added above
        dependencyIdentifiers.addAll(project.getPomDependencyIdentifiers().stream()
                .filter(dependencyIdentifier -> addedDependencyPrefixes.stream().noneMatch(dependencyIdentifier::startsWith))
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
