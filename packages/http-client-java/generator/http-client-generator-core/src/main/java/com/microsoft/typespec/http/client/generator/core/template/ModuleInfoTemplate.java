// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ModuleInfo;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;

import java.util.stream.Collectors;

public class ModuleInfoTemplate implements IJavaTemplate<ModuleInfo, JavaFile> {

    private static final ModuleInfoTemplate INSTANCE = new ModuleInfoTemplate();

    private ModuleInfoTemplate() {
    }

    public static ModuleInfoTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    public void write(ModuleInfo model, JavaFile javaFile) {
        JavaSettings settings = JavaSettings.getInstance();
        if (settings.getFileHeaderText() != null && !settings.getFileHeaderText().isEmpty()) {
            javaFile.lineComment(comment -> {
                comment.line(settings.getFileHeaderText());
            });
            javaFile.line();
        }

        javaFile.line(String.format("module %1$s {", model.getModuleName()));
        javaFile.indent(() -> {
            for (ModuleInfo.RequireModule module : model.getRequireModules().stream().distinct().collect(Collectors.toList())) {
                javaFile.line(String.format("requires %1$s%2$s;",
                        module.isTransitive() ? "transitive " : "",
                        module.getModuleName()));
            }
            for (ModuleInfo.ExportModule module : model.getExportModules().stream().distinct().collect(Collectors.toList())) {
                javaFile.line(String.format("exports %1$s;",
                        module.getModuleName()));
            }
            for (ModuleInfo.OpenModule module : model.getOpenModules().stream().distinct().collect(Collectors.toList())) {
                javaFile.line(String.format("opens %1$s%2$s;",
                        module.getModuleName(),
                        module.isOpenTo() ? (" to " + String.join(", ", module.getOpenToModules())) : ""));
            }
        });
        javaFile.line("}");
    }
}
