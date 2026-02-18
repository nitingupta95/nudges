import { NextResponse } from "next/server";
import {
  createEvent,
  getEvents,
  getEventById,
  getEventCountsByJob,
  getEventAggregations,
  deleteOldEvents,
} from "@/services/events/event.service";
import { EventType } from "@/lib/generated/prisma/client";

// ============================================
// POST: Create a new event
// ============================================
/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags:
 *       - Events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Event type
 *               userId:
 *                 type: string
 *                 description: User ID
 *               jobId:
 *                 type: string
 *                 description: Job ID
 *               referralId:
 *                 type: string
 *                 description: Referral ID
 *               metadata:
 *                 type: object
 *                 description: Additional event metadata
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 *   get:
 *     summary: Fetch events with filters
 *     tags:
 *       - Events
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: jobId
 *         schema:
 *           type: string
 *       - in: query
 *         name: referralId
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of events
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete old events (data retention policy)
 *     tags:
 *       - Events
 *     parameters:
 *       - in: query
 *         name: olderThanDays
 *         schema:
 *           type: integer
 *         required: true
 *         description: Delete events older than this number of days
 *     responses:
 *       200:
 *         description: Old events deleted
 *       400:
 *         description: Missing or invalid parameter
 *       500:
 *         description: Server error
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { type, userId, jobId, referralId, metadata } = body;

    // Validate required fields
    if (!type || !userId) {
      return NextResponse.json(
        { error: "Event type and userId are required" },
        { status: 400 }
      );
    }

    // Validate event type
    if (!Object.values(EventType).includes(type)) {
      return NextResponse.json(
        { error: `Invalid event type: ${type}` },
        { status: 400 }
      );
    }

    const event = await createEvent({
      type,
      userId,
      jobId,
      referralId,
      metadata,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}

// ============================================
// GET: Fetch events with filters
// ============================================
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      userId: searchParams.get("userId") || undefined,
      jobId: searchParams.get("jobId") || undefined,
      referralId: searchParams.get("referralId") || undefined,
      type: searchParams.get("type") as EventType | undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined,
      limit: searchParams.get("limit")
        ? parseInt(searchParams.get("limit")!)
        : 100,
      offset: searchParams.get("offset")
        ? parseInt(searchParams.get("offset")!)
        : 0,
    };

    const events = await getEvents(filters);

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// ============================================
// DELETE: Delete old events (data retention policy)
// ============================================
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const olderThanDays = searchParams.get("olderThanDays")
      ? parseInt(searchParams.get("olderThanDays")!)
      : undefined;

    if (!olderThanDays) {
      return NextResponse.json(
        { error: "olderThanDays query parameter is required" },
        { status: 400 }
      );
    }

    const result = await deleteOldEvents(olderThanDays);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Error deleting old events:", error);
    return NextResponse.json(
      { error: "Failed to delete old events" },
      { status: 500 }
    );
  }
}

// ============================================
// GET: Fetch a specific event by ID
// ============================================
export async function GET_EVENT_BY_ID(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const event = await getEventById(id);

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

// ============================================
// GET: Fetch event counts for a specific job
// ============================================
export async function GET_JOB_EVENT_STATS(req: Request, { params }: { params: { jobId: string } }) {
  try {
    const { jobId } = params;

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const stats = await getEventCountsByJob(jobId);

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching job event stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch job event stats" },
      { status: 500 }
    );
  }
}

// ============================================
// GET: Fetch aggregated event counts
// ============================================
export async function GET_EVENT_AGGREGATIONS(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      userId: searchParams.get("userId") || undefined,
      jobId: searchParams.get("jobId") || undefined,
      startDate: searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined,
      endDate: searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined,
    };

    const aggregations = await getEventAggregations(filters);

    return NextResponse.json({ aggregations });
  } catch (error) {
    console.error("Error fetching event aggregations:", error);
    return NextResponse.json(
      { error: "Failed to fetch event aggregations" },
      { status: 500 }
    );
  }
}
