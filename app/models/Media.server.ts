import { AdminApiContext } from "@shopify/shopify-app-remix/server";

export async function createStagedUpload(admin: AdminApiContext, filename: string, mimeType: string, fileSize: string) {
  const STAGED_UPLOADS_CREATE = `#graphql
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(STAGED_UPLOADS_CREATE, {
    variables: {
      input: [
        {
          filename,
          mimeType,
          resource: "VIDEO",
          fileSize,
        },
      ],
    },
  });

  const result = await response.json();
  if (result.data?.stagedUploadsCreate?.userErrors?.length > 0) {
    throw new Error(result.data.stagedUploadsCreate.userErrors[0].message);
  }
  return result.data.stagedUploadsCreate.stagedTargets[0];
}

export async function createShopifyFile(admin: AdminApiContext, originalSource: string) {
  const FILE_CREATE = `#graphql
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          fileStatus
          alt
          ... on Video {
            id
            originalSource {
              url
            }
            preview {
              image {
                url
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(FILE_CREATE, {
    variables: {
      files: [
        {
          originalSource,
          contentType: "VIDEO",
        },
      ],
    },
  });

  const result = await response.json();
  if (result.data?.fileCreate?.userErrors?.length > 0) {
    throw new Error(result.data.fileCreate.userErrors[0].message);
  }
  return result.data.fileCreate.files[0];
}

export async function deleteShopifyFile(admin: AdminApiContext, fileId: string) {
    const FILE_DELETE = `#graphql
        mutation fileDelete($fileIds: [ID!]!) {
            fileDelete(fileIds: $fileIds) {
                deletedFileIds
                userErrors {
                    field
                    message
                }
            }
        }
    `;

    const response = await admin.graphql(FILE_DELETE, {
        variables: {
            fileIds: [fileId],
        },
    });

    const result = await response.json();
    return result.data.fileDelete;
}

export async function getFileStatus(admin: AdminApiContext, id: string) {
  const FILE_QUERY = `#graphql
    query getFile($id: ID!) {
      node(id: $id) {
        ... on Video {
          id
          fileStatus
          originalSource {
            url
          }
          preview {
            image {
              url
            }
          }
        }
      }
    }
  `;

  const response = await admin.graphql(FILE_QUERY, {
    variables: { id },
  });

  const result = await response.json();
  return result.data.node;
}
