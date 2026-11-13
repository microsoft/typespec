// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2019 IBM Corporation and others.
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
 * Abstract base class of all type reference AST node types. A type node represents a reference to a primitive type
 * (including void), to an array type, or to a simple named type (or type variable), to a qualified type, to a
 * parameterized type, to a union type, to an intersection type, or to a wildcard type. Note that not all of these are
 * meaningful in all contexts; for example, a wildcard type is only meaningful in the type argument position of a
 * parameterized type. UnionType got introduced in JLS4 to support common catch blocks for disjunctive types. For JLS8,
 * optional annotations indicated by {Annotation} got added.
 *
 * <pre>
 * Type:
 *    AnnotatableType:
 *       PrimitiveType
 *       SimpleType
 *       QualifiedType
 *       NameQualifiedType
 *       WildcardType
 *    ArrayType
 *    ParameterizedType
 *    UnionType
 *    IntersectionType
 *
 * {@link PrimitiveType}:
 *    { Annotation } <b>byte</b>
 *    { Annotation } <b>short</b>
 *    { Annotation } <b>char</b>
 *    { Annotation } <b>int</b>
 *    { Annotation } <b>long</b>
 *    { Annotation } <b>float</b>
 *    { Annotation } <b>double</b>
 *    { Annotation } <b>boolean</b>
 *    { Annotation } <b>void</b>
 * {@link ArrayType}:
 *    Type Dimension <b>{</b> Dimension <b>}</b>
 * {@link SimpleType}:
 *    { Annotation } TypeName
 * {@link QualifiedType}:
 *    Type <b>.</b> {Annotation} SimpleName
 * {@link NameQualifiedType}:
 *    Name <b>.</b> { Annotation } SimpleName
 * {@link WildcardType}:
 *    { Annotation } <b>?</b> [ ( <b>extends</b> | <b>super</b>) Type ]
 * {@link ParameterizedType}:
 *    Type <b>&lt;</b> Type { <b>,</b> Type } <b>&gt;</b>
 * {@link UnionType}:
 *    Type <b>|</b> Type { <b>|</b> Type }
 * {@link IntersectionType}:
 *    Type <b>&amp;</b> Type { <b>&amp;</b> Type }
 * </pre>
 *
 * @since 2.0
 */
public abstract class Type extends ASTNode {

    /**
     * Creates a new AST node for a type owned by the given AST. <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    Type(AST ast) {
        super(ast);
    }

    /**
     * Returns whether this type is an array type ({@link ArrayType}).
     *
     * @return <code>true</code> if this is an array type, and <code>false</code> otherwise
     */
    public final boolean isArrayType() {
        return (this instanceof ArrayType);
    }

    /**
     * Returns whether this type is a var. The convenience method checks whether the type is so named.
     *
     * @return <code>true</code> if this is a var, and <code>false</code> otherwise
     * @exception UnsupportedOperationException if this operation is used in an AST of level less than JLS10
     * @since 3.14
     */
    public boolean isVar() {
        return false;
    }

}
