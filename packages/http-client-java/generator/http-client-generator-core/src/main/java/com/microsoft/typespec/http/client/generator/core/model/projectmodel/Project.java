// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.projectmodel;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Client;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ExternalPackage;
import com.microsoft.typespec.http.client.generator.core.template.TemplateHelper;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.azure.core.util.CoreUtils;
import org.slf4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.w3c.dom.Text;
import org.xml.sax.SAXException;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public class Project {

    private static final Logger LOGGER = new PluginLogger(Javagen.getPluginInstance(), Project.class);

    public static final String AZURE_GROUP_ID = ExternalPackage.CORE.getGroupId();

    protected String serviceName;
    protected String serviceDescription;
    protected String namespace;
    protected String groupId = AZURE_GROUP_ID;
    protected String artifactId;
    protected String version = "1.0.0-beta.1";
    protected final List<String> pomDependencyIdentifiers = new ArrayList<>();
    protected String sdkRepositoryPath;

    private List<String> apiVersions;

    private boolean integratedWithSdk = false;

    public enum Dependency {
        // azure
        AZURE_CLIENT_SDK_PARENT("com.azure", "azure-client-sdk-parent", "1.7.0"),
        AZURE_JSON("com.azure", "azure-json", "1.2.0"),
        AZURE_XML("com.azure", "azure-xml", "1.1.0"),
        AZURE_CORE("com.azure", "azure-core", "1.51.0"),
        AZURE_CORE_MANAGEMENT("com.azure", "azure-core-management", "1.15.2"),
        AZURE_CORE_HTTP_NETTY("com.azure", "azure-core-http-netty", "1.15.3"),
        AZURE_CORE_TEST("com.azure", "azure-core-test", "1.26.2"),
        AZURE_IDENTITY("com.azure", "azure-identity", "1.13.2"),
        AZURE_CORE_EXPERIMENTAL("com.azure", "azure-core-experimental", "1.0.0-beta.52"),

        CLIENTCORE("io.clientcore", "core", "1.0.0-beta.1"),
        CLIENTCORE_JSON("io.clientcore", "core-json", "1.0.0-beta.1"),

        // external
        JUNIT_JUPITER_API("org.junit.jupiter", "junit-jupiter-api", "5.9.3"),
        JUNIT_JUPITER_ENGINE("org.junit.jupiter", "junit-jupiter-engine", "5.9.3"),
        MOCKITO_CORE("org.mockito", "mockito-core", "4.11.0"),
        BYTE_BUDDY("net.bytebuddy", "byte-buddy", "1.14.12"),
        BYTE_BUDDY_AGENT("net.bytebuddy", "byte-buddy-agent", "1.14.12"),
        SLF4J_SIMPLE("org.slf4j", "slf4j-simple", "1.7.36");

        private final String groupId;
        private final String artifactId;
        private String version; // version could be updated in place, from "version_client.txt" or "external_dependencies.txt", on findPackageVersions method

        Dependency(String groupId, String artifactId, String defaultVersion) {
            this.groupId = groupId;
            this.artifactId = artifactId;
            this.version = defaultVersion;
        }

        public String getGroupId() {
            return groupId;
        }

        public String getArtifactId() {
            return artifactId;
        }

        public String getVersion() {
            return version;
        }

        public void setVersion(String version) {
            this.version = version;
        }

        public String getDependencyIdentifier() {
            return String.format("%s:%s:%s", groupId, artifactId, version);
        }
    }

    protected Project() {
    }

    public Project(Client client, List<String> apiVersions) {
        JavaSettings settings = JavaSettings.getInstance();
        String serviceName = settings.getServiceName();
        if (CoreUtils.isNullOrEmpty(serviceName)) {
            serviceName = client.getClientName();
        }

        this.serviceName = serviceName;
        this.namespace = JavaSettings.getInstance().getPackage();
        this.artifactId = ClientModelUtil.getArtifactId();

        this.serviceDescription = TemplateHelper.getPomProjectDescription(serviceName);

        this.apiVersions = apiVersions;
    }

    // TODO (weidxu): this method likely will get refactored when we support external model (hence external package)
    public void checkForAdditionalDependencies(Set<String> externalPackageNames) {
        // currently, only check for azure-core-experimental
        if (externalPackageNames.stream().anyMatch(p -> p.startsWith("com.azure.core.experimental"))) {
            // add to pomDependencyIdentifiers is not already there
            if (this.pomDependencyIdentifiers.stream()
                    .noneMatch(identifier -> identifier.startsWith(Dependency.AZURE_CORE_EXPERIMENTAL.getGroupId() + ":" + Dependency.AZURE_CORE_EXPERIMENTAL.getArtifactId() + ":"))) {
                this.pomDependencyIdentifiers.add(Dependency.AZURE_CORE_EXPERIMENTAL.getDependencyIdentifier());
            }
        }
    }

    public void integrateWithSdk() {
        findPackageVersions();

        findPomDependencies();

        findSdkRepositoryUri();
    }

    protected void findSdkRepositoryUri() {
        JavaSettings settings = JavaSettings.getInstance();
        String outputFolder = settings.getAutorestSettings().getOutputFolder();
        if (outputFolder != null) {
            Path path = Paths.get(outputFolder).normalize();
            List<String> pathSegment = new ArrayList<>();
            while (path != null) {
                if (path.getFileName() == null) {
                    // likely the case of "C:\"
                    path = null;
                    break;
                }

                Path childPath = path;
                path = path.getParent();

                pathSegment.add(childPath.getFileName().toString());

                if (isRepoSdkFolder(childPath)) {
                    // childPath = azure-sdk-for-java/sdk, path = azure-sdk-for-java
                    break;
                }
            }
            if (path != null) {
                Collections.reverse(pathSegment);
                sdkRepositoryPath = String.join("/", pathSegment);
                LOGGER.info("Repository path '{}' deduced from 'output-folder' parameter", sdkRepositoryPath);
            }
        }
    }

    private String findSdkFolder() {
        JavaSettings settings = JavaSettings.getInstance();
        String sdkFolderOpt = settings.getAutorestSettings().getJavaSdksFolder();
        if (sdkFolderOpt == null) {
            LOGGER.info("'java-sdks-folder' parameter not available");
        } else {
            if (!Paths.get(sdkFolderOpt).isAbsolute()) {
                LOGGER.info("'java-sdks-folder' parameter is not an absolute path");
                sdkFolderOpt = null;
            }
        }

        // try to deduct it from "output-folder"
        if (sdkFolderOpt == null) {
            String outputFolder = settings.getAutorestSettings().getOutputFolder();
            if (outputFolder != null && Paths.get(outputFolder).isAbsolute()) {
                Path path = Paths.get(outputFolder).normalize();
                while (path != null) {
                    if (path.getFileName() == null) {
                        // likely the case of "C:\"
                        path = null;
                        break;
                    }

                    Path childPath = path;
                    path = path.getParent();

                    if (isRepoSdkFolder(childPath)) {
                        // childPath = azure-sdk-for-java/sdk, path = azure-sdk-for-java
                        break;
                    }
                }
                if (path != null) {
                    LOGGER.info("'azure-sdk-for-java' SDK folder '{}' deduced from 'output-folder' parameter", path.toString());
                    sdkFolderOpt = path.toString();
                }
            }
        }

        if (sdkFolderOpt == null) {
            LOGGER.warn("'azure-sdk-for-java' SDK folder not found, fallback to default versions for dependencies");
        }

        return sdkFolderOpt;
    }

    private static boolean isRepoSdkFolder(Path path) {
        boolean ret = false;
        if (path.getFileName() != null && "sdk".equals(path.getFileName().toString())) {
            Path parentPomPath = path.resolve("parents/azure-client-sdk-parent/pom.xml");
            if (parentPomPath.toFile().isFile()) {
                ret = true;
            }
        }
        return ret;
    }

    private static final Map<String, String> VERSION_UPDATE_TAG_MAP = Map.of(
            // see https://github.com/Azure/azure-sdk-for-java/blob/main/eng/versioning/external_dependencies.txt
            "net.bytebuddy:byte-buddy", "testdep_net.bytebuddy:byte-buddy",
            "net.bytebuddy:byte-buddy-agent", "testdep_net.bytebuddy:byte-buddy-agent"
    );

    /**
     * Gets the version update tag (x-version-update) for the groupId and artifactId.
     *
     * @param groupId the group ID.
     * @param artifactId the artifact ID.
     * @return the version update tag.
     */
    public static String getVersionUpdateTag(String groupId, String artifactId) {
        String tag = groupId + ":" + artifactId;
        String ret = VERSION_UPDATE_TAG_MAP.get(tag);
        return ret == null ? tag : ret;
    }

    protected void findPackageVersions() {
        String sdkFolderOpt = findSdkFolder();
        this.integratedWithSdk = sdkFolderOpt != null;
        if (sdkFolderOpt == null) {
            return;
        }

        // find dependency version from versioning txt
        Path sdkPath = Paths.get(sdkFolderOpt);
        Path versionClientPath = sdkPath.resolve(Paths.get("eng", "versioning", "version_client.txt"));
        Path versionExternalPath = sdkPath.resolve(Paths.get("eng", "versioning", "external_dependencies.txt"));
        if (Files.isReadable(versionClientPath) && Files.isReadable(versionExternalPath)) {
            try {
                findPackageVersions(versionClientPath);
            } catch (IOException e) {
                LOGGER.warn("Failed to parse 'version_client.txt'", e);
            }
            try {
                findPackageVersions(versionExternalPath);
            } catch (IOException e) {
                LOGGER.warn("Failed to parse 'external_dependencies.txt'", e);
            }
        } else {
            LOGGER.warn("'version_client.txt' or 'external_dependencies.txt' not found or not readable");
        }
    }

    private void findPackageVersions(Path path) throws IOException {
        try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
            reader.lines().forEach(line -> {
                for (Dependency dependency : Dependency.values()) {
                    String artifact = getVersionUpdateTag(dependency.getGroupId(), dependency.getArtifactId());
                    checkArtifact(line, artifact).ifPresent(dependency::setVersion);
                }
            });
        }
    }

    public static Optional<String> checkArtifact(String line, String artifact) {
        if (line.startsWith(artifact + ";")) {
            String[] segments = line.split(";");
            if (segments.length >= 2) {
                String version = segments[1];
                LOGGER.info("Found version '{}' for artifact '{}'", version, artifact);
                return Optional.of(version);
            }
        }
        return Optional.empty();
    }

    protected void findPomDependencies() {
        JavaSettings settings = JavaSettings.getInstance();
        String outputFolder = settings.getAutorestSettings().getOutputFolder();
        if (outputFolder != null && Paths.get(outputFolder).isAbsolute()) {
            Path pomPath = Paths.get(outputFolder, "pom.xml");

            if (Files.isReadable(pomPath)) {
                try {
                    DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
                    DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
                    Document doc = dBuilder.parse(pomPath.toFile());
                    NodeList nodeList = doc.getDocumentElement().getChildNodes();
                    for (int i = 0; i < nodeList.getLength(); ++i) {
                        Node node = nodeList.item(i);
                        if (node.getNodeType() == Node.ELEMENT_NODE) {
                            Element elementNode = (Element) node;
                            if ("dependencies".equals(elementNode.getTagName())) {
                                NodeList dependencyNodeList = elementNode.getChildNodes();
                                for (int j = 0; j < dependencyNodeList.getLength(); ++j) {
                                    Node dependencyNode = dependencyNodeList.item(j);
                                    if (dependencyNode.getNodeType() == Node.ELEMENT_NODE) {
                                        Element dependencyElementNode = (Element) dependencyNode;
                                        if ("dependency".equals(dependencyElementNode.getTagName())) {
                                            String groupId = null;
                                            String artifactId = null;
                                            String version = null;
                                            String scope = null;
                                            NodeList itemNodeList = dependencyElementNode.getChildNodes();
                                            for (int k = 0; k < itemNodeList.getLength(); ++k) {
                                                Node itemNode = itemNodeList.item(k);
                                                if (itemNode.getNodeType() == Node.ELEMENT_NODE) {
                                                    Element elementItemNode = (Element) itemNode;
                                                    switch (elementItemNode.getTagName()) {
                                                        case "groupId":
                                                            groupId = ((Text) elementItemNode.getChildNodes().item(0)).getWholeText();
                                                            break;
                                                        case "artifactId":
                                                            artifactId = ((Text) elementItemNode.getChildNodes().item(0)).getWholeText();
                                                            break;
                                                        case "version":
                                                            version = ((Text) elementItemNode.getChildNodes().item(0)).getWholeText();
                                                            break;
                                                        case "scope":
                                                            scope = ((Text) elementItemNode.getChildNodes().item(0)).getWholeText();
                                                            break;
                                                    }
                                                }
                                            }

                                            if (groupId != null && artifactId != null && version != null) {
                                                String dependencyIdentifier = String.format("%s:%s:%s", groupId, artifactId, version);
                                                if (scope != null) {
                                                    dependencyIdentifier += ":" + scope;
                                                }
                                                this.pomDependencyIdentifiers.add(dependencyIdentifier);
                                                LOGGER.info("Found dependency identifier '{}' from POM", dependencyIdentifier);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (IOException | ParserConfigurationException | SAXException e) {
                    LOGGER.warn("Failed to parse 'pom.xml'", e);
                }
            } else {
                LOGGER.info("'pom.xml' not found or not readable");
            }
        } else {
            LOGGER.warn("'output-folder' parameter is not an absolute path, fall back to default dependencies");
        }
    }

    public String getServiceName() {
        return serviceName;
    }

    public String getServiceDescription() {
        return this.serviceDescription;
    }

    public String getServiceDescriptionForPom() {
        return this.serviceDescription;
    }

    public String getServiceDescriptionForMarkdown() {
        return this.serviceDescription;
    }

    public String getNamespace() {
        return namespace;
    }

    public String getGroupId() {
        return groupId;
    }

    public String getArtifactId() {
        return artifactId;
    }

    public String getVersion() {
        return version;
    }

    public List<String> getApiVersions() {
        return apiVersions;
    }

    public List<String> getPomDependencyIdentifiers() {
        return pomDependencyIdentifiers;
    }

    public Optional<String> getSdkRepositoryUri() {
        return Optional.ofNullable(sdkRepositoryPath == null ? null : ("https://github.com/Azure/azure-sdk-for-java/blob/main/" + sdkRepositoryPath));
    }

    public Optional<String> getSdkRepositoryPath() {
        return Optional.ofNullable(sdkRepositoryPath);
    }

    public boolean isIntegratedWithSdk() {
        return integratedWithSdk;
    }

    public boolean isGenerateSamples() {
        return JavaSettings.getInstance().isGenerateSamples();
    }
}
