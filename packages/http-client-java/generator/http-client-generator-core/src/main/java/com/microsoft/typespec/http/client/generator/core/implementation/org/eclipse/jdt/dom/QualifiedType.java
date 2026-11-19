// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2003, 2014 IBM Corporation and others.
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
 * Type node for a qualified type (added in JLS3 API).
 *
 * <pre>
 * QualifiedType:
 *    Type <b>.</b> { Annotation } SimpleName
 * </pre>
 *
 * <p> Not all node arrangements will represent legal Java constructs. In particular, it is nonsense if the type is an
 * array type or primitive type. The normal use is when the type is a ParameterizedType, an annotated QualifiedType, or
 * a NameQualifiedType. </p> <p> A "."-separated type like "A.B" can be represented in three ways:
 *
 * <pre>
 * 1.    SimpleType       | 2. NameQualifiedType   | 3.  QualifiedType
 *     QualifiedName      | SimpleName  SimpleName | SimpleType  SimpleName
 * SimpleName  SimpleName |     "A"         "B"    | SimpleName      "B"
 *     "A"         "B"    |                        |     "A"
 * </pre>
 *
 * <p> The ASTParser creates the SimpleType form (wrapping a name) if possible. The SimpleType form doesn't support any
 * embedded Annotations nor ParameterizedTypes. The NameQualifiedType form is only available since JLS8 and the
 * QualifiedType form only since JLS3. The NameQualifiedType and QualifiedType forms allow Annotations on the last
 * SimpleName. The QualifiedType form cannot be used if the qualifier represents a package name. </p> <p> The part
 * before the last "." is called the <em>qualifier</em> of a type. If the name after the last "." has annotations or if
 * the qualifier is not a (possibly qualified) name, then the ASTParser creates either a NameQualifiedType or a
 * QualifiedType: </p> <ul> <li> If the qualifier is a (possibly qualified) name, then a NameQualifiedType is created.
 * </li> <li> Otherwise, a QualifiedType is created and its qualifier is built using the same rules. </li> </ul>
 *
 * @see SimpleType
 * @see NameQualifiedType
 *
 * @since 3.1
 */
public class QualifiedType extends AnnotatableType {

    /**
     * The "qualifier" structural property of this node type (child type: {@link Type}).
     */
    public static final ChildPropertyDescriptor QUALIFIER_PROPERTY = new ChildPropertyDescriptor(Type.class, true);

    /**
     * The "annotations" structural property of this node type (element type: {@link Annotation}).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor ANNOTATIONS_PROPERTY = internalAnnotationsPropertyFactory();

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The type node; lazily initialized; defaults to a type with an unspecified, but legal, simple name.
     */
    private Type qualifier;

    /**
     * The name being qualified; lazily initialized; defaults to a unspecified, legal Java identifier.
     */
    private SimpleName name;

    /**
     * Creates a new unparented node for a qualified type owned by the given AST. By default, an unspecified, but legal,
     * qualifier and name. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    QualifiedType(AST ast) {
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
        return 75;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        // visit children in normal left to right reading order
        acceptChild(visitor, getQualifier());
        acceptChildren(visitor, this.annotations);
        acceptChild(visitor, getName());
    }

    /**
     * Returns the qualifier of this qualified type.
     *
     * @return the qualifier of this qualified type
     */
    public Type getQualifier() {
        if (this.qualifier == null) {
            this.qualifier = postLazyInit(new SimpleType(this.ast), QUALIFIER_PROPERTY);
        }
        return this.qualifier;
    }

    /**
     * Sets the qualifier of this qualified type to the given type.
     *
     * @param type the new qualifier of this qualified type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setQualifier(Type type) {

        ASTNode oldChild = this.qualifier;
        preReplaceChild(oldChild, type, QUALIFIER_PROPERTY);
        this.qualifier = type;

    }

    /**
     * Returns the name part of this qualified type.
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
     * Sets the name part of this qualified type to the given simple name.
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
