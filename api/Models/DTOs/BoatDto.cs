namespace api.Models.DTOs
{
    public class BoatDto
    {
        public int Id { get; set; }
        public string BoatName { get; set; }
        public string SailNumber { get; set; }
        public string MakeModel { get; set; }
        public float? DefaultRating { get; set; }
    }

    public class CreateBoatDto
    {
        public string BoatName { get; set; }
        public string SailNumber { get; set; }
        public string MakeModel { get; set; }
        public float? DefaultRating { get; set; }
    }

    public class UpdateBoatDto
    {
        public string BoatName { get; set; }
        public string SailNumber { get; set; }
        public string MakeModel { get; set; }
        public float? DefaultRating { get; set; }
    }
}
