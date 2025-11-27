// Database types for Supabase - matches 001_initial_schema.sql
// Only includes fields actively used by hooks (extend as needed)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          seed_phrase: string | null;
          current_step: number;
          source_module: string;
          status: string;
          last_activity_at: string;
          expires_at: string;
          created_at: string;
          updated_at: string;
          total_phrases_generated: number | null;
          total_phrases_refined: number | null;
          total_super_items: number | null;
          total_titles_saved: number | null;
          total_packages_saved: number | null;
          extra: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          seed_phrase?: string | null;
          current_step?: number;
          source_module?: string;
          status?: string;
          last_activity_at?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
          total_phrases_generated?: number | null;
          total_phrases_refined?: number | null;
          total_super_items?: number | null;
          total_titles_saved?: number | null;
          total_packages_saved?: number | null;
          extra?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          seed_phrase?: string | null;
          current_step?: number;
          source_module?: string;
          status?: string;
          last_activity_at?: string;
          expires_at?: string;
          created_at?: string;
          updated_at?: string;
          total_phrases_generated?: number | null;
          total_phrases_refined?: number | null;
          total_super_items?: number | null;
          total_titles_saved?: number | null;
          total_packages_saved?: number | null;
          extra?: Json | null;
        };
        Relationships: [];
      };
      seed_phrases: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          phrase: string;
          seed_phrase_id: string | null;
          parent_phrase_id: string | null;
          builder_source_tag: string | null;
          origin_source_module: string | null;
          hierarchy_path: string | null;
          hierarchy_depth: number | null;
          hierarchy_data: Json | null;
          funnel_stage: string | null;
          tone_tag: string | null;
          platform_tag: string | null;
          niche_tag: string | null;
          difficulty_tag: string | null;
          freshness_tag: string | null;
          time_sensitivity_tag: string | null;
          audience_segment_tag: string | null;
          content_format_tag: string | null;
          is_selected: boolean;
          is_favorite: boolean;
          is_finalist: boolean;
          is_archived: boolean;
          is_promoted_to_super: boolean;
          created_at: string;
          updated_at: string;
          // Scores - only commonly used ones typed, rest via extra
          topic_strength_score: number | null;
          popularity_score: number | null;
          competition_score: number | null;
          audience_fit_score: number | null;
          intent_score: number | null;
          click_intensity_score: number | null;
          overall_score: number | null;
          emotional_triggers: Json | null;
          extra: Json | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          phrase: string;
          seed_phrase_id?: string | null;
          parent_phrase_id?: string | null;
          builder_source_tag?: string | null;
          origin_source_module?: string | null;
          hierarchy_path?: string | null;
          hierarchy_depth?: number | null;
          hierarchy_data?: Json | null;
          funnel_stage?: string | null;
          tone_tag?: string | null;
          platform_tag?: string | null;
          niche_tag?: string | null;
          difficulty_tag?: string | null;
          freshness_tag?: string | null;
          time_sensitivity_tag?: string | null;
          audience_segment_tag?: string | null;
          content_format_tag?: string | null;
          is_selected?: boolean;
          is_favorite?: boolean;
          is_finalist?: boolean;
          is_archived?: boolean;
          is_promoted_to_super?: boolean;
          created_at?: string;
          updated_at?: string;
          topic_strength_score?: number | null;
          popularity_score?: number | null;
          competition_score?: number | null;
          audience_fit_score?: number | null;
          intent_score?: number | null;
          click_intensity_score?: number | null;
          overall_score?: number | null;
          emotional_triggers?: Json | null;
          extra?: Json | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string;
          phrase?: string;
          seed_phrase_id?: string | null;
          parent_phrase_id?: string | null;
          builder_source_tag?: string | null;
          origin_source_module?: string | null;
          hierarchy_path?: string | null;
          hierarchy_depth?: number | null;
          hierarchy_data?: Json | null;
          funnel_stage?: string | null;
          tone_tag?: string | null;
          platform_tag?: string | null;
          niche_tag?: string | null;
          difficulty_tag?: string | null;
          freshness_tag?: string | null;
          time_sensitivity_tag?: string | null;
          audience_segment_tag?: string | null;
          content_format_tag?: string | null;
          is_selected?: boolean;
          is_favorite?: boolean;
          is_finalist?: boolean;
          is_archived?: boolean;
          is_promoted_to_super?: boolean;
          created_at?: string;
          updated_at?: string;
          topic_strength_score?: number | null;
          popularity_score?: number | null;
          competition_score?: number | null;
          audience_fit_score?: number | null;
          intent_score?: number | null;
          click_intensity_score?: number | null;
          overall_score?: number | null;
          emotional_triggers?: Json | null;
          extra?: Json | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Convenience type aliases
export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

export type SeedPhrase = Database['public']['Tables']['seed_phrases']['Row'];
export type SeedPhraseInsert = Database['public']['Tables']['seed_phrases']['Insert'];
export type SeedPhraseUpdate = Database['public']['Tables']['seed_phrases']['Update'];
