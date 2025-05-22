// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import java.util.List;
import java.util.Map;
import org.eclipse.lsp4j.Range;

/**
 * The Javadoc customization for an AutoRest generated classes and methods.
 */
public interface JavadocCustomization<T extends JavadocCustomization<T>> {
    /**
     * Gets the range of the Javadoc customization.
     *
     * @return The range of the Javadoc customization.
     */
    Range getJavadocRange();

    /**
     * Replaces the current Javadoc customization's content with the content of another Javadoc customization.
     *
     * @param other The other Javadoc customization to replace with.
     * @return The updated Javadoc customization object.
     */
    T replace(T other);

    /**
     * Gets the Javadoc description.
     *
     * @return The Javadoc description.
     */
    String getDescription();

    /**
     * Sets the description in the Javadoc.
     *
     * @param description the description for the current class/method.
     * @return the Javadoc customization object for chaining
     */
    JavadocCustomization setDescription(String description);

    /**
     * Gets a read-only view of the Javadoc params.
     *
     * @return Read-only view of the Javadoc params.
     */
    Map<String, String> getParams();

    /**
     * Sets the param Javadoc for a parameter on the method.
     *
     * @param parameterName the parameter name on the method
     * @param description the description for this parameter
     * @return the Javadoc customization object for chaining
     */
    JavadocCustomization setParam(String parameterName, String description);

    /**
     * Removes a parameter Javadoc on the method.
     *
     * @param parameterName the name of the parameter on the method
     * @return the Javadoc customization object for chaining
     */
    JavadocCustomization removeParam(String parameterName);

    /**
     * Gets the Javadoc return.
     *
     * @return The Javadoc return.
     */
    String getReturn();

    /**
     * Sets the return Javadoc on the method.
     *
     * @param description the description for the return value
     * @return the Javadoc customization object for chaining
     */
    JavadocCustomization setReturn(String description);

    /**
     * Removes the return Javadoc for a method.
     *
     * @return the Javadoc customization object for chaining
     */
    JavadocCustomization removeReturn();

    /**
     * Gets a read-only view of the Javadoc throws.
     *
     * @return Read-only view of the Javadoc throws.
     */
    Map<String, String> getThrows();

    /**
     * Adds a throws Javadoc for a method.
     *
     * @param exceptionType the type of the exception the method will throw
     * @param description the description for the exception
     * @return the Javadoc customization object for chaining
     */
    JavadocCustomization addThrows(String exceptionType, String description);

    /**
     * Removes a throw Javadoc for a method.
     *
     * @param exceptionType the type of the exception the method will throw
     * @return the Javadoc customization object for chaining
     */
    JavadocCustomization removeThrows(String exceptionType);

    /**
     * Gets a read-only view of the Javadoc sees.
     *
     * @return Read-only view of the Javadoc sees.
     */
    List<String> getSees();

    /**
     * Adds a see Javadoc.
     *
     * @param seeDoc the link to the extra documentation
     * @return the Javadoc customization object for chaining
     * @see <a href="https://docs.oracle.com/javase/7/docs/technotes/tools/windows/javadoc.html#see">Oracle docs on see
     * tag</a>
     */
    JavadocCustomization addSee(String seeDoc);

    /**
     * Gets the Javadoc since.
     *
     * @return The Javadoc since.
     */
    String getSince();

    /**
     * Sets the since Javadoc on the method.
     *
     * @param sinceDoc the version for the since tag
     * @return the Javadoc customization object for chaining
     */
    JavadocCustomization setSince(String sinceDoc);

    /**
     * Removes the Javadoc since.
     *
     * @return The updated JavadocCustomization object.
     */
    JavadocCustomization removeSince();

    /**
     * Gets the Javadoc deprecated.
     *
     * @return The Javadoc deprecated.
     */
    String getDeprecated();

    /**
     * Sets the deprecated Javadoc on the method.
     *
     * @param deprecatedDoc the deprecation reason
     * @return the Javadoc customization object for chaining
     */
    JavadocCustomization setDeprecated(String deprecatedDoc);

    /**
     * Removes the Javadoc deprecated.
     *
     * @return The updated JavadocCustomization object.
     */
    JavadocCustomization removeDeprecated();
}
