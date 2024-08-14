// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.model.clientmodel;

import com.microsoft.typespec.http.client.generator.core.model.javamodel.JavaBlock;

import java.util.function.Consumer;

/**
 * Class containing the details of a method in a trait interface.
 */
public class ClientBuilderTraitMethod {
    private String methodName;
    private ClassType methodParamType;
    private String methodParamName;
    private String documentation;
    private ServiceClientProperty property;
    private Consumer<JavaBlock> methodImpl;

    /**
     * Returns the name of the method defined in the trait interface.
     * @return The name of the trait method.
     */
    public String getMethodName() {
        return methodName;
    }

    /**
     * Sets the name of the method defined in the trait interface.
     * @param methodName  The method name.
     */
    public void setMethodName(String methodName) {
        this.methodName = methodName;
    }

    /**
     * Return the type of the method param.
     * @return The type of the method param.
     */
    public ClassType getMethodParamType() {
        return methodParamType;
    }

    /**
     * Sets the type of the method param.
     * @param methodParamType The type of the method param.
     */
    public void setMethodParamType(ClassType methodParamType) {
        this.methodParamType = methodParamType;
    }

    /**
     * Returns the name of the method param.
     * @return The name of the method param.
     */
    public String getMethodParamName() {
        return methodParamName;
    }

    /**
     * Sets the name of the method param.
     * @param methodParamName The name of the method param.
     */
    public void setMethodParamName(String methodParamName) {
        this.methodParamName = methodParamName;
    }

    /**
     * Returns the JavaDoc string for this trait method.
     * @return The JavaDoc string for this trait method.
     */
    public String getDocumentation() {
        return documentation;
    }

    /**
     * Sets the JavaDoc string for this trait method.
     * @param documentation The JavaDoc string for this trait method.
     */
    public void setDocumentation(String documentation) {
        this.documentation = documentation;
    }

    /**
     * Returns the property this trait method is applicable to.
     * @return the property this trait method is applicable to.
     */
    public ServiceClientProperty getProperty() {
        return property;
    }

    /**
     * Set the property this trait method is applicable to.
     * @param property  the property this trait method is applicable to.
     */
    public void setProperty(ServiceClientProperty property) {
        this.property = property;
    }

    /**
     * Returns the callback that provides the implementation of this trait method.
     * @return the callback that provides the implementation of this trait method.
     */
    public Consumer<JavaBlock> getMethodImpl() {
        return methodImpl;
    }

    /**
     * Sets the callback that provides the implementation of this trait method.
     * @param methodImpl  the callback that provides the implementation of this trait method.
     */
    public void setMethodImpl(Consumer<JavaBlock> methodImpl) {
        this.methodImpl = methodImpl;
    }
}
