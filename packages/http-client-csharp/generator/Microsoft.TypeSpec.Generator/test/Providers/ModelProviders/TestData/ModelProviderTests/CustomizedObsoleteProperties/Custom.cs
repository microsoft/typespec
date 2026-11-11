// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System;

namespace Sample.Models
{
    public partial class StableBase
    {
        public virtual string Value { get; set; }
    }

    public partial class ObsoleteBase
    {
        [Obsolete("Custom base message", DiagnosticId = "BASE001")]
        public virtual string Value { get; set; }
    }

    public partial class CustomOverride : ObsoleteBase
    {
        public override string Value { get; set; }
    }

    public partial class CustomHidden : ObsoleteBase
    {
        public new string Value { get; set; }
    }

    public partial class CustomObsoleteOverride : ObsoleteBase
    {
        [Obsolete("Custom derived message", DiagnosticId = "DERIVED001")]
        public override string Value { get; set; }
    }

    public partial class CustomGeneratedBaseOverride : GeneratedBase
    {
        public override string Value { get; set; }
    }
}
