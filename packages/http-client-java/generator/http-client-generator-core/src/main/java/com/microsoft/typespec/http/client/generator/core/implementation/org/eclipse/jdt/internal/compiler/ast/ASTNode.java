// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2026 IBM Corporation and others.
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
 *     Matt McCutchen - partial fix for https://bugs.eclipse.org/bugs/show_bug.cgi?id=122995
 *     Karen Moore - fix for https://bugs.eclipse.org/bugs/show_bug.cgi?id=207411
 *     Stephan Herrmann <stephan@cs.tu-berlin.de> - Contributions for
 *     							bug 185682 - Increment/decrement operators mark local variables as read
 *     							bug 186342 - [compiler][null] Using annotations for null checking
 *								bug 365519 - editorial cleanup after bug 186342 and bug 365387
 *								bug 374605 - Unreasonable warning for enum-based switch statements
 *								bug 384870 - [compiler] @Deprecated annotation not detected if preceded by other annotation
 *								bug 393719 - [compiler] inconsistent warnings on iteration variables
 *								Bug 392099 - [1.8][compiler][null] Apply null annotation on types for null analysis
 *								Bug 417295 - [1.8[[null] Massage type annotated null analysis to gel well with deep encoded type bindings.
 *								Bug 400874 - [1.8][compiler] Inference infrastructure should evolve to meet JLS8 18.x (Part G of JSR335 spec)
 *								Bug 424742 - [1.8] NPE in LambdaExpression.isCompatibleWith
 *								Bug 424710 - [1.8][compiler] CCE in SingleNameReference.localVariableBinding
 *								Bug 424205 - [1.8] Cannot infer type for diamond type with lambda on method invocation
 *								Bug 424415 - [1.8][compiler] Eventual resolution of ReferenceExpression is not seen to be happening.
 *								Bug 426366 - [1.8][compiler] Type inference doesn't handle multiple candidate target types in outer overload context
 *								Bug 427282 - [1.8][compiler] AIOOB (-1) at org.eclipse.jdt.internal.compiler.ClassFile.traverse(ClassFile.java:6209)
 *								Bug 427483 - [Java 8] Variables in lambdas sometimes can't be resolved
 *								Bug 428352 - [1.8][compiler] Resolution errors don't always surface
 *								Bug 427163 - [1.8][null] bogus error "Contradictory null specification" on varags
 *								Bug 432348 - [1.8] Internal compiler error (NPE) after upgrade to 1.8
 *								Bug 440143 - [1.8][null] one more case of contradictory null annotations regarding type variables
 *								Bug 441693 - [1.8][null] Bogus warning for type argument annotated with @NonNull
 *								Bug 434483 - [1.8][compiler][inference] Type inference not picked up with method reference
 *								Bug 446442 - [1.8] merge null annotations from super methods
 *								Bug 437072 - [compiler][null] Null analysis emits possibly incorrect warning for new int[][] despite @NonNullByDefault
 *     Jesper S Moller - Contributions for
 *								bug 382721 - [1.8][compiler] Effectively final variables needs special treatment
 *								bug 412153 - [1.8][compiler] Check validity of annotations which may be repeatable
 *								bug 412153 - [1.8][compiler] Check validity of annotations which may be repeatable
 *								bug 412149 - [1.8][compiler] Emit repeated annotations into the designated container
 *								bug 419209 - [1.8] Repeating container annotations should be rejected in the presence of annotation it contains
 *     Till Brychcy - Contributions for
 *     						    bug 467094 - [1.8][null] TYPE_USE NullAnnotations of array contents are applied to field.
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ASTVisitor;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.*;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.BlockScope;
import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup.TypeConstants;

@SuppressWarnings({ "rawtypes", "unchecked" })
public abstract class ASTNode implements TypeConstants {

    public int sourceStart, sourceEnd;

    public int bits = -2147483648; 				// reachable by default

    public static final Argument[] NO_ARGUMENTS = new Argument[0];
    public static final RecordComponent[] NO_RECORD_COMPONENTS = new RecordComponent[0];
    public static final TypePattern[] NO_TYPE_PATTERNS = new TypePattern[0];

    public ASTNode() {
        super();
    }

    public boolean isImplicitThis() {
        return false;
    }

    public boolean isSuper() {
        return false;
    }

    public abstract StringBuilder print(int indent, StringBuilder output);

    public static StringBuilder printAnnotations(Annotation[] annotations, StringBuilder output) {
        int length = annotations.length;
        for (int i = 0; i < length; i++) {
            if (i > 0) {
                output.append(" "); //$NON-NLS-1$
            }
            Annotation annotation2 = annotations[i];
            if (annotation2 != null) {
                annotation2.print(0, output);
            } else {
                output.append('?');
            }
        }
        return output;
    }

    public static StringBuilder printIndent(int indent, StringBuilder output) {
        for (int i = indent; i > 0; i--)
            output.append("  "); //$NON-NLS-1$
        return output;
    }

    public static StringBuilder printModifiers(int modifiers, StringBuilder output) {
        if ((modifiers & 1) != 0)
            output.append("public "); //$NON-NLS-1$
        if ((modifiers & 2) != 0)
            output.append("private "); //$NON-NLS-1$
        if ((modifiers & 4) != 0)
            output.append("protected "); //$NON-NLS-1$
        if ((modifiers & 8) != 0)
            output.append("static "); //$NON-NLS-1$
        if ((modifiers & 16) != 0)
            output.append("final "); //$NON-NLS-1$
        if ((modifiers & 32) != 0)
            output.append("synchronized "); //$NON-NLS-1$
        if ((modifiers & 64) != 0)
            output.append("volatile "); //$NON-NLS-1$
        if ((modifiers & 128) != 0)
            output.append("transient "); //$NON-NLS-1$
        if ((modifiers & 256) != 0)
            output.append("native "); //$NON-NLS-1$
        if ((modifiers & 1024) != 0)
            output.append("abstract "); //$NON-NLS-1$
        if ((modifiers & 65536) != 0)
            output.append("default "); //$NON-NLS-1$
        if ((modifiers & 67108864) != 0)
            output.append("non-sealed "); //$NON-NLS-1$
        if ((modifiers & 268435456) != 0)
            output.append("sealed "); //$NON-NLS-1$
        return output;
    }

    @Override
    public String toString() {
        return print(0, new StringBuilder(30)).toString();
    }

    public void traverse(ASTVisitor visitor, BlockScope scope) {
        // do nothing by default
    }
}
