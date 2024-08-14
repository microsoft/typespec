// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.extension.plugin.JavaSettings;
import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;
import com.azure.core.client.traits.AzureKeyCredentialTrait;
import com.azure.core.client.traits.EndpointTrait;
import com.azure.core.client.traits.KeyCredentialTrait;
import com.azure.core.client.traits.TokenCredentialTrait;
import com.azure.core.credential.AzureKeyCredential;
import com.azure.core.credential.TokenCredential;
import com.azure.core.util.logging.LogLevel;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

/**
 * Class representing a builder trait that adds additional context to the {@link ClientBuilder} client model.
 */
public class ClientBuilderTrait {

    public static final ClientBuilderTrait HTTP_TRAIT = createHttpTrait();

    public static final ClientBuilderTrait CONFIGURATION_TRAIT = createConfigurationTrait();

    public static final ClientBuilderTrait AZURE_KEY_CREDENTIAL_TRAIT = createAzureKeyCredentialTrait();

    public static final ClientBuilderTrait KEY_CREDENTIAL_TRAIT = createKeyCredentialTrait();

    public static final ClientBuilderTrait TOKEN_CREDENTIAL_TRAIT = createTokenCredentialTrait();

    public static final ClientBuilderTrait PROXY_TRAIT = createProxyTrait();

    private static ClientBuilderTrait endpointTrait;

    private String traitInterfaceName;
    private List<String> importPackages;
    private List<ClientBuilderTraitMethod> clientBuilderTraitMethods;

    /**
     * Returns the trait interface name.
     * @return the trait interface name.
     */
    public String getTraitInterfaceName() {
        return traitInterfaceName;
    }

    /**
     * Sets the trait interface name.
     * @param traitInterfaceName  the trait interface name.
     */
    public void setTraitInterfaceName(String traitInterfaceName) {
        this.traitInterfaceName = traitInterfaceName;
    }

    /**
     * Returns the list of packages that needs to be imported for this trait.
     * @return The list of packages that needs to be imported for this trait.
     */
    public List<String> getImportPackages() {
        return importPackages;
    }

    /**
     * Sets the list of packages that needs to be imported for this trait.
     * @param importPackages the list of packages that needs to be imported for this trait.
     */
    public void setImportPackages(List<String> importPackages) {
        this.importPackages = importPackages;
    }

    /**
     * Returns the list of methods that this trait interface contains.
     * @return the list of methods that this trait interface contains.
     */
    public List<ClientBuilderTraitMethod> getTraitMethods() {
        return clientBuilderTraitMethods;
    }

    /**
     * Sets the list of methods that this trait interface contains.
     * @param clientBuilderTraitMethods the list of methods that this trait interface contains.
     */
    public void setTraitMethods(List<ClientBuilderTraitMethod> clientBuilderTraitMethods) {
        this.clientBuilderTraitMethods = clientBuilderTraitMethods;
    }

    private static ClientBuilderTrait createHttpTrait() {
        boolean isBranded = JavaSettings.getInstance().isBranded();

        ClientBuilderTrait httpTrait = new ClientBuilderTrait();
        httpTrait.setTraitInterfaceName("HttpTrait");
        List<String> importPackages = new ArrayList<>();
        httpTrait.setImportPackages(importPackages);
        importPackages.add(ClassType.HTTP_TRAIT.getFullName());
        List<ClientBuilderTraitMethod> httpClientBuilderTraitMethods = new ArrayList<>();
        httpTrait.setTraitMethods(httpClientBuilderTraitMethods);

        // pipeline
        String pipelineMethodName = isBranded ? "pipeline" : "httpPipeline";
        ServiceClientProperty pipelineProperty = new ServiceClientProperty("The HTTP pipeline to send requests " +
                "through.", ClassType.HTTP_PIPELINE, "pipeline", false,
                JavaSettings.getInstance().isAzureOrFluent()
                        ? "new HttpPipelineBuilder().policies(new UserAgentPolicy(), new RetryPolicy()).build()"
                        : "createHttpPipeline()");
        importPackages.add(ClassType.LOG_LEVEL.getFullName());
        Consumer<JavaBlock> pipelineMethodImpl = function -> {
            final String pipelineVarName = "pipeline";
            if (JavaSettings.getInstance().isUseClientLogger()) {
                function.ifBlock(String.format("this.%1$s != null && %1$s == null", pipelineVarName), ifBlock -> {
                    function.line(addLogging(LogLevel.INFORMATIONAL, "HttpPipeline is being set to 'null' when it was previously configured."));
                });
            }
            function.line(String.format("this.%1$s = %2$s;", pipelineVarName, pipelineVarName));
            function.methodReturn("this");
        };
        ClientBuilderTraitMethod pipelineMethod = createTraitMethod(pipelineMethodName, "pipeline", ClassType.HTTP_PIPELINE,
                pipelineProperty, "{@inheritDoc}", pipelineMethodImpl);
        importPackages.add(ClassType.HTTP_PIPELINE.getFullName());

        httpClientBuilderTraitMethods.add(pipelineMethod);

        // httpClient
        ServiceClientProperty httpClientProperty = new ServiceClientProperty("The HTTP client used to send the request.",
                ClassType.HTTP_CLIENT, "httpClient", false, null);
        Consumer<JavaBlock> httpClientMethodImpl = function -> {
            function.line(String.format("this.%1$s = %2$s;", "httpClient", "httpClient"));
            function.methodReturn("this");
        };
        ClientBuilderTraitMethod httpClientMethod = createTraitMethod("httpClient", "httpClient", ClassType.HTTP_CLIENT,
                httpClientProperty, "{@inheritDoc}", httpClientMethodImpl);
        importPackages.add(ClassType.HTTP_CLIENT.getFullName());

        httpClientBuilderTraitMethods.add(httpClientMethod);

        // httpLogOptions
        ServiceClientProperty httpLogOptionsProperty = new ServiceClientProperty("The logging configuration for HTTP " +
                "requests and responses.",
                ClassType.HTTP_LOG_OPTIONS, "httpLogOptions", false, null);
        Consumer<JavaBlock> httpLogOptionsMethodImpl = function -> {
            function.line(String.format("this.%1$s = %2$s;", "httpLogOptions", "httpLogOptions"));
            function.methodReturn("this");
        };
        ClientBuilderTraitMethod httpLogOptionsMethod = createTraitMethod("httpLogOptions", "httpLogOptions", ClassType.HTTP_LOG_OPTIONS,
                httpLogOptionsProperty, "{@inheritDoc}", httpLogOptionsMethodImpl);
        importPackages.add(ClassType.HTTP_LOG_OPTIONS.getFullName());

        httpClientBuilderTraitMethods.add(httpLogOptionsMethod);

        // clientOptions
        if (isBranded) {
            ServiceClientProperty clientOptionsProperty = new ServiceClientProperty("The client options such as application ID and custom headers to set on a request.",
                    ClassType.CLIENT_OPTIONS, "clientOptions", false, null);
            Consumer<JavaBlock> clientOptionsMethodImpl = function -> {
                function.line(String.format("this.%1$s = %2$s;", "clientOptions", "clientOptions"));
                function.methodReturn("this");
            };
            ClientBuilderTraitMethod clientOptionsMethod = createTraitMethod("clientOptions", "clientOptions", ClassType.CLIENT_OPTIONS,
                    clientOptionsProperty, "{@inheritDoc}", clientOptionsMethodImpl);
            importPackages.add(ClassType.CLIENT_OPTIONS.getFullName());

            httpClientBuilderTraitMethods.add(clientOptionsMethod);
        }

        // retryOptions
        ServiceClientProperty retryOptionsProperty =
                new ServiceClientProperty("The retry options to configure retry policy for failed "
                + "requests.",
                ClassType.RETRY_OPTIONS, "retryOptions", false, null);
        Consumer<JavaBlock> retryOptionsMethodImpl = function -> {
            function.line(String.format("this.%1$s = %2$s;", "retryOptions", "retryOptions"));
            function.methodReturn("this");
        };
        String retryOptionsMethodName = isBranded ? "retryOptions" : "httpRetryOptions";
        ClientBuilderTraitMethod retryOptionsMethod = createTraitMethod(retryOptionsMethodName, "retryOptions", ClassType.RETRY_OPTIONS,
                retryOptionsProperty, "{@inheritDoc}", retryOptionsMethodImpl);
        importPackages.add(ClassType.RETRY_OPTIONS.getFullName());
        httpClientBuilderTraitMethods.add(retryOptionsMethod);

        // addPolicy
        Consumer<JavaBlock> addPolicyMethodImpl = function -> {
            function.line("Objects.requireNonNull(customPolicy, \"'customPolicy' cannot be null.\");");
            function.line("pipelinePolicies.add(customPolicy);");
            function.methodReturn("this");
        };
        String addPolicyMethodName = isBranded ? "addPolicy" : "addHttpPipelinePolicy";
        ClientBuilderTraitMethod addPolicyMethod = createTraitMethod(addPolicyMethodName, "customPolicy", ClassType.HTTP_PIPELINE_POLICY,
                null, "{@inheritDoc}", addPolicyMethodImpl);
        importPackages.add(ClassType.HTTP_PIPELINE_POLICY.getFullName());
        httpClientBuilderTraitMethods.add(addPolicyMethod);


        if (!isBranded) {
            // redirectOptions
            ServiceClientProperty redirectOptionsProperty =
                    new ServiceClientProperty("The redirect options to configure redirect policy",
                            ClassType.REDIRECT_OPTIONS, "redirectOptions", false, null);
            Consumer<JavaBlock> redirectOptionsMethodImpl = function -> {
                function.line(String.format("this.%1$s = %2$s;", "redirectOptions", "redirectOptions"));
                function.methodReturn("this");
            };
            ClientBuilderTraitMethod redirectOptionsMethod = createTraitMethod("httpRedirectOptions", "redirectOptions", ClassType.REDIRECT_OPTIONS,
                    redirectOptionsProperty, "{@inheritDoc}", redirectOptionsMethodImpl);
            importPackages.add(ClassType.REDIRECT_OPTIONS.getFullName());
            httpClientBuilderTraitMethods.add(redirectOptionsMethod);
        }

        return httpTrait;
    }

    private static String addLogging(LogLevel level, String message) {

        if (JavaSettings.getInstance().isBranded()) {
            switch (level) {
                case VERBOSE:
                    return String.format("LOGGER.atVerbose().log(\"%s\");", message);
                case INFORMATIONAL:
                    return String.format("LOGGER.atInfo().log(\"%s\");", message);
                case WARNING:
                    return String.format("LOGGER.atWarning().log(\"%s\");", message);
                case ERROR:
                    return String.format("LOGGER.atError().log(\"%s\");", message);
                default:
                    return String.format("LOGGER.atInfo().log(\"%s\");", message);
            }
        } else {
            switch (level) {
                case VERBOSE:
                    return String.format("LOGGER.atVerbose().log(\"%s\");", message);
                case INFORMATIONAL:
                    return String.format("LOGGER.atInfo().log(\"%s\");", message);
                case WARNING:
                    return String.format("LOGGER.atWarning().log(\"%s\");", message);
                case ERROR:
                    return String.format("LOGGER.atError().log(\"%s\");", message);
                default:
                    return String.format("LOGGER.atInfo().log(\"%s\");", message);
            }
        }
    }

    private static ClientBuilderTrait createConfigurationTrait() {
        ClientBuilderTrait configurationTrait = new ClientBuilderTrait();
        configurationTrait.setTraitInterfaceName("ConfigurationTrait");
        List<String> importPackages = new ArrayList<>();
        configurationTrait.setImportPackages(importPackages);
        importPackages.add(ClassType.CONFIGURATION_TRAIT.getFullName());

        List<ClientBuilderTraitMethod> configurationClientBuilderTraitMethods = new ArrayList<>();
        configurationTrait.setTraitMethods(configurationClientBuilderTraitMethods);

        String propertyName = "configuration";
        ServiceClientProperty configurationProperty = new ServiceClientProperty("The configuration store that is used" +
                " during construction of the service client.",
                ClassType.CONFIGURATION, propertyName, false, null);

        Consumer<JavaBlock> configurationMethodImpl = function -> {
            function.line(String.format("this.%1$s = %2$s;", propertyName, propertyName));
            function.methodReturn("this");
        };
        ClientBuilderTraitMethod configurationMethod = createTraitMethod(propertyName, propertyName, ClassType.CONFIGURATION,
                configurationProperty, "{@inheritDoc}", configurationMethodImpl);
        importPackages.add(ClassType.CONFIGURATION.getFullName());

        configurationClientBuilderTraitMethods.add(configurationMethod);
        return configurationTrait;
    }

    private static ClientBuilderTrait createProxyTrait() {
        ClientBuilderTrait proxyTrait = new ClientBuilderTrait();
        proxyTrait.setTraitInterfaceName("ProxyTrait");
        List<String> importPackages = new ArrayList<>();
        proxyTrait.setImportPackages(importPackages);
        importPackages.add(ClassType.PROXY_TRAIT.getFullName());

        List<ClientBuilderTraitMethod> proxyClientBuilderTraitMethods = new ArrayList<>();
        proxyTrait.setTraitMethods(proxyClientBuilderTraitMethods);

        String propertyName = "proxyOptions";
        ServiceClientProperty proxyOptionsProperty = new ServiceClientProperty("The proxy options used" +
                " during construction of the service client.",
                ClassType.PROXY_OPTIONS, propertyName, false, null);

        Consumer<JavaBlock> proxyMethodImpl = function -> {
            function.line(String.format("this.%1$s = %2$s;", propertyName, propertyName));
            function.methodReturn("this");
        };
        ClientBuilderTraitMethod proxyMethod = createTraitMethod(propertyName, propertyName, ClassType.PROXY_OPTIONS,
                proxyOptionsProperty, "{@inheritDoc}", proxyMethodImpl);
        importPackages.add(ClassType.PROXY_OPTIONS.getFullName());

        proxyClientBuilderTraitMethods.add(proxyMethod);
        return proxyTrait;
    }

    public static ClientBuilderTrait getEndpointTrait(ServiceClientProperty property) {
        ClientBuilderTrait endpointTrait = ClientBuilderTrait.endpointTrait;
        if (endpointTrait == null) {
            endpointTrait = new ClientBuilderTrait();
            endpointTrait.setTraitInterfaceName(EndpointTrait.class.getSimpleName());

            List<String> importPackages = new ArrayList<>();
            endpointTrait.setImportPackages(importPackages);
            importPackages.add(ClassType.ENDPOINT_TRAIT.getFullName());

            List<ClientBuilderTraitMethod> endpointClientBuilderTraitMethods = new ArrayList<>();
            endpointTrait.setTraitMethods(endpointClientBuilderTraitMethods);

            String propertyName = "endpoint";
            ServiceClientProperty endpointProperty = new ServiceClientProperty.Builder()
                    .name(propertyName)
                    .type(ClassType.STRING)
                    .description("The service endpoint")
                    .readOnly(false)
                    .required(property.isRequired())
                    .defaultValueExpression(property.getDefaultValueExpression())
                    .requestParameterName(property.getRequestParameterName())
                    .build();

            Consumer<JavaBlock> endpointMethodImpl = function -> {
                function.line(String.format("this.%1$s = %2$s;", propertyName, propertyName));
                function.methodReturn("this");
            };
            ClientBuilderTraitMethod endpointMethod = createTraitMethod(propertyName, propertyName, ClassType.STRING,
                    endpointProperty, "{@inheritDoc}", endpointMethodImpl);

            endpointClientBuilderTraitMethods.add(endpointMethod);
            ClientBuilderTrait.endpointTrait = endpointTrait;
        }
        return endpointTrait;
    }

    private static ClientBuilderTrait createTokenCredentialTrait() {
        ClientBuilderTrait tokenCredentialTrait = new ClientBuilderTrait();
        tokenCredentialTrait.setTraitInterfaceName(TokenCredentialTrait.class.getSimpleName());
        List<String> importPackages = new ArrayList<>();
        tokenCredentialTrait.setImportPackages(importPackages);
        importPackages.add(TokenCredentialTrait.class.getName());

        List<ClientBuilderTraitMethod> clientBuilderTraitMethods = new ArrayList<>();
        tokenCredentialTrait.setTraitMethods(clientBuilderTraitMethods);

        String propertyName = "tokenCredential";
        ServiceClientProperty property = new ServiceClientProperty("The TokenCredential used for authentication.",
                ClassType.TOKEN_CREDENTIAL, propertyName, false, null);

        Consumer<JavaBlock> methodImpl = function -> {
            function.line(String.format("this.%1$s = %2$s;", propertyName, propertyName));
            function.methodReturn("this");
        };
        ClientBuilderTraitMethod clientMethod = createTraitMethod("credential", propertyName, ClassType.TOKEN_CREDENTIAL,
                property, "{@inheritDoc}", methodImpl);
        importPackages.add(TokenCredential.class.getName());

        clientBuilderTraitMethods.add(clientMethod);
        return tokenCredentialTrait;
    }

    private static ClientBuilderTrait createAzureKeyCredentialTrait() {
        ClientBuilderTrait azureKeyCredentialTrait = new ClientBuilderTrait();
        azureKeyCredentialTrait.setTraitInterfaceName(AzureKeyCredentialTrait.class.getSimpleName());
        List<String> importPackages = new ArrayList<>();
        azureKeyCredentialTrait.setImportPackages(importPackages);
        importPackages.add(AzureKeyCredentialTrait.class.getName());

        List<ClientBuilderTraitMethod> clientBuilderTraitMethods = new ArrayList<>();
        azureKeyCredentialTrait.setTraitMethods(clientBuilderTraitMethods);

        String propertyName = "azureKeyCredential";
        ServiceClientProperty property = new ServiceClientProperty("The AzureKeyCredential used for authentication.",
                ClassType.AZURE_KEY_CREDENTIAL, propertyName, false, null);

        Consumer<JavaBlock> methodImpl = function -> {
            function.line(String.format("this.%1$s = %2$s;", propertyName, propertyName));
            function.methodReturn("this");
        };
        ClientBuilderTraitMethod clientMethod = createTraitMethod("credential", propertyName, ClassType.AZURE_KEY_CREDENTIAL,
                property, "{@inheritDoc}", methodImpl);
        importPackages.add(AzureKeyCredential.class.getName());

        clientBuilderTraitMethods.add(clientMethod);
        return azureKeyCredentialTrait;
    }

    private static ClientBuilderTrait createKeyCredentialTrait() {
        ClientBuilderTrait keyCredentialTrait = new ClientBuilderTrait();
        keyCredentialTrait.setTraitInterfaceName(KeyCredentialTrait.class.getSimpleName());
        List<String> importPackages = new ArrayList<>();
        keyCredentialTrait.setImportPackages(importPackages);
        importPackages.add(ClassType.KEY_CREDENTIAL_TRAIT.getFullName());

        List<ClientBuilderTraitMethod> clientBuilderTraitMethods = new ArrayList<>();
        keyCredentialTrait.setTraitMethods(clientBuilderTraitMethods);

        String propertyName = "keyCredential";
        ServiceClientProperty property = new ServiceClientProperty("The KeyCredential used for authentication.",
                ClassType.KEY_CREDENTIAL, propertyName, false, null);

        Consumer<JavaBlock> methodImpl = function -> {
            function.line(String.format("this.%1$s = %2$s;", propertyName, propertyName));
            function.methodReturn("this");
        };
        ClientBuilderTraitMethod clientMethod = createTraitMethod("credential", propertyName, ClassType.KEY_CREDENTIAL,
                property, "{@inheritDoc}", methodImpl);
        importPackages.add(ClassType.KEY_CREDENTIAL.getFullName());

        clientBuilderTraitMethods.add(clientMethod);
        return keyCredentialTrait;
    }

    private static ClientBuilderTraitMethod createTraitMethod(String methodName, String methodParamName, ClassType paramType,
                                                              ServiceClientProperty property,
                                                              String documentation, Consumer<JavaBlock> methodImpl) {
        ClientBuilderTraitMethod pipelineMethod = new ClientBuilderTraitMethod();
        pipelineMethod.setMethodName(methodName);
        pipelineMethod.setMethodParamName(methodParamName);
        pipelineMethod.setMethodParamType(paramType);
        pipelineMethod.setProperty(property);
        pipelineMethod.setDocumentation(documentation);
        pipelineMethod.setMethodImpl(methodImpl);
        return pipelineMethod;
    }
}
