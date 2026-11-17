// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2013 IBM Corporation and others.
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

import java.util.List;

/**
 * Enumeration constant declaration AST node type (added in JLS3 API).
 *
 * <pre>
 * EnumConstantDeclaration:
 *     [ Javadoc ] { ExtendedModifier } Identifier
 *         [ <b>(</b> [ Expression { <b>,</b> Expression } ] <b>)</b> ]
 *         [ AnonymousClassDeclaration ]
 * </pre>
 *
 * <p> When a Javadoc comment is present, the source range begins with the first character of the "/**" comment
 * delimiter. When there is no Javadoc comment, the source range begins with the first character of the identifier. If
 * there are class body declarations, the source range extends through the last character of the last character of the
 * "}" token following the body declarations. If there are arguments but no class body declarations, the source range
 * extends through the last character of the ")" token following the arguments. If there are no arguments and no class
 * body declarations, the source range extends through the last character of the identifier. </p>
 *
 * @since 3.1
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class EnumConstantDeclaration extends BodyDeclaration {

    /**
     * The "javadoc" structural property of this node type (child type: {@link Javadoc}).
     */
    public static final ChildPropertyDescriptor JAVADOC_PROPERTY = internalJavadocPropertyFactory();

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}).
     */
    public static final ChildListPropertyDescriptor MODIFIERS2_PROPERTY = internalModifiers2PropertyFactory();

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The "arguments" structural property of this node type (element type: {@link Expression}).
     */
    public static final ChildListPropertyDescriptor ARGUMENTS_PROPERTY
        = new ChildListPropertyDescriptor(Expression.class, false);

    /**
     * The "anonymousClassDeclaration" structural property of this node type (child type:
     * {@link AnonymousClassDeclaration}).
     */
    public static final ChildPropertyDescriptor ANONYMOUS_CLASS_DECLARATION_PROPERTY
        = new ChildPropertyDescriptor(AnonymousClassDeclaration.class, true);

    /**
     * The constant name; lazily initialized; defaults to a unspecified, legal Java class identifier.
     */
    private SimpleName constantName;

    /**
     * The list of argument expressions (element type: {@link Expression}). Defaults to an empty list.
     */
    private final ASTNode.NodeList arguments = new ASTNode.NodeList(ARGUMENTS_PROPERTY);

    /**
     * The optional anonymous class declaration; <code>null</code> for none; defaults to none.
     */
    private AnonymousClassDeclaration optionalAnonymousClassDeclaration = null;

    /**
     * Creates a new AST node for an enumeration constants declaration owned by the given AST. By default, the
     * enumeration constant has an unspecified, but legal, name; no javadoc; an empty list of modifiers and annotations;
     * an empty list of arguments; and does not declare an anonymous class. <p> N.B. This constructor is
     * package-private; all subclasses must be declared in the same package; clients are unable to declare additional
     * subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    EnumConstantDeclaration(AST ast) {
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
        return 72;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getJavadoc());
            acceptChildren(visitor, this.modifiers);
            acceptChild(visitor, getName());
            acceptChildren(visitor, this.arguments);
            acceptChild(visitor, getAnonymousClassDeclaration());
        }

    }

    /**
     * Returns the name of the constant declared in this enum declaration.
     *
     * @return the constant name node
     */
    public SimpleName getName() {
        if (this.constantName == null) {
            this.constantName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
        }
        return this.constantName;
    }

    /**
     * Sets the name of the constant declared in this enum declaration to the given name.
     *
     * @param constantName the new constant name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName constantName) {

        ASTNode oldChild = this.constantName;
        preReplaceChild(oldChild, constantName, NAME_PROPERTY);
        this.constantName = constantName;

    }

    /**
     * Returns the live ordered list of argument expressions in this enumeration constant declaration. Note that an
     * empty list of arguments is equivalent to not explicitly specifying arguments.
     *
     * @return the live list of argument expressions (element type: {@link Expression})
     */
    public List arguments() {
        return this.arguments;
    }

    /**
     * Returns the anonymous class declaration introduced by this enum constant declaration, if it has one.
     *
     * @return the anonymous class declaration, or <code>null</code> if none
     */
    public AnonymousClassDeclaration getAnonymousClassDeclaration() {
        return this.optionalAnonymousClassDeclaration;
    }

    /**
     * Sets whether this enum constant declaration declares an anonymous class (that is, has class body declarations).
     *
     * @param decl the anonymous class declaration, or <code>null</code> if none
     */
    public void setAnonymousClassDeclaration(AnonymousClassDeclaration decl) {
        ASTNode oldChild = this.optionalAnonymousClassDeclaration;
        preReplaceChild(oldChild, decl, ANONYMOUS_CLASS_DECLARATION_PROPERTY);
        this.optionalAnonymousClassDeclaration = decl;

    }

}
