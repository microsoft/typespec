package versioning.added;

import io.clientcore.core.http.models.ServiceVersion;

/**
 * Service version of AddedClient.
 */
public enum AddedServiceVersion implements ServiceVersion {
    /**
     * Enum value v1.
     */
    V1("v1"),

    /**
     * Enum value v2.
     */
    V2("v2");

    private final String version;

    AddedServiceVersion(String version) {
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
     * @return The latest {@link AddedServiceVersion}.
     */
    public static AddedServiceVersion getLatest() {
        return V2;
    }
}
