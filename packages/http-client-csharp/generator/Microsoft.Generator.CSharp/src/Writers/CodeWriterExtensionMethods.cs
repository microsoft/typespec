﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Microsoft.Generator.CSharp
{
    /// <summary>
    /// Contains extension methods for <see cref="CodeWriter"/>.
    /// </summary>
    public class CodeWriterExtensionMethods
    {
        /// <summary>
        /// The license string for the generated code to be written.
        /// </summary>
        public virtual string LicenseString => string.Empty;

        /// <summary>
        /// Writes the given method to the writer. A valid instance of <see cref="CodeWriter"/> is required.
        /// </summary>
        /// <param name="writer">The <see cref="CodeWriter"/> instance to write to.</param>
        /// <param name="method">The <see cref="CSharpMethod"/> to write.</param>
        public virtual void WriteMethod(CodeWriter writer, CSharpMethod method)
        {
            ArgumentNullException.ThrowIfNull(writer, nameof(writer));
            ArgumentNullException.ThrowIfNull(method, nameof(method));

            if (method.Body is { } body)
            {
                using (writer.WriteMethodDeclaration(method.Signature))
                {
                    body.Write(writer);
                }
            }

            writer.WriteLine();
        }
    }
}
