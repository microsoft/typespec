// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mapper;

import com.azure.autorest.extension.base.model.codemodel.Client;
import com.azure.autorest.extension.base.model.codemodel.CodeModel;
import com.azure.autorest.extension.base.model.codemodel.OperationGroup;
import com.azure.autorest.mapper.Mappers;
import com.azure.autorest.mapper.ServiceClientMapper;
import com.azure.autorest.model.clientmodel.MethodGroupClient;
import com.azure.autorest.model.clientmodel.PipelinePolicyDetails;
import com.azure.autorest.model.clientmodel.Proxy;
import com.azure.autorest.model.clientmodel.ServiceClient;
import com.azure.autorest.model.clientmodel.ServiceClientProperty;
import com.azure.autorest.util.ClientModelUtil;
import com.azure.autorest.util.SchemaUtil;
import com.azure.core.util.CoreUtils;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class TypeSpecServiceClientMapper extends ServiceClientMapper {

    public ServiceClient map(Client client, CodeModel codeModel) {
        ServiceClient.Builder builder = createClientBuilder();

        String baseName = SchemaUtil.getJavaName(client);
        String className = ClientModelUtil.getClientImplementClassName(baseName);
        String packageName = ClientModelUtil.getServiceClientPackageName(className);
        builder.interfaceName(baseName)
                .className(className)
                .packageName(packageName);
        if (client.getLanguage().getJava() != null && !CoreUtils.isNullOrEmpty(client.getLanguage().getJava().getNamespace())) {
            builder.builderPackageName(client.getLanguage().getJava().getNamespace());
        }

        Proxy proxy = null;
        OperationGroup clientOperationGroup = client.getOperationGroups().stream()
                .filter(og -> CoreUtils.isNullOrEmpty(SchemaUtil.getJavaName(og)))
                .findFirst().orElse(null);
        if (clientOperationGroup != null) {
            proxy = processClientOperations(builder, clientOperationGroup.getOperations(), baseName);
        } else {
            builder.clientMethods(Collections.emptyList());
        }

        List<ServiceClientProperty> properties = processClientProperties(client,
                client.getServiceVersion() == null ? null : client.getServiceVersion().getLanguage().getJava().getName());

        List<MethodGroupClient> methodGroupClients = new ArrayList<>();
        client.getOperationGroups().stream()
                .filter(og -> !CoreUtils.isNullOrEmpty(SchemaUtil.getJavaName(og)))
                .forEach(og -> methodGroupClients.add(Mappers.getMethodGroupMapper().map(og, properties)));
        builder.methodGroupClients(methodGroupClients);

        if (proxy == null) {
            proxy = methodGroupClients.iterator().next().getProxy();
        }

        // TODO (weidxu): security definition could be different for different client
        processParametersAndConstructors(builder, client, codeModel, properties, proxy);

        processPipelinePolicyDetails(builder, client);

        builder.crossLanguageDefinitionId(client.getCrossLanguageDefinitionId());

        return builder.build();
    }

    private static void processPipelinePolicyDetails(ServiceClient.Builder builder, Client client) {
        // handle corner case of RequestIdPolicy with header name "client-request-id"
        final String clientRequestIdHeaderName = "client-request-id";
        final boolean clientRequestIdHeaderInClient = client.getOperationGroups().stream()
                .flatMap(og -> og.getOperations().stream())
                .anyMatch(o -> o.getSpecialHeaders() != null && o.getSpecialHeaders().contains(clientRequestIdHeaderName));
        if (clientRequestIdHeaderInClient) {
            builder.pipelinePolicyDetails(new PipelinePolicyDetails().setRequestIdHeaderName(clientRequestIdHeaderName));
        }
    }
}
