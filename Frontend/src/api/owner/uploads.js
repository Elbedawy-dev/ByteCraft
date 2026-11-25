import { useMutation } from '@tanstack/react-query';
import api, { ApiError, buildApiUrl, handleGlobalUnauthorized } from '../client';
import i18n from '../../i18n';

const MAX_FILES_PER_BATCH = 10;

function redirectOnOwnerUnauthorized() {
  handleGlobalUnauthorized();
}

function uploadBatch(batchFiles, onBatchProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    for (const file of batchFiles) {
      formData.append('images', file);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', buildApiUrl('/owner/uploads/images'));
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && typeof onBatchProgress === 'function') {
        const pct = Math.min(100, Math.round((event.loaded / event.total) * 100));
        onBatchProgress(pct);
      }
    };

    xhr.onerror = () => {
      reject(
        new ApiError({
          status: 0,
          code: 'NETWORK_ERROR',
          message: i18n.t('common:errors.network'),
        })
      );
    };

    xhr.onabort = () => {
      reject(new DOMException('Upload aborted', 'AbortError'));
    };

    xhr.onload = () => {
      let payload = null;
      try {
        payload = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        payload = null;
      }

      if (xhr.status < 200 || xhr.status >= 300 || (payload && payload.success === false)) {
        const errObj = payload?.error || {};
        const status = xhr.status;
        const code =
          errObj.code ||
          (status === 429
            ? 'TOO_MANY_REQUESTS'
            : status === 401
              ? 'UNAUTHORIZED'
              : 'INTERNAL_ERROR');

        const message =
          status === 429
            ? i18n.t('common:errors.rateLimited')
            : errObj.message ||
              i18n.t(`common:errors.codes.${code}`, {
                defaultValue: i18n.t('common:errors.generic'),
              });

        if (status === 401) {
          redirectOnOwnerUnauthorized();
        }

        reject(
          new ApiError({
            status,
            code,
            message,
            details: errObj.details || [],
          })
        );
        return;
      }

      resolve(Array.isArray(payload?.data?.images) ? payload.data.images : []);
    };

    xhr.send(formData);
  });
}

/**
 * Uploads one or more project images via POST /api/owner/uploads/images.
 * Automatically batches requests into groups of 10 (the backend multer limit)
 * while reporting aggregate progress (0..100).
 */
export async function uploadOwnerImages(files, { onProgress } = {}) {
  const fileList = Array.from(files || []).filter(Boolean);
  if (fileList.length === 0) return [];

  const batches = [];
  for (let i = 0; i < fileList.length; i += MAX_FILES_PER_BATCH) {
    batches.push(fileList.slice(i, i + MAX_FILES_PER_BATCH));
  }

  const uploaded = [];
  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    const imgs = await uploadBatch(batch, (batchPct) => {
      if (typeof onProgress === 'function') {
        const overall = Math.round(((index + batchPct / 100) / batches.length) * 100);
        onProgress(overall);
      }
    });
    uploaded.push(...imgs);
  }

  if (typeof onProgress === 'function') {
    onProgress(100);
  }

  return uploaded;
}

/**
 * Deletes an uploaded image asset by publicId via DELETE /api/owner/uploads.
 */
export async function deleteOwnerUpload(publicId) {
  if (!publicId) return null;
  const { data } = await api.delete('/owner/uploads', {
    body: { publicId },
  });
  return data;
}

export function useUploadOwnerImages() {
  return useMutation({
    mutationFn: ({ files, onProgress }) => uploadOwnerImages(files, { onProgress }),
  });
}

export function useDeleteOwnerUpload() {
  return useMutation({
    mutationFn: (publicId) => deleteOwnerUpload(publicId),
  });
}
