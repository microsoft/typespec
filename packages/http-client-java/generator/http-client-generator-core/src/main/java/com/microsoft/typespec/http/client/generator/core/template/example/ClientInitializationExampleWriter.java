// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.example;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Scheme;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodExample;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethodParameter;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClientProperty;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Consumer;

/** Client initialization example writer for DPG methods. */
public class ClientInitializationExampleWriter {
    private final Set<String> imports = new HashSet<>();
    private final Consumer<JavaBlock> clientInitializationWriter;
    private final String clientVarName;

    public ClientInitializationExampleWriter(
            AsyncSyncClient syncClient,
            ClientMethod method,
            ProxyMethodExample proxyMethodExample,
            ServiceClient serviceClient){
        syncClient.addImportsTo(imports, false);
        syncClient.getClientBuilder().addImportsTo(imports, false);
        clientVarName = CodeNamer.toCamelCase(syncClient.getClassName());
        final String builderName = syncClient.getClientBuilder().getClassName();

        // credential
        imports.add("com.azure.identity.DefaultAzureCredentialBuilder");
        ClassType.AZURE_KEY_CREDENTIAL.addImportsTo(imports, false);
        ClassType.KEY_CREDENTIAL.addImportsTo(imports, false);
        ClassType.CONFIGURATION.addImportsTo(imports, false);

        // client initialization
        List<String> clientParameterLines = new ArrayList<>();
        Set<ServiceClientProperty> processedServiceClientProperties = new HashSet<>();

        // proxy method parameters which value comes from client
        method.getProxyMethod().getAllParameters()
                .stream()
                .filter(ProxyMethodParameter::isFromClient)
                .forEach(p -> {
                    for (Map.Entry<String, ProxyMethodExample.ParameterValue> entry : proxyMethodExample.getParameters().entrySet()) {
                        String parameterName = entry.getKey();
                        ProxyMethodExample.ParameterValue parameterValue = entry.getValue();
                        if (parameterName.equalsIgnoreCase(p.getName())) {
                            String clientValue = p.getClientType()
                                    .defaultValueExpression(parameterValue.getObjectValue().toString());
                            serviceClient.getProperties().stream().filter(p1 -> Objects.equals(p.getName(), p1.getName())).findFirst().ifPresent(serviceClientProperty -> {
                                processedServiceClientProperties.add(serviceClientProperty);

                                clientParameterLines.add(
                                        String.format(".%1$s(%2$s)", serviceClientProperty.getAccessorMethodSuffix(), clientValue));
                            });
                        }
                    }
                });

        // required service client properties
        serviceClient.getProperties().stream().filter(ServiceClientProperty::isRequired).filter(p -> !processedServiceClientProperties.contains(p)).forEach(serviceClientProperty -> {
            String defaultValueExpression = serviceClientProperty.getDefaultValueExpression();
            if (defaultValueExpression == null) {
                defaultValueExpression = String.format("Configuration.getGlobalConfiguration().get(\"%1$s\")",
                        serviceClientProperty.getName().toUpperCase(Locale.ROOT));
            }

            clientParameterLines.add(
                    String.format(".%1$s(%2$s)", serviceClientProperty.getAccessorMethodSuffix(), defaultValueExpression));
        });
        String clientParameterExpr = String.join("", clientParameterLines);

        // credentials
        String credentialExpr;
        if (serviceClient.getSecurityInfo() != null && serviceClient.getSecurityInfo().getSecurityTypes() != null) {
            if (serviceClient.getSecurityInfo().getSecurityTypes().contains(Scheme.SecuritySchemeType.OAUTH2)) {
                credentialExpr = ".credential(new DefaultAzureCredentialBuilder().build())";
            } else if (serviceClient.getSecurityInfo().getSecurityTypes().contains(Scheme.SecuritySchemeType.KEY)) {
                if (JavaSettings.getInstance().isUseKeyCredential()) {
                    credentialExpr = ".credential(new KeyCredential(Configuration.getGlobalConfiguration().get(\"API_KEY\")))";
                } else {
                    credentialExpr = ".credential(new AzureKeyCredential(Configuration.getGlobalConfiguration().get(\"API_KEY\")))";
                }
            } else {
                credentialExpr = "";
            }
        } else {
            credentialExpr = "";
        }

        this.clientInitializationWriter = methodBlock -> {
            // client
            String clientInit = "%1$s %2$s = new %3$s()" +
                    "%4$s" +  // credentials
                    "%5$s" +  // client properties
                    ".%6$s();";
            methodBlock.line(
                    String.format(clientInit,
                            syncClient.getClassName(), clientVarName,
                            builderName,
                            credentialExpr,
                            clientParameterExpr,
                            syncClient.getClientBuilder().getBuilderMethodNameForSyncClient(syncClient)));
        };
    }

    public Set<String> getImports() {
        return new HashSet<>(this.imports);
    }

    public void write(JavaBlock methodBlock) {
        this.clientInitializationWriter.accept(methodBlock);
    }

    public String getClientVarName() {
        return clientVarName;
    }
}
