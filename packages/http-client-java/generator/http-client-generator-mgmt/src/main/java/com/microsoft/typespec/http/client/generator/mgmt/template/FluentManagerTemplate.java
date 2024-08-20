// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.mgmt.template;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.mgmt.FluentGen;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.FluentManager;
import com.microsoft.typespec.http.client.generator.mgmt.model.clientmodel.ModelNaming;
import com.microsoft.typespec.http.client.generator.mgmt.model.projectmodel.FluentProject;
import com.microsoft.typespec.http.client.generator.mgmt.util.FluentUtils;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.IType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClientProperty;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaFile;
import com.microsoft.typespec.http.client.generator.core.util.ClientModelUtil;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import com.azure.core.credential.TokenCredential;
import com.azure.core.http.HttpClient;
import com.azure.core.http.HttpPipeline;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.HttpPipelinePosition;
import com.azure.core.http.policy.AddDatePolicy;
import com.azure.core.http.policy.AddHeadersFromContextPolicy;
import com.azure.core.http.policy.HttpLogOptions;
import com.azure.core.http.policy.HttpLoggingPolicy;
import com.azure.core.http.policy.HttpPipelinePolicy;
import com.azure.core.http.policy.HttpPolicyProviders;
import com.azure.core.http.policy.RequestIdPolicy;
import com.azure.core.http.policy.RetryOptions;
import com.azure.core.http.policy.RetryPolicy;
import com.azure.core.http.policy.UserAgentPolicy;
import com.azure.core.management.http.policy.ArmChallengeAuthenticationPolicy;
import com.azure.core.management.profile.AzureProfile;
import com.azure.core.util.Configuration;
import com.azure.core.util.logging.ClientLogger;
import org.slf4j.Logger;

import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

public class FluentManagerTemplate {

    private static final Logger LOGGER = new PluginLogger(FluentGen.getPluginInstance(), FluentManagerTemplate.class);

    private static final FluentManagerTemplate INSTANCE = new FluentManagerTemplate();

    public static FluentManagerTemplate getInstance() {
        return INSTANCE;
    }

    public void write(FluentManager manager, FluentProject project, JavaFile javaFile) {
        ServiceClient serviceClient = manager.getClient().getServiceClient();

        final boolean hasEndpointParameter = serviceClient.getProperties().stream()
                .anyMatch(p -> p.getName().equals("endpoint"));
        if (!hasEndpointParameter) {
            LOGGER.warn("'endpoint' (or '$host') is required in ServiceClient properties, candidate properties {}",
                    serviceClient.getProperties().stream().map(ServiceClientProperty::getName).collect(Collectors.toList()));
        }

        final boolean endpointAvailable = serviceClient.getProperties().stream()
                .anyMatch(p -> p.getName().equals("endpoint"));
        final boolean requiresSubscriptionIdParameter = serviceClient.getProperties().stream()
                .anyMatch(p -> p.getName().equals("subscriptionId"));
        final IType subscriptionIdParameterType = serviceClient.getProperties().stream()
                .filter(p -> p.getName().equals("subscriptionId"))
                .map(ServiceClientProperty::getType)
                .findFirst().orElse(null);

        String builderPackageName = ClientModelUtil.getServiceClientBuilderPackageName(serviceClient);
        String builderTypeName = serviceClient.getInterfaceName() + ClientModelUtil.getBuilderSuffix();
        String serviceClientPackageName = ClientModelUtil.getServiceClientInterfacePackageName();
        String serviceClientTypeName = serviceClient.getInterfaceName();

        String managerName = manager.getType().getName();

        Set<String> imports = new HashSet<>(Arrays.asList(
                // java
                Objects.class.getName(),
                Duration.class.getName(),
                ChronoUnit.class.getName(),
                List.class.getName(),
                ArrayList.class.getName(),
                Collectors.class.getName(),
                // azure-core
                TokenCredential.class.getName(),
                ClientLogger.class.getName(),
                Configuration.class.getName(),
                HttpClient.class.getName(),
                HttpPipeline.class.getName(),
                HttpPipelineBuilder.class.getName(),
                HttpPipelinePolicy.class.getName(),
                HttpPipelinePosition.class.getName(),
                HttpPolicyProviders.class.getName(),
                RetryOptions.class.getName(),
                AddHeadersFromContextPolicy.class.getName(),
                RequestIdPolicy.class.getName(),
                RetryPolicy.class.getName(),
                AddDatePolicy.class.getName(),
                HttpLoggingPolicy.class.getName(),
                HttpLogOptions.class.getName(),
                ArmChallengeAuthenticationPolicy.class.getName(),
                UserAgentPolicy.class.getName(),
                // azure-core-management
                AzureProfile.class.getName()
        ));

        if (requiresSubscriptionIdParameter && subscriptionIdParameterType != null) {
            subscriptionIdParameterType.addImportsTo(imports, false);
        }

        imports.add(String.format("%1$s.%2$s", builderPackageName, builderTypeName));
        imports.add(String.format("%1$s.%2$s", serviceClientPackageName, serviceClientTypeName));

        manager.getProperties().forEach(property -> {
            imports.add(property.getFluentType().getFullName());
            imports.add(property.getFluentImplementType().getFullName());
        });
        javaFile.declareImport(imports);

        javaFile.javadocComment(comment -> {
            comment.description(manager.getDescription());
        });

        javaFile.publicFinalClass(managerName, classBlock -> {
            manager.getProperties().forEach(property -> {
                classBlock.privateMemberVariable(property.getFluentType().getName(), property.getName());
            });

            classBlock.privateFinalMemberVariable(serviceClientTypeName, ModelNaming.MANAGER_PROPERTY_CLIENT);

            // Constructor
            classBlock.privateConstructor(String.format("%1$s(HttpPipeline httpPipeline, AzureProfile profile, Duration defaultPollInterval)", managerName) , methodBlock -> {
                methodBlock.line("Objects.requireNonNull(httpPipeline, \"'httpPipeline' cannot be null.\");");
                methodBlock.line("Objects.requireNonNull(profile, \"'profile' cannot be null.\");");
                methodBlock.line(String.format("this.%1$s = new %2$s()", ModelNaming.MANAGER_PROPERTY_CLIENT, builderTypeName));
                methodBlock.indent(() -> {
                    methodBlock.line(".pipeline(httpPipeline)");
                    if (endpointAvailable) {
                        methodBlock.line(".endpoint(profile.getEnvironment().getResourceManagerEndpoint())");
                    }
                    if (requiresSubscriptionIdParameter) {
                        if (subscriptionIdParameterType == ClassType.UUID) {
                            methodBlock.line(".subscriptionId(UUID.fromString(profile.getSubscriptionId()))");
                        } else {
                            methodBlock.line(".subscriptionId(profile.getSubscriptionId())");
                        }
                    }
                    methodBlock.line(".defaultPollInterval(defaultPollInterval)");
                    methodBlock.line(".buildClient();");
                });
            });

            // authenticate()
            classBlock.javadocComment(comment -> {
                comment.description(String.format("Creates an instance of %1$s service API entry point.", manager.getServiceName()));
                comment.param("credential", "the credential to use");
                comment.param("profile", "the Azure profile for client");
                comment.methodReturns(String.format("the %1$s service API instance", manager.getServiceName()));
            });
            classBlock.publicStaticMethod(String.format("%1$s authenticate(TokenCredential credential, AzureProfile profile)", managerName), methodBlock -> {
                methodBlock.line("Objects.requireNonNull(credential, \"'credential' cannot be null.\");");
                methodBlock.line("Objects.requireNonNull(profile, \"'profile' cannot be null.\");");
                methodBlock.methodReturn("configure().authenticate(credential, profile)");
            });

            classBlock.javadocComment(comment -> {
                comment.description(String.format("Creates an instance of %1$s service API entry point.", manager.getServiceName()));
                comment.param("httpPipeline", "the {@link HttpPipeline} configured with Azure authentication credential");
                comment.param("profile", "the Azure profile for client");
                comment.methodReturns(String.format("the %1$s service API instance", manager.getServiceName()));
            });
            classBlock.publicStaticMethod(String.format("%1$s authenticate(HttpPipeline httpPipeline, AzureProfile profile)", managerName), methodBlock -> {
                methodBlock.line("Objects.requireNonNull(httpPipeline, \"'httpPipeline' cannot be null.\");");
                methodBlock.line("Objects.requireNonNull(profile, \"'profile' cannot be null.\");");
                methodBlock.methodReturn(String.format("new %1$s(httpPipeline, profile, null)", managerName));
            });

            // configure()
            classBlock.javadocComment(comment -> {
                comment.description(String.format("Gets a Configurable instance that can be used to create %1$s with optional configuration.", managerName));
                comment.methodReturns("the Configurable instance allowing configurations");
            });
            classBlock.publicStaticMethod("Configurable configure()", methodBlock -> {
                methodBlock.methodReturn(String.format("new %1$s.Configurable()", managerName));
            });

            // Configurable class
            javaFile.line();
            String configurableClassText = FluentUtils.loadTextFromResource("Manager_Configurable.txt",
                    TemplateUtil.SERVICE_NAME, manager.getServiceName(),
                    TemplateUtil.MANAGER_CLASS, manager.getType().getName(),
                    TemplateUtil.PACKAGE_NAME, project.getNamespace(),
                    TemplateUtil.ARTIFACT_VERSION, project.getVersion()
            );
            javaFile.text(configurableClassText);

            manager.getProperties().forEach(property -> {
                classBlock.javadocComment(comment -> {
                    String resourceModelsDescription = "";
                    if (!property.getResourceModelTypes().isEmpty()) {
                        resourceModelsDescription = " It manages " + property.getResourceModelTypes().stream()
                                .map(ClassType::getName).collect(Collectors.joining(", ")) + ".";
                    }
                    comment.description(String.format("Gets the resource collection API of %1$s.", property.getFluentType().getName())
                            + resourceModelsDescription);
                    comment.methodReturns(String.format("Resource collection API of %1$s.", property.getFluentType().getName()));
                });

                classBlock.publicMethod(String.format("%1$s %2$s()", property.getFluentType().getName(), property.getMethodName()), methodBlock -> {
                    methodBlock.ifBlock(String.format("this.%1$s == null", property.getName()), ifBlock -> {
                        methodBlock.line(String.format("this.%1$s = new %2$s(%3$s.%4$s(), this);",
                                property.getName(),
                                property.getFluentImplementType().getName(),
                                ModelNaming.MANAGER_PROPERTY_CLIENT, property.getInnerClientGetMethod()));
                    });
                    methodBlock.methodReturn(property.getName());
                });
            });

            classBlock.javadocComment(comment -> {
                comment.description(String.format("Gets wrapped service client %1$s providing direct access to the underlying auto-generated API implementation, based on Azure REST API.", serviceClientTypeName));
                comment.methodReturns(String.format("Wrapped service client %1$s.", serviceClientTypeName));
            });
            classBlock.publicMethod(String.format("%1$s %2$s()", serviceClientTypeName, ModelNaming.METHOD_SERVICE_CLIENT), methodBlock -> {
                methodBlock.methodReturn(String.format("this.%1$s", ModelNaming.MANAGER_PROPERTY_CLIENT));
            });
        });
    }
}
