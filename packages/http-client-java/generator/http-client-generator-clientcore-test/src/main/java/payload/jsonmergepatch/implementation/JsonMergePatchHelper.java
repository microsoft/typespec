package payload.jsonmergepatch.implementation;

import payload.jsonmergepatch.InnerModel;
import payload.jsonmergepatch.ResourcePatch;

/**
 * This is the Helper class to enable json merge patch serialization for a model.
 */
public class JsonMergePatchHelper {

    private static InnerModelAccessor innerModelAccessor;

    private static ResourcePatchAccessor resourcePatchAccessor;

    public static InnerModelAccessor getInnerModelAccessor() {
        return innerModelAccessor;
    }

    public static void setInnerModelAccessor(InnerModelAccessor accessor) {
        innerModelAccessor = accessor;
    }

    public static ResourcePatchAccessor getResourcePatchAccessor() {
        return resourcePatchAccessor;
    }

    public static void setResourcePatchAccessor(ResourcePatchAccessor accessor) {
        resourcePatchAccessor = accessor;
    }

    public interface InnerModelAccessor {

        boolean isJsonMergePatch(InnerModel innerModel);

        InnerModel prepareModelForJsonMergePatch(InnerModel innerModel, boolean jsonMergePatchEnabled);
    }

    public interface ResourcePatchAccessor {

        boolean isJsonMergePatch(ResourcePatch resourcePatch);

        ResourcePatch prepareModelForJsonMergePatch(ResourcePatch resourcePatch, boolean jsonMergePatchEnabled);
    }
}
