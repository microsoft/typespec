namespace Sample.Models
{
    public partial class BaseModel
    {
        public BaseModel(string baseProp)
        {
            BaseProp = baseProp;
        }

        public string BaseProp { get; set; }
    }
}
