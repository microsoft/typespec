// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Client;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.CodeModel;
import com.microsoft.typespec.http.client.generator.core.mapper.ClientMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientResponse;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.util.ModelUtil;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public class TypeSpecClientMapper extends ClientMapper {

    private static final ClientMapper INSTANCE = new TypeSpecClientMapper();

    public static ClientMapper getInstance() {
        return INSTANCE;
    }

    protected TypeSpecClientMapper() {
    }

    @Override
    protected Map<ServiceClient, Client> processClients(List<Client> clients, CodeModel codeModel) {
        Map<ServiceClient, Client> serviceClientsMap = new LinkedHashMap<>();
        TypeSpecServiceClientMapper mapper = new TypeSpecServiceClientMapper();
        for (Client client : clients) {
            serviceClientsMap.put(mapper.map(client, codeModel), client);
        }
        return serviceClientsMap;
    }

    @Override
    protected List<String> getModelsPackages(List<ClientModel> clientModels, List<EnumType> enumTypes, List<ClientResponse> responseModels) {

        Set<String> packages = clientModels.stream()
                .filter(ModelUtil::isGeneratingModel)
                .map(ClientModel::getPackage)
                .collect(Collectors.toSet());

        packages.addAll(enumTypes.stream()
                .filter(ModelUtil::isGeneratingModel)
                .map(EnumType::getPackage)
                .collect(Collectors.toSet()));

        packages.addAll(responseModels.stream()
                .filter(ModelUtil::isGeneratingModel)
                .map(ClientResponse::getPackage)
                .collect(Collectors.toSet()));

        return new ArrayList<>(packages);
    }
}
