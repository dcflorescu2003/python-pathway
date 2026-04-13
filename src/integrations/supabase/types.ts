export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          class_id: string
          created_at: string
          id: string
          item_id: string
          item_type: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          item_id: string
          item_type: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "teacher_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          color: string
          created_at: string
          description: string
          icon: string
          id: string
          number: number
          title: string
        }
        Insert: {
          color?: string
          created_at?: string
          description: string
          icon?: string
          id: string
          number: number
          title: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          number?: number
          title?: string
        }
        Relationships: []
      }
      class_members: {
        Row: {
          class_id: string
          id: string
          joined_at: string
          student_id: string
        }
        Insert: {
          class_id: string
          id?: string
          joined_at?: string
          student_id: string
        }
        Update: {
          class_id?: string
          id?: string
          joined_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "teacher_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      completed_lessons: {
        Row: {
          completed_at: string
          id: string
          lesson_id: string
          score: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          lesson_id: string
          score?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          lesson_id?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          coupon_type: string
          id: string
          premium_until: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          coupon_type?: string
          id?: string
          premium_until: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          coupon_type?: string
          id?: string
          premium_until?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          coupon_type: string
          created_at: string
          duration_days: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          used_count: number
        }
        Insert: {
          code: string
          coupon_type?: string
          created_at?: string
          duration_days?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          used_count?: number
        }
        Update: {
          code?: string
          coupon_type?: string
          created_at?: string
          duration_days?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          used_count?: number
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      exercises: {
        Row: {
          blanks: Json | null
          code_template: string | null
          correct_option_id: string | null
          explanation: string | null
          id: string
          is_true: boolean | null
          lesson_id: string
          lines: Json | null
          options: Json | null
          pairs: Json | null
          question: string
          sort_order: number
          statement: string | null
          type: string
          xp: number
        }
        Insert: {
          blanks?: Json | null
          code_template?: string | null
          correct_option_id?: string | null
          explanation?: string | null
          id: string
          is_true?: boolean | null
          lesson_id: string
          lines?: Json | null
          options?: Json | null
          pairs?: Json | null
          question: string
          sort_order?: number
          statement?: string | null
          type: string
          xp?: number
        }
        Update: {
          blanks?: Json | null
          code_template?: string | null
          correct_option_id?: string | null
          explanation?: string | null
          id?: string
          is_true?: boolean | null
          lesson_id?: string
          lines?: Json | null
          options?: Json | null
          pairs?: Json | null
          question?: string
          sort_order?: number
          statement?: string | null
          type?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          chapter_id: string
          description: string
          id: string
          is_premium: boolean
          sort_order: number
          title: string
          xp_reward: number
        }
        Insert: {
          chapter_id: string
          description: string
          id: string
          is_premium?: boolean
          sort_order?: number
          title: string
          xp_reward?: number
        }
        Update: {
          chapter_id?: string
          description?: string
          id?: string
          is_premium?: boolean
          sort_order?: number
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_exercises: {
        Row: {
          blanks: Json | null
          code_template: string | null
          correct_option_id: string | null
          explanation: string | null
          hint: string | null
          id: string
          is_true: boolean | null
          lesson_id: string
          lines: Json | null
          options: Json | null
          pairs: Json | null
          question: string
          solution: string
          sort_order: number
          statement: string | null
          test_cases: Json
          type: string
          xp: number
        }
        Insert: {
          blanks?: Json | null
          code_template?: string | null
          correct_option_id?: string | null
          explanation?: string | null
          hint?: string | null
          id: string
          is_true?: boolean | null
          lesson_id: string
          lines?: Json | null
          options?: Json | null
          pairs?: Json | null
          question: string
          solution?: string
          sort_order?: number
          statement?: string | null
          test_cases?: Json
          type: string
          xp?: number
        }
        Update: {
          blanks?: Json | null
          code_template?: string | null
          correct_option_id?: string | null
          explanation?: string | null
          hint?: string | null
          id?: string
          is_true?: boolean | null
          lesson_id?: string
          lines?: Json | null
          options?: Json | null
          pairs?: Json | null
          question?: string
          solution?: string
          sort_order?: number
          statement?: string | null
          test_cases?: Json
          type?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "manual_exercises_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "manual_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_lessons: {
        Row: {
          created_at: string
          description: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          id: string
          sort_order?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      problem_chapters: {
        Row: {
          icon: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          icon?: string
          id: string
          sort_order?: number
          title: string
        }
        Update: {
          icon?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      problems: {
        Row: {
          chapter_id: string
          description: string
          difficulty: string
          hint: string | null
          id: string
          is_premium: boolean
          solution: string
          sort_order: number
          test_cases: Json
          title: string
          xp_reward: number
        }
        Insert: {
          chapter_id: string
          description: string
          difficulty?: string
          hint?: string | null
          id: string
          is_premium?: boolean
          solution?: string
          sort_order?: number
          test_cases?: Json
          title: string
          xp_reward?: number
        }
        Update: {
          chapter_id?: string
          description?: string
          difficulty?: string
          hint?: string | null
          id?: string
          is_premium?: boolean
          solution?: string
          sort_order?: number
          test_cases?: Json
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "problems_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "problem_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          best_streak: number
          created_at: string
          display_name: string | null
          id: string
          is_premium: boolean
          is_teacher: boolean
          last_activity_date: string
          lives: number
          lives_updated_at: string | null
          school_id: string | null
          streak: number
          teacher_status: string | null
          updated_at: string
          user_id: string
          verification_method: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          best_streak?: number
          created_at?: string
          display_name?: string | null
          id?: string
          is_premium?: boolean
          is_teacher?: boolean
          last_activity_date?: string
          lives?: number
          lives_updated_at?: string | null
          school_id?: string | null
          streak?: number
          teacher_status?: string | null
          updated_at?: string
          user_id: string
          verification_method?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          best_streak?: number
          created_at?: string
          display_name?: string | null
          id?: string
          is_premium?: boolean
          is_teacher?: boolean
          last_activity_date?: string
          lives?: number
          lives_updated_at?: string | null
          school_id?: string | null
          streak?: number
          teacher_status?: string | null
          updated_at?: string
          user_id?: string
          verification_method?: string | null
          xp?: number
        }
        Relationships: []
      }
      teacher_classes: {
        Row: {
          created_at: string
          id: string
          join_code: string
          name: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          join_code: string
          name: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          join_code?: string
          name?: string
          teacher_id?: string
        }
        Relationships: []
      }
      teacher_invite_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          max_uses: number
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number
          used_count?: number
        }
        Relationships: []
      }
      teacher_referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          teacher_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          teacher_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          teacher_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      teacher_verification_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          message: string
          request_id: string
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message?: string
          request_id: string
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_verification_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "teacher_verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_verification_requests: {
        Row: {
          admin_notes: string | null
          contact_email: string | null
          created_at: string
          data: Json | null
          id: string
          method: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          contact_email?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          method: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          contact_email?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      test_answers: {
        Row: {
          ai_reviewed: boolean
          answer_data: Json | null
          feedback: string | null
          id: string
          max_points: number | null
          score: number | null
          submission_id: string
          test_item_id: string
        }
        Insert: {
          ai_reviewed?: boolean
          answer_data?: Json | null
          feedback?: string | null
          id?: string
          max_points?: number | null
          score?: number | null
          submission_id: string
          test_item_id: string
        }
        Update: {
          ai_reviewed?: boolean
          answer_data?: Json | null
          feedback?: string | null
          id?: string
          max_points?: number | null
          score?: number | null
          submission_id?: string
          test_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "test_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_answers_test_item_id_fkey"
            columns: ["test_item_id"]
            isOneToOne: false
            referencedRelation: "test_items"
            referencedColumns: ["id"]
          },
        ]
      }
      test_assignments: {
        Row: {
          assigned_at: string
          class_id: string
          due_date: string | null
          id: string
          is_active: boolean
          test_id: string
        }
        Insert: {
          assigned_at?: string
          class_id: string
          due_date?: string | null
          id?: string
          is_active?: boolean
          test_id: string
        }
        Update: {
          assigned_at?: string
          class_id?: string
          due_date?: string | null
          id?: string
          is_active?: boolean
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "teacher_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_assignments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_items: {
        Row: {
          custom_data: Json | null
          id: string
          points: number
          sort_order: number
          source_id: string | null
          source_type: string
          test_id: string
          variant: string
        }
        Insert: {
          custom_data?: Json | null
          id?: string
          points?: number
          sort_order?: number
          source_id?: string | null
          source_type: string
          test_id: string
          variant?: string
        }
        Update: {
          custom_data?: Json | null
          id?: string
          points?: number
          sort_order?: number
          source_id?: string | null
          source_type?: string
          test_id?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_items_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_submissions: {
        Row: {
          assignment_id: string
          auto_graded: boolean
          id: string
          max_score: number | null
          started_at: string
          student_id: string
          submitted_at: string | null
          total_score: number | null
          variant: string
        }
        Insert: {
          assignment_id: string
          auto_graded?: boolean
          id?: string
          max_score?: number | null
          started_at?: string
          student_id: string
          submitted_at?: string | null
          total_score?: number | null
          variant?: string
        }
        Update: {
          assignment_id?: string
          auto_graded?: boolean
          id?: string
          max_score?: number | null
          started_at?: string
          student_id?: string
          submitted_at?: string | null
          total_score?: number | null
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "test_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string
          id: string
          teacher_id: string
          time_limit_minutes: number | null
          title: string
          updated_at: string
          variant_mode: string
        }
        Insert: {
          created_at?: string
          id?: string
          teacher_id: string
          time_limit_minutes?: number | null
          title: string
          updated_at?: string
          variant_mode?: string
        }
        Update: {
          created_at?: string
          id?: string
          teacher_id?: string
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string
          variant_mode?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      problems_public: {
        Row: {
          chapter_id: string | null
          description: string | null
          difficulty: string | null
          hint: string | null
          id: string | null
          is_premium: boolean | null
          sort_order: number | null
          test_cases: Json | null
          title: string | null
          xp_reward: number | null
        }
        Insert: {
          chapter_id?: string | null
          description?: string | null
          difficulty?: string | null
          hint?: string | null
          id?: string | null
          is_premium?: boolean | null
          sort_order?: number | null
          test_cases?: Json | null
          title?: string | null
          xp_reward?: number | null
        }
        Update: {
          chapter_id?: string | null
          description?: string | null
          difficulty?: string | null
          hint?: string | null
          id?: string | null
          is_premium?: boolean | null
          sort_order?: number | null
          test_cases?: Json | null
          title?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "problems_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "problem_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_teacher_request: {
        Args: { p_notes?: string; p_request_id: string }
        Returns: undefined
      }
      deactivate_teacher_mode: { Args: never; Returns: undefined }
      get_problem_solution: { Args: { p_id: string }; Returns: string }
      get_test_items_for_student: {
        Args: { p_assignment_id: string; p_variant: string }
        Returns: {
          blanks: Json
          code_template: string
          id: string
          item_type: string
          lines: Json
          options: Json
          pairs: Json
          points: number
          question: string
          sort_order: number
          source_id: string
          source_type: string
          statement: string
          test_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_verified_teacher: { Args: { _user_id: string }; Returns: boolean }
      reject_teacher_request: {
        Args: { p_notes?: string; p_request_id: string }
        Returns: undefined
      }
      request_teacher_status: { Args: never; Returns: undefined }
      revoke_teacher_status: { Args: { p_user_id: string }; Returns: undefined }
      student_can_view_test: { Args: { p_test_id: string }; Returns: boolean }
      submit_teacher_verification: {
        Args: { p_data?: Json; p_method: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
