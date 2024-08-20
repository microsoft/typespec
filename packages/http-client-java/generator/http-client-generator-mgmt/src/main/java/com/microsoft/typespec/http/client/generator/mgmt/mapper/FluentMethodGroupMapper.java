// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.FluentType;
import com.microsoft.typespec.http.client.generator.mgmt.model.WellKnownMethodName;
import com.microsoft.typespec.http.client.generator.mgmt.util.TypeConversionUtils;
import com.microsoft.typespec.http.client.generator.mgmt.util.Utils;
import com.microsoft.typespec.http.client.generator.core.mapper.MethodGroupMapper;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GenericType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import org.slf4j.Logger;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

public class FluentMethodGroupMapper extends MethodGroupMapper {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), FluentMethodGroupMapper.class);

    private static final FluentMethodGroupMapper INSTANCE = new FluentMethodGroupMapper();

    public static FluentMethodGroupMapper getInstance() {
        return INSTANCE;
    }

    @Override
    protected List<IType> supportedInterfaces(OperationGroup operationGroup, List<ClientMethod> clientMethods) {
        if (!JavaSettings.getInstance().isFluentLite()) {
            return findSupportedInterfaces(operationGroup, clientMethods);
        } else {
            return Collections.emptyList();
        }
    }

    List<IType> findSupportedInterfaces(OperationGroup operationGroup, List<ClientMethod> clientMethods) {
        List<IType> interfaces = new ArrayList<>();
        Optional<IType> classTypeForGet = supportGetMethod(clientMethods);
        Optional<IType> classTypeForList = supportListMethod(clientMethods);
        Optional<IType> classTypeForDelete = supportDeleteMethod(clientMethods);

        classTypeForGet.ifPresent(iType -> interfaces.add(FluentType.InnerSupportsGet(iType)));
        classTypeForList.ifPresent(iType -> interfaces.add(FluentType.InnerSupportsList(iType)));
        classTypeForDelete.ifPresent(iType -> interfaces.add(FluentType.InnerSupportsDelete(iType)));

        if (!interfaces.isEmpty()) {
            LOGGER.info("Method group '{}' support interfaces {}",
                    Utils.getJavaName(operationGroup),
                    interfaces.stream().map(IType::toString).collect(Collectors.toList()));
        }
        return interfaces;
    }

    private Optional<IType> supportGetMethod(List<ClientMethod> clientMethods) {
        return clientMethods.stream()
                .filter(m -> WellKnownMethodName.GET_BY_RESOURCE_GROUP.getMethodName().equals(m.getName())
                        && checkNonClientRequiredParameters(m, 2))
                .map(m -> m.getReturnValue().getType())
                .findFirst();
    }

    private Optional<IType> supportDeleteMethod(List<ClientMethod> clientMethods) {
        return clientMethods.stream()
                .filter(m -> WellKnownMethodName.DELETE.getMethodName().equals(m.getName())
                        && checkNonClientRequiredParameters(m, 2))
                .map(m -> m.getReturnValue().getType())
                .findFirst();
    }

    private Optional<IType> supportListMethod(List<ClientMethod> clientMethods) {
        Optional<IType> listType = clientMethods.stream()
                .filter(m -> WellKnownMethodName.LIST.getMethodName().equals(m.getName())
                        && checkNonClientRequiredParameters(m, 0))
                .map(m -> m.getReturnValue().getType())
                .findFirst();

        Optional<IType> listByResourceGroupType =clientMethods.stream()
                .filter(m -> WellKnownMethodName.LIST_BY_RESOURCE_GROUP.getMethodName().equals(m.getName())
                        && checkNonClientRequiredParameters(m, 1))
                .map(m -> m.getReturnValue().getType())
                .findFirst();

        Optional<IType> commonListType = (listType.isPresent() && listByResourceGroupType.isPresent() && Objects.equals(listType.get().toString(), listByResourceGroupType.get().toString()))
                ? listType
                : Optional.empty();

        return commonListType.filter(TypeConversionUtils::isPagedIterable)
                .map(t -> ((GenericType) t).getTypeArguments()[0]);
    }

    private boolean checkNonClientRequiredParameters(ClientMethod clientMethod, int requiredCount) {
        final boolean countRequiredParametersOnly = JavaSettings.getInstance().isRequiredParameterClientMethods();
        return requiredCount == clientMethod.getParameters().stream()
                .filter(p -> (!countRequiredParametersOnly || p.isRequired()) && !p.isConstant() && !p.isFromClient())
                .count();
    }
}
