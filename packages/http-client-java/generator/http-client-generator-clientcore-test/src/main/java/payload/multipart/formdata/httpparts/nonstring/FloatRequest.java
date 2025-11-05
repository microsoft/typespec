package payload.multipart.formdata.httpparts.nonstring;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.MetadataProperties;

/**
 * The FloatRequest model.
 */
@Metadata(properties = { MetadataProperties.IMMUTABLE })
public final class FloatRequest {

    /*
     * The temperature property.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    private final double temperature;

    /**
     * Creates an instance of FloatRequest class.
     *
     * @param temperature the temperature value to set.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public FloatRequest(double temperature) {
        this.temperature = temperature;
    }

    /**
     * Get the temperature property: The temperature property.
     *
     * @return the temperature value.
     */
    @Metadata(properties = { MetadataProperties.GENERATED })
    public double getTemperature() {
        return this.temperature;
    }
}
