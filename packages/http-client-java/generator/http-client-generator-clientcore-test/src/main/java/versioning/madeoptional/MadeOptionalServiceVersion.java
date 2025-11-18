package versioning.madeoptional;

import io.clientcore.core.http.models.ServiceVersion;

/**
 * Service version of MadeOptionalClient.
 */
public enum MadeOptionalServiceVersion implements ServiceVersion {
    /**
     * Enum value v1.
     */
    V1("v1"),

    /**
     * Enum value v2.
     */
    V2("v2");

    private final String version;

    MadeOptionalServiceVersion(String version) {
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
     * @return The latest {@link MadeOptionalServiceVersion}.
     */
    public static MadeOptionalServiceVersion getLatest() {
        return V2;
    }
}
