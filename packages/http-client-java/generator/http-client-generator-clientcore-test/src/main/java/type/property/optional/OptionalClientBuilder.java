package type.property.optional;

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
import type.property.optional.implementation.OptionalClientImpl;

/**
 * A builder for creating a new instance of the OptionalClient type.
 */
@ServiceClientBuilder(
    serviceClients = {
        StringOperationClient.class,
        BytesClient.class,
        DatetimeOperationClient.class,
        DurationOperationClient.class,
        PlainDateClient.class,
        PlainTimeClient.class,
        CollectionsByteClient.class,
        CollectionsModelClient.class,
        StringLiteralClient.class,
        IntLiteralClient.class,
        FloatLiteralClient.class,
        BooleanLiteralClient.class,
        UnionStringLiteralClient.class,
        UnionIntLiteralClient.class,
        UnionFloatLiteralClient.class,
        RequiredAndOptionalClient.class })
public final class OptionalClientBuilder implements HttpTrait<OptionalClientBuilder>, ProxyTrait<OptionalClientBuilder>,
    ConfigurationTrait<OptionalClientBuilder>, EndpointTrait<OptionalClientBuilder> {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_NAME = "name";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_VERSION = "version";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final Map<String, String> PROPERTIES = CoreUtils.getProperties("type-property-optional.properties");

    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the OptionalClientBuilder.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public OptionalClientBuilder() {
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
    public OptionalClientBuilder httpClient(HttpClient httpClient) {
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
    public OptionalClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public OptionalClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public OptionalClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public OptionalClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public OptionalClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public OptionalClientBuilder configuration(Configuration configuration) {
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
    public OptionalClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of OptionalClientImpl with the provided parameters.
     * 
     * @return an instance of OptionalClientImpl.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private OptionalClientImpl buildInnerClient() {
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
        OptionalClientImpl client = new OptionalClientImpl(createHttpPipeline(), instrumentation, localEndpoint);
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
     * Builds an instance of StringOperationClient class.
     * 
     * @return an instance of StringOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public StringOperationClient buildStringOperationClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new StringOperationClient(innerClient.getStringOperations(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of BytesClient class.
     * 
     * @return an instance of BytesClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BytesClient buildBytesClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new BytesClient(innerClient.getBytes(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of DatetimeOperationClient class.
     * 
     * @return an instance of DatetimeOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DatetimeOperationClient buildDatetimeOperationClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new DatetimeOperationClient(innerClient.getDatetimeOperations(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of DurationOperationClient class.
     * 
     * @return an instance of DurationOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DurationOperationClient buildDurationOperationClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new DurationOperationClient(innerClient.getDurationOperations(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of PlainDateClient class.
     * 
     * @return an instance of PlainDateClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PlainDateClient buildPlainDateClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new PlainDateClient(innerClient.getPlainDates(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of PlainTimeClient class.
     * 
     * @return an instance of PlainTimeClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PlainTimeClient buildPlainTimeClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new PlainTimeClient(innerClient.getPlainTimes(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of CollectionsByteClient class.
     * 
     * @return an instance of CollectionsByteClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CollectionsByteClient buildCollectionsByteClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new CollectionsByteClient(innerClient.getCollectionsBytes(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of CollectionsModelClient class.
     * 
     * @return an instance of CollectionsModelClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CollectionsModelClient buildCollectionsModelClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new CollectionsModelClient(innerClient.getCollectionsModels(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of StringLiteralClient class.
     * 
     * @return an instance of StringLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public StringLiteralClient buildStringLiteralClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new StringLiteralClient(innerClient.getStringLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of IntLiteralClient class.
     * 
     * @return an instance of IntLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public IntLiteralClient buildIntLiteralClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new IntLiteralClient(innerClient.getIntLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of FloatLiteralClient class.
     * 
     * @return an instance of FloatLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FloatLiteralClient buildFloatLiteralClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new FloatLiteralClient(innerClient.getFloatLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of BooleanLiteralClient class.
     * 
     * @return an instance of BooleanLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BooleanLiteralClient buildBooleanLiteralClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new BooleanLiteralClient(innerClient.getBooleanLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of UnionStringLiteralClient class.
     * 
     * @return an instance of UnionStringLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionStringLiteralClient buildUnionStringLiteralClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new UnionStringLiteralClient(innerClient.getUnionStringLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of UnionIntLiteralClient class.
     * 
     * @return an instance of UnionIntLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionIntLiteralClient buildUnionIntLiteralClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new UnionIntLiteralClient(innerClient.getUnionIntLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of UnionFloatLiteralClient class.
     * 
     * @return an instance of UnionFloatLiteralClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnionFloatLiteralClient buildUnionFloatLiteralClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new UnionFloatLiteralClient(innerClient.getUnionFloatLiterals(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of RequiredAndOptionalClient class.
     * 
     * @return an instance of RequiredAndOptionalClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public RequiredAndOptionalClient buildRequiredAndOptionalClient() {
        OptionalClientImpl innerClient = buildInnerClient();
        return new RequiredAndOptionalClient(innerClient.getRequiredAndOptionals(), innerClient.getInstrumentation());
    }
}
