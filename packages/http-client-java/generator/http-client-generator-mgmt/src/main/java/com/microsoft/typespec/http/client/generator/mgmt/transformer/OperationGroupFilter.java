// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.preprocessor.namer.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import io.clientcore.core.utils.CoreUtils;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.slf4j.Logger;

public class OperationGroupFilter {

    private final Logger logger = new PluginLogger(FluentNamer.getPluginInstance(), OperationGroupFilter.class);

    private final Set<String> javaNamesForPreserveModel;

    public OperationGroupFilter(Set<String> javaNamesForPreserveModel) {
        this.javaNamesForPreserveModel = javaNamesForPreserveModel;
    }

    public CodeModel process(CodeModel codeModel) {
        if (!CoreUtils.isNullOrEmpty(codeModel.getClients())) {
            // Nested clients are the canonical source used by schema cleanup and client mapping. Filtering only
            // the flattened root copy would leave removed groups alive in those later stages.
            codeModel.getClients().forEach(this::filterOperationGroups);
            // Keep the legacy management transformers' root view in client order, even when every group was
            // removed. Do not fall back to the pre-filter root list when the canonical lists are empty.
            codeModel.setOperationGroups(ClientModelUtil.getAllOperationGroups(codeModel));
        } else {
            filterOperationGroups(codeModel);
        }
        return codeModel;
    }

    private void filterOperationGroups(Client client) {
        List<OperationGroup> operationGroups = client.getOperationGroups().stream().filter(og -> {
            String methodGroupName = CodeNamer.getPlural(Utils.getJavaName(og));
            boolean remove = javaNamesForPreserveModel.contains(methodGroupName);
            if (remove) {
                logger.info("Removed operation group '{}'", methodGroupName);
            }
            return !remove;
        }).collect(Collectors.toList());
        if (operationGroups.size() < client.getOperationGroups().size()) {
            client.setOperationGroups(operationGroups);
        }
    }
}
