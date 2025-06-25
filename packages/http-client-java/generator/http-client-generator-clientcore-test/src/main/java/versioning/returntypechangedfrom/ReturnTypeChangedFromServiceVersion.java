package versioning.returntypechangedfrom;

import io.clientcore.core.http.models.ServiceVersion;

/**
 * Service version of ReturnTypeChangedFromClient.
 */
public enum ReturnTypeChangedFromServiceVersion implements ServiceVersion {
    /**
     * Enum value v1.
     */
    V1("v1"),

    /**
     * Enum value v2.
     */
    V2("v2");

    private final String version;

    ReturnTypeChangedFromServiceVersion(String version) {
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
     * @return The latest {@link ReturnTypeChangedFromServiceVersion}.
     */
    public static ReturnTypeChangedFromServiceVersion getLatest() {
        return V2;
    }
}
