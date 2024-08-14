// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientException;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModel;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.EnumType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.GraalVmConfig;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class GraalVmConfigMapper implements IMapper<GraalVmConfigMapper.ServiceAndModel, GraalVmConfig> {

    public static class ServiceAndModel {
        private final Collection<ServiceClient> serviceClients;
        private final Collection<ClientException> exceptions;
        private final Collection<ClientModel> models;
        private final Collection<EnumType> enums;

        public ServiceAndModel(Collection<ServiceClient> serviceClients,
                               Collection<ClientException> exceptions,
                               Collection<ClientModel> models,
                               Collection<EnumType> enums) {
            this.serviceClients = serviceClients;
            this.exceptions = exceptions;
            this.models = models;
            this.enums = enums;
        }
    }

    private static final GraalVmConfigMapper INSTANCE = new GraalVmConfigMapper();

    protected GraalVmConfigMapper() {
    }

    public static GraalVmConfigMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public GraalVmConfig map(ServiceAndModel data) {
        List<String> proxies;
        List<String> reflects;

        final boolean streamStyle = JavaSettings.getInstance().isStreamStyleSerialization();

        // Reflect
        // Exception and error model is still created by reflection in azure-core
        reflects = data.exceptions.stream()
                .map(e -> e.getPackage() + "." + e.getName())
                .collect(Collectors.toList());
        reflects.addAll(data.models.stream()
                .filter(m -> !streamStyle || (m.getImplementationDetails() != null && m.getImplementationDetails().isException()))
                .map(m -> m.getPackage() + "." + m.getName())
                .collect(Collectors.toList()));
        reflects.addAll(data.enums.stream()
                .filter(m -> !streamStyle || (m.getImplementationDetails() != null && m.getImplementationDetails().isException()))
                .map(m -> m.getPackage() + "." + m.getName())
                .collect(Collectors.toList()));

        // Proxy
        proxies = data.serviceClients.stream()
                .flatMap(sc -> {
                    if (sc.getMethodGroupClients() != null) {
                        return sc.getMethodGroupClients().stream();
                    } else {
                        return Stream.empty();
                    }
                })
                .filter(m -> m.getProxy() != null)
                .map(m -> m.getPackage() + "." + m.getClassName() + "$" + m.getProxy().getName())
                .collect(Collectors.toList());
        proxies.addAll(data.serviceClients.stream()
                .filter(sc -> sc.getProxy() != null)
                .map(sc -> sc.getPackage() + "." + sc.getClassName() + "$" + sc.getProxy().getName())
                .collect(Collectors.toList()));

        return new GraalVmConfig(proxies, reflects, JavaSettings.getInstance().isFluent());
    }
}
