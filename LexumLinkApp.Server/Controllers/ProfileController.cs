using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LexumLinkApp.Server.Data;

namespace LexumLinkApp.Server.Controllers
{
    public class ProfileController : BaseApiController
    {
        private readonly LexumLinkDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ProfileController(LexumLinkDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        private string WebRoot() => _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

        // GET: api/profile/me
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var id = GetUserId();
            var u = await _context.Users.FirstOrDefaultAsync(x => x.Id == id);
            if (u == null) return NotFound();
            return Ok(new { u.Id, u.FirstName, u.LastName, u.Email, u.AvatarUrl, u.IsSuperAdmin });
        }

        // POST: api/profile/avatar  (multipart form field: file)
        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] AvatarUploadRequest request)
        {
            var id = GetUserId();
            var u = await _context.Users.FirstOrDefaultAsync(x => x.Id == id);
            if (u == null) return NotFound();

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

            var folder = Path.Combine(WebRoot(), "uploads", "avatars");
            Directory.CreateDirectory(folder);

            // Remove previous avatar file if present
            if (!string.IsNullOrEmpty(u.AvatarUrl))
            {
                var oldPath = Path.Combine(WebRoot(), u.AvatarUrl.TrimStart('/'));
                if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
            }

            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(folder, fileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await request.File.CopyToAsync(stream);
            }

            u.AvatarUrl = $"/uploads/avatars/{fileName}";
            await _context.SaveChangesAsync();
            return Ok(new { avatarUrl = u.AvatarUrl });
        }

        // DELETE: api/profile/avatar
        [HttpDelete("avatar")]
        public async Task<IActionResult> RemoveAvatar()
        {
            var id = GetUserId();
            var u = await _context.Users.FirstOrDefaultAsync(x => x.Id == id);
            if (u == null) return NotFound();

            if (!string.IsNullOrEmpty(u.AvatarUrl))
            {
                var path = Path.Combine(WebRoot(), u.AvatarUrl.TrimStart('/'));
                if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
            }
            u.AvatarUrl = null;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class AvatarUploadRequest
    {
        public IFormFile File { get; set; } = null!;
    }
}
