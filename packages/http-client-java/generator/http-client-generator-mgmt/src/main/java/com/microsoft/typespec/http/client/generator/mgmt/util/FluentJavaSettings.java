// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.util;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.NewPlugin;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.model.ResourceCollectionAssociation;
import com.azure.core.util.CoreUtils;
import com.azure.json.JsonReader;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Consumer;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class FluentJavaSettings {

    private final Logger logger;

    private final NewPlugin host;

    /**
     * Java class names for extra Inner classes.
     */
    private final Set<String> javaNamesForAddInner = new HashSet<>();

    /**
     * Java class names for excluded Inner classes.
     */
    private final Set<String> javaNamesForRemoveInner = new HashSet<>();

    private final Set<String> javaNamesForRemoveModel = new HashSet<>();

    private final Set<String> javaNamesForPreserveModel = new HashSet<>();

    private final Set<String> javaNamesForRemoveOperationGroup = new HashSet<>();

    private final List<ResourceCollectionAssociation> resourceCollectionAssociations = new ArrayList<>();

//    /**
//     * Whether to generate property method with track1 naming (e.g. foo, withFoo), instead of track2 naming (e.g. getFoo, setFoo).
//     */
//    private boolean track1Naming = true;
//
//    /**
//     * Whether to treat read-only resource property as SubResource type.
//     */
//    private boolean resourcePropertyAsSubResource = false;

    /**
     * Operation group name for ungrouped operations.
     */
    private String nameForUngroupedOperations;

    /**
     * Naming override.
     */
    private final Map<String, String> namingOverride = new HashMap<>();

    private final Map<String, String> renameModel = new HashMap<>();

    private final Set<String> javaNamesForPropertyIncludeAlways = new HashSet<>();

    private final Map<String, String> renameOperationGroup = new HashMap<>();

    private String pomFilename = "pom.xml";

    private String artifactVersion;

    private boolean generateAsyncMethods = false;

    private SampleGeneration generateSamples = SampleGeneration.NONE;

    private String graalVmConfigSuffix = null;

    private boolean sdkIntegration = false;

    private enum SampleGeneration {
        NONE,
        AGGREGATED
    }

    public FluentJavaSettings(NewPlugin host) {
        Objects.requireNonNull(host);
        this.host = host;
        this.logger = new PluginLogger(host, FluentJavaSettings.class);
        loadSettings();
    }

    public Set<String> getJavaNamesForAddInner() {
        return javaNamesForAddInner;
    }

    public Set<String> getJavaNamesForRemoveInner() {
        return javaNamesForRemoveInner;
    }

    public boolean isTrack1Naming() {
        return true;
        //return track1Naming;
    }

    public boolean isResourcePropertyAsSubResource() {
        return false;
        //return resourcePropertyAsSubResource;
    }

    public Optional<String> getNameForUngroupedOperations() {
        return Optional.ofNullable(nameForUngroupedOperations);
    }

    public Map<String, String> getNamingOverride() {
        return namingOverride;
    }

    public Map<String, String> getJavaNamesForRenameModel() {
        return renameModel;
    }

    public Set<String> getJavaNamesForRemoveModel() {
        return javaNamesForRemoveModel;
    }

    public Set<String> getJavaNamesForPreserveModel() {
        return javaNamesForPreserveModel;
    }

    public Set<String> getJavaNamesForRemoveOperationGroup() {
        return javaNamesForRemoveOperationGroup;
    }

    public Set<String> getJavaNamesForPropertyIncludeAlways() {
        return javaNamesForPropertyIncludeAlways;
    }

    public Map<String, String> getJavaNamesForRenameOperationGroup() {
        return renameOperationGroup;
    }

    public List<ResourceCollectionAssociation> getResourceCollectionAssociations() {
        return resourceCollectionAssociations;
    }

    public String getPomFilename() {
        return pomFilename;
    }

    public Optional<String> getArtifactVersion() {
        return Optional.ofNullable(artifactVersion);
    }

    public boolean isGenerateAsyncMethods() {
        return generateAsyncMethods;
    }

    public boolean isGenerateSamples() {
        return generateSamples != SampleGeneration.NONE;
    }

    public Optional<String> getGraalVmConfigSuffix() {
        return Optional.ofNullable(graalVmConfigSuffix);
    }

    public boolean isSdkIntegration() {
        return sdkIntegration;
    }

    private void loadSettings() {
        loadStringSetting("add-inner", s -> splitStringToSet(s, javaNamesForAddInner));

        loadStringSetting("remove-inner", s -> splitStringToSet(s, javaNamesForRemoveInner));

        loadStringSetting("rename-model", s -> {
            if (!CoreUtils.isNullOrEmpty(s)) {
                String[] renamePairs = s.split(Pattern.quote(","));
                for (String pair : renamePairs) {
                    String[] fromAndTo = pair.split(Pattern.quote(":"));
                    if (fromAndTo.length == 2) {
                        String from = fromAndTo[0];
                        String to = fromAndTo[1];
                        if (!CoreUtils.isNullOrEmpty(from) && !CoreUtils.isNullOrEmpty(to)) {
                            renameModel.put(from, to);
                        }
                    }
                }
            }
        });

        loadStringSetting("remove-model", s -> splitStringToSet(s, javaNamesForRemoveModel));

        loadStringSetting("preserve-model", s -> splitStringToSet(s, javaNamesForPreserveModel));

        loadStringSetting("remove-operation-group", s -> splitStringToSet(s, javaNamesForRemoveOperationGroup));

        loadStringSetting("rename-operation-group", s -> {
            if (!CoreUtils.isNullOrEmpty(s)) {
                String[] renamePairs = s.split(Pattern.quote(","));
                for (String pair : renamePairs) {
                    String[] fromAndTo = pair.split(Pattern.quote(":"));
                    if (fromAndTo.length == 2) {
                        String from = fromAndTo[0];
                        String to = fromAndTo[1];
                        if (!CoreUtils.isNullOrEmpty(from) && !CoreUtils.isNullOrEmpty(to)) {
                            renameOperationGroup.put(from, to);
                        }
                    }
                }
            }
        });
//        loadBooleanSetting("track1-naming", b -> track1Naming = b);
//        loadBooleanSetting("resource-property-as-subresource", b -> resourcePropertyAsSubResource = b);

        loadStringSetting("name-for-ungrouped-operations", s -> nameForUngroupedOperations = s);

        loadStringSetting("property-include-always", s -> splitStringToSet(s, javaNamesForPropertyIncludeAlways));

        loadResourceCollectionAssociationSetting(resourceCollectionAssociations::addAll);

        loadStringSetting("pom-file", s -> pomFilename = s);
        loadStringSetting("package-version", s -> artifactVersion = s);

        loadBooleanSetting("generate-async-methods", s -> generateAsyncMethods = s);

        loadBooleanSetting("generate-samples", s -> generateSamples = (s ? SampleGeneration.AGGREGATED : SampleGeneration.NONE));

        loadStringSetting("graalvm-config-suffix", s -> graalVmConfigSuffix = s);

        loadBooleanSetting("sdk-integration", b -> sdkIntegration = b);

        Map<String, String> namingOverride = host.getValueWithJsonReader("pipeline.fluentgen.naming.override",
            jsonReader -> jsonReader.readMap(JsonReader::getString));

        if (namingOverride != null) {
            this.namingOverride.putAll(namingOverride);
        }
    }

    private void splitStringToSet(String s, Set<String> set) {
        if (!CoreUtils.isNullOrEmpty(s)) {
            set.addAll(Arrays.stream(s.split(Pattern.quote(",")))
                .map(String::trim)
                .filter(s1 -> !s1.isEmpty())
                .collect(Collectors.toSet()));
        }
    }

    private void loadBooleanSetting(String settingName, Consumer<Boolean> action) {
        Boolean settingValue = host.getBooleanValue(settingName);
        if (settingValue != null) {
            logger.debug("Option, boolean, {} : {}", settingName, settingValue);
            action.accept(settingValue);
        }
    }

    private void loadStringSetting(String settingName, Consumer<String> action) {
        String settingValue = host.getStringValue(settingName);
        if (settingValue != null) {
            logger.debug("Option, string, {} : {}", settingName, settingValue);
            action.accept(settingValue);
        }
    }

    private void loadResourceCollectionAssociationSetting(Consumer<List<ResourceCollectionAssociation>> action) {
        String settingName = "resource-collection-associations";
        List<ResourceCollectionAssociation> settingValue = host.getValueWithJsonReader(settingName,
            jsonReader -> jsonReader.readArray(ResourceCollectionAssociation::fromJson));
        if (settingValue != null) {
            logger.debug("Option, array, {} : {}", settingName, settingValue);
            action.accept(settingValue);
        }
    }
}
