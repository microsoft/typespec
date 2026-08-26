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
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(localEndpoint);
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        AdditionalPropertiesClientImpl client
            = new AdditionalPropertiesClientImpl(createHttpPipeline(), instrumentation, localEndpoint);
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
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new ExtendsUnknownClient(innerClient.getExtendsUnknowns(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of ExtendsUnknownDerivedClient class.
     * 
     * @return an instance of ExtendsUnknownDerivedClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsUnknownDerivedClient buildExtendsUnknownDerivedClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new ExtendsUnknownDerivedClient(innerClient.getExtendsUnknownDeriveds(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of ExtendsUnknownDiscriminatedClient class.
     * 
     * @return an instance of ExtendsUnknownDiscriminatedClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsUnknownDiscriminatedClient buildExtendsUnknownDiscriminatedClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new ExtendsUnknownDiscriminatedClient(innerClient.getExtendsUnknownDiscriminateds(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of IsUnknownClient class.
     * 
     * @return an instance of IsUnknownClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsUnknownClient buildIsUnknownClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new IsUnknownClient(innerClient.getIsUnknowns(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of IsUnknownDerivedClient class.
     * 
     * @return an instance of IsUnknownDerivedClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsUnknownDerivedClient buildIsUnknownDerivedClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new IsUnknownDerivedClient(innerClient.getIsUnknownDeriveds(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of IsUnknownDiscriminatedClient class.
     * 
     * @return an instance of IsUnknownDiscriminatedClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsUnknownDiscriminatedClient buildIsUnknownDiscriminatedClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new IsUnknownDiscriminatedClient(innerClient.getIsUnknownDiscriminateds(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of ExtendsStringClient class.
     * 
     * @return an instance of ExtendsStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsStringClient buildExtendsStringClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new ExtendsStringClient(innerClient.getExtendsStrings(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of IsStringClient class.
     * 
     * @return an instance of IsStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsStringClient buildIsStringClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new IsStringClient(innerClient.getIsStrings(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of SpreadStringClient class.
     * 
     * @return an instance of SpreadStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadStringClient buildSpreadStringClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new SpreadStringClient(innerClient.getSpreadStrings(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of ExtendsFloatClient class.
     * 
     * @return an instance of ExtendsFloatClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsFloatClient buildExtendsFloatClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new ExtendsFloatClient(innerClient.getExtendsFloats(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of IsFloatClient class.
     * 
     * @return an instance of IsFloatClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsFloatClient buildIsFloatClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new IsFloatClient(innerClient.getIsFloats(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of SpreadFloatClient class.
     * 
     * @return an instance of SpreadFloatClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadFloatClient buildSpreadFloatClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new SpreadFloatClient(innerClient.getSpreadFloats(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of ExtendsModelClient class.
     * 
     * @return an instance of ExtendsModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsModelClient buildExtendsModelClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new ExtendsModelClient(innerClient.getExtendsModels(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of IsModelClient class.
     * 
     * @return an instance of IsModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsModelClient buildIsModelClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new IsModelClient(innerClient.getIsModels(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of SpreadModelClient class.
     * 
     * @return an instance of SpreadModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadModelClient buildSpreadModelClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new SpreadModelClient(innerClient.getSpreadModels(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of ExtendsModelArrayClient class.
     * 
     * @return an instance of ExtendsModelArrayClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsModelArrayClient buildExtendsModelArrayClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new ExtendsModelArrayClient(innerClient.getExtendsModelArrays(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of IsModelArrayClient class.
     * 
     * @return an instance of IsModelArrayClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IsModelArrayClient buildIsModelArrayClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new IsModelArrayClient(innerClient.getIsModelArrays(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of SpreadModelArrayClient class.
     * 
     * @return an instance of SpreadModelArrayClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadModelArrayClient buildSpreadModelArrayClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new SpreadModelArrayClient(innerClient.getSpreadModelArrays(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of SpreadDifferentStringClient class.
     * 
     * @return an instance of SpreadDifferentStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadDifferentStringClient buildSpreadDifferentStringClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new SpreadDifferentStringClient(innerClient.getSpreadDifferentStrings(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of SpreadDifferentFloatClient class.
     * 
     * @return an instance of SpreadDifferentFloatClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadDifferentFloatClient buildSpreadDifferentFloatClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new SpreadDifferentFloatClient(innerClient.getSpreadDifferentFloats(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of SpreadDifferentModelClient class.
     * 
     * @return an instance of SpreadDifferentModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadDifferentModelClient buildSpreadDifferentModelClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new SpreadDifferentModelClient(innerClient.getSpreadDifferentModels(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of SpreadDifferentModelArrayClient class.
     * 
     * @return an instance of SpreadDifferentModelArrayClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadDifferentModelArrayClient buildSpreadDifferentModelArrayClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new SpreadDifferentModelArrayClient(innerClient.getSpreadDifferentModelArrays(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of ExtendsDifferentSpreadStringClient class.
     * 
     * @return an instance of ExtendsDifferentSpreadStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsDifferentSpreadStringClient buildExtendsDifferentSpreadStringClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new ExtendsDifferentSpreadStringClient(innerClient.getExtendsDifferentSpreadStrings(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of ExtendsDifferentSpreadFloatClient class.
     * 
     * @return an instance of ExtendsDifferentSpreadFloatClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsDifferentSpreadFloatClient buildExtendsDifferentSpreadFloatClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new ExtendsDifferentSpreadFloatClient(innerClient.getExtendsDifferentSpreadFloats(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of ExtendsDifferentSpreadModelClient class.
     * 
     * @return an instance of ExtendsDifferentSpreadModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsDifferentSpreadModelClient buildExtendsDifferentSpreadModelClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new ExtendsDifferentSpreadModelClient(innerClient.getExtendsDifferentSpreadModels(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of ExtendsDifferentSpreadModelArrayClient class.
     * 
     * @return an instance of ExtendsDifferentSpreadModelArrayClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtendsDifferentSpreadModelArrayClient buildExtendsDifferentSpreadModelArrayClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new ExtendsDifferentSpreadModelArrayClient(innerClient.getExtendsDifferentSpreadModelArrays(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of MultipleSpreadClient class.
     * 
     * @return an instance of MultipleSpreadClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public MultipleSpreadClient buildMultipleSpreadClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new MultipleSpreadClient(innerClient.getMultipleSpreads(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of SpreadRecordUnionClient class.
     * 
     * @return an instance of SpreadRecordUnionClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadRecordUnionClient buildSpreadRecordUnionClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new SpreadRecordUnionClient(innerClient.getSpreadRecordUnions(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of SpreadRecordNonDiscriminatedUnionClient class.
     * 
     * @return an instance of SpreadRecordNonDiscriminatedUnionClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadRecordNonDiscriminatedUnionClient buildSpreadRecordNonDiscriminatedUnionClient() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new SpreadRecordNonDiscriminatedUnionClient(innerClient.getSpreadRecordNonDiscriminatedUnions(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of SpreadRecordNonDiscriminatedUnion2Client class.
     * 
     * @return an instance of SpreadRecordNonDiscriminatedUnion2Client.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadRecordNonDiscriminatedUnion2Client buildSpreadRecordNonDiscriminatedUnion2Client() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new SpreadRecordNonDiscriminatedUnion2Client(innerClient.getSpreadRecordNonDiscriminatedUnion2s(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of SpreadRecordNonDiscriminatedUnion3Client class.
     * 
     * @return an instance of SpreadRecordNonDiscriminatedUnion3Client.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SpreadRecordNonDiscriminatedUnion3Client buildSpreadRecordNonDiscriminatedUnion3Client() {
        AdditionalPropertiesClientImpl innerClient = buildInnerClient();
        return new SpreadRecordNonDiscriminatedUnion3Client(innerClient.getSpreadRecordNonDiscriminatedUnion3s(),
            innerClient.getInstrumentation());
    }
}
