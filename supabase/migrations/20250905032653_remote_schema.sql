
  create table "public"."concept_generation" (
    "id" uuid not null default gen_random_uuid(),
    "campaign" text,
    "description" text,
    "upload_assets" text,
    "images_description" text,
    "run" text,
    "details_status" text,
    "personas" text,
    "key_messages" text,
    "brand_touchpoints" text,
    "ai_images_instructions" text,
    "ai_videos_instructions" text,
    "number_of_images" text,
    "image_size" text,
    "image_status" text,
    "images_prompt" text,
    "images_assets" text,
    "ai_model" text,
    "aspect_ratio" text,
    "video_status" text,
    "videos_assets" text,
    "record_id" text,
    "agency" text,
    "created_time" timestamp with time zone,
    "last_modified_time" timestamp with time zone
      );


CREATE UNIQUE INDEX concept_generation_pkey ON public.concept_generation USING btree (id);

CREATE INDEX concept_generation_record_id_idx ON public.concept_generation USING btree (record_id);

CREATE UNIQUE INDEX concept_generation_record_id_key ON public.concept_generation USING btree (record_id);

alter table "public"."concept_generation" add constraint "concept_generation_pkey" PRIMARY KEY using index "concept_generation_pkey";

alter table "public"."concept_generation" add constraint "concept_generation_record_id_key" UNIQUE using index "concept_generation_record_id_key";

grant delete on table "public"."concept_generation" to "anon";

grant insert on table "public"."concept_generation" to "anon";

grant references on table "public"."concept_generation" to "anon";

grant select on table "public"."concept_generation" to "anon";

grant trigger on table "public"."concept_generation" to "anon";

grant truncate on table "public"."concept_generation" to "anon";

grant update on table "public"."concept_generation" to "anon";

grant delete on table "public"."concept_generation" to "authenticated";

grant insert on table "public"."concept_generation" to "authenticated";

grant references on table "public"."concept_generation" to "authenticated";

grant select on table "public"."concept_generation" to "authenticated";

grant trigger on table "public"."concept_generation" to "authenticated";

grant truncate on table "public"."concept_generation" to "authenticated";

grant update on table "public"."concept_generation" to "authenticated";

grant delete on table "public"."concept_generation" to "service_role";

grant insert on table "public"."concept_generation" to "service_role";

grant references on table "public"."concept_generation" to "service_role";

grant select on table "public"."concept_generation" to "service_role";

grant trigger on table "public"."concept_generation" to "service_role";

grant truncate on table "public"."concept_generation" to "service_role";

grant update on table "public"."concept_generation" to "service_role";


