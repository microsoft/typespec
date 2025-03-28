package versioning.removed;

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
import versioning.removed.implementation.RemovedClientImpl;

/**
 * A builder for creating a new instance of the RemovedClient type.
 */
@ServiceClientBuilder(serviceClients = { RemovedClient.class })
public final class RemovedClientBuilder implements HttpTrait<RemovedClientBuilder>, ProxyTrait<RemovedClientBuilder>,
    ConfigurationTrait<RemovedClientBuilder>, EndpointTrait<RemovedClientBuilder> {
    @Metadata(generated = true)
    private static final String SDK_NAME = "name";

    @Metadata(generated = true)
    private static final String SDK_VERSION = "version";

    @Metadata(generated = true)
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the RemovedClientBuilder.
     */
    @Metadata(generated = true)
    public RemovedClientBuilder() {
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
    public RemovedClientBuilder httpPipeline(HttpPipeline pipeline) {
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
    public RemovedClientBuilder httpClient(HttpClient httpClient) {
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
    public RemovedClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public RemovedClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public RemovedClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public RemovedClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public RemovedClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public RemovedClientBuilder configuration(Configuration configuration) {
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
    public RemovedClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /*
     * Need to be set as 'v1', 'v2preview' or 'v2' in client.
     */
    @Metadata(generated = true)
    private Versions version;

    /**
     * Sets Need to be set as 'v1', 'v2preview' or 'v2' in client.
     * 
     * @param version the version value.
     * @return the RemovedClientBuilder.
     */
    @Metadata(generated = true)
    public RemovedClientBuilder version(Versions version) {
        this.version = version;
        return this;
    }

    /*
     * Service version
     */
    @Metadata(generated = true)
    private RemovedServiceVersion serviceVersion;

    /**
     * Sets Service version.
     * 
     * @param serviceVersion the serviceVersion value.
     * @return the RemovedClientBuilder.
     */
    @Metadata(generated = true)
    public RemovedClientBuilder serviceVersion(RemovedServiceVersion serviceVersion) {
        this.serviceVersion = serviceVersion;
        return this;
    }

    /**
     * Builds an instance of RemovedClientImpl with the provided parameters.
     * 
     * @return an instance of RemovedClientImpl.
     */
    @Metadata(generated = true)
    private RemovedClientImpl buildInnerClient() {
        this.validateClient();
        HttpPipeline localPipeline = (pipeline != null) ? pipeline : createHttpPipeline();
        RemovedServiceVersion localServiceVersion
            = (serviceVersion != null) ? serviceVersion : RemovedServiceVersion.getLatest();
        RemovedClientImpl client
            = new RemovedClientImpl(localPipeline, this.endpoint, this.version, localServiceVersion);
        return client;
    }

    @Metadata(generated = true)
    private void validateClient() {
        // This method is invoked from 'buildInnerClient'/'buildClient' method.
        // Developer can customize this method, to validate that the necessary conditions are met for the new client.
        Objects.requireNonNull(endpoint, "'endpoint' cannot be null.");
        Objects.requireNonNull(version, "'version' cannot be null.");
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
     * Builds an instance of RemovedClient class.
     * 
     * @return an instance of RemovedClient.
     */
    @Metadata(generated = true)
    public RemovedClient buildClient() {
        return new RemovedClient(buildInnerClient());
    }

    private static final ClientLogger LOGGER = new ClientLogger(RemovedClientBuilder.class);
}
