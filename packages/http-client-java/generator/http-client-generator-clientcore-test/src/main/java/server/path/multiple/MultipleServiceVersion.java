package server.path.multiple;

import io.clientcore.core.http.models.ServiceVersion;

/**
 * Service version of MultipleClient.
 */
public enum MultipleServiceVersion implements ServiceVersion {
    /**
     * Enum value v1.0.
     */
    V1_0("v1.0");

    private final String version;

    MultipleServiceVersion(String version) {
        this.version = version;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String getVersion() {
        return this.version;
    }

    /**
     * Gets the latest service version supported by this client library.
     * 
     * @return The latest {@link MultipleServiceVersion}.
     */
    public static MultipleServiceVersion getLatest() {
        return V1_0;
    }
}
