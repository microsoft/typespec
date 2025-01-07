// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package authentication.util;

import java.util.Objects;

import io.clientcore.core.credential.KeyCredential;
import io.clientcore.core.http.models.HttpHeaderName;
import io.clientcore.core.http.models.HttpHeaders;
import io.clientcore.core.http.models.HttpRequest;
import io.clientcore.core.http.models.Response;
import io.clientcore.core.http.pipeline.HttpPipelineNextPolicy;
import io.clientcore.core.http.pipeline.HttpPipelinePolicy;

/**
 * Pipeline policy that uses an {@link KeyCredential} to set the authorization key for a request.
 * <p>
 * Requests sent with this pipeline policy are required to use {@code HTTPS}. If the request isn't using {@code HTTPS}
 * an exception will be thrown to prevent leaking the key.
 */
public final class AzureKeyCredentialPolicy implements HttpPipelinePolicy {
    // AzureKeyCredentialPolicy can be a commonly used policy, use a static logger.
    private final HttpHeaderName name;
    private final KeyCredential credential;
    private final String prefix;

    /**
     * Creates a policy that uses the passed {@link KeyCredential} to set the specified header name.
     *
     * @param name The name of the key header that will be set to {@link KeyCredential#getKey()}.
     * @param credential The {@link KeyCredential} containing the authorization key to use.
     * @throws NullPointerException If {@code name} or {@code credential} is {@code null}.
     * @throws IllegalArgumentException If {@code name} is empty.
     */
    public AzureKeyCredentialPolicy(String name, KeyCredential credential) {
        this(HttpHeaderName.fromString(name), credential, null);
    }

    /**
     * Creates a policy that uses the passed {@link KeyCredential} to set the specified header name.
     * <p>
     * The {@code prefix} will be applied before the {@link KeyCredential#getKey()} when setting the header. A
     * space will be inserted between {@code prefix} and credential.
     *
     * @param name The name of the key header that will be set to {@link KeyCredential#getKey()}.
     * @param credential The {@link KeyCredential} containing the authorization key to use.
     * @param prefix The prefix to apply before the credential, for example "SharedAccessKey credential".
     * @throws NullPointerException If {@code name} or {@code credential} is {@code null}.
     * @throws IllegalArgumentException If {@code name} is empty.
     */
    public AzureKeyCredentialPolicy(String name, KeyCredential credential, String prefix) {
        this(HttpHeaderName.fromString(name), Objects.requireNonNull(credential, "'credential' cannot be null."),
            prefix);
    }

    AzureKeyCredentialPolicy(HttpHeaderName name, KeyCredential credential, String prefix) {
        this.name = name;
        this.credential = credential;
        this.prefix = prefix != null ? prefix.trim() : null;
    }

    @Override
    public Response process(HttpRequest request, HttpPipelineNextPolicy next) {
        setCredential(request.getHeaders());
        return next.process();
    }

    void setCredential(HttpHeaders headers) {
        String credential = this.credential.getKey();
        headers.set(name, (prefix == null) ? credential : prefix + " " + credential);
    }
}
