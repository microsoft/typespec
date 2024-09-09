// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * The collection of all client models stored for inheritance lookup.
 */
public class ClientModels {
    private static final ClientModels INSTANCE = new ClientModels();
    private final Map<String, ClientModel> nameMap = new HashMap<>();
//    private final Map<String, ArrayList<ClientModel>> derivedTypesMap = new HashMap<String, ArrayList<ClientModel>>();
    private ClientModels() {
    }

    public final void clear() {
        nameMap.clear();
    }

    public static ClientModels getInstance() {
        return INSTANCE;
    }

    /**
     * Gets the ClientModel instance from the name of the model.
     * <p>
     * Use {@link ClientModelUtil#getClientModel(String)} unless ModelMapper or ClientModelUtil.
     *
     * @param modelName the name of the model.
     * @return the ClientModel instance.
     */
    public final ClientModel getModel(String modelName) {
        return nameMap.get(modelName);
    }

    public final void addModel(ClientModel model) {
        nameMap.put(model.getName(), model);

//        String parentModel = model.getParentModelName();
//        if (parentModel != null) {
//            ArrayList<ClientModel> derivedTypesList = getDerivedTypeList(parentModel);
//            derivedTypesList.add(model);
//        }
    }

//    public final List<ClientModel> getDerivedTypes(String parentModelName) {
//        return getDerivedTypeList(parentModelName);
//    }

    public final List<ClientModel> getModels() {
        return new ArrayList<>(nameMap.values());
    }

//    private ArrayList<ClientModel> getDerivedTypeList(String parentModelName) {
//        if (!derivedTypesMap.containsKey(parentModelName)) {
//            derivedTypesMap.put(parentModelName, new ArrayList<ClientModel>());
//        }
//        return derivedTypesMap.get(parentModelName);
//    }
}
