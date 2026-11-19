// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2013, 2014 IBM Corporation and others.
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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

/**
 * Node for a name-qualified type (added in JLS8 API).
 *
 * <pre>
 * NameQualifiedType:
 *    Name <b>.</b> { Annotation } SimpleName
 * </pre>
 *
 * <p> The qualifier can resolve to a type or to a package. </p> <p> Note that if no annotation is present, then a
 * name-qualified type can also be represented by a SimpleType or a QualifiedType, see the discussion in
 * {@link QualifiedType}. </p>
 *
 * @see SimpleType
 * @see QualifiedType
 *
 * @since 3.10
 */
public class NameQualifiedType extends AnnotatableType {

    /**
     * The "qualifier" structural property of this node type (child type: {@link Name}).
     */
    public static final ChildPropertyDescriptor QUALIFIER_PROPERTY = new ChildPropertyDescriptor(Name.class, false);

    /**
     * The "annotations" structural property of this node type (element type: {@link Annotation}).
     */
    public static final ChildListPropertyDescriptor ANNOTATIONS_PROPERTY = internalAnnotationsPropertyFactory();

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The qualifier node; lazily initialized; defaults to an unspecified, but legal, simple name.
     */
    private Name qualifier;

    /**
     * The name being qualified; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private SimpleName name;

    /**
     * Creates a new unparented node for a name-qualified type owned by the given AST. By default, an unspecified, but
     * legal, qualifier and name. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    NameQualifiedType(AST ast) {
        super(ast);

    }

    @Override
    ChildListPropertyDescriptor internalAnnotationsProperty() {
        return ANNOTATIONS_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 88;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        // visit children in normal left to right reading order
        acceptChild(visitor, getQualifier());
        acceptChildren(visitor, this.annotations);
        acceptChild(visitor, getName());
    }

    /**
     * Returns the qualifier of this name-qualified type.
     *
     * @return the qualifier of this name-qualified type
     */
    public Name getQualifier() {
        if (this.qualifier == null) {
            this.qualifier = postLazyInit(new SimpleName(this.ast), QUALIFIER_PROPERTY);
        }
        return this.qualifier;
    }

    /**
     * Sets the qualifier of this name-qualified type to the given name.
     *
     * @param name the new qualifier of this name-qualified type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setQualifier(Name name) {

        ASTNode oldChild = this.qualifier;
        preReplaceChild(oldChild, name, QUALIFIER_PROPERTY);
        this.qualifier = name;

    }

    /**
     * Returns the name part of this name-qualified type.
     *
     * @return the name being qualified
     */
    public SimpleName getName() {
        if (this.name == null) {
            this.name = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
        }
        return this.name;
    }

    /**
     * Sets the name part of this name-qualified type to the given simple name.
     *
     * @param name the identifier of this qualified name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName name) {

        ASTNode oldChild = this.name;
        preReplaceChild(oldChild, name, NAME_PROPERTY);
        this.name = name;

    }
}
