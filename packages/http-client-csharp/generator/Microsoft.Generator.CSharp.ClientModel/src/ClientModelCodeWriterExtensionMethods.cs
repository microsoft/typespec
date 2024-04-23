// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.Generator.CSharp.ClientModel
{
    public class ClientModelCodeWriterExtensionMethods : CodeWriterExtensionMethods
    {
        public override void WriteMethod(CodeWriter writer, Method method)
        {
            writer.Append($"// Sample plugin implementation of WriteMethod from {GetType()}");
            writer.WriteLine();
            base.WriteMethod(writer, method);
        }
    }
}
