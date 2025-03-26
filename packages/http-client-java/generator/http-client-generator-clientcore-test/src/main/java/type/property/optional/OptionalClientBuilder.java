package type.property.optional;

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
    @Metadata(generated = true)
    private static final String SDK_NAME = "name";

    @Metadata(generated = true)
    private static final String SDK_VERSION = "version";

    @Metadata(generated = true)
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the OptionalClientBuilder.
     */
    @Metadata(generated = true)
    public OptionalClientBuilder() {
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
    public OptionalClientBuilder httpPipeline(HttpPipeline pipeline) {
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
    public OptionalClientBuilder httpClient(HttpClient httpClient) {
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
    public OptionalClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public OptionalClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public OptionalClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public OptionalClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public OptionalClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public OptionalClientBuilder configuration(Configuration configuration) {
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
    public OptionalClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of OptionalClientImpl with the provided parameters.
     * 
     * @return an instance of OptionalClientImpl.
     */
    @Metadata(generated = true)
    private OptionalClientImpl buildInnerClient() {
        this.validateClient();
        HttpPipeline localPipeline = (pipeline != null) ? pipeline : createHttpPipeline();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        OptionalClientImpl client = new OptionalClientImpl(localPipeline, localEndpoint);
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
     * Builds an instance of PlainDateClient class.
     * 
     * @return an instance of PlainDateClient.
     */
    @Metadata(generated = true)
    public PlainDateClient buildPlainDateClient() {
        return new PlainDateClient(buildInnerClient().getPlainDates());
    }

    /**
     * Builds an instance of PlainTimeClient class.
     * 
     * @return an instance of PlainTimeClient.
     */
    @Metadata(generated = true)
    public PlainTimeClient buildPlainTimeClient() {
        return new PlainTimeClient(buildInnerClient().getPlainTimes());
    }

    /**
     * Builds an instance of CollectionsByteClient class.
     * 
     * @return an instance of CollectionsByteClient.
     */
    @Metadata(generated = true)
    public CollectionsByteClient buildCollectionsByteClient() {
        return new CollectionsByteClient(buildInnerClient().getCollectionsBytes());
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
     * Builds an instance of RequiredAndOptionalClient class.
     * 
     * @return an instance of RequiredAndOptionalClient.
     */
    @Metadata(generated = true)
    public RequiredAndOptionalClient buildRequiredAndOptionalClient() {
        return new RequiredAndOptionalClient(buildInnerClient().getRequiredAndOptionals());
    }

    private static final ClientLogger LOGGER = new ClientLogger(OptionalClientBuilder.class);
}
