package type.union;

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
import type.union.implementation.UnionClientImpl;

/**
 * A builder for creating a new instance of the UnionClient type.
 */
@ServiceClientBuilder(
    serviceClients = {
        StringsOnlyClient.class,
        StringExtensibleClient.class,
        StringExtensibleNamedClient.class,
        IntsOnlyClient.class,
        FloatsOnlyClient.class,
        ModelsOnlyClient.class,
        EnumsOnlyClient.class,
        StringAndArrayClient.class,
        MixedLiteralsClient.class,
        MixedTypesClient.class })
public final class UnionClientBuilder implements HttpTrait<UnionClientBuilder>, ProxyTrait<UnionClientBuilder>,
    ConfigurationTrait<UnionClientBuilder>, EndpointTrait<UnionClientBuilder> {
    @Metadata(generated = true)
    private static final String SDK_NAME = "name";

    @Metadata(generated = true)
    private static final String SDK_VERSION = "version";

    @Metadata(generated = true)
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the UnionClientBuilder.
     */
    @Metadata(generated = true)
    public UnionClientBuilder() {
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
    public UnionClientBuilder httpPipeline(HttpPipeline pipeline) {
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
    public UnionClientBuilder httpClient(HttpClient httpClient) {
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
    public UnionClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public UnionClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public UnionClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public UnionClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public UnionClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public UnionClientBuilder configuration(Configuration configuration) {
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
    public UnionClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of UnionClientImpl with the provided parameters.
     * 
     * @return an instance of UnionClientImpl.
     */
    @Metadata(generated = true)
    private UnionClientImpl buildInnerClient() {
        this.validateClient();
        HttpPipeline localPipeline = (pipeline != null) ? pipeline : createHttpPipeline();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        UnionClientImpl client = new UnionClientImpl(localPipeline, localEndpoint);
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
     * Builds an instance of StringsOnlyClient class.
     * 
     * @return an instance of StringsOnlyClient.
     */
    @Metadata(generated = true)
    public StringsOnlyClient buildStringsOnlyClient() {
        return new StringsOnlyClient(buildInnerClient().getStringsOnlies());
    }

    /**
     * Builds an instance of StringExtensibleClient class.
     * 
     * @return an instance of StringExtensibleClient.
     */
    @Metadata(generated = true)
    public StringExtensibleClient buildStringExtensibleClient() {
        return new StringExtensibleClient(buildInnerClient().getStringExtensibles());
    }

    /**
     * Builds an instance of StringExtensibleNamedClient class.
     * 
     * @return an instance of StringExtensibleNamedClient.
     */
    @Metadata(generated = true)
    public StringExtensibleNamedClient buildStringExtensibleNamedClient() {
        return new StringExtensibleNamedClient(buildInnerClient().getStringExtensibleNameds());
    }

    /**
     * Builds an instance of IntsOnlyClient class.
     * 
     * @return an instance of IntsOnlyClient.
     */
    @Metadata(generated = true)
    public IntsOnlyClient buildIntsOnlyClient() {
        return new IntsOnlyClient(buildInnerClient().getIntsOnlies());
    }

    /**
     * Builds an instance of FloatsOnlyClient class.
     * 
     * @return an instance of FloatsOnlyClient.
     */
    @Metadata(generated = true)
    public FloatsOnlyClient buildFloatsOnlyClient() {
        return new FloatsOnlyClient(buildInnerClient().getFloatsOnlies());
    }

    /**
     * Builds an instance of ModelsOnlyClient class.
     * 
     * @return an instance of ModelsOnlyClient.
     */
    @Metadata(generated = true)
    public ModelsOnlyClient buildModelsOnlyClient() {
        return new ModelsOnlyClient(buildInnerClient().getModelsOnlies());
    }

    /**
     * Builds an instance of EnumsOnlyClient class.
     * 
     * @return an instance of EnumsOnlyClient.
     */
    @Metadata(generated = true)
    public EnumsOnlyClient buildEnumsOnlyClient() {
        return new EnumsOnlyClient(buildInnerClient().getEnumsOnlies());
    }

    /**
     * Builds an instance of StringAndArrayClient class.
     * 
     * @return an instance of StringAndArrayClient.
     */
    @Metadata(generated = true)
    public StringAndArrayClient buildStringAndArrayClient() {
        return new StringAndArrayClient(buildInnerClient().getStringAndArrays());
    }

    /**
     * Builds an instance of MixedLiteralsClient class.
     * 
     * @return an instance of MixedLiteralsClient.
     */
    @Metadata(generated = true)
    public MixedLiteralsClient buildMixedLiteralsClient() {
        return new MixedLiteralsClient(buildInnerClient().getMixedLiterals());
    }

    /**
     * Builds an instance of MixedTypesClient class.
     * 
     * @return an instance of MixedTypesClient.
     */
    @Metadata(generated = true)
    public MixedTypesClient buildMixedTypesClient() {
        return new MixedTypesClient(buildInnerClient().getMixedTypes());
    }

    private static final ClientLogger LOGGER = new ClientLogger(UnionClientBuilder.class);
}
