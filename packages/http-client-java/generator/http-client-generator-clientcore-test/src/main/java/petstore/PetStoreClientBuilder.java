package petstore;

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
    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_NAME = "name";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_VERSION = "version";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the PetStoreClientBuilder.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PetStoreClientBuilder() {
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
    public PetStoreClientBuilder httpClient(HttpClient httpClient) {
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
    public PetStoreClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public PetStoreClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public PetStoreClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public PetStoreClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public PetStoreClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public PetStoreClientBuilder configuration(Configuration configuration) {
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
    public PetStoreClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of PetStoreClientImpl with the provided parameters.
     * 
     * @return an instance of PetStoreClientImpl.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private PetStoreClientImpl buildInnerClient() {
        this.validateClient();
        PetStoreClientImpl client = new PetStoreClientImpl(createHttpPipeline(), this.endpoint);
        return client;
    }

    @Metadata(properties = { MetadataProperties.GENERATED })
    private void validateClient() {
        // This method is invoked from 'buildInnerClient'/'buildClient' method.
        // Developer can customize this method, to validate that the necessary conditions are met for the new client.
        Objects.requireNonNull(endpoint, "'endpoint' cannot be null.");
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
     * Builds an instance of PetsClient class.
     * 
     * @return an instance of PetsClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PetsClient buildPetsClient() {
        return new PetsClient(buildInnerClient().getPets());
    }

    /**
     * Builds an instance of PetCheckupsClient class.
     * 
     * @return an instance of PetCheckupsClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PetCheckupsClient buildPetCheckupsClient() {
        return new PetCheckupsClient(buildInnerClient().getPetCheckups());
    }

    /**
     * Builds an instance of PetInsuranceClient class.
     * 
     * @return an instance of PetInsuranceClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public PetInsuranceClient buildPetInsuranceClient() {
        return new PetInsuranceClient(buildInnerClient().getPetInsurances());
    }

    /**
     * Builds an instance of ToysClient class.
     * 
     * @return an instance of ToysClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ToysClient buildToysClient() {
        return new ToysClient(buildInnerClient().getToys());
    }

    /**
     * Builds an instance of ToyInsuranceClient class.
     * 
     * @return an instance of ToyInsuranceClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ToyInsuranceClient buildToyInsuranceClient() {
        return new ToyInsuranceClient(buildInnerClient().getToyInsurances());
    }

    /**
     * Builds an instance of CheckupsClient class.
     * 
     * @return an instance of CheckupsClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public CheckupsClient buildCheckupsClient() {
        return new CheckupsClient(buildInnerClient().getCheckups());
    }

    /**
     * Builds an instance of OwnersClient class.
     * 
     * @return an instance of OwnersClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public OwnersClient buildOwnersClient() {
        return new OwnersClient(buildInnerClient().getOwners());
    }

    /**
     * Builds an instance of OwnerCheckupsClient class.
     * 
     * @return an instance of OwnerCheckupsClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public OwnerCheckupsClient buildOwnerCheckupsClient() {
        return new OwnerCheckupsClient(buildInnerClient().getOwnerCheckups());
    }

    /**
     * Builds an instance of OwnerInsuranceClient class.
     * 
     * @return an instance of OwnerInsuranceClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public OwnerInsuranceClient buildOwnerInsuranceClient() {
        return new OwnerInsuranceClient(buildInnerClient().getOwnerInsurances());
    }
}
