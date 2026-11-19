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
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom;

/**
 * Annotation type member declaration AST node type (added in JLS3 API).
 *
 * <pre>
 * AnnotationTypeMemberDeclaration:
 *   [ Javadoc ] { ExtendedModifier }
 *       Type Identifier <b>(</b> <b>)</b> [ <b>default</b> Expression ] <b>;</b>
 * </pre>
 *
 * <p> Note that annotation type member declarations are only meaningful as elements of
 * {@link AnnotationTypeDeclaration#bodyDeclarations()}. </p> <p> When a Javadoc comment is present, the source range
 * begins with the first character of the "/**" comment delimiter. When there is no Javadoc comment, the source range
 * begins with the first character of the first modifier keyword (if modifiers), or the first character of the member
 * type (no modifiers). The source range extends through the last character of the ";" token. </p>
 *
 * @since 3.1
 */
public class AnnotationTypeMemberDeclaration extends BodyDeclaration {

    /**
     * The "javadoc" structural property of this node type (child type: {@link Javadoc}).
     */
    public static final ChildPropertyDescriptor JAVADOC_PROPERTY = internalJavadocPropertyFactory();

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}).
     */
    public static final ChildListPropertyDescriptor MODIFIERS2_PROPERTY = internalModifiers2PropertyFactory();

    /**
     * The "type" structural property of this node type (child type: {@link Type}).
     */
    public static final ChildPropertyDescriptor TYPE_PROPERTY = new ChildPropertyDescriptor(Type.class, false);

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The "default" structural property of this node type (child type: {@link Expression}).
     */
    public static final ChildPropertyDescriptor DEFAULT_PROPERTY = new ChildPropertyDescriptor(Expression.class, true);

    /**
     * The member type; lazily initialized; defaults to int.
     */
    private Type memberType;

    /**
     * The member name; lazily initialized; defaults to an unspecified, legal Java identifier.
     */
    private SimpleName memberName;

    /**
     * The optional default expression; <code>null</code> for none; defaults to none.
     */
    private Expression optionalDefaultValue = null;

    /**
     * Creates a new AST node for an annotation type member declaration owned by the given AST. By default, the
     * declaration is for a member of an unspecified, but legal, name; no modifiers; no javadoc; an unspecified value
     * type; and no default value. <p> N.B. This constructor is package-private; all subclasses must be declared in the
     * same package; clients are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    AnnotationTypeMemberDeclaration(AST ast) {
        super(ast);

    }

    @Override
    final ChildPropertyDescriptor internalJavadocProperty() {
        return JAVADOC_PROPERTY;
    }

    @Override
    final ChildListPropertyDescriptor internalModifiers2Property() {
        return MODIFIERS2_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 82;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getJavadoc());
            acceptChildren(visitor, this.modifiers);
            acceptChild(visitor, getType());
            acceptChild(visitor, getName());
            acceptChild(visitor, getDefault());
        }

    }

    /**
     * Returns the type of the annotation type member declared in this declaration.
     *
     * @return the type of the member
     */
    public Type getType() {
        if (this.memberType == null) {
            this.memberType = postLazyInit(this.ast.newPrimitiveType(PrimitiveType.INT), TYPE_PROPERTY);
        }
        return this.memberType;
    }

    /**
     * Sets the type of the annotation type member declared in this declaration to the given type.
     *
     * @param type the new member type
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setType(Type type) {
        if (type == null) {
            throw new IllegalArgumentException();
        }
        ASTNode oldChild = this.memberType;
        preReplaceChild(oldChild, type, TYPE_PROPERTY);
        this.memberType = type;

    }

    /**
     * Returns the name of the annotation type member declared in this declaration.
     *
     * @return the member name node
     */
    public SimpleName getName() {
        if (this.memberName == null) {
            this.memberName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
        }
        return this.memberName;
    }

    /**
     * Sets the name of the annotation type member declared in this declaration to the given name.
     *
     * @param memberName the new member name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName memberName) {

        ASTNode oldChild = this.memberName;
        preReplaceChild(oldChild, memberName, NAME_PROPERTY);
        this.memberName = memberName;

    }

    /**
     * Returns the default value of this annotation type member, or <code>null</code> if there is none.
     *
     * @return the expression node, or <code>null</code> if there is none
     */
    public Expression getDefault() {
        return this.optionalDefaultValue;
    }

    /**
     * Sets or clears the default value of this annotation type member.
     *
     * @param defaultValue the expression node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setDefault(Expression defaultValue) {
        // a AnnotationTypeMemberDeclaration may occur inside an Expression - must check cycles
        ASTNode oldChild = this.optionalDefaultValue;
        preReplaceChild(oldChild, defaultValue, DEFAULT_PROPERTY);
        this.optionalDefaultValue = defaultValue;

    }

}
