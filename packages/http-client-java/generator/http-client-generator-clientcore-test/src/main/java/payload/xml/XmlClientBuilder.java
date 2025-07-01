package payload.xml;

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
import payload.xml.implementation.XmlClientImpl;

/**
 * A builder for creating a new instance of the XmlClient type.
 */
@ServiceClientBuilder(
    serviceClients = {
        SimpleModelValueClient.class,
        ModelWithSimpleArraysValueClient.class,
        ModelWithArrayOfModelValueClient.class,
        ModelWithOptionalFieldValueClient.class,
        ModelWithAttributesValueClient.class,
        ModelWithUnwrappedArrayValueClient.class,
        ModelWithRenamedArraysValueClient.class,
        ModelWithRenamedFieldsValueClient.class,
        ModelWithEmptyArrayValueClient.class,
        ModelWithTextValueClient.class,
        ModelWithDictionaryValueClient.class,
        ModelWithEncodedNamesValueClient.class })
public final class XmlClientBuilder implements HttpTrait<XmlClientBuilder>, ProxyTrait<XmlClientBuilder>,
    ConfigurationTrait<XmlClientBuilder>, EndpointTrait<XmlClientBuilder> {
    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_NAME = "name";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private static final String SDK_VERSION = "version";

    @Metadata(properties = { MetadataProperties.GENERATED })
    private final List<HttpPipelinePolicy> pipelinePolicies;

    /**
     * Create an instance of the XmlClientBuilder.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public XmlClientBuilder() {
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
    public XmlClientBuilder httpClient(HttpClient httpClient) {
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
    public XmlClientBuilder httpRetryOptions(HttpRetryOptions retryOptions) {
        this.retryOptions = retryOptions;
        return this;
    }

    /**
     * {@inheritDoc}.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    @Override
    public XmlClientBuilder addHttpPipelinePolicy(HttpPipelinePolicy customPolicy) {
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
    public XmlClientBuilder httpRedirectOptions(HttpRedirectOptions redirectOptions) {
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
    public XmlClientBuilder httpInstrumentationOptions(HttpInstrumentationOptions httpInstrumentationOptions) {
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
    public XmlClientBuilder proxyOptions(ProxyOptions proxyOptions) {
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
    public XmlClientBuilder configuration(Configuration configuration) {
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
    public XmlClientBuilder endpoint(String endpoint) {
        this.endpoint = endpoint;
        return this;
    }

    /**
     * Builds an instance of XmlClientImpl with the provided parameters.
     * 
     * @return an instance of XmlClientImpl.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private XmlClientImpl buildInnerClient() {
        this.validateClient();
        String localEndpoint = (endpoint != null) ? endpoint : "http://localhost:3000";
        XmlClientImpl client = new XmlClientImpl(createHttpPipeline(), localEndpoint);
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
     * Builds an instance of SimpleModelValueClient class.
     * 
     * @return an instance of SimpleModelValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public SimpleModelValueClient buildSimpleModelValueClient() {
        return new SimpleModelValueClient(buildInnerClient().getSimpleModelValues());
    }

    /**
     * Builds an instance of ModelWithSimpleArraysValueClient class.
     * 
     * @return an instance of ModelWithSimpleArraysValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithSimpleArraysValueClient buildModelWithSimpleArraysValueClient() {
        return new ModelWithSimpleArraysValueClient(buildInnerClient().getModelWithSimpleArraysValues());
    }

    /**
     * Builds an instance of ModelWithArrayOfModelValueClient class.
     * 
     * @return an instance of ModelWithArrayOfModelValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithArrayOfModelValueClient buildModelWithArrayOfModelValueClient() {
        return new ModelWithArrayOfModelValueClient(buildInnerClient().getModelWithArrayOfModelValues());
    }

    /**
     * Builds an instance of ModelWithOptionalFieldValueClient class.
     * 
     * @return an instance of ModelWithOptionalFieldValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithOptionalFieldValueClient buildModelWithOptionalFieldValueClient() {
        return new ModelWithOptionalFieldValueClient(buildInnerClient().getModelWithOptionalFieldValues());
    }

    /**
     * Builds an instance of ModelWithAttributesValueClient class.
     * 
     * @return an instance of ModelWithAttributesValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithAttributesValueClient buildModelWithAttributesValueClient() {
        return new ModelWithAttributesValueClient(buildInnerClient().getModelWithAttributesValues());
    }

    /**
     * Builds an instance of ModelWithUnwrappedArrayValueClient class.
     * 
     * @return an instance of ModelWithUnwrappedArrayValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithUnwrappedArrayValueClient buildModelWithUnwrappedArrayValueClient() {
        return new ModelWithUnwrappedArrayValueClient(buildInnerClient().getModelWithUnwrappedArrayValues());
    }

    /**
     * Builds an instance of ModelWithRenamedArraysValueClient class.
     * 
     * @return an instance of ModelWithRenamedArraysValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithRenamedArraysValueClient buildModelWithRenamedArraysValueClient() {
        return new ModelWithRenamedArraysValueClient(buildInnerClient().getModelWithRenamedArraysValues());
    }

    /**
     * Builds an instance of ModelWithRenamedFieldsValueClient class.
     * 
     * @return an instance of ModelWithRenamedFieldsValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithRenamedFieldsValueClient buildModelWithRenamedFieldsValueClient() {
        return new ModelWithRenamedFieldsValueClient(buildInnerClient().getModelWithRenamedFieldsValues());
    }

    /**
     * Builds an instance of ModelWithEmptyArrayValueClient class.
     * 
     * @return an instance of ModelWithEmptyArrayValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithEmptyArrayValueClient buildModelWithEmptyArrayValueClient() {
        return new ModelWithEmptyArrayValueClient(buildInnerClient().getModelWithEmptyArrayValues());
    }

    /**
     * Builds an instance of ModelWithTextValueClient class.
     * 
     * @return an instance of ModelWithTextValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithTextValueClient buildModelWithTextValueClient() {
        return new ModelWithTextValueClient(buildInnerClient().getModelWithTextValues());
    }

    /**
     * Builds an instance of ModelWithDictionaryValueClient class.
     * 
     * @return an instance of ModelWithDictionaryValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithDictionaryValueClient buildModelWithDictionaryValueClient() {
        return new ModelWithDictionaryValueClient(buildInnerClient().getModelWithDictionaryValues());
    }

    /**
     * Builds an instance of ModelWithEncodedNamesValueClient class.
     * 
     * @return an instance of ModelWithEncodedNamesValueClient.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public ModelWithEncodedNamesValueClient buildModelWithEncodedNamesValueClient() {
        return new ModelWithEncodedNamesValueClient(buildInnerClient().getModelWithEncodedNamesValues());
    }
}
