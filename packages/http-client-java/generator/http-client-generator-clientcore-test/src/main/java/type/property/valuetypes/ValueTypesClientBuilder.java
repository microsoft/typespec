package type.property.valuetypes;

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
import type.property.valuetypes.implementation.ValueTypesClientImpl;

/**
 * A builder for creating a new instance of the ValueTypesClient type.
 */
@ServiceClientBuilder(
    serviceClients = {
        BooleanOperationClient.class,
        StringOperationClient.class,
        BytesClient.class,
        IntClient.class,
        FloatOperationClient.class,
        DecimalClient.class,
        Decimal128Client.class,
        DatetimeOperationClient.class,
        DurationOperationClient.class,
        EnumClient.class,
        ExtensibleEnumClient.class,
        ModelClient.class,
        CollectionsStringClient.class,
        CollectionsIntClient.class,
        CollectionsModelClient.class,
        DictionaryStringClient.class,
        NeverClient.class,
        UnknownStringClient.class,
        UnknownIntClient.class,
        UnknownDictClient.class,
        UnknownArrayClient.class,
        StringLiteralClient.class,
        IntLiteralClient.class,
        FloatLiteralClient.class,
        BooleanLiteralClient.class,
        UnionStringLiteralClient.class,
        UnionIntLiteralClient.class,
        UnionFloatLiteralClient.class,
        UnionEnumValueClient.class })
public final class ValueTypesClientBuilder
    implements HttpTrait<ValueTypesClientBuilder>, ProxyTrait<ValueTypesClientBuilder>,
    ConfigurationTrait<ValueTypesClientBuilder>, EndpointTrait<ValueTypesClientBuilder> {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_NAME = "name";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_VERSION = "version";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final Map<String, String> PROPERTIES
        = CoreUtils.getProperties("type-property-valuetypes.properties");

    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the ValueTypesClientBuilder.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ValueTypesClientBuilder() {
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
    public ValueTypesClientBuilder httpClient(HttpClient httpClient) {
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
    public ValueTypesClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public ValueTypesClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public ValueTypesClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public ValueTypesClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public ValueTypesClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public ValueTypesClientBuilder configuration(Configuration configuration) {
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
    public ValueTypesClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of ValueTypesClientImpl with the provided parameters.
     * 
     * @return an instance of ValueTypesClientImpl.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private ValueTypesClientImpl buildInnerClient() {
        this.validateClient();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        ValueTypesClientImpl client = new ValueTypesClientImpl(createHttpPipeline(), localEndpoint);
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
     * Builds an instance of BooleanOperationClient class.
     * 
     * @return an instance of BooleanOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BooleanOperationClient buildBooleanOperationClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new BooleanOperationClient(buildInnerClient().getBooleanOperations(), instrumentation);
    }

    /**
     * Builds an instance of StringOperationClient class.
     * 
     * @return an instance of StringOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public StringOperationClient buildStringOperationClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new StringOperationClient(buildInnerClient().getStringOperations(), instrumentation);
    }

    /**
     * Builds an instance of BytesClient class.
     * 
     * @return an instance of BytesClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BytesClient buildBytesClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new BytesClient(buildInnerClient().getBytes(), instrumentation);
    }

    /**
     * Builds an instance of IntClient class.
     * 
     * @return an instance of IntClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IntClient buildIntClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new IntClient(buildInnerClient().getInts(), instrumentation);
    }

    /**
     * Builds an instance of FloatOperationClient class.
     * 
     * @return an instance of FloatOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FloatOperationClient buildFloatOperationClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new FloatOperationClient(buildInnerClient().getFloatOperations(), instrumentation);
    }

    /**
     * Builds an instance of DecimalClient class.
     * 
     * @return an instance of DecimalClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DecimalClient buildDecimalClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new DecimalClient(buildInnerClient().getDecimals(), instrumentation);
    }

    /**
     * Builds an instance of Decimal128Client class.
     * 
     * @return an instance of Decimal128Client.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Decimal128Client buildDecimal128Client() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new Decimal128Client(buildInnerClient().getDecimal128s(), instrumentation);
    }

    /**
     * Builds an instance of DatetimeOperationClient class.
     * 
     * @return an instance of DatetimeOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DatetimeOperationClient buildDatetimeOperationClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new DatetimeOperationClient(buildInnerClient().getDatetimeOperations(), instrumentation);
    }

    /**
     * Builds an instance of DurationOperationClient class.
     * 
     * @return an instance of DurationOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DurationOperationClient buildDurationOperationClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new DurationOperationClient(buildInnerClient().getDurationOperations(), instrumentation);
    }

    /**
     * Builds an instance of EnumClient class.
     * 
     * @return an instance of EnumClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public EnumClient buildEnumClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new EnumClient(buildInnerClient().getEnums(), instrumentation);
    }

    /**
     * Builds an instance of ExtensibleEnumClient class.
     * 
     * @return an instance of ExtensibleEnumClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtensibleEnumClient buildExtensibleEnumClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ExtensibleEnumClient(buildInnerClient().getExtensibleEnums(), instrumentation);
    }

    /**
     * Builds an instance of ModelClient class.
     * 
     * @return an instance of ModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelClient buildModelClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new ModelClient(buildInnerClient().getModels(), instrumentation);
    }

    /**
     * Builds an instance of CollectionsStringClient class.
     * 
     * @return an instance of CollectionsStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CollectionsStringClient buildCollectionsStringClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new CollectionsStringClient(buildInnerClient().getCollectionsStrings(), instrumentation);
    }

    /**
     * Builds an instance of CollectionsIntClient class.
     * 
     * @return an instance of CollectionsIntClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CollectionsIntClient buildCollectionsIntClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new CollectionsIntClient(buildInnerClient().getCollectionsInts(), instrumentation);
    }

    /**
     * Builds an instance of CollectionsModelClient class.
     * 
     * @return an instance of CollectionsModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CollectionsModelClient buildCollectionsModelClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new CollectionsModelClient(buildInnerClient().getCollectionsModels(), instrumentation);
    }

    /**
     * Builds an instance of DictionaryStringClient class.
     * 
     * @return an instance of DictionaryStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DictionaryStringClient buildDictionaryStringClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new DictionaryStringClient(buildInnerClient().getDictionaryStrings(), instrumentation);
    }

    /**
     * Builds an instance of NeverClient class.
     * 
     * @return an instance of NeverClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public NeverClient buildNeverClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new NeverClient(buildInnerClient().getNevers(), instrumentation);
    }

    /**
     * Builds an instance of UnknownStringClient class.
     * 
     * @return an instance of UnknownStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnknownStringClient buildUnknownStringClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new UnknownStringClient(buildInnerClient().getUnknownStrings(), instrumentation);
    }

    /**
     * Builds an instance of UnknownIntClient class.
     * 
     * @return an instance of UnknownIntClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnknownIntClient buildUnknownIntClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new UnknownIntClient(buildInnerClient().getUnknownInts(), instrumentation);
    }

    /**
     * Builds an instance of UnknownDictClient class.
     * 
     * @return an instance of UnknownDictClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnknownDictClient buildUnknownDictClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new UnknownDictClient(buildInnerClient().getUnknownDicts(), instrumentation);
    }

    /**
     * Builds an instance of UnknownArrayClient class.
     * 
     * @return an instance of UnknownArrayClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnknownArrayClient buildUnknownArrayClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new UnknownArrayClient(buildInnerClient().getUnknownArrays(), instrumentation);
    }

    /**
     * Builds an instance of StringLiteralClient class.
     * 
     * @return an instance of StringLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public StringLiteralClient buildStringLiteralClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new StringLiteralClient(buildInnerClient().getStringLiterals(), instrumentation);
    }

    /**
     * Builds an instance of IntLiteralClient class.
     * 
     * @return an instance of IntLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IntLiteralClient buildIntLiteralClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new IntLiteralClient(buildInnerClient().getIntLiterals(), instrumentation);
    }

    /**
     * Builds an instance of FloatLiteralClient class.
     * 
     * @return an instance of FloatLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FloatLiteralClient buildFloatLiteralClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new FloatLiteralClient(buildInnerClient().getFloatLiterals(), instrumentation);
    }

    /**
     * Builds an instance of BooleanLiteralClient class.
     * 
     * @return an instance of BooleanLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BooleanLiteralClient buildBooleanLiteralClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new BooleanLiteralClient(buildInnerClient().getBooleanLiterals(), instrumentation);
    }

    /**
     * Builds an instance of UnionStringLiteralClient class.
     * 
     * @return an instance of UnionStringLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionStringLiteralClient buildUnionStringLiteralClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new UnionStringLiteralClient(buildInnerClient().getUnionStringLiterals(), instrumentation);
    }

    /**
     * Builds an instance of UnionIntLiteralClient class.
     * 
     * @return an instance of UnionIntLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionIntLiteralClient buildUnionIntLiteralClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new UnionIntLiteralClient(buildInnerClient().getUnionIntLiterals(), instrumentation);
    }

    /**
     * Builds an instance of UnionFloatLiteralClient class.
     * 
     * @return an instance of UnionFloatLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionFloatLiteralClient buildUnionFloatLiteralClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new UnionFloatLiteralClient(buildInnerClient().getUnionFloatLiterals(), instrumentation);
    }

    /**
     * Builds an instance of UnionEnumValueClient class.
     * 
     * @return an instance of UnionEnumValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionEnumValueClient buildUnionEnumValueClient() {
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION));
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        return new UnionEnumValueClient(buildInnerClient().getUnionEnumValues(), instrumentation);
    }
}
