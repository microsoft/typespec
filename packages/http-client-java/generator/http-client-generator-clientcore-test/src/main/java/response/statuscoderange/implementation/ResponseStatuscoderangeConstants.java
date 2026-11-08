package response.statuscoderange.implementation;

import io.clientcore.core.utils.CoreUtils;
import java.lang.reflect.ParameterizedType;
import response.statuscoderange.DefaultError;
import response.statuscoderange.ErrorInRange;
import response.statuscoderange.NotFoundError;
import response.statuscoderange.Standard4XXError;

public final class ResponseStatuscoderangeConstants {
    public static final ParameterizedType ERROR_IN_RANGE_TYPE = CoreUtils.createParameterizedType(ErrorInRange.class);

    public static final ParameterizedType STANDARD4_XX_ERROR_TYPE
        = CoreUtils.createParameterizedType(Standard4XXError.class);

    public static final ParameterizedType NOT_FOUND_ERROR_TYPE = CoreUtils.createParameterizedType(NotFoundError.class);

    public static final ParameterizedType DEFAULT_ERROR_TYPE = CoreUtils.createParameterizedType(DefaultError.class);

    private ResponseStatuscoderangeConstants() {
    }
}
