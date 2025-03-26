package routes;

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
    @Metadata(generated = true)
    private static final String SDK_NAME = "name";

    @Metadata(generated = true)
    private static final String SDK_VERSION = "version";

    @Metadata(generated = true)
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the RoutesClientBuilder.
     */
    @Metadata(generated = true)
    public RoutesClientBuilder() {
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
    public RoutesClientBuilder httpPipeline(HttpPipeline pipeline) {
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
    public RoutesClientBuilder httpClient(HttpClient httpClient) {
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
    public RoutesClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public RoutesClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public RoutesClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public RoutesClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public RoutesClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public RoutesClientBuilder configuration(Configuration configuration) {
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
    public RoutesClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of RoutesClientImpl with the provided parameters.
     * 
     * @return an instance of RoutesClientImpl.
     */
    @Metadata(generated = true)
    private RoutesClientImpl buildInnerClient() {
        this.validateClient();
        HttpPipeline localPipeline = (pipeline != null) ? pipeline : createHttpPipeline();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        RoutesClientImpl client = new RoutesClientImpl(localPipeline, localEndpoint);
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
     * Builds an instance of RoutesClient class.
     * 
     * @return an instance of RoutesClient.
     */
    @Metadata(generated = true)
    public RoutesClient buildClient() {
        return new RoutesClient(buildInnerClient());
    }

    /**
     * Builds an instance of PathParametersClient class.
     * 
     * @return an instance of PathParametersClient.
     */
    @Metadata(generated = true)
    public PathParametersClient buildPathParametersClient() {
        return new PathParametersClient(buildInnerClient().getPathParameters());
    }

    /**
     * Builds an instance of PathParametersReservedExpansionClient class.
     * 
     * @return an instance of PathParametersReservedExpansionClient.
     */
    @Metadata(generated = true)
    public PathParametersReservedExpansionClient buildPathParametersReservedExpansionClient() {
        return new PathParametersReservedExpansionClient(buildInnerClient().getPathParametersReservedExpansions());
    }

    /**
     * Builds an instance of PathParametersSimpleExpansionStandardClient class.
     * 
     * @return an instance of PathParametersSimpleExpansionStandardClient.
     */
    @Metadata(generated = true)
    public PathParametersSimpleExpansionStandardClient buildPathParametersSimpleExpansionStandardClient() {
        return new PathParametersSimpleExpansionStandardClient(
            buildInnerClient().getPathParametersSimpleExpansionStandards());
    }

    /**
     * Builds an instance of PathParametersSimpleExpansionExplodeClient class.
     * 
     * @return an instance of PathParametersSimpleExpansionExplodeClient.
     */
    @Metadata(generated = true)
    public PathParametersSimpleExpansionExplodeClient buildPathParametersSimpleExpansionExplodeClient() {
        return new PathParametersSimpleExpansionExplodeClient(
            buildInnerClient().getPathParametersSimpleExpansionExplodes());
    }

    /**
     * Builds an instance of PathParametersPathExpansionStandardClient class.
     * 
     * @return an instance of PathParametersPathExpansionStandardClient.
     */
    @Metadata(generated = true)
    public PathParametersPathExpansionStandardClient buildPathParametersPathExpansionStandardClient() {
        return new PathParametersPathExpansionStandardClient(
            buildInnerClient().getPathParametersPathExpansionStandards());
    }

    /**
     * Builds an instance of PathParametersPathExpansionExplodeClient class.
     * 
     * @return an instance of PathParametersPathExpansionExplodeClient.
     */
    @Metadata(generated = true)
    public PathParametersPathExpansionExplodeClient buildPathParametersPathExpansionExplodeClient() {
        return new PathParametersPathExpansionExplodeClient(
            buildInnerClient().getPathParametersPathExpansionExplodes());
    }

    /**
     * Builds an instance of PathParametersLabelExpansionStandardClient class.
     * 
     * @return an instance of PathParametersLabelExpansionStandardClient.
     */
    @Metadata(generated = true)
    public PathParametersLabelExpansionStandardClient buildPathParametersLabelExpansionStandardClient() {
        return new PathParametersLabelExpansionStandardClient(
            buildInnerClient().getPathParametersLabelExpansionStandards());
    }

    /**
     * Builds an instance of PathParametersLabelExpansionExplodeClient class.
     * 
     * @return an instance of PathParametersLabelExpansionExplodeClient.
     */
    @Metadata(generated = true)
    public PathParametersLabelExpansionExplodeClient buildPathParametersLabelExpansionExplodeClient() {
        return new PathParametersLabelExpansionExplodeClient(
            buildInnerClient().getPathParametersLabelExpansionExplodes());
    }

    /**
     * Builds an instance of PathParametersMatrixExpansionStandardClient class.
     * 
     * @return an instance of PathParametersMatrixExpansionStandardClient.
     */
    @Metadata(generated = true)
    public PathParametersMatrixExpansionStandardClient buildPathParametersMatrixExpansionStandardClient() {
        return new PathParametersMatrixExpansionStandardClient(
            buildInnerClient().getPathParametersMatrixExpansionStandards());
    }

    /**
     * Builds an instance of PathParametersMatrixExpansionExplodeClient class.
     * 
     * @return an instance of PathParametersMatrixExpansionExplodeClient.
     */
    @Metadata(generated = true)
    public PathParametersMatrixExpansionExplodeClient buildPathParametersMatrixExpansionExplodeClient() {
        return new PathParametersMatrixExpansionExplodeClient(
            buildInnerClient().getPathParametersMatrixExpansionExplodes());
    }

    /**
     * Builds an instance of QueryParametersClient class.
     * 
     * @return an instance of QueryParametersClient.
     */
    @Metadata(generated = true)
    public QueryParametersClient buildQueryParametersClient() {
        return new QueryParametersClient(buildInnerClient().getQueryParameters());
    }

    /**
     * Builds an instance of QueryParametersQueryExpansionStandardClient class.
     * 
     * @return an instance of QueryParametersQueryExpansionStandardClient.
     */
    @Metadata(generated = true)
    public QueryParametersQueryExpansionStandardClient buildQueryParametersQueryExpansionStandardClient() {
        return new QueryParametersQueryExpansionStandardClient(
            buildInnerClient().getQueryParametersQueryExpansionStandards());
    }

    /**
     * Builds an instance of QueryParametersQueryExpansionExplodeClient class.
     * 
     * @return an instance of QueryParametersQueryExpansionExplodeClient.
     */
    @Metadata(generated = true)
    public QueryParametersQueryExpansionExplodeClient buildQueryParametersQueryExpansionExplodeClient() {
        return new QueryParametersQueryExpansionExplodeClient(
            buildInnerClient().getQueryParametersQueryExpansionExplodes());
    }

    /**
     * Builds an instance of QueryParametersQueryContinuationStandardClient class.
     * 
     * @return an instance of QueryParametersQueryContinuationStandardClient.
     */
    @Metadata(generated = true)
    public QueryParametersQueryContinuationStandardClient buildQueryParametersQueryContinuationStandardClient() {
        return new QueryParametersQueryContinuationStandardClient(
            buildInnerClient().getQueryParametersQueryContinuationStandards());
    }

    /**
     * Builds an instance of QueryParametersQueryContinuationExplodeClient class.
     * 
     * @return an instance of QueryParametersQueryContinuationExplodeClient.
     */
    @Metadata(generated = true)
    public QueryParametersQueryContinuationExplodeClient buildQueryParametersQueryContinuationExplodeClient() {
        return new QueryParametersQueryContinuationExplodeClient(
            buildInnerClient().getQueryParametersQueryContinuationExplodes());
    }

    /**
     * Builds an instance of InInterfaceClient class.
     * 
     * @return an instance of InInterfaceClient.
     */
    @Metadata(generated = true)
    public InInterfaceClient buildInInterfaceClient() {
        return new InInterfaceClient(buildInnerClient().getInInterfaces());
    }

    private static final ClientLogger LOGGER = new ClientLogger(RoutesClientBuilder.class);
}
