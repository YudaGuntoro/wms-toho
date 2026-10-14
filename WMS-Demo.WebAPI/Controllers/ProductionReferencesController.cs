using WMSDemo.Persistence.Context;
using WMSDemo.Domain.Production;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace WMSDemo.WebAPI.Controllers;

[ApiController]
[Route("api/production")]
public class ProductionReferencesController : ApiControllerBase
{
    private readonly WMSDemoDbContext _db;

    public ProductionReferencesController(WMSDemoDbContext db) => _db = db;

    [HttpGet("pic-cards")]
    public async Task<IActionResult> PicCards()
    {
        var items = await _db.PicCards.AsNoTracking()
            .Include(x => x.ShiftRef)
            .OrderBy(x => x.FullName)
            .Select(x => new PicCard
            {
                Id = x.Id,
                CardUid = x.CardUid,
                EmployeeNo = x.EmployeeNo,
                FullName = x.FullName,
                Department = x.Department,
                ShiftId = x.ShiftId,
                Shift = x.ShiftRef!.ShiftName,
                IsActive = x.IsActive,
                LastScannedAt = x.LastScannedAt,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        return ApiOk(items);
    }

    [HttpGet("shift-masters")]
    public async Task<IActionResult> ShiftMasters()
    {
        return ApiOk(await _db.ShiftMasters.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.ShiftName)
            .ToListAsync());
    }
}
