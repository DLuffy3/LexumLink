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
    public class TodosController : ControllerBase
    {
        private readonly LexumLinkDbContext _context;

        public TodosController(LexumLinkDbContext context)
        {
            _context = context;
        }

        private Guid GetUserId()
        {
            return Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        }

        private Guid GetOrganizationId()
        {
            return Guid.Parse(User.FindFirst("orgId")?.Value);
        }

        // GET: api/todos
        [HttpGet]
        public async Task<IActionResult> GetTodos()
        {
            var userId = GetUserId();
            var orgId = GetOrganizationId();
            var todos = await _context.Todos
                .Where(t => t.UserId == userId && t.OrganizationId == orgId)
                .OrderByDescending(t => t.DueDate ?? DateTime.MaxValue)
                .ThenBy(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Description,
                    t.DueDate,
                    t.IsCompleted,
                    t.CreatedAt,
                    t.UpdatedAt
                })
                .ToListAsync();
            return Ok(todos);
        }

        // POST: api/todos
        [HttpPost]
        public async Task<IActionResult> CreateTodo([FromBody] CreateTodoRequest request)
        {
            var userId = GetUserId();
            var orgId = GetOrganizationId();

            var todo = new Todo
            {
                Id = Guid.NewGuid(),
                OrganizationId = orgId,
                UserId = userId,
                Title = request.Title,
                Description = request.Description,
                DueDate = request.DueDate,
                IsCompleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Todos.Add(todo);
            await _context.SaveChangesAsync();
            return Ok(new { todo.Id, todo.Title, todo.Description, todo.DueDate, todo.IsCompleted });
        }

        // PUT: api/todos/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTodo(Guid id, [FromBody] UpdateTodoRequest request)
        {
            var userId = GetUserId();
            var orgId = GetOrganizationId();
            var todo = await _context.Todos.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && t.OrganizationId == orgId);
            if (todo == null) return NotFound();

            todo.Title = request.Title;
            todo.Description = request.Description;
            todo.DueDate = request.DueDate;
            todo.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok();
        }

        // PATCH: api/todos/{id}/toggle
        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> ToggleComplete(Guid id)
        {
            var userId = GetUserId();
            var orgId = GetOrganizationId();
            var todo = await _context.Todos.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && t.OrganizationId == orgId);
            if (todo == null) return NotFound();

            todo.IsCompleted = !todo.IsCompleted;
            todo.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { todo.IsCompleted });
        }

        // DELETE: api/todos/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTodo(Guid id)
        {
            var userId = GetUserId();
            var orgId = GetOrganizationId();
            var todo = await _context.Todos.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId && t.OrganizationId == orgId);
            if (todo == null) return NotFound();

            _context.Todos.Remove(todo);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}