using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LexumLinkApp.Server.Controllers
{
    // Super Admin management of the Prescription Alert matter-type reference list.
    // Default prescription periods are starting points only, not legal advice — this
    // screen lets a firm correct/verify them for their own practice (see the seed notes
    // in LexumLinkDbContext for sources/assumptions behind each default).
    [Authorize]
    [ApiController]
    [Route("api/admin/matter-types")]
    public class AdminMatterTypesController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;

        public AdminMatterTypesController(LexumLinkDbContext context)
        {
            _context = context;
        }

        private async Task<bool> IsSuperAdmin()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
            var user = await _context.Users.FindAsync(userId);
            return user?.IsSuperAdmin ?? false;
        }

        // GET: api/admin/matter-types
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var types = await _context.MatterTypes
                .OrderBy(m => m.SortOrder)
                .Select(m => new MatterTypeResponse
                {
                    Id = m.Id,
                    Name = m.Name,
                    DefaultPeriodMonths = m.DefaultPeriodMonths,
                    Notes = m.Notes,
                    IsActive = m.IsActive,
                    SortOrder = m.SortOrder
                })
                .ToListAsync();

            return Ok(types);
        }

        // PUT: api/admin/matter-types/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMatterTypeRequest request)
        {
            if (!await IsSuperAdmin())
                return Forbid();

            var matterType = await _context.MatterTypes.FindAsync(id);
            if (matterType == null)
                return NotFound(new { error = "Matter type not found" });

            matterType.DefaultPeriodMonths = request.DefaultPeriodMonths;
            matterType.Notes = request.Notes;
            matterType.IsActive = request.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Matter type updated" });
        }
    }
}
