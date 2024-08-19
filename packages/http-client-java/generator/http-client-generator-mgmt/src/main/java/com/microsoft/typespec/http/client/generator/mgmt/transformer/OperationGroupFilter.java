// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.microsoft.typespec.http.client.generator.core.preprocessor.namer.CodeNamer;
import org.slf4j.Logger;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public class OperationGroupFilter {

    private final Logger logger = new PluginLogger(FluentNamer.getPluginInstance(), OperationGroupFilter.class);

    private final Set<String> javaNamesForPreserveModel;

    public OperationGroupFilter(Set<String> javaNamesForPreserveModel) {
        this.javaNamesForPreserveModel = javaNamesForPreserveModel;
    }

    public CodeModel process(CodeModel codeModel) {
        // remove operation group
        List<OperationGroup> operationGroups = codeModel.getOperationGroups().stream().filter(og -> {
            String methodGroupName = CodeNamer.getPlural(Utils.getJavaName(og));
            boolean remove = javaNamesForPreserveModel.contains(methodGroupName);
            if (remove) {
                logger.info("Removed operation group '{}'", methodGroupName);
            }
            return !remove;
        }).collect(Collectors.toList());
        if (operationGroups.size() < codeModel.getOperationGroups().size()) {
            codeModel.setOperationGroups(operationGroups);
        }

        return codeModel;
    }
}
