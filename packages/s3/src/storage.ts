import {
  S3Client,
  PutObjectCommand,
  PutObjectRequest,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import {
  FILES_KEY,
  FieldValue,
  HonoStorage,
  HonoStorageFile,
  MultipleFieldSchema,
  SingleFieldSchema,
} from "@hono-storage/core";

import type { RequestPresigningArguments } from "@smithy/types";
import type { Context, MiddlewareHandler } from "hono";

type HSSFunction<T> = (c: Context, file: HonoStorageFile) => T;
type UploadCustomParams = Omit<
  PutObjectRequest,
  "Bucket" | "Key" | "Body" | "ContentType" | "ContentLength"
>;

export type HonoS3StorageOptions = {
  key?: HSSFunction<string>;
  bucket: string | HSSFunction<string>;
  client: S3Client | HSSFunction<S3Client>;
  params?: UploadCustomParams;
};

const SIGN_CONFIG_KEY = "hono-storage-s3:sign-config";
export const SIGNED_URL_KEY = "signedURLs";

type SignOption = {
  sign?: RequestPresigningArguments;
};

export interface IS3Object {
  put(command: PutObjectCommand): Promise<void>;
}

export interface IS3Sign {
  getSingedURL(
    command: GetObjectCommand,
    sign: RequestPresigningArguments,
  ): Promise<string>;
}

export type IS3Repository = IS3Object & IS3Sign;

export type HSSSingleFieldSchema = SingleFieldSchema & SignOption;
export type HSSMultipleFieldSchema = MultipleFieldSchema & SignOption;

type HSSFieldSchema = HSSSingleFieldSchema | HSSMultipleFieldSchema;

export class BaseHonoS3Storage {
  private storage: HonoStorage;
  private key: HSSFunction<string>;
  private bucket: string | HSSFunction<string>;
  private params?: UploadCustomParams;
  private s3Repository: IS3Repository | HSSFunction<IS3Repository>;

  constructor(
    options: HonoS3StorageOptions,
    s3Repository: IS3Repository | HSSFunction<IS3Repository>,
  ) {
    this.storage = new HonoStorage({
      storage: async (c, files) => {
        await Promise.all(
          files.map(async (file) => {
            await this.upload(c, file);
          }),
        );
      },
    });

    this.key = options.key ?? ((_, file) => file.name);
    this.bucket = options.bucket;
    this.params = options.params;
    this.s3Repository = s3Repository;
  }

  async upload(
    c: Context<{
      Variables: {
        [SIGN_CONFIG_KEY]: Record<string, RequestPresigningArguments>;
        [SIGNED_URL_KEY]: Record<string, string | string[]>;
      };
    }>,
    file: HonoStorageFile,
  ) {
    const key = this.key(c, file);
    const bucket =
      typeof this.bucket === "function" ? this.bucket(c, file) : this.bucket;

    // for nodejs
    const isBufferExists = typeof Buffer !== "undefined";

    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: isBufferExists ? Buffer.from(await file.arrayBuffer()) : file,
      ContentType: file.type,
      ContentLength: file.size,
      ...this.params,
    });

    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signConfig = c.get(SIGN_CONFIG_KEY) ?? {};
    const sign = signConfig[file.field.name];

    const s3Repository =
      typeof this.s3Repository === "function"
        ? this.s3Repository(c, file)
        : this.s3Repository;

    await s3Repository.put(putCommand);

    if (sign) {
      const signedURL = await s3Repository.getSingedURL(getCommand, sign);
      const signedURLs = c.get(SIGNED_URL_KEY) ?? {};
      c.set(SIGNED_URL_KEY, {
        ...signedURLs,
        [file.field.name]: (() => {
          const targetSignField = signedURLs[file.field.name] ?? [];

          if (
            file.field.type === "single" ||
            typeof targetSignField === "string"
          ) {
            return signedURL;
          }

          return [...targetSignField, signedURL];
        })(),
      });
    }
  }

  single = <T extends string, U extends SignOption>(
    name: T,
    options?: U,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: {
        [key in T]?: FieldValue;
      };
      [SIGN_CONFIG_KEY]?: Record<string, RequestPresigningArguments>;
      [SIGNED_URL_KEY]: {
        [key in T]?: U extends { sign: RequestPresigningArguments }
          ? string
          : undefined;
      };
    };
  }> => {
    return async (c, next) => {
      c.set(SIGNED_URL_KEY, {
        ...(c.get(SIGNED_URL_KEY) ?? {}),
      });

      if (options?.sign) {
        c.set(SIGN_CONFIG_KEY, {
          ...(c.get(SIGN_CONFIG_KEY) ?? {}),
          [name]: options.sign,
        });
      }

      await this.storage.single(name)(c as Context, next);
    };
  };

  multiple = <
    T extends string,
    U extends Omit<MultipleFieldSchema, "type"> & SignOption,
  >(
    name: T,
    options?: U,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: {
        [key in T]?: FieldValue;
      };
      [SIGN_CONFIG_KEY]?: Record<string, RequestPresigningArguments>;
      [SIGNED_URL_KEY]: {
        [key in T]: U extends { sign: RequestPresigningArguments }
          ? string[]
          : undefined;
      };
    };
  }> => {
    return async (c, next) => {
      c.set(SIGNED_URL_KEY, {
        ...(c.get(SIGNED_URL_KEY) ?? {}),
      });

      if (options?.sign) {
        c.set(SIGN_CONFIG_KEY, {
          ...(c.get(SIGN_CONFIG_KEY) ?? {}),
          [name]: options.sign,
        });
      }

      await this.storage.multiple(name)(c as Context, next);
    };
  };

  fields = <T extends Record<string, HSSFieldSchema>>(
    schema: T,
  ): MiddlewareHandler<{
    Variables: {
      [FILES_KEY]: {
        [key in keyof T]: T[key]["type"] extends "single"
          ? FieldValue | undefined
          : FieldValue[];
      };
      [SIGN_CONFIG_KEY]?: Record<string, RequestPresigningArguments>;
      [SIGNED_URL_KEY]: {
        [key in keyof T]: T[key]["type"] extends "single"
          ? T[key] extends { sign: RequestPresigningArguments }
            ? string
            : undefined
          : T[key] extends { sign: RequestPresigningArguments }
          ? string[]
          : undefined;
      };
    };
  }> => {
    return async (c, next) => {
      c.set(SIGNED_URL_KEY, {
        ...(c.get(SIGNED_URL_KEY) ?? {}),
      });

      if (Object.keys(schema).some((key) => schema[key].sign)) {
        c.set(SIGN_CONFIG_KEY, {
          ...(c.get(SIGN_CONFIG_KEY) ?? {}),
          ...Object.keys(schema).reduce(
            (acc, key) => {
              if (schema[key].sign) {
                acc[key] = schema[key].sign as RequestPresigningArguments;
              }
              return acc;
            },
            {} as Record<string, RequestPresigningArguments>,
          ),
        });
      }

      await this.storage.fields(schema)(c as Context, next);
    };
  };
}
