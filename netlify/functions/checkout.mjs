// Bundled from ~/Sites/motion-demos/functions/checkout.src.mjs by tools/bundle_function.sh. Edit the source, not this file.

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

// pricing.json
var pricing_default = {
  heading: "Simple prices, 24-hour delivery",
  includes: "Every film covers one boat, property or room: 15 to 20 seconds from 4 to 6 photos, in landscape (16:9) for your website, listings and ads. Packs of 3 or more also include vertical (9:16) and square (1:1) cuts for social. Your photographer is credited, and films arrive within 24 hours of your photos, Monday to Friday. Music, your logo and a round of tweaks are add-ons.",
  includesList: [
    "A 15 to 20 second film from 4 to 6 photos",
    "Landscape (16:9) for your website, listings and ads",
    "Your photographer credited",
    "Back within 24 hours, Monday to Friday"
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
          extra: "",
          films: 1,
          stripeProduct: "prod_Vb0JSH30FPgyOW"
        },
        {
          name: "3 films",
          price: "\xA3450",
          unit: "",
          per: "\xA3150 a film",
          for: "A hotel's best rooms, or a small fleet",
          payUrl: "https://buy.stripe.com/eVq3cw2i9dxq5AI5PH1VK03",
          extra: "Includes vertical and square social cuts",
          films: 3,
          stripeProduct: "prod_Vb0L0R8RAXFETJ"
        },
        {
          name: "5 films",
          price: "\xA3650",
          unit: "",
          per: "\xA3130 a film",
          for: "Boat fleets and holiday-let portfolios",
          payUrl: "https://buy.stripe.com/5kQ3cwg8Z2SMd3ace51VK04",
          extra: "Includes vertical and square social cuts",
          films: 5,
          stripeProduct: "prod_Vb0M217JfWYeEg"
        },
        {
          name: "10 films",
          price: "\xA31,100",
          unit: "",
          per: "\xA3110 a film",
          for: "Bigger fleets and agencies",
          payUrl: "https://buy.stripe.com/4gM9AU6ypbpi2owdi91VK05",
          extra: "Includes vertical and square social cuts",
          films: 10,
          stripeProduct: "prod_Vb0NsrnyT3wKtN"
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
          extra: "Includes vertical and square social cuts",
          films: 4,
          stripeProduct: "prod_Vb0OvcbGOGSX4S"
        },
        {
          name: "10 films a month",
          price: "\xA3850",
          unit: "a month",
          per: "\xA385 a film",
          for: "Hotel groups and larger charter fleets",
          payUrl: "https://buy.stripe.com/14AeVe3md8d65AI1zr1VK07",
          extra: "Includes vertical and square social cuts",
          films: 10,
          stripeProduct: "prod_Vb0P1TR5Flm0k8"
        }
      ]
    }
  ],
  addons: [
    "Licensed music: +\xA325",
    "Voice-over: +\xA335",
    "Your logo: +\xA325",
    "A round of tweaks: +\xA335",
    "On-screen text or captions: +\xA325",
    "30-second cut from 6 to 8 photos: +\xA360",
    "Social cuts (9:16 and 1:1) for a single film: +\xA325"
  ],
  terms: "Prices exclude VAT where it applies. Packs arrive in daily batches: the first 5 films within 24 hours, then 5 a day.",
  packNote: "Packs of 3 or more also include vertical and square cuts for social.",
  addonItems: [
    {
      id: "music",
      name: "Licensed music",
      price: 25,
      note: "A licensed track under the film."
    },
    {
      id: "voice",
      name: "Voice-over",
      price: 35,
      note: "A voice reading a short line over each scene."
    },
    {
      id: "logo",
      name: "Your logo",
      price: 25,
      note: "Your logo on the closing frame."
    },
    {
      id: "tweaks",
      name: "A round of tweaks",
      price: 35,
      note: "One round of changes once you've seen it."
    },
    {
      id: "captions",
      name: "On-screen text or captions",
      price: 25,
      note: "A line of text, a name or a price on screen."
    },
    {
      id: "long",
      name: "30-second cut from 6 to 8 photos",
      price: 60,
      note: "A longer film, for a walk-through."
    },
    {
      id: "social",
      name: "Social cuts (9:16 and 1:1)",
      price: 25,
      singleOnly: true,
      note: "Vertical and square versions. Included with packs of 3 or more."
    }
  ],
  editOffers: {
    "hospitality-signature": {
      name: "Subtitled film",
      plan: "Single film",
      addons: [
        "long",
        "captions",
        "logo"
      ],
      price: 190,
      was: 250,
      about: "A film with a line on each scene",
      includes: [
        "One film with a line on each scene in subtitles",
        "Your logo, colours and tagline on the end frame",
        "Full-quality file for your website, booking pages and ads",
        "Your photographer credited",
        "Back within 24 hours of your photos, Monday to Friday"
      ]
    },
    "hospitality-story": {
      name: "Full film",
      plan: "Single film",
      addons: [
        "long"
      ],
      price: 149,
      about: "A longer film, ending on your name",
      includes: [
        "One longer film of your place",
        "Ends on your name and web address",
        "Your photographer credited",
        "Back within 24 hours of your photos, Monday to Friday"
      ]
    },
    "film-now": {
      name: "Your own film",
      plan: "Single film",
      addons: [],
      price: 140,
      was: 175,
      until: "2026-11-24",
      about: "One film from your own photos, back within 24 hours",
      includes: [
        "One 15 to 20 second film from 4 to 6 of your photos",
        "Landscape (16:9) for your website and ads",
        "Your photographer credited",
        "Back within 24 hours of your photos, Monday to Friday"
      ]
    }
  }
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

// functions/checkout.src.mjs
var MAX_PHOTOS = 12;
var MAX_PHOTO_BYTES = 5.5 * 1024 * 1024;
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
var P2M = "https://photo2motion.studio";
var ORIGINS = [
  /^https:\/\/photo2motion\.studio$/,
  /^https:\/\/(www\.)?notbadstudio\.com$/,
  /^https:\/\/demos\.notbadstudio\.com$/,
  /^https:\/\/[a-z0-9-]+--nbs-motion-demos\.netlify\.app$/,
  /^https:\/\/[a-z0-9-]+--notbadstudio\.netlify\.app$/
];
var STRIPE_VERSION = "2023-08-16";
var FIELDS = ["order", "status", "plan", "addons", "total", "name", "email", "business", "website", "notes", "photos", "source"];
function cors(req) {
  const origin = req.headers.get("origin") || "";
  const local = process.env.CONTEXT === "dev" && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (!local && !ORIGINS.some((re) => re.test(origin))) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin"
  };
}
var json = (req, body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(req) } });
var pence = (price) => Math.round(Number(String(price).replace(/[£,\s]/g, "")) * 100);
var pounds = (p) => `\xA3${(p / 100).toLocaleString("en-GB", { minimumFractionDigits: p % 100 ? 2 : 0 })}`;
function priced(planName, addonIds, offerId) {
  const plan = pricing_default.groups.flatMap((g) => g.plans).find((p) => p.name === planName);
  if (!plan) return { reason: "unknown-plan" };
  const offer = offerId ? (pricing_default.editOffers || {})[offerId] : null;
  if (offerId && (!offer || offer.plan !== planName)) return { reason: "unknown-offer" };
  if (offer && offer.until && Date.now() > Date.parse(`${offer.until}T23:59:59Z`)) return { reason: "offer-ended" };
  const ids = [...new Set(Array.isArray(addonIds) ? addonIds : [])];
  const addons = [];
  for (const id of ids) {
    const item = pricing_default.addonItems.find((a) => a.id === id);
    if (!item) return { reason: "unknown-addon" };
    if (item.singleOnly && plan.films !== 1) continue;
    addons.push(item);
  }
  if (offer) {
    const extras = addons.filter((a) => !offer.addons.includes(a.id));
    const total2 = offer.price * 100 + extras.reduce((sum, a) => sum + a.price * 100 * plan.films, 0);
    return { plan, monthly: false, addons, extras, offer: { ...offer, id: offerId }, total: total2 };
  }
  const total = pence(plan.price) + addons.reduce((sum, a) => sum + a.price * 100 * plan.films, 0);
  return { plan, monthly: Boolean(plan.unit), addons, total };
}
async function takePhoto(req, order, n) {
  if (!UUID.test(order) || !(Number(n) >= 1 && Number(n) <= MAX_PHOTOS)) return json(req, { ok: false, reason: "bad-photo" }, 400);
  const type = req.headers.get("content-type") || "";
  if (!/^image\//.test(type)) return json(req, { ok: false, reason: "bad-photo" }, 400);
  const body = await req.arrayBuffer();
  if (!body.byteLength || body.byteLength > MAX_PHOTO_BYTES) return json(req, { ok: false, reason: "photo-too-big" }, 400);
  await getStore("order-photos").set(`${order}/${n}`, body, { metadata: { type } });
  return json(req, { ok: true });
}
async function servePhoto(req, order, n) {
  if (!UUID.test(order) || !/^\d{1,2}$/.test(n)) return new Response("Not found", { status: 404 });
  const entry = await getStore("order-photos").getWithMetadata(`${order}/${n}`, { type: "arrayBuffer" });
  if (!entry) return new Response("Not found", { status: 404 });
  return new Response(entry.data, { headers: {
    "Content-Type": entry.metadata?.type || "image/jpeg",
    "Cache-Control": "private, max-age=86400",
    "X-Robots-Tag": "noindex"
  } });
}
async function stripeSession({ order, price, email, business, source, back }) {
  const { plan, monthly, addons } = price;
  const form = new URLSearchParams();
  const item = (i, name, description, amount, quantity, product) => {
    form.set(`line_items[${i}][price_data][currency]`, "gbp");
    form.set(`line_items[${i}][price_data][unit_amount]`, String(amount));
    if (product) {
      form.set(`line_items[${i}][price_data][product]`, product);
    } else {
      form.set(`line_items[${i}][price_data][product_data][name]`, name);
      if (description) form.set(`line_items[${i}][price_data][product_data][description]`, description);
    }
    if (monthly) form.set(`line_items[${i}][price_data][recurring][interval]`, "month");
    form.set(`line_items[${i}][quantity]`, String(quantity));
  };
  const extras = price.offer ? price.extras : addons;
  if (price.offer) item(0, `Photo2Motion \xB7 ${price.offer.name}`, `${(price.offer.includes || [price.offer.about]).join(". ")}.`, price.offer.price * 100, 1);
  else item(0, `Photo2Motion \xB7 ${plan.name}`, `${plan.per}. ${pricing_default.includesList.join(". ")}.`, pence(plan.price), 1, plan.stripeProduct);
  extras.forEach((a, i) => item(i + 1, a.name, `${a.note} \xA3${a.price} a film, for ${plan.films} film${plan.films > 1 ? "s" : ""}${monthly ? " a month" : ""}.`, a.price * 100, plan.films));
  form.set("mode", monthly ? "subscription" : "payment");
  form.set("success_url", `${P2M}/thanks?order=${order}`);
  form.set("cancel_url", back);
  form.set("client_reference_id", order);
  form.set("customer_email", email);
  form.set("allow_promotion_codes", "true");
  const meta = { order, plan: plan.name, offer: price.offer ? price.offer.id : "none", addons: addons.map((a) => a.id).join(",") || "none", business: business.slice(0, 450), source: source.slice(0, 450) };
  for (const [key, value] of Object.entries(meta)) form.set(`metadata[${key}]`, value);
  if (monthly) for (const [key, value] of Object.entries(meta)) form.set(`subscription_data[metadata][${key}]`, value);
  const base = process.env.STRIPE_API_BASE || "https://api.stripe.com";
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    let res;
    try {
      res = await fetch(`${base}/v1/checkout/sessions`, {
        method: "POST",
        signal: AbortSignal.timeout(1e4),
        // Stripe-Version: the account default is 2022-08-01, and Checkout only takes £0 orders (a 100% off code such
        // as NBSTEST100) from 2023-08-16 on; before that Stripe calls the code "invalid".
        headers: {
          Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "Idempotency-Key": `p2m-${order}`,
          "Stripe-Version": STRIPE_VERSION
        },
        body: form.toString()
      });
    } catch (err) {
      console.error("checkout: Stripe request failed (attempt %s): %s", attempt, err && err.message);
      continue;
    }
    if (res.ok) {
      const session = await res.json();
      return { url: session.url };
    }
    const detail = (await res.text()).slice(0, 300);
    console.error("checkout: Stripe answered %s (attempt %s): %s", res.status, attempt, detail);
    if (res.status !== 429 && res.status < 500) return { reason: "stripe-refused" };
  }
  return { reason: "stripe-unavailable" };
}
async function takeOrder(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return json(req, { ok: false, reason: "bad-request" }, 400);
  }
  if (String(body["bot-field"] || "")) return json(req, { ok: false, reason: "bad-request" }, 400);
  const order = String(body.order || "");
  const text = (key, max = 300) => String(body[key] || "").trim().slice(0, max);
  const email = text("email", 200), business = text("business", 200);
  if (!UUID.test(order) || !email.includes("@")) return json(req, { ok: false, reason: "missing" }, 400);
  const price = priced(text("plan"), body.addons, text("offer", 60));
  if (price.reason) return json(req, { ok: false, reason: price.reason }, 400);
  const photos = Math.max(0, Math.min(MAX_PHOTOS, Number(body.photos) || 0));
  let back = `${P2M}/#pricing`;
  try {
    const asked = new URL(text("back", 500));
    if (ORIGINS.some((re) => re.test(asked.origin))) back = asked.href;
  } catch {
  }
  const configured = Boolean(process.env.STRIPE_SECRET_KEY);
  const home = process.env.CONTEXT !== "dev" && process.env.URL || req.url;
  const links = Array.from({ length: photos }, (_, i) => new URL(`/api/checkout/photo/${order}/${i + 1}`, home).href);
  const { plan, monthly, addons, total } = price;
  const fields = {
    order,
    status: configured ? 'Sent to Stripe checkout, not paid yet. A "Paid" email follows when Stripe confirms the payment.' : "Stripe checkout isn't set up yet: offered the plan's payment link, so add-ons need an invoice.",
    plan: price.offer ? `${price.offer.name} offer: ${pounds(price.offer.price * 100)}${price.offer.was ? `, was ${pounds(price.offer.was * 100)}` : ""} (${[plan.name, ...price.offer.addons].join(" + ")})` : `${plan.name} (${plan.price}${monthly ? " a month" : ""})`,
    addons: addons.length ? addons.map((a) => `${a.name} (\xA3${a.price} x ${plan.films})`).join("; ") : "None",
    total: `${pounds(total)}${monthly ? " a month" : ""}, excluding VAT`,
    name: text("name", 200),
    email,
    business,
    website: text("website"),
    notes: text("notes", 2e3),
    photos: links.length ? links.join("\n") : "None yet. They'll send them after paying.",
    source: text("source")
  };
  if (process.env.CONTEXT !== "dev") {
    const out = new URLSearchParams({ "form-name": "p2m-order" });
    for (const name of FIELDS) out.set(name, fields[name]);
    const res = await fetch(new URL("/", home), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: out.toString(),
      signal: AbortSignal.timeout(1e4)
    }).catch((err) => {
      console.error("checkout: order email failed: %s", err && err.message);
      return null;
    });
    if (res && !res.ok) console.error("checkout: order email answered %s", res.status);
  }
  await saveJob(order, {
    kind: "order",
    status: "awaiting-payment",
    plan: price.offer ? `${plan.name} \xB7 ${price.offer.name}` : plan.name,
    offer: price.offer ? price.offer.id : "",
    films: plan.films,
    monthly,
    addons: addons.map((a) => a.id),
    total,
    customer: { name: fields.name, email, business, website: fields.website },
    notes: fields.notes,
    photos: links,
    source: fields.source
  }, configured ? "Went to Stripe checkout" : "Offered the plan's payment link (online checkout not set up)").catch((err) => {
    console.error("checkout: saving the job failed: %s", err && err.message);
  });
  if (!configured) return json(req, { ok: false, reason: "not-configured", payUrl: plan.payUrl || "" });
  const session = await stripeSession({ order, price, email, business, source: fields.source, back });
  if (session.reason) return json(req, { ok: false, reason: session.reason, payUrl: plan.payUrl || "" }, 502);
  return json(req, { ok: true, url: session.url });
}
var checkout_src_default = async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  const path = new URL(req.url).pathname;
  const photo = path.match(/^\/api\/checkout\/photo\/([^/]+)\/([^/]+)$/);
  if (photo) {
    if (req.method === "POST") return takePhoto(req, photo[1], photo[2]);
    if (req.method === "GET") return servePhoto(req, photo[1], photo[2]);
    return new Response(null, { status: 405 });
  }
  if (req.method !== "POST") return json(req, { ok: false, reason: "method" }, 405);
  return takeOrder(req);
};
var config = { path: ["/api/checkout", "/api/checkout/photo/:order/:n"] };
export {
  config,
  checkout_src_default as default
};
