// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2018 IBM Corporation and others.
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
 * Type node for a named class type, a named interface type, or a type variable.
 *
 * <pre>
 * SimpleType:
 *    { Annotation } TypeName
 * </pre>
 *
 * <p> This kind of node is used to convert a name ({@link Name}) into a type ({@link Type}) by wrapping it. </p>
 * <p>
 * In JLS8 and later, the SimpleType may have optional annotations. If annotations are present, then the name must be a
 * {@link SimpleName}. Annotated qualified names are represented as {@link QualifiedType} or {@link NameQualifiedType}.
 *
 * @see QualifiedType
 * @see NameQualifiedType
 *
 * @since 2.0
 */
public class SimpleType extends AnnotatableType {

    /**
     * The "annotations" structural property of this node type (element type: {@link Annotation}).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor ANNOTATIONS_PROPERTY = internalAnnotationsPropertyFactory();

    /**
     * The "name" structural property of this node type (child type: {@link Name}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(Name.class, false);

    /**
     * The type name node; lazily initialized; defaults to a type with an unspecified, but legal, name.
     */
    private Name typeName;

    /**
     * Creates a new unparented node for a simple type owned by the given AST. By default, an unspecified, but legal,
     * name. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    SimpleType(AST ast) {
        super(ast);
    }

    /*
     * (omit javadoc for this method) Method declared on AnnotatableType.
     *
     * @since 3.10
     */
    @Override
    final ChildListPropertyDescriptor internalAnnotationsProperty() {
        return ANNOTATIONS_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 43;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        // visit children in normal left to right reading order
        acceptChildren(visitor, this.annotations);
        acceptChild(visitor, getName());
    }

    /**
     * Returns the name of this simple type.
     *
     * @return the name of this simple type
     */
    public Name getName() {
        if (this.typeName == null) {
            this.typeName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
        }
        return this.typeName;
    }

    /**
     * Sets the name of this simple type to the given name.
     *
     * @param typeName the new name of this simple type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(Name typeName) {
        if (typeName == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.typeName;
        preReplaceChild(oldChild, typeName, NAME_PROPERTY);
        this.typeName = typeName;

    }

}
