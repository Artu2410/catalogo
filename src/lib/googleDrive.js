const DEFAULT_DRIVE_FOLDER_URL =
  process.env.GOOGLE_DRIVE_FOLDER_URL ||
  'https://drive.google.com/drive/folders/1FHIZQxGPt64o0128CNEP8v-vnLbip1_x?usp=sharing';

const DRIVE_FOLDER_CACHE_TTL_MS = 10 * 60 * 1000;
const DRIVE_FILE_PATTERN =
  /\\x5b\\x22([A-Za-z0-9_-]{20,})\\x22,\\x5b\\x22([A-Za-z0-9_-]{20,})\\x22\\x5d,\\x22([^\\]+?)\\x22,\\x22image\\\/([^\\]+?)\\x22/g;

let driveFolderCache = {
  expiresAt: 0,
  files: [],
};

function extractDriveFolderId(input = '') {
  const trimmed = String(input).trim();
  if (!trimmed) return '';

  const fromFolderPath = trimmed.match(/\/folders\/([A-Za-z0-9_-]+)/);
  if (fromFolderPath) return fromFolderPath[1];

  const fromQuery = trimmed.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (fromQuery) return fromQuery[1];

  return /^[A-Za-z0-9_-]{20,}$/.test(trimmed) ? trimmed : '';
}

function extractDriveFileId(input = '') {
  const trimmed = String(input).trim();
  if (!trimmed) return '';

  const patterns = [
    /\/file\/d\/([A-Za-z0-9_-]{20,})/,
    /[?&]id=([A-Za-z0-9_-]{20,})/,
    /\/thumbnail\?[^#]*\bid=([A-Za-z0-9_-]{20,})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }

  return /^[A-Za-z0-9_-]{20,}$/.test(trimmed) ? trimmed : '';
}

function stripExtension(value = '') {
  return String(value).replace(/\.[^.]+$/, '');
}

function normalizeImageKey(value = '') {
  return stripExtension(String(value))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[x×*]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function decodeDriveString(value = '') {
  return String(value).replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function buildDriveImageUrl(fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

function isRemoteUrl(value = '') {
  return /^https?:\/\//i.test(String(value).trim());
}

async function fetchDriveFolderFiles() {
  const folderId = extractDriveFolderId(DEFAULT_DRIVE_FOLDER_URL);
  if (!folderId) return [];

  if (driveFolderCache.expiresAt > Date.now()) {
    return driveFolderCache.files;
  }

  try {
    const response = await fetch(DEFAULT_DRIVE_FOLDER_URL, {
      cache: 'no-store',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Drive folder request failed with ${response.status}`);
    }

    const html = await response.text();
    const files = [];
    const seen = new Set();

    for (const match of html.matchAll(DRIVE_FILE_PATTERN)) {
      const fileId = match[1];
      const parentId = match[2];
      const rawName = decodeDriveString(match[3]);
      const mimeType = decodeDriveString(match[4]);

      if (parentId !== folderId) continue;

      const key = normalizeImageKey(rawName);
      if (!key) continue;

      const dedupeKey = `${key}:${fileId}`;
      if (seen.has(dedupeKey)) continue;

      seen.add(dedupeKey);
      files.push({
        id: fileId,
        name: rawName,
        mimeType,
        key,
      });
    }

    driveFolderCache = {
      expiresAt: Date.now() + DRIVE_FOLDER_CACHE_TTL_MS,
      files,
    };

    return files;
  } catch (error) {
    console.error('Failed to load Google Drive folder images:', error);
    driveFolderCache = {
      expiresAt: Date.now() + 60 * 1000,
      files: [],
    };
    return [];
  }
}

function findDriveFileByKey(reference, driveFiles) {
  const normalizedReference = normalizeImageKey(reference);
  if (!normalizedReference) return null;

  const exactMatches = driveFiles.filter((file) => file.key === normalizedReference);
  if (exactMatches.length) return exactMatches[0];

  const fuzzyMatches = driveFiles.filter(
    (file) =>
      file.key.includes(normalizedReference) ||
      normalizedReference.includes(file.key)
  );

  return fuzzyMatches.length === 1 ? fuzzyMatches[0] : null;
}

function tokenizeNormalizedValue(value = '') {
  return normalizeImageKey(value)
    .split(' ')
    .filter(Boolean);
}

function findDriveFileByContext(product, driveFiles) {
  const referenceTokens = new Set([
    ...tokenizeNormalizedValue(product.name),
    ...tokenizeNormalizedValue(product.description),
  ]);

  if (!referenceTokens.size) return null;

  let bestMatch = null;

  for (const file of driveFiles) {
    const fileTokens = tokenizeNormalizedValue(file.name);
    const score = fileTokens.reduce(
      (total, token) => total + (referenceTokens.has(token) ? 1 : 0),
      0
    );

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { file, score };
      continue;
    }

    if (
      score === bestMatch.score &&
      fileTokens.length < tokenizeNormalizedValue(bestMatch.file.name).length
    ) {
      bestMatch = { file, score };
    }
  }

  return bestMatch && bestMatch.score >= 2 ? bestMatch.file : null;
}

function buildDriveCandidates(product = {}) {
  const candidates = new Set();
  const image = String(product.image || '').trim();
  const imageBasename = image.split('/').pop() || '';

  if (image) {
    candidates.add(image);
  }

  if (imageBasename && imageBasename !== image) {
    candidates.add(imageBasename);
  }

  if (product.name) {
    candidates.add(product.name);
  }

  if (product.description) {
    candidates.add(product.description);
  }

  return [...candidates];
}

function resolveDriveImage(product, driveFiles) {
  const originalImage = String(product.image || '').trim();

  if (originalImage) {
    const directDriveId = extractDriveFileId(originalImage);
    if (directDriveId) {
      return buildDriveImageUrl(directDriveId);
    }

    if (isRemoteUrl(originalImage)) {
      return originalImage;
    }
  }

  for (const candidate of buildDriveCandidates(product)) {
    const driveFile = findDriveFileByKey(candidate, driveFiles);
    if (driveFile) {
      return buildDriveImageUrl(driveFile.id);
    }
  }

  const contextualMatch = findDriveFileByContext(product, driveFiles);
  if (contextualMatch) {
    return buildDriveImageUrl(contextualMatch.id);
  }

  return originalImage;
}

export async function hydrateProductsWithDriveImages(products = []) {
  const driveFiles = await fetchDriveFolderFiles();

  if (!driveFiles.length) {
    return products;
  }

  return products.map((product) => ({
    ...product,
    image: resolveDriveImage(product, driveFiles),
  }));
}
