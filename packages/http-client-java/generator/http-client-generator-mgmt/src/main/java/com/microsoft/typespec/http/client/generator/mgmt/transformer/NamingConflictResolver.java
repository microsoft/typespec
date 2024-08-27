// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Metadata;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ValueSchema;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.util.Constants;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.microsoft.typespec.http.client.generator.core.preprocessor.namer.CodeNamer;
import org.slf4j.Logger;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

public class NamingConflictResolver {

    private static final Logger LOGGER = new PluginLogger(FluentNamer.getPluginInstance(), NamingConflictResolver.class);

    public CodeModel process(CodeModel codeModel) {
        // conform to lowercase, to avoid problem on Windows system, where file name is case-insensitive
        Set<String> methodGroupNamesLowerCase = new HashSet<>();
        Set<String> objectNamesLowerCase = codeModel.getSchemas().getObjects().stream()
                .map(Utils::getJavaName)
                .map(n -> n.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        codeModel.getOperationGroups().forEach(og -> {
            String methodGroupName = CodeNamer.getPlural(Utils.getJavaName(og));
            String newMethodGroupName = methodGroupName;
            if (objectNamesLowerCase.contains(methodGroupName.toLowerCase(Locale.ROOT))) {
                // deduplicate from objects
                String newName = renameOperationGroup(og);
                newMethodGroupName = CodeNamer.getPlural(CodeNamer.getMethodGroupName(newName));
            } else if (methodGroupNamesLowerCase.contains(methodGroupName.toLowerCase(Locale.ROOT))) {
                // deduplicate from other operation groups
                String newName = renameOperationGroup(og);
                newMethodGroupName = CodeNamer.getPlural(CodeNamer.getMethodGroupName(newName));
            }

            methodGroupNamesLowerCase.add(newMethodGroupName.toLowerCase(Locale.ROOT));
            if (JavaSettings.getInstance().isGenerateClientInterfaces()) {
                methodGroupNamesLowerCase.add((newMethodGroupName + "Client").toLowerCase(Locale.ROOT));
            }
        });

        String clientNameLowerCase = Utils.getJavaName(codeModel).toLowerCase(Locale.ROOT);
        if (methodGroupNamesLowerCase.contains(clientNameLowerCase) || objectNamesLowerCase.contains(clientNameLowerCase)) {
            String name = Utils.getJavaName(codeModel);
            String newName;

            final String keywordManagementClient = "ManagementClient";
            final String keywordClient = "Client";
            if (name.endsWith(keywordClient) && !name.endsWith(keywordManagementClient)) {
                newName = name.substring(0, name.length() - keywordClient.length()) + keywordManagementClient;
            } else if (name.endsWith(keywordManagementClient)) {
                newName = name.substring(0, name.length() - keywordManagementClient.length()) + "Main" + keywordManagementClient;
            } else {
                newName = name + keywordManagementClient;
            }

            LOGGER.info("Rename code model from '{}' to '{}'", name, newName);
            codeModel.getLanguage().getJava().setName(newName);
        }

        // deduplicate enums from objects
        codeModel.getSchemas().getChoices().forEach(c -> validateChoiceName(c, objectNamesLowerCase));
        codeModel.getSchemas().getSealedChoices().forEach(c -> validateChoiceName(c, objectNamesLowerCase));

        return codeModel;
    }

    private static String renameOperationGroup(Metadata m) {
        String name = Utils.getJavaName(m);
        String newName = name + Constants.OPERATION_GROUP_DEDUPLICATE_SUFFIX;
        LOGGER.info("Rename operation group from '{}' to '{}'", name, newName);
        m.getLanguage().getJava().setName(newName);
        return newName;
    }

    private static void validateChoiceName(ValueSchema choice, Set<String> objectNames) {
        String name = Utils.getJavaName(choice);
        if (objectNames.contains(name.toLowerCase(Locale.ROOT))) {
            String newName = name + "Value";
            LOGGER.warn("Name conflict of choice with object '{}'", name);
            LOGGER.info("Rename choice from '{}' to '{}'", name, newName);
            choice.getLanguage().getJava().setName(newName);
        }
    }
}
