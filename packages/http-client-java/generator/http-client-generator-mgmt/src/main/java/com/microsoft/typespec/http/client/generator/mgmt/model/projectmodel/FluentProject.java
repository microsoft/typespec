// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.model.projectmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.model.projectmodel.Project;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentClient;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentStatic;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentJavaSettings;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;

public class FluentProject extends Project {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), FluentProject.class);

    private final ServiceDescription serviceDescription = new ServiceDescription();

    private String apiVersionInTypeSpec = null;

    private Changelog changelog;
    private final List<CodeSample> codeSamples = new ArrayList<>();

    public void setApiVersionInTypeSpec(String apiVersionInTypeSpec) {
        this.apiVersionInTypeSpec = apiVersionInTypeSpec;
    }

    private static class ServiceDescription {
        private String simpleDescription;
        private String clientDescription;
        private String tagDescription;

        private String getServiceDescription() {
            return String.format("%1$s %2$s %3$s", simpleDescription, clientDescription, tagDescription).trim();
        }

        public String getServiceDescriptionForPom() {
            return String
                .format("%1$s %2$s %3$s %4$s", simpleDescription,
                    "For documentation on how to use this package, please see https://aka.ms/azsdk/java/mgmt.",
                    clientDescription, tagDescription)
                .trim();
        }

        public String getServiceDescriptionForMarkdown() {
            return this.getServiceDescription()
                + " For documentation on how to use this package, please see [Azure Management Libraries for Java](https://aka.ms/azsdk/java/mgmt).";
        }
    }

    public FluentProject(FluentClient fluentClient, String apiVersionInTypeSpec) {
        this(fluentClient.getManager().getServiceName(), apiVersionInTypeSpec,
            fluentClient.getInnerClient().getClientDescription());
    }

    protected FluentProject(String serviceName, String apiVersionInTypeSpec, String clientDescription) {
        this.groupId = "com.azure.resourcemanager";

        this.serviceName = serviceName;
        this.namespace = JavaSettings.getInstance().getPackage();
        this.artifactId = FluentUtils.getArtifactId();

        FluentStatic.getFluentJavaSettings().getArtifactVersion().ifPresent(version -> this.version = version);

        if (clientDescription == null) {
            clientDescription = "";
        }
        if (!clientDescription.isEmpty() && !clientDescription.endsWith(".")) {
            clientDescription += ".";
        }

        final String simpleDescriptionTemplate = "This package contains Microsoft Azure SDK for %1$s Management SDK.";

        this.serviceDescription.simpleDescription = String.format(simpleDescriptionTemplate, serviceName);
        this.serviceDescription.clientDescription = clientDescription;
        String autorestTag = JavaSettings.getInstance().getAutorestSettings().getTag();
        // SDK from TypeSpec does not contain autorest tag.
        if (autorestTag != null) {
            this.serviceDescription.tagDescription = "Package tag " + autorestTag + ".";
        } else if (apiVersionInTypeSpec != null) {
            this.serviceDescription.tagDescription = "Package api-version " + apiVersionInTypeSpec + ".";
        } else {
            this.serviceDescription.tagDescription = "";
        }

        this.changelog = new Changelog(this);
    }

    @Override
    public void integrateWithSdk() {
//        FluentPomTemplate.setProject(this);

        if (FluentStatic.getFluentJavaSettings().getArtifactVersion().isEmpty()) {
            findMyVersion().ifPresent(version -> this.version = version);
        }

        findPackageVersions();

        findPomDependencies();

        updateChangelog();

        findCodeSamples();

        findSdkRepositoryUri();
    }

    private void updateChangelog() {
        String outputFolder = JavaSettings.getInstance().getAutorestSettings().getOutputFolder();
        if (outputFolder != null && Paths.get(outputFolder).isAbsolute()) {
            Path changelogPath = Paths.get(outputFolder, "CHANGELOG.md");

            if (Files.isReadable(changelogPath)) {
                try (BufferedReader reader = Files.newBufferedReader(changelogPath, StandardCharsets.UTF_8)) {
                    this.changelog = new Changelog(reader);
                    LOGGER.info("Update 'CHANGELOG.md' for version '{}'", version);
                    this.changelog.updateForVersion(this);
                } catch (IOException e) {
                    LOGGER.warn("Failed to parse 'CHANGELOG.md'", e);
                }
            } else {
                LOGGER.info("'CHANGELOG.md' not found or not readable");
            }
        } else {
            LOGGER.warn("'output-folder' parameter is not an absolute path, fallback to default CHANGELOG.md");
        }
    }

    private void findCodeSamples() {
        String outputFolder = JavaSettings.getInstance().getAutorestSettings().getOutputFolder();
        if (outputFolder != null && Paths.get(outputFolder).isAbsolute()) {
            Path srcTestJavaPath = Paths.get(outputFolder).resolve(Paths.get("src", "test", "java"));
            if (Files.isDirectory(srcTestJavaPath)) {
                try {
                    Files.walk(srcTestJavaPath).forEach(path -> {
                        if (!Files.isDirectory(path)
                            && Files.isReadable(path)
                            && (path.getFileName().toString().endsWith("Tests.java")
                                || path.getFileName().toString().endsWith("Test.java"))) {
                            LOGGER.info("Attempt to find code sample from test file '{}'", path);
                            codeSamples.add(CodeSample.fromTestFile(path));
                        }
                    });
                } catch (IOException e) {
                    LOGGER.warn("Failed to walk path '" + srcTestJavaPath + "'", e);
                }
            }
        } else {
            LOGGER.warn("'output-folder' parameter is not an absolute path, skip code samples");
        }
    }

    private Optional<String> findMyVersion() {
        if (this.sdkFolder == null) {
            // abort, if this is not in azure-sdk-for-java repository
            return Optional.empty();
        }

        Path sdkPath = Paths.get(this.sdkFolder);
        Path versionClientPath = sdkPath.resolve(Paths.get("eng", "versioning", "version_client.txt"));
        if (Files.isReadable(versionClientPath)) {
            try (BufferedReader reader = Files.newBufferedReader(versionClientPath, StandardCharsets.UTF_8)) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String artifact = getVersionUpdateTag(this.groupId, this.artifactId);
                    Optional<String> versionOpt = checkArtifact(line, artifact);
                    if (versionOpt.isPresent()) {
                        return versionOpt;
                    }
                }
            } catch (IOException e) {
                LOGGER.warn("Failed to parse 'version_client.txt'", e);
            }
        } else {
            LOGGER.warn("'version_client.txt' not found or not readable");
        }

        return Optional.empty();
    }

    @Override
    public String getServiceDescription() {
        return this.serviceDescription.getServiceDescription();
    }

    @Override
    public String getServiceDescriptionForPom() {
        return this.serviceDescription.getServiceDescriptionForPom();
    }

    @Override
    public String getServiceDescriptionForMarkdown() {
        return this.serviceDescription.getServiceDescriptionForMarkdown();
    }

    public Changelog getChangelog() {
        return changelog;
    }

    public List<CodeSample> getCodeSamples() {
        return codeSamples;
    }

    @Override
    public boolean isGenerateSamples() {
        FluentJavaSettings settings = FluentStatic.getFluentJavaSettings();
        return settings.isGenerateSamples();
    }
}
