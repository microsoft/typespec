// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2004, 2013 IBM Corporation and others.
 *
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *     IBM Corporation - initial API and implementation
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

/**
 * Abstract base class for property descriptors of AST nodes. There are three kinds of properties: <ul> <li>simple
 * properties ({@link SimplePropertyDescriptor}) - properties where the value is a primitive (int, boolean) or simple
 * (String, InfixExpression.Operator) type other than an AST node; for example, the identifier of a
 * {@link SimpleName}</li> <li>child properties ({@link ChildPropertyDescriptor}) - properties whose value is another
 * AST node; for example, the name of a {@link MethodDeclaration}</li> <li>child list properties
 * ({@link ChildListPropertyDescriptor}) - properties where the value is a list of AST nodes; for example, the
 * statements of a {@link Block}</li> </ul>
 *
 * @since 3.0
 * @noextend This class is not intended to be subclassed by clients.
 */
@SuppressWarnings("rawtypes")
public abstract class StructuralPropertyDescriptor {

    /**
     * Property id.
     */
    private final String propertyId;

    /**
     * The concrete AST node type that owns this property.
     */
    private final Class nodeClass;

    /**
     * Creates a new property descriptor for the given node type with the given property id. Note that this constructor
     * is declared package-private so that property descriptors can only be created by the AST implementation.
     *
     * @param nodeClass concrete AST node type that owns this property
     * @param propertyId the property id
     */
    StructuralPropertyDescriptor(Class nodeClass, String propertyId) {
        if (nodeClass == null || propertyId == null) {
            throw new IllegalArgumentException();
        }
        this.propertyId = propertyId;
        this.nodeClass = nodeClass;
    }

    /**
     * Returns the AST node type that owns this property. <p> For example, for all properties of the node type
     * TypeDeclaration, this method returns <code>TypeDeclaration.class</code>. </p>
     *
     * @return the node type that owns this property
     */
    public final Class getNodeClass() {
        return this.nodeClass;
    }

    /**
     * Returns whether this property is a simple property (instance of {@link SimplePropertyDescriptor}.
     *
     * @return <code>true</code> if this is a simple property, and <code>false</code> otherwise
     */
    public final boolean isSimpleProperty() {
        return (this instanceof SimplePropertyDescriptor);
    }

    /**
     * Returns whether this property is a child property (instance of {@link ChildPropertyDescriptor}.
     *
     * @return <code>true</code> if this is a child property, and <code>false</code> otherwise
     */
    public final boolean isChildProperty() {
        return (this instanceof ChildPropertyDescriptor);
    }

    /**
     * Returns whether this property is a child list property (instance of {@link ChildListPropertyDescriptor}.
     *
     * @return <code>true</code> if this is a child list property, and <code>false</code> otherwise
     */
    public final boolean isChildListProperty() {
        return (this instanceof ChildListPropertyDescriptor);
    }

    /**
     * Returns a string suitable for debug purposes.
     *
     * @return {@inheritDoc}
     */
    @Override
    public String toString() {
        StringBuilder b = new StringBuilder();
        if (isChildListProperty()) {
            b.append("ChildList"); //$NON-NLS-1$
        }
        if (isChildProperty()) {
            b.append("Child"); //$NON-NLS-1$
        }
        if (isSimpleProperty()) {
            b.append("Simple"); //$NON-NLS-1$
        }
        b.append("Property["); //$NON-NLS-1$
        if (this.nodeClass != null) {
            b.append(this.nodeClass.getName());
        }
        b.append(","); //$NON-NLS-1$
        if (this.propertyId != null) {
            b.append(this.propertyId);
        }
        b.append("]"); //$NON-NLS-1$
        return b.toString();
    }
}
