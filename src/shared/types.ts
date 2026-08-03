export type DictionaryEntry = {
  word: string;
  definition: string;
};

export type SearchRequest = {
  q: string;
  limit?: number;
};

export type SearchResponse = {
  success: boolean;
  data: DictionaryEntry[] | null;
  error: string | null;
};

export type LambdaEvent = {
  queryStringParameters?: {
    q?: string;
    limit?: string;
  };
};

export type LambdaResult = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};
