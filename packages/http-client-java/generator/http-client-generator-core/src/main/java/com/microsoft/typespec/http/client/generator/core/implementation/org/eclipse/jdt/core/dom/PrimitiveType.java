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

package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.core.dom;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
@SuppressWarnings({ "rawtypes", "unchecked" })
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
         * The name of the type.
         */
        private final String name;

        /**
         * Creates a new primitive type code with the given name. <p> Note: this constructor is package-private. The
         * only instances ever created are the ones for the standard primitive types. </p>
         *
         * @param name the standard name of the primitive type
         */
        Code(String name) {
            this.name = name;
        }

        /**
         * Returns the standard name of the primitive type.
         *
         * @return the standard name of the primitive type
         */
        @Override
        public String toString() {
            return this.name;
        }
    }

    /** Type code for the primitive type "int". */
    public static final Code INT = new Code("int");//$NON-NLS-1$
    /** Type code for the primitive type "char". */
    public static final Code CHAR = new Code("char");//$NON-NLS-1$
    /** Type code for the primitive type "boolean". */
    public static final Code BOOLEAN = new Code("boolean");//$NON-NLS-1$
    /** Type code for the primitive type "short". */
    public static final Code SHORT = new Code("short");//$NON-NLS-1$
    /** Type code for the primitive type "long". */
    public static final Code LONG = new Code("long");//$NON-NLS-1$
    /** Type code for the primitive type "float". */
    public static final Code FLOAT = new Code("float");//$NON-NLS-1$
    /** Type code for the primitive type "double". */
    public static final Code DOUBLE = new Code("double");//$NON-NLS-1$
    /** Type code for the primitive type "byte". */
    public static final Code BYTE = new Code("byte");//$NON-NLS-1$

    /**
     * Type code for the primitive type "void". Note that "void" is special in that its only legitimate uses are as a
     * method return type and as a type literal.
     */
    public static final Code VOID = new Code("void");//$NON-NLS-1$

    /**
     * The primitive type code; one of the PrimitiveType constants; default is int.
     */
    private PrimitiveType.Code typeCode = INT;

    /**
     * Map from token to primitive type code (key type: <code>String</code>; value type:
     * <code>PrimitiveType.Code</code>).
     */
    private static final Map CODES;
    static {
        CODES = new HashMap(20);
        Code[] ops = { INT, BYTE, CHAR, BOOLEAN, SHORT, LONG, FLOAT, DOUBLE, VOID, };
        for (Code op : ops) {
            CODES.put(op.toString(), op);
        }
    }

    /**
     * The "annotations" structural property of this node type (element type: {@link Annotation}).
     *
     * @since 3.10
     */
    public static final ChildListPropertyDescriptor ANNOTATIONS_PROPERTY
        = internalAnnotationsPropertyFactory(PrimitiveType.class);

    /**
     * The "primitiveTypeCode" structural property of this node type (type: {@link PrimitiveType.Code}).
     *
     * @since 3.0
     */
    public static final SimplePropertyDescriptor PRIMITIVE_TYPE_CODE_PROPERTY
        = new SimplePropertyDescriptor(PrimitiveType.class, "primitiveTypeCode", PrimitiveType.Code.class); //$NON-NLS-1$

    static {
        List propertyList = new ArrayList(2);
        createPropertyList(PrimitiveType.class, propertyList);
        addProperty(PRIMITIVE_TYPE_CODE_PROPERTY, propertyList);
        reapPropertyList(propertyList);

        propertyList = new ArrayList(3);
        createPropertyList(PrimitiveType.class, propertyList);
        addProperty(ANNOTATIONS_PROPERTY, propertyList);
        addProperty(PRIMITIVE_TYPE_CODE_PROPERTY, propertyList);
        reapPropertyList(propertyList);
    }

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
            if (this.ast.apiLevel >= 8) {
                acceptChildren(visitor, this.annotations);
            }
        }
        visitor.endVisit(this);
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
