// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using Microsoft.TypeSpec.Generator.Customizations;

namespace Sample.Published
{
    public partial class IpClient { }
    public partial class DbClient { }
    public partial class OSClient { }
    public partial class Ipv4Client { }
    public partial class IpV6Client { }
    internal partial class InternalOsClient { }
}

namespace Sample.Customized
{
    [CodeGenType("MappedDbClient")]
    public partial class ExplicitDbClient { }

    [CodeGenType("MappedIPClient")]
    public partial class ExplicitIpClient { }
}
