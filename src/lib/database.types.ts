export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      heroes: {
        Row: {
          id: string
          name: string
          alias: string | null
          powers: string[]
          level: number
          origin_story: string | null
          status: string
          team: string | null
          profile_image_url: string | null
          ideia: string | null
          observacao: string | null
          local: string | null
          ano: string | null
          artstyle: string | null
          storylength: string | null
          file_url: string | null
          processing_status: string | null
          hero_image_url: string | null
          generated_content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          alias?: string | null
          powers?: string[]
          level?: number
          origin_story?: string | null
          status?: string
          team?: string | null
          profile_image_url?: string | null
          ideia?: string | null
          observacao?: string | null
          local?: string | null
          ano?: string | null
          artstyle?: string | null
          storylength?: string | null
          file_url?: string | null
          processing_status?: string | null
          hero_image_url?: string | null
          generated_content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          alias?: string | null
          powers?: string[]
          level?: number
          origin_story?: string | null
          status?: string
          team?: string | null
          profile_image_url?: string | null
          ideia?: string | null
          observacao?: string | null
          local?: string | null
          ano?: string | null
          artstyle?: string | null
          storylength?: string | null
          file_url?: string | null
          processing_status?: string | null
          hero_image_url?: string | null
          generated_content?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      hero_missions: {
        Row: {
          id: string
          hero_id: string
          mission_name: string
          mission_date: string
          status: string
          description: string | null
          success_rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          hero_id: string
          mission_name: string
          mission_date: string
          status?: string
          description?: string | null
          success_rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          hero_id?: string
          mission_name?: string
          mission_date?: string
          status?: string
          description?: string | null
          success_rating?: number | null
          created_at?: string
        }
      }
    }
  }
}
