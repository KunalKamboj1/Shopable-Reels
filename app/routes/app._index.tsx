import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  InlineGrid,
  Box,
  Badge,
  EmptyState,
  Button,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  
  const statsRows = await prisma.event.groupBy({
    by: ['type'],
    where: { shop: session.shop },
    _count: {
        _all: true
    },
  });

  const videosCount = await prisma.video.count({
    where: { shop: session.shop }
  });

  const stats = {
      impression: statsRows.find(r => r.type === 'impression')?._count._all || 0,
      play: statsRows.find(r => r.type === 'play')?._count._all || 0,
      click: statsRows.find(r => r.type === 'click')?._count._all || 0,
  };

  return json({ stats, videosCount });
};

export default function Index() {
  const { stats, videosCount } = useLoaderData<typeof loader>();

  return (
    <Page title="Dashboard">
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <InlineGrid columns={3} gap="400">
              <StatCard title="Total Impressions" value={stats.impression} tone="info" />
              <StatCard title="Video Plays" value={stats.play} tone="success" />
              <StatCard title="Product Clicks" value={stats.click} tone="attention" />
            </InlineGrid>
          </Layout.Section>

          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">App Status</Text>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="bodyMd" as="p">You have <strong>{videosCount}</strong> videos active.</Text>
                    <Button url="/app/videos">Manage Videos</Button>
                </div>
              </BlockStack>
            </Card>
          </Layout.Section>

          {videosCount === 0 && (
            <Layout.Section>
                <Card>
                    <EmptyState
                        heading="Get started by uploading a video"
                        action={{ content: 'Upload Video', url: '/app/videos/new' }}
                        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                    >
                        <p>Upload a video and tag products to see analytics here.</p>
                    </EmptyState>
                </Card>
            </Layout.Section>
          )}
        </Layout>
      </BlockStack>
    </Page>
  );
}

function StatCard({ title, value, tone }: { title: string; value: number; tone: any }) {
    return (
        <Card>
            <BlockStack gap="200">
                <Text variant="headingSm" as="h3" tone="subdued">{title}</Text>
                <InlineGrid columns="1fr auto" alignItems="center">
                    <Text variant="headingLg" as="p">{value.toLocaleString()}</Text>
                    <Badge tone={tone}>+0%</Badge>
                </InlineGrid>
            </BlockStack>
        </Card>
    );
}
