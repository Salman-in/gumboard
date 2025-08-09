import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string; noteId: string } }) {
  const comments = await db.comment.findMany({
    where: { noteId: params.noteId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: { params: { id: string; noteId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { content } = await req.json();
  if (!content || !content.trim()) return NextResponse.json({ error: "Empty comment" }, { status: 400 });

  const comment = await db.comment.create({
    data: {
      content: content.trim(),
      note: { connect: { id: params.noteId } },
      user: { connect: { id: session.user.id } },
    },
    include: { user: true },
  });

  return NextResponse.json({ comment });
}