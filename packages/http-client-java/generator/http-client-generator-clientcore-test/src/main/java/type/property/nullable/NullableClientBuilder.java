package type.property.nullable;

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
import type.property.nullable.implementation.NullableClientImpl;

/**
 * A builder for creating a new instance of the NullableClient type.
 */
@ServiceClientBuilder(
    serviceClients = {
        StringOperationClient.class,
        BytesClient.class,
        DatetimeOperationClient.class,
        DurationOperationClient.class,
        CollectionsByteClient.class,
        CollectionsModelClient.class,
        CollectionsStringClient.class })
public final class NullableClientBuilder implements HttpTrait<NullableClientBuilder>, ProxyTrait<NullableClientBuilder>,
    ConfigurationTrait<NullableClientBuilder>, EndpointTrait<NullableClientBuilder> {
    @Metadata(generated = true)
    private static final String SDK_NAME = "name";

    @Metadata(generated = true)
    private static final String SDK_VERSION = "version";

    @Metadata(generated = true)
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the NullableClientBuilder.
     */
    @Metadata(generated = true)
    public NullableClientBuilder() {
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
    public NullableClientBuilder httpPipeline(HttpPipeline pipeline) {
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
    public NullableClientBuilder httpClient(HttpClient httpClient) {
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
    public NullableClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public NullableClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public NullableClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public NullableClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public NullableClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public NullableClientBuilder configuration(Configuration configuration) {
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
    public NullableClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of NullableClientImpl with the provided parameters.
     * 
     * @return an instance of NullableClientImpl.
     */
    @Metadata(generated = true)
    private NullableClientImpl buildInnerClient() {
        this.validateClient();
        HttpPipeline localPipeline = (pipeline != null) ? pipeline : createHttpPipeline();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        NullableClientImpl client = new NullableClientImpl(localPipeline, localEndpoint);
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
     * Builds an instance of CollectionsStringClient class.
     * 
     * @return an instance of CollectionsStringClient.
     */
    @Metadata(generated = true)
    public CollectionsStringClient buildCollectionsStringClient() {
        return new CollectionsStringClient(buildInnerClient().getCollectionsStrings());
    }

    private static final ClientLogger LOGGER = new ClientLogger(NullableClientBuilder.class);
}
