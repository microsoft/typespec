package type.dictionary;

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
import type.dictionary.implementation.DictionaryClientImpl;

/**
 * A builder for creating a new instance of the DictionaryClient type.
 */
@ServiceClientBuilder(
    serviceClients = {
        Int32ValueClient.class,
        Int64ValueClient.class,
        BooleanValueClient.class,
        StringValueClient.class,
        Float32ValueClient.class,
        DatetimeValueClient.class,
        DurationValueClient.class,
        UnknownValueClient.class,
        ModelValueClient.class,
        RecursiveModelValueClient.class,
        NullableFloatValueClient.class })
public final class DictionaryClientBuilder
    implements HttpTrait<DictionaryClientBuilder>, ProxyTrait<DictionaryClientBuilder>,
    ConfigurationTrait<DictionaryClientBuilder>, EndpointTrait<DictionaryClientBuilder> {
    @Metadata(generated = true)
    private static final String SDK_NAME = "name";

    @Metadata(generated = true)
    private static final String SDK_VERSION = "version";

    @Metadata(generated = true)
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the DictionaryClientBuilder.
     */
    @Metadata(generated = true)
    public DictionaryClientBuilder() {
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
    public DictionaryClientBuilder httpPipeline(HttpPipeline pipeline) {
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
    public DictionaryClientBuilder httpClient(HttpClient httpClient) {
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
    public DictionaryClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public DictionaryClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public DictionaryClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public DictionaryClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public DictionaryClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public DictionaryClientBuilder configuration(Configuration configuration) {
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
    public DictionaryClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of DictionaryClientImpl with the provided parameters.
     * 
     * @return an instance of DictionaryClientImpl.
     */
    @Metadata(generated = true)
    private DictionaryClientImpl buildInnerClient() {
        this.validateClient();
        HttpPipeline localPipeline = (pipeline != null) ? pipeline : createHttpPipeline();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        DictionaryClientImpl client = new DictionaryClientImpl(localPipeline, localEndpoint);
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
     * Builds an instance of Int32ValueClient class.
     * 
     * @return an instance of Int32ValueClient.
     */
    @Metadata(generated = true)
    public Int32ValueClient buildInt32ValueClient() {
        return new Int32ValueClient(buildInnerClient().getInt32Values());
    }

    /**
     * Builds an instance of Int64ValueClient class.
     * 
     * @return an instance of Int64ValueClient.
     */
    @Metadata(generated = true)
    public Int64ValueClient buildInt64ValueClient() {
        return new Int64ValueClient(buildInnerClient().getInt64Values());
    }

    /**
     * Builds an instance of BooleanValueClient class.
     * 
     * @return an instance of BooleanValueClient.
     */
    @Metadata(generated = true)
    public BooleanValueClient buildBooleanValueClient() {
        return new BooleanValueClient(buildInnerClient().getBooleanValues());
    }

    /**
     * Builds an instance of StringValueClient class.
     * 
     * @return an instance of StringValueClient.
     */
    @Metadata(generated = true)
    public StringValueClient buildStringValueClient() {
        return new StringValueClient(buildInnerClient().getStringValues());
    }

    /**
     * Builds an instance of Float32ValueClient class.
     * 
     * @return an instance of Float32ValueClient.
     */
    @Metadata(generated = true)
    public Float32ValueClient buildFloat32ValueClient() {
        return new Float32ValueClient(buildInnerClient().getFloat32Values());
    }

    /**
     * Builds an instance of DatetimeValueClient class.
     * 
     * @return an instance of DatetimeValueClient.
     */
    @Metadata(generated = true)
    public DatetimeValueClient buildDatetimeValueClient() {
        return new DatetimeValueClient(buildInnerClient().getDatetimeValues());
    }

    /**
     * Builds an instance of DurationValueClient class.
     * 
     * @return an instance of DurationValueClient.
     */
    @Metadata(generated = true)
    public DurationValueClient buildDurationValueClient() {
        return new DurationValueClient(buildInnerClient().getDurationValues());
    }

    /**
     * Builds an instance of UnknownValueClient class.
     * 
     * @return an instance of UnknownValueClient.
     */
    @Metadata(generated = true)
    public UnknownValueClient buildUnknownValueClient() {
        return new UnknownValueClient(buildInnerClient().getUnknownValues());
    }

    /**
     * Builds an instance of ModelValueClient class.
     * 
     * @return an instance of ModelValueClient.
     */
    @Metadata(generated = true)
    public ModelValueClient buildModelValueClient() {
        return new ModelValueClient(buildInnerClient().getModelValues());
    }

    /**
     * Builds an instance of RecursiveModelValueClient class.
     * 
     * @return an instance of RecursiveModelValueClient.
     */
    @Metadata(generated = true)
    public RecursiveModelValueClient buildRecursiveModelValueClient() {
        return new RecursiveModelValueClient(buildInnerClient().getRecursiveModelValues());
    }

    /**
     * Builds an instance of NullableFloatValueClient class.
     * 
     * @return an instance of NullableFloatValueClient.
     */
    @Metadata(generated = true)
    public NullableFloatValueClient buildNullableFloatValueClient() {
        return new NullableFloatValueClient(buildInnerClient().getNullableFloatValues());
    }

    private static final ClientLogger LOGGER = new ClientLogger(DictionaryClientBuilder.class);
}
