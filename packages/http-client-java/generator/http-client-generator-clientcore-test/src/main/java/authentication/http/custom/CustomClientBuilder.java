// Code generated by Microsoft (R) TypeSpec Code Generator.

package authentication.http.custom;

import authentication.http.custom.implementation.CustomClientImpl;
import io.clientcore.core.annotation.Metadata;
import io.clientcore.core.annotation.ServiceClientBuilder;
import io.clientcore.core.credential.KeyCredential;
import io.clientcore.core.http.client.HttpClient;
import io.clientcore.core.http.models.HttpLogOptions;
import io.clientcore.core.http.models.HttpRedirectOptions;
import io.clientcore.core.http.models.HttpRetryOptions;
import io.clientcore.core.http.models.ProxyOptions;
import io.clientcore.core.http.pipeline.HttpLoggingPolicy;
import io.clientcore.core.http.pipeline.HttpPipeline;
import io.clientcore.core.http.pipeline.HttpPipelineBuilder;
import io.clientcore.core.http.pipeline.HttpPipelinePolicy;
import io.clientcore.core.http.pipeline.HttpRedirectPolicy;
import io.clientcore.core.http.pipeline.HttpRetryPolicy;
import io.clientcore.core.http.pipeline.KeyCredentialPolicy;
import io.clientcore.core.models.traits.ConfigurationTrait;
import io.clientcore.core.models.traits.EndpointTrait;
import io.clientcore.core.models.traits.HttpTrait;
import io.clientcore.core.models.traits.KeyCredentialTrait;
import io.clientcore.core.models.traits.ProxyTrait;
import io.clientcore.core.util.ClientLogger;
import io.clientcore.core.util.configuration.Configuration;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * A builder for creating a new instance of the CustomClient type.
 */
@ServiceClientBuilder(serviceClients = { CustomClient.class })
public final class CustomClientBuilder
    implements HttpTrait<CustomClientBuilder>, ProxyTrait<CustomClientBuilder>, ConfigurationTrait<CustomClientBuilder>,
    KeyCredentialTrait<CustomClientBuilder>, EndpointTrait<CustomClientBuilder> {
    @Metadata(generated = true)
    private static final String SDK_NAME = "name";

    @Metadata(generated = true)
    private static final String SDK_VERSION = "version";

    @Metadata(generated = true)
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the CustomClientBuilder.
     */
    @Metadata(generated = true)
    public CustomClientBuilder() {
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
    public CustomClientBuilder httpPipeline(HttpPipeline pipeline) {
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
    public CustomClientBuilder httpClient(HttpClient httpClient) {
        this.httpClient = httpClient;
        return this;
    }

    /*
     * The logging configuration for HTTP requests and responses.
     */
    @Metadata(generated = true)
    private HttpLogOptions httpLogOptions;

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public CustomClientBuilder httpLogOptions(HttpLogOptions httpLogOptions) {
        this.httpLogOptions = httpLogOptions;
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
    public CustomClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public CustomClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public CustomClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public CustomClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public CustomClientBuilder configuration(Configuration configuration) {
        this.configuration = configuration;
        return this;
    }

    /*
     * The KeyCredential used for authentication.
     */
    @Metadata(generated = true)
    private KeyCredential keyCredential;

    /**
     * {@inheritDoc}.
     */
    @Metadata(generated = true)
    @Override
    public CustomClientBuilder credential(KeyCredential keyCredential) {
        this.keyCredential = keyCredential;
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
    public CustomClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of CustomClientImpl with the provided parameters.
     * 
     * @return an instance of CustomClientImpl.
     */
    @Metadata(generated = true)
    private CustomClientImpl buildInnerClient() {
        this.validateClient();
        HttpPipeline localPipeline = (pipeline != null) ? pipeline : createHttpPipeline();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        CustomClientImpl client = new CustomClientImpl(localPipeline, localEndpoint);
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
        HttpLogOptions localHttpLogOptions = this.httpLogOptions == null ? new HttpLogOptions() : this.httpLogOptions;
        HttpPipelineBuilder httpPipelineBuilder = new HttpPipelineBuilder();
        List<HttpPipelinePolicy> policies = new ArrayList<>();
        policies.add(redirectOptions == null ? new HttpRedirectPolicy() : new HttpRedirectPolicy(redirectOptions));
        policies.add(retryOptions == null ? new HttpRetryPolicy() : new HttpRetryPolicy(retryOptions));
        this.pipelinePolicies.stream().forEach(p -> policies.add(p));
        if (keyCredential != null) {
            policies.add(new KeyCredentialPolicy("authorization", keyCredential, "SharedAccessKey"));
        }
        policies.add(new HttpLoggingPolicy(localHttpLogOptions));
        httpPipelineBuilder.policies(policies.toArray(new HttpPipelinePolicy[0]));
        return httpPipelineBuilder.build();
    }

    /**
     * Builds an instance of CustomClient class.
     * 
     * @return an instance of CustomClient.
     */
    @Metadata(generated = true)
    public CustomClient buildClient() {
        return new CustomClient(buildInnerClient());
    }

    private static final ClientLogger LOGGER = new ClientLogger(CustomClientBuilder.class);
}