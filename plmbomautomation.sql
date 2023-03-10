PGDMP     	    /                z            plmbomautomation    13.7    14.4 8               0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                      false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                      false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                      false                       1262    16394    plmbomautomation    DATABASE     t   CREATE DATABASE plmbomautomation WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE = 'English_United States.1252';
     DROP DATABASE plmbomautomation;
                postgres    false            ?            1259    16488    cdt    TABLE     ?   CREATE TABLE public.cdt (
    id integer NOT NULL,
    cdt_ldc character varying(30) NOT NULL,
    cdt_plm character varying(30) NOT NULL,
    cdt_active boolean DEFAULT true NOT NULL
);
    DROP TABLE public.cdt;
       public         heap    postgres    false            ?            1259    16492 
   cdt_id_seq    SEQUENCE     ?   ALTER TABLE public.cdt ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cdt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    200            ?            1259    16494 	   customers    TABLE     ?   CREATE TABLE public.customers (
    id integer NOT NULL,
    plm_id character varying(15) NOT NULL,
    customer_name character varying(500) NOT NULL,
    designated_user integer NOT NULL
);
    DROP TABLE public.customers;
       public         heap    postgres    false            ?            1259    16500    customers_id_seq    SEQUENCE     ?   ALTER TABLE public.customers ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.customers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    202            ?            1259    16502    history_details    TABLE     ?  CREATE TABLE public.history_details (
    id integer NOT NULL,
    summary_id integer NOT NULL,
    reference_index integer NOT NULL,
    rm_color character varying(100),
    rm_color_code character varying(100),
    rm_color_supplier character varying(100),
    rm_color_placement character varying(100),
    rm_color_cdt character varying(100),
    gmt_color character varying(100),
    gmt_color_code character varying(100)
);
 #   DROP TABLE public.history_details;
       public         heap    postgres    false            ?            1259    16508    history_details_id_seq    SEQUENCE     ?   ALTER TABLE public.history_details ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.history_details_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    204            ?            1259    16510    history_errors    TABLE     ?   CREATE TABLE public.history_errors (
    id integer NOT NULL,
    summary_id integer NOT NULL,
    error_type character varying(10) NOT NULL,
    error_description character varying(1000) NOT NULL
);
 "   DROP TABLE public.history_errors;
       public         heap    postgres    false            ?            1259    16516    history_errors_id_seq    SEQUENCE     ?   ALTER TABLE public.history_errors ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.history_errors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    206            ?            1259    16518    history_head    TABLE     ?  CREATE TABLE public.history_head (
    id integer NOT NULL,
    customer_id_plm character varying(20) NOT NULL,
    customer_name character varying(100) NOT NULL,
    season_id_plm character varying(20) NOT NULL,
    season_name character varying(100) NOT NULL,
    style_id_plm character varying(20) NOT NULL,
    style_name character varying(100) NOT NULL,
    bom_version_id_plm character varying(20) NOT NULL,
    bom_version_name character varying(100) NOT NULL
);
     DROP TABLE public.history_head;
       public         heap    postgres    false            ?            1259    16521    history_head_id_seq    SEQUENCE     ?   ALTER TABLE public.history_head ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.history_head_id_seq
    START WITH 0
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    208            ?            1259    16523    history_summary    TABLE     ?  CREATE TABLE public.history_summary (
    id integer NOT NULL,
    history_head_id integer NOT NULL,
    colorways_extracted integer NOT NULL,
    raw_material_extracted integer NOT NULL,
    colorways_added_to_the_library integer NOT NULL,
    raw_material_colors_added_to_the_library integer NOT NULL,
    colorways_added_to_plm_bom integer NOT NULL,
    raw_material_colors_added_to_plm_bom integer NOT NULL,
    uploaded_date timestamp without time zone NOT NULL
);
 #   DROP TABLE public.history_summary;
       public         heap    postgres    false            ?            1259    16526    history_summary_id_seq    SEQUENCE     ?   ALTER TABLE public.history_summary ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.history_summary_id_seq
    START WITH 0
    INCREMENT BY 1
    MINVALUE 0
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    210            ?            1259    16528 
   privileges    TABLE     ?   CREATE TABLE public.privileges (
    prev_id integer NOT NULL,
    user_manage boolean NOT NULL,
    config_section boolean NOT NULL
);
    DROP TABLE public.privileges;
       public         heap    postgres    false            ?            1259    16531    roles    TABLE     `   CREATE TABLE public.roles (
    id integer NOT NULL,
    role character varying(25) NOT NULL
);
    DROP TABLE public.roles;
       public         heap    postgres    false            ?            1259    16534    roles_id_seq    SEQUENCE     ?   ALTER TABLE public.roles ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public          postgres    false    213            ?            1259    16536    users    TABLE     v   CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(25),
    role integer NOT NULL
);
    DROP TABLE public.users;
       public         heap    postgres    false            ?            1259    16539    users_id_seq    SEQUENCE     ?   CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 #   DROP SEQUENCE public.users_id_seq;
       public          postgres    false    215                       0    0    users_id_seq    SEQUENCE OWNED BY     =   ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
          public          postgres    false    216            ?            1259    16541    users_id_seq1    SEQUENCE     ?   ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    MAXVALUE 2222222
    CACHE 1
);
            public          postgres    false    215            ?          0    16488    cdt 
   TABLE DATA           ?   COPY public.cdt (id, cdt_ldc, cdt_plm, cdt_active) FROM stdin;
    public          postgres    false    200   D       ?          0    16494 	   customers 
   TABLE DATA           O   COPY public.customers (id, plm_id, customer_name, designated_user) FROM stdin;
    public          postgres    false    202   ;D       ?          0    16502    history_details 
   TABLE DATA           ?   COPY public.history_details (id, summary_id, reference_index, rm_color, rm_color_code, rm_color_supplier, rm_color_placement, rm_color_cdt, gmt_color, gmt_color_code) FROM stdin;
    public          postgres    false    204   ?D       ?          0    16510    history_errors 
   TABLE DATA           W   COPY public.history_errors (id, summary_id, error_type, error_description) FROM stdin;
    public          postgres    false    206   ?D       ?          0    16518    history_head 
   TABLE DATA           ?   COPY public.history_head (id, customer_id_plm, customer_name, season_id_plm, season_name, style_id_plm, style_name, bom_version_id_plm, bom_version_name) FROM stdin;
    public          postgres    false    208   ?D       ?          0    16523    history_summary 
   TABLE DATA             COPY public.history_summary (id, history_head_id, colorways_extracted, raw_material_extracted, colorways_added_to_the_library, raw_material_colors_added_to_the_library, colorways_added_to_plm_bom, raw_material_colors_added_to_plm_bom, uploaded_date) FROM stdin;
    public          postgres    false    210   ?D       ?          0    16528 
   privileges 
   TABLE DATA           J   COPY public.privileges (prev_id, user_manage, config_section) FROM stdin;
    public          postgres    false    212   ?D       ?          0    16531    roles 
   TABLE DATA           )   COPY public.roles (id, role) FROM stdin;
    public          postgres    false    213   %E       ?          0    16536    users 
   TABLE DATA           3   COPY public.users (id, username, role) FROM stdin;
    public          postgres    false    215   _E       	           0    0 
   cdt_id_seq    SEQUENCE SET     8   SELECT pg_catalog.setval('public.cdt_id_seq', 3, true);
          public          postgres    false    201            
           0    0    customers_id_seq    SEQUENCE SET     >   SELECT pg_catalog.setval('public.customers_id_seq', 3, true);
          public          postgres    false    203                       0    0    history_details_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.history_details_id_seq', 1, false);
          public          postgres    false    205                       0    0    history_errors_id_seq    SEQUENCE SET     D   SELECT pg_catalog.setval('public.history_errors_id_seq', 1, false);
          public          postgres    false    207                       0    0    history_head_id_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.history_head_id_seq', 0, false);
          public          postgres    false    209                       0    0    history_summary_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.history_summary_id_seq', 0, false);
          public          postgres    false    211                       0    0    roles_id_seq    SEQUENCE SET     :   SELECT pg_catalog.setval('public.roles_id_seq', 2, true);
          public          postgres    false    214                       0    0    users_id_seq    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.users_id_seq', 1, false);
          public          postgres    false    216                       0    0    users_id_seq1    SEQUENCE SET     ;   SELECT pg_catalog.setval('public.users_id_seq1', 3, true);
          public          postgres    false    217            W           2606    16544    cdt cdt_pkey 
   CONSTRAINT     J   ALTER TABLE ONLY public.cdt
    ADD CONSTRAINT cdt_pkey PRIMARY KEY (id);
 6   ALTER TABLE ONLY public.cdt DROP CONSTRAINT cdt_pkey;
       public            postgres    false    200            Y           2606    16546    customers customers_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.customers DROP CONSTRAINT customers_pkey;
       public            postgres    false    202            [           2606    16548 $   history_details history_details_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.history_details
    ADD CONSTRAINT history_details_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.history_details DROP CONSTRAINT history_details_pkey;
       public            postgres    false    204            ]           2606    16550 "   history_errors history_errors_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.history_errors
    ADD CONSTRAINT history_errors_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.history_errors DROP CONSTRAINT history_errors_pkey;
       public            postgres    false    206            _           2606    16552    history_head history_head_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.history_head
    ADD CONSTRAINT history_head_pkey PRIMARY KEY (id);
 H   ALTER TABLE ONLY public.history_head DROP CONSTRAINT history_head_pkey;
       public            postgres    false    208            a           2606    16554 $   history_summary history_summary_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.history_summary
    ADD CONSTRAINT history_summary_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.history_summary DROP CONSTRAINT history_summary_pkey;
       public            postgres    false    210            c           2606    16556    privileges privileges_pkey 
   CONSTRAINT     ]   ALTER TABLE ONLY public.privileges
    ADD CONSTRAINT privileges_pkey PRIMARY KEY (prev_id);
 D   ALTER TABLE ONLY public.privileges DROP CONSTRAINT privileges_pkey;
       public            postgres    false    212            e           2606    16558    roles roles_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_pkey;
       public            postgres    false    213            g           2606    16560    users users_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public            postgres    false    215            h           2606    16561    customers fk_customer_and_user    FK CONSTRAINT     ?   ALTER TABLE ONLY public.customers
    ADD CONSTRAINT fk_customer_and_user FOREIGN KEY (designated_user) REFERENCES public.users(id) MATCH FULL;
 H   ALTER TABLE ONLY public.customers DROP CONSTRAINT fk_customer_and_user;
       public          postgres    false    215    202    2919            l           2606    16566    privileges fk_priv_and_role    FK CONSTRAINT     ?   ALTER TABLE ONLY public.privileges
    ADD CONSTRAINT fk_priv_and_role FOREIGN KEY (prev_id) REFERENCES public.roles(id) NOT VALID;
 E   ALTER TABLE ONLY public.privileges DROP CONSTRAINT fk_priv_and_role;
       public          postgres    false    213    2917    212            m           2606    16571    users fk_roll    FK CONSTRAINT     ~   ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_roll FOREIGN KEY (role) REFERENCES public.roles(id) MATCH FULL NOT VALID;
 7   ALTER TABLE ONLY public.users DROP CONSTRAINT fk_roll;
       public          postgres    false    215    2917    213            k           2606    16576 $   history_summary fk_with_history_head    FK CONSTRAINT     ?   ALTER TABLE ONLY public.history_summary
    ADD CONSTRAINT fk_with_history_head FOREIGN KEY (history_head_id) REFERENCES public.history_head(id);
 N   ALTER TABLE ONLY public.history_summary DROP CONSTRAINT fk_with_history_head;
       public          postgres    false    208    2911    210            i           2606    16581 $   history_details fk_with_history_summ    FK CONSTRAINT     ?   ALTER TABLE ONLY public.history_details
    ADD CONSTRAINT fk_with_history_summ FOREIGN KEY (summary_id) REFERENCES public.history_summary(id) NOT VALID;
 N   ALTER TABLE ONLY public.history_details DROP CONSTRAINT fk_with_history_summ;
       public          postgres    false    210    2913    204            j           2606    16586 #   history_errors fk_with_history_summ    FK CONSTRAINT     ?   ALTER TABLE ONLY public.history_errors
    ADD CONSTRAINT fk_with_history_summ FOREIGN KEY (summary_id) REFERENCES public.history_summary(id) NOT VALID;
 M   ALTER TABLE ONLY public.history_errors DROP CONSTRAINT fk_with_history_summ;
       public          postgres    false    2913    206    210            ?   *   x?3?v???K?IUp?L?,?2?tq?t?/M????qqq ??
?      ?   ?   x?3?t6620?????4?2q?8Â?cNgC33S###N?Ă?J?Ē??<?T? i?      ?      x?????? ? ?      ?      x?????? ? ?      ?      x?????? ? ?      ?      x?????? ? ?      ?      x?3?,?,?2?L?1z\\\       ?   *   x?3?tL????,.)J,?/?2??/O-R-N-?????? ŉ
_      ?   3   x?3?trsv?4?2?t?M,J?K,???4?2?t,?(?IJ??qqq ?2
?     