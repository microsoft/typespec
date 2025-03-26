package versioning.typechangedfrom;

import io.clientcore.core.http.models.ServiceVersion;

/**
 * Service version of TypeChangedFromClient.
 */
public enum TypeChangedFromServiceVersion implements ServiceVersion {
    /**
     * Enum value v1.
     */
    V1("v1"),

    /**
     * Enum value v2.
     */
    V2("v2");

    private final String version;

    TypeChangedFromServiceVersion(String version) {
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
     * @return The latest {@link TypeChangedFromServiceVersion}.
     */
    public static TypeChangedFromServiceVersion getLatest() {
        return V2;
    }
}
