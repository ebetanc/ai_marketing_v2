import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
export type {
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums,
  CompositeTypes,
} from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Export a flag to let the app know whether Supabase is configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Provide a safe fallback stub so the app doesn't crash if env vars are missing
const supabaseStub: any = {
  auth: {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    async getUser() {
      return { data: { user: null }, error: null };
    },
    onAuthStateChange(_cb: any) {
      return {
        data: {
          subscription: {
            unsubscribe() {
              /* noop */
            },
          },
        },
      };
    },
    async signInWithOtp() {
      return {
        data: null,
        error: {
          message:
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        },
      };
    },
    async signInWithPassword() {
      return {
        data: null,
        error: {
          message:
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        },
      };
    },
    async signUp() {
      return {
        data: null,
        error: {
          message:
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        },
      };
    },
    async signInWithOAuth() {
      return {
        data: null,
        error: {
          message:
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        },
      };
    },
    async resetPasswordForEmail() {
      return {
        data: null,
        error: {
          message:
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        },
      };
    },
    async updateUser() {
      return {
        data: null,
        error: {
          message:
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        },
      };
    },
    async resend() {
      return {
        data: null,
        error: {
          message:
            "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
        },
      };
    },
    async signOut() {
      return { error: null };
    },
  },
  from() {
    // A minimal chainable query builder that always returns { data, error }
    // and supports common methods used across the app. Awaiting it simply
    // returns the object itself (not a Promise), which is fine for our usage.
    const chain: any = {
      data: [],
      error: null,
      select() {
        return chain;
      },
      order() {
        return chain;
      },
      eq() {
        return chain;
      },
      limit() {
        return chain;
      },
      range() {
        return chain;
      },
      single() {
        return chain;
      },
      maybeSingle() {
        return chain;
      },
      insert() {
        chain.data = null;
        chain.error = { message: "DB disabled (Supabase not configured)." };
        return chain;
      },
      update() {
        chain.data = null;
        chain.error = { message: "DB disabled (Supabase not configured)." };
        return chain;
      },
      delete() {
        chain.data = null;
        chain.error = { message: "DB disabled (Supabase not configured)." };
        return chain;
      },
    };
    return chain;
  },
};

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file. Running with a read-only stub (no auth, empty data).",
  );
}

export const supabase = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (supabaseStub as any);

export async function uploadFileToSupabaseStorage(
  file: File,
  bucketName: string,
  path?: string, // Optional path within the bucket
) {
  const fileName = path || `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    throw new Error(`Failed to upload file to ${bucketName}: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  if (!publicUrlData?.publicUrl) {
    throw new Error("Failed to get public URL for uploaded file.");
  }

  return publicUrlData.publicUrl;
}
