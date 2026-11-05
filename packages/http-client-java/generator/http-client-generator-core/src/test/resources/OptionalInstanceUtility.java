import java.util.Locale;
import java.util.function.UnaryOperator;

public final class OptionalInstanceUtility {
    private static final String PREFIX = prefix();
    private static final String SUFFIX;
    private final String value;
    private UnaryOperator<String> formatter;

    static {
        SUFFIX = initialize();
    }

    {
        formatter = this::format;
    }

    public OptionalInstanceUtility() {
        this("example");
    }

    private OptionalInstanceUtility(String value) {
        this.value = normalize(value);
    }

    public String getValue() {
        return this.formatter.apply(this.value);
    }

    private String format(String value) {
        return PREFIX + value + SUFFIX;
    }

    private static String normalize(String value) {
        return value.trim();
    }

    private static String prefix() {
        return ":";
    }

    private static String initialize() {
        return "!";
    }

    public String unused(String value) {
        return value.toUpperCase(Locale.ROOT);
    }
}

