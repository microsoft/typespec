package server.versions.versioned;

import io.clientcore.core.http.models.ServiceVersion;

/**
 * Service version of VersionedClient.
 */
public enum VersionedServiceVersion implements ServiceVersion {
    /**
     * Enum value 2021-01-01-preview.
     */
    V2021_01_01_PREVIEW("2021-01-01-preview"),

    /**
     * Enum value 2022-12-01-preview.
     */
    V2022_12_01_PREVIEW("2022-12-01-preview");

    private final String version;

    VersionedServiceVersion(String version) {
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
     * @return The latest {@link VersionedServiceVersion}.
     */
    public static VersionedServiceVersion getLatest() {
        return V2022_12_01_PREVIEW;
    }
}
