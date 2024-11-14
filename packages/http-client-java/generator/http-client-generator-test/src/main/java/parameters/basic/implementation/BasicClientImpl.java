// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package parameters.basic.implementation;

import com.azure.core.http.HttpPipeline;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.policy.RetryPolicy;
import com.azure.core.http.policy.UserAgentPolicy;
import com.azure.core.util.serializer.JacksonAdapter;
import com.azure.core.util.serializer.SerializerAdapter;

/**
 * Initializes a new instance of the BasicClient type.
 */
public final class BasicClientImpl {
    /**
     * Service host.
     */
    private final String endpoint;

    /**
     * Gets Service host.
     * 
     * @return the endpoint value.
     */
    public String getEndpoint() {
        return this.endpoint;
    }

    /**
     * The HTTP pipeline to send requests through.
     */
    private final HttpPipeline httpPipeline;

    /**
     * Gets The HTTP pipeline to send requests through.
     * 
     * @return the httpPipeline value.
     */
    public HttpPipeline getHttpPipeline() {
        return this.httpPipeline;
    }

    /**
     * The serializer to serialize an object into a string.
     */
    private final SerializerAdapter serializerAdapter;

    /**
     * Gets The serializer to serialize an object into a string.
     * 
     * @return the serializerAdapter value.
     */
    public SerializerAdapter getSerializerAdapter() {
        return this.serializerAdapter;
    }

    /**
     * The ExplicitBodiesImpl object to access its operations.
     */
    private final ExplicitBodiesImpl explicitBodies;

    /**
     * Gets the ExplicitBodiesImpl object to access its operations.
     * 
     * @return the ExplicitBodiesImpl object.
     */
    public ExplicitBodiesImpl getExplicitBodies() {
        return this.explicitBodies;
    }

    /**
     * The ImplicitBodiesImpl object to access its operations.
     */
    private final ImplicitBodiesImpl implicitBodies;

    /**
     * Gets the ImplicitBodiesImpl object to access its operations.
     * 
     * @return the ImplicitBodiesImpl object.
     */
    public ImplicitBodiesImpl getImplicitBodies() {
        return this.implicitBodies;
    }

    /**
     * Initializes an instance of BasicClient client.
     * 
     * @param endpoint Service host.
     */
    public BasicClientImpl(String endpoint) {
        this(new HttpPipelineBuilder().policies(new UserAgentPolicy(), new RetryPolicy()).build(),
            JacksonAdapter.createDefaultSerializerAdapter(), endpoint);
    }

    /**
     * Initializes an instance of BasicClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public BasicClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this(httpPipeline, JacksonAdapter.createDefaultSerializerAdapter(), endpoint);
    }

    /**
     * Initializes an instance of BasicClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param serializerAdapter The serializer to serialize an object into a string.
     * @param endpoint Service host.
     */
    public BasicClientImpl(HttpPipeline httpPipeline, SerializerAdapter serializerAdapter, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.serializerAdapter = serializerAdapter;
        this.endpoint = endpoint;
        this.explicitBodies = new ExplicitBodiesImpl(this);
        this.implicitBodies = new ImplicitBodiesImpl(this);
    }
}
