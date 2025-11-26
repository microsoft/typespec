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
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import io.clientcore.core.serialization.json.JsonWriter;
import io.clientcore.core.utils.CoreUtils;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;

public final class TemplateHelper {
    private final static Logger LOGGER
        = new PluginLogger(Javagen.getPluginInstance(), ServiceClientBuilderTemplate.class);

    public static String getPomProjectName(String serviceName) {
        return JavaSettings.getInstance().isAzureV1()
            ? "Microsoft Azure SDK for " + serviceName
            : "SDK for " + serviceName;
    }

    public static String getPomProjectDescription(String serviceName) {
        return JavaSettings.getInstance().isAzureV1()
            ? "This package contains Microsoft Azure " + serviceName + " client library."
            : "This package contains " + serviceName + " client library.";
    }

    public static String getByteCloneExpression(String propertyName) {
        return JavaSettings.getInstance().isAzureV1() ? "CoreUtils.clone(" + propertyName + ")" : propertyName; // TODO:
                                                                                                                // generic
                                                                                                                // not
                                                                                                                // having
                                                                                                                // CoreUtils
    }

    public static void createHttpPipelineMethod(JavaSettings settings, String defaultCredentialScopes,
        SecurityInfo securityInfo, PipelinePolicyDetails pipelinePolicyDetails, JavaBlock function) {
        if (settings.isAzureV2()) {
            createAzureVNextHttpPipelineMethod(settings, defaultCredentialScopes, securityInfo, pipelinePolicyDetails,
                function);
        } else if (settings.isAzureV1()) {
            createAzureHttpPipelineMethod(settings, defaultCredentialScopes, securityInfo, pipelinePolicyDetails,
                function);
        } else {
            createGenericHttpPipelineMethod(settings, defaultCredentialScopes, securityInfo, pipelinePolicyDetails,
                function);

        }
    }

    private static void createGenericHttpPipelineMethod(JavaSettings settings, String defaultCredentialScopes,
        SecurityInfo securityInfo, PipelinePolicyDetails pipelinePolicyDetails, JavaBlock function) {
        function.line("Configuration buildConfiguration = (configuration == null) ? Configuration"
            + ".getGlobalConfiguration() : configuration;");
        function.line("HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions "
            + "== null ? new HttpInstrumentationOptions() : this.httpInstrumentationOptions;");

        function.line("HttpPipelineBuilder httpPipelineBuilder = new HttpPipelineBuilder();");
        function.line("List<HttpPipelinePolicy> policies = new ArrayList<>();");
        function.line(
            "policies.add(redirectOptions == null ? new HttpRedirectPolicy() : new HttpRedirectPolicy(redirectOptions));");
        function
            .line("policies.add(retryOptions == null ? new HttpRetryPolicy() : new HttpRetryPolicy(retryOptions));");
        function.line("this.pipelinePolicies.stream().forEach(p -> policies.add(p));");
        if (securityInfo.getSecurityTypes().contains(Scheme.SecuritySchemeType.KEY)) {
            function.ifBlock("keyCredential != null", action -> {
                final String prefixExpr = CoreUtils.isNullOrEmpty(securityInfo.getHeaderValuePrefix())
                    ? "null"
                    : ClassType.STRING.defaultValueExpression(securityInfo.getHeaderValuePrefix());
                action.line("policies.add(new KeyCredentialPolicy(\"" + securityInfo.getHeaderName()
                    + "\", keyCredential, " + prefixExpr + "));");
            });
        }
        if (securityInfo.getSecurityTypes().contains(Scheme.SecuritySchemeType.OAUTH2)) {
            function.ifBlock("tokenCredential != null", action -> {
                try (ByteArrayOutputStream stream = new ByteArrayOutputStream();
                    JsonWriter jsonWriter = JsonWriter.toStream(stream)) {
                    jsonWriter.writeArray(securityInfo.getFlows(), JsonWriter::writeJson).flush();
                    String authFlows = stream.toString(StandardCharsets.UTF_8).replace("\"", "\\\"");
                    action.line("policies.add(new OAuthBearerTokenAuthenticationPolicy(tokenCredential, "
                        + "new OAuthTokenRequestContext().setParam(\"auth_flows\", \"" + authFlows + "\")));");
                } catch (IOException ex) {
                    throw new UncheckedIOException(ex);
                }
            });
        }
        function.line("policies.add(new HttpInstrumentationPolicy(localHttpInstrumentationOptions));");
        function.line("policies.forEach(httpPipelineBuilder::addPolicy);");
        function.methodReturn("httpPipelineBuilder.httpClient(httpClient).build()");
    }

    private static void createAzureVNextHttpPipelineMethod(JavaSettings settings, String defaultCredentialScopes,
        SecurityInfo securityInfo, PipelinePolicyDetails pipelinePolicyDetails, JavaBlock function) {
        function.line("Configuration buildConfiguration = (configuration == null) ? Configuration"
            + ".getGlobalConfiguration() : configuration;");
        function.line(
            "HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null ? new HttpInstrumentationOptions() : this.httpInstrumentationOptions;");

        function.line("String clientName = PROPERTIES.getOrDefault(SDK_NAME, \"UnknownName\");");
        function.line("String clientVersion = PROPERTIES.getOrDefault(SDK_VERSION, \"UnknownVersion\");");

        function.line("HttpPipelineBuilder httpPipelineBuilder = new HttpPipelineBuilder();");
        function.line("List<HttpPipelinePolicy> policies = new ArrayList<>();");
        function.line(
            "policies.add(new UserAgentPolicy(new UserAgentOptions().setSdkName(clientName).setSdkVersion(clientVersion)));");
        function.line(
            "policies.add(redirectOptions == null ? new HttpRedirectPolicy() : new HttpRedirectPolicy(redirectOptions));");
        function
            .line("policies.add(retryOptions == null ? new HttpRetryPolicy() : new HttpRetryPolicy(retryOptions));");
        function.line("this.pipelinePolicies.stream().forEach(p -> policies.add(p));");
        if (securityInfo.getSecurityTypes().contains(Scheme.SecuritySchemeType.KEY)) {
            function.ifBlock("keyCredential != null", action -> {
                final String prefixExpr = CoreUtils.isNullOrEmpty(securityInfo.getHeaderValuePrefix())
                    ? "null"
                    : ClassType.STRING.defaultValueExpression(securityInfo.getHeaderValuePrefix());
                action.line("policies.add(new KeyCredentialPolicy(\"" + securityInfo.getHeaderName()
                    + "\", keyCredential, " + prefixExpr + "));");
            });
        }
        if (securityInfo.getSecurityTypes().contains(Scheme.SecuritySchemeType.OAUTH2)) {
            function.ifBlock("tokenCredential != null",
                action -> action.line("policies.add(new BearerTokenAuthenticationPolicy(tokenCredential, %s));",
                    defaultCredentialScopes));
        }
        function.line("policies.add(new HttpInstrumentationPolicy(localHttpInstrumentationOptions));");
        function.line("policies.forEach(httpPipelineBuilder::addPolicy);");
        function.methodReturn("httpPipelineBuilder.httpClient(httpClient).build()");
    }

    private static void createAzureHttpPipelineMethod(JavaSettings settings, String defaultCredentialScopes,
        SecurityInfo securityInfo, PipelinePolicyDetails pipelinePolicyDetails, JavaBlock function) {
        function.line("Configuration buildConfiguration = (configuration == null) ? Configuration"
            + ".getGlobalConfiguration() : configuration;");

        function.line(
            "HttpLogOptions localHttpLogOptions = this.httpLogOptions == null ? new HttpLogOptions() : this.httpLogOptions;");
        function.line(
            "ClientOptions localClientOptions = this.clientOptions == null ? new ClientOptions() : this.clientOptions;");

        function.line("List<HttpPipelinePolicy> policies = new ArrayList<>();");

        function.line("String clientName = PROPERTIES.getOrDefault(SDK_NAME, \"UnknownName\");");
        function.line("String clientVersion = PROPERTIES.getOrDefault(SDK_VERSION, \"UnknownVersion\");");

        function.line("String applicationId = CoreUtils.getApplicationId(localClientOptions, localHttpLogOptions);");
        function.line(
            "policies.add(new UserAgentPolicy(applicationId, clientName, " + "clientVersion, buildConfiguration));");

        if (pipelinePolicyDetails != null && !CoreUtils.isNullOrEmpty(pipelinePolicyDetails.getRequestIdHeaderName())) {
            function.line(String.format("policies.add(new RequestIdPolicy(\"%s\"));",
                pipelinePolicyDetails.getRequestIdHeaderName()));
        } else {
            function.line("policies.add(new RequestIdPolicy());");
        }
        function.line("policies.add(new AddHeadersFromContextPolicy());");

        // clientOptions header
        function.line("HttpHeaders headers = CoreUtils.createHttpHeadersFromClientOptions(localClientOptions);");
        function.ifBlock("headers != null", block -> block.line("policies.add(new AddHeadersPolicy(headers));"));

        function.line(
            "this.pipelinePolicies.stream()" + ".filter(p -> p.getPipelinePosition() == HttpPipelinePosition.PER_CALL)"
                + ".forEach(p -> policies.add(p));");
        function.line("HttpPolicyProviders.addBeforeRetryPolicies(policies);");
        function.line("policies.add(ClientBuilderUtil.validateAndGetRetryPolicy(retryPolicy, retryOptions, new "
            + "RetryPolicy()));");
        function.line("policies.add(new AddDatePolicy());");

        if (securityInfo.getSecurityTypes().contains(Scheme.SecuritySchemeType.KEY)) {
            if (CoreUtils.isNullOrEmpty(securityInfo.getHeaderName())) {
                LOGGER.error("key-credential-header-name is required for " + "key-based credential type");
                throw new IllegalStateException(
                    "key-credential-header-name is required for " + "key-based credential type");
            }

            if (settings.isUseKeyCredential()) {
                function.ifBlock("keyCredential != null", action -> {
                    if (CoreUtils.isNullOrEmpty(securityInfo.getHeaderValuePrefix())) {
                        action.line("policies.add(new KeyCredentialPolicy(\"" + securityInfo.getHeaderName()
                            + "\", keyCredential));");
                    } else {
                        action.line("policies.add(new KeyCredentialPolicy(\"" + securityInfo.getHeaderName()
                            + "\", keyCredential, \"" + securityInfo.getHeaderValuePrefix() + "\"));");
                    }
                });
            } else {
                function.ifBlock("azureKeyCredential != null", action -> {
                    if (CoreUtils.isNullOrEmpty(securityInfo.getHeaderValuePrefix())) {
                        action.line("policies.add(new AzureKeyCredentialPolicy(\"" + securityInfo.getHeaderName()
                            + "\", azureKeyCredential));");
                    } else {
                        action.line("policies.add(new AzureKeyCredentialPolicy(\"" + securityInfo.getHeaderName()
                            + "\", azureKeyCredential, \"" + securityInfo.getHeaderValuePrefix() + "\"));");
                    }
                });
            }
        }
        if (securityInfo.getSecurityTypes().contains(Scheme.SecuritySchemeType.OAUTH2)) {
            function.ifBlock("tokenCredential != null",
                action -> action.line("policies.add(new BearerTokenAuthenticationPolicy(tokenCredential, %s));",
                    defaultCredentialScopes));
        }
        function.line(
            "this.pipelinePolicies.stream().filter(p -> p.getPipelinePosition() == HttpPipelinePosition.PER_RETRY)"
                + ".forEach(p -> policies.add(p));");
        function.line("HttpPolicyProviders.addAfterRetryPolicies(policies);");

        function.line("policies.add(new HttpLoggingPolicy(localHttpLogOptions));");

        function.line("HttpPipeline httpPipeline = new HttpPipelineBuilder()"
            + ".policies(policies.toArray(new HttpPipelinePolicy[0])).httpClient(httpClient)"
            + ".clientOptions(localClientOptions).build();");
        function.methodReturn("httpPipeline");
    }
}
