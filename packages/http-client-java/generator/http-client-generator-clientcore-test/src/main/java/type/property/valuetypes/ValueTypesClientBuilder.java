package type.property.valuetypes;

import io.clientcore.core.annotations.Metadata;
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
import io.clientcore.core.instrumentation.logging.ClientLogger;
import io.clientcore.core.traits.ConfigurationTrait;
import io.clientcore.core.traits.EndpointTrait;
import io.clientcore.core.traits.HttpTrait;
import io.clientcore.core.traits.ProxyTrait;
import io.clientcore.core.utils.configuration.Configuration;
import java.util.ArrayList;
import java.util.List;
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
    @Metadata(generated = true)
    private static final String SDK_NAME = "name";

    @Metadata(generated = true)
    private static final String SDK_VERSION = "version";

    @Metadata(generated = true)
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the ValueTypesClientBuilder.
     */
    @Metadata(generated = true)
    public ValueTypesClientBuilder() {
        this.pipelinePolicies = new ArrayList<>();
    }

    /*
     * The HTTP pipeline to send requests through.
     */
    @Metadata(generated = true)
    private HttpPipeline pipeline;

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public ValueTypesClientBuilder httpPipeline(HttpPipeline pipeline) {
        if (this.pipeline != null && pipeline == null) {
            LOGGER.atInfo().log("HttpPipeline is being set to 'null' when it was previously configured.");
        }
        this.pipeline = pipeline;
        return this;
    }

    /*
     * The HTTP client used to send the request.
     */
    @Metadata(generated = true)
    private HttpClient httpClient;

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public ValueTypesClientBuilder httpClient(HttpClient httpClient) {
        this.httpClient = httpClient;
        return this;
    }

    /*
     * The logging configuration for HTTP requests and responses.
     */
    @Metadata(generated = true)
    private HttpInstrumentationOptions httpInstrumentationOptions;

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public ValueTypesClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
        this.httpInstrumentationOptions = httpInstrumentationOptions;
        return this;
    }

    /*
     * The retry options to configure retry policy for failed requests.
     */
    @Metadata(generated = true)
    private HttpRetryOptions retryOptions;

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public ValueTypesClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public ValueTypesClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
        Objects.requireNonNull(customPolicy, "'customPolicy' cannot be null.");
        pipelinePolicies.add(customPolicy);
        return this;
    }

    /*
     * The redirect options to configure redirect policy
     */
    @Metadata(generated = true)
    private HttpRedirectOptions redirectOptions;

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public ValueTypesClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
        this.redirectOptions = redirectOptions;
        return this;
    }

    /*
     * The proxy options used during construction of the service client.
     */
    @Metadata(generated = true)
    private ProxyOptions proxyOptions;

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public ValueTypesClientBuilder proxyOptions(ProxyOptions proxyOptions) {
        this.proxyOptions = proxyOptions;
        return this;
    }

    /*
     * The configuration store that is used during construction of the service client.
     */
    @Metadata(generated = true)
    private Configuration configuration;

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public ValueTypesClientBuilder configuration(Configuration configuration) {
        this.configuration = configuration;
        return this;
    }

    /*
     * The service endpoint
     */
    @Metadata(generated = true)
    private String endpoint;

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
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
    @Metadata(generated = true)
    private ValueTypesClientImpl buildInnerClient() {
        this.validateClient();
        HttpPipeline localPipeline = (pipeline != null) ? pipeline : createHttpPipeline();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        ValueTypesClientImpl client = new ValueTypesClientImpl(localPipeline, localEndpoint);
        return client;
    }

    @Metadata(generated = true)
    private void validateClient() {
        // This method is invoked from 'buildInnerClient'/'buildClient' method.
        // Developer can customize this method, to validate that the necessary conditions are met for the new client.
    }

    @Metadata(generated = true)
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
        return httpPipelineBuilder.build();
    }

    /**
     * Builds an instance of BooleanOperationClient class.
     * 
     * @return an instance of BooleanOperationClient.
     */
    @Metadata(generated = true)
    public BooleanOperationClient buildBooleanOperationClient() {
        return new BooleanOperationClient(buildInnerClient().getBooleanOperations());
    }

    /**
     * Builds an instance of StringOperationClient class.
     * 
     * @return an instance of StringOperationClient.
     */
    @Metadata(generated = true)
    public StringOperationClient buildStringOperationClient() {
        return new StringOperationClient(buildInnerClient().getStringOperations());
    }

    /**
     * Builds an instance of BytesClient class.
     * 
     * @return an instance of BytesClient.
     */
    @Metadata(generated = true)
    public BytesClient buildBytesClient() {
        return new BytesClient(buildInnerClient().getBytes());
    }

    /**
     * Builds an instance of IntClient class.
     * 
     * @return an instance of IntClient.
     */
    @Metadata(generated = true)
    public IntClient buildIntClient() {
        return new IntClient(buildInnerClient().getInts());
    }

    /**
     * Builds an instance of FloatOperationClient class.
     * 
     * @return an instance of FloatOperationClient.
     */
    @Metadata(generated = true)
    public FloatOperationClient buildFloatOperationClient() {
        return new FloatOperationClient(buildInnerClient().getFloatOperations());
    }

    /**
     * Builds an instance of DecimalClient class.
     * 
     * @return an instance of DecimalClient.
     */
    @Metadata(generated = true)
    public DecimalClient buildDecimalClient() {
        return new DecimalClient(buildInnerClient().getDecimals());
    }

    /**
     * Builds an instance of Decimal128Client class.
     * 
     * @return an instance of Decimal128Client.
     */
    @Metadata(generated = true)
    public Decimal128Client buildDecimal128Client() {
        return new Decimal128Client(buildInnerClient().getDecimal128s());
    }

    /**
     * Builds an instance of DatetimeOperationClient class.
     * 
     * @return an instance of DatetimeOperationClient.
     */
    @Metadata(generated = true)
    public DatetimeOperationClient buildDatetimeOperationClient() {
        return new DatetimeOperationClient(buildInnerClient().getDatetimeOperations());
    }

    /**
     * Builds an instance of DurationOperationClient class.
     * 
     * @return an instance of DurationOperationClient.
     */
    @Metadata(generated = true)
    public DurationOperationClient buildDurationOperationClient() {
        return new DurationOperationClient(buildInnerClient().getDurationOperations());
    }

    /**
     * Builds an instance of EnumClient class.
     * 
     * @return an instance of EnumClient.
     */
    @Metadata(generated = true)
    public EnumClient buildEnumClient() {
        return new EnumClient(buildInnerClient().getEnums());
    }

    /**
     * Builds an instance of ExtensibleEnumClient class.
     * 
     * @return an instance of ExtensibleEnumClient.
     */
    @Metadata(generated = true)
    public ExtensibleEnumClient buildExtensibleEnumClient() {
        return new ExtensibleEnumClient(buildInnerClient().getExtensibleEnums());
    }

    /**
     * Builds an instance of ModelClient class.
     * 
     * @return an instance of ModelClient.
     */
    @Metadata(generated = true)
    public ModelClient buildModelClient() {
        return new ModelClient(buildInnerClient().getModels());
    }

    /**
     * Builds an instance of CollectionsStringClient class.
     * 
     * @return an instance of CollectionsStringClient.
     */
    @Metadata(generated = true)
    public CollectionsStringClient buildCollectionsStringClient() {
        return new CollectionsStringClient(buildInnerClient().getCollectionsStrings());
    }

    /**
     * Builds an instance of CollectionsIntClient class.
     * 
     * @return an instance of CollectionsIntClient.
     */
    @Metadata(generated = true)
    public CollectionsIntClient buildCollectionsIntClient() {
        return new CollectionsIntClient(buildInnerClient().getCollectionsInts());
    }

    /**
     * Builds an instance of CollectionsModelClient class.
     * 
     * @return an instance of CollectionsModelClient.
     */
    @Metadata(generated = true)
    public CollectionsModelClient buildCollectionsModelClient() {
        return new CollectionsModelClient(buildInnerClient().getCollectionsModels());
    }

    /**
     * Builds an instance of DictionaryStringClient class.
     * 
     * @return an instance of DictionaryStringClient.
     */
    @Metadata(generated = true)
    public DictionaryStringClient buildDictionaryStringClient() {
        return new DictionaryStringClient(buildInnerClient().getDictionaryStrings());
    }

    /**
     * Builds an instance of NeverClient class.
     * 
     * @return an instance of NeverClient.
     */
    @Metadata(generated = true)
    public NeverClient buildNeverClient() {
        return new NeverClient(buildInnerClient().getNevers());
    }

    /**
     * Builds an instance of UnknownStringClient class.
     * 
     * @return an instance of UnknownStringClient.
     */
    @Metadata(generated = true)
    public UnknownStringClient buildUnknownStringClient() {
        return new UnknownStringClient(buildInnerClient().getUnknownStrings());
    }

    /**
     * Builds an instance of UnknownIntClient class.
     * 
     * @return an instance of UnknownIntClient.
     */
    @Metadata(generated = true)
    public UnknownIntClient buildUnknownIntClient() {
        return new UnknownIntClient(buildInnerClient().getUnknownInts());
    }

    /**
     * Builds an instance of UnknownDictClient class.
     * 
     * @return an instance of UnknownDictClient.
     */
    @Metadata(generated = true)
    public UnknownDictClient buildUnknownDictClient() {
        return new UnknownDictClient(buildInnerClient().getUnknownDicts());
    }

    /**
     * Builds an instance of UnknownArrayClient class.
     * 
     * @return an instance of UnknownArrayClient.
     */
    @Metadata(generated = true)
    public UnknownArrayClient buildUnknownArrayClient() {
        return new UnknownArrayClient(buildInnerClient().getUnknownArrays());
    }

    /**
     * Builds an instance of StringLiteralClient class.
     * 
     * @return an instance of StringLiteralClient.
     */
    @Metadata(generated = true)
    public StringLiteralClient buildStringLiteralClient() {
        return new StringLiteralClient(buildInnerClient().getStringLiterals());
    }

    /**
     * Builds an instance of IntLiteralClient class.
     * 
     * @return an instance of IntLiteralClient.
     */
    @Metadata(generated = true)
    public IntLiteralClient buildIntLiteralClient() {
        return new IntLiteralClient(buildInnerClient().getIntLiterals());
    }

    /**
     * Builds an instance of FloatLiteralClient class.
     * 
     * @return an instance of FloatLiteralClient.
     */
    @Metadata(generated = true)
    public FloatLiteralClient buildFloatLiteralClient() {
        return new FloatLiteralClient(buildInnerClient().getFloatLiterals());
    }

    /**
     * Builds an instance of BooleanLiteralClient class.
     * 
     * @return an instance of BooleanLiteralClient.
     */
    @Metadata(generated = true)
    public BooleanLiteralClient buildBooleanLiteralClient() {
        return new BooleanLiteralClient(buildInnerClient().getBooleanLiterals());
    }

    /**
     * Builds an instance of UnionStringLiteralClient class.
     * 
     * @return an instance of UnionStringLiteralClient.
     */
    @Metadata(generated = true)
    public UnionStringLiteralClient buildUnionStringLiteralClient() {
        return new UnionStringLiteralClient(buildInnerClient().getUnionStringLiterals());
    }

    /**
     * Builds an instance of UnionIntLiteralClient class.
     * 
     * @return an instance of UnionIntLiteralClient.
     */
    @Metadata(generated = true)
    public UnionIntLiteralClient buildUnionIntLiteralClient() {
        return new UnionIntLiteralClient(buildInnerClient().getUnionIntLiterals());
    }

    /**
     * Builds an instance of UnionFloatLiteralClient class.
     * 
     * @return an instance of UnionFloatLiteralClient.
     */
    @Metadata(generated = true)
    public UnionFloatLiteralClient buildUnionFloatLiteralClient() {
        return new UnionFloatLiteralClient(buildInnerClient().getUnionFloatLiterals());
    }

    /**
     * Builds an instance of UnionEnumValueClient class.
     * 
     * @return an instance of UnionEnumValueClient.
     */
    @Metadata(generated = true)
    public UnionEnumValueClient buildUnionEnumValueClient() {
        return new UnionEnumValueClient(buildInnerClient().getUnionEnumValues());
    }

    private static final ClientLogger LOGGER = new ClientLogger(ValueTypesClientBuilder.class);
}
