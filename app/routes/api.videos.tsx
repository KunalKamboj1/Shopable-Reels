import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { getVideos } from "../models/Video.server";
import { unauthenticated } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    return json({ error: "Missing shop parameter" }, { status: 400 });
  }

  // We use unauthenticated because this is called from the storefront
  const videos = await getVideos(shop);

  // Return videos with needed data for the widget
  return json({
    videos: videos.map(v => ({
      id: v.id,
      videoUrl: v.videoUrl,
      thumbnailUrl: v.thumbnailUrl,
      title: v.title,
      productIds: v.productIds,
    }))
  }, {
    headers: {
      "Access-Control-Allow-Origin": "*",
    }
  });
};
