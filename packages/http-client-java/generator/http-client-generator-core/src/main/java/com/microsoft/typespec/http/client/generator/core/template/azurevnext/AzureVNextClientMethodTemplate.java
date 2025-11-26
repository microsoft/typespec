// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.template.azurevnext;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.RequestParameterLocation;
import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClassType;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ClientMethod;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ParameterSynthesizedOrigin;
import com.microsoft.typespec.http.client.generator.core.model.clientmodel.ProxyMethod;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaType;
import com.microsoft.typespec.http.client.generator.core.template.clientcore.ClientCoreClientMethodTemplate;
import com.microsoft.typespec.http.client.generator.core.util.TemplateUtil;
import io.clientcore.core.utils.CoreUtils;
import java.util.stream.Collectors;

public class AzureVNextClientMethodTemplate extends ClientCoreClientMethodTemplate {

    private static final AzureVNextClientMethodTemplate INSTANCE = new AzureVNextClientMethodTemplate();

    protected AzureVNextClientMethodTemplate() {
    }

    public static AzureVNextClientMethodTemplate getInstance() {
        return INSTANCE;
    }

    @Override
    protected void generateLongRunningBeginSync(ClientMethod clientMethod, JavaType typeBlock,
        ProxyMethod restAPIMethod, JavaSettings settings) {
        typeBlock.annotation("ServiceMethod(returns = ReturnType.LONG_RUNNING_OPERATION)");
        String contextParam;
        if (clientMethod.getParameters().stream().anyMatch(p -> p.getClientType().equals(ClassType.REQUEST_CONTEXT))) {
            contextParam = "requestContext";
        } else {
            contextParam = TemplateUtil.getRequestContextNone();
        }
        String pollingStrategy = getSyncPollingStrategy(clientMethod, contextParam);

        String argumentList = clientMethod.getArgumentList();
        if (!argumentList.contains(contextParam)) {
            argumentList = argumentList + ", " + contextParam;
        }

        String effectiveArgumentList = argumentList;
        writeMethod(typeBlock, clientMethod.getMethodVisibility(), clientMethod.getDeclaration(), function -> {
            addOptionalVariables(function, clientMethod);
            function.line("return Poller.createPoller(Duration.ofSeconds(%s),",
                clientMethod.getMethodPollingDetails().getPollIntervalInSeconds());
            function.increaseIndent();
            function.line("() -> this.%s(%s),", clientMethod.getProxyMethod().getSimpleRestResponseMethodName(),
                effectiveArgumentList);
            function.line(pollingStrategy + ",");
            function.line(
                TemplateUtil.getLongRunningOperationTypeReferenceExpression(clientMethod.getMethodPollingDetails())
                    + ");");
            function.decreaseIndent();
        });
    }

    private String getSyncPollingStrategy(ClientMethod clientMethod, String contextParam) {
        String endpoint = "null";
        if (clientMethod.getProxyMethod() != null && clientMethod.getProxyMethod().getParameters() != null) {
            if (clientMethod.getProxyMethod()
                .getParameters()
                .stream()
                .anyMatch(p -> p.isFromClient()
                    && p.getRequestParameterLocation() == RequestParameterLocation.URI
                    && "endpoint".equals(p.getName()))) {
                // has EndpointTrait

                final String baseUrl = clientMethod.getProxyMethod().getBaseUrl();
                final String endpointReplacementExpr = clientMethod.getProxyMethod()
                    .getParameters()
                    .stream()
                    .filter(p -> p.isFromClient() && p.getRequestParameterLocation() == RequestParameterLocation.URI)
                    .filter(p -> baseUrl.contains(String.format("{%s}", p.getRequestParameterName())))
                    .map(p -> String.format(".replace(%1$s, %2$s)",
                        ClassType.STRING.defaultValueExpression(String.format("{%s}", p.getRequestParameterName())),
                        p.getParameterReference()))
                    .collect(Collectors.joining());
                if (!CoreUtils.isNullOrEmpty(endpointReplacementExpr)) {
                    endpoint = ClassType.STRING.defaultValueExpression(baseUrl) + endpointReplacementExpr;
                }
            }
        }
        return clientMethod.getMethodPollingDetails()
            .getSyncPollingStrategy()
            .replace("{httpPipeline}", clientMethod.getClientReference() + ".getHttpPipeline()")
            .replace("{endpoint}", endpoint)
            .replace("{context}", contextParam)
            .replace("{serviceVersion}", getServiceVersionValue(clientMethod))
            .replace("{serializerAdapter}", clientMethod.getClientReference() + ".getSerializerAdapter()")
            .replace("{intermediate-type}", clientMethod.getMethodPollingDetails().getPollResultType().toString())
            .replace("{final-type}", clientMethod.getMethodPollingDetails().getFinalResultType().toString())
            .replace(".setServiceVersion(null)", "")
            .replace(".setEndpoint(null)", "");
    }

    private static String getServiceVersionValue(ClientMethod clientMethod) {
        String serviceVersion = "null";
        if (clientMethod.getProxyMethod() != null && clientMethod.getProxyMethod().getParameters() != null) {
            if (clientMethod.getProxyMethod()
                .getParameters()
                .stream()
                .anyMatch(p -> p.getOrigin() == ParameterSynthesizedOrigin.API_VERSION)) {
                serviceVersion = clientMethod.getClientReference() + ".getServiceVersion().getVersion()";
            }
        }
        return serviceVersion;
    }
}
