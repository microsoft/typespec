// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;


import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PackageInfo;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.partialupdate.util.PartialUpdateHandler;

import java.util.regex.Pattern;

/**
 * Writes a PackageInfo to a JavaFile.
 */
public class PackageInfoTemplate implements IJavaTemplate<PackageInfo, JavaFile> {
    private static final PackageInfoTemplate INSTANCE = new PackageInfoTemplate();

    private static final Pattern NEW_LINE = Pattern.compile(Pattern.quote("\r\n"));

    private PackageInfoTemplate() {
    }

    public static PackageInfoTemplate getInstance() {
        return INSTANCE;
    }

    public final void write(PackageInfo packageInfo, JavaFile javaFile) {
        JavaSettings settings = JavaSettings.getInstance();
        if (settings.getFileHeaderText() != null && !settings.getFileHeaderText().isEmpty()) {
            javaFile.lineComment((comment) ->
                comment.line(settings.getFileHeaderText()));
            javaFile.line();
        }

        javaFile.javadocComment((comment) -> {
            if (settings.isHandlePartialUpdate()) {
                comment.line(PartialUpdateHandler.START_GENERATED_JAVA_DOC);
            }

            for (String desc : NEW_LINE.split(packageInfo.getDescription(), -1)) {
                comment.description(desc);
            }

            if (settings.isHandlePartialUpdate()) {
                comment.line(PartialUpdateHandler.END_GENERATED_JAVA_DOC);
            }
        });

        javaFile.declarePackage(packageInfo.getPackage());
    }
}
