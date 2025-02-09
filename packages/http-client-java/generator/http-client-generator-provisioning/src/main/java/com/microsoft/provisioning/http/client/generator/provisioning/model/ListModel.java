package com.microsoft.provisioning.http.client.generator.provisioning.model;

/**
 * Simple wrapper for a list of nested models.
 */
public class ListModel extends ModelBase {
    private final ModelBase elementType;

    /**
     * Constructs a new ListModel.
     *
     * @param elementType Type of values.
     */
    public ListModel(ModelBase elementType) {
        super("List<" + elementType.getName() + ">", "com.azure.provisioning");
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
        return "List<" + elementType.getTypeReference() + ">";
    }

    @Override
    public String bicepValueExpression(String reference) {
        return String.format("BicepList.from(%s)", reference);
    }
}
