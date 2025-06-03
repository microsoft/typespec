// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

import java.nio.file.Paths;
import java.util.regex.Pattern;

public final class ClassNameUtil {

    /**
     * Truncate class name to avoid path too long.
     *
     * It contains some heuristic logic, and the result may not be exactly correct.
     *
     * @param namespace the namespace of the package, used to deduce the artifact id and group id
     * @param directory the part of directory from maven project
     * @param packageName the namespace/package of the class
     * @param className the name of the class, full className be className + classNameSuffix
     * @param classNameSuffix the suffix to the class name, truncate will keep this unchanged
     * @return the truncated class name
     */
    public static String truncateClassName(String namespace, String directory, String packageName, String className,
        String classNameSuffix) {
        // see
        // https://github.com/Azure/azure-sdk-for-java/blob/main/eng/common/pipelines/templates/steps/verify-path-length.yml
        final int maxPathLength = 260;
        final int basePathLength = 38;

        // directory layout in Java SDK repository is:
        // sdk/<group>/<artifact>/<directory>/<package_name>/<class_name><class_name_suffix>.java

        final String[] namespaceSegments = namespace.split(Pattern.quote("."));
        final int groupLength
            = (namespaceSegments.length > 3 ? namespaceSegments[3] : namespaceSegments[namespaceSegments.length - 1])
                .length();
        final int artifactLength = namespace.length() - namespace.indexOf(".") - 1;

        final int directoryLength = directory.length();
        final int packageLength = packageName.length();
        final int classNameSuffixLength = classNameSuffix.length();
        final int extraLength = "sdk".length() + 5 + ".java".length();  // 5 for "/"

        final int minRemainLength = 5;  // we still need some char for class name

        final int remainLength = maxPathLength - basePathLength - groupLength - artifactLength - directoryLength
            - packageLength - classNameSuffixLength - extraLength;

        if (remainLength < className.length() && remainLength >= minRemainLength) {
            className = className.substring(0, remainLength);
        }
        return className + classNameSuffix;
    }

    /**
     * Gets the directory name for GraalVM config. It uses a shorter directory, when artifactId is too long.
     *
     * @param groupId the group ID
     * @param artifactId the artifact ID
     * @return the directory name for GraalVM config
     */
    public static String getDirectoryNameForGraalVmConfig(String groupId, String artifactId) {
        String metaInfPath
            = Paths.get("src", "main", "resources", "META-INF", "native-image", groupId, artifactId).toString();

        final String[] artifactIdSegments = artifactId.split(Pattern.quote("-"));
        final String group = (artifactIdSegments.length > 2
            ? artifactIdSegments[2]
            : artifactIdSegments[artifactIdSegments.length - 1]);
        final int parentDirectoryLength = ("sdk/" + group + "/" + artifactId + "/").length();
        final int fileNameLength = "/reflect-config.json".length();

        if (parentDirectoryLength + metaInfPath.length() > (248 - 38)
            || parentDirectoryLength + metaInfPath.length() + fileNameLength > (260 - 38)) {
            // see
            // https://github.com/Azure/azure-sdk-for-java/blob/main/eng/common/pipelines/templates/steps/verify-path-length.yml
            String shortenedArtifactId = artifactId;
            if (artifactId.startsWith("azure-resourcemanager-")) {
                shortenedArtifactId = artifactId.substring("azure-resourcemanager-".length());
            }
            metaInfPath
                = Paths.get("src", "main", "resources", "META-INF", "native-image", groupId, shortenedArtifactId)
                    .toString();
        }

        return metaInfPath;
    }
}
