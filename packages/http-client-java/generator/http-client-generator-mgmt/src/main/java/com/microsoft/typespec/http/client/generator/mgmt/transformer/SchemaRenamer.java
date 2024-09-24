// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.azure.core.util.CoreUtils;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Metadata;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import java.util.Map;
import org.slf4j.Logger;

public class SchemaRenamer {

    private static final Logger LOGGER = new PluginLogger(FluentNamer.getPluginInstance(), SchemaRenamer.class);

    private final Map<String, String> renameModel;

    public SchemaRenamer(Map<String, String> renameModel) {
        this.renameModel = renameModel;
    }

    public CodeModel process(CodeModel codeModel) {
        if (renameModel == null || renameModel.isEmpty()) {
            return codeModel;
        }

        codeModel.getSchemas().getObjects().forEach(s -> checkRename(s, renameModel));
        codeModel.getSchemas().getChoices().forEach(s -> checkRename(s, renameModel));
        codeModel.getSchemas().getSealedChoices().forEach(s -> checkRename(s, renameModel));
        return codeModel;
    }

    private static void checkRename(Metadata m, Map<String, String> renameModel) {
        String name = Utils.getJavaName(m);
        String newName = renameModel.get(name);
        if (!CoreUtils.isNullOrEmpty(newName)) {
            LOGGER.info("Rename model from '{}' to '{}'", name, newName);
            m.getLanguage().getJava().setName(newName);
        }
    }
}
