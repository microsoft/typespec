// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import java.util.List;
import java.util.Map;

public class Pom {
    private String parentIdentifier;
    private String parentRelativePath;
    private String parentVersion;
    private String groupId;
    private String artifactId;
    private String version;
    private String serviceName;
    private String serviceDescription;
    private List<String> dependencyIdentifiers;
    private Map<String, String> repositories;

    private boolean requireCompilerPlugins = false;

    public List<String> getDependencyIdentifiers() {
        return dependencyIdentifiers;
    }

    public void setDependencyIdentifiers(List<String> dependencyIdentifiers) {
        this.dependencyIdentifiers = dependencyIdentifiers;
    }

    public String getParentIdentifier() {
        return parentIdentifier;
    }

    public Pom setParentIdentifier(String parentIdentifier) {
        this.parentIdentifier = parentIdentifier;
        return this;
    }

    public String getParentRelativePath() {
        return parentRelativePath;
    }

    public Pom setParentRelativePath(String parentRelativePath) {
        this.parentRelativePath = parentRelativePath;
        return this;
    }

    public String getParentVersion() {
        return parentVersion;
    }

    public Pom setParentVersion(String parentVersion) {
        this.parentVersion = parentVersion;
        return this;
    }

    public String getGroupId() {
        return groupId;
    }

    public Pom setGroupId(String groupId) {
        this.groupId = groupId;
        return this;
    }

    public String getArtifactId() {
        return artifactId;
    }

    public Pom setArtifactId(String artifactId) {
        this.artifactId = artifactId;
        return this;
    }

    public String getVersion() {
        return version;
    }

    public Pom setVersion(String version) {
        this.version = version;
        return this;
    }

    public String getServiceName() {
        return serviceName;
    }

    public Pom setServiceName(String serviceName) {
        this.serviceName = serviceName;
        return this;
    }

    public String getServiceDescription() {
        return serviceDescription;
    }

    public Pom setServiceDescription(String serviceDescription) {
        this.serviceDescription = serviceDescription;
        return this;
    }

    public boolean isRequireCompilerPlugins() {
        return requireCompilerPlugins;
    }

    public Pom setRequireCompilerPlugins(boolean requireCompilerPlugins) {
        this.requireCompilerPlugins = requireCompilerPlugins;
        return this;
    }

    public Map<String, String> getRepositories() {
        return repositories;
    }

    public Pom setRepositories(Map<String, String> repositories) {
        this.repositories = repositories;
        return this;
    }
}
