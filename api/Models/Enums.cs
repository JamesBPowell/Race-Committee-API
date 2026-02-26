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
        Triangle = 2,
        Olympic = 3
    }
}
