// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
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
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes, Project.Dependency.AZURE_CORE, false);
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes,
            Project.Dependency.AZURE_CORE_HTTP_NETTY, false);
        // JUnit, Reactor Test, and SLF4J Simple no longer need to be added to generated POMs as these are now
        // dependencies managed through azure-core-test.
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes, Project.Dependency.AZURE_CORE_TEST,
            true);
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes, Project.Dependency.AZURE_IDENTITY,
            true);

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

    private Pom createGenericPom(Project project) {
        Pom pom = new Pom();
        pom.setGroupId(project.getGroupId());
        pom.setArtifactId(project.getArtifactId());
        pom.setVersion(project.getVersion());

        pom.setServiceName(project.getServiceName());
        pom.setServiceDescription(project.getServiceDescriptionForPom());

        Set<String> addedDependencyPrefixes = new HashSet<>();
        List<String> dependencyIdentifiers = new ArrayList<>();
        // for generic pom, stream style is always true
        addDependencyIdentifier(dependencyIdentifiers, addedDependencyPrefixes, Project.Dependency.CLIENTCORE, false);

        // merge dependencies in POM and dependencies added above
        dependencyIdentifiers.addAll(project.getPomDependencyIdentifiers()
            .stream()
            .filter(
                dependencyIdentifier -> addedDependencyPrefixes.stream().noneMatch(dependencyIdentifier::startsWith))
            .collect(Collectors.toList()));

        pom.setLicenseName(project.getLicenseName());
        pom.setLicenseUrl(project.getLicenseUrl());

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
