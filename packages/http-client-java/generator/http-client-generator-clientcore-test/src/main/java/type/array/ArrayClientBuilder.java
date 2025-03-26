package type.array;

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
import type.array.implementation.ArrayClientImpl;

/**
 * A builder for creating a new instance of the ArrayClient type.
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
        NullableFloatValueClient.class,
        NullableInt32ValueClient.class,
        NullableBooleanValueClient.class,
        NullableStringValueClient.class,
        NullableModelValueClient.class })
public final class ArrayClientBuilder implements HttpTrait<ArrayClientBuilder>, ProxyTrait<ArrayClientBuilder>,
    ConfigurationTrait<ArrayClientBuilder>, EndpointTrait<ArrayClientBuilder> {
    @Metadata(generated = true)
    private static final String SDK_NAME = "name";

    @Metadata(generated = true)
    private static final String SDK_VERSION = "version";

    @Metadata(generated = true)
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the ArrayClientBuilder.
     */
    @Metadata(generated = true)
    public ArrayClientBuilder() {
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
    public ArrayClientBuilder httpPipeline(HttpPipeline pipeline) {
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
    public ArrayClientBuilder httpClient(HttpClient httpClient) {
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
    public ArrayClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public ArrayClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public ArrayClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public ArrayClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public ArrayClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public ArrayClientBuilder configuration(Configuration configuration) {
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
    public ArrayClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of ArrayClientImpl with the provided parameters.
     * 
     * @return an instance of ArrayClientImpl.
     */
    @Metadata(generated = true)
    private ArrayClientImpl buildInnerClient() {
        this.validateClient();
        HttpPipeline localPipeline = (pipeline != null) ? pipeline : createHttpPipeline();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        ArrayClientImpl client = new ArrayClientImpl(localPipeline, localEndpoint);
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
     * Builds an instance of NullableFloatValueClient class.
     * 
     * @return an instance of NullableFloatValueClient.
     */
    @Metadata(generated = true)
    public NullableFloatValueClient buildNullableFloatValueClient() {
        return new NullableFloatValueClient(buildInnerClient().getNullableFloatValues());
    }

    /**
     * Builds an instance of NullableInt32ValueClient class.
     * 
     * @return an instance of NullableInt32ValueClient.
     */
    @Metadata(generated = true)
    public NullableInt32ValueClient buildNullableInt32ValueClient() {
        return new NullableInt32ValueClient(buildInnerClient().getNullableInt32Values());
    }

    /**
     * Builds an instance of NullableBooleanValueClient class.
     * 
     * @return an instance of NullableBooleanValueClient.
     */
    @Metadata(generated = true)
    public NullableBooleanValueClient buildNullableBooleanValueClient() {
        return new NullableBooleanValueClient(buildInnerClient().getNullableBooleanValues());
    }

    /**
     * Builds an instance of NullableStringValueClient class.
     * 
     * @return an instance of NullableStringValueClient.
     */
    @Metadata(generated = true)
    public NullableStringValueClient buildNullableStringValueClient() {
        return new NullableStringValueClient(buildInnerClient().getNullableStringValues());
    }

    /**
     * Builds an instance of NullableModelValueClient class.
     * 
     * @return an instance of NullableModelValueClient.
     */
    @Metadata(generated = true)
    public NullableModelValueClient buildNullableModelValueClient() {
        return new NullableModelValueClient(buildInnerClient().getNullableModelValues());
    }

    private static final ClientLogger LOGGER = new ClientLogger(ArrayClientBuilder.class);
}
