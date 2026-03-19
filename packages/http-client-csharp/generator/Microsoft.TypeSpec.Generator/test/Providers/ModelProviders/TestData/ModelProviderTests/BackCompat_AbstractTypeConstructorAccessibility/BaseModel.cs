using System.Collections.Generic;

namespace Sample.Models
{
    public abstract partial class BaseModel
    {
        /// <summary> Initializes a new instance of BaseModel. </summary>
        public BaseModel(string baseProp)
        {
            BaseProp = baseProp;
        }
    }
}
