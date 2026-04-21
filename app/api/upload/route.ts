import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "File is required." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json(
      { error: "Unsupported file type. Use jpg, png, webp, or gif." },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File too large (max 5MB)." }, { status: 400 });
  }

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const safeExt = (ext ?? "png").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "png";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;
  const filePath = path.join(uploadsDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return Response.json({ url: `/uploads/${filename}` });
}
