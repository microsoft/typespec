// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.transformer;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Response;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.mgmt.FluentNamer;
import com.azure.core.http.HttpMethod;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public class ResponseStatusCodeNormalization {

    private static final Logger LOGGER = new PluginLogger(FluentNamer.getPluginInstance(), ResponseStatusCodeNormalization.class);

    private static final boolean REMOVE_404_IN_GET_RESPONSE = true;

    public CodeModel process(CodeModel codeModel) {
        codeModel.getOperationGroups().stream().flatMap(og -> og.getOperations().stream())
                // only for GET method
                .filter(o -> o.getRequests().stream()
                        .anyMatch(r -> r.getProtocol() != null && r.getProtocol().getHttp() != null
                                && HttpMethod.GET.name().equalsIgnoreCase(r.getProtocol().getHttp().getMethod())))
                .forEach(operation -> {
                    List<Response> responsesToRemove = new ArrayList<>();
                    for (Response response : operation.getResponses()) {
                        if (response.getProtocol() != null && response.getProtocol().getHttp() != null && response.getProtocol().getHttp().getStatusCodes() != null) {
                            if (response.getProtocol().getHttp().getStatusCodes().contains("404")) {
                                LOGGER.warn("Operation '{}' expect '404' status code, in group '{}'",
                                        Utils.getJavaName(operation), Utils.getJavaName(operation.getOperationGroup()));

                                if (REMOVE_404_IN_GET_RESPONSE) {
                                    String operationNameInLower = Utils.getJavaName(operation).toLowerCase(Locale.ROOT);
                                    if (operationNameInLower.startsWith("get") || operationNameInLower.startsWith("list")) {
                                        LOGGER.info("Remove '404' status code in operation '{}', in group '{}'",
                                                Utils.getJavaName(operation), Utils.getJavaName(operation.getOperationGroup()));
                                        if (response.getProtocol().getHttp().getStatusCodes().size() == 1) {
                                            // remove the response with only 404
                                            responsesToRemove.add(response);
                                        } else {
                                            response.getProtocol().getHttp().getStatusCodes().remove("404");
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (!responsesToRemove.isEmpty()) {
                        operation.getResponses().removeAll(responsesToRemove);
                    }
                });

        return codeModel;
    }
}
