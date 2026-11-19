// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2021 IBM Corporation and others.
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
 * Method declaration AST node type. A method declaration is the union of a method declaration and a constructor
 * declaration.
 *
 * <pre>
 * MethodDeclaration:
 *    [ Javadoc ] { ExtendedModifier } [ <b>&lt;</b> TypeParameter { <b>,</b> TypeParameter } <b>&gt;</b> ] ( Type | <b>void</b> )
 *        Identifier <b>(</b>
 *            [ ReceiverParameter <b>,</b> ] [ FormalParameter { <b>,</b> FormalParameter } ]
 *        <b>)</b> { Dimension }
 *        [ <b>throws</b> Type { <b>,</b> Type } ]
 *        ( Block | <b>;</b> )
 * ConstructorDeclaration:
 *    [ Javadoc ] { ExtendedModifier } [ <b>&lt;</b> TypeParameter { <b>,</b> TypeParameter } <b>&gt;</b> ]
 *        Identifier <b>(</b>
 *            [ ReceiverParameter <b>,</b> ] [ FormalParameter { <b>,</b> FormalParameter } ]
 *        <b>)</b> { Dimension }
 *        [ <b>throws</b> Type { <b>,</b> Type } ]
 *        ( Block | <b>;</b> )
 * </pre>
 *
 * <p> The ReceiverParameter is represented as: <code>Type [ SimpleName <b>.</b> ] <b>this</b></code><br> The
 * FormalParameter is represented by a {@link SingleVariableDeclaration}. </p> <p> When a Javadoc comment is present,
 * the source range begins with the first character of the "/**" comment delimiter. When there is no Javadoc comment,
 * the source range begins with the first character of the first modifier keyword (if modifiers), or the first character
 * of the "&lt;" token (method, no modifiers, type parameters), or the first character of the return type (method, no
 * modifiers, no type parameters), or the first character of the identifier (constructor, no modifiers). The source
 * range extends through the last character of the ";" token (if no body), or the last character of the block (if body).
 * </p>
 *
 * @since 2.0
 */
public class MethodDeclaration extends BodyDeclaration {

    /**
     * The "javadoc" structural property of this node type (child type: {@link Javadoc}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor JAVADOC_PROPERTY = internalJavadocPropertyFactory();

    /**
     * The "modifiers" structural property of this node type (element type: {@link IExtendedModifier}) (added in JLS3
     * API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor MODIFIERS2_PROPERTY = internalModifiers2PropertyFactory();

    /**
     * The "name" structural property of this node type (child type: {@link SimpleName}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor NAME_PROPERTY = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The "returnType2" structural property of this node type (child type: {@link Type}) (added in JLS3 API).
     *
     * @since 3.1
     */
    public static final ChildPropertyDescriptor RETURN_TYPE2_PROPERTY = new ChildPropertyDescriptor(Type.class, false);

    /**
     * The "extraDimensions2" structural property of this node type (element type: {@link Dimension}) (added in JLS8
     * API).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor EXTRA_DIMENSIONS2_PROPERTY
        = new ChildListPropertyDescriptor(Dimension.class, false);

    /**
     * The "typeParameters" structural property of this node type (element type: {@link TypeParameter}) (added in JLS3
     * API).
     *
     * @since 3.1
     */
    public static final ChildListPropertyDescriptor TYPE_PARAMETERS_PROPERTY
        = new ChildListPropertyDescriptor(TypeParameter.class, false);

    /**
     * The "parameters" structural property of this node type (element type: {@link SingleVariableDeclaration}).
     *
     * @since 3.0
     */
    public static final ChildListPropertyDescriptor PARAMETERS_PROPERTY
        = new ChildListPropertyDescriptor(SingleVariableDeclaration.class, true);

    /**
     * The "receiverType" structural property of this node type (child type: {@link Type}) (added in JLS8 API).
     *
     * @since 3.10
     */
    public static final ChildPropertyDescriptor RECEIVER_TYPE_PROPERTY = new ChildPropertyDescriptor(Type.class, false);

    /**
     * The "receiverQualifier" structural property of this node type (child type: {@link SimpleName}) (added in JLS8
     * API).
     *
     * @since 3.10
     */
    public static final ChildPropertyDescriptor RECEIVER_QUALIFIER_PROPERTY
        = new ChildPropertyDescriptor(SimpleName.class, false);

    /**
     * The "thrownExceptionTypes" structural property of this node type (element type: {@link Type}) (added in JLS8
     * API).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor THROWN_EXCEPTION_TYPES_PROPERTY
        = new ChildListPropertyDescriptor(Type.class, false);

    /**
     * The "body" structural property of this node type (child type: {@link Block}).
     *
     * @since 3.0
     */
    public static final ChildPropertyDescriptor BODY_PROPERTY = new ChildPropertyDescriptor(Block.class, true);

    /**
     * <code>true</code> for a constructor, <code>false</code> for a method. Defaults to method.
     */
    private boolean isConstructor = false;

    /**
     * The method name; lazily initialized; defaults to an unspecified, legal Java identifier.
     */
    private SimpleName methodName;

    /**
     * The explicit receiver type, or <code>null</code> if none. Defaults to none.
     *
     * @since 3.10
     */
    private Type optionalReceiverType;

    /**
     * Qualifying name of the explicit </code>this</code> parameter, or <code>null</code> if none. Defaults to none.
     *
     * @since 3.10
     */
    private SimpleName optionalReceiverQualifier;

    /**
     * The parameter declarations (element type: {@link SingleVariableDeclaration}). Defaults to an empty list.
     */
    private final ASTNode.NodeList<SingleVariableDeclaration> parameters = new ASTNode.NodeList<>(PARAMETERS_PROPERTY);

    /**
     * The return type. JLS2 behavior: lazily initialized; defaults to void. JLS3 and later: lazily initialized;
     * defaults to void; null allowed. Note that this field is ignored for constructor declarations.
     */
    private Type returnType = null;

    /**
     * Indicated whether the return type has been initialized.
     *
     * @since 3.1
     */
    private boolean returnType2Initialized = false;

    /**
     * The type paramters (element type: {@link TypeParameter}). Null in JLS2. Added in JLS3; defaults to an empty list
     * (see constructor).
     *
     * @since 3.1
     */
    private final ASTNode.NodeList<TypeParameter> typeParameters;

    /**
     * List of extra dimensions this node has with optional annotations (element type: {@link Dimension}). Null before
     * JLS8. Added in JLS8; defaults to an empty list (see constructor).
     *
     * @since 3.10
     */
    private final ASTNode.NodeList<Dimension> extraDimensions;

    /**
     * The list of thrown exception Types (element type: {@link Type}). Null before JLS8. Added in JLS8; defaults to an
     * empty list (see constructor).
     *
     * @since 3.10
     */
    private final ASTNode.NodeList<Type> thrownExceptionTypes;

    /**
     * The method body, or <code>null</code> if none. Defaults to none.
     */
    private Block optionalBody = null;

    /**
     * Creates a new AST node for a method declaration owned by the given AST. By default, the declaration is for a
     * method of an unspecified, but legal, name; no modifiers; no javadoc; no type parameters; void return type; no
     * parameters; no array dimensions after the parameters; no thrown exceptions; and no body (as opposed to an empty
     * body). <p> N.B. This constructor is package-private; all subclasses must be declared in the same package; clients
     * are unable to declare additional subclasses. </p>
     *
     * @param ast the AST that is to own this node
     */
    MethodDeclaration(AST ast) {
        super(ast);
        this.typeParameters = new ASTNode.NodeList<>(TYPE_PARAMETERS_PROPERTY);
        this.extraDimensions = new ASTNode.NodeList<>(EXTRA_DIMENSIONS2_PROPERTY);
        this.thrownExceptionTypes = new ASTNode.NodeList<>(THROWN_EXCEPTION_TYPES_PROPERTY);
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
        return 31;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChild(visitor, getJavadoc());
            acceptChildren(visitor, this.modifiers);
            acceptChildren(visitor, this.typeParameters);
            acceptChild(visitor, getReturnType2());
            // n.b. visit return type even for constructors
            acceptChild(visitor, getName());
            acceptChild(visitor, this.optionalReceiverType);
            acceptChild(visitor, this.optionalReceiverQualifier);
            acceptChildren(visitor, this.parameters);
            acceptChildren(visitor, this.extraDimensions);
            acceptChildren(visitor, this.thrownExceptionTypes);
            acceptChild(visitor, getBody());
        }

    }

    /**
     * Returns whether this declaration declares a constructor or a method.
     *
     * @return <code>true</code> if this is a constructor declaration, and <code>false</code> if this is a method
     * declaration
     */
    public boolean isConstructor() {
        return this.isConstructor;
    }

    /**
     * Sets whether this declaration declares a constructor or a method.
     *
     * @param isConstructor <code>true</code> for a constructor declaration, and <code>false</code> for a method
     * declaration
     */
    public void setConstructor(boolean isConstructor) {
        this.isConstructor = isConstructor;

    }

    /**
     * Returns the live ordered list of type parameters of this method declaration (added in JLS3 API). This list is
     * non-empty for parameterized methods.
     *
     * @return the live list of type parameters (element type: {@link TypeParameter})
     * @since 3.1
     */
    public List<TypeParameter> typeParameters() {
        return this.typeParameters;
    }

    /**
     * Returns the name of the method declared in this method declaration. For a constructor declaration, this should be
     * the same as the name of the class.
     *
     * @return the method name node
     */
    public SimpleName getName() {
        if (this.methodName == null) {
            this.methodName = postLazyInit(new SimpleName(this.ast), NAME_PROPERTY);
        }
        return this.methodName;
    }

    /**
     * Sets the name of the method declared in this method declaration to the given name. For a constructor declaration,
     * this should be the same as the name of the class.
     *
     * @param methodName the new method name
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public void setName(SimpleName methodName) {

        ASTNode oldChild = this.methodName;
        preReplaceChild(oldChild, methodName, NAME_PROPERTY);
        this.methodName = methodName;

    }

    /**
     * Returns the receiver type explicitly declared in the method or constructor declaration (added in JLS8 API).
     * <p>
     * If the receiver is not explicitly declared in the method or constructor declaration, <code>null</code> is
     * returned.
     *
     * @return the receiver type or <code>null</code> if receiver is not declared explicitly
     * @since 3.10
     */
    public Type getReceiverType() {

        return this.optionalReceiverType;
    }

    /**
     * Sets or clears the given type as the type of explicit receiver parameter (added in JLS8 API). <p> A receiver type
     * is only legal in Java code if it appears on an instance method or on a constructor of an inner class. </p>
     *
     * @param receiverType type of the explicit receiver parameter, or <code>null</code> if there is none
     * @since 3.10
     */
    public void setReceiverType(Type receiverType) {

        ASTNode oldChild = this.optionalReceiverType;
        preReplaceChild(oldChild, receiverType, RECEIVER_TYPE_PROPERTY);
        this.optionalReceiverType = receiverType;

    }

    /**
     * Sets the given simple name as the qualifier for the receiver (added in JLS8 API).
     *
     * @param receiverQualifier explicit receiver parameter to be added to the method declaration
     * @since 3.10
     */
    public void setReceiverQualifier(SimpleName receiverQualifier) {

        ASTNode oldChild = this.optionalReceiverQualifier;
        preReplaceChild(oldChild, receiverQualifier, RECEIVER_QUALIFIER_PROPERTY);
        this.optionalReceiverQualifier = receiverQualifier;

    }

    /**
     * Returns the live ordered list of method parameter declarations for this method declaration.
     *
     * @return the live list of method parameter declarations (element type: {@link SingleVariableDeclaration})
     */
    public List<SingleVariableDeclaration> parameters() {
        return this.parameters;
    }

    /**
     * Returns the live ordered list of thrown exception types in this method declaration.
     *
     * @return the live list of exception types (element type: {@link Type})
     * @since 3.10
     */
    public List<Type> thrownExceptionTypes() {

        return this.thrownExceptionTypes;
    }

    /**
     * Returns the return type of the method declared in this method declaration, exclusive of any extra array
     * dimensions (added in JLS3 API). This is one of the few places where the void type is meaningful. <p> Note that
     * this child is not relevant for constructor declarations (although, if present, it does still figure in subtree
     * equality comparisons and visits), and is devoid of the binding information ordinarily available. In the JLS2 API,
     * the return type is mandatory. In the JLS3 API, the return type is optional. </p>
     *
     * @return the return type, possibly the void primitive type, or <code>null</code> if none
     * @since 3.1
     */
    public Type getReturnType2() {

        if (this.returnType == null && !this.returnType2Initialized) {
            this.returnType = postLazyInit(this.ast.newPrimitiveType(PrimitiveType.VOID), RETURN_TYPE2_PROPERTY);
            this.returnType2Initialized = true;
        }
        return this.returnType;
    }

    /**
     * Sets the return type of the method declared in this method declaration to the given type, exclusive of any extra
     * array dimensions (added in JLS3 API). This is one of the few places where the void type is meaningful. <p> Note
     * that this child is not relevant for constructor declarations (although it does still figure in subtree equality
     * comparisons and visits). In the JLS2 API, the return type is mandatory. In the JLS3 API, the return type is
     * optional. </p>
     *
     * @param type the new return type, possibly the void primitive type, or <code>null</code> if none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     * @since 3.1
     */
    public void setReturnType2(Type type) {

        this.returnType2Initialized = true;
        ASTNode oldChild = this.returnType;
        preReplaceChild(oldChild, type, RETURN_TYPE2_PROPERTY);
        this.returnType = type;

    }

    /**
     * Returns the live ordered list of extra dimensions with optional annotations (added in JLS8 API).
     *
     * @return the live list of extra dimensions with optional annotations (element type: {@link Dimension})
     * @since 3.10
     */
    public List<Dimension> extraDimensions() {
        return this.extraDimensions;
    }

    /**
     * Returns the body of this method declaration, or <code>null</code> if this method has <b>no</b> body. <p> Note
     * that there is a subtle difference between having no body and having an empty body ("{}"). </p>
     *
     * @return the method body, or <code>null</code> if this method has no body
     */
    public Block getBody() {
        return this.optionalBody;
    }

    /**
     * Sets or clears the body of this method declaration. <p> Note that there is a subtle difference between having no
     * body (as in <code>"void foo();"</code>) and having an empty body (as in "void foo() {}"). Abstract methods, and
     * methods declared in interfaces, have no body. Non-abstract methods, and all constructors, have a body. </p>
     *
     * @param body the block node, or <code>null</code> if there is none
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>a cycle in would be created</li> </ul>
     */
    public void setBody(Block body) {
        // a MethodDeclaration may occur in a Block - must check cycles
        ASTNode oldChild = this.optionalBody;
        preReplaceChild(oldChild, body, BODY_PROPERTY);
        this.optionalBody = body;

    }

}
