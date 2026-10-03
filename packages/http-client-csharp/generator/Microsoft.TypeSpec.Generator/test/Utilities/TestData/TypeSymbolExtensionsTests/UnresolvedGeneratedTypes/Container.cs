// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;

namespace Sample
{
    public class Container
    {
        public Model Model { get; }
        public Model? NullableModel { get; }
        public FixedEnum FixedEnum { get; }
        public FixedEnum? NullableFixedEnum { get; }
        public ExtensibleEnum ExtensibleEnum { get; }
        public ExtensibleEnum? NullableExtensibleEnum { get; }
        public IDictionary<Model, IList<Model>> Dictionary { get; }
        public Missing Missing { get; }
        public Other.Model Qualified { get; }
        public Resolved.Model Resolved { get; }
        public GlobalModel Global { get; }
        public Model<string> Generic { get; }
    }
}

namespace Resolved
{
    public class Model { }
}

namespace Other
{
    public class Container { }
}

public class GlobalModel { }
