package type.scalar;

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
import io.clientcore.core.traits.ConfigurationTrait;
import io.clientcore.core.traits.EndpointTrait;
import io.clientcore.core.traits.HttpTrait;
import io.clientcore.core.traits.ProxyTrait;
import io.clientcore.core.utils.configuration.Configuration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import type.scalar.implementation.ScalarClientImpl;

/**
 * A builder for creating a new instance of the ScalarClient type.
 */
@ServiceClientBuilder(
    serviceClients = {
        StringOperationClient.class,
        BooleanOperationClient.class,
        UnknownClient.class,
        DecimalTypeClient.class,
        Decimal128TypeClient.class,
        DecimalVerifyClient.class,
        Decimal128VerifyClient.class })
public final class ScalarClientBuilder implements HttpTrait<ScalarClientBuilder>, ProxyTrait<ScalarClientBuilder>,
    ConfigurationTrait<ScalarClientBuilder>, EndpointTrait<ScalarClientBuilder> {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_NAME = "name";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_VERSION = "version";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the ScalarClientBuilder.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ScalarClientBuilder() {
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
    public ScalarClientBuilder httpClient(HttpClient httpClient) {
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
    public ScalarClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public ScalarClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public ScalarClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public ScalarClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public ScalarClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public ScalarClientBuilder configuration(Configuration configuration) {
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
    public ScalarClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of ScalarClientImpl with the provided parameters.
     * 
     * @return an instance of ScalarClientImpl.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private ScalarClientImpl buildInnerClient() {
        this.validateClient();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        ScalarClientImpl client = new ScalarClientImpl(createHttpPipeline(), localEndpoint);
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
        return new StringOperationClient(buildInnerClient().getStringOperations());
    }

    /**
     * Builds an instance of BooleanOperationClient class.
     * 
     * @return an instance of BooleanOperationClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public BooleanOperationClient buildBooleanOperationClient() {
        return new BooleanOperationClient(buildInnerClient().getBooleanOperations());
    }

    /**
     * Builds an instance of UnknownClient class.
     * 
     * @return an instance of UnknownClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public UnknownClient buildUnknownClient() {
        return new UnknownClient(buildInnerClient().getUnknowns());
    }

    /**
     * Builds an instance of DecimalTypeClient class.
     * 
     * @return an instance of DecimalTypeClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DecimalTypeClient buildDecimalTypeClient() {
        return new DecimalTypeClient(buildInnerClient().getDecimalTypes());
    }

    /**
     * Builds an instance of Decimal128TypeClient class.
     * 
     * @return an instance of Decimal128TypeClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Decimal128TypeClient buildDecimal128TypeClient() {
        return new Decimal128TypeClient(buildInnerClient().getDecimal128Types());
    }

    /**
     * Builds an instance of DecimalVerifyClient class.
     * 
     * @return an instance of DecimalVerifyClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DecimalVerifyClient buildDecimalVerifyClient() {
        return new DecimalVerifyClient(buildInnerClient().getDecimalVerifies());
    }

    /**
     * Builds an instance of Decimal128VerifyClient class.
     * 
     * @return an instance of Decimal128VerifyClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public Decimal128VerifyClient buildDecimal128VerifyClient() {
        return new Decimal128VerifyClient(buildInnerClient().getDecimal128Verifies());
    }
}
