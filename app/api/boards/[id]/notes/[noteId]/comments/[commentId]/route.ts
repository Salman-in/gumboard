import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; noteId: string; commentId: string }> }
) {
  const { id, noteId, commentId } = await context.params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    });

    if (comment.userId !== session.user.id && !user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true, deletedCommentId: commentId });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
