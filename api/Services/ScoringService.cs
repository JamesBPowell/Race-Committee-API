using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using RaceCommittee.Api.Data;
using RaceCommittee.Api.Models;
using RaceCommittee.Api.Models.DTOs;

namespace RaceCommittee.Api.Services
{
    public class ScoringService : IScoringService
    {
        private readonly ApplicationDbContext _context;

        public ScoringService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<FinishResultDto>> CalculateRaceScoresAsync(int raceId)
        {
            var race = await _context.Races
                .Include(r => r.ParticipatingFleets)
                    .ThenInclude(rf => rf.Fleet)
                .Include(r => r.Finishes)
                    .ThenInclude(f => f.Entry)
                        .ThenInclude(e => e.Boat)
                .FirstOrDefaultAsync(r => r.Id == raceId);

            if (race == null) return new List<FinishResultDto>();

            var results = new List<FinishResultDto>();

            // Use ActualStartTime if available, otherwise fallback to ScheduledStartTime
            var raceStartTime = race.ActualStartTime ?? race.ScheduledStartTime;
            if (!raceStartTime.HasValue) return results;

            // Group finishes by Fleet
            var fleetFinishes = race.Finishes
                .Where(f => f.Entry != null && f.Entry.FleetId.HasValue)
                .GroupBy(f => f.Entry.FleetId.Value)
                .ToList();

            foreach (var group in fleetFinishes)
            {
                var fleetId = group.Key;
                var raceFleet = race.ParticipatingFleets.FirstOrDefault(rf => rf.FleetId == fleetId);
                
                // If the fleet was added after the race was created, raceFleet might be null.
                // We should fetch the fleet directly in this case.
                var fleet = raceFleet?.Fleet ?? await _context.Fleets.FindAsync(fleetId);

                if (fleet == null) continue;

                // Determine start time for this fleet
                DateTime fleetStartTime = raceStartTime.Value;
                if (raceFleet != null && raceFleet.StartTimeOffset.HasValue)
                {
                    fleetStartTime = fleetStartTime.Add(raceFleet.StartTimeOffset.Value);
                }

                // First pass: Calculate Corrected/Elapsed Times
                foreach (var finish in group)
                {
                    if (finish.FinishTime.HasValue)
                    {
                        var elapsed = finish.FinishTime.Value - fleetStartTime;

                        // Clamp to prevent SQL Server time column out of range errors
                        if (elapsed < TimeSpan.Zero) elapsed = TimeSpan.Zero;
                        if (elapsed.TotalDays >= 1) elapsed = new TimeSpan(23, 59, 59);

                        finish.ElapsedDuration = elapsed;

                        // Apply scoring algorithm
                        var corrected = CalculateCorrectedTime(fleet.ScoringMethod, fleet.ScoringConfiguration, elapsed, finish.Entry, raceFleet, race);
                        
                        // Add penalties
                        if (finish.TimePenalty.HasValue)
                        {
                            corrected = corrected.Add(finish.TimePenalty.Value);
                        }

                        // Clamp corrected time
                        if (corrected < TimeSpan.Zero) corrected = TimeSpan.Zero;
                        if (corrected.TotalDays >= 1) corrected = new TimeSpan(23, 59, 59);

                        finish.CorrectedDuration = corrected;
                    }
                    else
                    {
                        finish.ElapsedDuration = null;
                        finish.CorrectedDuration = null;
                    }
                }

                // Second pass: Compute Points (Low point system)
                var sortedFinishes = group
                    .OrderBy(f => string.IsNullOrEmpty(f.Code) ? 0 : 1) // Finishers first
                    .ThenBy(f => f.CorrectedDuration) // Then by corrected time
                    .ToList();

                // RRS Appendix A specifies DNF/DNS points = number of boats entered in the series + 1
                // Assuming all entries in the DB for this fleet are "entered in series"
                int totalEntriesInFleet = await _context.Entries.CountAsync(e => e.RegattaId == race.RegattaId && e.FleetId == fleetId);
                float penaltyPoints = totalEntriesInFleet + 1;

                // Example DNF scoring toggle
                bool isDNFStartedPlusOne = false;
                if (!string.IsNullOrEmpty(fleet.ScoringConfiguration))
                {
                    try {
                        using var doc = JsonDocument.Parse(fleet.ScoringConfiguration);
                        if (doc.RootElement.TryGetProperty("DNFScoring", out var dnfEl)) {
                            isDNFStartedPlusOne = dnfEl.GetString() == "StartedPlusOne";
                        }
                    } catch {}
                }

                if (isDNFStartedPlusOne) {
                    var startedCount = sortedFinishes.Count(f => string.IsNullOrEmpty(f.Code) || f.Code == "DNF" || f.Code == "RET" || f.Code == "OCS" || f.Code == "UFD" || f.Code == "BFD");
                     // DNS, DNC do not count as started
                     // This is a basic approximation for DNF penalty
                }

                int rank = 1;
                foreach (var finish in sortedFinishes)
                {
                    if (!string.IsNullOrEmpty(finish.Code))
                    {
                        // Some penalty codes
                        if (finish.Code == "SCP" && finish.CorrectedDuration.HasValue) 
                        {
                            // Scoring Penalty - usually a 20% place penalty, but we can rely on PointPenalty
                            finish.Points = rank + (finish.PointPenalty ?? 0);
                            rank++;
                        }
                        else 
                        {
                            // DNF, DNS, DSQ, etc.
                            // If DNF and using StartedPlusOne toggle, we could adjust penaltyPoints here
                            // But keeping it simple for now: Entered + 1
                            finish.Points = penaltyPoints;
                        }
                    }
                    else
                    {
                        finish.Points = rank;
                        rank++;
                    }
                    
                    if (finish.PointPenalty.HasValue && string.IsNullOrEmpty(finish.Code))
                    {
                         finish.Points += finish.PointPenalty.Value;
                    }

                    results.Add(new FinishResultDto
                    {
                        FinishId = finish.Id,
                        RaceId = finish.RaceId,
                        EntryId = finish.EntryId,
                        FleetId = fleetId,
                        BoatName = finish.Entry.Boat.BoatName,
                        SailNumber = finish.Entry.Boat.SailNumber,
                        BoatMakeModel = finish.Entry.Boat.MakeModel,
                        Rating = finish.Entry.Rating ?? finish.Entry.Boat.DefaultRating,
                        FleetName = fleet.Name,
                        FinishTime = finish.FinishTime,
                        ElapsedDuration = finish.ElapsedDuration,
                        CorrectedDuration = finish.CorrectedDuration,
                        TimePenalty = finish.TimePenalty,
                        Code = finish.Code,
                        Notes = finish.Notes,
                        Points = finish.Points,
                        ScoringMethodUsed = fleet.ScoringMethod.ToString()
                    });
                }
            }

            // Third pass: Calculate Overall Rankings for matching methodologies and race parameters
            var fleetsInOverall = race.ParticipatingFleets.Where(rf => rf.IncludeInOverall).ToList();
            var fleetIdsInOverall = fleetsInOverall.Select(rf => rf.FleetId).ToHashSet();

            var overallGroups = results
                .Where(r => fleetIdsInOverall.Contains(r.FleetId))
                .GroupBy(r => {
                    var rf = fleetsInOverall.First(f => f.FleetId == r.FleetId);
                    return new { 
                        Method = r.ScoringMethodUsed, 
                        Distance = rf.CourseDistance ?? race.CourseDistance ?? 0,
                        Course = rf.CourseType ?? race.CourseType
                    };
                })
                .ToList();

            foreach (var group in overallGroups)
            {
                var sortedOverall = group
                    .OrderBy(f => string.IsNullOrEmpty(f.Code) ? 0 : 1) // Finishers first
                    .ThenBy(f => f.CorrectedDuration) // Then by corrected time
                    .ToList();

                int overallRank = 1;
                int totalInOverallGroup = group.Count();
                float overallPenaltyPoints = totalInOverallGroup + 1;

                foreach (var res in sortedOverall)
                {
                    res.OverallRank = overallRank;
                    
                    if (!string.IsNullOrEmpty(res.Code))
                    {
                        res.OverallPoints = overallPenaltyPoints;
                    }
                    else
                    {
                        res.OverallPoints = overallRank;
                    }

                    // Map these back to the entity for persistence
                    var finishToUpdate = race.Finishes.FirstOrDefault(f => f.Id == res.FinishId);
                    if (finishToUpdate != null)
                    {
                        finishToUpdate.OverallRank = res.OverallRank;
                        finishToUpdate.OverallPoints = res.OverallPoints;
                    }

                    overallRank++;
                }
            }

            // Save the computed fields back to the DB to persist the results
            await _context.SaveChangesAsync();

            return results.OrderBy(r => r.FleetId).ThenBy(r => r.Points).ToList();
        }

        private TimeSpan CalculateCorrectedTime(ScoringMethod method, string configJson, TimeSpan elapsed, Entry entry, RaceFleet? raceFleet, Race race)
        {
            float rating = entry.Rating ?? 0;

            switch (method)
            {
                case ScoringMethod.OneDesign:
                    return elapsed;

                case ScoringMethod.PHRF_TOT:
                    float a = 650;
                    float b = 550;
                    
                    if (!string.IsNullOrEmpty(configJson))
                    {
                        try {
                            using var doc = JsonDocument.Parse(configJson);
                            if (doc.RootElement.TryGetProperty("PHRF_TOT_A", out var aProp)) a = aProp.GetSingle();
                            if (doc.RootElement.TryGetProperty("PHRF_TOT_B", out var bProp)) b = bProp.GetSingle();
                        } catch {}
                    }
                    
                    double totMultiplier = a / (b + rating);
                    return TimeSpan.FromSeconds(elapsed.TotalSeconds * totMultiplier);

                case ScoringMethod.PHRF_TOD:
                    float distance = raceFleet?.CourseDistance ?? race?.CourseDistance ?? 0;
                    // Rating is sec/mile
                    double allowanceSeconds = rating * distance;
                    return TimeSpan.FromSeconds(Math.Max(0, elapsed.TotalSeconds - allowanceSeconds));

                case ScoringMethod.Portsmouth:
                    if (rating == 0) return elapsed;
                    return TimeSpan.FromSeconds((elapsed.TotalSeconds / rating) * 100);

                case ScoringMethod.ORR_EZ_GPH:
                    // Similar to PHRF TOT
                    if (rating == 0) return elapsed;
                    return TimeSpan.FromSeconds(elapsed.TotalSeconds * (600 / rating)); // Approximate multiplier

                case ScoringMethod.ORR_EZ_PC:
                case ScoringMethod.ORR_Full_PC:
                    // Mocked interpolation for initial phase
                    // In a full implementation, parse entry.RatingSnapshot JSON to find the exact target speed
                    // based on wind speed, wind angle (course type), and calculate custom allowance
                    return elapsed;

                default:
                    return elapsed;
            }
        }
    }
}
