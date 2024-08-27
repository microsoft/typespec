// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template;

import com.microsoft.typespec.http.client.generator.core.Javagen;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Scheme;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.PluginLogger;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.PipelinePolicyDetails;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.SecurityInfo;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ServiceClient;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.microsoft.typespec.http.client.generator.core.util.CodeNamer;
import com.azure.core.util.CoreUtils;
import org.slf4j.Logger;

public final class TemplateHelper {
    private final static Logger LOGGER = new PluginLogger(Javagen.getPluginInstance(), ServiceClientBuilderTemplate.class);

    public static String getPomProjectName(String serviceName) {
        return String.format(
                JavaSettings.getInstance().isBranded() ? "Microsoft Azure SDK for %s" : "SDK for %s",
                serviceName);
    }

    public static String getPomProjectDescription(String serviceName) {
        return String.format(
                JavaSettings.getInstance().isBranded() ? "This package contains Microsoft Azure %1$s client library." : "This package contains %1$s client library.",
                serviceName);
    }

    public static String getByteCloneExpression(String propertyName) {
        if (JavaSettings.getInstance().isBranded()) {
            return String.format("CoreUtils.clone(%s)", propertyName);
        } else {
            // TODO: generic not having CoreUtils
            return propertyName;
        }
    }

    public static void createHttpPipelineMethod(JavaSettings settings, String defaultCredentialScopes, SecurityInfo securityInfo, PipelinePolicyDetails pipelinePolicyDetails, JavaBlock function) {
        if (!settings.isBranded()) {
            createGenericHttpPipelineMethod(settings, defaultCredentialScopes, securityInfo, pipelinePolicyDetails, function);
        } else {
            createAzureHttpPipelineMethod(settings, defaultCredentialScopes, securityInfo, pipelinePolicyDetails, function);
        }
    }

    private static void createGenericHttpPipelineMethod(JavaSettings settings, String defaultCredentialScopes, SecurityInfo securityInfo, PipelinePolicyDetails pipelinePolicyDetails, JavaBlock function) {
        function.line("Configuration buildConfiguration = (configuration == null) ? Configuration"
                + ".getGlobalConfiguration() : configuration;");
        String localHttpLogOptionsName = "local" + CodeNamer.toPascalCase("httpLogOptions");
        function.line(String.format("HttpLogOptions %s = this.httpLogOptions == null ? new HttpLogOptions() : this.httpLogOptions;", localHttpLogOptionsName));

        function.line("HttpPipelineBuilder httpPipelineBuilder = new HttpPipelineBuilder();");
        function.line("List<HttpPipelinePolicy> policies = new ArrayList<>();");
        function.line("policies.add(redirectOptions == null ? new HttpRedirectPolicy() : new HttpRedirectPolicy(redirectOptions));");
        function.line("policies.add(retryOptions == null ? new HttpRetryPolicy() : new HttpRetryPolicy(retryOptions));");
        function.line("this.pipelinePolicies.stream().forEach(p -> policies.add(p));");
        if (securityInfo.getSecurityTypes().contains(Scheme.SecuritySchemeType.KEY)) {
            function.ifBlock("keyCredential != null", action -> {
                final String prefixExpr = CoreUtils.isNullOrEmpty(securityInfo.getHeaderValuePrefix())
                        ? "null"
                        : ClassType.STRING.defaultValueExpression(securityInfo.getHeaderValuePrefix());
                function.line("policies.add(new KeyCredentialPolicy(\""
                        + securityInfo.getHeaderName()
                        + "\", keyCredential, "
                        + prefixExpr
                        + "));");
            });
        }
        function.line("httpPipelineBuilder.policies(policies.toArray(new HttpPipelinePolicy[0]));");
        function.methodReturn("httpPipelineBuilder.build()");
    }

    private static void createAzureHttpPipelineMethod(JavaSettings settings, String defaultCredentialScopes, SecurityInfo securityInfo, PipelinePolicyDetails pipelinePolicyDetails, JavaBlock function) {
        function.line("Configuration buildConfiguration = (configuration == null) ? Configuration"
                + ".getGlobalConfiguration() : configuration;");

        String localHttpLogOptionsName = "local" + CodeNamer.toPascalCase("httpLogOptions");
        String localClientOptionsName = "local" + CodeNamer.toPascalCase("ClientOptions");
        function.line(String.format("HttpLogOptions %s = this.httpLogOptions == null ? new HttpLogOptions() : this.httpLogOptions;", localHttpLogOptionsName));
        function.line(String.format("ClientOptions %s = this.clientOptions == null ? new ClientOptions() : this.clientOptions;", localClientOptionsName));

        function.line("List<HttpPipelinePolicy> policies = new ArrayList<>();");

        function.line("String clientName = PROPERTIES.getOrDefault(SDK_NAME, \"UnknownName\");");
        function.line("String clientVersion = PROPERTIES.getOrDefault(SDK_VERSION, \"UnknownVersion\");");

        function.line(String.format("String applicationId = CoreUtils.getApplicationId(%s, %s);", localClientOptionsName, localHttpLogOptionsName));
        function.line("policies.add(new UserAgentPolicy(applicationId, clientName, "
                + "clientVersion, buildConfiguration));");

        if (pipelinePolicyDetails != null && !CoreUtils.isNullOrEmpty(pipelinePolicyDetails.getRequestIdHeaderName())) {
            function.line(String.format("policies.add(new RequestIdPolicy(\"%s\"));", pipelinePolicyDetails.getRequestIdHeaderName()));
        } else {
            function.line("policies.add(new RequestIdPolicy());");
        }
        function.line("policies.add(new AddHeadersFromContextPolicy());");

        // clientOptions header
        function.line("HttpHeaders headers = CoreUtils.createHttpHeadersFromClientOptions(" + localClientOptionsName + ");");
        function.ifBlock("headers != null", block -> block.line("policies.add(new AddHeadersPolicy(headers));"));

        function.line("this.pipelinePolicies.stream()" +
                ".filter(p -> p.getPipelinePosition() == HttpPipelinePosition.PER_CALL)" +
                ".forEach(p -> policies.add(p));");
        function.line("HttpPolicyProviders.addBeforeRetryPolicies(policies);");
        function.line("policies.add(ClientBuilderUtil.validateAndGetRetryPolicy(retryPolicy, retryOptions, new " +
                "RetryPolicy()));");
        function.line("policies.add(new AddDatePolicy());");

        if (securityInfo.getSecurityTypes().contains(Scheme.SecuritySchemeType.KEY)) {
            if (CoreUtils.isNullOrEmpty(securityInfo.getHeaderName())) {
                LOGGER.error("key-credential-header-name is required for " +
                        "key-based credential type");
                throw new IllegalStateException("key-credential-header-name is required for " +
                        "key-based credential type");
            }

            if (settings.isUseKeyCredential()) {
                function.ifBlock("keyCredential != null", action -> {
                    if (CoreUtils.isNullOrEmpty(securityInfo.getHeaderValuePrefix())) {
                        function.line("policies.add(new KeyCredentialPolicy(\""
                                + securityInfo.getHeaderName()
                                + "\", keyCredential));");
                    } else {
                        function.line("policies.add(new KeyCredentialPolicy(\""
                                + securityInfo.getHeaderName()
                                + "\", keyCredential, \""
                                + securityInfo.getHeaderValuePrefix()
                                + "\"));");
                    }
                });
            } else {
                function.ifBlock("azureKeyCredential != null", action -> {
                    if (CoreUtils.isNullOrEmpty(securityInfo.getHeaderValuePrefix())) {
                        function.line("policies.add(new AzureKeyCredentialPolicy(\""
                                + securityInfo.getHeaderName()
                                + "\", azureKeyCredential));");
                    } else {
                        function.line("policies.add(new AzureKeyCredentialPolicy(\""
                                + securityInfo.getHeaderName()
                                + "\", azureKeyCredential, \""
                                + securityInfo.getHeaderValuePrefix()
                                + "\"));");
                    }
                });
            }
        }
        if (securityInfo.getSecurityTypes().contains(Scheme.SecuritySchemeType.OAUTH2)) {
            function.ifBlock("tokenCredential != null", action -> {
                function.line("policies.add(new BearerTokenAuthenticationPolicy(tokenCredential, %s));", defaultCredentialScopes);
            });
        }
        function.line("this.pipelinePolicies.stream()" +
                ".filter(p -> p.getPipelinePosition() == HttpPipelinePosition.PER_RETRY)" +
                ".forEach(p -> policies.add(p));");
        function.line("HttpPolicyProviders.addAfterRetryPolicies(policies);");

        function.line("policies.add(new HttpLoggingPolicy(%s));", localHttpLogOptionsName);

        function.line("HttpPipeline httpPipeline = new HttpPipelineBuilder()" +
                ".policies(policies.toArray(new HttpPipelinePolicy[0]))" +
                ".httpClient(httpClient)" +
                String.format(".clientOptions(%s)", localClientOptionsName) +
                ".build();");
        function.methodReturn("httpPipeline");
    }


    public static void createRestProxyInstance(ServiceClientTemplate template, ServiceClient serviceClient, JavaBlock constructorBlock) {
        if (!JavaSettings.getInstance().isBranded()) {
            constructorBlock.line("this.service = %s.create(%s.class, this.httpPipeline);", ClassType.REST_PROXY.getName(), serviceClient.getProxy().getName());
        } else {
            constructorBlock.line("this.service = %s.create(%s.class, this.httpPipeline, %s);", ClassType.REST_PROXY.getName(), serviceClient.getProxy().getName(), template.getSerializerPhrase());
        }
    }
}
