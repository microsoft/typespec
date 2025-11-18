package versioning.removed;

import io.clientcore.core.http.models.ServiceVersion;

/**
 * Service version of RemovedClient.
 */
public enum RemovedServiceVersion implements ServiceVersion {
    /**
     * Enum value v1.
     */
    V1("v1"),

    /**
     * Enum value v2preview.
     */
    V2PREVIEW("v2preview"),

    /**
     * Enum value v2.
     */
    V2("v2");

    private final String version;

    RemovedServiceVersion(String version) {
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
     * @return The latest {@link RemovedServiceVersion}.
     */
    public static RemovedServiceVersion getLatest() {
        return V2;
    }
}
