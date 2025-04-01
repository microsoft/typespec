package type.scalar;

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
    @Metadata(generated = true)
    private static final String SDK_NAME = "name";

    @Metadata(generated = true)
    private static final String SDK_VERSION = "version";

    @Metadata(generated = true)
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the ScalarClientBuilder.
     */
    @Metadata(generated = true)
    public ScalarClientBuilder() {
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
    public ScalarClientBuilder httpPipeline(HttpPipeline pipeline) {
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
    public ScalarClientBuilder httpClient(HttpClient httpClient) {
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
    public ScalarClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public ScalarClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public ScalarClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public ScalarClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public ScalarClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public ScalarClientBuilder configuration(Configuration configuration) {
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
    public ScalarClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of ScalarClientImpl with the provided parameters.
     * 
     * @return an instance of ScalarClientImpl.
     */
    @Metadata(generated = true)
    private ScalarClientImpl buildInnerClient() {
        this.validateClient();
        HttpPipeline localPipeline = (pipeline != null) ? pipeline : createHttpPipeline();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        ScalarClientImpl client = new ScalarClientImpl(localPipeline, localEndpoint);
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
     * Builds an instance of BooleanOperationClient class.
     * 
     * @return an instance of BooleanOperationClient.
     */
    @Metadata(generated = true)
    public BooleanOperationClient buildBooleanOperationClient() {
        return new BooleanOperationClient(buildInnerClient().getBooleanOperations());
    }

    /**
     * Builds an instance of UnknownClient class.
     * 
     * @return an instance of UnknownClient.
     */
    @Metadata(generated = true)
    public UnknownClient buildUnknownClient() {
        return new UnknownClient(buildInnerClient().getUnknowns());
    }

    /**
     * Builds an instance of DecimalTypeClient class.
     * 
     * @return an instance of DecimalTypeClient.
     */
    @Metadata(generated = true)
    public DecimalTypeClient buildDecimalTypeClient() {
        return new DecimalTypeClient(buildInnerClient().getDecimalTypes());
    }

    /**
     * Builds an instance of Decimal128TypeClient class.
     * 
     * @return an instance of Decimal128TypeClient.
     */
    @Metadata(generated = true)
    public Decimal128TypeClient buildDecimal128TypeClient() {
        return new Decimal128TypeClient(buildInnerClient().getDecimal128Types());
    }

    /**
     * Builds an instance of DecimalVerifyClient class.
     * 
     * @return an instance of DecimalVerifyClient.
     */
    @Metadata(generated = true)
    public DecimalVerifyClient buildDecimalVerifyClient() {
        return new DecimalVerifyClient(buildInnerClient().getDecimalVerifies());
    }

    /**
     * Builds an instance of Decimal128VerifyClient class.
     * 
     * @return an instance of Decimal128VerifyClient.
     */
    @Metadata(generated = true)
    public Decimal128VerifyClient buildDecimal128VerifyClient() {
        return new Decimal128VerifyClient(buildInnerClient().getDecimal128Verifies());
    }

    private static final ClientLogger LOGGER = new ClientLogger(ScalarClientBuilder.class);
}
