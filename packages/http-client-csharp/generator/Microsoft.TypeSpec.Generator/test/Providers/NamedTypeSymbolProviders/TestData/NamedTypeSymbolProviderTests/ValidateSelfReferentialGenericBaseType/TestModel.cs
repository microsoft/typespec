using System;

namespace Sample.Models
{
    public class GenericBase<T> { }
    public class SelfReferentialType : GenericBase<SelfReferentialType> { }
}
