using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using LexumLinkApp.Server.Services;

namespace LexumLinkApp.Server.Controllers
{
    public class ClientsController : BaseApiController
    {
        private readonly LexumLinkDbContext _context;
        private readonly INotificationService _notify;
        private readonly IWebHostEnvironment _env;
        public ClientsController(LexumLinkDbContext context, INotificationService notify, IWebHostEnvironment env)
        {
            _context = context;
            _notify = notify;
            _env = env;
        }

        private string WebRoot() => _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

        // Canonical document categories — must match the tabs in the Documents page.
        private static readonly (string Key, string Label)[] DocumentCategories = new[]
        {
            ("raf_forms", "RAF Forms"),
            ("police_reports", "Police Reports"),
            ("medical", "Medical"),
            ("financial", "Financial"),
            ("identity", "Identity"),
            ("litigation", "Litigation"),
        };
        
        #region Create

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CreateClient([FromBody] ClientRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized("Invalid user token");

            var orgIdClaim = User.FindFirst("orgId")?.Value;
            if (!Guid.TryParse(orgIdClaim, out var orgId))
                return BadRequest("No active organization selected");

            var client = new Client
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                UserId = userId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                Phone = request.Phone,
                IdNumber = request.IdNumber,
                Address = request.Address,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Clients.Add(client);
            await _context.SaveChangesAsync();
            await _notify.NotifyNewClientAsync(client);
            return Ok(client);
        }

        #endregion Create

        #region Read

        [HttpGet]
        public async Task<IActionResult> GetClients()
        {
            var orgId = GetOrganizationId();
            var clients = await _context.Clients
                .Where(c => c.OrganizationId == orgId)
                .OrderBy(c => c.LastName)
                .ToListAsync();
            return Ok(clients);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetClient(Guid id)
        {
            var orgId = GetOrganizationId();
            var client = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
            if (client == null) return NotFound();
            return Ok(client);
        }

        #endregion Read

        #region Update

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(Guid id, [FromBody] UpdateClientRequest request)
        {
            var orgId = GetOrganizationId();
            var existing = await _context.Clients.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
            if (existing == null) return NotFound();

            existing.FirstName = request.FirstName;
            existing.LastName = request.LastName;
            existing.Email = request.Email;
            existing.Phone = request.Phone;
            existing.IdNumber = request.IdNumber;
            existing.Address = request.Address;
            existing.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        #endregion Update

        #region Dashboard

        // GET: api/clients/{id}/dashboard
        // Centralized view for a single client: upcoming events, a checklist of
        // which document categories are on file vs pending, and every claim tied
        // to their cases with the outstanding (requested - awarded) amount.
        [HttpGet("{id}/dashboard")]
        public async Task<IActionResult> GetClientDashboard(Guid id)
        {
            var orgId = GetOrganizationId();
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
            if (client == null) return NotFound();

            var now = DateTime.UtcNow;

            var upcomingEvents = await _context.Events
                .Where(e => e.OrganizationId == orgId && e.ClientId == id && e.StartAt >= now)
                .OrderBy(e => e.StartAt)
                .Take(5)
                .Select(e => new
                {
                    e.Id,
                    e.Title,
                    e.EventType,
                    e.StartAt,
                    e.Location
                })
                .ToListAsync();

            var clientDocs = await _context.Documents
                .Where(d => d.OrganizationId == orgId && d.ClientId == id)
                .OrderByDescending(d => d.UploadedAt)
                .ToListAsync();

            var documentCategories = DocumentCategories.Select(cat => new
            {
                key = cat.Key,
                label = cat.Label,
                uploaded = clientDocs.Any(d => d.DocumentType == cat.Key),
                count = clientDocs.Count(d => d.DocumentType == cat.Key),
            }).ToList();

            var pendingCategories = documentCategories.Where(c => !c.uploaded).Select(c => c.label).ToList();

            var allDocuments = clientDocs.Select(d => new
            {
                d.Id,
                d.FileName,
                d.DocumentType,
                d.FileUrl,
                d.UploadedAt
            }).ToList();

            var cases = await _context.Cases
                .Where(c => c.OrganizationId == orgId && c.ClientId == id)
                .Include(c => c.Claims)
                .ToListAsync();

            var claimItems = cases
                .SelectMany(c => c.Claims.Select(cl => new
                {
                    cl.Id,
                    cl.ClaimNumber,
                    CaseId = c.Id,
                    CaseNumber = c.CaseNumber,
                    cl.Status,
                    cl.RafReference,
                    cl.AmountRequested,
                    cl.AmountAwarded,
                    Outstanding = (cl.AmountRequested ?? 0) - (cl.AmountAwarded ?? 0)
                }))
                .OrderByDescending(c => c.Outstanding)
                .ToList();

            return Ok(new
            {
                client = new
                {
                    client.Id,
                    client.FirstName,
                    client.LastName,
                    client.Email,
                    client.Phone,
                    client.IdNumber,
                    client.Address,
                    client.PhotoUrl,
                    client.CreatedAt
                },
                upcomingEvents,
                documents = new
                {
                    categories = documentCategories,
                    pendingCategories,
                    all = allDocuments
                },
                claims = new
                {
                    items = claimItems,
                    totalRequested = claimItems.Sum(c => c.AmountRequested ?? 0),
                    totalAwarded = claimItems.Sum(c => c.AmountAwarded ?? 0),
                    totalOutstanding = claimItems.Sum(c => c.Outstanding)
                },
                cases = new
                {
                    total = cases.Count,
                    open = cases.Count(c => c.Status == "open"),
                    inProgress = cases.Count(c => c.Status == "in_progress"),
                    critical = cases.Count(c => c.Status == "critical"),
                    closed = cases.Count(c => c.Status == "closed"),
                }
            });
        }

        // POST: api/clients/{id}/photo  (multipart form field: file)
        [HttpPost("{id}/photo")]
        public async Task<IActionResult> UploadPhoto(Guid id, [FromForm] AvatarUploadRequest request)
        {
            var orgId = GetOrganizationId();
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
            if (client == null) return NotFound();

            if (request.File == null || request.File.Length == 0)
                return BadRequest(new { error = "No file uploaded." });

            // Mobile photo libraries and camera captures sometimes hand the browser a
            // filename with no extension (or an unexpected one) even though the file
            // itself is a perfectly normal image. Trust the browser-reported content
            // type as a fallback whenever the extension alone doesn't pass, and derive
            // a sensible extension from it so the file still lands with a valid name.
            var allowedExt = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };
            var mimeToExt = new Dictionary<string, string>
            {
                ["image/jpeg"] = ".jpg",
                ["image/png"] = ".png",
                ["image/gif"] = ".gif",
                ["image/webp"] = ".webp",
                ["image/bmp"] = ".bmp",
            };
            var ext = Path.GetExtension(request.File.FileName).ToLowerInvariant();
            var mime = request.File.ContentType?.ToLowerInvariant();
            if (!allowedExt.Contains(ext))
            {
                if (mime != null && mimeToExt.TryGetValue(mime, out var derivedExt))
                    ext = derivedExt;
                else
                    return BadRequest(new { error = "Unsupported format. Please use JPG, PNG, GIF, WEBP or BMP (HEIC is not supported)." });
            }
            if (request.File.Length > 10 * 1024 * 1024)
                return BadRequest(new { error = "Image is too large. Please use one 10MB or smaller." });

            var folder = Path.Combine(WebRoot(), "uploads", "clients");
            Directory.CreateDirectory(folder);

            if (!string.IsNullOrEmpty(client.PhotoUrl))
            {
                var oldPath = Path.Combine(WebRoot(), client.PhotoUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
            }

            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(folder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await request.File.CopyToAsync(stream);
            }

            client.PhotoUrl = $"/uploads/clients/{fileName}";
            client.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { photoUrl = client.PhotoUrl });
        }

        // DELETE: api/clients/{id}/photo
        [HttpDelete("{id}/photo")]
        public async Task<IActionResult> RemovePhoto(Guid id)
        {
            var orgId = GetOrganizationId();
            var client = await _context.Clients.FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
            if (client == null) return NotFound();

            if (!string.IsNullOrEmpty(client.PhotoUrl))
            {
                var path = Path.Combine(WebRoot(), client.PhotoUrl.TrimStart('/'));
                if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
            }
            client.PhotoUrl = null;
            client.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        #endregion Dashboard

        #region Delete

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClient(Guid id)
        {
            var orgId = GetOrganizationId();
            var client = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == id && c.OrganizationId == orgId);
            if (client == null) return NotFound();

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        #endregion Delete
    }
}