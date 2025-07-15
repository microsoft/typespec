// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.extension.model.extensionmodel;

import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Operation;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Parameter;
import com.microsoft.typespec.http.client.generator.core.extension.model.codemodel.Property;
import java.util.List;

/**
 * Represents the pageable settings of a model.
 */
public class XmsPageable {
    private String itemName = "value";
    private String nextLinkName;
    private String operationName;
    private List<Property> pageItemsProperty;
    private List<Property> nextLinkProperty;
    private PageableContinuationToken continuationToken;
    private List<Parameter> nextLinkReInjectedParameters;

    // internal
    private Operation nextOperation;

    /**
     * Creates a new instance of the XmsPageable class.
     */
    public XmsPageable() {
    }

    /**
     * Gets the serialized name of the property in the pageable response that contains the list of page elements.
     *
     * @return The serialized name of the property referencing the list of page elements.
     */
    public String getItemName() {
        return itemName;
    }

    /**
     * Sets the serialized name of the property in the pageable response that contains the list of page elements.
     *
     * @param itemName The serialized name of the property referencing the list of page elements.
     */
    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    /**
     * Gets the name of the next link in the pageable response.
     *
     * @return The name of the next link in the pageable response.
     */
    public String getNextLinkName() {
        return nextLinkName;
    }

    /**
     * Sets the name of the next link in the pageable response.
     *
     * @param nextLinkName The name of the next link in the pageable response.
     */
    public void setNextLinkName(String nextLinkName) {
        this.nextLinkName = nextLinkName;
    }

    /**
     * Gets the name of the operation that retrieves the next page of items.
     *
     * @return The name of the operation that retrieves the next page of items.
     */
    public String getOperationName() {
        return operationName;
    }

    /**
     * Sets the name of the operation that retrieves the next page of items.
     *
     * @param operationName The name of the operation that retrieves the next page of items.
     */
    public void setOperationName(String operationName) {
        this.operationName = operationName;
    }

    public List<Property> getPageItemsProperty() {
        return pageItemsProperty;
    }

    public void setPageItemsProperty(List<Property> pageItemsProperty) {
        this.pageItemsProperty = pageItemsProperty;
    }

    public List<Property> getNextLinkProperty() {
        return nextLinkProperty;
    }

    public void setNextLinkProperty(List<Property> nextLinkProperty) {
        this.nextLinkProperty = nextLinkProperty;
    }

    public PageableContinuationToken getContinuationToken() {
        return continuationToken;
    }

    public void setContinuationToken(PageableContinuationToken continuationToken) {
        this.continuationToken = continuationToken;
    }

    /**
     * Gets nextLink re-injected parameters
     * 
     * @return a list of parameters
     */
    public List<Parameter> getNextLinkReInjectedParameters() {
        return nextLinkReInjectedParameters;
    }

    /**
     * Sets nextLink re-injected parameters
     * 
     * @param nextLinkReInjectedParameters
     */
    public void setNextLinkReInjectedParameters(List<Parameter> nextLinkReInjectedParameters) {
        this.nextLinkReInjectedParameters = nextLinkReInjectedParameters;
    }

    /**
     * Gets the operation that retrieves the next page of items.
     *
     * @return The operation that retrieves the next page of items.
     */
    public Operation getNextOperation() {
        return nextOperation;
    }

    /**
     * Sets the operation that retrieves the next page of items.
     *
     * @param nextOperation The operation that retrieves the next page of items.
     */
    public void setNextOperation(Operation nextOperation) {
        this.nextOperation = nextOperation;
    }

}
