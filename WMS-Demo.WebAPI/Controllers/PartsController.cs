using WMSDemo.Domain.Production;
using WMSDemo.Persistence.Context;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace WMSDemo.WebAPI.Controllers;

[ApiController]
[Route("api/parts")]
public class PartsController : ApiControllerBase
{
    private readonly WMSDemoDbContext _db;

    public PartsController(WMSDemoDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetParts([FromQuery] int page = 1, [FromQuery] int limit = 10, [FromQuery] string? search = null)
    {
        page = Math.Max(1, page);
        limit = Math.Clamp(limit, 1, 100);

        var query = _db.Parts.AsNoTracking().Include(x => x.LocationRef).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var keyword = search.Trim();
            query = query.Where(x =>
                x.PartNumber.Contains(keyword) ||
                x.PartName.Contains(keyword) ||
                x.LocationRef!.LocationCode.Contains(keyword) ||
                x.LocationRef.LocationName.Contains(keyword));
        }

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.Timestamp)
            .ThenBy(x => x.PartNumber)
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(x => new Part
            {
                Id = x.Id,
                PartNumber = x.PartNumber,
                PartName = x.PartName,
                LocationId = x.LocationId,
                Location = x.LocationRef!.LocationCode,
                Timestamp = x.Timestamp
            })
            .ToListAsync();

        return Ok(new
        {
            success = true,
            message = "Parts retrieved successfully",
            data = items,
            pagination = new
            {
                page,
                limit,
                total,
                totalPage = (int)Math.Ceiling(total / (double)limit)
            }
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetPart(int id)
    {
        var part = await _db.Parts.AsNoTracking().Include(x => x.LocationRef).FirstOrDefaultAsync(x => x.Id == id);
        return part is null ? ApiNotFound("Part was not found.") : ApiOk(ToResponse(part));
    }

    [HttpPost]
    public async Task<IActionResult> CreatePart([FromBody] CreatePartRequest request)
    {
        try
        {
            ValidatePart(request);
            var partNumber = request.PartNumber.Trim();
            var location = await ResolveLocation(request.Location);
            if (await _db.Parts.AnyAsync(x => x.PartNumber == partNumber))
            {
                throw new InvalidOperationException("Part number is already used.");
            }

            var part = new Part
            {
                PartNumber = partNumber,
                PartName = request.PartName.Trim(),
                LocationId = location.Id,
                Timestamp = request.Timestamp ?? DateTime.Now
            };

            _db.Parts.Add(part);
            await _db.SaveChangesAsync();
            part.LocationRef = location;
            return ApiCreated(ToResponse(part), "Part created successfully.");
        }
        catch (Exception ex)
        {
            return ApiBadRequest(ex);
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdatePart(int id, [FromBody] CreatePartRequest request)
    {
        try
        {
            ValidatePart(request);
            var part = await _db.Parts.FirstOrDefaultAsync(x => x.Id == id);
            if (part is null)
            {
                return ApiNotFound("Part was not found.");
            }

            var partNumber = request.PartNumber.Trim();
            var location = await ResolveLocation(request.Location);
            if (await _db.Parts.AnyAsync(x => x.Id != id && x.PartNumber == partNumber))
            {
                throw new InvalidOperationException("Part number is already used.");
            }

            part.PartNumber = partNumber;
            part.PartName = request.PartName.Trim();
            part.LocationId = location.Id;
            part.Timestamp = request.Timestamp ?? DateTime.Now;

            await _db.SaveChangesAsync();
            part.LocationRef = location;
            return ApiOk(ToResponse(part), "Part updated successfully.");
        }
        catch (Exception ex)
        {
            return ApiBadRequest(ex);
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeletePart(int id)
    {
        try
        {
            var part = await _db.Parts.FirstOrDefaultAsync(x => x.Id == id);
            if (part is null)
            {
                return ApiNotFound("Part was not found.");
            }

            if (await _db.StockMovements.AnyAsync(x => x.PartId == id))
            {
                throw new InvalidOperationException("Part cannot be deleted because it is already used by stock movements.");
            }

            _db.Parts.Remove(part);
            await _db.SaveChangesAsync();
            return ApiOk(true, "Part deleted successfully.");
        }
        catch (Exception ex)
        {
            return ApiBadRequest(ex);
        }
    }

    private static void ValidatePart(CreatePartRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.PartNumber) ||
            string.IsNullOrWhiteSpace(request.PartName) ||
            string.IsNullOrWhiteSpace(request.Location))
        {
            throw new ArgumentException("Part / Lot Number, Part Name, and Location are required.");
        }
    }

    private async Task<WarehouseLocation> ResolveLocation(string locationCode)
    {
        var code = locationCode.Trim();
        var location = await _db.Locations.FirstOrDefaultAsync(x => x.LocationCode == code);
        if (location is not null)
        {
            return location;
        }

        location = new WarehouseLocation
        {
            LocationCode = code,
            LocationName = code,
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        _db.Locations.Add(location);
        await _db.SaveChangesAsync();
        return location;
    }

    private static Part ToResponse(Part part)
    {
        part.Location = part.LocationRef?.LocationCode ?? string.Empty;
        return part;
    }
}
