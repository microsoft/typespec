package petstore;

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
import petstore.implementation.PetStoreClientImpl;

/**
 * A builder for creating a new instance of the PetStoreClient type.
 */
@ServiceClientBuilder(
    serviceClients = {
        PetsClient.class,
        PetCheckupsClient.class,
        PetInsuranceClient.class,
        ToysClient.class,
        ToyInsuranceClient.class,
        CheckupsClient.class,
        OwnersClient.class,
        OwnerCheckupsClient.class,
        OwnerInsuranceClient.class })
public final class PetStoreClientBuilder implements HttpTrait<PetStoreClientBuilder>, ProxyTrait<PetStoreClientBuilder>,
    ConfigurationTrait<PetStoreClientBuilder>, EndpointTrait<PetStoreClientBuilder> {
    @Metadata(generated = true)
    private static final String SDK_NAME = "name";

    @Metadata(generated = true)
    private static final String SDK_VERSION = "version";

    @Metadata(generated = true)
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the PetStoreClientBuilder.
     */
    @Metadata(generated = true)
    public PetStoreClientBuilder() {
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
    public PetStoreClientBuilder httpPipeline(HttpPipeline pipeline) {
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
    public PetStoreClientBuilder httpClient(HttpClient httpClient) {
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
    public PetStoreClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public PetStoreClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public PetStoreClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public PetStoreClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public PetStoreClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public PetStoreClientBuilder configuration(Configuration configuration) {
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
    public PetStoreClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of PetStoreClientImpl with the provided parameters.
     * 
     * @return an instance of PetStoreClientImpl.
     */
    @Metadata(generated = true)
    private PetStoreClientImpl buildInnerClient() {
        this.validateClient();
        HttpPipeline localPipeline = (pipeline != null) ? pipeline : createHttpPipeline();
        PetStoreClientImpl client = new PetStoreClientImpl(localPipeline, this.endpoint);
        return client;
    }

    @Metadata(generated = true)
    private void validateClient() {
        // This method is invoked from 'buildInnerClient'/'buildClient' method.
        // Developer can customize this method, to validate that the necessary conditions are met for the new client.
        Objects.requireNonNull(endpoint, "'endpoint' cannot be null.");
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
     * Builds an instance of PetsClient class.
     * 
     * @return an instance of PetsClient.
     */
    @Metadata(generated = true)
    public PetsClient buildPetsClient() {
        return new PetsClient(buildInnerClient().getPets());
    }

    /**
     * Builds an instance of PetCheckupsClient class.
     * 
     * @return an instance of PetCheckupsClient.
     */
    @Metadata(generated = true)
    public PetCheckupsClient buildPetCheckupsClient() {
        return new PetCheckupsClient(buildInnerClient().getPetCheckups());
    }

    /**
     * Builds an instance of PetInsuranceClient class.
     * 
     * @return an instance of PetInsuranceClient.
     */
    @Metadata(generated = true)
    public PetInsuranceClient buildPetInsuranceClient() {
        return new PetInsuranceClient(buildInnerClient().getPetInsurances());
    }

    /**
     * Builds an instance of ToysClient class.
     * 
     * @return an instance of ToysClient.
     */
    @Metadata(generated = true)
    public ToysClient buildToysClient() {
        return new ToysClient(buildInnerClient().getToys());
    }

    /**
     * Builds an instance of ToyInsuranceClient class.
     * 
     * @return an instance of ToyInsuranceClient.
     */
    @Metadata(generated = true)
    public ToyInsuranceClient buildToyInsuranceClient() {
        return new ToyInsuranceClient(buildInnerClient().getToyInsurances());
    }

    /**
     * Builds an instance of CheckupsClient class.
     * 
     * @return an instance of CheckupsClient.
     */
    @Metadata(generated = true)
    public CheckupsClient buildCheckupsClient() {
        return new CheckupsClient(buildInnerClient().getCheckups());
    }

    /**
     * Builds an instance of OwnersClient class.
     * 
     * @return an instance of OwnersClient.
     */
    @Metadata(generated = true)
    public OwnersClient buildOwnersClient() {
        return new OwnersClient(buildInnerClient().getOwners());
    }

    /**
     * Builds an instance of OwnerCheckupsClient class.
     * 
     * @return an instance of OwnerCheckupsClient.
     */
    @Metadata(generated = true)
    public OwnerCheckupsClient buildOwnerCheckupsClient() {
        return new OwnerCheckupsClient(buildInnerClient().getOwnerCheckups());
    }

    /**
     * Builds an instance of OwnerInsuranceClient class.
     * 
     * @return an instance of OwnerInsuranceClient.
     */
    @Metadata(generated = true)
    public OwnerInsuranceClient buildOwnerInsuranceClient() {
        return new OwnerInsuranceClient(buildInnerClient().getOwnerInsurances());
    }

    private static final ClientLogger LOGGER = new ClientLogger(PetStoreClientBuilder.class);
}
