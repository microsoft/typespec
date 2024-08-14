// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization.implementation.ls;

import com.microsoft.typespec.http.client.generator.core.customization.implementation.Utils;
import org.apache.tools.tar.TarEntry;
import org.apache.tools.tar.TarInputStream;
import org.slf4j.Logger;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPInputStream;

public class EclipseLanguageServerFacade {
    private static final String DOWNLOAD_BASE_URL
        = "https://www.eclipse.org/downloads/download.php?file=/jdtls/milestones/";

    private final Process server;

    public EclipseLanguageServerFacade(String pathToLanguageServerPlugin, Logger logger) {
        Runtime.getRuntime().addShutdownHook(new Thread(this::shutdown));
        try {
            int javaVersion = Runtime.version().feature();

            Path languageServerPath = (pathToLanguageServerPlugin == null)
                ? getLanguageServerDirectory(javaVersion, logger)
                : Paths.get(pathToLanguageServerPlugin).resolve("jdt-language-server");

            List<String> command = new ArrayList<>();
            command.add("java");
            command.add("-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=1044");
            command.add("-Declipse.application=org.eclipse.jdt.ls.core.id1");
            command.add("-Dosgi.bundles.defaultStartLevel=4");
            command.add("-Declipse.product=org.eclipse.jdt.ls.core.product");
            command.add("-Dlog.protocol=true");
            command.add("-Dlog.level=ALL");
            command.add("-noverify");
            command.add("-Xmx1G");
            command.add("-jar");

            // This will need to get update when the target version of Eclipse language server changes.
            if (javaVersion < 17) {
                // JAR to start v1.12.0
                command.add("./plugins/org.eclipse.equinox.launcher_1.6.400.v20210924-0641.jar");
            } else if (javaVersion < 21) {
                // JAR to start v1.29.0
                command.add("./plugins/org.eclipse.equinox.launcher_1.6.500.v20230717-2134.jar");
            } else {
                // JAR to start v1.31.0
                command.add("./plugins/org.eclipse.equinox.launcher_1.6.700.v20231214-2017.jar");
            }

            command.add("--add-modules=ALL-SYSTEM");
            command.add("--add-opens java.base/java.util=ALL-UNNAMED");
            command.add("--add-opens java.base/java.lang=ALL-UNNAMED");

            command.add("-configuration");

            if (Utils.isWindows()) {
                command.add("./config_win");
            } else if (Utils.isMac()) {
                command.add("./config_mac");
            } else {
                command.add("./config_linux");
            }

            logger.info("Starting Eclipse JDT language server at {}", languageServerPath);
            server = new ProcessBuilder(command)
                .redirectOutput(ProcessBuilder.Redirect.PIPE)
                .redirectInput(ProcessBuilder.Redirect.PIPE)
                .redirectErrorStream(true)
                .directory(languageServerPath.toFile())
                .start();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static Path getLanguageServerDirectory(int javaVersion, Logger logger) throws IOException {
        Path tmp = Paths.get(System.getProperty("java.io.tmpdir"));
        Path autorestLanguageServer = tmp.resolve("autorest-java-language-server");

        URL downloadUrl;
        Path languageServerPath;
        if (javaVersion < 17) {
            // Eclipse JDT language server version 1.12.0 is the last version that supports Java 11, which is
            // autorest.java's baseline.
            downloadUrl = URI.create(DOWNLOAD_BASE_URL + "1.12.0/jdt-language-server-1.12.0-202206011637.tar.gz")
                .toURL();
            languageServerPath = autorestLanguageServer.resolve("1.12.0");
        } else if (javaVersion < 21) {
            // Eclipse JDT language server version 1.29.0 is the latest version that supports Java 17.
            // In the future this else statement may need to be replaced with an else if as newer versions of
            // Eclipse JDT language server may baseline on Java 21 (or later).
            downloadUrl = URI.create(DOWNLOAD_BASE_URL + "1.29.0/jdt-language-server-1.29.0-202310261436.tar.gz")
                .toURL();
            languageServerPath = autorestLanguageServer.resolve("1.29.0");
        } else {
            // Eclipse JDT language server version 1.31.0 is the latest version that supports Java 21.
            // In the future this else statement may need to be replaced with an else if as newer versions of
            // Eclipse JDT language server may baseline on Java 25 (or later).
            downloadUrl = URI.create(DOWNLOAD_BASE_URL + "1.31.0/jdt-language-server-1.31.0-202401111522.tar.gz")
                .toURL();
            languageServerPath = autorestLanguageServer.resolve("1.31.0");
        }

        Path languageServer = languageServerPath.resolve("jdt-language-server");
        if (!Files.exists(languageServerPath) || !Files.exists(languageServer)) {
            Files.createDirectories(languageServerPath);
            Path zipPath = languageServerPath.resolve("jdt-language-server.tar.gz");
            logger.info("Downloading Eclipse JDT language server from {} to {}", downloadUrl, zipPath);
            try (InputStream in = downloadUrl.openStream()) {
                Files.copy(in, zipPath);
            }
            logger.info("Downloaded Eclipse JDT language server to {}", zipPath);

            return unzipLanguageServer(zipPath);
        }

        return languageServer;
    }

    private static Path unzipLanguageServer(Path zipPath) throws IOException {
        try (TarInputStream tar = new TarInputStream(new GZIPInputStream(Files.newInputStream(zipPath)))) {
            Path languageServerDirectory = zipPath.getParent().resolve("jdt-language-server");
            Files.createDirectory(languageServerDirectory);
            TarEntry entry;
            while ((entry = tar.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    Files.createDirectories(languageServerDirectory.resolve(entry.getName()));
                } else {
                    Files.copy(tar, languageServerDirectory.resolve(entry.getName()));
                }
            }

            return languageServerDirectory;
        }
    }

    OutputStream getOutputStream() {
        return server.getOutputStream();
    }

    InputStream getInputStream() {
        return server.getInputStream();
    }

    boolean isAlive() {
        return server.isAlive();
    }

    String getServerError() {
        try {
            return new String(server.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    public void shutdown() {
        if (server != null && server.isAlive()) {
            server.destroyForcibly();
        }
    }
}
