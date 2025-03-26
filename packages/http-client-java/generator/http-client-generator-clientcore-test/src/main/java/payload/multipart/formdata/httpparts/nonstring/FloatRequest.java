package payload.multipart.formdata.httpparts.nonstring;

import io.clientcore.core.annotations.Metadata;
import io.clientcore.core.annotations.TypeConditions;

/**
 * The FloatRequest model.
 */
@Metadata(conditions = { TypeConditions.IMMUTABLE })
public final class FloatRequest {
    /*
     * The temperature property.
     */
    @Metadata(generated = true)
    private final double temperature;

    /**
     * Creates an instance of FloatRequest class.
     * 
     * @param temperature the temperature value to set.
     */
    @Metadata(generated = true)
    public FloatRequest(double temperature) {
        this.temperature = temperature;
    }

    /**
     * Get the temperature property: The temperature property.
     * 
     * @return the temperature value.
     */
    @Metadata(generated = true)
    public double getTemperature() {
        return this.temperature;
    }
}
