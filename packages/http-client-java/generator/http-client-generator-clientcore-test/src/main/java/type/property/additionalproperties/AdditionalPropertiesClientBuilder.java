package type.property.additionalproperties;

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
import type.property.additionalproperties.implementation.AdditionalPropertiesClientImpl;

/**
 * A builder for creating a new instance of the AdditionalPropertiesClient type.
 */
@ServiceClientBuilder(
    serviceClients = {
        ExtendsUnknownClient.class,
        ExtendsUnknownDerivedClient.class,
        ExtendsUnknownDiscriminatedClient.class,
        IsUnknownClient.class,
        IsUnknownDerivedClient.class,
        IsUnknownDiscriminatedClient.class,
        ExtendsStringClient.class,
        IsStringClient.class,
        SpreadStringClient.class,
        ExtendsFloatClient.class,
        IsFloatClient.class,
        SpreadFloatClient.class,
        ExtendsModelClient.class,
        IsModelClient.class,
        SpreadModelClient.class,
        ExtendsModelArrayClient.class,
        IsModelArrayClient.class,
        SpreadModelArrayClient.class,
        SpreadDifferentStringClient.class,
        SpreadDifferentFloatClient.class,
        SpreadDifferentModelClient.class,
        SpreadDifferentModelArrayClient.class,
        ExtendsDifferentSpreadStringClient.class,
        ExtendsDifferentSpreadFloatClient.class,
        ExtendsDifferentSpreadModelClient.class,
        ExtendsDifferentSpreadModelArrayClient.class,
        MultipleSpreadClient.class,
        SpreadRecordUnionClient.class,
        SpreadRecordNonDiscriminatedUnionClient.class,
        SpreadRecordNonDiscriminatedUnion2Client.class,
        SpreadRecordNonDiscriminatedUnion3Client.class })
public final class AdditionalPropertiesClientBuilder
    implements HttpTrait<AdditionalPropertiesClientBuilder>, ProxyTrait<AdditionalPropertiesClientBuilder>,
    ConfigurationTrait<AdditionalPropertiesClientBuilder>, EndpointTrait<AdditionalPropertiesClientBuilder> {
    @Metadata(generated = true)
    private static final String SDK_NAME = "name";

    @Metadata(generated = true)
    private static final String SDK_VERSION = "version";

    @Metadata(generated = true)
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the AdditionalPropertiesClientBuilder.
     */
    @Metadata(generated = true)
    public AdditionalPropertiesClientBuilder() {
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
    public AdditionalPropertiesClientBuilder httpPipeline(HttpPipeline pipeline) {
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
    public AdditionalPropertiesClientBuilder httpClient(HttpClient httpClient) {
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
    public AdditionalPropertiesClientBuilder
        httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public AdditionalPropertiesClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public AdditionalPropertiesClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public AdditionalPropertiesClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public AdditionalPropertiesClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public AdditionalPropertiesClientBuilder configuration(Configuration configuration) {
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
    public AdditionalPropertiesClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of AdditionalPropertiesClientImpl with the provided parameters.
     * 
     * @return an instance of AdditionalPropertiesClientImpl.
     */
    @Metadata(generated = true)
    private AdditionalPropertiesClientImpl buildInnerClient() {
        this.validateClient();
        HttpPipeline localPipeline = (pipeline != null) ? pipeline : createHttpPipeline();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        AdditionalPropertiesClientImpl client = new AdditionalPropertiesClientImpl(localPipeline, localEndpoint);
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
     * Builds an instance of ExtendsUnknownClient class.
     * 
     * @return an instance of ExtendsUnknownClient.
     */
    @Metadata(generated = true)
    public ExtendsUnknownClient buildExtendsUnknownClient() {
        return new ExtendsUnknownClient(buildInnerClient().getExtendsUnknowns());
    }

    /**
     * Builds an instance of ExtendsUnknownDerivedClient class.
     * 
     * @return an instance of ExtendsUnknownDerivedClient.
     */
    @Metadata(generated = true)
    public ExtendsUnknownDerivedClient buildExtendsUnknownDerivedClient() {
        return new ExtendsUnknownDerivedClient(buildInnerClient().getExtendsUnknownDeriveds());
    }

    /**
     * Builds an instance of ExtendsUnknownDiscriminatedClient class.
     * 
     * @return an instance of ExtendsUnknownDiscriminatedClient.
     */
    @Metadata(generated = true)
    public ExtendsUnknownDiscriminatedClient buildExtendsUnknownDiscriminatedClient() {
        return new ExtendsUnknownDiscriminatedClient(buildInnerClient().getExtendsUnknownDiscriminateds());
    }

    /**
     * Builds an instance of IsUnknownClient class.
     * 
     * @return an instance of IsUnknownClient.
     */
    @Metadata(generated = true)
    public IsUnknownClient buildIsUnknownClient() {
        return new IsUnknownClient(buildInnerClient().getIsUnknowns());
    }

    /**
     * Builds an instance of IsUnknownDerivedClient class.
     * 
     * @return an instance of IsUnknownDerivedClient.
     */
    @Metadata(generated = true)
    public IsUnknownDerivedClient buildIsUnknownDerivedClient() {
        return new IsUnknownDerivedClient(buildInnerClient().getIsUnknownDeriveds());
    }

    /**
     * Builds an instance of IsUnknownDiscriminatedClient class.
     * 
     * @return an instance of IsUnknownDiscriminatedClient.
     */
    @Metadata(generated = true)
    public IsUnknownDiscriminatedClient buildIsUnknownDiscriminatedClient() {
        return new IsUnknownDiscriminatedClient(buildInnerClient().getIsUnknownDiscriminateds());
    }

    /**
     * Builds an instance of ExtendsStringClient class.
     * 
     * @return an instance of ExtendsStringClient.
     */
    @Metadata(generated = true)
    public ExtendsStringClient buildExtendsStringClient() {
        return new ExtendsStringClient(buildInnerClient().getExtendsStrings());
    }

    /**
     * Builds an instance of IsStringClient class.
     * 
     * @return an instance of IsStringClient.
     */
    @Metadata(generated = true)
    public IsStringClient buildIsStringClient() {
        return new IsStringClient(buildInnerClient().getIsStrings());
    }

    /**
     * Builds an instance of SpreadStringClient class.
     * 
     * @return an instance of SpreadStringClient.
     */
    @Metadata(generated = true)
    public SpreadStringClient buildSpreadStringClient() {
        return new SpreadStringClient(buildInnerClient().getSpreadStrings());
    }

    /**
     * Builds an instance of ExtendsFloatClient class.
     * 
     * @return an instance of ExtendsFloatClient.
     */
    @Metadata(generated = true)
    public ExtendsFloatClient buildExtendsFloatClient() {
        return new ExtendsFloatClient(buildInnerClient().getExtendsFloats());
    }

    /**
     * Builds an instance of IsFloatClient class.
     * 
     * @return an instance of IsFloatClient.
     */
    @Metadata(generated = true)
    public IsFloatClient buildIsFloatClient() {
        return new IsFloatClient(buildInnerClient().getIsFloats());
    }

    /**
     * Builds an instance of SpreadFloatClient class.
     * 
     * @return an instance of SpreadFloatClient.
     */
    @Metadata(generated = true)
    public SpreadFloatClient buildSpreadFloatClient() {
        return new SpreadFloatClient(buildInnerClient().getSpreadFloats());
    }

    /**
     * Builds an instance of ExtendsModelClient class.
     * 
     * @return an instance of ExtendsModelClient.
     */
    @Metadata(generated = true)
    public ExtendsModelClient buildExtendsModelClient() {
        return new ExtendsModelClient(buildInnerClient().getExtendsModels());
    }

    /**
     * Builds an instance of IsModelClient class.
     * 
     * @return an instance of IsModelClient.
     */
    @Metadata(generated = true)
    public IsModelClient buildIsModelClient() {
        return new IsModelClient(buildInnerClient().getIsModels());
    }

    /**
     * Builds an instance of SpreadModelClient class.
     * 
     * @return an instance of SpreadModelClient.
     */
    @Metadata(generated = true)
    public SpreadModelClient buildSpreadModelClient() {
        return new SpreadModelClient(buildInnerClient().getSpreadModels());
    }

    /**
     * Builds an instance of ExtendsModelArrayClient class.
     * 
     * @return an instance of ExtendsModelArrayClient.
     */
    @Metadata(generated = true)
    public ExtendsModelArrayClient buildExtendsModelArrayClient() {
        return new ExtendsModelArrayClient(buildInnerClient().getExtendsModelArrays());
    }

    /**
     * Builds an instance of IsModelArrayClient class.
     * 
     * @return an instance of IsModelArrayClient.
     */
    @Metadata(generated = true)
    public IsModelArrayClient buildIsModelArrayClient() {
        return new IsModelArrayClient(buildInnerClient().getIsModelArrays());
    }

    /**
     * Builds an instance of SpreadModelArrayClient class.
     * 
     * @return an instance of SpreadModelArrayClient.
     */
    @Metadata(generated = true)
    public SpreadModelArrayClient buildSpreadModelArrayClient() {
        return new SpreadModelArrayClient(buildInnerClient().getSpreadModelArrays());
    }

    /**
     * Builds an instance of SpreadDifferentStringClient class.
     * 
     * @return an instance of SpreadDifferentStringClient.
     */
    @Metadata(generated = true)
    public SpreadDifferentStringClient buildSpreadDifferentStringClient() {
        return new SpreadDifferentStringClient(buildInnerClient().getSpreadDifferentStrings());
    }

    /**
     * Builds an instance of SpreadDifferentFloatClient class.
     * 
     * @return an instance of SpreadDifferentFloatClient.
     */
    @Metadata(generated = true)
    public SpreadDifferentFloatClient buildSpreadDifferentFloatClient() {
        return new SpreadDifferentFloatClient(buildInnerClient().getSpreadDifferentFloats());
    }

    /**
     * Builds an instance of SpreadDifferentModelClient class.
     * 
     * @return an instance of SpreadDifferentModelClient.
     */
    @Metadata(generated = true)
    public SpreadDifferentModelClient buildSpreadDifferentModelClient() {
        return new SpreadDifferentModelClient(buildInnerClient().getSpreadDifferentModels());
    }

    /**
     * Builds an instance of SpreadDifferentModelArrayClient class.
     * 
     * @return an instance of SpreadDifferentModelArrayClient.
     */
    @Metadata(generated = true)
    public SpreadDifferentModelArrayClient buildSpreadDifferentModelArrayClient() {
        return new SpreadDifferentModelArrayClient(buildInnerClient().getSpreadDifferentModelArrays());
    }

    /**
     * Builds an instance of ExtendsDifferentSpreadStringClient class.
     * 
     * @return an instance of ExtendsDifferentSpreadStringClient.
     */
    @Metadata(generated = true)
    public ExtendsDifferentSpreadStringClient buildExtendsDifferentSpreadStringClient() {
        return new ExtendsDifferentSpreadStringClient(buildInnerClient().getExtendsDifferentSpreadStrings());
    }

    /**
     * Builds an instance of ExtendsDifferentSpreadFloatClient class.
     * 
     * @return an instance of ExtendsDifferentSpreadFloatClient.
     */
    @Metadata(generated = true)
    public ExtendsDifferentSpreadFloatClient buildExtendsDifferentSpreadFloatClient() {
        return new ExtendsDifferentSpreadFloatClient(buildInnerClient().getExtendsDifferentSpreadFloats());
    }

    /**
     * Builds an instance of ExtendsDifferentSpreadModelClient class.
     * 
     * @return an instance of ExtendsDifferentSpreadModelClient.
     */
    @Metadata(generated = true)
    public ExtendsDifferentSpreadModelClient buildExtendsDifferentSpreadModelClient() {
        return new ExtendsDifferentSpreadModelClient(buildInnerClient().getExtendsDifferentSpreadModels());
    }

    /**
     * Builds an instance of ExtendsDifferentSpreadModelArrayClient class.
     * 
     * @return an instance of ExtendsDifferentSpreadModelArrayClient.
     */
    @Metadata(generated = true)
    public ExtendsDifferentSpreadModelArrayClient buildExtendsDifferentSpreadModelArrayClient() {
        return new ExtendsDifferentSpreadModelArrayClient(buildInnerClient().getExtendsDifferentSpreadModelArrays());
    }

    /**
     * Builds an instance of MultipleSpreadClient class.
     * 
     * @return an instance of MultipleSpreadClient.
     */
    @Metadata(generated = true)
    public MultipleSpreadClient buildMultipleSpreadClient() {
        return new MultipleSpreadClient(buildInnerClient().getMultipleSpreads());
    }

    /**
     * Builds an instance of SpreadRecordUnionClient class.
     * 
     * @return an instance of SpreadRecordUnionClient.
     */
    @Metadata(generated = true)
    public SpreadRecordUnionClient buildSpreadRecordUnionClient() {
        return new SpreadRecordUnionClient(buildInnerClient().getSpreadRecordUnions());
    }

    /**
     * Builds an instance of SpreadRecordNonDiscriminatedUnionClient class.
     * 
     * @return an instance of SpreadRecordNonDiscriminatedUnionClient.
     */
    @Metadata(generated = true)
    public SpreadRecordNonDiscriminatedUnionClient buildSpreadRecordNonDiscriminatedUnionClient() {
        return new SpreadRecordNonDiscriminatedUnionClient(buildInnerClient().getSpreadRecordNonDiscriminatedUnions());
    }

    /**
     * Builds an instance of SpreadRecordNonDiscriminatedUnion2Client class.
     * 
     * @return an instance of SpreadRecordNonDiscriminatedUnion2Client.
     */
    @Metadata(generated = true)
    public SpreadRecordNonDiscriminatedUnion2Client buildSpreadRecordNonDiscriminatedUnion2Client() {
        return new SpreadRecordNonDiscriminatedUnion2Client(
            buildInnerClient().getSpreadRecordNonDiscriminatedUnion2s());
    }

    /**
     * Builds an instance of SpreadRecordNonDiscriminatedUnion3Client class.
     * 
     * @return an instance of SpreadRecordNonDiscriminatedUnion3Client.
     */
    @Metadata(generated = true)
    public SpreadRecordNonDiscriminatedUnion3Client buildSpreadRecordNonDiscriminatedUnion3Client() {
        return new SpreadRecordNonDiscriminatedUnion3Client(
            buildInnerClient().getSpreadRecordNonDiscriminatedUnion3s());
    }

    private static final ClientLogger LOGGER = new ClientLogger(AdditionalPropertiesClientBuilder.class);
}
