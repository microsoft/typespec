package payload.jsonmergepatch.implementation;

import payload.jsonmergepatch.InnerModel;
import payload.jsonmergepatch.ResourcePatch;

/**
 * This is the Helper class to enable json merge patch serialization for a model.
 */
public class JsonMergePatchHelper {
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

    private static ResourcePatchAccessor resourcePatchAccessor;

    public interface ResourcePatchAccessor {
        ResourcePatch prepareModelForJsonMergePatch(ResourcePatch resourcePatch, boolean jsonMergePatchEnabled);

        boolean isJsonMergePatch(ResourcePatch resourcePatch);
    }

    public static void setResourcePatchAccessor(ResourcePatchAccessor accessor) {
        resourcePatchAccessor = accessor;
    }

    public static ResourcePatchAccessor getResourcePatchAccessor() {
        return resourcePatchAccessor;
    }
}
