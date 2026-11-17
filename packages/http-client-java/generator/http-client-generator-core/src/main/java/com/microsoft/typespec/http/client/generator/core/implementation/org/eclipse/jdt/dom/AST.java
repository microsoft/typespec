// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2025 IBM Corporation and others.
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

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.compiler.parser.Scanner;

/**
 * Umbrella owner and abstract syntax tree node factory. An <code>AST</code> instance serves as the common owner of any
 * number of AST nodes, and as the factory for creating new AST nodes owned by that instance. <p> Abstract syntax trees
 * may be hand constructed by clients, using the <code>new<i>TYPE</i></code> factory methods to create new nodes, and
 * the various <code>set<i>CHILD</i></code> methods (see
 * {@link com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.dom.ASTNode ASTNode} and
 * its
 * subclasses) to connect them together. </p> <p> Each AST node belongs to a unique AST instance, called the owning AST.
 * The children of an AST node always have the same owner as their parent node. If a node from one AST is to be added to
 * a different AST, the subtree must be cloned first to ensures that the added nodes have the correct owning AST. </p>
 * <p> There can be any number of AST nodes owned by a single AST instance that are unparented. Each of these nodes is
 * the root of a separate little tree of nodes. The method <code>ASTNode.getRoot()</code> navigates from any node to the
 * root of the tree that it is contained in. Ordinarily, an AST instance has one main tree (rooted at a
 * <code>CompilationUnit</code>), with newly-created nodes appearing as additional roots until they are parented
 * somewhere under the main tree. One can navigate from any node to its AST instance, but not conversely. </p> <p> The
 * class {@link ASTParser} parses a string containing a Java source code and returns an abstract syntax tree for it. The
 * resulting nodes carry source ranges relating the node back to the original source characters. </p> <p> Clients may
 * create instances of this class using {@link #newAST()}, but this class is not intended to be subclassed. </p>
 *
 * @see ASTParser
 * @see ASTNode
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "unchecked" })
public final class AST {

    /**
     * Creates a new Java abstract syntax tree (AST) following the latest supported set of API rules.
     *
     * @return new AST instance following the specified set of API rules.
     * @since 3.19
     */
    public static AST newAST() {
        return new AST();
    }

    /**
     * Java Scanner used to validate preconditions for the creation of specific nodes like CharacterLiteral,
     * NumberLiteral, StringLiteral or SimpleName.
     */
    Scanner scanner;

    /**
     * Creates a new Java abstract syntax tree (AST) following the specified set of API rules.
     *
     * @since 3.0
     */
    private AST() {
        // Generated code is at most Java 11, so the scanner reads Java 11 source.
        this.scanner = new Scanner(true /* comment */, true /* whitespace */, 3604480L /* sourceLevel */,
            3604480L /* complianceLevel */, null/* taskTag */, null/* taskPriorities */, true/* taskCaseSensitive */,
            false/* isPreviewEnabled */);
    }

    /*
     * (omit javadoc for this method) This method is a copy of setName(String[]) that doesn't do any validation.
     */
    Name internalNewName(String[] identifiers) {
        int count = identifiers.length;
        if (count == 0) {
            throw new IllegalArgumentException();
        }
        final SimpleName simpleName = new SimpleName(this);
        simpleName.internalSetIdentifier(identifiers[0]);
        Name result = simpleName;
        for (int i = 1; i < count; i++) {
            SimpleName name = new SimpleName(this);
            name.internalSetIdentifier(identifiers[i]);
            result = newQualifiedName(result, name);
        }
        return result;
    }

    /**
     * Creates and returns a new unparented annotation type declaration node for an unspecified, but legal, name; no
     * modifiers; no javadoc; and an empty list of member declarations.
     *
     * @return a new unparented annotation type declaration node
     * @since 3.1
     */
    public AnnotationTypeDeclaration newAnnotationTypeDeclaration() {
        return new AnnotationTypeDeclaration(this);
    }

    /**
     * Creates and returns a new unparented array type node with the given element type, which cannot be an array type
     * for API levels JLS8 and later. By default, the array type has one non-annotated dimension. <p> For JLS4 and
     * before, the given component type may be another array type. </p>
     *
     * @param elementType element type for API level JLS8 and later, or the component type (possibly another array type)
     * for levels less than JLS8
     * @return a new unparented array type node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>API level is JLS8 or later and type is an array type</li> </ul>
     */
    public ArrayType newArrayType(Type elementType) {
        ArrayType result;

        if (elementType.isArrayType()) {
            throw new IllegalArgumentException();
        }
        result = new ArrayType(this);
        result.setElementType(elementType);
        return result;
    }

    /**
     * Creates and returns a new unparented array type node with the given element type and number of dimensions. <p>
     * For JLS4 and before, the element type passed in can be an array type, but in that case, the element type of the
     * result will not be the same as what was passed in. For JLS4 and before, the dimensions cannot be 0. </p>
     *
     * @param elementType the element type (cannot be an array type for JLS8 and later)
     * @param dimensions the number of dimensions, a non-negative number
     * @return a new unparented array type node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> <li>the element type is null</li> <li>the number of dimensions is lower than 0 (for JLS4 and
     * before: lower than 1)</li> <li>the number of dimensions is greater than 255</li> <li>for levels from JLS8 and
     * later, if the element type is an array type </li> </ul>
     */
    public ArrayType newArrayType(Type elementType, int dimensions) {
        if (elementType == null) {
            throw new IllegalArgumentException();
        }
        ArrayType result;

        // level >= JLS8
        if (elementType.isArrayType()) {
            throw new IllegalArgumentException();
        }
        result = new ArrayType(this, 0);
        result.setElementType(elementType);
        for (int i = 0; i < dimensions; ++i) {
            result.dimensions().add(new Dimension(this));
        }
        return result;
    }

    /**
     * Creates an unparented block node owned by this AST, for an empty list of statements.
     *
     * @return a new unparented, empty block node
     */
    public Block newBlock() {
        return new Block(this);
    }

    // =============================== DECLARATIONS ===========================
    /**
     * Creates an unparented compilation unit node owned by this AST. The compilation unit initially has no package
     * declaration, no import declarations, and no type declarations.
     *
     * @return the new unparented compilation unit node
     */
    public CompilationUnit newCompilationUnit() {
        return new CompilationUnit(this);
    }

    /**
     * Creates a new unparented expression statement node owned by this AST, for the given expression. <p> This method
     * can be used to convert an expression (<code>Expression</code>) into a statement (<code>Type</code>) by wrapping
     * it. Note, however, that the result is only legal for limited expression types, including method invocations,
     * assignments, and increment/decrement operations. </p>
     *
     * @param expression the expression
     * @return a new unparented statement node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public ExpressionStatement newExpressionStatement(Expression expression) {
        ExpressionStatement result = new ExpressionStatement(this);
        result.setExpression(expression);
        return result;
    }

    /**
     * Creates and returns a new unparented annotatable dimension node (Supported only in JLS8 level).
     *
     * @return a new unparented annotatable dimension node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     * @since 3.10
     */
    public Dimension newDimension() {
        return new Dimension(this);
    }

    /**
     * Creates an unparented initializer node owned by this AST, with an empty block. By default, the initializer has no
     * modifiers and an empty block.
     *
     * @return a new unparented initializer node
     */
    public Initializer newInitializer() {
        return new Initializer(this);
    }

    /**
     * Creates and returns a new member reference node. Initially the new node has no qualifier name and an unspecified,
     * but legal, member name. <p> Note that this node type is used only inside doc comments ({@link Javadoc}). </p>
     *
     * @return a new unparented member reference node
     * @since 3.0
     */
    public MemberRef newMemberRef() {
        return new MemberRef(this);
    }

    /**
     * Creates and returns a new method reference node. Initially the new node has no qualifier name, an unspecified,
     * but legal, method name, and an empty parameter list. <p> Note that this node type is used only inside doc
     * comments ({@link Javadoc Javadoc}). </p>
     *
     * @return a new unparented method reference node
     * @since 3.0
     */
    public MethodRef newMethodRef() {
        return new MethodRef(this);
    }

    /**
     * Creates and returns a new method reference node. Initially the new node has an unspecified, but legal, type, not
     * variable arity, and no parameter name. <p> Note that this node type is used only inside doc comments
     * ({@link Javadoc}). </p>
     *
     * @return a new unparented method reference parameter node
     * @since 3.0
     */
    public MethodRefParameter newMethodRefParameter() {
        return new MethodRefParameter(this);
    }

    /**
     * Creates and returns a new unparented modifier node for the given modifier.
     *
     * @param keyword one of the modifier keyword constants
     * @return a new unparented modifier node
     * @exception IllegalArgumentException if the primitive type code is invalid
     * @since 3.1
     */
    public Modifier newModifier(Modifier.ModifierKeyword keyword) {
        Modifier result = new Modifier(this);
        result.setKeyword(keyword);
        return result;
    }

    /**
     * Creates and returns a new unparented module declaration node for an unspecified, but legal, name; no modifiers;
     * no javadoc; and an empty list of statements.
     *
     * @return a new unparented module declaration node
     * @since 3.14
     */
    public ModuleDeclaration newModuleDeclaration() {
        return new ModuleDeclaration(this);
    }

    /**
     * Creates and returns a new unparented primitive type node with the given type code.
     *
     * @param typeCode one of the primitive type code constants declared in <code>PrimitiveType</code>
     * @return a new unparented primitive type node
     * @exception IllegalArgumentException if the primitive type code is invalid
     */
    public PrimitiveType newPrimitiveType(PrimitiveType.Code typeCode) {
        PrimitiveType result = new PrimitiveType(this);
        result.setPrimitiveTypeCode(typeCode);
        return result;
    }

    /**
     * Creates and returns a new unparented qualified name node for the given qualifier and simple name child node.
     *
     * @param qualifier the qualifier name node
     * @param name the simple name being qualified
     * @return a new unparented qualified name node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public QualifiedName newQualifiedName(Name qualifier, SimpleName name) {
        QualifiedName result = new QualifiedName(this);
        result.setQualifier(qualifier);
        result.setName(name);
        return result;
    }

    // =============================== TYPES ===========================
    /**
     * Creates and returns a new unparented simple type node with the given type name. <p> This method can be used to
     * convert a name (<code>Name</code>) into a type (<code>Type</code>) by wrapping it. </p>
     *
     * @param typeName the name of the class or interface
     * @return a new unparented simple type node
     * @exception IllegalArgumentException if: <ul> <li>the node belongs to a different AST</li> <li>the node already
     * has a parent</li> </ul>
     */
    public SimpleType newSimpleType(Name typeName) {
        SimpleType result = new SimpleType(this);
        result.setName(typeName);
        return result;
    }

    /**
     * Creates an unparented single variable declaration node owned by this AST. By default, the declaration is for a
     * variable with an unspecified, but legal, name and type; no modifiers; no array dimensions after the variable; no
     * initializer; not variable arity.
     *
     * @return a new unparented single variable declaration node
     */
    public SingleVariableDeclaration newSingleVariableDeclaration() {
        return new SingleVariableDeclaration(this);
    }

    /**
     * Creates and returns a new tag element node. Initially the new node has no tag name and an empty list of fragments
     * and properties. <p> Note that this node type is used only inside doc comments ({@link Javadoc}). </p>
     *
     * @return a new unparented tag element node
     * @since 3.0
     */
    public TagElement newTagElement() {
        return new TagElement(this);
    }

    /**
     * Creates and returns a new text element node. Initially the new node has an empty text string. <p> Note that this
     * node type is used only inside doc comments ({@link Javadoc Javadoc}). </p>
     *
     * @return a new unparented text element node
     * @since 3.0
     */
    public TextElement newTextElement() {
        return new TextElement(this);
    }

    /**
     * Creates an unparented class declaration node owned by this AST. The name of the class is an unspecified, but
     * legal, name; no modifiers; no doc comment; no superclass or superinterfaces; and an empty class body. <p> To
     * create an interface, use this method and then call <code>TypeDeclaration.setInterface(true)</code>. </p>
     *
     * @return a new unparented type declaration node
     */
    public TypeDeclaration newTypeDeclaration() {
        TypeDeclaration result = new TypeDeclaration(this);
        result.setInterface(false);
        return result;
    }

}
