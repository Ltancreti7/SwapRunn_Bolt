


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






DO $$
BEGIN
  CREATE TYPE "public"."user_type" AS ENUM (
      'dealer',
      'driver',
      'staff',
      'admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


ALTER TYPE "public"."user_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_dealer_profile"("p_user_id" "uuid", "dealership_name" "text", "contact_name" "text", "business_email" "text", "address" "text", "phone" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into dealers (
    user_id, dealership_name, contact_name, business_email, address, phone, created_at
  )
  values (
    p_user_id, dealership_name, contact_name, business_email, address, phone, now()
  );
end;
$$;


ALTER FUNCTION "public"."create_dealer_profile"("p_user_id" "uuid", "dealership_name" "text", "contact_name" "text", "business_email" "text", "address" "text", "phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_dealer_profile"("p_user_id" "uuid", "dealership_name" "text", "contact_name" "text", "business_email" "text", "address" "text", "phone" "text", "website" "text" DEFAULT NULL::"text", "business_size" "text" DEFAULT 'medium'::"text", "selected_plan" "text" DEFAULT 'professional'::"text", "heard_about" "text" DEFAULT 'other'::"text", "primary_brands" "text"[] DEFAULT '{}'::"text"[], "vehicle_types" "text"[] DEFAULT '{}'::"text"[], "average_inventory" "text" DEFAULT NULL::"text", "monthly_deliveries" "text" DEFAULT NULL::"text", "service_radius" "text" DEFAULT NULL::"text", "primary_service_areas" "text" DEFAULT NULL::"text", "special_delivery_needs" "text" DEFAULT NULL::"text", "operating_hours" "text" DEFAULT NULL::"text", "weekend_service" boolean DEFAULT false, "after_hours_service" boolean DEFAULT false, "sales_staff_count" "text" DEFAULT NULL::"text", "service_staff_count" "text" DEFAULT NULL::"text", "existing_delivery_staff" "text" DEFAULT NULL::"text", "current_dms" "text" DEFAULT NULL::"text", "current_crm" "text" DEFAULT NULL::"text", "has_inventory_system" boolean DEFAULT false, "needs_integration" boolean DEFAULT false) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
    -- ✅ Insert or update into profiles
    insert into public.profiles (
        user_id,
        user_type,
        full_name,
        phone
    )
    values (
        p_user_id,
        'dealer',
        contact_name,
        phone
    )
    on conflict (user_id) do update set
        user_type = 'dealer',
        full_name = excluded.full_name,
        phone = excluded.phone,
        updated_at = now();

    -- ✅ Insert into dealership_profiles
    insert into public.dealership_profiles (
        user_id,
        dealership_name,
        contact_name,
        business_email,
        address,
        phone,
        website,
        business_size,
        selected_plan,
        heard_about,
        primary_brands,
        vehicle_types,
        average_inventory,
        monthly_deliveries,
        service_radius,
        primary_service_areas,
        special_delivery_needs,
        operating_hours,
        weekend_service,
        after_hours_service,
        sales_staff_count,
        service_staff_count,
        existing_delivery_staff,
        current_dms,
        current_crm,
        has_inventory_system,
        needs_integration
    )
    values (
        p_user_id,
        dealership_name,
        contact_name,
        business_email,
        address,
        phone,
        website,
        business_size,
        selected_plan,
        heard_about,
        primary_brands,
        vehicle_types,
        average_inventory,
        monthly_deliveries,
        service_radius,
        primary_service_areas,
        special_delivery_needs,
        operating_hours,
        weekend_service,
        after_hours_service,
        sales_staff_count,
        service_staff_count,
        existing_delivery_staff,
        current_dms,
        current_crm,
        has_inventory_system,
        needs_integration
    );
end;
$$;


ALTER FUNCTION "public"."create_dealer_profile"("p_user_id" "uuid", "dealership_name" "text", "contact_name" "text", "business_email" "text", "address" "text", "phone" "text", "website" "text", "business_size" "text", "selected_plan" "text", "heard_about" "text", "primary_brands" "text"[], "vehicle_types" "text"[], "average_inventory" "text", "monthly_deliveries" "text", "service_radius" "text", "primary_service_areas" "text", "special_delivery_needs" "text", "operating_hours" "text", "weekend_service" boolean, "after_hours_service" boolean, "sales_staff_count" "text", "service_staff_count" "text", "existing_delivery_staff" "text", "current_dms" "text", "current_crm" "text", "has_inventory_system" boolean, "needs_integration" boolean) OWNER TO "postgres";


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_user_profile'
      AND p.pronargs = 0
  ) THEN
    CREATE OR REPLACE FUNCTION "public"."get_user_profile"() RETURNS TABLE("id" "uuid", "user_type" "text", "full_name" "text", "phone" "text", "dealership_name" "text", "business_size" "text", "selected_plan" "text")
        LANGUAGE "plpgsql" SECURITY DEFINER
        AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            p.id,
            p.user_type::TEXT,
            p.full_name,
            p.phone,
            dp.dealership_name,
            dp.business_size,
            dp.selected_plan
        FROM profiles p
        LEFT JOIN dealership_profiles dp ON p.user_id = dp.user_id
        WHERE p.user_id = auth.uid();
    END;
    $$;
  END IF;
END $$;


ALTER FUNCTION "public"."get_user_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_dealer"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if (new.raw_user_meta_data->>'role') = 'dealer' then
    insert into public.dealers (
      user_id,
      dealership_name,
      contact_name,
      business_email,
      phone
    ) values (
      new.id,
      new.raw_user_meta_data->>'dealership_name',
      new.raw_user_meta_data->>'contact_name',
      new.raw_user_meta_data->>'business_email',
      new.raw_user_meta_data->>'phone'
    );
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_dealer"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  role text := new.raw_user_meta_data->>'role';
begin
  if role = 'dealer' then
    insert into public.dealers (user_id, dealership_name, contact_name, business_email)
    values (new.id, 'Pending Dealership', new.email, new.email);
  elsif role = 'driver' then
    insert into public.drivers (user_id, full_name, phone)
    values (new.id, 'Pending Driver', '');
  elsif role = 'staff' then
    insert into public.staff (user_id, full_name, role)
    values (new.id, 'Pending Staff', 'support');
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invite_driver"("email" "text", "dealer_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_user uuid;
BEGIN
  -- 1. Create a new user in Supabase Auth
  INSERT INTO auth.users (email)
  VALUES (email)
  RETURNING id INTO new_user;

  -- 2. Create matching driver profile linked to the dealer
  INSERT INTO public.drivers (user_id, dealer_id, created_at)
  VALUES (new_user, dealer_id, now());
END;
$$;


ALTER FUNCTION "public"."invite_driver"("email" "text", "dealer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."dealers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "dealership_name" "text" NOT NULL,
    "contact_name" "text" NOT NULL,
    "business_email" "text" NOT NULL,
    "phone" "text",
    "address" "text",
    "website" "text",
    "business_size" "text",
    "primary_brands" "text"[],
    "vehicle_types" "text"[],
    "average_inventory" "text",
    "monthly_deliveries" "text",
    "service_radius" "text",
    "primary_service_areas" "text",
    "special_delivery_needs" "text",
    "operating_hours" "text",
    "weekend_service" boolean DEFAULT false,
    "after_hours_service" boolean DEFAULT false,
    "sales_staff_count" "text",
    "service_staff_count" "text",
    "existing_delivery_staff" "text",
    "current_dms" "text",
    "current_crm" "text",
    "has_inventory_system" boolean DEFAULT false,
    "needs_integration" boolean DEFAULT false,
    "heard_about" "text",
    "selected_plan" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dealers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dealership_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "dealership_name" "text" NOT NULL,
    "contact_name" "text" NOT NULL,
    "business_email" "text" NOT NULL,
    "address" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "website" "text",
    "business_size" "text" DEFAULT 'medium'::"text",
    "selected_plan" "text" DEFAULT 'professional'::"text",
    "heard_about" "text" DEFAULT 'other'::"text",
    "primary_brands" "text"[] DEFAULT '{}'::"text"[],
    "vehicle_types" "text"[] DEFAULT '{}'::"text"[],
    "average_inventory" "text",
    "monthly_deliveries" "text",
    "service_radius" "text",
    "primary_service_areas" "text",
    "special_delivery_needs" "text",
    "operating_hours" "text",
    "weekend_service" boolean DEFAULT false,
    "after_hours_service" boolean DEFAULT false,
    "sales_staff_count" "text",
    "service_staff_count" "text",
    "existing_delivery_staff" "text",
    "current_dms" "text",
    "current_crm" "text",
    "has_inventory_system" boolean DEFAULT false,
    "needs_integration" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dealership_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dealerships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "state" "text" NOT NULL,
    "address" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dealerships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."driver_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "driver_id" "uuid",
    "dealer_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text"
);


ALTER TABLE "public"."driver_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."driver_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "driver_id" "uuid",
    "license_url" "text" NOT NULL,
    "driving_record_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "verified" boolean DEFAULT false
);


ALTER TABLE "public"."driver_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."driver_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone_number" "text" NOT NULL,
    "state" "text" NOT NULL,
    "city" "text",
    "preferred_radius_miles" integer DEFAULT 25,
    "availability_days" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."driver_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drivers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "full_name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "license_number" "text",
    "vehicle_type" "text",
    "status" "text" DEFAULT 'available'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."drivers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "dealer_id" "uuid",
    "driver_id" "uuid",
    "customer_name" "text",
    "pickup_location" "text",
    "dropoff_location" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "user_type" "text" DEFAULT 'dealer'::"text",
    "full_name" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "dealer_id" "uuid"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "full_name" "text" NOT NULL,
    "role" "text",
    "phone" "text",
    "dealership_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "staff_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'manager'::"text", 'support'::"text"])))
);


ALTER TABLE "public"."staff" OWNER TO "postgres";


ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "dealers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dealership_profiles"
    ADD CONSTRAINT "dealership_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dealership_profiles"
    ADD CONSTRAINT "dealership_profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."dealerships"
    ADD CONSTRAINT "dealerships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."driver_applications"
    ADD CONSTRAINT "driver_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."driver_documents"
    ADD CONSTRAINT "driver_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."driver_profiles"
    ADD CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "drivers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."driver_profiles"
    ADD CONSTRAINT "unique_user_profile" UNIQUE ("user_id");



CREATE INDEX "idx_dealers_business_size" ON "public"."dealers" USING "btree" ("business_size");



CREATE INDEX "idx_dealers_user_id" ON "public"."dealers" USING "btree" ("user_id");



CREATE INDEX "idx_driver_applications_dealer_id" ON "public"."driver_applications" USING "btree" ("dealer_id");



CREATE INDEX "idx_driver_documents_driver_id" ON "public"."driver_documents" USING "btree" ("driver_id");



CREATE INDEX "idx_driver_profiles_state" ON "public"."driver_profiles" USING "btree" ("state");



CREATE OR REPLACE TRIGGER "update_dealership_profiles_updated_at" BEFORE UPDATE ON "public"."dealership_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_profiles_updated_at"();



ALTER TABLE ONLY "public"."dealers"
    ADD CONSTRAINT "dealers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."dealership_profiles"
    ADD CONSTRAINT "dealership_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."driver_applications"
    ADD CONSTRAINT "driver_applications_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealerships"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."driver_applications"
    ADD CONSTRAINT "driver_applications_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."driver_documents"
    ADD CONSTRAINT "driver_documents_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."driver_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."driver_profiles"
    ADD CONSTRAINT "driver_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_dealership_id_fkey" FOREIGN KEY ("dealership_id") REFERENCES "public"."dealers"("id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow admins to add drivers" ON "public"."drivers" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."user_type" = 'admin'::"text")))));



CREATE POLICY "Allow admins to add staff" ON "public"."staff" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."user_type" = 'admin'::"text")))));



CREATE POLICY "Dealer can manage own profile" ON "public"."dealers" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Driver can manage own profile" ON "public"."drivers" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Staff can manage own profile" ON "public"."staff" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own dealership profile" ON "public"."dealership_profiles" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can read their own dealership profile" ON "public"."dealership_profiles" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own dealership profile" ON "public"."dealership_profiles" FOR UPDATE USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."dealers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "dealers can insert own data" ON "public"."dealers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "dealers can manage own jobs" ON "public"."jobs" USING (("auth"."uid"() = "dealer_id")) WITH CHECK (("auth"."uid"() = "dealer_id"));



CREATE POLICY "dealers can update own data" ON "public"."dealers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "dealers can view own data" ON "public"."dealers" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."dealership_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drivers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "drivers can insert own data" ON "public"."drivers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "drivers can update own data" ON "public"."drivers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "drivers can view assigned jobs" ON "public"."jobs" FOR SELECT USING (("auth"."uid"() = "driver_id"));



CREATE POLICY "drivers can view own data" ON "public"."drivers" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles can insert own data" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles can update own data" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles can view own data" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."staff" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."create_dealer_profile"("p_user_id" "uuid", "dealership_name" "text", "contact_name" "text", "business_email" "text", "address" "text", "phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_dealer_profile"("p_user_id" "uuid", "dealership_name" "text", "contact_name" "text", "business_email" "text", "address" "text", "phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_dealer_profile"("p_user_id" "uuid", "dealership_name" "text", "contact_name" "text", "business_email" "text", "address" "text", "phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_dealer_profile"("p_user_id" "uuid", "dealership_name" "text", "contact_name" "text", "business_email" "text", "address" "text", "phone" "text", "website" "text", "business_size" "text", "selected_plan" "text", "heard_about" "text", "primary_brands" "text"[], "vehicle_types" "text"[], "average_inventory" "text", "monthly_deliveries" "text", "service_radius" "text", "primary_service_areas" "text", "special_delivery_needs" "text", "operating_hours" "text", "weekend_service" boolean, "after_hours_service" boolean, "sales_staff_count" "text", "service_staff_count" "text", "existing_delivery_staff" "text", "current_dms" "text", "current_crm" "text", "has_inventory_system" boolean, "needs_integration" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_dealer_profile"("p_user_id" "uuid", "dealership_name" "text", "contact_name" "text", "business_email" "text", "address" "text", "phone" "text", "website" "text", "business_size" "text", "selected_plan" "text", "heard_about" "text", "primary_brands" "text"[], "vehicle_types" "text"[], "average_inventory" "text", "monthly_deliveries" "text", "service_radius" "text", "primary_service_areas" "text", "special_delivery_needs" "text", "operating_hours" "text", "weekend_service" boolean, "after_hours_service" boolean, "sales_staff_count" "text", "service_staff_count" "text", "existing_delivery_staff" "text", "current_dms" "text", "current_crm" "text", "has_inventory_system" boolean, "needs_integration" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_dealer_profile"("p_user_id" "uuid", "dealership_name" "text", "contact_name" "text", "business_email" "text", "address" "text", "phone" "text", "website" "text", "business_size" "text", "selected_plan" "text", "heard_about" "text", "primary_brands" "text"[], "vehicle_types" "text"[], "average_inventory" "text", "monthly_deliveries" "text", "service_radius" "text", "primary_service_areas" "text", "special_delivery_needs" "text", "operating_hours" "text", "weekend_service" boolean, "after_hours_service" boolean, "sales_staff_count" "text", "service_staff_count" "text", "existing_delivery_staff" "text", "current_dms" "text", "current_crm" "text", "has_inventory_system" boolean, "needs_integration" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_dealer"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_dealer"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_dealer"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."invite_driver"("email" "text", "dealer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."invite_driver"("email" "text", "dealer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."invite_driver"("email" "text", "dealer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."dealers" TO "anon";
GRANT ALL ON TABLE "public"."dealers" TO "authenticated";
GRANT ALL ON TABLE "public"."dealers" TO "service_role";



GRANT ALL ON TABLE "public"."dealership_profiles" TO "anon";
GRANT ALL ON TABLE "public"."dealership_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."dealership_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."dealerships" TO "anon";
GRANT ALL ON TABLE "public"."dealerships" TO "authenticated";
GRANT ALL ON TABLE "public"."dealerships" TO "service_role";



GRANT ALL ON TABLE "public"."driver_applications" TO "anon";
GRANT ALL ON TABLE "public"."driver_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."driver_applications" TO "service_role";



GRANT ALL ON TABLE "public"."driver_documents" TO "anon";
GRANT ALL ON TABLE "public"."driver_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."driver_documents" TO "service_role";



GRANT ALL ON TABLE "public"."driver_profiles" TO "anon";
GRANT ALL ON TABLE "public"."driver_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."driver_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."drivers" TO "anon";
GRANT ALL ON TABLE "public"."drivers" TO "authenticated";
GRANT ALL ON TABLE "public"."drivers" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."staff" TO "anon";
GRANT ALL ON TABLE "public"."staff" TO "authenticated";
GRANT ALL ON TABLE "public"."staff" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_dealer();
