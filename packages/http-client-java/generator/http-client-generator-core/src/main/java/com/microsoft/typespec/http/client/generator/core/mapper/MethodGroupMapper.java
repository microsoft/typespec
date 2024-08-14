// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.mapper;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.OperationGroup;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientModels;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.MethodGroupClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.Proxy;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClientProperty;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.microsoft.typespec.http.client.generator.core.util.MethodUtil;
import com.azure.core.util.CoreUtils;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public class MethodGroupMapper implements IMapper<OperationGroup, MethodGroupClient> {
    private static final MethodGroupMapper INSTANCE = new MethodGroupMapper();
    private final Map<OperationGroup, MethodGroupClient> parsed = new ConcurrentHashMap<>();

    protected MethodGroupMapper() {
    }

    public static MethodGroupMapper getInstance() {
        return INSTANCE;
    }

    @Override
    public MethodGroupClient map(OperationGroup methodGroup) {
        return this.map(methodGroup, null);
    }

    public MethodGroupClient map(OperationGroup methodGroup, List<ServiceClientProperty> parentClientProperties) {
        MethodGroupClient methodGroupClient = parsed.get(methodGroup);
        if (methodGroupClient != null) {
            return methodGroupClient;
        }

        methodGroupClient = createMethodGroupClient(methodGroup, parentClientProperties);
        parsed.put(methodGroup, methodGroupClient);

        return methodGroupClient;
    }

    private MethodGroupClient createMethodGroupClient(OperationGroup methodGroup, List<ServiceClientProperty> parentClientProperties) {
        JavaSettings settings = JavaSettings.getInstance();
        MethodGroupClient.Builder builder = createMethodGroupClientBuilder();

        String classBaseName = methodGroup.getLanguage().getJava().getName();
        builder.classBaseName(classBaseName);
        String interfaceName = CodeNamer.getPlural(classBaseName);
        final String interfaceNameForCheckDeduplicate = interfaceName;
        if (ClientModels.getInstance().getModels().stream().anyMatch(cm -> interfaceNameForCheckDeduplicate.equals(cm.getName()))
            || parsed.values().stream().anyMatch(mg -> interfaceNameForCheckDeduplicate.equals(mg.getInterfaceName()))) {
            interfaceName += "Operations";
        }
        builder.interfaceName(interfaceName);
        String className = interfaceName;
        if (settings.isFluent()) {
            if (settings.isGenerateClientAsImpl()) {
                className += "ClientImpl";
            } else {
                className += "Client";
            }
        } else if (settings.isGenerateClientAsImpl()) {
            className += "Impl";
        }
        builder.className(className);

        if (!CoreUtils.isNullOrEmpty(methodGroup.getOperations())) {
            Proxy.Builder proxyBuilder = createProxyBuilder();

            String restAPIName = CodeNamer.toPascalCase(CodeNamer.getPlural(methodGroup.getLanguage().getJava().getName()));
            restAPIName += "Service";
            String serviceClientName = methodGroup.getCodeModel().getLanguage().getJava().getName();
            // TODO: Assume all operations share the same base url
            proxyBuilder.name(restAPIName)
                    .clientTypeName(serviceClientName + interfaceName)
                    .baseURL(methodGroup.getOperations().get(0).getRequests().get(0).getProtocol().getHttp().getUri());

            List<ProxyMethod> restAPIMethods = new ArrayList<>();
            for (Operation method : methodGroup.getOperations()) {
                if (settings.isDataPlaneClient()) {
                    MethodUtil.tryMergeBinaryRequestsAndUpdateOperation(method.getRequests(), method);
                }
                restAPIMethods.addAll(Mappers.getProxyMethodMapper().map(method).values().stream().flatMap(Collection::stream).collect(Collectors.toList()));
            }
            proxyBuilder.methods(restAPIMethods);

            builder.proxy(proxyBuilder.build());
        }

        String serviceClientName = ClientModelUtil.getClientImplementClassName(methodGroup.getCodeModel());
        builder.serviceClientName(serviceClientName);

        builder.variableName(CodeNamer.toCamelCase(interfaceName));

        if (settings.isFluent() && settings.isGenerateClientInterfaces()) {
            interfaceName += "Client";
            builder.interfaceName(interfaceName);
        }

        builder.variableType(settings.isGenerateClientInterfaces() ? interfaceName : className);

        List<String> implementedInterfaces = new ArrayList<>();
        if (settings.isGenerateClientInterfaces()) {
            implementedInterfaces.add(interfaceName);
        }
        builder.implementedInterfaces(implementedInterfaces);

        String packageName;
        if (settings.isFluent()) {
            packageName = settings.getPackage(settings.isGenerateClientAsImpl() ? settings.getImplementationSubpackage() : settings.getFluentSubpackage());
        } else {
            boolean isCustomType = settings.isCustomType(className);
            packageName = settings.getPackage(isCustomType ? settings.getCustomTypesSubpackage() : (settings.isGenerateClientAsImpl() ? settings.getImplementationSubpackage() : null));
        }
        builder.packageName(packageName);

        List<ClientMethod> clientMethods = new ArrayList<>();
        for (Operation operation : methodGroup.getOperations()) {
            clientMethods.addAll(Mappers.getClientMethodMapper().map(operation));
        }
        if (settings.isGenerateSendRequestMethod()) {
            clientMethods.add(ClientMethod.getAsyncSendRequestClientMethod(true));
            if (settings.getSyncMethods() != JavaSettings.SyncMethodsGeneration.NONE) {
                clientMethods.add(ClientMethod.getSyncSendRequestClientMethod(true));
            }
        }
        builder.clientMethods(clientMethods);
        builder.supportedInterfaces(supportedInterfaces(methodGroup, clientMethods));

        if (!CoreUtils.isNullOrEmpty(parentClientProperties) && settings.isGenerateClientAsImpl()) {
            // filter for serviceVersion
            builder.properties(parentClientProperties.stream()
                .filter(p -> Objects.equals("serviceVersion", p.getName()))
                .collect(Collectors.toList()));
        }

        return builder.build();
    }

    protected MethodGroupClient.Builder createMethodGroupClientBuilder() {
        return new MethodGroupClient.Builder();
    }

    protected Proxy.Builder createProxyBuilder() {
        return new Proxy.Builder();
    }

    protected List<IType> supportedInterfaces(OperationGroup operationGroup, List<ClientMethod> clientMethods) {
        return Collections.emptyList();
    }
}
