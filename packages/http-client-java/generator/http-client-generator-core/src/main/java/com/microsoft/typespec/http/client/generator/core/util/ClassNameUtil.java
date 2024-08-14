// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.util;

public final class ClassNameUtil {

    /**
     * Truncate class name to avoid path too long.
     *
     * It contains some heuristic logic, and the result may not be exactly correct.
     *
     * @param namespace the namespace of the package, used to deduce the artifact id and group id
     * @param directory the part of directory from maven project
     * @param packageName the namespace/package of the class
     * @param className the name of the class
     * @return the truncated class name
     */
    public static String truncateClassName(
            String namespace, String directory,
            String packageName, String className) {
        // see https://github.com/Azure/azure-sdk-for-java/blob/main/eng/common/pipelines/templates/steps/verify-path-length.yml
        final int maxPathLength = 260;
        final int basePathLength = 38;

        // usual directory layout is:
        // /sdk/<group>/<artifact>/<directory>/<package_name>/<class_name>.java

        // heuristic
        final int groupLength = namespace.length() - namespace.lastIndexOf(".");
        final int artifactLength = namespace.length() - namespace.indexOf(".");

        final int directoryLength = directory.length();
        final int packageLength = packageName.length();
        final int extraLength = 14;

        final int minRemainLength = 5;

        final int remainLength = maxPathLength - basePathLength - groupLength - artifactLength - directoryLength - packageLength - extraLength;

        if (remainLength < className.length() && remainLength >= minRemainLength) {
            className = className.substring(0, remainLength - 1);
        }
        return className;
    }
}
