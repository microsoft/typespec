// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.util;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientResponse;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ImplementationDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.UnionModel;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;

public final class ModelUtil {

    public static boolean isGeneratingModel(ClientModel model) {
        return model.getImplementationDetails() != null
            && (model.getImplementationDetails().isPublic() || model.getImplementationDetails().isInternal())
            && !(isExternalModel(model.getImplementationDetails()))
            && !(JavaSettings.getInstance().isBranded() && isPagedModel(model.getImplementationDetails()));
    }

    public static boolean isGeneratingModel(EnumType model) {
        return model.getImplementationDetails() != null
            && (model.getImplementationDetails().isPublic() || model.getImplementationDetails().isInternal());
    }

    public static boolean isGeneratingModel(ClientResponse response) {
        IType bodyType = response.getBodyType();
        boolean ret = ClientModelUtil.isClientModel(bodyType);
        if (ret) {
            ClassType classType = (ClassType) bodyType;
            ClientModel model = ClientModelUtil.getClientModel(classType.getName());
            if (model != null) {
                ret = isGeneratingModel(model);
            }
        }
        return ret;
    }

    public static boolean isGeneratingModel(UnionModel model) {
        return model.getImplementationDetails() != null
            && (model.getImplementationDetails().isPublic() || model.getImplementationDetails().isInternal())
            && !(isExternalModel(model.getImplementationDetails()));
    }

    private static boolean isPagedModel(ImplementationDetails implementationDetails) {
        return (implementationDetails.getUsages() != null
            && implementationDetails.getUsages().contains(ImplementationDetails.Usage.PAGED));
    }

    private static boolean isExternalModel(ImplementationDetails implementationDetails) {
        return (implementationDetails.getUsages() != null
            && implementationDetails.getUsages().contains(ImplementationDetails.Usage.EXTERNAL));
    }
}
