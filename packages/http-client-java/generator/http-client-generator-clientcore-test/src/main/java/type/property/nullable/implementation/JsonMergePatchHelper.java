package type.property.nullable.implementation;

import type.property.nullable.BytesProperty;
import type.property.nullable.CollectionsByteProperty;
import type.property.nullable.CollectionsModelProperty;
import type.property.nullable.CollectionsStringProperty;
import type.property.nullable.DatetimeProperty;
import type.property.nullable.DurationProperty;
import type.property.nullable.InnerModel;
import type.property.nullable.StringProperty;

/**
 * This is the Helper class to enable json merge patch serialization for a model.
 */
public class JsonMergePatchHelper {
    private static StringPropertyAccessor stringPropertyAccessor;

    public interface StringPropertyAccessor {
        StringProperty prepareModelForJsonMergePatch(StringProperty stringProperty, boolean jsonMergePatchEnabled);

        boolean isJsonMergePatch(StringProperty stringProperty);
    }

    public static void setStringPropertyAccessor(StringPropertyAccessor accessor) {
        stringPropertyAccessor = accessor;
    }

    public static StringPropertyAccessor getStringPropertyAccessor() {
        return stringPropertyAccessor;
    }

    private static BytesPropertyAccessor bytesPropertyAccessor;

    public interface BytesPropertyAccessor {
        BytesProperty prepareModelForJsonMergePatch(BytesProperty bytesProperty, boolean jsonMergePatchEnabled);

        boolean isJsonMergePatch(BytesProperty bytesProperty);
    }

    public static void setBytesPropertyAccessor(BytesPropertyAccessor accessor) {
        bytesPropertyAccessor = accessor;
    }

    public static BytesPropertyAccessor getBytesPropertyAccessor() {
        return bytesPropertyAccessor;
    }

    private static DatetimePropertyAccessor datetimePropertyAccessor;

    public interface DatetimePropertyAccessor {
        DatetimeProperty prepareModelForJsonMergePatch(DatetimeProperty datetimeProperty,
            boolean jsonMergePatchEnabled);

        boolean isJsonMergePatch(DatetimeProperty datetimeProperty);
    }

    public static void setDatetimePropertyAccessor(DatetimePropertyAccessor accessor) {
        datetimePropertyAccessor = accessor;
    }

    public static DatetimePropertyAccessor getDatetimePropertyAccessor() {
        return datetimePropertyAccessor;
    }

    private static DurationPropertyAccessor durationPropertyAccessor;

    public interface DurationPropertyAccessor {
        DurationProperty prepareModelForJsonMergePatch(DurationProperty durationProperty,
            boolean jsonMergePatchEnabled);

        boolean isJsonMergePatch(DurationProperty durationProperty);
    }

    public static void setDurationPropertyAccessor(DurationPropertyAccessor accessor) {
        durationPropertyAccessor = accessor;
    }

    public static DurationPropertyAccessor getDurationPropertyAccessor() {
        return durationPropertyAccessor;
    }

    private static CollectionsBytePropertyAccessor collectionsBytePropertyAccessor;

    public interface CollectionsBytePropertyAccessor {
        CollectionsByteProperty prepareModelForJsonMergePatch(CollectionsByteProperty collectionsByteProperty,
            boolean jsonMergePatchEnabled);

        boolean isJsonMergePatch(CollectionsByteProperty collectionsByteProperty);
    }

    public static void setCollectionsBytePropertyAccessor(CollectionsBytePropertyAccessor accessor) {
        collectionsBytePropertyAccessor = accessor;
    }

    public static CollectionsBytePropertyAccessor getCollectionsBytePropertyAccessor() {
        return collectionsBytePropertyAccessor;
    }

    private static CollectionsModelPropertyAccessor collectionsModelPropertyAccessor;

    public interface CollectionsModelPropertyAccessor {
        CollectionsModelProperty prepareModelForJsonMergePatch(CollectionsModelProperty collectionsModelProperty,
            boolean jsonMergePatchEnabled);

        boolean isJsonMergePatch(CollectionsModelProperty collectionsModelProperty);
    }

    public static void setCollectionsModelPropertyAccessor(CollectionsModelPropertyAccessor accessor) {
        collectionsModelPropertyAccessor = accessor;
    }

    public static CollectionsModelPropertyAccessor getCollectionsModelPropertyAccessor() {
        return collectionsModelPropertyAccessor;
    }

    private static InnerModelAccessor innerModelAccessor;

    public interface InnerModelAccessor {
        InnerModel prepareModelForJsonMergePatch(InnerModel innerModel, boolean jsonMergePatchEnabled);

        boolean isJsonMergePatch(InnerModel innerModel);
    }

    public static void setInnerModelAccessor(InnerModelAccessor accessor) {
        innerModelAccessor = accessor;
    }

    public static InnerModelAccessor getInnerModelAccessor() {
        return innerModelAccessor;
    }

    private static CollectionsStringPropertyAccessor collectionsStringPropertyAccessor;

    public interface CollectionsStringPropertyAccessor {
        CollectionsStringProperty prepareModelForJsonMergePatch(CollectionsStringProperty collectionsStringProperty,
            boolean jsonMergePatchEnabled);

        boolean isJsonMergePatch(CollectionsStringProperty collectionsStringProperty);
    }

    public static void setCollectionsStringPropertyAccessor(CollectionsStringPropertyAccessor accessor) {
        collectionsStringPropertyAccessor = accessor;
    }

    public static CollectionsStringPropertyAccessor getCollectionsStringPropertyAccessor() {
        return collectionsStringPropertyAccessor;
    }
}
