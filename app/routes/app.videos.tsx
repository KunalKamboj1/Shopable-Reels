import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  ResourceList,
  ResourceItem,
  Text,
  Badge,
  Thumbnail,
  EmptyState,
  Button,
  InlineStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { getVideos } from "../models/Video.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const videos = await getVideos(session.shop);

  return json({ videos });
};

export default function VideosPage() {
  const { videos } = useLoaderData<typeof loader>();

  const emptyStateMarkup = (
    <EmptyState
      heading="Upload your first shoppable video"
      action={{
        content: "Upload video",
        url: "/app/videos/new",
      }}
      image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
    >
      <p>Tag products in your videos and boost your conversion rates.</p>
    </EmptyState>
  );

  return (
    <Page
      title="Videos"
      primaryAction={
        <Button variant="primary" url="/app/videos/new">
          Upload video
        </Button>
      }
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            {videos.length === 0 ? (
              emptyStateMarkup
            ) : (
              <ResourceList
                resourceName={{ singular: "video", plural: "videos" }}
                items={videos}
                renderItem={(item) => {
                  const { id, title, videoUrl, thumbnailUrl, productIds, createdAt } = item;
                  return (
                    <ResourceItem
                      id={id}
                      url={`/app/videos/${id}`}
                      media={
                        <Thumbnail
                          source={thumbnailUrl || ""}
                          alt={title || "Video thumbnail"}
                          size="large"
                        />
                      }
                    >
                      <InlineStack align="space-between">
                        <div>
                          <Text variant="bodyMd" fontWeight="bold" as="h3">
                            {title || "Untitled Video"}
                          </Text>
                          <div>{productIds.length} products tagged</div>
                        </div>
                        <Badge tone="info">
                           {new Date(createdAt).toLocaleDateString()}
                        </Badge>
                      </InlineStack>
                    </ResourceItem>
                  );
                }}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
