// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
// Code generated by Microsoft (R) TypeSpec Code Generator.

package payload.pageable.implementation;

import com.azure.core.http.HttpPipeline;
import com.azure.core.http.HttpPipelineBuilder;
import com.azure.core.http.policy.RetryPolicy;
import com.azure.core.http.policy.UserAgentPolicy;
import com.azure.core.util.serializer.JacksonAdapter;
import com.azure.core.util.serializer.SerializerAdapter;

/**
 * Initializes a new instance of the PageableClient type.
 */
public final class PageableClientImpl {
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
     * The ServerDrivenPaginationsImpl object to access its operations.
     */
    private final ServerDrivenPaginationsImpl serverDrivenPaginations;

    /**
     * Gets the ServerDrivenPaginationsImpl object to access its operations.
     * 
     * @return the ServerDrivenPaginationsImpl object.
     */
    public ServerDrivenPaginationsImpl getServerDrivenPaginations() {
        return this.serverDrivenPaginations;
    }

    /**
     * The ServerDrivenPaginationContinuationTokensImpl object to access its operations.
     */
    private final ServerDrivenPaginationContinuationTokensImpl serverDrivenPaginationContinuationTokens;

    /**
     * Gets the ServerDrivenPaginationContinuationTokensImpl object to access its operations.
     * 
     * @return the ServerDrivenPaginationContinuationTokensImpl object.
     */
    public ServerDrivenPaginationContinuationTokensImpl getServerDrivenPaginationContinuationTokens() {
        return this.serverDrivenPaginationContinuationTokens;
    }

    /**
     * Initializes an instance of PageableClient client.
     * 
     * @param endpoint Service host.
     */
    public PageableClientImpl(String endpoint) {
        this(new HttpPipelineBuilder().policies(new UserAgentPolicy(), new RetryPolicy()).build(),
            JacksonAdapter.createDefaultSerializerAdapter(), endpoint);
    }

    /**
     * Initializes an instance of PageableClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param endpoint Service host.
     */
    public PageableClientImpl(HttpPipeline httpPipeline, String endpoint) {
        this(httpPipeline, JacksonAdapter.createDefaultSerializerAdapter(), endpoint);
    }

    /**
     * Initializes an instance of PageableClient client.
     * 
     * @param httpPipeline The HTTP pipeline to send requests through.
     * @param serializerAdapter The serializer to serialize an object into a string.
     * @param endpoint Service host.
     */
    public PageableClientImpl(HttpPipeline httpPipeline, SerializerAdapter serializerAdapter, String endpoint) {
        this.httpPipeline = httpPipeline;
        this.serializerAdapter = serializerAdapter;
        this.endpoint = endpoint;
        this.serverDrivenPaginations = new ServerDrivenPaginationsImpl(this);
        this.serverDrivenPaginationContinuationTokens = new ServerDrivenPaginationContinuationTokensImpl(this);
    }
}
