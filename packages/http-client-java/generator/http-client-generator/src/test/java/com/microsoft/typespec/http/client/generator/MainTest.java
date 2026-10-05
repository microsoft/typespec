package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.model.EmitterOptions;
import io.clientcore.core.serialization.json.JsonReader;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

public class MainTest {

    @ParameterizedTest
    @ValueSource(strings = { "\"flavor\":\"azure\",\"arm\":true", "\"flavor\":\"azurev2\"",
        "\"flavor\":\"generic\"" })
    public void protocolImplementationRejectsUnsupportedClientKinds(String clientOptions) throws IOException {
        try (JsonReader reader = JsonReader.fromString("{" + clientOptions
            + ",\"dev-options\":{\"generate-protocol-implementation\":true}}")) {
            EmitterOptions options = EmitterOptions.fromJson(reader);
            IllegalStateException error = Assertions.assertThrows(IllegalStateException.class,
                () -> Main.validateProtocolImplementationOptions(options));
            Assertions.assertTrue(error.getMessage().contains("Azure Core V1 data-plane clients only"));
        }
    }

    @ParameterizedTest
    @ValueSource(strings = { "\"flavor\":\"azure\",\"arm\":true", "\"flavor\":\"azurev2\"",
        "\"flavor\":\"generic\"" })
    public void disabledProtocolImplementationRetainsExistingClientKinds(String clientOptions) throws IOException {
        for (String devOptions : new String[] { "", ",\"dev-options\":{\"generate-protocol-implementation\":false}" }) {
            try (JsonReader reader = JsonReader.fromString("{" + clientOptions + devOptions + "}")) {
                EmitterOptions options = EmitterOptions.fromJson(reader);
                Assertions.assertDoesNotThrow(() -> Main.validateProtocolImplementationOptions(options));
            }
        }
    }

    @Test
    public void protocolImplementationAcceptsAzureDataPlaneClients() throws IOException {
        try (JsonReader reader = JsonReader.fromString("{\"flavor\":\"Azure\","
            + "\"dev-options\":{\"generate-protocol-implementation\":true}}")) {
            EmitterOptions options = EmitterOptions.fromJson(reader);
            Assertions.assertDoesNotThrow(() -> Main.validateProtocolImplementationOptions(options));
        }
    }

    @Test
    public void testWriteFluentPropertiesFileForNewProject(@TempDir Path tempDir) {
        Assertions.assertTrue(
            Main.shouldWriteFluentPropertiesFile(tempDir.toString(), "azure-resourcemanager-resources", true));
    }

    @Test
    public void testWriteFluentPropertiesFileForOtherArtifact(@TempDir Path tempDir) throws IOException {
        Path propertiesFile = tempDir.resolve("src/main/resources/azure-resourcemanager-compute.properties");
        Files.createDirectories(propertiesFile.getParent());
        Files.writeString(propertiesFile, "version=${project.version}\n");

        Assertions.assertTrue(
            Main.shouldWriteFluentPropertiesFile(tempDir.toString(), "azure-resourcemanager-compute", true));
    }

    @Test
    public void testPreserveResourcesPropertiesFileDuringSdkIntegration(@TempDir Path tempDir) throws IOException {
        Path propertiesFile = tempDir.resolve("src/main/resources/azure-resourcemanager-resources.properties");
        Files.createDirectories(propertiesFile.getParent());
        Files.writeString(propertiesFile,
            "version=${project.version}\npremium-libraries=azure-resourcemanager-compute\n");

        Assertions.assertFalse(
            Main.shouldWriteFluentPropertiesFile(tempDir.toString(), "azure-resourcemanager-resources", true));
        Assertions.assertTrue(
            Main.shouldWriteFluentPropertiesFile(tempDir.toString(), "azure-resourcemanager-resources", false));
    }
}
