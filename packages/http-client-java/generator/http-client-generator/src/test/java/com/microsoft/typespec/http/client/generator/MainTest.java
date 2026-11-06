package com.microsoft.typespec.http.client.generator;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

public class MainTest {

    @Test
    public void testStreamedCodeModelPreservesUnicodeAndAliases(@TempDir Path tempDir) throws IOException {
        Path input = tempDir.resolve("code-model.yaml");
        Files.writeString(input,
            String.join("\n", "language:", "  java:", "    name: CaféClient", "schemas:", "  objects:", "    - &node",
                "      type: object", "      language:", "        java:", "          name: Node", "      properties:",
                "        - serializedName: child", "          schema: *node"),
            StandardCharsets.UTF_8);

        CodeModel model = Main.loadCodeModel(input.toString());

        Assertions.assertEquals("CaféClient", model.getLanguage().getJava().getName());
        ObjectSchema node = model.getSchemas().getObjects().get(0);
        Assertions.assertSame(node, node.getProperties().get(0).getSchema());
        Files.delete(input);
        Assertions.assertFalse(Files.exists(input));
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
