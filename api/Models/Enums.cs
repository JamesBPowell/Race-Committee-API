namespace RaceCommittee.Api.Models
{
    public enum ScoringMethod
    {
        OneDesign = 0,
        PHRF_TOT = 1,
        PHRF_TOD = 2,
        ORR_EZ_GPH = 3,
        ORR_EZ_PC = 4,
        ORR_Full_PC = 5,
        Portsmouth = 6
    }

    public enum StartType
    {
        Single_Gun = 0,
        Staggered = 1,
        Pursuit = 2
    }

    public enum CourseType
    {
        WindwardLeeward = 0,
        RandomLeg = 1,
        MostlyLW = 2,
        MostlyReach = 3,
        CircularRandom = 4,
        MostlyWW = 5,
        WL5050 = 6,
        WL6040 = 7,
        ClosedCourse = 8,
        BayviewMac = 9,
        ChicagoMac = 10,
        PacificCup = 11,
        Transpac = 12
    }

    public static class BoatConfiguration
    {
        public const string Spinnaker = "Spinnaker";
        public const string NonSpinnaker = "Non-Spinnaker";
    }

    public static class WindBand
    {
        public const string Light = "light";
        public const string Medium = "medium";
        public const string Heavy = "heavy";
    }
}
