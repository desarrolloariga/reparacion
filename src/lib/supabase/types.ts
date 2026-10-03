
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "joyeria": {
          Tables: {
            "calendario_laboral": {
                  Row: {
                    "actualizado_en": string | null,"creado_en": string,"creado_por": number | null,"descripcion": string | null,"es_habil": boolean,"fecha": string,"id": number
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"descripcion"?: string | null,"es_habil": boolean,"fecha": string,"id"?: never
                  }
                  Update: {
                    "actualizado_en"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"descripcion"?: string | null,"es_habil"?: boolean,"fecha"?: string,"id"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "calendario_laboral_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"clientes": {
                  Row: {
                    "activo": boolean,"actualizado_en": string | null,"correo": string | null,"creado_en": string,"creado_por": number | null,"direccion": string | null,"erp_cliente_id": number | null,"id": number,"nombre": string,"notas": string | null,"telefono": string | null
                  }
                  Insert: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"correo"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"direccion"?: string | null,"erp_cliente_id"?: number | null,"id"?: never,"nombre": string,"notas"?: string | null,"telefono"?: string | null
                  }
                  Update: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"correo"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"direccion"?: string | null,"erp_cliente_id"?: number | null,"id"?: never,"nombre"?: string,"notas"?: string | null,"telefono"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "clientes_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"complejidades": {
                  Row: {
                    "actualizado_en": string | null,"creado_en": string,"descripcion": string | null,"id": number,"nombre": string,"orden": number
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"creado_en"?: string,"descripcion"?: string | null,"id"?: never,"nombre": string,"orden": number
                  }
                  Update: {
                    "actualizado_en"?: string | null,"creado_en"?: string,"descripcion"?: string | null,"id"?: never,"nombre"?: string,"orden"?: number
                  }
                  Relationships: [
                    
                  ]
                },"especialidades": {
                  Row: {
                    "activo": boolean,"actualizado_en": string | null,"creado_en": string,"id": number,"nombre": string
                  }
                  Insert: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"creado_en"?: string,"id"?: never,"nombre": string
                  }
                  Update: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"creado_en"?: string,"id"?: never,"nombre"?: string
                  }
                  Relationships: [
                    
                  ]
                },"joyeros": {
                  Row: {
                    "activo": boolean,"actualizado_en": string | null,"capacidad_maxima": number,"correo": string | null,"creado_en": string,"creado_por": number | null,"documento": string | null,"id": number,"nombre": string,"notas": string | null,"telefono": string | null,"usuario_id": number | null
                  }
                  Insert: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"capacidad_maxima"?: number,"correo"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"documento"?: string | null,"id"?: never,"nombre": string,"notas"?: string | null,"telefono"?: string | null,"usuario_id"?: number | null
                  }
                  Update: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"capacidad_maxima"?: number,"correo"?: string | null,"creado_en"?: string,"creado_por"?: number | null,"documento"?: string | null,"id"?: never,"nombre"?: string,"notas"?: string | null,"telefono"?: string | null,"usuario_id"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "joyeros_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "joyeros_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: true
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"joyeros_especialidades": {
                  Row: {
                    "especialidad_id": number,"joyero_id": number
                  }
                  Insert: {
                    "especialidad_id": number,"joyero_id": number
                  }
                  Update: {
                    "especialidad_id"?: number,"joyero_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "joyeros_especialidades_especialidad_id_fkey"
      columns: ["especialidad_id"]
isOneToOne: false
      referencedRelation: "especialidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "joyeros_especialidades_joyero_id_fkey"
      columns: ["joyero_id"]
isOneToOne: false
      referencedRelation: "joyeros"
      referencedColumns: ["id"]
    }
                  ]
                },"parametros": {
                  Row: {
                    "actualizado_en": string | null,"clave": string,"descripcion": string | null,"grupo": string,"id": number,"tipo_dato": string,"valor": string
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"clave": string,"descripcion"?: string | null,"grupo"?: string,"id"?: never,"tipo_dato": string,"valor": string
                  }
                  Update: {
                    "actualizado_en"?: string | null,"clave"?: string,"descripcion"?: string | null,"grupo"?: string,"id"?: never,"tipo_dato"?: string,"valor"?: string
                  }
                  Relationships: [
                    
                  ]
                },"sesiones": {
                  Row: {
                    "creado_en": string,"expira_en": string,"id": number,"token_hash": string,"ultima_actividad": string,"user_agent": string | null,"usuario_id": number
                  }
                  Insert: {
                    "creado_en"?: string,"expira_en": string,"id"?: never,"token_hash": string,"ultima_actividad"?: string,"user_agent"?: string | null,"usuario_id": number
                  }
                  Update: {
                    "creado_en"?: string,"expira_en"?: string,"id"?: never,"token_hash"?: string,"ultima_actividad"?: string,"user_agent"?: string | null,"usuario_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "sesiones_usuario_id_fkey"
      columns: ["usuario_id"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    }
                  ]
                },"tarifas_joyero": {
                  Row: {
                    "activo": boolean,"actualizado_en": string | null,"complejidad_id": number | null,"costo_acordado": number,"creado_en": string,"creado_por": number | null,"id": number,"joyero_id": number,"tipo_trabajo_id": number,"vigente_desde": string
                  }
                  Insert: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"complejidad_id"?: number | null,"costo_acordado": number,"creado_en"?: string,"creado_por"?: number | null,"id"?: never,"joyero_id": number,"tipo_trabajo_id": number,"vigente_desde"?: string
                  }
                  Update: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"complejidad_id"?: number | null,"costo_acordado"?: number,"creado_en"?: string,"creado_por"?: number | null,"id"?: never,"joyero_id"?: number,"tipo_trabajo_id"?: number,"vigente_desde"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tarifas_joyero_complejidad_id_fkey"
      columns: ["complejidad_id"]
isOneToOne: false
      referencedRelation: "complejidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tarifas_joyero_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tarifas_joyero_joyero_id_fkey"
      columns: ["joyero_id"]
isOneToOne: false
      referencedRelation: "joyeros"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tarifas_joyero_tipo_trabajo_id_fkey"
      columns: ["tipo_trabajo_id"]
isOneToOne: false
      referencedRelation: "tipos_trabajo"
      referencedColumns: ["id"]
    }
                  ]
                },"tiempos_estandar": {
                  Row: {
                    "actualizado_en": string | null,"complejidad_id": number,"creado_en": string,"dias_habiles": number,"id": number,"tipo_trabajo_id": number
                  }
                  Insert: {
                    "actualizado_en"?: string | null,"complejidad_id": number,"creado_en"?: string,"dias_habiles": number,"id"?: never,"tipo_trabajo_id": number
                  }
                  Update: {
                    "actualizado_en"?: string | null,"complejidad_id"?: number,"creado_en"?: string,"dias_habiles"?: number,"id"?: never,"tipo_trabajo_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "tiempos_estandar_complejidad_id_fkey"
      columns: ["complejidad_id"]
isOneToOne: false
      referencedRelation: "complejidades"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tiempos_estandar_tipo_trabajo_id_fkey"
      columns: ["tipo_trabajo_id"]
isOneToOne: false
      referencedRelation: "tipos_trabajo"
      referencedColumns: ["id"]
    }
                  ]
                },"tipos_trabajo": {
                  Row: {
                    "activo": boolean,"actualizado_en": string | null,"categoria": Database["joyeria"]['Enums']["categoria_trabajo"],"creado_en": string,"creado_por": number | null,"descripcion": string | null,"especialidad_id": number | null,"id": number,"nombre": string
                  }
                  Insert: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"categoria": Database["joyeria"]['Enums']["categoria_trabajo"],"creado_en"?: string,"creado_por"?: number | null,"descripcion"?: string | null,"especialidad_id"?: number | null,"id"?: never,"nombre": string
                  }
                  Update: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"categoria"?: Database["joyeria"]['Enums']["categoria_trabajo"],"creado_en"?: string,"creado_por"?: number | null,"descripcion"?: string | null,"especialidad_id"?: number | null,"id"?: never,"nombre"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tipos_trabajo_creado_por_fkey"
      columns: ["creado_por"]
isOneToOne: false
      referencedRelation: "usuarios"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tipos_trabajo_especialidad_id_fkey"
      columns: ["especialidad_id"]
isOneToOne: false
      referencedRelation: "especialidades"
      referencedColumns: ["id"]
    }
                  ]
                },"usuarios": {
                  Row: {
                    "activo": boolean,"actualizado_en": string | null,"contrasena_hash": string,"correo": string,"creado_en": string,"id": number,"nombre": string,"rol": Database["joyeria"]['Enums']["rol_usuario"],"telefono": string | null,"ultimo_acceso": string | null
                  }
                  Insert: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"contrasena_hash": string,"correo": string,"creado_en"?: string,"id"?: never,"nombre": string,"rol"?: Database["joyeria"]['Enums']["rol_usuario"],"telefono"?: string | null,"ultimo_acceso"?: string | null
                  }
                  Update: {
                    "activo"?: boolean,"actualizado_en"?: string | null,"contrasena_hash"?: string,"correo"?: string,"creado_en"?: string,"id"?: never,"nombre"?: string,"rol"?: Database["joyeria"]['Enums']["rol_usuario"],"telefono"?: string | null,"ultimo_acceso"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "fn_purgar_sesiones":
{ Args: Record<PropertyKey, never>; Returns: number
                           }
          }
          Enums: {
            "categoria_trabajo": "reparacion"|"creacion","rol_usuario": "admin"|"taller"|"joyero"|"gerencia"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "joyeria": {
          Enums: {
            "categoria_trabajo": ["reparacion", "creacion"],"rol_usuario": ["admin", "taller", "joyero", "gerencia"]
          }
        }
} as const
