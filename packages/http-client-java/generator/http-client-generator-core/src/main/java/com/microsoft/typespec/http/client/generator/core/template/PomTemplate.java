// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Pom;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import com.microsoft.typespec.http.client.generator.core.model.xmlmodel.XmlBlock;
import com.microsoft.typespec.http.client.generator.core.model.xmlmodel.XmlFile;
import com.azure.core.util.CoreUtils;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Writes a ServiceClient to a JavaFile.
 */
public class PomTemplate implements IXmlTemplate<Pom, XmlFile> {
    private static final PomTemplate INSTANCE = new PomTemplate();

    protected PomTemplate() {
    }

    public static PomTemplate getInstance() {
        return INSTANCE;
    }

    public final void write(Pom pom, XmlFile xmlFile) {
        JavaSettings settings = JavaSettings.getInstance();
        boolean branded = settings.isBranded();

        // copyright
        xmlFile.blockComment(xmlLineComment -> {
            xmlLineComment.line(
                    Arrays.stream(settings
                            .getFileHeaderText()
                            .split(System.lineSeparator()))
                            .map(line -> " ~ " + line)
                            .collect(Collectors.joining(System.lineSeparator()))
            );
        });

        Map<String, String> projectAnnotations = new HashMap<>();
        projectAnnotations.put("xmlns", "http://maven.apache.org/POM/4.0.0");
        projectAnnotations.put("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
        projectAnnotations.put("xsi:schemaLocation", "http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd");

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
                    parentBlock.tagWithInlineComment("version", parentVersion,
                            "{x-version-update;com.azure:azure-client-sdk-parent;current}");
                    parentBlock.tag("relativePath", pom.getParentRelativePath());
                });
            }

            projectBlock.line();

            projectBlock.tag("groupId", pom.getGroupId());
            projectBlock.tag("artifactId", pom.getArtifactId());
            projectBlock.tagWithInlineComment("version", pom.getVersion(),
                    String.format("{x-version-update;%1$s:%2$s;current}", pom.getGroupId(), pom.getArtifactId()));
            projectBlock.tag("packaging", "jar");

            projectBlock.line();

            projectBlock.tag("name", TemplateHelper.getPomProjectName(pom.getServiceName()));
            projectBlock.tag("description", pom.getServiceDescription());
            if (branded) {
                projectBlock.tag("url", "https://github.com/Azure/azure-sdk-for-java");
            }

            projectBlock.line();

            projectBlock.block("licenses", licensesBlock -> {
                licensesBlock.block("license", licenseBlock -> {
                    licenseBlock.tag("name", "The MIT License (MIT)");
                    licenseBlock.tag("url", "http://opensource.org/licenses/MIT");
                    licenseBlock.tag("distribution", "repo");
                });
            });

            projectBlock.line();

            if (branded) {
                projectBlock.block("scm", scmBlock -> {
                    scmBlock.tag("url", "https://github.com/Azure/azure-sdk-for-java");
                    scmBlock.tag("connection", "scm:git:git@github.com:Azure/azure-sdk-for-java.git");
                    scmBlock.tag("developerConnection", "scm:git:git@github.com:Azure/azure-sdk-for-java.git");
                    scmBlock.tag("tag", "HEAD");
                });

                projectBlock.block("developers", developersBlock -> {
                    developersBlock.block("developer", developerBlock -> {
                        developerBlock.tag("id", "microsoft");
                        developerBlock.tag("name", "Microsoft");
                    });
                });
            }

            if (!branded && pom.getRepositories() != null && !pom.getRepositories().isEmpty()) {
                projectBlock.block("repositories", repositoriesBlock -> {
                    for (Map.Entry<String, String> repository : pom.getRepositories().entrySet()) {
                        repositoriesBlock.block("repository", repositoryBlock -> {
                            repositoryBlock.tag("id", repository.getKey());
                            repositoryBlock.tag("url", repository.getValue());
                        });
                    }
                });
            }

            projectBlock.block("properties", propertiesBlock -> {
                propertiesBlock.tag("project.build.sourceEncoding", "UTF-8");
                writeJacoco(propertiesBlock);
                writeRevapi(propertiesBlock, pom);
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
                            boolean externalDependency = !groupId.startsWith("com.azure");  // a bit of hack here
                            dependenciesBlock.tag("groupId", groupId);
                            dependenciesBlock.tag("artifactId", artifactId);
                            if (version != null) {
                                dependencyBlock.tagWithInlineComment("version", version,
                                        String.format("{x-version-update;%1$s;%2$s}",
                                                Project.getVersionUpdateTag(groupId, artifactId),
                                                externalDependency ? "external_dependency" : "dependency"));
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
     * Extension for writing jacoco configuration.
     *
     * @param propertiesBlock the "properties" xml block.
     */
    protected void writeJacoco(XmlBlock propertiesBlock) {
        // NOOP for data-plane
    }

    /**
     * Extension for writing revapi configuration.
     *
     * @param propertiesBlock the "properties" xml block.
     */
    protected void writeRevapi(XmlBlock propertiesBlock, Pom pom) {
        // NOOP for data-plane
    }

    /**
     * Extension for writing a "build" block, with array of "plugin" within.
     *
     * @param projectBlock the "project" xml block.
     * @param pom the pom model.
     */
    protected void writeBuildBlock(XmlBlock projectBlock, Pom pom) {
        if (pom.isRequireCompilerPlugins()) {
            projectBlock.block("build", buildBlock -> {
                buildBlock.block("plugins", pluginsBlock -> {
                    writeStandAlonePlugins(projectBlock);
                });
            });
        }
    }

    /**
     * Write a "maven-compiler-plugin" block, for SDK not using com.azure:azure-client-sdk-parent
     *
     * @param pluginsBlock the "plugins" xml block.
     */
    protected void writeStandAlonePlugins(XmlBlock pluginsBlock) {
        // maven-compiler-plugin
        pluginsBlock.block("plugin", pluginBlock -> {
            pluginBlock.tag("groupId", "org.apache.maven.plugins");
            pluginBlock.tag("artifactId", "maven-compiler-plugin");
            pluginBlock.tag("version", "3.10.1");
            pluginBlock.block("configuration", configurationBlock -> {
                configurationBlock.tag("release", "11");
            });
        });

        // maven-source-plugin
        pluginsBlock.block("plugin", pluginBlock -> {
            pluginBlock.tag("groupId", "org.apache.maven.plugins");
            pluginBlock.tag("artifactId", "maven-source-plugin");
            pluginBlock.tag("version", "3.3.0");
            pluginBlock.block("executions", executionsBlock -> {
                executionsBlock.block("execution", executionBlock -> {
                    executionBlock.tag("id", "attach-sources");
                    executionBlock.block("goals", goalsBlock -> {
                        goalsBlock.tag("goal", "jar");
                    });
                });
            });
        });

        // build-helper-maven-plugin: allow samples to be compiled
        pluginsBlock.block("plugin", pluginBlock -> {
            pluginBlock.tag("groupId", "org.codehaus.mojo");
            pluginBlock.tag("artifactId", "build-helper-maven-plugin");
            pluginBlock.tag("version", "3.0.0");
            pluginBlock.block("executions", executionsBlock -> {
                executionsBlock.block("execution", executionBlock -> {
                    executionBlock.tag("id", "add-test-source");
                    executionBlock.tag("phase", "generate-test-sources");
                    executionBlock.block("goals", goalsBlock -> {
                        goalsBlock.tag("goal", "add-test-source");
                    });
                    executionBlock.block("configuration", configurationBlock -> {
                        configurationBlock.block("sources", sourcesBlock -> {
                            sourcesBlock.tag("source", "${basedir}/src/samples");
                        });
                    });
                });
            });
        });
    }
}
