package versioning.renamedfrom;

import io.clientcore.core.http.models.ServiceVersion;

/**
 * Service version of RenamedFromClient.
 */
public enum RenamedFromServiceVersion implements ServiceVersion {
    /**
     * Enum value v1.
     */
    V1("v1"),

    /**
     * Enum value v2.
     */
    V2("v2");

    private final String version;

    RenamedFromServiceVersion(String version) {
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
     * @return The latest {@link RenamedFromServiceVersion}.
     */
    public static RenamedFromServiceVersion getLatest() {
        return V2;
    }
}
