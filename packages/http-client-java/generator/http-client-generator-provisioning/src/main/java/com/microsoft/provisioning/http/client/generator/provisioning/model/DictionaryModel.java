package com.microsoft.provisioning.http.client.generator.provisioning.model;

/**
 * Simple wrapper for a dictionary of nested models. Keys are always strings.
 */
public class DictionaryModel extends ModelBase {
    private final ModelBase elementType;

    /**
     * Constructs a new DictionaryModel.
     *
     * @param elementType Type of values.
     */
    public DictionaryModel(ModelBase elementType) {
        super("Map<String," + elementType.getName() + ">", "com.azure.provisioning");
        this.elementType = elementType;
    }

    /**
     * Gets the type of values.
     *
     * @return the element type.
     */
    public ModelBase getElementType() {
        return elementType;
    }

    @Override
    public String getTypeReference() {
        return "Map<string, " + elementType.getTypeReference() + ">";
    }
}
