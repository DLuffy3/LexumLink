using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;
using LexumLinkApp.Server.Models;
using System.Security.Claims;

namespace LexumLinkApp.Server.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public DocumentsController(LexumLinkDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        private Guid GetOrganizationId()
        {
            var orgIdClaim = User.FindFirst("orgId")?.Value;
            if (string.IsNullOrEmpty(orgIdClaim))
                throw new UnauthorizedAccessException("Organization not found in token.");
            return Guid.Parse(orgIdClaim);
        }

        [HttpGet]
        public async Task<IActionResult> GetDocuments([FromQuery] string? documentType, [FromQuery] Guid? clientId)
        {
            var orgId = GetOrganizationId();
            var query = _context.Documents
                .Where(d => d.OrganizationId == orgId)
                .Include(d => d.Client)
                .AsQueryable();

            if (!string.IsNullOrEmpty(documentType))
                query = query.Where(d => d.DocumentType == documentType);
            if (clientId.HasValue)
                query = query.Where(d => d.ClientId == clientId);

            var docs = await query
                .OrderByDescending(d => d.UploadedAt)
                .Select(d => new
                {
                    d.Id,
                    d.FileName,
                    d.DocumentType,
                    d.FileUrl,
                    d.FileSize,
                    d.MimeType,
                    d.UploadedAt,
                    ClientName = d.Client != null ? d.Client.FirstName + " " + d.Client.LastName : null
                })
                .ToListAsync();

            return Ok(docs);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument([FromForm] UploadDocumentRequest request)
        {
            var orgId = GetOrganizationId();
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

            // Verify client exists and belongs to organization
            var client = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == request.ClientId && c.OrganizationId == orgId);
            if (client == null)
                return BadRequest(new { error = "Client not found or does not belong to your organization." });

            if (request.File == null || request.File.Length == 0)
                return BadRequest(new { error = "No file uploaded." });

            // Allowed file types (optional)
            var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xls", ".xlsx" };
            var fileExt = Path.GetExtension(request.File.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExt))
                return BadRequest(new { error = "File type not allowed." });

            // Create unique filename
            var fileName = $"{Guid.NewGuid()}{fileExt}";
            var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var filePath = Path.Combine(uploadsFolder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await request.File.CopyToAsync(stream);
            }

            var fileUrl = $"/uploads/{fileName}"; // relative URL

            var document = new Document
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                ClientId = request.ClientId,
                DocumentType = request.DocumentType,
                FileName = request.File.FileName,
                FileUrl = fileUrl,
                FileSize = request.File.Length,
                MimeType = request.File.ContentType,
                UploadedBy = userId,
                UploadedAt = DateTime.UtcNow
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                document.Id,
                document.FileName,
                document.DocumentType,
                document.FileUrl,
                document.FileSize,
                document.MimeType,
                document.UploadedAt,
                ClientName = client.FirstName + " " + client.LastName
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(Guid id)
        {
            var orgId = GetOrganizationId();
            var doc = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == id && d.OrganizationId == orgId);
            if (doc == null)
                return NotFound(new { error = "Document not found" });

            // Delete physical file
            var filePath = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), doc.FileUrl.TrimStart('/'));
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);

            _context.Documents.Remove(doc);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class UploadDocumentRequest
    {
        public Guid ClientId { get; set; }
        public string DocumentType { get; set; } = "";
        public IFormFile File { get; set; } = null!;
    }
}