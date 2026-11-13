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
 *     Stephan Herrmann <stephan@cs.tu-berlin.de> - Contributions for
 *     						Bug 328281 - visibility leaks not detected when analyzing unused field in private class
 *     						Bug 300576 - NPE Computing type hierarchy when compliance doesn't match libraries
 *     						Bug 354536 - compiling package-info.java still depends on the order of compilation units
 *     						Bug 349326 - [1.7] new warning for missing try-with-resources
 *     						Bug 358903 - Filter practically unimportant resource leak warnings
 *							Bug 395977 - [compiler][resource] Resource leak warning behavior possibly incorrect for anonymous inner class
 *							Bug 395002 - Self bound generic class doesn't resolve bounds properly for wildcards for certain parametrisation.
 *							Bug 416176 - [1.8][compiler][null] null type annotations cause grief on type variables
 *							Bug 427199 - [1.8][resource] avoid resource leak warnings on Streams that have no resource
 *							Bug 429958 - [1.8][null] evaluate new DefaultLocation attribute of @NonNullByDefault
 *							Bug 434570 - Generic type mismatch for parametrized class annotation attribute with inner class
 *							Bug 444024 - [1.8][compiler][null] Type mismatch error in annotation generics assignment which happens "sometimes"
 *							Bug 459967 - [null] compiler should know about nullness of special methods like MyEnum.valueOf()
 *        Andy Clement (GoPivotal, Inc) aclement@gopivotal.com - Contributions for
 *                          Bug 415821 - [1.8][compiler] CLASS_EXTENDS target type annotation missing for anonymous classes
 *     het@google.com - Bug 456986 - Bogus error when annotation processor generates annotation type
 *     Lars Vogel <Lars.Vogel@vogella.com> - Contributions for
 *     						Bug 473178
 *******************************************************************************/
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.lookup;

import com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.jdt.internal.compiler.ast.*;

public abstract class ClassScope extends Scope {

}
