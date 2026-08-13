package com.microsoft.typespec.http.client.generator;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

public class MainTest {

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
