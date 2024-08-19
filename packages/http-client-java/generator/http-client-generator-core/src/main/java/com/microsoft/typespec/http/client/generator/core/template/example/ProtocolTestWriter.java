// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.example;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Scheme;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.AsyncSyncClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClientProperty;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.TestContext;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaClass;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaIfBlock;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.azure.core.http.HttpClient;
import com.azure.core.http.policy.HttpLogDetailLevel;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.util.Configuration;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.function.Consumer;

public class ProtocolTestWriter {

    private final Set<String> imports;
    private final Consumer<JavaClass> clientVariableWriter;
    private final Consumer<JavaBlock> clientInitializationWriter;

    public ProtocolTestWriter(TestContext testContext) {
        final List<ServiceClient> serviceClients = testContext.getServiceClients();
        final ServiceClient serviceClient = serviceClients.iterator().next();
        final List<AsyncSyncClient> syncClients = testContext.getSyncClients();
        final boolean isTokenCredential = serviceClient.getSecurityInfo() != null && serviceClient.getSecurityInfo().getSecurityTypes() != null
                && serviceClient.getSecurityInfo().getSecurityTypes().contains(Scheme.SecuritySchemeType.OAUTH2);

        this.imports = new HashSet<>(Arrays.asList(
                HttpClient.class.getName(),
                HttpLogDetailLevel.class.getName(),
                HttpLogOptions.class.getName(),
                Configuration.class.getName(),
                "com.azure.core.test.utils.MockTokenCredential",
                "com.azure.identity.DefaultAzureCredentialBuilder",
                "com.azure.core.test.TestProxyTestBase",
                "com.azure.core.test.TestMode",
//                "com.azure.core.test.annotation.DoNotRecord",
                "org.junit.jupiter.api.Disabled",
                "org.junit.jupiter.api.Test"
        ));
        // client and builder
        syncClients.forEach(c -> {
            c.addImportsTo(imports, false);
            c.getClientBuilder().addImportsTo(imports, false);
        });
        // base test class
        imports.add(String.format("%s.%s", testContext.getPackageName(), testContext.getTestBaseClassName()));

        this.clientVariableWriter = classBlock -> {
            syncClients.forEach(c -> {
                classBlock.protectedMemberVariable(c.getClassName(), CodeNamer.toCamelCase(c.getClassName()));
            });
        };

        this.clientInitializationWriter = methodBlock -> {
            Iterator<ServiceClient> serviceClientIterator = serviceClients.iterator();
            ServiceClient currentServiceClient = null;
            for (AsyncSyncClient syncClient : syncClients) {
                if (serviceClientIterator.hasNext()) {
                    // either a single serviceClient for all syncClients, or 1 serviceClient to 1 syncClient
                    currentServiceClient = serviceClientIterator.next();
                }

                String clientVarName = CodeNamer.toCamelCase(syncClient.getClassName());
                String builderClassName = syncClient.getClientBuilder().getClassName();
                String builderVarName = CodeNamer.toCamelCase(syncClient.getClassName()) + "builder";

                methodBlock.line(String.format("%1$s %2$s = new %3$s()", builderClassName, builderVarName, builderClassName));
                methodBlock.increaseIndent();
                // required service client properties
                currentServiceClient.getProperties().stream().filter(ServiceClientProperty::isRequired).forEach(serviceClientProperty -> {
                    String defaultValueExpression = serviceClientProperty.getDefaultValueExpression();
                    String expr;
                    if (defaultValueExpression == null) {
                        expr = String.format("Configuration.getGlobalConfiguration().get(\"%1$s\", %2$s)",
                                serviceClientProperty.getName().toUpperCase(Locale.ROOT), ClassType.STRING.defaultValueExpression(serviceClientProperty.getName().toLowerCase(Locale.ROOT)));
                    } else {
                        expr = String.format("Configuration.getGlobalConfiguration().get(\"%1$s\", %2$s)",
                                serviceClientProperty.getName().toUpperCase(Locale.ROOT), defaultValueExpression);
                    }
                    methodBlock.line(".%1$s(%2$s)", serviceClientProperty.getAccessorMethodSuffix(), expr);
                });
                methodBlock.line(".httpClient(HttpClient.createDefault())");
                methodBlock.line(".httpLogOptions(new HttpLogOptions().setLogLevel(HttpLogDetailLevel.BASIC));");
                methodBlock.decreaseIndent();

                JavaIfBlock codeBlock = methodBlock.ifBlock("getTestMode() == TestMode.PLAYBACK", ifBlock -> {
                    if (isTokenCredential) {
                        ifBlock.line(String.format("%1$s.httpClient(interceptorManager.getPlaybackClient())", builderVarName));
                        ifBlock.line(".credential(new MockTokenCredential());");
                    } else {
                        ifBlock.line(String.format("%1$s.httpClient(interceptorManager.getPlaybackClient());", builderVarName));
                    }
                }).elseIfBlock("getTestMode() == TestMode.RECORD", ifBlock -> {
                    if (isTokenCredential) {
                        ifBlock.line(String.format("%1$s.addPolicy(interceptorManager.getRecordPolicy())", builderVarName));
                        ifBlock.line(".credential(new DefaultAzureCredentialBuilder().build());");
                    } else {
                        ifBlock.line(String.format("%1$s.addPolicy(interceptorManager.getRecordPolicy());", builderVarName));
                    }
                });

                if (isTokenCredential) {
                    codeBlock.elseIfBlock("getTestMode() == TestMode.LIVE", ifBlock -> {
                        ifBlock.line(String.format("%1$s.credential(new DefaultAzureCredentialBuilder().build());", builderVarName));
                    });
                }

                methodBlock.line(String.format("%1$s = %2$s.%3$s();", clientVarName, builderVarName, syncClient.getClientBuilder().getBuilderMethodNameForSyncClient(syncClient)));
                methodBlock.line();
            };
        };
    }

    public Set<String> getImports() {
        return imports;
    }

    public void writeClientVariables(JavaClass classBlock) {
        clientVariableWriter.accept(classBlock);
    }

    public void writeClientInitialization(JavaBlock methodBlock) {
        clientInitializationWriter.accept(methodBlock);;
    }
}
