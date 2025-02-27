// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

namespace Microsoft.TypeSpec.Generator.Statements
{
    public class SerializationStatement : MethodBodyStatement
    {
        public string PropertyName { get; }
        public MethodBodyStatement Statement { get; }

        public SerializationStatement(string propertyName, MethodBodyStatement statement)
        {
            PropertyName = propertyName;
            Statement = statement;
        }

        internal override void Write(CodeWriter writer)
        {
            Statement.Write(writer);
        }
    }
}
