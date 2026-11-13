// Modified for TypeSpec's vendored implementation; see implementation/UPSTREAM.md.
/*******************************************************************************
 * Copyright (c) 2000, 2008 IBM Corporation and others.
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

/*
 * Copyright (c) 2000, 2005 IBM Corporation and others.
 * This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License 2.0
 * which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-2.0/
 * SPDX-License-Identifier: EPL-2.0
 * Contributors:
 *     IBM Corporation - initial API and implementation
 */
package com.microsoft.typespec.http.client.generator.core.implementation.org.eclipse.text.edits;

abstract class TextEditMessages {

    public static String getString(String key) {
        return switch (key) {
            case "CopySourceEdit.different_source", "MoveSourceEdit.different_source" -> "Target edit has different source edit.";
            case "CopySourceEdit.different_tree", "MoveSourceEdit.different_tree" -> "The source and target edits belong to a different text edit tree.";
            case "CopySourceEdit.no_target", "MoveSourceEdit.no_target" -> "No target edit provided.";
            case "CopyTargetEdit.different_target", "MoveTargetEdit.different_target" -> "Source edit has different target edit.";
            case "CopyTargetEdit.no_source", "MoveTargetEdit.no_source" -> "No source edit provided.";
            case "CopyTargetEdit.wrong_parent", "MoveTargetEdit.wrong_parent" -> "Source edit must not be the parent of the target.";
            case "TextEdit.deleted_edit" -> "Cannot add deleted edit";
            case "TextEdit.overlapping" -> "Overlapping text edits";
            case "TextEdit.range_outside" -> "Range of child edit lies outside of parent edit";
            case "TextEditProcessor.invalid_length" -> "End position lies outside document range";
            case "UndoEdit.can_not_be_added" -> "Cannot add an undo edit to another edit";
            case "UndoEdit.no_children" -> "Cannot add children to an undo edit";
            default -> '!' + key + '!';
        };
    }
}
