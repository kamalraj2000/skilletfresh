import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  CATEGORIES,
  type Category,
  listRecipes,
  getRecipe,
  searchRecipes,
  addRecipe,
  updateRecipe,
  deleteRecipe,
  type Recipe,
} from "@/lib/recipes";

const MAX_PAGE = 100;
const DEFAULT_PAGE = 20;
const CATEGORY_LIST = CATEGORIES.join(", ");

function formatMarkdown(r: Recipe): string {
  const total = r.prep_time_minutes + r.cook_time_minutes;
  return [
    `## ${r.name}`,
    `**ID**: \`${r.id}\`  **Category**: ${r.category}  **Servings**: ${r.servings}`,
    `**Prep**: ${r.prep_time_minutes} min  **Cook**: ${r.cook_time_minutes} min  **Total**: ${total} min`,
    "",
    r.description,
    "",
    "### Ingredients",
    ...r.ingredients.map((i) => `- ${i.quantity} ${i.name}`),
    "",
    "### Instructions",
    ...r.instructions.map((step, idx) => `${idx + 1}. ${step}`),
    "",
    `*Added: ${new Date(r.created_at).toLocaleDateString()}*`,
  ].join("\n");
}

const fmtField = z
  .enum(["markdown", "json"])
  .default("markdown")
  .describe("Output format: 'markdown' or 'json'");

const limitField = z
  .number().int().min(1).max(MAX_PAGE).default(DEFAULT_PAGE)
  .describe(`Max results (1-${MAX_PAGE}, default ${DEFAULT_PAGE})`);

const offsetField = z
  .number().int().min(0).default(0)
  .describe("Results to skip for pagination");

const handler = createMcpHandler(
  (server) => {
    // ── recipes_list ──────────────────────────────────────────────────────────
    server.registerTool(
      "recipes_list",
      {
        title: "List Recipes",
        description: `Browse all saved recipes with optional category filter and pagination.
Categories: ${CATEGORY_LIST}`,
        inputSchema: {
          category: z.string().optional().describe(`Filter by category: ${CATEGORY_LIST}`),
          limit: limitField,
          offset: offsetField,
          response_format: fmtField,
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ limit, offset, category, response_format }) => {
        const cat = category as Category | undefined;
        if (cat && !CATEGORIES.includes(cat)) {
          return { content: [{ type: "text", text: `Invalid category '${category}'. Valid: ${CATEGORY_LIST}` }] };
        }
        const result = await listRecipes({ limit, offset, category: cat });
        if (result.items.length === 0) {
          return { content: [{ type: "text", text: category ? `No recipes in '${category}'.` : "No recipes yet. Use recipes_add!" }] };
        }
        const out = { total: result.total, count: result.items.length, offset, has_more: result.has_more, ...(result.next_offset !== undefined ? { next_offset: result.next_offset } : {}), items: result.items };
        const text = response_format === "markdown"
          ? [
              `# Recipes (${result.total}${category ? ` · ${category}` : ""})`,
              `Showing ${result.items.length} of ${result.total}`, "",
              ...result.items.map((r) => `- **${r.name}** \`${r.id}\` — ${r.category} — ${r.prep_time_minutes + r.cook_time_minutes} min — ${r.servings} servings`),
              result.has_more ? `\n_More: offset=${result.next_offset}_` : "",
            ].join("\n")
          : JSON.stringify(out, null, 2);
        return { content: [{ type: "text", text }] };
      }
    );

    // ── recipes_get ───────────────────────────────────────────────────────────
    server.registerTool(
      "recipes_get",
      {
        title: "Get Recipe",
        description: "Retrieve full details of one recipe by its ID.",
        inputSchema: {
          id: z.string().min(1).describe("Recipe ID"),
          response_format: fmtField,
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ id, response_format }) => {
        const recipe = await getRecipe(id);
        if (!recipe) {
          return { content: [{ type: "text", text: `Recipe '${id}' not found. Use recipes_list to find IDs.` }] };
        }
        const text = response_format === "markdown" ? formatMarkdown(recipe) : JSON.stringify(recipe, null, 2);
        return { content: [{ type: "text", text }] };
      }
    );

    // ── recipes_search ────────────────────────────────────────────────────────
    server.registerTool(
      "recipes_search",
      {
        title: "Search Recipes",
        description: "Search recipes by name/description or ingredient using substring matching.",
        inputSchema: {
          query: z.string().min(2).max(200).describe("Search term (2-200 chars)"),
          search_by: z.enum(["name", "ingredient", "both"]).default("both")
            .describe("Fields to search: name, ingredient, or both"),
          limit: limitField,
          offset: offsetField,
          response_format: fmtField,
        },
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ query, search_by, limit, offset, response_format }) => {
        const result = await searchRecipes({ query, search_by, limit, offset });
        if (result.items.length === 0) {
          return { content: [{ type: "text", text: `No recipes found for '${query}'.` }] };
        }
        const out = { query, search_by, total: result.total, count: result.items.length, offset, has_more: result.has_more, ...(result.next_offset !== undefined ? { next_offset: result.next_offset } : {}), items: result.items };
        const text = response_format === "markdown"
          ? [
              `# Search: "${query}" (${result.total} found)`, "",
              ...result.items.map((r) => {
                const hits = r.ingredients.filter((i) => i.name.toLowerCase().includes(query.toLowerCase())).map((i) => i.name);
                return `- **${r.name}** \`${r.id}\`${hits.length ? ` _(has: ${hits.join(", ")})_` : ""}`;
              }),
              result.has_more ? `\n_More: offset=${result.next_offset}_` : "",
            ].join("\n")
          : JSON.stringify(out, null, 2);
        return { content: [{ type: "text", text }] };
      }
    );

    // ── recipes_add ───────────────────────────────────────────────────────────
    server.registerTool(
      "recipes_add",
      {
        title: "Add Recipe",
        description: `Save a new recipe. Returns the created recipe with its generated UUID.
category must be one of: ${CATEGORY_LIST}`,
        inputSchema: {
          name: z.string().min(1).max(200).describe("Recipe name"),
          description: z.string().min(1).max(500).describe("Short description"),
          category: z.string().describe(`Category: ${CATEGORY_LIST}`),
          ingredients: z.array(z.object({ name: z.string().min(1).max(200), quantity: z.string().min(1).max(50) }))
            .min(1).describe("Ingredients [{name, quantity}]"),
          instructions: z.array(z.string().min(1).max(1000)).min(1).describe("Ordered instruction steps"),
          servings: z.number().int().positive().describe("Number of servings"),
          prep_time_minutes: z.number().int().nonnegative().describe("Prep time (minutes)"),
          cook_time_minutes: z.number().int().nonnegative().describe("Cook time (minutes)"),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
      },
      async ({ name, description, category, ingredients, instructions, servings, prep_time_minutes, cook_time_minutes }) => {
        if (!CATEGORIES.includes(category as Category)) {
          return { content: [{ type: "text", text: `Invalid category '${category}'. Valid: ${CATEGORY_LIST}` }] };
        }
        const recipe = await addRecipe({ name, description, category: category as Category, ingredients, instructions, servings, prep_time_minutes, cook_time_minutes });
        return { content: [{ type: "text", text: ["Recipe added!", "", formatMarkdown(recipe)].join("\n") }] };
      }
    );

    // ── recipes_update ────────────────────────────────────────────────────────
    server.registerTool(
      "recipes_update",
      {
        title: "Update Recipe",
        description: "Update fields on an existing recipe. Only provided fields are changed.",
        inputSchema: {
          id: z.string().min(1).describe("Recipe ID to update"),
          name: z.string().min(1).max(200).optional(),
          description: z.string().min(1).max(500).optional(),
          category: z.string().optional().describe(`New category: ${CATEGORY_LIST}`),
          ingredients: z.array(z.object({ name: z.string().min(1), quantity: z.string().min(1) })).min(1).optional(),
          instructions: z.array(z.string().min(1)).min(1).optional(),
          servings: z.number().int().positive().optional(),
          prep_time_minutes: z.number().int().nonnegative().optional(),
          cook_time_minutes: z.number().int().nonnegative().optional(),
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      },
      async ({ id, category, ...rest }) => {
        if (category && !CATEGORIES.includes(category as Category)) {
          return { content: [{ type: "text", text: `Invalid category '${category}'. Valid: ${CATEGORY_LIST}` }] };
        }
        const recipe = await updateRecipe(id, { ...rest, ...(category ? { category: category as Category } : {}) });
        if (!recipe) return { content: [{ type: "text", text: `Recipe '${id}' not found.` }] };
        return { content: [{ type: "text", text: ["Recipe updated!", "", formatMarkdown(recipe)].join("\n") }] };
      }
    );

    // ── recipes_delete ────────────────────────────────────────────────────────
    server.registerTool(
      "recipes_delete",
      {
        title: "Delete Recipe",
        description: "Permanently delete a recipe by ID. Cannot be undone.",
        inputSchema: {
          id: z.string().min(1).describe("Recipe ID to delete"),
        },
        annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
      },
      async ({ id }) => {
        const deleted = await deleteRecipe(id);
        if (!deleted) return { content: [{ type: "text", text: `Recipe '${id}' not found.` }] };
        return { content: [{ type: "text", text: `Recipe '${id}' deleted.` }] };
      }
    );
  },
  {},
  {
    basePath: "/api",
    maxDuration: 60,
  }
);

// The MCP route is excluded from NextAuth in middleware.ts — it must be
// callable by headless agents, not browsers with session cookies. That means
// this bearer check is the ONLY thing between the internet and recipes_delete.
// MCP_API_KEY unset (local dev) leaves the route open.
function withBearerAuth(h: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const expected = process.env.MCP_API_KEY;
    if (expected && req.headers.get("authorization") !== `Bearer ${expected}`) {
      return Response.json(
        { error: "unauthorized" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
      );
    }
    return h(req);
  };
}

const authedHandler = withBearerAuth(handler);

export { authedHandler as GET, authedHandler as POST };
