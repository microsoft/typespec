// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

package com.microsoft.typespec.http.client.generator.core.customization;

import java.util.Map;
import org.slf4j.Logger;

/**
 * The base class for customization. Extend this class to plug into AutoRest generation.
 */
public abstract class Customization {
    /**
     * Start the customization process. This is called by the post processor in AutoRest.
     *
     * @param files the map of files generated in the previous steps in AutoRest
     * @param logger the logger
     * @return the map of files after customization
     */
    public final Map<String, String> run(Map<String, String> files, Logger logger) {
        return run(new Editor(files), logger);
    }

    /**
     * Applies customization while retaining parsed files for partial update and formatting.
     *
     * @param editor the editor shared by the postprocessing stages
     * @param logger the logger
     * @return the customized file contents
     */
    public final Map<String, String> run(Editor editor, Logger logger) {
        customize(new LibraryCustomization(editor), logger);
        return editor.getContents();
    }

    /**
     * Override this method to customize the client library.
     *
     * @param libraryCustomization the top level customization object
     * @param logger the logger
     */
    public abstract void customize(LibraryCustomization libraryCustomization, Logger logger);
}
