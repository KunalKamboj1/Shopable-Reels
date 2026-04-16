import { useState, useCallback } from "react";
import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useNavigation, Form, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  TextField,
  Button,
  FormLayout,
  DropZone,
  BlockStack,
  Text,
  Thumbnail,
  Banner,
  List,
} from "@shopify/polaris";
import { NoteIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import { createStagedUpload, createShopifyFile } from "../models/Media.server";
import { createVideo } from "../models/Video.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json({});
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "get-staged-url") {
    const filename = formData.get("filename") as string;
    const mimeType = formData.get("mimeType") as string;
    const fileSize = formData.get("fileSize") as string;

    try {
      const stagedTarget = await createStagedUpload(admin, filename, mimeType, fileSize);
      return json({ stagedTarget });
    } catch (error: any) {
      return json({ error: error.message }, { status: 400 });
    }
  }

  if (intent === "finalize-upload") {
    const resourceUrl = formData.get("resourceUrl") as string;
    const title = formData.get("title") as string;
    const productIdsStr = formData.get("productIds") as string;
    const productIds = productIdsStr ? JSON.parse(productIdsStr) : [];

    try {
        const shopifyFile = await createShopifyFile(admin, resourceUrl);
        
        await createVideo({
            shop: session.shop,
            shopifyFileId: shopifyFile.id,
            videoUrl: shopifyFile.originalSource?.url || "",
            thumbnailUrl: shopifyFile.preview?.image?.url || "",
            title,
            productIds,
        });

        return redirect("/app/videos");
    } catch (error: any) {
        return json({ error: error.message }, { status: 400 });
    }
  }

  return json({});
};

export default function NewVideoPage() {
  const [file, setFile] = useState<File>();
  const [title, setTitle] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const handleDropZoneDrop = useCallback(
    (_dropFiles: File[], acceptedFiles: File[], _rejectedFiles: File[]) =>
      setFile(acceptedFiles[0]),
    [],
  );

  const selectProducts = async () => {
    const selected = await window.shopify.resourcePicker({
      type: "product",
      multiple: true,
      selectionIds: selectedProducts.map(p => ({ id: p.id })),
    });

    if (selected) {
      setSelectedProducts(selected);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please select a video file.");
      return;
    }

    setUploading(true);
    setError(undefined);

    try {
      // 1. Get staged upload URL
      const stagedFormData = new FormData();
      stagedFormData.append("intent", "get-staged-url");
      stagedFormData.append("filename", file.name);
      stagedFormData.append("mimeType", file.type);
      stagedFormData.append("fileSize", file.size.toString());

      // We call the action directly to get the target
      const response = await fetch("", {
        method: "POST",
        body: stagedFormData,
      });
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      const { stagedTarget } = data;

      // 2. Upload file to Shopify signed URL
      const uploadFormData = new FormData();
      stagedTarget.parameters.forEach(({ name, value }: any) => {
        uploadFormData.append(name, value);
      });
      uploadFormData.append("file", file);

      const uploadResponse = await fetch(stagedTarget.url, {
        method: "POST",
        body: uploadFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload video to Shopify storage.");
      }

      // 3. Finalize upload and save to DB
      const finalizeFormData = new FormData();
      finalizeFormData.append("intent", "finalize-upload");
      finalizeFormData.append("resourceUrl", stagedTarget.resourceUrl);
      finalizeFormData.append("title", title);
      finalizeFormData.append("productIds", JSON.stringify(selectedProducts.map(p => p.id)));

      submit(finalizeFormData, { method: "POST" });
    } catch (err: any) {
      setError(err.message);
      setUploading(false);
    }
  };

  const fileUploadMarkup = file ? (
    <BlockStack gap="200">
      <Thumbnail size="large" alt={file.name} source={NoteIcon} />
      <div>
        {file.name}{" "}
        <Text variant="bodySm" as="span" tone="subdued">
          {(file.size / (1024 * 1024)).toFixed(2)} MB
        </Text>
      </div>
    </BlockStack>
  ) : (
    <DropZone.FileUpload />
  );

  return (
    <Page
      title="Upload Video"
      backAction={{ content: "Videos", url: "/app/videos" }}
    >
      <Layout>
        <Layout.Section>
          <FormLayout>
            <Card>
              <BlockStack gap="400">
                <TextField
                  label="Title"
                  value={title}
                  onChange={setTitle}
                  autoComplete="off"
                  placeholder="E.g. Summer Collection Reel"
                />
                <DropZone onDrop={handleDropZoneDrop} accept="video/*" type="video">
                  {fileUploadMarkup}
                </DropZone>
              </BlockStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd" as="h2">Tagged Products</Text>
                <Button onClick={selectProducts}>Select Products</Button>
                {selectedProducts.length > 0 && (
                  <List type="bullet">
                    {selectedProducts.map((product) => (
                      <List.Item key={product.id}>{product.title}</List.Item>
                    ))}
                  </List>
                )}
              </BlockStack>
            </Card>

            {error && (
              <Banner tone="critical">
                <p>{error}</p>
              </Banner>
            )}

            <PageActions
                primaryAction={
                    <Button
                        variant="primary"
                        loading={uploading || navigation.state === "submitting"}
                        onClick={handleSubmit}
                        disabled={!file}
                    >
                        Save Video
                    </Button>
                }
            />
          </FormLayout>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function PageActions({ primaryAction }: { primaryAction: React.ReactNode }) {
    return (
        <div style={{ marginTop: "20px" }}>
            <InlineStack align="end">{primaryAction}</InlineStack>
        </div>
    );
}

import { InlineStack } from "@shopify/polaris";
