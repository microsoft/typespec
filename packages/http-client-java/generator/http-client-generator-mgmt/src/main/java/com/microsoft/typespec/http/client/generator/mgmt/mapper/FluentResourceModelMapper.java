// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.ObjectSchema;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentResourceModel;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.mapper.IMapper;
import com.microsoft.typespec.http.client.generator.core.mapper.Mappers;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.azure.core.util.CoreUtils;

import java.util.ArrayList;
import java.util.List;

public class FluentResourceModelMapper implements IMapper<ObjectSchema, FluentResourceModel> {

    private static final FluentResourceModelMapper INSTANCE = new FluentResourceModelMapper();

    public static FluentResourceModelMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public FluentResourceModel map(ObjectSchema objectSchema) {
        FluentResourceModel fluentResourceModel = null;

        ClientModel clientModel = Mappers.getModelMapper().map(objectSchema);
        if (clientModel != null && FluentUtils.isInnerClassType(clientModel.getPackage(), clientModel.getName())) {
            List<ClientModel> parentModels = new ArrayList<>();
            String parentModelName = clientModel.getParentModelName();
            while (!CoreUtils.isNullOrEmpty(parentModelName)) {
                ClientModel parentModel = FluentUtils.getClientModel(parentModelName);
                if (parentModel != null) {
                    parentModels.add(parentModel);
                }
                parentModelName = parentModel == null ? null : parentModel.getParentModelName();
            }

            fluentResourceModel = new FluentResourceModel(clientModel, parentModels);
        }

        return fluentResourceModel;
    }
}
