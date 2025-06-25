package routes;

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
import routes.implementation.RoutesClientImpl;

/**
 * A builder for creating a new instance of the RoutesClient type.
 */
@ServiceClientBuilder(
    serviceClients = {
        RoutesClient.class,
        PathParametersClient.class,
        PathParametersReservedExpansionClient.class,
        PathParametersSimpleExpansionStandardClient.class,
        PathParametersSimpleExpansionExplodeClient.class,
        PathParametersPathExpansionStandardClient.class,
        PathParametersPathExpansionExplodeClient.class,
        PathParametersLabelExpansionStandardClient.class,
        PathParametersLabelExpansionExplodeClient.class,
        PathParametersMatrixExpansionStandardClient.class,
        PathParametersMatrixExpansionExplodeClient.class,
        QueryParametersClient.class,
        QueryParametersQueryExpansionStandardClient.class,
        QueryParametersQueryExpansionExplodeClient.class,
        QueryParametersQueryContinuationStandardClient.class,
        QueryParametersQueryContinuationExplodeClient.class,
        InInterfaceClient.class })
public final class RoutesClientBuilder implements HttpTrait<RoutesClientBuilder>, ProxyTrait<RoutesClientBuilder>,
    ConfigurationTrait<RoutesClientBuilder>, EndpointTrait<RoutesClientBuilder> {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_NAME = "name";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_VERSION = "version";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the RoutesClientBuilder.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public RoutesClientBuilder() {
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
    public RoutesClientBuilder httpClient(HttpClient httpClient) {
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
    public RoutesClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public RoutesClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public RoutesClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public RoutesClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public RoutesClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public RoutesClientBuilder configuration(Configuration configuration) {
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
    public RoutesClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of RoutesClientImpl with the provided parameters.
     * 
     * @return an instance of RoutesClientImpl.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private RoutesClientImpl buildInnerClient() {
        this.validateClient();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        RoutesClientImpl client = new RoutesClientImpl(createHttpPipeline(), localEndpoint);
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
     * Builds an instance of RoutesClient class.
     * 
     * @return an instance of RoutesClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public RoutesClient buildClient() {
        return new RoutesClient(buildInnerClient());
    }

    /**
     * Builds an instance of PathParametersClient class.
     * 
     * @return an instance of PathParametersClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PathParametersClient buildPathParametersClient() {
        return new PathParametersClient(buildInnerClient().getPathParameters());
    }

    /**
     * Builds an instance of PathParametersReservedExpansionClient class.
     * 
     * @return an instance of PathParametersReservedExpansionClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PathParametersReservedExpansionClient buildPathParametersReservedExpansionClient() {
        return new PathParametersReservedExpansionClient(buildInnerClient().getPathParametersReservedExpansions());
    }

    /**
     * Builds an instance of PathParametersSimpleExpansionStandardClient class.
     * 
     * @return an instance of PathParametersSimpleExpansionStandardClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PathParametersSimpleExpansionStandardClient buildPathParametersSimpleExpansionStandardClient() {
        return new PathParametersSimpleExpansionStandardClient(
            buildInnerClient().getPathParametersSimpleExpansionStandards());
    }

    /**
     * Builds an instance of PathParametersSimpleExpansionExplodeClient class.
     * 
     * @return an instance of PathParametersSimpleExpansionExplodeClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PathParametersSimpleExpansionExplodeClient buildPathParametersSimpleExpansionExplodeClient() {
        return new PathParametersSimpleExpansionExplodeClient(
            buildInnerClient().getPathParametersSimpleExpansionExplodes());
    }

    /**
     * Builds an instance of PathParametersPathExpansionStandardClient class.
     * 
     * @return an instance of PathParametersPathExpansionStandardClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PathParametersPathExpansionStandardClient buildPathParametersPathExpansionStandardClient() {
        return new PathParametersPathExpansionStandardClient(
            buildInnerClient().getPathParametersPathExpansionStandards());
    }

    /**
     * Builds an instance of PathParametersPathExpansionExplodeClient class.
     * 
     * @return an instance of PathParametersPathExpansionExplodeClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PathParametersPathExpansionExplodeClient buildPathParametersPathExpansionExplodeClient() {
        return new PathParametersPathExpansionExplodeClient(
            buildInnerClient().getPathParametersPathExpansionExplodes());
    }

    /**
     * Builds an instance of PathParametersLabelExpansionStandardClient class.
     * 
     * @return an instance of PathParametersLabelExpansionStandardClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PathParametersLabelExpansionStandardClient buildPathParametersLabelExpansionStandardClient() {
        return new PathParametersLabelExpansionStandardClient(
            buildInnerClient().getPathParametersLabelExpansionStandards());
    }

    /**
     * Builds an instance of PathParametersLabelExpansionExplodeClient class.
     * 
     * @return an instance of PathParametersLabelExpansionExplodeClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PathParametersLabelExpansionExplodeClient buildPathParametersLabelExpansionExplodeClient() {
        return new PathParametersLabelExpansionExplodeClient(
            buildInnerClient().getPathParametersLabelExpansionExplodes());
    }

    /**
     * Builds an instance of PathParametersMatrixExpansionStandardClient class.
     * 
     * @return an instance of PathParametersMatrixExpansionStandardClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PathParametersMatrixExpansionStandardClient buildPathParametersMatrixExpansionStandardClient() {
        return new PathParametersMatrixExpansionStandardClient(
            buildInnerClient().getPathParametersMatrixExpansionStandards());
    }

    /**
     * Builds an instance of PathParametersMatrixExpansionExplodeClient class.
     * 
     * @return an instance of PathParametersMatrixExpansionExplodeClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PathParametersMatrixExpansionExplodeClient buildPathParametersMatrixExpansionExplodeClient() {
        return new PathParametersMatrixExpansionExplodeClient(
            buildInnerClient().getPathParametersMatrixExpansionExplodes());
    }

    /**
     * Builds an instance of QueryParametersClient class.
     * 
     * @return an instance of QueryParametersClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public QueryParametersClient buildQueryParametersClient() {
        return new QueryParametersClient(buildInnerClient().getQueryParameters());
    }

    /**
     * Builds an instance of QueryParametersQueryExpansionStandardClient class.
     * 
     * @return an instance of QueryParametersQueryExpansionStandardClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public QueryParametersQueryExpansionStandardClient buildQueryParametersQueryExpansionStandardClient() {
        return new QueryParametersQueryExpansionStandardClient(
            buildInnerClient().getQueryParametersQueryExpansionStandards());
    }

    /**
     * Builds an instance of QueryParametersQueryExpansionExplodeClient class.
     * 
     * @return an instance of QueryParametersQueryExpansionExplodeClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public QueryParametersQueryExpansionExplodeClient buildQueryParametersQueryExpansionExplodeClient() {
        return new QueryParametersQueryExpansionExplodeClient(
            buildInnerClient().getQueryParametersQueryExpansionExplodes());
    }

    /**
     * Builds an instance of QueryParametersQueryContinuationStandardClient class.
     * 
     * @return an instance of QueryParametersQueryContinuationStandardClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public QueryParametersQueryContinuationStandardClient buildQueryParametersQueryContinuationStandardClient() {
        return new QueryParametersQueryContinuationStandardClient(
            buildInnerClient().getQueryParametersQueryContinuationStandards());
    }

    /**
     * Builds an instance of QueryParametersQueryContinuationExplodeClient class.
     * 
     * @return an instance of QueryParametersQueryContinuationExplodeClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public QueryParametersQueryContinuationExplodeClient buildQueryParametersQueryContinuationExplodeClient() {
        return new QueryParametersQueryContinuationExplodeClient(
            buildInnerClient().getQueryParametersQueryContinuationExplodes());
    }

    /**
     * Builds an instance of InInterfaceClient class.
     * 
     * @return an instance of InInterfaceClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public InInterfaceClient buildInInterfaceClient() {
        return new InInterfaceClient(buildInnerClient().getInInterfaces());
    }
}
