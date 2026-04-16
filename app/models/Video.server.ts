import prisma from "../db.server";

export async function getVideos(shop: string) {
  return prisma.video.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });
}

export async function getVideo(id: string) {
  return prisma.video.findUnique({
    where: { id },
  });
}

export async function createVideo(data: {
  shop: string;
  shopifyFileId: string;
  videoUrl: string;
  thumbnailUrl: string;
  title?: string;
  productIds: string[];
}) {
  return prisma.video.create({
    data,
  });
}

export async function deleteVideo(id: string) {
  return prisma.video.delete({
    where: { id },
  });
}

export async function updateVideo(id: string, data: Partial<{
  title: string;
  productIds: string[];
}>) {
  return prisma.video.update({
    where: { id },
    data,
  });
}
