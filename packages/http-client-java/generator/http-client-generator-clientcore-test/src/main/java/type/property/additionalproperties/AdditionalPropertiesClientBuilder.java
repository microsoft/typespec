package type.property.additionalproperties;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;
import io.clientcore.core.annotations.ServiceClientBuilder;
import io.clientcore.core.http.client.HttpClient;
import io.clientcore.core.http.models.ProxyOptions;
import io.clientcore.core.http.pipeline.HttpInstrumentationOptions;
import io.clientcore.core.http.pipeline.HttpInstrumentationPolicy;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.http.pipeline.HttpPipelineBuilder;
import io.clientcore.core.http.pipeline.HttpPipelinePolicy;
import io.clientcore.core.http.pipeline.HttpRedirectOptions;
import io.clientcore.core.http.pipeline.HttpRedirectPolicy;
import io.clientcore.core.http.pipeline.HttpRetryOptions;
import io.clientcore.core.http.pipeline.HttpRetryPolicy;
import io.clientcore.core.instrumentation.Instrumentation;
import io.clientcore.core.instrumentation.SdkInstrumentationOptions;
import io.clientcore.core.traits.ConfigurationTrait;
import io.clientcore.core.traits.EndpointTrait;
import io.clientcore.core.traits.HttpTrait;
import io.clientcore.core.traits.ProxyTrait;
import io.clientcore.core.utils.CoreUtils;
import io.clientcore.core.utils.configuration.Configuration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import type.property.additionalproperties.implementation.AdditionalPropertiesClientImpl;

/**
 * A builder for creating a new instance of the AdditionalPropertiesClient type.
 */
@ServiceClientBuilder(
    serviceClients = {
        ExtendsUnknownClient.class,
        ExtendsUnknownDerivedClient.class,
        ExtendsUnknownDiscriminatedClient.class,
        IsUnknownClient.class,
        IsUnknownDerivedClient.class,
        IsUnknownDiscriminatedClient.class,
        ExtendsStringClient.class,
        IsStringClient.class,
        SpreadStringClient.class,
        ExtendsFloatClient.class,
        IsFloatClient.class,
        SpreadFloatClient.class,
        ExtendsModelClient.class,
        IsModelClient.class,
        SpreadModelClient.class,
        ExtendsModelArrayClient.class,
        IsModelArrayClient.class,
        SpreadModelArrayClient.class,
        SpreadDifferentStringClient.class,
        SpreadDifferentFloatClient.class,
        SpreadDifferentModelClient.class,
        SpreadDifferentModelArrayClient.class,
        ExtendsDifferentSpreadStringClient.class,
        ExtendsDifferentSpreadFloatClient.class,
        ExtendsDifferentSpreadModelClient.class,
        ExtendsDifferentSpreadModelArrayClient.class,
        MultipleSpreadClient.class,
        SpreadRecordUnionClient.class,
        SpreadRecordNonDiscriminatedUnionClient.class,
        SpreadRecordNonDiscriminatedUnion2Client.class,
        SpreadRecordNonDiscriminatedUnion3Client.class })
public final class AdditionalPropertiesClientBuilder
    implements HttpTrait<AdditionalPropertiesClientBuilder>, ProxyTrait<AdditionalPropertiesClientBuilder>,
    ConfigurationTrait<AdditionalPropertiesClientBuilder>, EndpointTrait<AdditionalPropertiesClientBuilder> {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_NAME = "name";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_VERSION = "version";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final Map<String, String> PROPERTIES
        = CoreUtils.getProperties("type-property-additionalproperties.properties");

    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the AdditionalPropertiesClientBuilder.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public AdditionalPropertiesClientBuilder() {
        this.pipelinePolicies = new ArrayList<>();
    }

    /*
     * The HTTP client used to send the request.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private HttpClient httpClient;

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public AdditionalPropertiesClientBuilder httpClient(HttpClient httpClient) {
        this.httpClient = httpClient;
        return this;
    }

    /*
     * The retry options to configure retry policy for failed requests.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private HttpRetryOptions retryOptions;

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public AdditionalPropertiesClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public AdditionalPropertiesClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
        Objects.requireNonNull(customPolicy, "'customPolicy' cannot be null.");
        pipelinePolicies.add(customPolicy);
        return this;
    }

    /*
     * The redirect options to configure redirect policy
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private HttpRedirectOptions redirectOptions;

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public AdditionalPropertiesClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
        this.redirectOptions = redirectOptions;
        return this;
    }

    /*
     * The instrumentation configuration for HTTP requests and responses.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private HttpInstrumentationOptions httpInstrumentationOptions;

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public AdditionalPropertiesClientBuilder
        httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
        this.httpInstrumentationOptions = httpInstrumentationOptions;
        return this;
    }

    /*
     * The proxy options used during construction of the service client.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private ProxyOptions proxyOptions;

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public AdditionalPropertiesClientBuilder proxyOptions(ProxyOptions proxyOptions) {
        this.proxyOptions = proxyOptions;
        return this;
    }

    /*
     * The configuration store that is used during construction of the service client.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private Configuration configuration;

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public AdditionalPropertiesClientBuilder configuration(Configuration configuration) {
        this.configuration = configuration;
        return this;
    }

    /*
     * The service endpoint
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private String endpoint;

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public AdditionalPropertiesClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of AdditionalPropertiesClientImpl with the provided parameters.
     * 
     * @return an instance of AdditionalPropertiesClientImpl.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private AdditionalPropertiesClientImpl buildInnerClient() {
        this.validateClient();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        AdditionalPropertiesClientImpl client = new AdditionalPropertiesClientImpl(createHttpPipeline(), localEndpoint);
        return client;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    private void validateClient() {
        // This method is invoked from 'buildInnerClient'/'buildClient' method.
        // Developer can customize this method, to validate that the necessary conditions are met for the new client.
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    private HttpPipeline createHttpPipeline() {
        Configuration buildConfiguration
            = (configuration == null) ? Configuration.getGlobalConfiguration() : configuration;
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        HttpPipelineBuilder httpPipelineBuilder = new HttpPipelineBuilder();
        List<HttpPipelinePolicy> policies = new ArrayList<>();
        policies.add(redirectOptions == null ? new HttpRedirectPolicy() : new HttpRedirectPolicy(redirectOptions));
        policies.add(retryOptions == null ? new HttpRetryPolicy() : new HttpRetryPolicy(retryOptions));
        this.pipelinePolicies.stream().forEach(p -> policies.add(p));
        policies.add(new HttpInstrumentationPolicy(localHttpInstrumentationOptions));
        policies.forEach(httpPipelineBuilder::addPolicy);
        return httpPipelineBuilder.httpClient(httpClient).build();
    }

    /**
     * Builds an instance of ExtendsUnknownClient class.
     * 
     * @return an instance of ExtendsUnknownClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsUnknownClient buildExtendsUnknownClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ExtendsUnknownClient(buildInnerClient().getExtendsUnknowns(), instrumentation);
    }

    /**
     * Builds an instance of ExtendsUnknownDerivedClient class.
     * 
     * @return an instance of ExtendsUnknownDerivedClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsUnknownDerivedClient buildExtendsUnknownDerivedClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ExtendsUnknownDerivedClient(buildInnerClient().getExtendsUnknownDeriveds(), instrumentation);
    }

    /**
     * Builds an instance of ExtendsUnknownDiscriminatedClient class.
     * 
     * @return an instance of ExtendsUnknownDiscriminatedClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsUnknownDiscriminatedClient buildExtendsUnknownDiscriminatedClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ExtendsUnknownDiscriminatedClient(buildInnerClient().getExtendsUnknownDiscriminateds(),
            instrumentation);
    }

    /**
     * Builds an instance of IsUnknownClient class.
     * 
     * @return an instance of IsUnknownClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsUnknownClient buildIsUnknownClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new IsUnknownClient(buildInnerClient().getIsUnknowns(), instrumentation);
    }

    /**
     * Builds an instance of IsUnknownDerivedClient class.
     * 
     * @return an instance of IsUnknownDerivedClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsUnknownDerivedClient buildIsUnknownDerivedClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new IsUnknownDerivedClient(buildInnerClient().getIsUnknownDeriveds(), instrumentation);
    }

    /**
     * Builds an instance of IsUnknownDiscriminatedClient class.
     * 
     * @return an instance of IsUnknownDiscriminatedClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsUnknownDiscriminatedClient buildIsUnknownDiscriminatedClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new IsUnknownDiscriminatedClient(buildInnerClient().getIsUnknownDiscriminateds(), instrumentation);
    }

    /**
     * Builds an instance of ExtendsStringClient class.
     * 
     * @return an instance of ExtendsStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsStringClient buildExtendsStringClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ExtendsStringClient(buildInnerClient().getExtendsStrings(), instrumentation);
    }

    /**
     * Builds an instance of IsStringClient class.
     * 
     * @return an instance of IsStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsStringClient buildIsStringClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new IsStringClient(buildInnerClient().getIsStrings(), instrumentation);
    }

    /**
     * Builds an instance of SpreadStringClient class.
     * 
     * @return an instance of SpreadStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadStringClient buildSpreadStringClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new SpreadStringClient(buildInnerClient().getSpreadStrings(), instrumentation);
    }

    /**
     * Builds an instance of ExtendsFloatClient class.
     * 
     * @return an instance of ExtendsFloatClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsFloatClient buildExtendsFloatClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ExtendsFloatClient(buildInnerClient().getExtendsFloats(), instrumentation);
    }

    /**
     * Builds an instance of IsFloatClient class.
     * 
     * @return an instance of IsFloatClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsFloatClient buildIsFloatClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new IsFloatClient(buildInnerClient().getIsFloats(), instrumentation);
    }

    /**
     * Builds an instance of SpreadFloatClient class.
     * 
     * @return an instance of SpreadFloatClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadFloatClient buildSpreadFloatClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new SpreadFloatClient(buildInnerClient().getSpreadFloats(), instrumentation);
    }

    /**
     * Builds an instance of ExtendsModelClient class.
     * 
     * @return an instance of ExtendsModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsModelClient buildExtendsModelClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ExtendsModelClient(buildInnerClient().getExtendsModels(), instrumentation);
    }

    /**
     * Builds an instance of IsModelClient class.
     * 
     * @return an instance of IsModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsModelClient buildIsModelClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new IsModelClient(buildInnerClient().getIsModels(), instrumentation);
    }

    /**
     * Builds an instance of SpreadModelClient class.
     * 
     * @return an instance of SpreadModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadModelClient buildSpreadModelClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new SpreadModelClient(buildInnerClient().getSpreadModels(), instrumentation);
    }

    /**
     * Builds an instance of ExtendsModelArrayClient class.
     * 
     * @return an instance of ExtendsModelArrayClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsModelArrayClient buildExtendsModelArrayClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ExtendsModelArrayClient(buildInnerClient().getExtendsModelArrays(), instrumentation);
    }

    /**
     * Builds an instance of IsModelArrayClient class.
     * 
     * @return an instance of IsModelArrayClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsModelArrayClient buildIsModelArrayClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new IsModelArrayClient(buildInnerClient().getIsModelArrays(), instrumentation);
    }

    /**
     * Builds an instance of SpreadModelArrayClient class.
     * 
     * @return an instance of SpreadModelArrayClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadModelArrayClient buildSpreadModelArrayClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new SpreadModelArrayClient(buildInnerClient().getSpreadModelArrays(), instrumentation);
    }

    /**
     * Builds an instance of SpreadDifferentStringClient class.
     * 
     * @return an instance of SpreadDifferentStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadDifferentStringClient buildSpreadDifferentStringClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new SpreadDifferentStringClient(buildInnerClient().getSpreadDifferentStrings(), instrumentation);
    }

    /**
     * Builds an instance of SpreadDifferentFloatClient class.
     * 
     * @return an instance of SpreadDifferentFloatClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadDifferentFloatClient buildSpreadDifferentFloatClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new SpreadDifferentFloatClient(buildInnerClient().getSpreadDifferentFloats(), instrumentation);
    }

    /**
     * Builds an instance of SpreadDifferentModelClient class.
     * 
     * @return an instance of SpreadDifferentModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadDifferentModelClient buildSpreadDifferentModelClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new SpreadDifferentModelClient(buildInnerClient().getSpreadDifferentModels(), instrumentation);
    }

    /**
     * Builds an instance of SpreadDifferentModelArrayClient class.
     * 
     * @return an instance of SpreadDifferentModelArrayClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadDifferentModelArrayClient buildSpreadDifferentModelArrayClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new SpreadDifferentModelArrayClient(buildInnerClient().getSpreadDifferentModelArrays(), instrumentation);
    }

    /**
     * Builds an instance of ExtendsDifferentSpreadStringClient class.
     * 
     * @return an instance of ExtendsDifferentSpreadStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsDifferentSpreadStringClient buildExtendsDifferentSpreadStringClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ExtendsDifferentSpreadStringClient(buildInnerClient().getExtendsDifferentSpreadStrings(),
            instrumentation);
    }

    /**
     * Builds an instance of ExtendsDifferentSpreadFloatClient class.
     * 
     * @return an instance of ExtendsDifferentSpreadFloatClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsDifferentSpreadFloatClient buildExtendsDifferentSpreadFloatClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ExtendsDifferentSpreadFloatClient(buildInnerClient().getExtendsDifferentSpreadFloats(),
            instrumentation);
    }

    /**
     * Builds an instance of ExtendsDifferentSpreadModelClient class.
     * 
     * @return an instance of ExtendsDifferentSpreadModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsDifferentSpreadModelClient buildExtendsDifferentSpreadModelClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ExtendsDifferentSpreadModelClient(buildInnerClient().getExtendsDifferentSpreadModels(),
            instrumentation);
    }

    /**
     * Builds an instance of ExtendsDifferentSpreadModelArrayClient class.
     * 
     * @return an instance of ExtendsDifferentSpreadModelArrayClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsDifferentSpreadModelArrayClient buildExtendsDifferentSpreadModelArrayClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ExtendsDifferentSpreadModelArrayClient(buildInnerClient().getExtendsDifferentSpreadModelArrays(),
            instrumentation);
    }

    /**
     * Builds an instance of MultipleSpreadClient class.
     * 
     * @return an instance of MultipleSpreadClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public MultipleSpreadClient buildMultipleSpreadClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new MultipleSpreadClient(buildInnerClient().getMultipleSpreads(), instrumentation);
    }

    /**
     * Builds an instance of SpreadRecordUnionClient class.
     * 
     * @return an instance of SpreadRecordUnionClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadRecordUnionClient buildSpreadRecordUnionClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new SpreadRecordUnionClient(buildInnerClient().getSpreadRecordUnions(), instrumentation);
    }

    /**
     * Builds an instance of SpreadRecordNonDiscriminatedUnionClient class.
     * 
     * @return an instance of SpreadRecordNonDiscriminatedUnionClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadRecordNonDiscriminatedUnionClient buildSpreadRecordNonDiscriminatedUnionClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new SpreadRecordNonDiscriminatedUnionClient(buildInnerClient().getSpreadRecordNonDiscriminatedUnions(),
            instrumentation);
    }

    /**
     * Builds an instance of SpreadRecordNonDiscriminatedUnion2Client class.
     * 
     * @return an instance of SpreadRecordNonDiscriminatedUnion2Client.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadRecordNonDiscriminatedUnion2Client buildSpreadRecordNonDiscriminatedUnion2Client() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new SpreadRecordNonDiscriminatedUnion2Client(buildInnerClient().getSpreadRecordNonDiscriminatedUnion2s(),
            instrumentation);
    }

    /**
     * Builds an instance of SpreadRecordNonDiscriminatedUnion3Client class.
     * 
     * @return an instance of SpreadRecordNonDiscriminatedUnion3Client.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadRecordNonDiscriminatedUnion3Client buildSpreadRecordNonDiscriminatedUnion3Client() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(this.endpoint != null ? this.endpoint : "http://localhost:3000");
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new SpreadRecordNonDiscriminatedUnion3Client(buildInnerClient().getSpreadRecordNonDiscriminatedUnion3s(),
            instrumentation);
    }
}
