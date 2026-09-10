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

    private static BytesPropertyAccessor bytesPropertyAccessor;

    private static CollectionsBytePropertyAccessor collectionsBytePropertyAccessor;

    private static CollectionsModelPropertyAccessor collectionsModelPropertyAccessor;

    private static CollectionsStringPropertyAccessor collectionsStringPropertyAccessor;

    private static DatetimePropertyAccessor datetimePropertyAccessor;

    private static DurationPropertyAccessor durationPropertyAccessor;

    private static InnerModelAccessor innerModelAccessor;

    private static StringPropertyAccessor stringPropertyAccessor;

    public static BytesPropertyAccessor getBytesPropertyAccessor() {
        return bytesPropertyAccessor;
    }

    public static void setBytesPropertyAccessor(BytesPropertyAccessor accessor) {
        bytesPropertyAccessor = accessor;
    }

    public static CollectionsBytePropertyAccessor getCollectionsBytePropertyAccessor() {
        return collectionsBytePropertyAccessor;
    }

    public static void setCollectionsBytePropertyAccessor(CollectionsBytePropertyAccessor accessor) {
        collectionsBytePropertyAccessor = accessor;
    }

    public static CollectionsModelPropertyAccessor getCollectionsModelPropertyAccessor() {
        return collectionsModelPropertyAccessor;
    }

    public static void setCollectionsModelPropertyAccessor(CollectionsModelPropertyAccessor accessor) {
        collectionsModelPropertyAccessor = accessor;
    }

    public static CollectionsStringPropertyAccessor getCollectionsStringPropertyAccessor() {
        return collectionsStringPropertyAccessor;
    }

    public static void setCollectionsStringPropertyAccessor(CollectionsStringPropertyAccessor accessor) {
        collectionsStringPropertyAccessor = accessor;
    }

    public static DatetimePropertyAccessor getDatetimePropertyAccessor() {
        return datetimePropertyAccessor;
    }

    public static void setDatetimePropertyAccessor(DatetimePropertyAccessor accessor) {
        datetimePropertyAccessor = accessor;
    }

    public static DurationPropertyAccessor getDurationPropertyAccessor() {
        return durationPropertyAccessor;
    }

    public static void setDurationPropertyAccessor(DurationPropertyAccessor accessor) {
        durationPropertyAccessor = accessor;
    }

    public static InnerModelAccessor getInnerModelAccessor() {
        return innerModelAccessor;
    }

    public static void setInnerModelAccessor(InnerModelAccessor accessor) {
        innerModelAccessor = accessor;
    }

    public static StringPropertyAccessor getStringPropertyAccessor() {
        return stringPropertyAccessor;
    }

    public static void setStringPropertyAccessor(StringPropertyAccessor accessor) {
        stringPropertyAccessor = accessor;
    }

    public interface BytesPropertyAccessor {

        boolean isJsonMergePatch(BytesProperty bytesProperty);

        BytesProperty prepareModelForJsonMergePatch(BytesProperty bytesProperty, boolean jsonMergePatchEnabled);
    }

    public interface CollectionsBytePropertyAccessor {

        boolean isJsonMergePatch(CollectionsByteProperty collectionsByteProperty);

        CollectionsByteProperty prepareModelForJsonMergePatch(CollectionsByteProperty collectionsByteProperty,
            boolean jsonMergePatchEnabled);
    }

    public interface CollectionsModelPropertyAccessor {

        boolean isJsonMergePatch(CollectionsModelProperty collectionsModelProperty);

        CollectionsModelProperty prepareModelForJsonMergePatch(CollectionsModelProperty collectionsModelProperty,
            boolean jsonMergePatchEnabled);
    }

    public interface CollectionsStringPropertyAccessor {

        boolean isJsonMergePatch(CollectionsStringProperty collectionsStringProperty);

        CollectionsStringProperty prepareModelForJsonMergePatch(CollectionsStringProperty collectionsStringProperty,
            boolean jsonMergePatchEnabled);
    }

    public interface DatetimePropertyAccessor {

        boolean isJsonMergePatch(DatetimeProperty datetimeProperty);

        DatetimeProperty prepareModelForJsonMergePatch(DatetimeProperty datetimeProperty,
            boolean jsonMergePatchEnabled);
    }

    public interface DurationPropertyAccessor {

        boolean isJsonMergePatch(DurationProperty durationProperty);

        DurationProperty prepareModelForJsonMergePatch(DurationProperty durationProperty,
            boolean jsonMergePatchEnabled);
    }

    public interface InnerModelAccessor {

        boolean isJsonMergePatch(InnerModel innerModel);

        InnerModel prepareModelForJsonMergePatch(InnerModel innerModel, boolean jsonMergePatchEnabled);
    }

    public interface StringPropertyAccessor {

        boolean isJsonMergePatch(StringProperty stringProperty);

        StringProperty prepareModelForJsonMergePatch(StringProperty stringProperty, boolean jsonMergePatchEnabled);
    }
}
