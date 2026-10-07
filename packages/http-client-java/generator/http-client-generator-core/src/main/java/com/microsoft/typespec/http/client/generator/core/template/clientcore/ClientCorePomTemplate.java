// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.clientcore;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.xmlmodel.XmlBlock;
import com.microsoft.typespec.http.client.generator.core.model.xmlmodel.XmlFile;
import com.microsoft.typespec.http.client.generator.core.template.PomTemplate;
import com.microsoft.typespec.http.client.generator.core.template.TemplateHelper;
import com.microsoft.typespec.http.client.generator.core.util.Constants;
import io.clientcore.core.utils.CoreUtils;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

public class ClientCorePomTemplate extends PomTemplate {
    private static final ClientCorePomTemplate INSTANCE = new ClientCorePomTemplate();

    private ClientCorePomTemplate() {
    }

    public static ClientCorePomTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(Pom pom, XmlFile xmlFile) {
        JavaSettings settings = JavaSettings.getInstance();

        // copyright
        if (!CoreUtils.isNullOrEmpty(settings.getFileHeaderText())) {
            xmlFile.blockComment(xmlLineComment -> xmlLineComment.line(settings.getFileHeaderText()
                .lines()
                .map(line -> " ~ " + line)
                .collect(Collectors.joining(Constants.NEW_LINE))));
        }

        Map<String, String> projectAnnotations = new LinkedHashMap<>();
        projectAnnotations.put("xmlns", "http://maven.apache.org/POM/4.0.0");
        projectAnnotations.put("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
        projectAnnotations.put("xsi:schemaLocation",
            "http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd");

        xmlFile.block("project", projectAnnotations, projectBlock -> {
            projectBlock.tag("modelVersion", "4.0.0");
            if (pom.getParentIdentifier() != null) {
                projectBlock.block("parent", parentBlock -> {
                    String[] parts = pom.getParentIdentifier().split(":");
                    String parentGroupId = parts[0];
                    String parentArtifactId = parts[1];
                    String parentVersion = parts[2];
                    parentBlock.tag("groupId", parentGroupId);
                    parentBlock.tag("artifactId", parentArtifactId);
                    parentBlock.tag("version", parentVersion);
                    parentBlock.tag("relativePath", pom.getParentRelativePath());
                });
            }

            projectBlock.line();

            projectBlock.tag("groupId", pom.getGroupId());
            projectBlock.tag("artifactId", pom.getArtifactId());
            projectBlock.tag("version", pom.getVersion());
            projectBlock.tag("packaging", "jar");

            projectBlock.line();

            projectBlock.tag("name", TemplateHelper.getPomProjectName(pom.getServiceName()));
            projectBlock.tag("description", pom.getServiceDescription());
            projectBlock.tag("url", "https://github.com/Azure/azure-sdk-for-java");

            projectBlock.line();

            projectBlock.block("licenses", licensesBlock -> licensesBlock.block("license", licenseBlock -> {
                licenseBlock.tag("name", "The MIT License (MIT)");
                licenseBlock.tag("url", "http://opensource.org/licenses/MIT");
                licenseBlock.tag("distribution", "repo");
            }));

            projectBlock.line();

            projectBlock.block("scm", scmBlock -> {
                scmBlock.tag("url", "https://github.com/Azure/azure-sdk-for-java");
                scmBlock.tag("connection", "scm:git:git@github.com:Azure/azure-sdk-for-java.git");
                scmBlock.tag("developerConnection", "scm:git:git@github.com:Azure/azure-sdk-for-java.git");
                scmBlock.tag("tag", "HEAD");
            });

            projectBlock.block("developers", developersBlock -> developersBlock.block("developer", developerBlock -> {
                developerBlock.tag("id", "microsoft");
                developerBlock.tag("name", "Microsoft");
            }));

            projectBlock.block("properties", propertiesBlock -> {
                propertiesBlock.tag("project.build.sourceEncoding", "UTF-8");
                writeJacoco(propertiesBlock);
                writeRevapi(propertiesBlock, pom);
                writeSpotless(propertiesBlock);
            });

            if (!CoreUtils.isNullOrEmpty(pom.getDependencyIdentifiers())) {
                projectBlock.block("dependencies", dependenciesBlock -> {
                    for (String dependency : pom.getDependencyIdentifiers()) {
                        String[] parts = dependency.split(":");
                        String groupId = parts[0];
                        String artifactId = parts[1];
                        String version;
                        if (parts.length >= 3) {
                            version = parts[2];
                        } else {
                            version = null;
                        }
                        String scope;
                        if (parts.length >= 4) {
                            scope = parts[3];
                        } else {
                            scope = null;
                        }
                        dependenciesBlock.block("dependency", dependencyBlock -> {
                            dependenciesBlock.tag("groupId", groupId);
                            dependenciesBlock.tag("artifactId", artifactId);
                            if (version != null) {
                                dependencyBlock.tag("version", version);
                            }
                            if (scope != null) {
                                dependenciesBlock.tag("scope", scope);
                            }
                        });
                    }
                });
            }

            writeBuildBlock(projectBlock, pom);
        });
    }

    /**
     * Extension for writing Spotless configuration.
     *
     * @param propertiesBlock The {@code <properties></properties>} XML block within the {@code pom.xml}.
     */
    protected void writeSpotless(XmlBlock propertiesBlock) {
    }

    /**
     * Extension for writing a "build" block, with array of "plugin" within.
     *
     * @param projectBlock the "project" xml block.
     * @param pom the pom model.
     */
    protected void writeBuildBlock(XmlBlock projectBlock, Pom pom) {
        if (pom.isRequireCompilerPlugins()) {
            projectBlock.block("build", buildBlock -> buildBlock.block("plugins", this::writePlugins));
        }
    }

    /**
     * Write a "maven-compiler-plugin" block, for SDK not using com.azure:azure-client-sdk-parent
     *
     * @param pluginsBlock the "plugins" xml block.
     */
    private void writePlugins(XmlBlock pluginsBlock) {
        // maven-compiler-plugin
        pluginsBlock.block("plugin", pluginBlock -> {
            pluginBlock.tag("groupId", "org.apache.maven.plugins");
            pluginBlock.tag("artifactId", "maven-compiler-plugin");
            pluginBlock.tag("version", "3.13.0");
            pluginBlock.block("configuration", configurationBlock -> configurationBlock.tag("release", "11"));
        });
    }
}
