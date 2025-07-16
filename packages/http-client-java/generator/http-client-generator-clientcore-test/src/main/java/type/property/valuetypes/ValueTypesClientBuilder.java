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
        HttpInstrumentationOptions localHttpInstrumentationOptions = this.httpInstrumentationOptions == null
            ? new HttpInstrumentationOptions()
            : this.httpInstrumentationOptions;
        SdkInstrumentationOptions sdkInstrumentationOptions
            = new SdkInstrumentationOptions(PROPERTIES.getOrDefault(SDK_NAME, "UnknownName"))
                .setSdkVersion(PROPERTIES.get(SDK_VERSION))
                .setEndpoint(localEndpoint);
        Instrumentation instrumentation
            = Instrumentation.create(localHttpInstrumentationOptions, sdkInstrumentationOptions);
        ValueTypesClientImpl client = new ValueTypesClientImpl(createHttpPipeline(), instrumentation, localEndpoint);
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
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new BooleanOperationClient(innerClient.getBooleanOperations(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of StringOperationClient class.
     * 
     * @return an instance of StringOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public StringOperationClient buildStringOperationClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new StringOperationClient(innerClient.getStringOperations(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of BytesClient class.
     * 
     * @return an instance of BytesClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BytesClient buildBytesClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new BytesClient(innerClient.getBytes(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of IntClient class.
     * 
     * @return an instance of IntClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IntClient buildIntClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new IntClient(innerClient.getInts(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of FloatOperationClient class.
     * 
     * @return an instance of FloatOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FloatOperationClient buildFloatOperationClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new FloatOperationClient(innerClient.getFloatOperations(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of DecimalClient class.
     * 
     * @return an instance of DecimalClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DecimalClient buildDecimalClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new DecimalClient(innerClient.getDecimals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of Decimal128Client class.
     * 
     * @return an instance of Decimal128Client.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Decimal128Client buildDecimal128Client() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new Decimal128Client(innerClient.getDecimal128s(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of DatetimeOperationClient class.
     * 
     * @return an instance of DatetimeOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DatetimeOperationClient buildDatetimeOperationClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new DatetimeOperationClient(innerClient.getDatetimeOperations(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of DurationOperationClient class.
     * 
     * @return an instance of DurationOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DurationOperationClient buildDurationOperationClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new DurationOperationClient(innerClient.getDurationOperations(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of EnumClient class.
     * 
     * @return an instance of EnumClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public EnumClient buildEnumClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new EnumClient(innerClient.getEnums(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of ExtensibleEnumClient class.
     * 
     * @return an instance of ExtensibleEnumClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ExtensibleEnumClient buildExtensibleEnumClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new ExtensibleEnumClient(innerClient.getExtensibleEnums(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of ModelClient class.
     * 
     * @return an instance of ModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelClient buildModelClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new ModelClient(innerClient.getModels(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of CollectionsStringClient class.
     * 
     * @return an instance of CollectionsStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CollectionsStringClient buildCollectionsStringClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new CollectionsStringClient(innerClient.getCollectionsStrings(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of CollectionsIntClient class.
     * 
     * @return an instance of CollectionsIntClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CollectionsIntClient buildCollectionsIntClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new CollectionsIntClient(innerClient.getCollectionsInts(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of CollectionsModelClient class.
     * 
     * @return an instance of CollectionsModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CollectionsModelClient buildCollectionsModelClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new CollectionsModelClient(innerClient.getCollectionsModels(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of DictionaryStringClient class.
     * 
     * @return an instance of DictionaryStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DictionaryStringClient buildDictionaryStringClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new DictionaryStringClient(innerClient.getDictionaryStrings(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of NeverClient class.
     * 
     * @return an instance of NeverClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public NeverClient buildNeverClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new NeverClient(innerClient.getNevers(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of UnknownStringClient class.
     * 
     * @return an instance of UnknownStringClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnknownStringClient buildUnknownStringClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new UnknownStringClient(innerClient.getUnknownStrings(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of UnknownIntClient class.
     * 
     * @return an instance of UnknownIntClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnknownIntClient buildUnknownIntClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new UnknownIntClient(innerClient.getUnknownInts(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of UnknownDictClient class.
     * 
     * @return an instance of UnknownDictClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnknownDictClient buildUnknownDictClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new UnknownDictClient(innerClient.getUnknownDicts(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of UnknownArrayClient class.
     * 
     * @return an instance of UnknownArrayClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnknownArrayClient buildUnknownArrayClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new UnknownArrayClient(innerClient.getUnknownArrays(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of StringLiteralClient class.
     * 
     * @return an instance of StringLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public StringLiteralClient buildStringLiteralClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new StringLiteralClient(innerClient.getStringLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of IntLiteralClient class.
     * 
     * @return an instance of IntLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IntLiteralClient buildIntLiteralClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new IntLiteralClient(innerClient.getIntLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of FloatLiteralClient class.
     * 
     * @return an instance of FloatLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FloatLiteralClient buildFloatLiteralClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new FloatLiteralClient(innerClient.getFloatLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of BooleanLiteralClient class.
     * 
     * @return an instance of BooleanLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BooleanLiteralClient buildBooleanLiteralClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new BooleanLiteralClient(innerClient.getBooleanLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of UnionStringLiteralClient class.
     * 
     * @return an instance of UnionStringLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionStringLiteralClient buildUnionStringLiteralClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new UnionStringLiteralClient(innerClient.getUnionStringLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of UnionIntLiteralClient class.
     * 
     * @return an instance of UnionIntLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionIntLiteralClient buildUnionIntLiteralClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new UnionIntLiteralClient(innerClient.getUnionIntLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of UnionFloatLiteralClient class.
     * 
     * @return an instance of UnionFloatLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionFloatLiteralClient buildUnionFloatLiteralClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new UnionFloatLiteralClient(innerClient.getUnionFloatLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of UnionEnumValueClient class.
     * 
     * @return an instance of UnionEnumValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionEnumValueClient buildUnionEnumValueClient() {
        ValueTypesClientImpl innerClient = buildInnerClient();
        return new UnionEnumValueClient(innerClient.getUnionEnumValues(), innerClient.getInstrumentation());
    }
}
