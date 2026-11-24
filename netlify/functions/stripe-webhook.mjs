// Bundled from ~/Sites/motion-demos/functions/stripe-webhook.src.mjs by tools/bundle_function.sh. Edit the source, not this file.

// functions/stripe-webhook.src.mjs
import { createHmac, timingSafeEqual } from "node:crypto";

// node_modules/@netlify/blobs/node_modules/@netlify/runtime-utils/dist/main.js
var getString = (input) => typeof input === "string" ? input : JSON.stringify(input);
var base64Decode = globalThis.Buffer ? (input) => Buffer.from(input, "base64").toString() : (input) => atob(input);
var base64Encode = globalThis.Buffer ? (input) => Buffer.from(getString(input)).toString("base64") : (input) => btoa(getString(input));
var getEnvironment = () => {
  const { Deno, Netlify, process: process2 } = globalThis;
  return Netlify?.env ?? Deno?.env ?? {
    delete: (key) => delete process2?.env[key],
    get: (key) => process2?.env[key],
    has: (key) => Boolean(process2?.env[key]),
    set: (key, value) => {
      if (process2?.env) {
        process2.env[key] = value;
      }
    },
    toObject: () => process2?.env ?? {}
  };
};

// node_modules/@netlify/otel/dist/main.js
var GET_TRACER = "__netlify__getTracer";
var getTracer = (name, version) => {
  return globalThis[GET_TRACER]?.(name, version);
};
function withActiveSpan(tracer, name, optionsOrFn, contextOrFn, fn) {
  const func = typeof contextOrFn === "function" ? contextOrFn : typeof optionsOrFn === "function" ? optionsOrFn : fn;
  if (!func) {
    throw new Error("function to execute with active span is missing");
  }
  if (!tracer) {
    return func();
  }
  return tracer.withActiveSpan(name, optionsOrFn, contextOrFn, func);
}

// node_modules/@netlify/blobs/dist/chunk-SQCJ2S3G.js
var getEnvironmentContext = () => {
  const context = globalThis.netlifyBlobsContext || getEnvironment().get("NETLIFY_BLOBS_CONTEXT");
  if (typeof context !== "string" || !context) {
    return {};
  }
  const data = base64Decode(context);
  try {
    return JSON.parse(data);
  } catch {
  }
  return {};
};
var MissingBlobsEnvironmentError = class extends Error {
  constructor(requiredProperties) {
    super(
      `The environment has not been configured to use Netlify Blobs. To use it manually, supply the following properties when creating a store: ${requiredProperties.join(
        ", "
      )}`
    );
    this.name = "MissingBlobsEnvironmentError";
  }
};
var BASE64_PREFIX = "b64;";
var METADATA_HEADER_INTERNAL = "x-amz-meta-user";
var METADATA_HEADER_EXTERNAL = "netlify-blobs-metadata";
var METADATA_MAX_SIZE = 2 * 1024;
var encodeMetadata = (metadata) => {
  if (!metadata) {
    return null;
  }
  const encodedObject = base64Encode(JSON.stringify(metadata));
  const payload = `b64;${encodedObject}`;
  if (METADATA_HEADER_EXTERNAL.length + payload.length > METADATA_MAX_SIZE) {
    throw new Error("Metadata object exceeds the maximum size");
  }
  return payload;
};
var decodeMetadata = (header) => {
  if (!header?.startsWith(BASE64_PREFIX)) {
    return {};
  }
  const encodedData = header.slice(BASE64_PREFIX.length);
  const decodedData = base64Decode(encodedData);
  const metadata = JSON.parse(decodedData);
  return metadata;
};
var getMetadataFromResponse = (response) => {
  if (!response.headers) {
    return {};
  }
  const value = response.headers.get(METADATA_HEADER_EXTERNAL) || response.headers.get(METADATA_HEADER_INTERNAL);
  try {
    return decodeMetadata(value);
  } catch {
    throw new Error(
      "An internal error occurred while trying to retrieve the metadata for an entry. Please try updating to the latest version of the Netlify Blobs client."
    );
  }
};
var NF_ERROR = "x-nf-error";
var NF_REQUEST_ID = "x-nf-request-id";
var DEPLOY_STORE_PREFIX = "deploy:";
var SITE_STORE_PREFIX = "site:";
var isDeniedWrite = (res, { method, storeName }) => (res.status === 401 || res.status === 403) && (method === "put" || method === "delete") && storeName !== void 0 && !storeName.startsWith(DEPLOY_STORE_PREFIX);
var blobsErrorMessage = (res, context, responseBody) => {
  let details = res.headers.get(NF_ERROR) || `${res.status} status code`;
  if (res.headers.has(NF_REQUEST_ID)) {
    details += `, ID: ${res.headers.get(NF_REQUEST_ID)}`;
  }
  if (isDeniedWrite(res, context)) {
    const storeName = context.storeName?.startsWith(SITE_STORE_PREFIX) ? context.storeName.slice(SITE_STORE_PREFIX.length) : context.storeName;
    const summary = `Netlify Blobs could not write to store '${storeName}' (${details}).`;
    if (context.edgeAccess) {
      return summary;
    }
    return `${summary} Builds and build plugins can only write to deploy-specific stores: use 'getDeployStore' instead of 'getStore', or pass a 'token' with write access to the store. If this code is not running in a build, check that the token and site ID are valid. See https://docs.netlify.com/build/data-and-storage/netlify-blobs/#deploy-specific-stores`;
  }
  let message = `Netlify Blobs has generated an internal error (${details})`;
  if (!res.headers.get(NF_ERROR) && responseBody) {
    message += `: ${responseBody}`;
  }
  return message;
};
var BlobsInternalError = class extends Error {
  constructor(res, context = {}, responseBody) {
    super(blobsErrorMessage(res, context, responseBody));
    this.name = "BlobsInternalError";
    this.status = res.status;
    this.responseBody = responseBody;
  }
};
var createBlobsInternalError = async (res, context = {}) => {
  const responseBody = await res.clone().text().catch(() => void 0);
  return new BlobsInternalError(res, context, responseBody);
};
var discardBody = async (res) => {
  await res.body?.cancel().catch(() => {
  });
};
var collectIterator = async (iterator) => {
  const result = [];
  for await (const item of iterator) {
    result.push(item);
  }
  return result;
};
function withSpan(span, name, fn) {
  if (span) return fn(span);
  return withActiveSpan(getTracer(), name, (span2) => {
    return fn(span2);
  });
}
var BlobsConsistencyError = class extends Error {
  constructor() {
    super(
      `Netlify Blobs has failed to perform a read using strong consistency because the environment has not been configured with a 'uncachedEdgeURL' property`
    );
    this.name = "BlobsConsistencyError";
  }
};
var REGION_AUTO = "auto";
var regions = {
  "us-east-1": true,
  "us-east-2": true,
  "eu-central-1": true,
  "ap-southeast-1": true,
  "ap-southeast-2": true
};
var isValidRegion = (input) => Object.keys(regions).includes(input);
var InvalidBlobsRegionError = class extends Error {
  constructor(region) {
    super(
      `${region} is not a supported Netlify Blobs region. Supported values are: ${Object.keys(regions).join(", ")}.`
    );
    this.name = "InvalidBlobsRegionError";
  }
};
var DEFAULT_RETRY_DELAY = getEnvironment().get("NODE_ENV") === "test" ? 1 : 5e3;
var MIN_RETRY_DELAY = 1e3;
var MAX_RETRY = 5;
var RATE_LIMIT_HEADER = "X-RateLimit-Reset";
var fetchAndRetry = async (fetch2, url, options, attemptsLeft = MAX_RETRY, getRetryUrl) => {
  try {
    const res = await fetch2(url, options);
    const isRetryable = res.status === 429 || res.status >= 500 || getRetryUrl !== void 0 && res.status === 403;
    if (attemptsLeft > 0 && isRetryable) {
      await discardBody(res);
      const delay = getDelay(res.headers.get(RATE_LIMIT_HEADER));
      await sleep(delay);
      const retryUrl = getRetryUrl ? await getRetryUrl() : url;
      return fetchAndRetry(fetch2, retryUrl, options, attemptsLeft - 1, getRetryUrl);
    }
    return res;
  } catch (error) {
    if (attemptsLeft === 0) {
      throw error;
    }
    const delay = getDelay();
    await sleep(delay);
    const retryUrl = getRetryUrl ? await getRetryUrl() : url;
    return fetchAndRetry(fetch2, retryUrl, options, attemptsLeft - 1, getRetryUrl);
  }
};
var getDelay = (rateLimitReset) => {
  if (!rateLimitReset) {
    return DEFAULT_RETRY_DELAY;
  }
  return Math.max(Number(rateLimitReset) * 1e3 - Date.now(), MIN_RETRY_DELAY);
};
var sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});
var SIGNED_URL_ACCEPT_HEADER = "application/json;type=signed-url";
var Client = class {
  /**
   * Whether requests reach Blobs through the edge rather than the API. Only
   * runtime environments are given an edge URL.
   */
  get edgeAccess() {
    return this.edgeURL !== void 0;
  }
  constructor({ apiURL, consistency, edgeURL, fetch: fetch2, region, siteID, token, uncachedEdgeURL }) {
    this.apiURL = apiURL;
    this.consistency = consistency ?? "eventual";
    this.edgeURL = edgeURL;
    this.fetch = fetch2 ?? globalThis.fetch;
    this.region = region;
    this.siteID = siteID;
    this.token = token;
    this.uncachedEdgeURL = uncachedEdgeURL;
    if (!this.fetch) {
      throw new Error(
        "Netlify Blobs could not find a `fetch` client in the global scope. You can either update your runtime to a version that includes `fetch` (like Node.js 18.0.0 or above), or you can supply your own implementation using the `fetch` property."
      );
    }
  }
  async getFinalRequest({
    consistency: opConsistency,
    key,
    metadata,
    method,
    parameters = {},
    storeName
  }) {
    const encodedMetadata = encodeMetadata(metadata);
    const consistency = opConsistency ?? this.consistency;
    let urlPath = `/${this.siteID}`;
    if (storeName) {
      urlPath += `/${storeName}`;
    }
    if (key) {
      urlPath += `/${key}`;
    }
    if (this.edgeURL) {
      if (consistency === "strong" && !this.uncachedEdgeURL) {
        throw new BlobsConsistencyError();
      }
      const headers = {
        authorization: `Bearer ${this.token}`
      };
      if (encodedMetadata) {
        headers[METADATA_HEADER_INTERNAL] = encodedMetadata;
      }
      if (this.region) {
        urlPath = `/region:${this.region}${urlPath}`;
      }
      const url2 = new URL(urlPath, consistency === "strong" ? this.uncachedEdgeURL : this.edgeURL);
      for (const key2 in parameters) {
        url2.searchParams.set(key2, parameters[key2]);
      }
      return {
        headers,
        url: url2.toString()
      };
    }
    const apiHeaders = { authorization: `Bearer ${this.token}` };
    const url = new URL(`/api/v1/blobs${urlPath}`, this.apiURL ?? "https://api.netlify.com");
    for (const key2 in parameters) {
      url.searchParams.set(key2, parameters[key2]);
    }
    if (this.region) {
      url.searchParams.set("region", this.region);
    }
    if (storeName === void 0 || key === void 0) {
      return {
        headers: apiHeaders,
        url: url.toString()
      };
    }
    if (encodedMetadata) {
      apiHeaders[METADATA_HEADER_EXTERNAL] = encodedMetadata;
    }
    if (method === "head" || method === "delete") {
      return {
        headers: apiHeaders,
        url: url.toString()
      };
    }
    const res = await this.fetch(url.toString(), {
      headers: { ...apiHeaders, accept: SIGNED_URL_ACCEPT_HEADER },
      method
    });
    if (res.status !== 200) {
      throw await createBlobsInternalError(res, { edgeAccess: this.edgeAccess, method, storeName });
    }
    const { url: signedURL } = await res.json();
    const userHeaders = encodedMetadata ? { [METADATA_HEADER_INTERNAL]: encodedMetadata } : void 0;
    return {
      headers: userHeaders,
      url: signedURL
    };
  }
  async makeRequest({
    body,
    conditions = {},
    consistency,
    headers: extraHeaders,
    key,
    metadata,
    method,
    parameters,
    storeName
  }) {
    const { headers: baseHeaders = {}, url } = await this.getFinalRequest({
      consistency,
      key,
      metadata,
      method,
      parameters,
      storeName
    });
    const headers = {
      ...baseHeaders,
      ...extraHeaders
    };
    if (method === "put") {
      headers["cache-control"] = "max-age=0, stale-while-revalidate=60";
    }
    if ("onlyIfMatch" in conditions && conditions.onlyIfMatch) {
      headers["if-match"] = conditions.onlyIfMatch;
    } else if ("onlyIfNew" in conditions && conditions.onlyIfNew) {
      headers["if-none-match"] = "*";
    }
    const options = {
      body,
      headers,
      method
    };
    if (body instanceof ReadableStream) {
      options.duplex = "half";
    }
    const usesSignedUrl = !this.edgeURL && key !== void 0 && storeName !== void 0 && method !== "head" && method !== "delete";
    let getRetryUrl;
    if (usesSignedUrl) {
      getRetryUrl = async () => {
        const finalRequest = await this.getFinalRequest({ consistency, key, metadata, method, parameters, storeName });
        return finalRequest.url;
      };
    }
    return fetchAndRetry(this.fetch, url, options, void 0, getRetryUrl);
  }
};
var getClientOptions = (options, contextOverride) => {
  const context = contextOverride ?? getEnvironmentContext();
  const siteID = context.siteID ?? options.siteID;
  const token = context.token ?? options.token;
  if (!siteID || !token) {
    throw new MissingBlobsEnvironmentError(["siteID", "token"]);
  }
  if (options.region !== void 0 && !isValidRegion(options.region)) {
    throw new InvalidBlobsRegionError(options.region);
  }
  const clientOptions = {
    apiURL: context.apiURL ?? options.apiURL,
    consistency: options.consistency,
    edgeURL: context.edgeURL ?? options.edgeURL,
    fetch: options.fetch,
    region: options.region,
    siteID,
    token,
    uncachedEdgeURL: context.uncachedEdgeURL ?? options.uncachedEdgeURL
  };
  return clientOptions;
};

// node_modules/@netlify/blobs/dist/main.js
var LEGACY_STORE_INTERNAL_PREFIX = "netlify-internal/legacy-namespace/";
var STATUS_OK = 200;
var STATUS_PRE_CONDITION_FAILED = 412;
var Store = class _Store {
  constructor(options) {
    this.client = options.client;
    if ("deployID" in options) {
      _Store.validateDeployID(options.deployID);
      let name = DEPLOY_STORE_PREFIX + options.deployID;
      if (options.name) {
        name += `:${options.name}`;
      }
      this.name = name;
    } else if (options.name.startsWith(LEGACY_STORE_INTERNAL_PREFIX)) {
      const storeName = options.name.slice(LEGACY_STORE_INTERNAL_PREFIX.length);
      _Store.validateStoreName(storeName);
      this.name = storeName;
    } else {
      _Store.validateStoreName(options.name);
      this.name = SITE_STORE_PREFIX + options.name;
    }
  }
  async delete(key) {
    const res = await this.client.makeRequest({ key, method: "delete", storeName: this.name });
    await discardBody(res);
    if (![200, 204, 404].includes(res.status)) {
      throw new BlobsInternalError(res, {
        edgeAccess: this.client.edgeAccess,
        method: "delete",
        storeName: this.name
      });
    }
  }
  async deleteAll() {
    let totalDeletedBlobs = 0;
    let hasMore = true;
    while (hasMore) {
      const res = await this.client.makeRequest({ method: "delete", storeName: this.name });
      if (res.status !== 200) {
        await discardBody(res);
        throw new BlobsInternalError(res, {
          edgeAccess: this.client.edgeAccess,
          method: "delete",
          storeName: this.name
        });
      }
      const data = await res.json();
      if (typeof data.blobs_deleted !== "number") {
        throw new BlobsInternalError(res);
      }
      totalDeletedBlobs += data.blobs_deleted;
      hasMore = typeof data.has_more === "boolean" && data.has_more;
    }
    return {
      deletedBlobs: totalDeletedBlobs
    };
  }
  async get(key, options) {
    return withSpan(options?.span, "blobs.get", async (span) => {
      const { consistency, type } = options ?? {};
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.type": type,
        "blobs.method": "GET",
        "blobs.consistency": consistency
      });
      const res = await this.client.makeRequest({
        consistency,
        key,
        method: "get",
        storeName: this.name
      });
      span?.setAttributes({
        "blobs.response.body.size": res.headers.get("content-length") ?? void 0,
        "blobs.response.status": res.status
      });
      if (res.status === 404) {
        await discardBody(res);
        return null;
      }
      if (res.status !== 200) {
        await discardBody(res);
        throw new BlobsInternalError(res);
      }
      if (type === void 0 || type === "text") {
        return res.text();
      }
      if (type === "arrayBuffer") {
        return res.arrayBuffer();
      }
      if (type === "blob") {
        return res.blob();
      }
      if (type === "json") {
        return res.json();
      }
      if (type === "stream") {
        return res.body;
      }
      await discardBody(res);
      throw new BlobsInternalError(res);
    });
  }
  async getMetadata(key, options = {}) {
    return withSpan(options?.span, "blobs.getMetadata", async (span) => {
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.method": "HEAD",
        "blobs.consistency": options.consistency
      });
      const res = await this.client.makeRequest({
        consistency: options.consistency,
        key,
        method: "head",
        storeName: this.name
      });
      span?.setAttributes({
        "blobs.response.status": res.status
      });
      if (res.status === 404) {
        return null;
      }
      if (res.status !== 200 && res.status !== 304) {
        throw new BlobsInternalError(res);
      }
      const etag = res?.headers.get("etag") ?? void 0;
      const metadata = getMetadataFromResponse(res);
      const result = {
        etag,
        metadata
      };
      return result;
    });
  }
  async getWithMetadata(key, options) {
    return withSpan(options?.span, "blobs.getWithMetadata", async (span) => {
      const { consistency, etag: requestETag, type } = options ?? {};
      const headers = requestETag ? { "if-none-match": requestETag } : void 0;
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.method": "GET",
        "blobs.consistency": options?.consistency,
        "blobs.type": type,
        "blobs.request.etag": requestETag
      });
      const res = await this.client.makeRequest({
        consistency,
        headers,
        key,
        method: "get",
        storeName: this.name
      });
      const responseETag = res?.headers.get("etag") ?? void 0;
      span?.setAttributes({
        "blobs.response.body.size": res.headers.get("content-length") ?? void 0,
        "blobs.response.etag": responseETag,
        "blobs.response.status": res.status
      });
      if (res.status === 404) {
        await discardBody(res);
        return null;
      }
      if (res.status !== 200 && res.status !== 304) {
        await discardBody(res);
        throw new BlobsInternalError(res);
      }
      const metadata = getMetadataFromResponse(res);
      const result = {
        etag: responseETag,
        metadata
      };
      if (res.status === 304 && requestETag) {
        return { data: null, ...result };
      }
      if (type === void 0 || type === "text") {
        return { data: await res.text(), ...result };
      }
      if (type === "arrayBuffer") {
        return { data: await res.arrayBuffer(), ...result };
      }
      if (type === "blob") {
        return { data: await res.blob(), ...result };
      }
      if (type === "json") {
        return { data: await res.json(), ...result };
      }
      if (type === "stream") {
        return { data: res.body, ...result };
      }
      await discardBody(res);
      throw new Error(`Invalid 'type' property: ${type}. Expected: arrayBuffer, blob, json, stream, or text.`);
    });
  }
  list(options = {}) {
    return withSpan(options.span, "blobs.list", (span) => {
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.method": "GET",
        "blobs.list.paginate": options.paginate ?? false
      });
      const iterator = this.getListIterator(options);
      if (options.paginate) {
        return iterator;
      }
      return collectIterator(iterator).then(
        (items) => items.reduce(
          (acc, item) => ({
            blobs: [...acc.blobs, ...item.blobs],
            directories: [...acc.directories, ...item.directories]
          }),
          { blobs: [], directories: [] }
        )
      );
    });
  }
  async set(key, data, options = {}) {
    return withSpan(options.span, "blobs.set", async (span) => {
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.method": "PUT",
        "blobs.data.size": typeof data == "string" ? data.length : data instanceof Blob ? data.size : data.byteLength,
        "blobs.data.type": typeof data == "string" ? "string" : data instanceof Blob ? "blob" : "arrayBuffer",
        "blobs.atomic": Boolean(options.onlyIfMatch ?? options.onlyIfNew)
      });
      _Store.validateKey(key);
      const conditions = _Store.getConditions(options);
      const res = await this.client.makeRequest({
        conditions,
        body: data,
        key,
        metadata: options.metadata,
        method: "put",
        storeName: this.name
      });
      const etag = res.headers.get("etag") ?? "";
      span?.setAttributes({
        "blobs.response.etag": etag,
        "blobs.response.status": res.status
      });
      if (conditions) {
        await discardBody(res);
        return res.status === STATUS_PRE_CONDITION_FAILED ? { modified: false } : { etag, modified: true };
      }
      if (res.status === STATUS_OK) {
        await discardBody(res);
        return {
          etag,
          modified: true
        };
      }
      throw await createBlobsInternalError(res, {
        edgeAccess: this.client.edgeAccess,
        method: "put",
        storeName: this.name
      });
    });
  }
  async setJSON(key, data, options = {}) {
    return withSpan(options.span, "blobs.setJSON", async (span) => {
      span?.setAttributes({
        "blobs.store": this.name,
        "blobs.key": key,
        "blobs.method": "PUT",
        "blobs.data.type": "json",
        "blobs.atomic": Boolean(options.onlyIfMatch ?? options.onlyIfNew)
      });
      _Store.validateKey(key);
      const conditions = _Store.getConditions(options);
      const payload = JSON.stringify(data);
      const headers = {
        "content-type": "application/json"
      };
      const res = await this.client.makeRequest({
        conditions,
        body: payload,
        headers,
        key,
        metadata: options.metadata,
        method: "put",
        storeName: this.name
      });
      await discardBody(res);
      const etag = res.headers.get("etag") ?? "";
      span?.setAttributes({
        "blobs.response.etag": etag,
        "blobs.response.status": res.status
      });
      if (conditions) {
        return res.status === STATUS_PRE_CONDITION_FAILED ? { modified: false } : { etag, modified: true };
      }
      if (res.status === STATUS_OK) {
        return {
          etag,
          modified: true
        };
      }
      throw new BlobsInternalError(res, {
        edgeAccess: this.client.edgeAccess,
        method: "put",
        storeName: this.name
      });
    });
  }
  static formatListResultBlob(result) {
    if (!result.key) {
      return null;
    }
    return {
      etag: result.etag,
      key: result.key
    };
  }
  static getConditions(options) {
    if ("onlyIfMatch" in options && "onlyIfNew" in options) {
      throw new Error(
        `The 'onlyIfMatch' and 'onlyIfNew' options are mutually exclusive. Using 'onlyIfMatch' will make the write succeed only if there is an entry for the key with the given content, while 'onlyIfNew' will make the write succeed only if there is no entry for the key.`
      );
    }
    if ("onlyIfMatch" in options && options.onlyIfMatch) {
      if (typeof options.onlyIfMatch !== "string") {
        throw new Error(`The 'onlyIfMatch' property expects a string representing an ETag.`);
      }
      return {
        onlyIfMatch: options.onlyIfMatch
      };
    }
    if ("onlyIfNew" in options && options.onlyIfNew) {
      if (typeof options.onlyIfNew !== "boolean") {
        throw new Error(
          `The 'onlyIfNew' property expects a boolean indicating whether the write should fail if an entry for the key already exists.`
        );
      }
      return {
        onlyIfNew: true
      };
    }
  }
  static validateKey(key) {
    if (key === "") {
      throw new Error("Blob key must not be empty.");
    }
    if (key.startsWith("/") || key.startsWith("%2F")) {
      throw new Error("Blob key must not start with forward slash (/).");
    }
    if (new TextEncoder().encode(key).length > 600) {
      throw new Error(
        "Blob key must be a sequence of Unicode characters whose UTF-8 encoding is at most 600 bytes long."
      );
    }
  }
  static validateDeployID(deployID) {
    if (!/^\w{1,24}$/.test(deployID)) {
      throw new Error(`'${deployID}' is not a valid Netlify deploy ID.`);
    }
  }
  static validateStoreName(name) {
    if (name.includes("/") || name.includes("%2F")) {
      throw new Error("Store name must not contain forward slashes (/).");
    }
    if (new TextEncoder().encode(name).length > 64) {
      throw new Error(
        "Store name must be a sequence of Unicode characters whose UTF-8 encoding is at most 64 bytes long."
      );
    }
  }
  getListIterator(options) {
    const { client, name: storeName } = this;
    const parameters = {};
    if (options?.prefix) {
      parameters.prefix = options.prefix;
    }
    if (options?.directories) {
      parameters.directories = "true";
    }
    return {
      [Symbol.asyncIterator]() {
        let currentCursor = null;
        let done = false;
        return {
          async next() {
            return withSpan(options?.span, "blobs.list.next", async (span) => {
              span?.setAttributes({
                "blobs.store": storeName,
                "blobs.method": "GET",
                "blobs.list.paginate": options?.paginate ?? false,
                "blobs.list.done": done,
                "blobs.list.cursor": currentCursor ?? void 0
              });
              if (done) {
                return { done: true, value: void 0 };
              }
              const nextParameters = { ...parameters };
              if (currentCursor !== null) {
                nextParameters.cursor = currentCursor;
              }
              const res = await client.makeRequest({
                method: "get",
                parameters: nextParameters,
                storeName
              });
              span?.setAttributes({
                "blobs.response.status": res.status
              });
              let blobs = [];
              let directories = [];
              if (![200, 204, 404].includes(res.status)) {
                await discardBody(res);
                throw new BlobsInternalError(res);
              }
              if (res.status === 404) {
                await discardBody(res);
                done = true;
              } else {
                const page = await res.json();
                if (page.next_cursor) {
                  currentCursor = page.next_cursor;
                } else {
                  done = true;
                }
                blobs = (page.blobs ?? []).map(_Store.formatListResultBlob).filter(Boolean);
                directories = page.directories ?? [];
              }
              return {
                done: false,
                value: {
                  blobs,
                  directories
                }
              };
            });
          }
        };
      }
    };
  }
};
var getDeployStoreRegion = (clientOptions, context) => {
  if (clientOptions.region) {
    return clientOptions.region;
  }
  if (clientOptions.edgeURL || clientOptions.uncachedEdgeURL) {
    if (!context.primaryRegion) {
      throw new Error(
        "When accessing a deploy store, the Netlify Blobs client needs to be configured with a region, and one was not found in the environment. To manually set the region, set the `region` property in the store options. If you are using the Netlify CLI, you may have an outdated version; run `npm install -g netlify-cli@latest` to update and try again."
      );
    }
    return context.primaryRegion;
  }
  return REGION_AUTO;
};
var getStore = (input, options) => {
  if (typeof input === "string") {
    const contextOverride = options?.siteID && options?.token ? { siteID: options?.siteID, token: options?.token } : void 0;
    const clientOptions = getClientOptions(options ?? {}, contextOverride);
    const client = new Client(clientOptions);
    return new Store({ client, name: input });
  }
  if (typeof input?.name === "string") {
    const { name } = input;
    const contextOverride = input?.siteID && input?.token ? { siteID: input?.siteID, token: input?.token } : void 0;
    const clientOptions = getClientOptions(input, contextOverride);
    if (!name) {
      throw new MissingBlobsEnvironmentError(["name"]);
    }
    const client = new Client(clientOptions);
    return new Store({ client, name });
  }
  if (typeof input?.deployID === "string") {
    const context = getEnvironmentContext();
    const clientOptions = getClientOptions(input, context);
    const { deployID } = input;
    if (!deployID) {
      throw new MissingBlobsEnvironmentError(["deployID"]);
    }
    clientOptions.region = getDeployStoreRegion(clientOptions, context);
    const client = new Client(clientOptions);
    return new Store({ client, deployID });
  }
  throw new Error(
    "The `getStore` method requires the name of the store as a string or as the `name` property of an options object"
  );
};

// functions/lib/jobs.mjs
var STORE = "jobs";
var jobs = () => getStore({ name: STORE, consistency: "strong" });
async function getJob(id) {
  if (!id) return null;
  return await jobs().get(id, { type: "json" }) || null;
}
async function saveJob(id, fields, note) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const old = await getJob(id) || { id, createdAt: now, history: [] };
  const job = { ...old, ...fields, id, updatedAt: now };
  for (const key of ["customer", "stripe"]) if (old[key] || fields[key]) job[key] = { ...old[key] || {}, ...fields[key] || {} };
  if (fields.status && fields.status !== old.status) job.history = [...old.history || [], { at: now, status: fields.status, note: note || "" }];
  else if (note) job.history = [...old.history || [], { at: now, note }];
  await jobs().setJSON(id, job);
  return job;
}
var pounds = (p) => `\xA3${(Number(p || 0) / 100).toLocaleString("en-GB", { minimumFractionDigits: p % 100 ? 2 : 0 })}`;

// pricing.json
var pricing_default = {
  heading: "Simple prices, 24-hour delivery",
  includes: "Each film is one boat, property or room: 15 to 20 seconds from 4 to 6 of your photos, with your photographer credited.",
  includesList: [
    "A 15 to 20 second film from 4 to 6 photos",
    "Landscape (16:9) for your website, listings and ads",
    "Your photographer credited",
    "Back within 24 hours of your order and photos, Monday to Friday"
  ],
  groups: [
    {
      name: "Packs",
      note: "",
      plans: [
        {
          name: "Single film",
          price: "\xA3175",
          unit: "",
          per: "\xA3175 a film",
          for: "One hero boat, villa or room",
          payUrl: "https://buy.stripe.com/bJe00kbSJ2SM6EMba11VK02",
          films: 1,
          stripeProduct: "prod_Vb0JSH30FPgyOW",
          gets: [
            "1 \xD7 16:9 film",
            "Back within 24 hours"
          ],
          add: "Add 4:5 Social for \xA325"
        },
        {
          name: "3 films",
          price: "\xA3450",
          unit: "",
          per: "\xA3150 a film",
          for: "A hotel's best rooms, or a small fleet",
          payUrl: "https://buy.stripe.com/eVq3cw2i9dxq5AI5PH1VK03",
          films: 3,
          stripeProduct: "prod_Vb0L0R8RAXFETJ",
          was: "\xA3525",
          gets: [
            "3 \xD7 16:9 films",
            "3 \xD7 4:5 Social",
            "All back within 24 hours"
          ],
          total: "6 videos in all"
        },
        {
          name: "5 films",
          price: "\xA3650",
          unit: "",
          per: "\xA3130 a film",
          for: "Boat fleets and holiday-let portfolios",
          payUrl: "https://buy.stripe.com/5kQ3cwg8Z2SMd3ace51VK04",
          films: 5,
          stripeProduct: "prod_Vb0M217JfWYeEg",
          was: "\xA3875",
          gets: [
            "5 \xD7 16:9 films",
            "5 \xD7 4:5 Social",
            "All back within 24 hours"
          ],
          total: "10 videos in all"
        },
        {
          name: "10 films",
          price: "\xA31,100",
          unit: "",
          per: "\xA3110 a film",
          for: "Bigger fleets and agencies",
          payUrl: "https://buy.stripe.com/4gM9AU6ypbpi2owdi91VK05",
          films: 10,
          stripeProduct: "prod_Vb0NsrnyT3wKtN",
          was: "\xA31,750",
          gets: [
            "10 \xD7 16:9 films",
            "10 \xD7 4:5 Social",
            "The first 5 within 24 hours, then 5 a day"
          ],
          total: "20 videos in all"
        }
      ]
    },
    {
      name: "Monthly",
      note: "For charter fleets and hotel groups with new boats, rooms or offers every month. Unused films carry over to the next month, and the minimum term is three months.",
      plans: [
        {
          name: "4 films a month",
          price: "\xA3395",
          unit: "a month",
          per: "About \xA399 a film",
          for: "Charter brokers with new boats each month",
          payUrl: "https://buy.stripe.com/dRm8wQ1e53WQ9QY7XP1VK06",
          films: 4,
          stripeProduct: "prod_Vb0OvcbGOGSX4S",
          gets: [
            "4 \xD7 16:9 films a month",
            "4 \xD7 4:5 Social",
            "Unused films carry over"
          ],
          total: "8 videos a month"
        },
        {
          name: "10 films a month",
          price: "\xA3850",
          unit: "a month",
          per: "\xA385 a film",
          for: "Hotel groups and larger charter fleets",
          payUrl: "https://buy.stripe.com/14AeVe3md8d65AI1zr1VK07",
          films: 10,
          stripeProduct: "prod_Vb0P1TR5Flm0k8",
          gets: [
            "10 \xD7 16:9 films a month",
            "10 \xD7 4:5 Social",
            "Unused films carry over"
          ],
          total: "20 videos a month"
        }
      ]
    }
  ],
  addons: [
    "Premium (music, a line on each scene, your logo): +\xA320",
    "Voice-over: +\xA335",
    "A round of tweaks: +\xA335",
    "30-second cut from 6 to 8 photos: +\xA360",
    "4:5 Social for a single film: +\xA325"
  ],
  terms: "The 24 hours start once we have your order and photos we can use. Order on a Friday afternoon or at the weekend and we start Monday at 9am, UK time. If a photo won't work, say someone's in shot or it's too dark, we'll tell you within a few hours and start again when the new one arrives. Packs come in daily batches: the first 5 films within 24 hours, then 5 a day. If anything will take longer, we'll tell you straight away.",
  packNote: "Packs of 3 or more also include a 4:5 Social cut of every film.",
  addonItems: [
    {
      id: "premium",
      name: "Premium: music, a line on each scene and your logo",
      price: 20,
      note: "Background music, a line of text on each scene and your logo on the end frame. Voice-over is separate."
    },
    {
      id: "voice",
      name: "Voice-over",
      price: 35,
      note: "A voice reading a short line over each scene."
    },
    {
      id: "tweaks",
      name: "A round of tweaks",
      price: 35,
      note: "One round of changes once you've seen it."
    },
    {
      id: "long",
      name: "30-second cut from 6 to 8 photos",
      price: 60,
      note: "A longer film, for a walk-through."
    },
    {
      id: "social",
      name: "4:5 Social",
      price: 25,
      singleOnly: true,
      note: "A 4:5 version for the feed. Included with packs of 3 or more."
    }
  ],
  editOffers: {
    "hospitality-signature": {
      name: "Premium film",
      plan: "Single film",
      addons: [
        "premium"
      ],
      price: 95,
      was: 195,
      about: "The film we made, with a line on each scene and background music",
      includes: [
        "The film we made, with a line on each scene in subtitles",
        "Background music, added when you order",
        "Your logo on the end frame",
        "Full-quality file for your website, booking pages and ads",
        "Your photographer credited",
        "Delivered within 24 hours of your order, Monday to Friday"
      ],
      ends: "2026-12-07"
    },
    "hospitality-story": {
      name: "Full film",
      plan: "Single film",
      addons: [],
      price: 65,
      about: "The film we made, without subtitles, ending on your name",
      includes: [
        "The film we made, ending on your name and web address",
        "Full-quality file for your website, booking pages and ads",
        "Your photographer credited",
        "Delivered within 24 hours of your order, Monday to Friday"
      ],
      was: 175,
      ends: "2026-12-07"
    },
    "film-now": {
      name: "Your own film",
      plan: "Single film",
      addons: [],
      price: 140,
      was: 175,
      until: "2026-12-07",
      about: "One film from your own photos, back within 24 hours of your order and photos",
      includes: [
        "One 15 to 20 second film from 4 to 6 of your photos",
        "Landscape (16:9) for websites and ads",
        "Your photographer credited",
        "Back within 24 hours"
      ]
    },
    "marine-signature": {
      name: "Premium film",
      plan: "Single film",
      addons: [
        "premium"
      ],
      price: 95,
      was: 195,
      about: "The film we made, with a line on each scene and background music",
      includes: [
        "The film we made, with a line on each scene in subtitles",
        "Background music, added when you order",
        "Your logo on the end frame",
        "Full-quality file for your website, charter listings and ads",
        "Your photographer credited",
        "Delivered within 24 hours of your order, Monday to Friday"
      ],
      ends: "2026-12-07"
    },
    "marine-story": {
      name: "Full film",
      plan: "Single film",
      addons: [],
      price: 65,
      was: 175,
      about: "The film we made, without subtitles, ending on your name",
      includes: [
        "The film we made, ending on your name and web address",
        "Full-quality file for your website, charter listings and ads",
        "Your photographer credited",
        "Delivered within 24 hours of your order, Monday to Friday"
      ],
      ends: "2026-12-07"
    },
    "property-signature": {
      name: "Premium film",
      plan: "Single film",
      addons: [
        "premium"
      ],
      price: 95,
      was: 195,
      about: "The film we made, with a line on each scene and background music",
      includes: [
        "The film we made, with a line on each scene in subtitles",
        "Background music, added when you order",
        "Your logo on the end frame",
        "Full-quality file for your website, portal listings and ads",
        "Your photographer credited",
        "Delivered within 24 hours of your order, Monday to Friday"
      ],
      ends: "2026-12-07"
    },
    "property-story": {
      name: "Full film",
      plan: "Single film",
      addons: [],
      price: 65,
      was: 175,
      about: "The film we made, without subtitles, ending on your name",
      includes: [
        "The film we made, ending on your name and web address",
        "Full-quality file for your website, portal listings and ads",
        "Your photographer credited",
        "Delivered within 24 hours of your order, Monday to Friday"
      ],
      ends: "2026-12-07"
    },
    "social-4x5": {
      name: "4:5 social film",
      plan: "Single film",
      addons: [],
      price: 65,
      was: 175,
      about: "The 4:5 film we made for social",
      includes: [
        "The 4:5 film we made, about 17 seconds",
        "Full-quality 1080 x 1350 file for Instagram, Facebook and LinkedIn",
        "Your photographer credited",
        "Delivered within 24 hours of your order, Monday to Friday"
      ],
      ends: "2026-12-07",
      _note: "User, 12 Nov 2026: 'add download video now, with payment process' on the 4:5 phone section. Priced as the ready-made Full film offer (\xA365, usually \xA3175) until the user sets a price."
    },
    "kitchens-signature": {
      name: "Premium film",
      plan: "Single film",
      addons: [
        "premium"
      ],
      price: 95,
      was: 195,
      about: "The film we made, with a line on each scene and background music",
      includes: [
        "The film we made, with a line on each scene in subtitles",
        "Background music, added when you order",
        "Your logo on the end frame",
        "Full-quality file for your website, social and ads",
        "Your photographer credited",
        "Delivered within 24 hours of your order, Monday to Friday"
      ],
      ends: "2026-12-07",
      _note: "12 Nov 2026, 'all sectors': the ready-made offer for kitchen pages too, as property's."
    },
    "kitchens-story": {
      name: "Full film",
      plan: "Single film",
      addons: [],
      price: 65,
      was: 175,
      about: "The film we made, without subtitles, ending on your name",
      includes: [
        "The film we made, ending on your name and web address",
        "Full-quality file for your website, social and ads",
        "Your photographer credited",
        "Delivered within 24 hours of your order, Monday to Friday"
      ],
      ends: "2026-12-07",
      _note: "12 Nov 2026, 'all sectors': the ready-made offer for kitchen pages too, as property's."
    }
  },
  editOffersNote: 'User, 11 Nov 2026 ("the pre built film price seems expensive for an offer ... premium should have background music but not vo", then "Yes, apply it"): a film we have already made sells at a deep cut, below a new film. Premium = subtitles + background music + logo (voice-over stays an add-on), usually \xA3195 (user, 11 Nov 2026: "maybe 199", then "or 195": single \xA3175 + the Premium add-on at \xA320, which replaced the separate music, captions and logo add-ons at \xA325 each). "ends" is shown on the page only; the checkout keeps honouring the price after it.',
  freeClip: {
    name: "Free clip",
    photos: 3,
    seconds: 10,
    about: "3 photos in, a 10-second film back within 24 hours, Monday to Friday, with our end card. One per business."
  },
  deliveryNote: 'User, 11 Nov 2026 ("should there be a caveate around 24 hr delivery", then "ok to delivery caveat"): the clock starts once we have the order and photos we can use; ready-made films count from the order. The full wording is the terms line and the shared FAQ "When will it arrive?" (faq.json).',
  _wasNote: "User, 11 Nov 2026: 'on pricing show the price of 1x film x3, x5 slashed vs the package deal price', then 'the price update should be for the 10 films too'. 'was' is the Single film price times the pack size, shown struck before the pack price (custom pages and the home page). Change the Single film price and re-run this sum.",
  _getsNote: "User, 12 Nov 2026: 'in the pricing cards list what you get with ticks. so 1x 16.9 (and res?) then 3x 16.9, 3x4.5 social etc. so it shows they get alot', then 'drop the res, remove 9.16, just have Social after 4.5'. Packs come with a 4:5 Social cut of every film (9:16 and 1:1 are no longer offered). 'gets' is each card's ticked list, 'total' its count of videos, 'add' the single film's social add-on line."
};

// functions/lib/order-email.mjs
var FROM = "Photo2Motion <team@photo2motion.studio>";
var REPLY_TO = "team@photo2motion.studio";
var TIMEOUT_MS = 1e4;
function firstName(name) {
  const first = String(name || "").trim().split(/\s+/)[0] || "";
  return first.length > 0 && first.length <= 30 ? first[0].toUpperCase() + first.slice(1) : "";
}
function orderEmail(job) {
  const to = job && job.customer && job.customer.email || "";
  if (!job || job.kind !== "order" || job.source === "stripe-payment-link" || !to.includes("@")) return null;
  const offer = job.offer && pricing_default.editOffers[job.offer] || null;
  const ready = Boolean(offer) && /\bwe made\b/i.test(offer.about || "");
  const what = offer ? offer.name : String(job.plan || "Your films");
  const films = Number(job.films) || 1;
  const addonNames = (job.addons || []).map((id) => (pricing_default.addonItems.find((a) => a.id === id) || {}).name).filter(Boolean);
  const business = job.customer && job.customer.business || "";
  const amount = job.stripe && job.stripe.amount != null ? pounds(job.stripe.amount) : "";
  const ref = String(job.id).slice(0, 8);
  const photos = (job.photos || []).length;
  const order = [
    `${what}${business ? ` for ${business}` : ""}`,
    ...addonNames.map((name2) => `+ ${name2}`),
    [amount && `${amount} paid${job.monthly ? " for your first month" : ""}`, `Order ${ref}`].filter(Boolean).join(" \xB7 ")
  ];
  const them = films === 1 ? "Your film arrives" : job.monthly ? "This month's films arrive" : films > 5 ? "Your first 5 films arrive" : "Your films arrive";
  const pace = films > 5 && !job.monthly ? ", then 5 a day" : "";
  const next = ready ? "Your film is already made, so there's nothing to send. It arrives within 24 hours, Monday to Friday." : photos >= films * 4 ? `We've got your ${photos} photos. ${them} within 24 hours, Monday to Friday${pace}.` : photos ? `We've got your ${photos === 1 ? "photo" : `${photos} photos`}. Send the rest by replying to this email. ${them} within 24 hours of your photos, Monday to Friday${pace}.` : `Next, send us your photos: reply to this email with them, or a link. ${them} within 24 hours of your photos, Monday to Friday${pace}.`;
  const name = firstName(job.customer && job.customer.name);
  const text = [
    `Hi${name ? ` ${name}` : ""},`,
    "",
    `Thanks for your order. ${ready || films === 1 ? "Your film is" : "Your films are"} booked in.`,
    "",
    ...order,
    "",
    next,
    "",
    "Your receipt comes separately from Stripe.",
    "",
    "Chris",
    "Photo2Motion",
    "photo2motion.studio"
  ].join("\n");
  return { to, subject: `Got your order: ${what}`, text };
}
function postToResend(key, idempotencyKey, message) {
  const base = process.env.RESEND_API_BASE || "https://api.resend.com";
  return fetch(`${base}/emails`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ from: FROM, to: [message.to], reply_to: REPLY_TO, subject: message.subject, text: message.text }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
}
async function sendOrderEmail(job) {
  const message = orderEmail(job);
  if (!message) return { sent: false, reason: "not-for-this-job" };
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, to: message.to, reason: "not-configured" };
  let reason = "";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const res = await postToResend(key, `order-email-${job.id}`, message);
      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        return { sent: true, to: message.to, id: body.id || "" };
      }
      reason = `Resend answered ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`;
      if (res.status !== 429 && res.status < 500) break;
    } catch (err) {
      reason = `Resend unreachable: ${err && err.message}`;
    }
    console.error("order-email: attempt %s for job %s failed: %s", attempt, job.id, reason);
    if (attempt === 1) await new Promise((r) => setTimeout(r, 1e3));
  }
  return { sent: false, to: message.to, reason };
}

// functions/stripe-webhook.src.mjs
var TOLERANCE_SECONDS = 300;
var FIELDS = ["order", "kind", "plan", "addons", "total", "customer", "email", "business", "website", "notes", "photos", "source", "stripe"];
var reply = (status, text) => new Response(text, { status, headers: { "Content-Type": "text/plain" } });
function signedByStripe(payload, header, secret) {
  if (!secret || !header) return false;
  const parts = header.split(",").map((p) => p.split("="));
  const t = Number((parts.find(([k]) => k === "t") || [])[1]);
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v || "");
  if (!t || !sigs.length || Math.abs(Date.now() / 1e3 - t) > TOLERANCE_SECONDS) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex"));
  return sigs.some((sig) => sig.length === expected.length && timingSafeEqual(Buffer.from(sig), expected));
}
async function emailPaid(job, stripeNote) {
  if (process.env.CONTEXT === "dev") return;
  const c = job.customer || {};
  const fields = {
    order: job.id,
    kind: job.kind,
    plan: `${job.plan || "See Stripe"}${job.monthly ? " (monthly)" : ""}`,
    addons: (job.addons || []).join(", ") || "None",
    total: job.stripe && job.stripe.amount != null ? `${pounds(job.stripe.amount)} paid` : "",
    customer: c.name || "",
    email: c.email || "",
    business: c.business || "",
    website: c.website || "",
    notes: job.notes || "",
    photos: (job.photos || []).join("\n") || "None yet. They'll send them after paying.",
    source: job.source || "",
    stripe: stripeNote
  };
  const out = new URLSearchParams({ "form-name": "p2m-paid" });
  for (const name of FIELDS) out.set(name, String(fields[name] ?? ""));
  const home = process.env.URL || "https://www.notbadstudio.com";
  const res = await fetch(new URL("/", home), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: out.toString(),
    signal: AbortSignal.timeout(1e4)
  }).catch((err) => {
    console.error("stripe-webhook: paid email failed: %s", err && err.message);
    return null;
  });
  if (res && !res.ok) console.error("stripe-webhook: paid email answered %s", res.status);
}
async function customerEmail(job) {
  if (job.orderEmail && job.orderEmail.sentAt) return ` Order email already sent to ${job.orderEmail.to}.`;
  const result = await sendOrderEmail(job);
  if (result.reason === "not-for-this-job") return "";
  const why = result.reason === "not-configured" ? "RESEND_API_KEY isn't set in Netlify" : result.reason;
  const note = result.sent ? `Order email sent to ${result.to}` : `Order email not sent: ${why}`;
  const fields = result.sent ? { orderEmail: { to: result.to, sentAt: (/* @__PURE__ */ new Date()).toISOString(), id: result.id } } : {};
  await saveJob(job.id, fields, note).catch((err) => console.error("stripe-webhook: noting the order email failed: %s", err && err.message));
  return result.sent ? ` Order email sent to ${result.to}.` : ` Order email NOT sent to ${result.to} (${why}): email them yourself.`;
}
function businessField(session) {
  const field = (session.custom_fields || []).find((f) => /business|company/i.test(`${f.key} ${f.label && f.label.custom}`));
  return field && field.text && field.text.value || "";
}
async function sessionPaid(session) {
  const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  const id = session.client_reference_id || session.metadata && session.metadata.order || `stripe-${session.id}`;
  const existing = await getJob(id);
  const details = session.customer_details || {};
  const stripe = {
    session: session.id,
    subscription: session.subscription || "",
    amount: session.amount_total,
    currency: session.currency,
    paymentStatus: session.payment_status,
    paidAt: paid ? (/* @__PURE__ */ new Date()).toISOString() : ""
  };
  if (!paid) {
    await saveJob(
      id,
      { stripe, status: existing ? existing.status : "awaiting-payment", kind: existing ? existing.kind : "order" },
      "Checkout finished; payment still processing"
    );
    return;
  }
  const job = await saveJob(id, {
    kind: existing ? existing.kind : "order",
    status: "paid",
    stripe,
    ...existing ? {} : {
      plan: "Bought through a Stripe payment link",
      source: "stripe-payment-link",
      customer: { name: details.name || "", email: details.email || "", business: businessField(session) }
    },
    ...existing && !existing.customer?.email && details.email ? { customer: { email: details.email } } : {}
  }, "Paid through Stripe");
  const emailed = await customerEmail(job);
  await emailPaid(job, `Checkout ${session.id}, ${pounds(session.amount_total)} ${session.payment_status}${session.subscription ? `, subscription ${session.subscription}` : ""}.${emailed}`);
}
async function renewalPaid(invoice) {
  const meta = invoice.subscription_details && invoice.subscription_details.metadata || invoice.parent && invoice.parent.subscription_details && invoice.parent.subscription_details.metadata || {};
  const first = meta.order ? await getJob(meta.order) : null;
  const job = await saveJob(`renewal-${invoice.id}`, {
    kind: "renewal",
    status: "paid",
    plan: meta.plan || first && first.plan || "Monthly plan",
    monthly: true,
    films: first ? first.films : void 0,
    addons: meta.addons && meta.addons !== "none" ? meta.addons.split(",") : first ? first.addons : [],
    customer: first ? first.customer : { email: invoice.customer_email || "", name: invoice.customer_name || "" },
    source: `Monthly renewal of order ${meta.order || "(unknown)"}`,
    stripe: { invoice: invoice.id, amount: invoice.amount_paid, currency: invoice.currency, paidAt: (/* @__PURE__ */ new Date()).toISOString() }
  }, "Next month paid");
  await emailPaid(job, `Invoice ${invoice.id}, ${pounds(invoice.amount_paid)} paid (monthly renewal)`);
}
var stripe_webhook_src_default = async (req) => {
  if (req.method !== "POST") return reply(405, "method");
  const payload = await req.text();
  if (!signedByStripe(payload, req.headers.get("stripe-signature") || "", process.env.STRIPE_WEBHOOK_SECRET)) {
    console.error("stripe-webhook: refused a request without a valid Stripe signature");
    return reply(400, "bad signature");
  }
  let event;
  try {
    event = JSON.parse(payload);
  } catch {
    return reply(400, "bad payload");
  }
  const seen = getStore({ name: "stripe-events", consistency: "strong" });
  if (await seen.get(event.id)) return reply(200, "already handled");
  try {
    const object = event.data && event.data.object;
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") await sessionPaid(object);
    else if (event.type === "invoice.paid" && object && object.billing_reason === "subscription_cycle") await renewalPaid(object);
  } catch (err) {
    console.error("stripe-webhook: handling %s failed: %s", event.type, err && err.message);
    return reply(500, "failed");
  }
  await seen.set(event.id, (/* @__PURE__ */ new Date()).toISOString());
  return reply(200, "ok");
};
var config = { path: "/api/stripe-webhook" };
export {
  config,
  stripe_webhook_src_default as default,
  signedByStripe
};
