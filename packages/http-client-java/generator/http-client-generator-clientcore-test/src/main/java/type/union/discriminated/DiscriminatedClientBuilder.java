package type.union.discriminated;

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
import type.union.discriminated.implementation.DiscriminatedClientImpl;

/**
 * A builder for creating a new instance of the DiscriminatedClient type.
 */
@ServiceClientBuilder(
    serviceClients = {
        EnvelopeObjectDefaultClient.class,
        EnvelopeObjectCustomPropertiesClient.class,
        NoEnvelopeDefaultClient.class,
        NoEnvelopeCustomDiscriminatorClient.class })
public final class DiscriminatedClientBuilder
    implements HttpTrait<DiscriminatedClientBuilder>, ProxyTrait<DiscriminatedClientBuilder>,
    ConfigurationTrait<DiscriminatedClientBuilder>, EndpointTrait<DiscriminatedClientBuilder> {

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_NAME = "name";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_VERSION = "version";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final Map<String, String> PROPERTIES
        = CoreUtils.getProperties("type-union-discriminated.properties");

    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the DiscriminatedClientBuilder.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public DiscriminatedClientBuilder() {
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
    public DiscriminatedClientBuilder httpClient(HttpClient httpClient) {
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
    public DiscriminatedClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public DiscriminatedClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public DiscriminatedClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public DiscriminatedClientBuilder
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
    public DiscriminatedClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public DiscriminatedClientBuilder configuration(Configuration configuration) {
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
    public DiscriminatedClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of DiscriminatedClientImpl with the provided parameters.
     *
     * @return an instance of DiscriminatedClientImpl.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private DiscriminatedClientImpl buildInnerClient() {
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
        DiscriminatedClientImpl client
            = new DiscriminatedClientImpl(createHttpPipeline(), instrumentation, localEndpoint);
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
     * Builds an instance of EnvelopeObjectDefaultClient class.
     *
     * @return an instance of EnvelopeObjectDefaultClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public EnvelopeObjectDefaultClient buildEnvelopeObjectDefaultClient() {
        DiscriminatedClientImpl innerClient = buildInnerClient();
        return new EnvelopeObjectDefaultClient(innerClient.getEnvelopeObjectDefaults(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of EnvelopeObjectCustomPropertiesClient class.
     *
     * @return an instance of EnvelopeObjectCustomPropertiesClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public EnvelopeObjectCustomPropertiesClient buildEnvelopeObjectCustomPropertiesClient() {
        DiscriminatedClientImpl innerClient = buildInnerClient();
        return new EnvelopeObjectCustomPropertiesClient(innerClient.getEnvelopeObjectCustomProperties(),
            innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of NoEnvelopeDefaultClient class.
     *
     * @return an instance of NoEnvelopeDefaultClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public NoEnvelopeDefaultClient buildNoEnvelopeDefaultClient() {
        DiscriminatedClientImpl innerClient = buildInnerClient();
        return new NoEnvelopeDefaultClient(innerClient.getNoEnvelopeDefaults(), innerClient.getInstrumentation());
    }

    /**
     * Builds an instance of NoEnvelopeCustomDiscriminatorClient class.
     *
     * @return an instance of NoEnvelopeCustomDiscriminatorClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public NoEnvelopeCustomDiscriminatorClient buildNoEnvelopeCustomDiscriminatorClient() {
        DiscriminatedClientImpl innerClient = buildInnerClient();
        return new NoEnvelopeCustomDiscriminatorClient(innerClient.getNoEnvelopeCustomDiscriminators(),
            innerClient.getInstrumentation());
    }
}
