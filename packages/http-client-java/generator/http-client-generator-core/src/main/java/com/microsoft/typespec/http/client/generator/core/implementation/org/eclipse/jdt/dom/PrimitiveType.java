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

/**
 * Primitive type nodes.
 *
 * <pre>
 * PrimitiveType:
 *    { Annotation } <b>byte</b>
 *    { Annotation } <b>short</b>
 *    { Annotation } <b>char</b>
 *    { Annotation } <b>int</b>
 *    { Annotation } <b>long</b>
 *    { Annotation } <b>float</b>
 *    { Annotation } <b>double</b>
 *    { Annotation } <b>boolean</b>
 *    { Annotation } <b>void</b>
 * </pre>
 *
 * <p> Note that due to the fact that AST nodes belong to a specific AST and have a specific parent, there needs to
 * multiple instances of these nodes. </p>
 *
 * @since 2.0
 * @noinstantiate This class is not intended to be instantiated by clients.
 */
@SuppressWarnings({ "rawtypes" })
public class PrimitiveType extends AnnotatableType {

    /**
     * Primitive type codes (typesafe enumeration).
     *
     * <pre>
     *    <b>byte</b> 	BYTE
     *    <b>short</b> 	SHORT
     *    <b>char</b> 	CHAR
     *    <b>int</b>  	INT
     *    <b>long</b>  	LONG
     *    <b>float</b>  	FLOAT
     *    <b>double</b> 	DOUBLE
     *    <b>boolean</b>	BOOLEAN
     *    <b>void</b>  	VOID
     * </pre>
     */
    public static class Code {

        /**
         * Creates a new primitive type code with the given name. <p> Note: this constructor is package-private. The
         * only instances ever created are the ones for the standard primitive types. </p>
         *
         */
        Code() {

        }

    }

    /** Type code for the primitive type "int". */
    public static final Code INT = new Code();// $NON-NLS-1$
    /** Type code for the primitive type "char". */
    public static final Code CHAR = new Code();// $NON-NLS-1$
    /** Type code for the primitive type "boolean". */
    public static final Code BOOLEAN = new Code();// $NON-NLS-1$
    /** Type code for the primitive type "short". */
    public static final Code SHORT = new Code();// $NON-NLS-1$
    /** Type code for the primitive type "long". */
    public static final Code LONG = new Code();// $NON-NLS-1$
    /** Type code for the primitive type "float". */
    public static final Code FLOAT = new Code();// $NON-NLS-1$
    /** Type code for the primitive type "double". */
    public static final Code DOUBLE = new Code();// $NON-NLS-1$
    /** Type code for the primitive type "byte". */
    public static final Code BYTE = new Code();// $NON-NLS-1$

    /**
     * Type code for the primitive type "void". Note that "void" is special in that its only legitimate uses are as a
     * method return type and as a type literal.
     */
    public static final Code VOID = new Code();// $NON-NLS-1$

    /**
     * The primitive type code; one of the PrimitiveType constants; default is int.
     */
    private PrimitiveType.Code typeCode = INT;

    /**
     * The "annotations" structural property of this node type (element type: {@link Annotation}).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor ANNOTATIONS_PROPERTY = internalAnnotationsPropertyFactory();

    /**
     * Creates a new unparented node for a primitive type owned by the given AST. By default, the node has type "int".
     * <p> N.B. This constructor is package-private. </p>
     *
     * @param ast the AST that is to own this node
     */
    PrimitiveType(AST ast) {
        super(ast);
    }

    @Override
    final ChildListPropertyDescriptor internalAnnotationsProperty() {
        return ANNOTATIONS_PROPERTY;
    }

    @Override
    final int getNodeType0() {
        return 39;
    }

    @Override
    void accept0(ASTVisitor visitor) {
        boolean visitChildren = visitor.visit(this);
        if (visitChildren) {
            // visit children in normal left to right reading order
            acceptChildren(visitor, this.annotations);
        }

    }

    /**
     * Returns the primitive type code.
     *
     * @return one of the primitive type code constants declared in this class
     */
    public PrimitiveType.Code getPrimitiveTypeCode() {
        return this.typeCode;
    }

    /**
     * Sets the primitive type code.
     *
     * @param typeCode one of the primitive type code constants declared in this class
     * @exception IllegalArgumentException if the argument is incorrect
     */
    public void setPrimitiveTypeCode(PrimitiveType.Code typeCode) {
        if (typeCode == null) {
            throw new IllegalArgumentException();
        }
        preValueChange();
        this.typeCode = typeCode;

    }
}
