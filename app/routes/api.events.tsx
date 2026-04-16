import { json, type ActionFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
        return new Response(null, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        });
    }

    if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, { status: 405 });
    }

    try {
        const body = await request.json();
        const { videoId, type, shop, productId } = body;

        if (!videoId || !type || !shop) {
            return json({ error: "Missing required fields" }, { status: 400 });
        }

        await prisma.event.create({
            data: {
                videoId,
                type,
                shop,
                productId: productId || null,
            },
        });

        return json({ success: true }, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            }
        });
    } catch (err) {
        console.error("Analytics API Error:", err);
        return json({ error: "Internal server error" }, { status: 500 });
    }
};
