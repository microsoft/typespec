// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import com.microsoft.typespec.http.client.generator.core.customization.implementation.ls.EclipseLanguageClient;
import com.microsoft.typespec.http.client.generator.core.extension.base.util.FileUtils;
import org.slf4j.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Map;

/**
 * The base class for customization. Extend this class to plug into AutoRest generation.
 */
public abstract class Customization {
    /**
     * Start the customization process. This is called by the post processor in AutoRest.
     *
     * @param files the map of files generated in the previous steps in AutoRest
     * @param logger the logger
     * @return the map of files after customization
     */
    public final Map<String, String> run(Map<String, String> files, Logger logger) {
        Path tempDirWithPrefix;

        // Populate editor
        Editor editor;
        try {
            tempDirWithPrefix = FileUtils.createTempDirectory("temp");
            editor = new Editor(files, tempDirWithPrefix);
            InputStream pomStream = Customization.class.getResourceAsStream("/pom.xml");
            byte[] buffer = new byte[pomStream.available()];
            pomStream.read(buffer);
            editor.addFile("pom.xml", new String(buffer, StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        // Start language client
        try (EclipseLanguageClient languageClient
            = new EclipseLanguageClient(null, tempDirWithPrefix.toString(), logger)) {
            languageClient.initialize();
            customize(new LibraryCustomization(editor, languageClient), logger);
            editor.removeFile("pom.xml");
            return editor.getContents();
        } catch (Exception e) {
            throw new RuntimeException(e);
        } finally {
            Utils.deleteDirectory(tempDirWithPrefix.toFile());
        }
    }

    /**
     * Override this method to customize the client library.
     *
     * @param libraryCustomization the top level customization object
     * @param logger the logger
     */
    public abstract void customize(LibraryCustomization libraryCustomization, Logger logger);
}
